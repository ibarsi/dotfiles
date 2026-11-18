// node --test herdr-app/mods/codeburn/model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isPersonal, providerOfModel, splitSpend, dailyWork, projectMonth, money, tokens, ago, monthName, shortDate, EXPORT_JQ, agents, repoTotals, accuracyNotes, buildSpaces, mergeCurrent, stripPersonal, modelBreakdown, RANK_COLORS } from "./model.js";

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

test("dailyWork buckets by local calendar day, not the UTC day toISOString gives", () => {
  const prevTZ = process.env.TZ;
  process.env.TZ = "America/Toronto"; // UTC-5 in November: late evening local is already tomorrow in UTC
  try {
    const today = new Date(2026, 10, 18, 20, 0, 0); // Nov 18 2026, 20:00 local
    const combinedDevices = [
      { id: "local", name: "Igors-MacBook-Pro.local", payload: { current: {}, history: { daily: [
        { date: "2026-11-18", cost: 10, topModels: [{ name: "Opus 5.5", cost: 10 }] },
      ] } } },
    ];
    const result = dailyWork(combinedDevices, 30, today);
    assert.equal(result.series[29], 10); // the last slot is "today" (local Nov 18), not UTC's Nov 19
  } finally {
    process.env.TZ = prevTZ;
  }
});

test("projectMonth with zero month-to-date is zero", () => {
  assert.equal(projectMonth(0, new Date(2026, 10, 1, 6)), 0);
});

test("projectMonth midway through the month", () => {
  const now = new Date(2026, 10, 16);
  assert.equal(projectMonth(150, now), 300);
});

test("projectMonth does not overproject early in the month from whole-day rounding", () => {
  // June has no US DST transition, so this isolates the rounding bug: whole-day
  // rounding floors 1.4583 elapsed days down to 1, projecting 100/1*30 = 3000
  // instead of the true ~100/1.4583*30 ≈ 2057.
  const now = new Date(2026, 5, 2, 11, 0, 0);
  const result = projectMonth(100, now);
  assert.ok(result < 2200 && result > 1900, `expected a continuous-time projection near 2057, got ${result}`);
});

test("money formats with thousands separator and two decimals", () => {
  assert.equal(money(1598.2), "$1,598.20");
  assert.equal(money(183.65), "$183.65");
});

test("money rounds to the nearest cent instead of showing full float precision", () => {
  // gpui-shell's embedded JS runtime doesn't honor toLocaleString options (it
  // falls back to raw toString()), so money() must round and group manually.
  assert.equal(money(3186.3559860500036), "$3,186.36");
  assert.equal(money(0.004999), "$0.00");
});

test("tokens formats compactly", () => {
  assert.equal(tokens(727769103), "727.8M");
  assert.equal(tokens(4200), "4.2K");
  assert.equal(tokens(950), "950");
});

