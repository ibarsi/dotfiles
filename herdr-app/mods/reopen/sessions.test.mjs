import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMachine, resumeArgv } from "./sessions.js";

const claude = (id, cwd, extra = {}) => JSON.stringify({ type: "user", entrypoint: "cli", cwd, sessionId: id,
  message: { role: "user", content: "fix the ledger replay" }, ...extra });

test("parses a claude session", () => {
  const out = `B\t1795721999\nC\t1795700000\t/h/.claude/projects/-x/aaa.jsonl\t${claude("aaa", "/w/x")}\n`;
  const { boot, sessions } = parseMachine(out, "omen");
  assert.equal(boot, 1795721999000);
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

test("parses codex and drops vscode and running ones", () => {
  const meta = (id, source) => JSON.stringify({ type: "session_meta", payload: { id, cwd: "/c", originator: "codex-tui", source } });
  const user = JSON.stringify({ type: "event_msg", payload: { type: "user_message", message: "add a test" } });
  const out = [`X\t5\t/r/rollout-a.jsonl\t${meta("a", "cli")}\t${user}`,
    `X\t5\t/r/rollout-v.jsonl\t${meta("v", "vscode")}\t${user}`,
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

test("resume argv is exact", () => {
  assert.deepEqual(resumeArgv({ tool: "claude", id: "a" }), ["claude", "--resume", "a"]);
  assert.deepEqual(resumeArgv({ tool: "codex", id: "a" }), ["codex", "resume", "a"]);
  assert.deepEqual(resumeArgv({ tool: "agy", id: "a" }), ["agy", "--conversation", "a"]);
});
