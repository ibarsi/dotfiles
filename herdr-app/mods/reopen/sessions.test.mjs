import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMachine, resumeArgv, matchSpace, buildRows, filterRows, ago, MACHINE_SCRIPT } from "./sessions.js";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const claude = (id, cwd, extra = {}) => JSON.stringify({ type: "user", entrypoint: "cli", cwd, sessionId: id,
  message: { role: "user", content: "fix the ledger replay" }, ...extra });

test("parses a claude session", () => {
  const out = `C\t1795700000\t/h/.claude/projects/-x/aaa.jsonl\t${claude("aaa", "/w/x")}\n`;
  const { sessions } = parseMachine(out, "omen");
  assert.deepEqual(sessions[0], { tool: "claude", id: "aaa", cwd: "/w/x", title: "fix the ledger replay", stoppedAt: 1795700000000, machine: "omen" });
});

test("parses a truncated claude line", () => {
  const line = claude("bbb", "/w/y").slice(0, 120);
  const { sessions } = parseMachine(`C\t1\t/p/bbb.jsonl\t${line}`, null);
  assert.equal(sessions[0].id, "bbb");
  assert.equal(sessions[0].cwd, "/w/y");
});

test("keeps factory children", () => {
  const { sessions } = parseMachine(`C\t1\t/p/f.jsonl\t${claude("f", "/wt/eng-1")}`, null);
  assert.equal(sessions.length, 1);
});

test("drops sdk claude sessions and live ones", () => {
  const out = [`C\t1\t/p/s.jsonl\t${claude("s", "/a", { entrypoint: "sdk-cli" })}`,
    `C\t1\t/p/l.jsonl\t${claude("l", "/a")}`, `L\tl`].join("\n");
  assert.equal(parseMachine(out, null).sessions.length, 0);
});

test("parses codex and drops exec and running ones", () => {
  const meta = (id, source, originator = "codex-tui") => JSON.stringify({ type: "session_meta", payload: { id, cwd: "/c", originator, source } });
  const user = JSON.stringify({ type: "event_msg", payload: { type: "user_message", message: "add a test" } });
  const out = [`X\t5\t/r/rollout-a.jsonl\t${meta("a", "cli")}\t${user}`,
    `X\t5\t/r/rollout-v.jsonl\t${meta("v", "exec", "codex_exec")}\t${user}`,
    `X\t6\t/r/rollout-o.jsonl\t${meta("o", "cli")}\t${user}`, `P\t/c`].join("\n"); // one TUI in /c: the newest (o) runs
  const { sessions } = parseMachine(out, null);
  assert.deepEqual(sessions.map((s) => [s.id, s.title]), [["a", "add a test"]]);
});

test("codex title prefers thread_name", () => {
  const meta = JSON.stringify({ type: "session_meta", payload: { id: "a", cwd: "/c", originator: "codex-tui", source: "cli" } });
  const out = [`X\t5\t/r/rollout-a.jsonl\t${meta}\t`, `N\t${JSON.stringify({ id: "a", thread_name: "Check the current time" })}`].join("\n");
  assert.equal(parseMachine(out, null).sessions[0].title, "Check the current time");
});

test("parses antigravity from history and db mtime", () => {
  const h = (ts, d) => `H\t${JSON.stringify({ display: d, timestamp: ts, workspace: "/g", conversationId: "g1" })}`;
  const out = [h(1000, "rename the column"), h(2000, "/exit"), `D\t9\tg1`].join("\n");
  const { sessions } = parseMachine(out, null);
  assert.deepEqual(sessions[0], { tool: "agy", id: "g1", cwd: "/g", title: "rename the column", stoppedAt: 9000, machine: null });
});

test("antigravity prompts without an id still give the title, and open dbs are running", () => {
  const out = [
    `H\t${JSON.stringify({ display: "old", timestamp: 100, workspace: "/g", conversationId: "g0" })}`,
    `H\t${JSON.stringify({ display: "what time is it", timestamp: 200, workspace: "/g" })}`,
    `H\t${JSON.stringify({ display: "/exit", timestamp: 300, workspace: "/g", conversationId: "g1", type: "slash_command" })}`,
    `D\t9\tg1`, `D\t9\tg2`, `O\t/h/.gemini/antigravity-cli/conversations/g2.db`,
    `G\t${JSON.stringify({ "/z": "g2" })}`,
  ].join("\n");
  const { sessions } = parseMachine(out, null);
  assert.deepEqual(sessions.map((s) => [s.id, s.title, s.cwd]), [["g1", "what time is it", "/g"]]);
});

test("antigravity folder falls back to last_conversations", () => {
  const out = [`D\t9\tg3`, `G\t${JSON.stringify({ "/z/proj": "g3" })}`].join("\n");
  assert.deepEqual(parseMachine(out, null).sessions.map((s) => [s.cwd, s.title]), [["/z/proj", "proj"]]);
});