test("monthName and shortDate avoid toLocaleString (gpui-shell ignores its format options)", () => {
  assert.equal(monthName(new Date(2026, 10, 18)), "November");
  assert.equal(shortDate(new Date(2026, 10, 30)), "Nov 30");
  assert.equal(shortDate(new Date(2026, 0, 5)), "Jan 5");
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

test("mergeCurrent sums totals, merges models/projects/branches by name across devices, and token-weights the cache hit rate", () => {
  const combinedDevices = [
    { id: "a", name: "A", payload: { current: {
      cost: 10, calls: 100, inputTokens: 1000, outputTokens: 500, cacheReadTokens: 2000, cacheWriteTokens: 100,
      cacheHitPercent: 90,
      topModels: [{ name: "Opus 5.5", calls: 50, cost: 6, inputTokens: 500, outputTokens: 250, cacheReadTokens: 1000, cacheWriteTokens: 50 }],
      topProjects: [{ name: "dotfiles", sessions: 2, cost: 10 }],
      byBranch: [{ branch: "feat", cost: 10, calls: 100, sessions: 2 }],
      unpricedModels: ["mystery-model"],
    } } },
    { id: "b", name: "B", payload: { current: {
      cost: 20, calls: 200, inputTokens: 2000, outputTokens: 1000, cacheReadTokens: 18000, cacheWriteTokens: 200,
      cacheHitPercent: 85,
      topModels: [{ name: "Opus 5.5", calls: 50, cost: 4, inputTokens: 500, outputTokens: 250, cacheReadTokens: 1000, cacheWriteTokens: 50 }],
      topProjects: [{ name: "dotfiles", sessions: 1, cost: 5 }],
      byBranch: [{ branch: "feat", cost: 5, calls: 50, sessions: 1 }],
      unpricedModels: [],
    } } },
  ];
  const merged = mergeCurrent(combinedDevices);
  assert.equal(merged.cost, 30);
  assert.equal(merged.calls, 300);
  assert.equal(merged.inputTokens, 3000);
  const opus = merged.topModels.find((m) => m.name === "Opus 5.5");
  assert.equal(opus.calls, 100);
  assert.equal(opus.cost, 10);
  const dotfiles = merged.topProjects.find((p) => p.name === "dotfiles");
  assert.equal(dotfiles.sessions, 3);
  assert.equal(dotfiles.cost, 15);
  const feat = merged.byBranch.find((b) => b.branch === "feat");
  assert.equal(feat.cost, 15);
  assert.deepEqual(merged.unpricedModels, ["mystery-model"]);
  const tokensA = 1000 + 500 + 2000 + 100;
  const tokensB = 2000 + 1000 + 18000 + 200;
  const expectedHit = (90 * tokensA + 85 * tokensB) / (tokensA + tokensB);
  assert.ok(Math.abs(merged.cacheHitPercent - expectedHit) < 1e-9);
});

test("mergeCurrent on an empty device list returns zeroed totals, not NaN", () => {
  const merged = mergeCurrent([]);
  assert.equal(merged.cost, 0);
  assert.equal(merged.cacheHitPercent, 0);
  assert.deepEqual(merged.topModels, []);
});

test("stripPersonal removes a personal provider's contribution from cost/calls/tokens/providerDetails/topModels", () => {
  const combinedDevices = [
    { id: "local", name: "Igors-MacBook-Pro.local", payload: { current: {
      cost: 50, calls: 500, inputTokens: 1000, outputTokens: 2000, cacheReadTokens: 3000,
      providerDetails: [
        { id: "claude", cost: 40, calls: 400, inputTokens: 800, outputTokens: 1600, cacheReadTokens: 3000 },
        { id: "codex", cost: 10, calls: 100, inputTokens: 200, outputTokens: 400 },
      ],
      topModels: [{ name: "Opus 5.5", cost: 40 }, { name: "GPT-6.1 Sol", cost: 10 }],
    } } },
  ];
  const [stripped] = stripPersonal(combinedDevices);
  const c = stripped.payload.current;
  assert.equal(c.cost, 40);
  assert.equal(c.calls, 400);
  assert.equal(c.inputTokens, 800);
  assert.equal(c.outputTokens, 1600);
  assert.equal(c.cacheReadTokens, 3000);
  assert.deepEqual(c.providerDetails.map((p) => p.id), ["claude"]);
  assert.deepEqual(c.topModels.map((m) => m.name), ["Opus 5.5"]);
});

test("stripPersonal leaves a non-MacBook device's codex untouched (personal is device-specific, not provider-global)", () => {
  const combinedDevices = [
    { id: "omen", name: "omen", payload: { current: {
      cost: 10, providerDetails: [{ id: "codex", cost: 10 }], topModels: [{ name: "GPT-6.1 Sol", cost: 10 }],
    } } },
  ];
  const [stripped] = stripPersonal(combinedDevices);
  assert.equal(stripped.payload.current.cost, 10);
  assert.deepEqual(stripped.payload.current.providerDetails.map((p) => p.id), ["codex"]);
});

test("modelBreakdown assigns rank colors in order and percentages of the given total, with no leftover row when nothing is unaccounted for", () => {
  const models = [{ name: "Opus 5.5", cost: 60 }, { name: "Sonnet 5", cost: 40 }];
  const result = modelBreakdown(models, 100);
  assert.deepEqual(result, [
    { name: "Opus 5.5", cost: 60, color: RANK_COLORS[0], percent: 60 },
    { name: "Sonnet 5", cost: 40, color: RANK_COLORS[1], percent: 40 },
  ]);
});

test("modelBreakdown adds an 'Other' segment (color null) for spend not covered by the shown models", () => {
  const models = [{ name: "Opus 5.5", cost: 60 }];
  const result = modelBreakdown(models, 100); // 40 unaccounted (e.g. unpriced models, or smaller ones not in topModels)
  assert.equal(result.length, 2);
  assert.equal(result[1].name, "Other");
  assert.equal(result[1].color, null);
  assert.equal(result[1].cost, 40);
  assert.equal(result[1].percent, 40);
});

test("modelBreakdown lumps every model past the 10-color limit into 'Other'", () => {
  const models = Array.from({ length: 12 }, (_, i) => ({ name: `m${i}`, cost: 10 }));
  const result = modelBreakdown(models, 120);
  assert.equal(result.length, 11); // 10 colored + 1 "Other"
  assert.equal(result[10].name, "Other");
  assert.equal(result[10].cost, 20); // models 11 and 12
});

test("modelBreakdown with zero total cost gives zero percentages, not NaN", () => {
  const result = modelBreakdown([{ name: "Opus 5.5", cost: 0 }], 0);
  assert.equal(result[0].percent, 0);
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

test("buildSpaces: an agent whose project is the worktree folder (not the repo name) still attaches via the target's cwd", () => {
  // codeburn's live-session `project` is basename(cwd), not the repo name — a worktree's
  // folder is usually named after its branch or task, not the repo it's a worktree of.
  const targets = { w: { repo: "ibarsi/dotfiles", branch: "feat", cwd: "/Users/igorbarsi/worktrees/dotfiles-feat" } };
  const byBranch = [{ branch: "feat", cost: 8 }];
  const worktreeAgent = agent({ id: "w1", provider: "claude", project: "dotfiles-feat", branch: "feat", sessionCost: 0, rate: 2 });
  const result = buildSpaces({ targets, activeId: null, byBranch, agents: [worktreeAgent], repos: new Map(), rangeCost: 0 });
  const w = result.rows.find((r) => r.id === "w");
  assert.equal(w.agents.length, 1);
  assert.equal(w.rate, 2);
});

test("buildSpaces: two targets on the same repo+branch (e.g. two herdr spaces on different machines) collapse into one row", () => {
  const targets = {
    mac: { repo: "usemaximum/maximum", branch: "main", cwd: "/Users/igorbarsi/Projects/maximum" },
    "omen/a": { repo: "usemaximum/maximum", branch: "main", cwd: "/home/ibarsi/Projects/maximum" },
    "omen/b": { repo: "usemaximum/maximum", branch: "main", cwd: "/home/ibarsi/Projects/maximum" },
  };
  const repos = new Map([["maximum", 128.1]]);
  const result = buildSpaces({ targets, activeId: null, byBranch: [], agents: [], repos, rangeCost: 1000 });
  const maximumRows = result.rows.filter((r) => r.repo === "maximum" && r.branch === "main");
  assert.equal(maximumRows.length, 1);
  assert.equal(maximumRows[0].cost, 128.1);
});

test("buildSpaces: a deduped row is active if any of its merged targets is the active space", () => {
  const targets = {
    mac: { repo: "usemaximum/maximum", branch: "main", cwd: "/Users/igorbarsi/Projects/maximum" },
    "omen/a": { repo: "usemaximum/maximum", branch: "main", cwd: "/home/ibarsi/Projects/maximum" },
  };
  const result = buildSpaces({ targets, activeId: "omen/a", byBranch: [], agents: [], repos: new Map(), rangeCost: 0 });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].active, true);
});

test("buildSpaces: an agent attaches via either duplicate target's own cwd, not just the representative one's", () => {
  const targets = {
    mac: { repo: "usemaximum/maximum", branch: "main", cwd: "/Users/igorbarsi/Projects/maximum" },
    "omen/a": { repo: "usemaximum/maximum", branch: "main", cwd: "/home/ibarsi/Projects/maximum" },
  };
  // "maximum" is also the repo name, so this specifically exercises the merged cwd set,
  // not just the already-covered repo-name match.
  const omenAgent = agent({ id: "o1", provider: "claude", project: "maximum", branch: "main", sessionCost: 3, rate: 1 });
  const result = buildSpaces({ targets, activeId: null, byBranch: [], agents: [omenAgent], repos: new Map(), rangeCost: 0 });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].agents.length, 1);
});

