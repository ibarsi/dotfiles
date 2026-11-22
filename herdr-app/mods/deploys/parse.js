// Parses the `<!-- branch-deploy-status -->` bot comment (see gh/aliases.yml's `bd`
// alias) into a source-neutral shape a panel can render without knowing where it
// came from:
//   { name, summary, targets: [{ name, status, waves, links, stages }] }
//   stages: [{ name, status, app, server }]
// No imports, so it runs in the mod and under `node --test`.

const HEALTHY = new Set(["Healthy", "Ready", "Torn down"]);
export const isUnhealthy = (status) => !HEALTHY.has(status);
// Failed, not merely unhealthy: Progressing, Missing (a stage not created yet
// mid-deploy, "Missing 0/72") and Unknown are still settling, not broken.
export const isFailed = (status) => /degraded|fail|error|timed out/i.test(status ?? "");

const cleanStatus = (s) => s.replace(/^[^\p{L}]+/u, "").trim();
const stripBackticks = (s) => s.replace(/^`(.*)`$/, "$1");

function parseLinks(cell) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(cell))) out.push({ label: m[1], url: m[2] });
  return out;
}

function parseStageLine(line) {
  // A trailing annotation (the bot adds "← blocking" to the stage holding up
  // the rest) can follow the status parens, so this doesn't anchor on $.
  let m = /^-\s*(?:\d+\.\s*)?\[`([^`]+)`\]\(([^)]+)\)\s*\(([^)]+)\)/.exec(line);
  if (m) {
    const [, name, url, status] = m;
    const app = /https?:\/\/([^/]+)\/applications\/[^/]+\/([^/?#]+)/.exec(url);
    return { name, status: cleanStatus(status), app: app?.[2] ?? null, server: app?.[1] ?? null };
  }
  m = /^-\s*(?:\d+\.\s*)?([^[\n]+?)\s*\(([^)]+)\)/.exec(line);
  if (m) return { name: stripBackticks(m[1].trim()), status: cleanStatus(m[2]), app: null, server: null };
  return null;
}

// Depth-aware: a target's own <details> (its stage list) nests a second
// <details> (the "Recorded services" list, 30+ entries the panel ignores),
// and a naive non-greedy match would stop at that inner block's close.
function topLevelDetailsBlocks(body) {
  const tag = /<details[^>]*>|<\/details>/g;
  const blocks = [];
  let depth = 0, start = null, m;
  while ((m = tag.exec(body))) {
    if (m[0].startsWith("<details")) {
      if (depth === 0) start = tag.lastIndex;
      depth++;
    } else if (depth > 0) {
      depth--;
      if (depth === 0 && start !== null) { blocks.push(body.slice(start, m.index)); start = null; }
    }
  }
  return blocks;
}

const stripNestedDetails = (s) => s.replace(/<details[^>]*>[\s\S]*?<\/details>/g, "");

function parseTargets(body) {
  const rows = [];
  // [^|\n] (not [^|]): a bare negated class matches newlines too, which let
  // this glue unrelated lines together into fake 5-column rows — a later
  // "| Label | Effect |" legend table parsed as two bogus deploy targets.
  const tableRow = /^\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*$/gm;
  let m;
  while ((m = tableRow.exec(body))) {
    const [, name, status, waves, , preview] = m;
    if (name === "Target" || /^:?-+:?$/.test(name)) continue;
    rows.push({ name: stripBackticks(name), status: cleanStatus(status), waves: waves.trim(), links: preview.trim() === "—" ? [] : parseLinks(preview) });
  }
  const raw = topLevelDetailsBlocks(body);
  const blocks = raw.map(stripNestedDetails);
  return rows.map((row, i) => ({ ...row, stages: (blocks[i] ?? "").split("\n").map(parseStageLine).filter(Boolean), issues: parseIssues(raw[i] ?? "") }));
}

// The nested "Recorded services" list flags a service whose live pods run a
// different image than the one recorded with a leading ⚠️; the rest of that
// list is noise for the panel.
function parseIssues(block) {
  return block.split("\n")
    .map((l) => /^-\s*⚠️\s*(.+)$/.exec(l)?.[1])
    .filter(Boolean)
    .map((t) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replaceAll("`", ""));
}

export function parseComment(body) {
  if (!body) return null;
  const title = /^###\s+Branch Deploy\s+—\s+(.+)$/m.exec(body);
  return { name: "Branch deploy", summary: title?.[1]?.trim() ?? "", targets: parseTargets(body) };
}

// `kubectl get applications -o custom-columns=N:..,H:..,S:..` (no headers) -> { name: { health, sync } }.
export function parseApps(stdout) {
  return Object.fromEntries(stdout.split("\n").map((l) => l.trim().split(/\s+/)).filter((c) => c[0] && c.length >= 3).map(([n, h, s]) => [n, { health: h, sync: s }]));
}

// The bot comment only updates when the deploy workflow writes it, so a sync
// that failed its retries stays "Sync failed" after ArgoCD converges on its
// own. ArgoCD is the truth: stage health always follows it, and a failed
// target whose apps are all Synced and Healthy is shown Healthy, with the
// comment's claim kept in `note`.
export function reconcileLive(target, apps, parentApp) {
  const live = (app) => (app ? apps[app] : undefined);
  for (const s of target.stages) if (live(s.app)) s.status = live(s.app).health;
  const watched = [parentApp, ...target.stages.map((s) => s.app)].filter(Boolean);
  const converged = watched.length > 0 && target.stages.every((s) => s.app || !isUnhealthy(s.status)) && watched.every((a) => live(a)?.health === "Healthy" && live(a)?.sync === "Synced");
  if (isFailed(target.status) && converged) {
    target.note = `Bot comment says "${target.status}", but ArgoCD is Synced and Healthy`;
    target.status = "Healthy";
  }
}
