// node --test herdr-app/mods/codeburn/model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isPersonal, providerOfModel, splitSpend, dailyWork, projectMonth, money, tokens, ago, EXPORT_JQ, agents, repoTotals, accuracyNotes, buildSpaces } from "./model.js";

test("isPersonal: MacBook codex is personal", () => {
  assert.equal(isPersonal("Igors-MacBook-Pro.local", "codex"), true);
});

test("isPersonal: non-MacBook codex is work", () => {
  assert.equal(isPersonal("omen", "codex"), false);
});

test("isPersonal: claude on MacBook is work", () => {
  assert.equal(isPersonal("Igors-MacBook-Pro.local", "claude"), false);
});

test("isPersonal: grok build on MacBook is work (not in PERSONAL table)", () => {
  assert.equal(isPersonal("Igors-MacBook-Pro.local", "grok build"), false);
});

test("providerOfModel classifies by name pattern", () => {
  assert.equal(providerOfModel("Opus 5.5"), "claude");
  assert.equal(providerOfModel("GPT-6.1 Sol"), "codex");
  assert.equal(providerOfModel("gpt-6-astra"), "codex");
  assert.equal(providerOfModel("Gemini 3.8 Flash"), "gemini");
  assert.equal(providerOfModel("mystery"), "other");
});

test("splitSpend sums providerDetails across devices into work/personal", () => {
  const combinedDevices = [
    { id: "local", name: "Igors-MacBook-Pro.local", payload: { current: { providerDetails: [
      { id: "claude", cost: 300 },
      { id: "codex", cost: 30 },
    ] } } },
    { id: "omen", name: "omen", payload: { current: { providerDetails: [
      { id: "codex", cost: 10 },
      { id: "gemini", cost: 0 },
    ] } } },
  ];
  const result = splitSpend(combinedDevices);
  assert.equal(result.work, 310); // claude 300 + omen codex 10
  assert.equal(result.personal, 30); // Mac codex
  assert.deepEqual(result.providers, new Set(["claude", "codex"]));
});

test("dailyWork splits a day's cost by model provider, remainder counts as unclassified work", () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const combinedDevices = [
    { id: "local", name: "Igors-MacBook-Pro.local", payload: { current: {}, history: { daily: [
      { date: yesterday, cost: 20, topModels: [{ name: "Opus 5.5", cost: 12 }, { name: "GPT-6.1 Sol", cost: 5 }] },
    ] } } },
  ];
  const result = dailyWork(combinedDevices, 30);
  assert.equal(result.series.length, 30);
  // yesterday is the second-to-last slot (last slot is today)
  assert.equal(result.series[28], 15); // 12 (claude work) + 3 (remainder, counted as work)
  assert.equal(result.unclassified, 3);
});

test("projectMonth on day 1 (elapsedDays floored to 1) is finite", () => {
  const now = new Date(2026, 10, 1, 6);
  assert.equal(projectMonth(10, now), 300);
});

test("projectMonth with zero month-to-date is zero", () => {
  assert.equal(projectMonth(0, new Date(2026, 10, 1, 6)), 0);
});

test("projectMonth midway through the month", () => {
  const now = new Date(2026, 10, 16);
  assert.equal(projectMonth(150, now), 300);
});

test("money formats with thousands separator and two decimals", () => {
  assert.equal(money(1598.2), "$1,598.20");
  assert.equal(money(183.65), "$183.65");
});

test("tokens formats compactly", () => {
  assert.equal(tokens(727769103), "727.8M");
  assert.equal(tokens(4200), "4.2K");
  assert.equal(tokens(950), "950");
});

test("ago formats elapsed time", () => {
  assert.equal(ago(5000), "just now");
  assert.equal(ago(12000), "12s ago");
  assert.equal(ago(3 * 60000), "3m ago");
  assert.equal(ago(2 * 3600000), "2h ago");
  assert.equal(ago(4 * 86400000), "4d ago");
});

