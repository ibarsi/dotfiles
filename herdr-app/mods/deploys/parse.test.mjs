// node --test herdr-app/mods/deploys/parse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseComment, isUnhealthy } from "./parse.js";

// A real `gh pr view <n> --json comments` body (PR 5598, trimmed of nothing):
// backtick-wrapped names, a nested "Recorded services" <details> inside
// platform's own <details open>, a blocking stage with a trailing annotation,
// a non-link ordinal-prefixed stage line, and a nested "Commands and labels"
// section with its own tables — the bug this file guards against leaked that
// section's "| Label | Effect |" rows in as two fake targets.
const COMMENT = `<!-- branch-deploy-status -->
### Branch Deploy — 🔄 1 of 2 targets progressing

Profile: \`emprise\`

| Target | Status | Waves | Images | Preview |
|---|---|---|---|---|
| \`platform\` | 🔄 Deploying infrastructure | wave 5 of 5 | main [\`9557cea\`](https://github.com/usemaximum/maximum/commit/9557cea3ca0ff00637d3adf18d4aec5d16756947) + 1 changed | — |
| \`docs\` | ✅ Healthy | 1 of 1 | main [\`9557cea\`](https://github.com/usemaximum/maximum/commit/9557cea3ca0ff00637d3adf18d4aec5d16756947) | [Docs](https://docs.5598.pr.dev.usemaximum.io) |

<details open><summary><code>platform</code> details</summary>

- 1. [\`mesh\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-us-gcp-e4-bnk-pr-5598-mesh?view=tree) (✅ Healthy)
- 2. [\`databases\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-us-gcp-e4-bnk-pr-5598-databases?view=tree) (✅ Healthy)
- 3. [\`infra\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-us-gcp-e4-bnk-pr-5598-infra?view=tree) (✅ Healthy)
- 4. \`platform\` (❔ Missing 0/72)
- 5. [\`ingress\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-us-gcp-e4-bnk-pr-5598-ingress?view=tree) (⏳ Unknown) ← blocking
- Vault OIDC (✅ Ready)

<details><summary>Recorded services (1)</summary>

- \`ui-admin\` — this PR, [\`932f002\`](https://github.com/usemaximum/maximum/commit/932f0023381af150ae510e1f4afd998c21284ace) (no matching workload)

</details>

[Deploy Logs](https://grafana.usemaximum.net/explore)

</details>

<details><summary><code>docs</code> details</summary>

- 1. [\`doc-external\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-us-gcp-e4-docs-pr-5598?view=tree) (✅ Healthy)

</details>

<details><summary>Commands and labels</summary>

| Command | Acts on | Description |
|---|---|---|
| \`/branch deploy\` | \`platform\`, \`docs\` | Redeploy with the latest changes |

| Label | Effect |
|---|---|
| \`deploy-no-pause\` | Keep every target running through the nightly pause |

</details>
`;

test("parses the title, strips backticks from target names, and ignores the legend tables", () => {
  const r = parseComment(COMMENT);
  assert.equal(r.name, "Branch deploy");
  assert.equal(r.summary, "🔄 1 of 2 targets progressing");
  assert.equal(r.targets.length, 2);
  assert.equal(r.targets[0].name, "platform");
  assert.equal(r.targets[0].status, "Deploying infrastructure");
  assert.equal(r.targets[0].waves, "wave 5 of 5");
  assert.equal(r.targets[1].name, "docs");
  assert.deepEqual(r.targets[1].links, [{ label: "Docs", url: "https://docs.5598.pr.dev.usemaximum.io" }]);
});

test("a target with no preview links parses to an empty array", () => {
  assert.deepEqual(parseComment(COMMENT).targets[0].links, []);
});

test("parses stage links with their ArgoCD app and server", () => {
  const [mesh] = parseComment(COMMENT).targets[0].stages;
  assert.deepEqual(mesh, { name: "mesh", status: "Healthy", app: "max1-dev-us-gcp-e4-bnk-pr-5598-mesh", server: "argocd.dev.usemaximum.net" });
});

test("a trailing annotation after the status (e.g. '← blocking') doesn't drop the stage", () => {
  const ingress = parseComment(COMMENT).targets[0].stages.find((s) => s.name === "ingress");
  assert.equal(ingress.status, "Unknown");
  assert.equal(ingress.app, "max1-dev-us-gcp-e4-bnk-pr-5598-ingress");
});

test("an ordinal-prefixed, backtick-wrapped, linkless stage line parses cleanly", () => {
  const platformStage = parseComment(COMMENT).targets[0].stages.find((s) => s.app === null && s.name === "platform");
  assert.equal(platformStage.status, "Missing 0/72");
});

test("a non-link extra line (Vault OIDC) parses with no app/server", () => {
  const vault = parseComment(COMMENT).targets[0].stages.find((s) => s.name === "Vault OIDC");
  assert.deepEqual(vault, { name: "Vault OIDC", status: "Ready", app: null, server: null });
});

test("the nested Recorded-services details and legend tables leak nothing into stages or targets", () => {
  const r = parseComment(COMMENT);
  assert.equal(r.targets.length, 2);
  const names = r.targets[0].stages.map((s) => s.name);
  assert.ok(!names.includes("ui-admin"));
  assert.ok(!names.some((n) => n.includes("Label") || n.includes("deploy-no-pause")));
});

test("docs' own stage list isn't contaminated by platform's nested details", () => {
  const docs = parseComment(COMMENT).targets[1];
  assert.equal(docs.stages.length, 1);
  assert.equal(docs.stages[0].name, "doc-external");
});

test("isUnhealthy treats unknown status words as unhealthy", () => {
  assert.equal(isUnhealthy("Healthy"), false);
  assert.equal(isUnhealthy("Ready"), false);
  assert.equal(isUnhealthy("Torn down"), false);
  assert.equal(isUnhealthy("Degraded"), true);
  assert.equal(isUnhealthy("Unknown"), true);
});

test("a target with no <details> at all (torn down) gets an empty stage list", () => {
  const body = `<!-- branch-deploy-status -->
### Branch Deploy — 🗑️ 2 of 2 targets torn down

| Target | Status | Waves | Images | Preview |
|---|---|---|---|---|
| \`platform\` | 🗑️ Torn down | — | main [\`f5d18bb\`](https://github.com/usemaximum/maximum/commit/f5d18bb) + 22 changed | — |
| \`docs\` | 🗑️ Torn down | — | this PR [\`0fcd99c\`](https://github.com/usemaximum/maximum/commit/0fcd99c) | — |
`;
  const r = parseComment(body);
  assert.equal(r.targets.length, 2);
  assert.deepEqual(r.targets[0].stages, []);
  assert.deepEqual(r.targets[1].stages, []);
});

test("no comment parses to null", () => {
  assert.equal(parseComment(null), null);
  assert.equal(parseComment(""), null);
});
