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
  const blocks = topLevelDetailsBlocks(body).map(stripNestedDetails);
  return rows.map((row, i) => ({ ...row, stages: (blocks[i] ?? "").split("\n").map(parseStageLine).filter(Boolean) }));
}

export function parseComment(body) {
  if (!body) return null;
  const title = /^###\s+Branch Deploy\s+—\s+(.+)$/m.exec(body);
  return { name: "Branch deploy", summary: title?.[1]?.trim() ?? "", targets: parseTargets(body) };
}