test("agents: active session with recent spend gets a burn rate and fill", () => {
  const liveSessions = [{ id: "s1", provider: "claude", model: "Opus 5.5", project: "dotfiles", branch: "b", contextTokens: 56000, contextWindow: 200000, idleSeconds: 0 }];
  const slim = { sessions: [{ sessionId: "s1", cost: 6.85 }], recent: [{ sessionId: "s1", cost: 0.5 }, { sessionId: "s1", cost: 0.2 }, { sessionId: "x", cost: 9 }] };
  const [a] = agents(liveSessions, slim);
  assert.ok(Math.abs(a.rate - 4.2) < 1e-9);
  assert.equal(a.sessionCost, 6.85);
  assert.equal(a.fill, 0.28);
  assert.equal(a.idle, false);
});

test("agents: idle session with no recent records has zero rate and cost", () => {
  const liveSessions = [{ id: "s2", provider: "codex", model: "GPT-6.1 Sol", project: "dotfiles", branch: "b", contextTokens: 1000, contextWindow: 100000, idleSeconds: 240 }];
  const slim = { sessions: [], recent: [] };
  const [a] = agents(liveSessions, slim);
  assert.equal(a.idle, true);
  assert.equal(a.rate, 0);
  assert.equal(a.sessionCost, 0);
});

test("repoTotals sums per-repo cost by basename across folders", () => {
  const totals = repoTotals({ projects: [{ project: "/a/maximum", cost: 5 }, { project: "/b/maximum", cost: 2 }, { project: "/a/dotfiles", cost: 1 }] });
  assert.equal(totals.get("maximum"), 7);
  assert.equal(totals.get("dotfiles"), 1);
});

test("accuracyNotes is empty when nothing needs a caveat", () => {
  assert.deepEqual(accuracyNotes({ providers: new Set(["claude"]), unpriced: [], unclassified: 0 }), []);
});

test("accuracyNotes lists gemini, grok and unclassified remainder, gemini first", () => {
  const notes = accuracyNotes({ providers: new Set(["gemini", "grok build"]), unpriced: [], unclassified: 3 });
  assert.equal(notes.length, 3);
  assert.match(notes[0], /Gemini/);
  assert.match(notes[1], /Grok/);
  assert.match(notes[2], /\$3\.00/);
});

function agent(overrides) {
  return { id: "a", provider: "claude", model: "Opus 5.5", project: "", branch: "", fill: 0, idle: false, idleSeconds: 0, rate: 0, sessionCost: 0, ...overrides };
}

test("buildSpaces: a default branch (master) shows the repo total, not byBranch's cross-repo mix", () => {
  const targets = { a: { repo: "ibarsi/dotfiles", branch: "master" }, b: { repo: "x/maximum", branch: "feat" } };
  const byBranch = [{ branch: "master", cost: 500 }, { branch: "feat", cost: 8 }];
  const repos = new Map([["dotfiles", 98]]);
  const result = buildSpaces({ targets, activeId: null, byBranch, agents: [], repos, rangeCost: 0 });
  const a = result.rows.find((r) => r.id === "a");
  const b = result.rows.find((r) => r.id === "b");
  assert.equal(a.shared, true);
  assert.equal(a.cost, 98);
  assert.equal(b.shared, false);
  assert.equal(b.cost, 8);
});

test("buildSpaces: a branch name used by two different repos is shared even if not main/master", () => {
  const targets = { a: { repo: "ibarsi/one", branch: "release" }, b: { repo: "x/two", branch: "release" } };
  const repos = new Map([["one", 10], ["two", 20]]);
  const result = buildSpaces({ targets, activeId: null, byBranch: [], agents: [], repos, rangeCost: 0 });
  assert.equal(result.rows.find((r) => r.id === "a").shared, true);
  assert.equal(result.rows.find((r) => r.id === "b").shared, true);
});

test("buildSpaces: a live non-claude agent adds its session cost to its space; a claude agent doesn't change cost", () => {
  const targets = { b: { repo: "x/maximum", branch: "feat" } };
  const byBranch = [{ branch: "feat", cost: 8 }];
  const codexAgent = agent({ id: "c1", provider: "codex", project: "maximum", branch: "feat", sessionCost: 2, rate: 1 });
  let result = buildSpaces({ targets, activeId: null, byBranch, agents: [codexAgent], repos: new Map(), rangeCost: 1000 });
  let b = result.rows.find((r) => r.id === "b");
  assert.equal(b.cost, 10);
  assert.equal(b.rate, 1);
  assert.equal(b.liveCost, 2);

  const claudeAgent = agent({ id: "c2", provider: "claude", project: "maximum", branch: "feat", sessionCost: 5, rate: 0 });
  result = buildSpaces({ targets, activeId: null, byBranch, agents: [codexAgent, claudeAgent], repos: new Map(), rangeCost: 1000 });
  b = result.rows.find((r) => r.id === "b");
  assert.equal(b.cost, 10); // claude agent's sessionCost is not added to liveCost
});