test("codex TUI sessions marked vscode still show", () => {
  const meta = JSON.stringify({ type: "session_meta", payload: { id: "t", cwd: "/c", originator: "codex-tui", source: "vscode" } });
  assert.equal(parseMachine(`X\t5\t/r/rollout-t.jsonl\t${meta}\t`, null).sessions.length, 1);
});

test("a slash command start gives the command as title", () => {
  const line = `"content":"<command-message>ci-triage</command-message>\\n<command-name>/ci-triage</command-name> "entrypoint":"cli" "cwd":"/w" "sessionId":"s"`;
  assert.equal(parseMachine(`C\t1\t/p/s.jsonl\t${line}`, null).sessions[0].title, "/ci-triage");
});

test("antigravity summaries give folder and title for sessions missing from history", () => {
  const out = [`D\t9\tf1`, `S\tf1\tGitHub Pull Request Code Review\t["file:///home/u/my%20wt"]`, `S\tf2\t\t["file:///x"]`, `D\t8\tf2`].join("\n");
  assert.deepEqual(parseMachine(out, "omen").sessions.map((s) => [s.id, s.cwd, s.title]),
    [["f1", "/home/u/my wt", "GitHub Pull Request Code Review"], ["f2", "/x", "x"]]);
});

test("resume argv is exact", () => {
  assert.deepEqual(resumeArgv({ tool: "claude", id: "a" }), ["claude", "--resume", "a"]);
  assert.deepEqual(resumeArgv({ tool: "codex", id: "a" }), ["codex", "resume", "a"]);
  assert.deepEqual(resumeArgv({ tool: "agy", id: "a" }), ["agy", "--conversation", "a"]);
});

const sp = (id, machine, folder, tabs = []) => ({ id, machine, folder, name: id, tabs });
const S = (cwd, machine = null) => ({ tool: "claude", id: "i", cwd, title: "t", stoppedAt: 0, machine });

test("matchSpace prefers a live terminal folder, then the space folder, then the longest parent", () => {
  const spaces = [sp("a", null, "/p"), sp("b", null, "/p/x"), sp("c", null, "/q", [{ id: "tc" }])];
  const panes = [{ tab: "tc", cwd: "/p/x/y" }];
  assert.equal(matchSpace(S("/p/x/y"), spaces, panes).id, "c");
  assert.equal(matchSpace(S("/p/x"), spaces, []).id, "b");
  assert.equal(matchSpace(S("/p/z"), spaces, []).id, "a");
  assert.equal(matchSpace(S("/px"), spaces, []), null);
  assert.equal(matchSpace(S("/r"), spaces, []), null);
});

test("matchSpace never crosses machines", () => {
  assert.equal(matchSpace(S("/p", "omen"), [sp("a", null, "/p")], []), null);
  assert.equal(matchSpace(S("/p", "omen"), [sp("o", "omen", "/p")], []).id, "o");
});

test("buildRows lists sessions newest first, with no groups", () => {
  const line = (id, t) => `C\t${t}\t/p/${id}.jsonl\t${JSON.stringify({ type: "user", entrypoint: "cli", cwd: "/p", sessionId: id })}`;
  const stdout = [line("old", 1), line("mid", 2)].join("\n");
  const omen = line("new", 3);
  const { rows } = buildRows([{ machine: null, stdout }, { machine: "omen", stdout: omen }], [], [], [], 5000);
  assert.deepEqual(rows.map((r) => r.id), ["new", "mid", "old"]);
  assert.equal("group" in rows[0], false);
});

test("buildRows drops sessions older than 7 days and fills where", () => {
  const D = 86400;
  const line = (id, t) => `C\t${t}\t/p/${id}.jsonl\t${JSON.stringify({ type: "user", entrypoint: "cli", cwd: "/p", sessionId: id })}`;
  const stdout = [line("new", 9 * D), line("stale", 1 * D)].join("\n");
  const finished = [{ cwd: "/p", agent: "claude-code", where: "ledger / 2", address: "omen/t9" }, { cwd: "/p", agent: "claude-code", where: "x / 1", address: "t1" }];
  const { rows } = buildRows([{ machine: "omen", stdout }], [], [], finished, 10 * D * 1000);
  assert.deepEqual(rows.map((r) => [r.id, r.where]), [["new", "ledger / 2"]]);
});

test("buildRows keeps other machines when one fails", () => {
  const stdout = `C\t1\t/p/m.jsonl\t${JSON.stringify({ type: "user", entrypoint: "cli", cwd: "/p", sessionId: "m" })}`;
  const r = buildRows([{ machine: null, stdout }, { machine: "omen", error: "timed out" }], [], [], [], 5000);
  assert.equal(r.rows.length, 1);
  assert.deepEqual(r.errors, [{ machine: "omen", error: "timed out" }]);
});