test("buildSpaces: a row with no agents and exactly zero cost is dropped entirely, not folded into quiet", () => {
  const targets = { empty: { repo: "r/empty", branch: "b1" }, big: { repo: "r/big", branch: "b2" } };
  const byBranch = [{ branch: "b2", cost: 30 }]; // "b1" has no byBranch entry at all: cost defaults to 0
  const result = buildSpaces({ targets, activeId: null, byBranch, agents: [], repos: new Map(), rangeCost: 1000 });
  assert.equal(result.rows.some((r) => r.id === "empty"), false);
  assert.equal(result.quiet.rows.some((r) => r.id === "empty"), false);
  assert.equal(result.quiet.count, 0); // only "big" exists, and it's not quiet-eligible (above 2%)
});

test("buildSpaces: the active row shows even with zero cost and no agents", () => {
  const targets = { empty: { repo: "r/empty", branch: "b1" } };
  const result = buildSpaces({ targets, activeId: "empty", byBranch: [], agents: [], repos: new Map(), rangeCost: 1000 });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].id, "empty");
});

test("buildSpaces: no targets and no agents yields an empty, well-shaped result", () => {
  const result = buildSpaces({ targets: null, activeId: null, byBranch: [], agents: [], repos: new Map(), rangeCost: 0 });
  assert.deepEqual(result, { rows: [], quiet: { count: 0, cost: 0, rows: [] }, other: null, live: 0, rate: 0 });
});

