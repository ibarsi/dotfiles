// Parses the `<!-- branch-deploy-status -->` bot comment (see gh/aliases.yml's `bd`
// alias) into a source-neutral shape a panel can render without knowing where it
// came from:
//   { name, summary, targets: [{ name, status, waves, links, stages }] }
//   stages: [{ name, status, app, server }]
// No imports, so it runs in the mod and under `node --test`.

const HEALTHY = new Set(["Healthy", "Ready", "Torn down"]);
export const isUnhealthy = (status) => !HEALTHY.has(status);

const cleanStatus = (s) => s.replace(/^[^\p{L}]+/u, "").trim();

function parseLinks(cell) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(cell))) out.push({ label: m[1], url: m[2] });
  return out;
}

function parseStageLine(line) {
  let m = /^-\s*(?:\d+\.\s*)?\[`([^`]+)`\]\(([^)]+)\)\s*\(([^)]+)\)\s*$/.exec(line);
  if (m) {
    const [, name, url, status] = m;
    const app = /https?:\/\/([^/]+)\/applications\/[^/]+\/([^/?#]+)/.exec(url);
    return { name, status: cleanStatus(status), app: app?.[2] ?? null, server: app?.[1] ?? null };
  }
  m = /^-\s*([^[\n]+?)\s*\(([^)]+)\)\s*$/.exec(line);
  if (m) return { name: m[1].trim(), status: cleanStatus(m[2]), app: null, server: null };
  return null;
}

function parseTargets(body) {
  const rows = [];
  const tableRow = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;
  let m;
  while ((m = tableRow.exec(body))) {
    const [, name, status, waves, , preview] = m;
    if (name === "Target" || /^:?-+:?$/.test(name)) continue;
    rows.push({ name, status: cleanStatus(status), waves: waves.trim(), links: preview.trim() === "—" ? [] : parseLinks(preview) });
  }
  const blocks = [];
  const details = /<details>([\s\S]*?)<\/details>/g;
  while ((m = details.exec(body))) blocks.push(m[1]);
  return rows.map((row, i) => ({ ...row, stages: (blocks[i] ?? "").split("\n").map(parseStageLine).filter(Boolean) }));
}

export function parseComment(body) {
  if (!body) return null;
  const title = /^###\s+Branch Deploy\s+—\s+(.+)$/m.exec(body);
  return { name: "Branch deploy", summary: title?.[1]?.trim() ?? "", targets: parseTargets(body) };
}