test("filterRows matches every word in title, folder, space name or tool", () => {
  const rows = [{ ...S("/w/ledger"), title: "replay fix", space: { name: "maximum" } }, { ...S("/w/ui"), title: "css", space: null }];
  assert.equal(filterRows(rows, "ledger max").length, 1);
  assert.equal(filterRows(rows, "").length, 2);
});

test("ago", () => {
  assert.equal(ago(0, 30e3), "just now");
  assert.equal(ago(0, 5 * 60e3), "5 min ago");
  assert.equal(ago(0, 2 * 3600e3), "2 h ago");
  assert.equal(ago(0, 4 * 86400e3), "4 d ago");
});

test("MACHINE_SCRIPT reads a fake home", () => {
  const home = mkdtempSync(join(tmpdir(), "reopen-"));
  mkdirSync(join(home, ".claude/projects/-w/aaa/subagents"), { recursive: true });
  // Real field order: message comes before cwd and entrypoint, and can be long.
  writeFileSync(join(home, ".claude/projects/-w/aaa.jsonl"),
    '{"type":"mode"}\n' + JSON.stringify({ type: "user", message: { role: "user", content: "hi\tthere " + "x".repeat(9000) }, entrypoint: "cli", cwd: "/w", sessionId: "aaa" }) + "\n");
  writeFileSync(join(home, ".claude/projects/-w/aaa/subagents/agent-1.jsonl"),
    JSON.stringify({ type: "user", entrypoint: "cli", cwd: "/w", sessionId: "sub" }) + "\n");
  mkdirSync(join(home, ".claude/sessions"), { recursive: true });
  writeFileSync(join(home, ".claude/sessions/1.json"), JSON.stringify({ pid: 1, sessionId: "live1" }));
  mkdirSync(join(home, ".codex/sessions/2026/11/26"), { recursive: true });
  writeFileSync(join(home, ".codex/sessions/2026/11/26/rollout-x.jsonl"),
    JSON.stringify({ type: "session_meta", payload: { id: "x", cwd: "/c", originator: "codex-tui", source: "cli" } }) + "\n"
    + JSON.stringify({ type: "event_msg", payload: { type: "user_message", message: "add a test" } }) + "\n");
  writeFileSync(join(home, ".codex/session_index.jsonl"), JSON.stringify({ id: "x", thread_name: "Add a test" }) + "\n");
  mkdirSync(join(home, ".gemini/antigravity-cli/conversations"), { recursive: true });
  mkdirSync(join(home, ".gemini/antigravity-cli/cache"), { recursive: true });
  writeFileSync(join(home, ".gemini/antigravity-cli/history.jsonl"),
    JSON.stringify({ display: "go", timestamp: 1, workspace: "/g", conversationId: "g1" }) + "\n");
  writeFileSync(join(home, ".gemini/antigravity-cli/cache/last_conversations.json"), '{\n  "/g": "g1"\n}\n');
  writeFileSync(join(home, ".gemini/antigravity-cli/conversations/g1.db"), "");
  writeFileSync(join(home, ".gemini/antigravity-cli/conversations/g2.db"), "");
  execFileSync("sqlite3", [join(home, ".gemini/antigravity-cli/conversation_summaries.db"),
    "create table conversation_summaries (conversation_id text, title text, workspace_uris text, last_modified_time datetime);"
    + "insert into conversation_summaries values ('g2', 'Fee review', '[\"file:///s\"]', datetime('now'));"]);
  const out = execFileSync("sh", ["-c", MACHINE_SCRIPT], { env: { ...process.env, HOME: home } }).toString();
  assert.doesNotMatch(out, /^B\t/m);
  assert.match(out, /^L\tlive1$/m); // pid 1 (launchd/init) is always alive
  assert.match(out, /^G\t\{.*"\/g": "g1".*\}$/m);
  const got = parseMachine(out, null).sessions.map((s) => [s.id, s.cwd, s.title]).sort();
  assert.deepEqual(got, [["aaa", "/w", "hi there " + "x".repeat(70) + "…"], ["g1", "/g", "go"], ["g2", "/s", "Fee review"], ["x", "/c", "Add a test"]]);
});

test("a busy week (more than 100 Claude sessions) still lists them all", () => {
  const home = mkdtempSync(join(tmpdir(), "reopen-busy-"));
  mkdirSync(join(home, ".claude/projects/-w"), { recursive: true });
  for (let i = 0; i < 250; i++) {
    writeFileSync(join(home, `.claude/projects/-w/s${i}.jsonl`), JSON.stringify({ type: "user", entrypoint: "cli", cwd: "/w", sessionId: `s${i}` }) + "\n");
  }
  const out = execFileSync("sh", ["-c", MACHINE_SCRIPT], { env: { ...process.env, HOME: home } }).toString();
  assert.equal(parseMachine(out, null).sessions.length, 250);
});