test("buildSpaces: an agent matching no open space's repo+branch lands in Other", () => {
  const targets = { a: { repo: "ibarsi/dotfiles", branch: "feat" } };
  const strayAgent = agent({ id: "s", provider: "codex", project: "scratch", branch: "main", sessionCost: 4 });
  const result = buildSpaces({ targets, activeId: null, byBranch: [], agents: [strayAgent], repos: new Map(), rangeCost: 1000 });
  assert.equal(result.other.cost, 4);
  assert.equal(result.other.agents.length, 1);
});

test("buildSpaces: active row first, then busy rows by rate desc, then quiet-ineligible rows by cost desc", () => {
  const targets = {
    active: { repo: "r/active", branch: "idle-branch" },
    busyLow: { repo: "r/busyLow", branch: "b1" },
    busyHigh: { repo: "r/busyHigh", branch: "b2" },
    costOnly: { repo: "r/costOnly", branch: "b3" },
  };
  const liveAgents = [
    agent({ id: "1", project: "busyLow", branch: "b1", rate: 1 }),
    agent({ id: "2", project: "busyHigh", branch: "b2", rate: 3 }),
  ];
  const byBranch = [{ branch: "b3", cost: 50 }];
  const result = buildSpaces({ targets, activeId: "active", byBranch, agents: liveAgents, repos: new Map(), rangeCost: 0 });
  assert.deepEqual(result.rows.map((r) => r.id), ["active", "busyHigh", "busyLow", "costOnly"]);
});

test("buildSpaces: a quiet, no-agent, low-cost non-active row folds into quiet; a bigger one stays in rows", () => {
  const targets = { small: { repo: "r/small", branch: "b1" }, big: { repo: "r/big", branch: "b2" } };
  const byBranch = [{ branch: "b1", cost: 10 }, { branch: "b2", cost: 30 }];
  const result = buildSpaces({ targets, activeId: null, byBranch, agents: [], repos: new Map(), rangeCost: 1000 });
  assert.equal(result.quiet.count, 1);
  assert.equal(result.quiet.cost, 10);
  assert.equal(result.rows.some((r) => r.id === "small"), false);
  assert.equal(result.rows.some((r) => r.id === "big"), true);
});

test("buildSpaces: no targets and no agents yields an empty, well-shaped result", () => {
  const result = buildSpaces({ targets: null, activeId: null, byBranch: [], agents: [], repos: new Map(), rangeCost: 0 });
  assert.deepEqual(result, { rows: [], quiet: { count: 0, cost: 0, rows: [] }, other: null, live: 0, rate: 0 });
});

test("EXPORT_JQ keeps only records at or after the cutoff, and slims projects/sessions", (t) => {
  try {
    execFileSync("jq", ["--version"]);
  } catch {
    t.skip("jq not on PATH");
    return;
  }
  const fixture = {
    projects: [{ project: "/a/b", cost: 1, extra: "x" }],
    sessions: [{ sessionId: "s", cost: 1, extra: "y" }],
    records: [
      { sessionId: "s", cost: 1, timestamp: "2026-11-18T09:00:00Z" },
      { sessionId: "s", cost: 2, timestamp: "2026-11-18T11:00:00Z" },
    ],
  };
  const file = join(tmpdir(), `codeburn-export-jq-test-${process.pid}.json`);
  writeFileSync(file, JSON.stringify(fixture));
  try {
    const out = execFileSync("jq", ["-c", "--arg", "cutoff", "2026-11-18T10:00:00Z", EXPORT_JQ, file], { encoding: "utf8" });
    const slim = JSON.parse(out);
    assert.equal(slim.recent.length, 1);
    assert.equal(slim.recent[0].cost, 2);
    assert.deepEqual(Object.keys(slim.projects[0]).sort(), ["cost", "project"]);
  } finally {
    unlinkSync(file);
  }
});
