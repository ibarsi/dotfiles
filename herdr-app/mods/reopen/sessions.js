// Pure logic for the reopen popup: no imports, so `node --test` runs it.
// main.js runs MACHINE_SCRIPT on each machine; parseMachine turns its
// records (one per line, TAB-separated, see the plan's record table) into
// stopped, interactive sessions. Fields come from regexes, not JSON.parse,
// because the script cuts long lines.

const PER_TOOL = 100;

// Prints the records parseMachine reads, for $HOME on the machine it runs on.
// POSIX sh with standard tools only: Omen has no lsof, so Linux reads /proc.
// Long JSON lines are reduced to grep -o fragments, never cut: Claude puts cwd
// and entrypoint after the message, which can be megabytes.
export const MACHINE_SCRIPT = String.raw`
cd "$HOME" 2>/dev/null || exit 0
T=$(printf '\t')
if stat -c %Y / >/dev/null 2>&1; then mt() { stat -c %Y "$1"; }; else mt() { stat -f %m "$1"; }; fi
newest() { while IFS= read -r f; do printf '%s\t%s\n' "$(mt "$f")" "$f"; done | sort -rn | head -n 100; }
b=$(sysctl -n kern.boottime 2>/dev/null | sed -n 's/.*{ sec = \([0-9]*\).*/\1/p')
[ -n "$b" ] || b=$(awk '/^btime/ {print $2}' /proc/stat 2>/dev/null)
printf 'B\t%s\n' "$b"
if [ -d .claude/projects ]; then
  find .claude/projects -mindepth 2 -maxdepth 2 -name '*.jsonl' -mtime -7 | newest | while IFS="$T" read -r m f; do
    l=$(grep -m1 '"type":"user"' "$f" | grep -o -E '"(cwd|entrypoint|sessionId)":"[^"]*"|"(content|text)":"([^"\\]|\\.){0,200}' | tr -d '\t' | tr '\n' ' ')
    printf 'C\t%s\t%s\t%s\n' "$m" "$f" "$l"
  done
fi
for f in .claude/sessions/*.json; do
  [ -e "$f" ] || continue
  ps -p "$(basename "$f" .json)" >/dev/null 2>&1 && grep -o '"sessionId":"[^"]*"' "$f" | sed 's/.*:"//; s/"$//' | awk '{print "L\t" $0}'
done
if [ -d .codex/sessions ]; then
  find .codex/sessions -name 'rollout-*.jsonl' -mtime -7 | newest | while IFS="$T" read -r m f; do
    l=$(head -n 1 "$f" | grep -o -E '"(id|cwd|originator|source)":"[^"]*"' | tr '\n' ' ')
    u=$(grep -m1 '"user_message"' "$f" | grep -o -E '"message":"([^"\\]|\\.){0,200}' | head -n 1 | tr -d '\t')
    printf 'X\t%s\t%s\t%s\t%s\n' "$m" "$f" "$l" "$u"
  done
fi
[ -f .codex/session_index.jsonl ] && tail -n 500 .codex/session_index.jsonl | tr -d '\t' | awk '{print "N\t" $0}'
ps -axo pid=,args= 2>/dev/null | awk '{n = $2; sub(/.*\//, "", n); if (n == "codex" && $3 != "app-server") print $1}' | while read -r p; do
  c=$(readlink "/proc/$p/cwd" 2>/dev/null || lsof -a -p "$p" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
  [ -n "$c" ] && printf 'P\t%s\n' "$c"
done
A=.gemini/antigravity-cli
[ -f $A/history.jsonl ] && tail -n 2000 $A/history.jsonl | tr -d '\t' | awk '{print "H\t" $0}'
command -v sqlite3 >/dev/null && [ -f $A/conversation_summaries.db ] && sqlite3 -readonly -separator "$T" $A/conversation_summaries.db "select conversation_id, replace(replace(title, char(9), ' '), char(10), ' '), workspace_uris from conversation_summaries where last_modified_time > datetime('now', '-8 days')" 2>/dev/null | awk '{print "S\t" $0}'
[ -f $A/cache/last_conversations.json ] && printf 'G\t%s\n' "$(tr -d '\n\t' < $A/cache/last_conversations.json)"
if [ -d $A/conversations ]; then
  find $A/conversations -name '*.db' -mtime -7 | newest | while IFS="$T" read -r m f; do
    printf 'D\t%s\t%s\n' "$m" "$(basename "$f" .db)"
  done
  if [ -d /proc/self/fd ]; then
    find /proc -mindepth 3 -maxdepth 3 -path '/proc/[0-9]*/fd/*' -lname '*antigravity-cli/conversations/*.db' -printf '%l\n' 2>/dev/null
  else
    lsof -nP -Fn -- $A/conversations/*.db 2>/dev/null | sed -n 's/^n//p'
  fi | sort -u | awk '{print "O\t" $0}'
fi
exit 0
`;

function field(line, name) {
  const m = line.match(new RegExp(`"${name}":"((?:[^"\\\\]|\\\\.)*)`));
  if (!m) return null;
  try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
}

const base = (dir) => dir.replace(/\/+$/, "").split("/").pop() || dir;

function title(text, cwd) {
  const t = (text || "").trim();
  const cmd = t.match(/<command-name>([^<]+)<\/command-name>/);
  if (cmd) return cmd[1];
  if (!t || t.startsWith("<") || t.startsWith("#") || t.startsWith("/")) return base(cwd);
  const one = t.split("\n")[0].replace(/\s+/g, " ").trim();
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
  const claude = [], codex = [], history = [], dbs = new Map(), summaries = new Map();
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
    else if (kind === "S") summaries.set(f[0], { title: f[1], uri: (f[2] || "").match(/"file:\/\/([^"]+)"/)?.[1] });
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
    // Not `source`: Codex TUIs in a terminal report "vscode" too (seen on 0.172).
    if (!id || !cwd || field(line1, "originator") !== "codex-tui") continue;
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

  out.push(...antigravity(history, dbs, open, lastConv, summaries, machine));

  out.sort((a, b) => b.stoppedAt - a.stoppedAt);
  const count = {};
  return { boot, sessions: out.filter((s) => (count[s.tool] = (count[s.tool] || 0) + 1) <= PER_TOOL) };
}

function antigravity(history, dbs, open, lastConv, summaries, machine) {
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
    const sum = summaries.get(id);
    let uri = null;
    try { uri = sum?.uri && decodeURIComponent(sum.uri); } catch { uri = sum.uri; }
    const cwd = uri || lines[0]?.workspace || folderOf.get(id);
    if (!cwd) continue;
    const times = lines.map((h) => h.timestamp);
    const stoppedAt = dbs.get(id);
    let text = sum?.title || lines.find((h) => h.display && !h.display.startsWith("/"))?.display;
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
