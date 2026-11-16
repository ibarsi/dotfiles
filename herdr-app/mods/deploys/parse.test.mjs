// node --test herdr-app/mods/deploys/parse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseComment, isUnhealthy } from "./parse.js";

const COMMENT = `<!-- branch-deploy-status -->
### Branch Deploy — ✅ 1 of 2 targets healthy

| Target | Status | Waves | Images | Preview |
| --- | --- | --- | --- | --- |
| platform | ✅ Healthy | 5 of 5 | 3 images | [Console](https://console.example.com) · [Admin](https://admin.example.com) |
| docs | 🗑️ Torn down | 0 of 0 | — | — |

<details>
<summary>platform stages</summary>

- 1. [\`mesh\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-pr-5303-mesh?view=tree) (✅ Healthy)
- 2. [\`ingress\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-pr-5303-ingress?view=tree) (▼ Degraded)
- Vault OIDC (✅ Ready)

</details>

<details>
<summary>docs stages</summary>

- 1. [\`infra\`](https://argocd.dev.usemaximum.net/applications/sys-argocd/max1-dev-pr-5303-infra?view=tree) (🗑️ Torn down)

</details>

- … → some recorded-services line the panel ignores
`;

test("parses the title and target table", () => {
  const r = parseComment(COMMENT);
  assert.equal(r.name, "Branch deploy");
  assert.equal(r.summary, "✅ 1 of 2 targets healthy");
  assert.equal(r.targets.length, 2);
  assert.equal(r.targets[0].name, "platform");
  assert.equal(r.targets[0].status, "Healthy");
  assert.equal(r.targets[0].waves, "5 of 5");
  assert.deepEqual(r.targets[0].links, [
    { label: "Console", url: "https://console.example.com" },
    { label: "Admin", url: "https://admin.example.com" },
  ]);
});

test("a target with no preview links parses to an empty array", () => {
  assert.deepEqual(parseComment(COMMENT).targets[1].links, []);
});

test("parses stage links with their ArgoCD app and server, and extra non-link lines", () => {
  const [mesh, ingress, vault] = parseComment(COMMENT).targets[0].stages;
  assert.deepEqual(mesh, { name: "mesh", status: "Healthy", app: "max1-dev-pr-5303-mesh", server: "argocd.dev.usemaximum.net" });
  assert.equal(ingress.status, "Degraded");
  assert.deepEqual(vault, { name: "Vault OIDC", status: "Ready", app: null, server: null });
});

test("isUnhealthy treats unknown status words as unhealthy", () => {
  assert.equal(isUnhealthy("Healthy"), false);
  assert.equal(isUnhealthy("Ready"), false);
  assert.equal(isUnhealthy("Torn down"), false);
  assert.equal(isUnhealthy("Degraded"), true);
  assert.equal(isUnhealthy("SomeNewWord"), true);
});

test("no comment parses to null", () => {
  assert.equal(parseComment(null), null);
  assert.equal(parseComment(""), null);
});