test("EXPORT_JQ keeps only records at or after the cutoff, sums project/session cost from non-personal providers only, and slims the shape", (t) => {
  try {
    execFileSync("jq", ["--version"]);
  } catch {
    t.skip("jq not on PATH");
    return;
  }
  const fixture = {
    projects: [{ project: "/a/b", cost: 999, extra: "x" }], // codeburn's own mixed-provider total; EXPORT_JQ ignores it and rebuilds from records
    sessions: [{ sessionId: "s1", cost: 10, extra: "y" }, { sessionId: "s2", cost: 8 }],
    records: [
      { project: "/a/b", provider: "claude", sessionId: "s1", cost: 10, timestamp: "2026-11-18T09:00:00Z" },
      { project: "/a/b", provider: "codex", sessionId: "s2", cost: 5, timestamp: "2026-11-18T09:05:00Z" },
      { project: "/a/b", provider: "codex", sessionId: "s2", cost: 3, timestamp: "2026-11-18T11:00:00Z" },
      { project: "/a/b", provider: "claude", sessionId: "s1", cost: 2, timestamp: "2026-11-18T11:30:00Z" },
    ],
  };
  const file = join(tmpdir(), `codeburn-export-jq-test-${process.pid}.json`);
  writeFileSync(file, JSON.stringify(fixture));
  try {
    const out = execFileSync("jq", ["-c", "--argjson", "personal", '["codex"]', "--arg", "cutoff", "2026-11-18T10:00:00Z", EXPORT_JQ, file], { encoding: "utf8" });
    const slim = JSON.parse(out);
    assert.deepEqual(slim.projects, [{ project: "/a/b", cost: 12 }]); // claude's 10 + 2; codex's 5 + 3 excluded
    assert.deepEqual(slim.sessions, [{ sessionId: "s1", cost: 10 }]); // s2 (codex) dropped entirely
    assert.equal(slim.recent.length, 1);
    assert.equal(slim.recent[0].cost, 2); // the one post-cutoff, non-personal record
    assert.deepEqual(Object.keys(slim.projects[0]).sort(), ["cost", "project"]);
  } finally {
    unlinkSync(file);
  }
});

test("EXPORT_JQ with an empty personal list (e.g. a remote device with no personal providers) excludes nothing", (t) => {
  try {
    execFileSync("jq", ["--version"]);
  } catch {
    t.skip("jq not on PATH");
    return;
  }
  const fixture = {
    projects: [],
    sessions: [{ sessionId: "s2", cost: 8 }],
    records: [{ project: "/a/b", provider: "codex", sessionId: "s2", cost: 5, timestamp: "2026-11-18T09:05:00Z" }],
  };
  const file = join(tmpdir(), `codeburn-export-jq-test-empty-${process.pid}.json`);
  writeFileSync(file, JSON.stringify(fixture));
  try {
    const out = execFileSync("jq", ["-c", "--argjson", "personal", "[]", "--arg", "cutoff", "2026-11-18T10:00:00Z", EXPORT_JQ, file], { encoding: "utf8" });
    const slim = JSON.parse(out);
    assert.deepEqual(slim.projects, [{ project: "/a/b", cost: 5 }]);
    assert.deepEqual(slim.sessions, [{ sessionId: "s2", cost: 8 }]);
  } finally {
    unlinkSync(file);
  }
});
