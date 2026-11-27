// Pure logic for the reopen popup: no imports, so `node --test` runs it.
// main.js runs MACHINE_SCRIPT on each machine; parseMachine turns its
// records (one per line, TAB-separated, see the plan's record table) into
// stopped, interactive sessions. Fields come from regexes, not JSON.parse,
// because the script cuts long lines.

const PER_TOOL = 100;

function field(line, name) {
  const m = line.match(new RegExp(`"${name}":"((?:[^"\\\\]|\\\\.)*)`));
  if (!m) return null;
  try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
}

const base = (dir) => dir.replace(/\/+$/, "").split("/").pop() || dir;

function title(text, cwd) {
  const t = (text || "").trim();
  if (!t || t.startsWith("<") || t.startsWith("#") || t.startsWith("/")) return base(cwd);
  const one = t.split("\n")[0];
  return one.length > 80 ? `${one.slice(0, 79)}…` : one;
}

function claudeText(line) {
  const m = line.match(/"content":"((?:[^"\\]|\\.)*)/);
  if (m) return field(line, "content");
  return field(line, "text");
}

export function parseMachine(stdout, machine) {
  let boot = null;
  const live = new Set(), open = new Set(), names = new Map(), tuiCwds = [];
  const claude = [], codex = [], history = [], dbs = new Map();
  let lastConv = {};
  for (const raw of stdout.split("\n")) {
    const [kind, ...f] = raw.split("\t");
    if (kind === "B") boot = Number(f[0]) * 1000 || null;
    else if (kind === "L") live.add(f[0]);
    else if (kind === "O") open.add(f[0]);
    else if (kind === "P") tuiCwds.push(f[0]);
    else if (kind === "N") { const id = field(f[0] || "", "id"); if (id) names.set(id, field(f[0], "thread_name")); }
    else if (kind === "G") { try { lastConv = JSON.parse(f.join("\t")); } catch { /* ignore a bad cache */ } }
    else if (kind === "C") claude.push(f);
    else if (kind === "X") codex.push(f);
    else if (kind === "H") { try { history.push(JSON.parse(f.join("\t"))); } catch { /* cut line */ } }
    else if (kind === "D") dbs.set(f[1], Number(f[0]) * 1000);
  }

  const out = [];
  const at = (s) => Number(s) * 1000;

  for (const [mtime, path, line = ""] of claude) {
    const id = base(path).replace(/\.jsonl$/, "");
    const cwd = field(line, "cwd");
    if (!cwd || field(line, "entrypoint") !== "cli" || live.has(id)) continue;
    out.push({ tool: "claude", id, cwd, title: title(claudeText(line), cwd), stoppedAt: at(mtime), machine });
  }

  const cx = [];
  for (const [mtime, , line1 = "", user = ""] of codex) {
    const id = field(line1, "id");
    const cwd = field(line1, "cwd");
    const source = field(line1, "source");
    if (!id || !cwd || field(line1, "originator") !== "codex-tui" || source === "vscode" || source === "exec") continue;
    cx.push({ tool: "codex", id, cwd, title: names.get(id) || title(field(user, "message"), cwd), stoppedAt: at(mtime), machine });
  }
  // ponytail: the app-server daemon keeps rollouts open after the TUI quits, so a
  // running Codex is "the newest session in a folder with a live TUI". Wrong when
  // two TUIs share a folder and the newer one quit; Codex stores nothing more exact.
  cx.sort((a, b) => b.stoppedAt - a.stoppedAt);
  const running = new Map();
  for (const c of tuiCwds) running.set(c, (running.get(c) || 0) + 1);
  for (const s of cx) {
    const n = running.get(s.cwd) || 0;
    if (n > 0) { running.set(s.cwd, n - 1); continue; }
    out.push(s);
  }

  out.push(...antigravity(history, dbs, open, lastConv, machine));

  out.sort((a, b) => b.stoppedAt - a.stoppedAt);
  const count = {};
  return { boot, sessions: out.filter((s) => (count[s.tool] = (count[s.tool] || 0) + 1) <= PER_TOOL) };
}

function antigravity(history, dbs, open, lastConv, machine) {
  const byId = new Map();
  for (const h of history) {
    if (!h.conversationId) continue;
    const e = byId.get(h.conversationId) || { lines: [] };
    e.lines.push(h);
    byId.set(h.conversationId, e);
  }
  const folderOf = new Map(Object.entries(lastConv).map(([dir, id]) => [id, dir]));
  const ids = dbs.keys(); // no .db file: nothing to resume
  const out = [];
  for (const id of ids) {
    if ([...open].some((p) => p.endsWith(`/${id}.db`))) continue;
    const lines = byId.get(id)?.lines || [];
    const cwd = lines[0]?.workspace || folderOf.get(id);
    if (!cwd) continue;
    const times = lines.map((h) => h.timestamp);
    const stoppedAt = dbs.get(id);
    let text = lines.find((h) => h.display && !h.display.startsWith("/"))?.display;
    if (!text && times.length) {
      // New prompt lines carry no conversationId: take the first one in this folder
      // after the previous conversation's last line and before this one's last line.
      const first = Math.min(...times), last = Math.max(...times);
      const before = history.filter((h) => h.workspace === cwd && h.conversationId && h.conversationId !== id && h.timestamp < first);
      const from = before.length ? Math.max(...before.map((h) => h.timestamp)) : -Infinity;
      text = history.find((h) => h.workspace === cwd && !h.conversationId && h.timestamp > from && h.timestamp <= last
        && h.display && !h.display.startsWith("/"))?.display;
    }
    out.push({ tool: "agy", id, cwd, title: title(text, cwd), stoppedAt, machine });
  }
  return out;
}

export function resumeArgv(s) {
  if (s.tool === "claude") return ["claude", "--resume", s.id];
  if (s.tool === "codex") return ["codex", "resume", s.id];
  return ["agy", "--conversation", s.id];
}

const DAY = 86400e3;
const AGENT_NAMES = { claude: "claude-code", codex: "codex", agy: "antigravity" };

const under = (dir, parent) => dir === parent || dir.startsWith(parent.replace(/\/+$/, "") + "/");

// The space a session belongs to, on its own machine only: a tab whose live
// terminal is in that folder, else a space with that folder, else the space
// with the longest parent folder.
export function matchSpace(s, spaces, panes) {
  const mine = spaces.filter((w) => (w.machine ?? null) === (s.machine ?? null));
  const tabSpace = new Map();
  for (const w of mine) for (const tb of w.tabs || []) tabSpace.set(tb.id, w);
  const live = panes.find((p) => p.cwd === s.cwd && tabSpace.has(p.tab));
  if (live) return tabSpace.get(live.tab);
  let best = null;
  for (const w of mine) {
    if (!w.folder || !under(s.cwd, w.folder)) continue;
    if (!best || w.folder.length > best.folder.length) best = w;
  }
  return best;
}

export function buildRows(results, spaces, panes, finished, now) {
  const rows = [], errors = [];
  for (const r of results) {
    if (r.error) { errors.push({ machine: r.machine, error: r.error }); continue; }
    const { boot, sessions } = parseMachine(r.stdout || "", r.machine);
    for (const s of sessions) {
      if (now - s.stoppedAt > 7 * DAY) continue;
      const group = boot && s.stoppedAt < boot && boot - s.stoppedAt < DAY ? "restart" : "recent";
      const where = finished.find((t) => t.cwd === s.cwd && t.agent === AGENT_NAMES[s.tool]
        && (t.address.includes("/") ? t.address.split("/")[0] : null) === s.machine)?.where ?? null;
      rows.push({ ...s, group, space: matchSpace(s, spaces, panes), where });
    }
  }
  rows.sort((a, b) => (a.group === b.group ? b.stoppedAt - a.stoppedAt : a.group === "restart" ? -1 : 1));
  return { rows, errors };
}

export function filterRows(rows, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter((r) => {
    const hay = [r.title, r.cwd, r.space?.name, r.tool].filter(Boolean).join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function ago(ms, now) {
  const s = (now - ms) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
