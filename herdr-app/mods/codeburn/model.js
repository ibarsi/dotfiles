// Pure data shaping for the Code Burn panel: no imports, no gpui, no exec.
// Takes codeburn's menubar-json/export output and turns it into what the
// panel renders. Tested standalone with `node --test model.test.mjs`.

// First match wins; device is a regex on the codeburn device name. Everything
// not matched here is work (Vertex). See codeburn/README.md for the pricing
// override policy this mirrors.
export const PERSONAL = [{ device: /MacBook/i, provider: "codex" }];

export const RANGES = [
  { label: "Today", period: "today" },
  { label: "7 days", period: "week" },
  { label: "30 days", period: "30days" },
  { label: "Month", period: "month" },
  { label: "All", period: "all" },
];

export function isPersonal(deviceName, provider) {
  return PERSONAL.some((p) => p.device.test(deviceName ?? "") && p.provider === provider);
}

export function providerOfModel(name) {
  const n = name ?? "";
  if (/gemini/i.test(n)) return "gemini";
  if (/grok/i.test(n)) return "grok";
  if (/opus|sonnet|haiku|fable|claude/i.test(n)) return "claude";
  if (/gpt|codex|o\d/i.test(n)) return "codex";
  return "other";
}

export function splitSpend(combinedDevices) {
  let work = 0;
  let personal = 0;
  const providers = new Set();
  for (const device of combinedDevices ?? []) {
    for (const pd of device.payload?.current?.providerDetails ?? []) {
      if (isPersonal(device.name, pd.id)) personal += pd.cost;
      else work += pd.cost;
      if (pd.cost > 0) providers.add(pd.id);
    }
  }
  return { work, personal, providers };
}

// Local calendar date, not toISOString's UTC one — codeburn buckets daily
// history by local day, and toISOString() rolls to tomorrow's date for any
// evening local time with a negative UTC offset.
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dailyWork(combinedDevices, days = 30, today = new Date()) {
  const series = new Array(days).fill(0);
  const indexByDate = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    indexByDate.set(dateKey(d), i);
  }
  let unclassified = 0;
  for (const device of combinedDevices ?? []) {
    for (const day of device.payload?.history?.daily ?? []) {
      const idx = indexByDate.get(day.date);
      if (idx === undefined) continue;
      let classifiedCost = 0;
      for (const m of day.topModels ?? []) {
        classifiedCost += m.cost;
        if (!isPersonal(device.name, providerOfModel(m.name))) series[idx] += m.cost;
      }
      const remainder = day.cost - classifiedCost;
      if (remainder > 0.005) {
        series[idx] += remainder;
        unclassified += remainder;
      }
    }
  }
  return { series, unclassified };
}

export function projectMonth(mtd, now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Elapsed time stays continuous (not rounded to whole days — rounding down
  // early in the month, e.g. 1.46 elapsed days floored to 1, overprojects by
  // ~50%). The raw ms difference is corrected for the DST hour a month can
  // gain or lose (e.g. Nov 1, 2026 in the US) by subtracting the difference
  // between the two timestamps' UTC offsets, so a transition doesn't masquerade
  // as an extra hour of spending pace.
  const dstAdjustMs = (monthStart.getTimezoneOffset() - now.getTimezoneOffset()) * 60000;
  const elapsedDays = Math.max(1, (now - monthStart - dstAdjustMs) / 86400000);
  return (mtd / elapsedDays) * daysInMonth;
}

// Costs in this panel are never negative, so no sign handling is needed.
// toFixed (plain ECMAScript, not Intl) does the rounding; toLocaleString is
// avoided because gpui-shell's embedded JS runtime doesn't honor its format
// options — it silently falls back to raw toString() precision.
export function money(n) {
  const [whole, cents] = (n ?? 0).toFixed(2).split(".");
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
}

export function tokens(n) {
  const v = n ?? 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return `${v}`;
}

// Run against a codeburn `export --format json` file with
// `jq -c --argjson personal '["codex",...]' --arg cutoff <ISO> "$EXPORT_JQ" <file>`
// to shrink it from tens of megabytes to the three things the panel needs —
// cost per repo, cost per session (for completed-session totals) and the
// last few minutes of per-call records (for live burn rate) — while
// excluding every record whose provider is in `$personal` (this machine's
// personal providers, e.g. Codex on a MacBook). codeburn's own `.projects`
// total mixes every provider together (a repo worked on with both a work and
// a personal tool shows one combined number), so `projects` is rebuilt from
// `.records` (which does carry `provider`) instead of read off codeburn's own
// summary. `.sessions` entries don't carry `provider` themselves, so each
// session's provider is looked up from its own records first.
export const EXPORT_JQ = `
(.records | INDEX(.sessionId) | map_values(.provider)) as $providerBySession
| {
    projects: [.records | group_by(.project)[] | {project: .[0].project, cost: ([.[] | select(.provider as $p | ($personal | index($p)) | not) | .cost] | add // 0)}],
    sessions: [.sessions[] | select(($providerBySession[.sessionId] // "") as $p | ($personal | index($p)) | not) | {sessionId, cost}],
    recent: [.records[] | select((.timestamp >= $cutoff) and (.provider as $p | ($personal | index($p)) | not)) | {sessionId, cost}]
  }`;

export function agents(liveSessions, slim) {
  const sessionCostById = new Map((slim?.sessions ?? []).map((s) => [s.sessionId, s.cost]));
  const recentById = new Map();
  for (const r of slim?.recent ?? []) recentById.set(r.sessionId, (recentById.get(r.sessionId) ?? 0) + r.cost);
  return (liveSessions ?? []).map((s) => ({
    id: s.id,
    provider: s.provider,
    model: s.model,
    project: s.project,
    branch: s.branch,
    fill: s.contextWindow ? s.contextTokens / s.contextWindow : 0,
    idle: s.idleSeconds > 60,
    idleSeconds: s.idleSeconds,
    rate: (recentById.get(s.id) ?? 0) * 6,
    sessionCost: sessionCostById.get(s.id) ?? 0,
  }));
}

export function repoTotals(slim) {
  const totals = new Map();
  for (const p of slim?.projects ?? []) {
    const name = p.project.split("/").filter(Boolean).pop();
    totals.set(name, (totals.get(name) ?? 0) + p.cost);
  }
  return totals;
}

// codeburn's own `combined.combined` block only has coarse totals (cost,
// calls, tokens) — no per-model, per-project or per-branch breakdown across
// devices (verified against codeburn 0.9.28's output). This builds that
// breakdown from each device's own `current` block instead. cacheHitPercent
// isn't a simple token ratio (codeburn's own value doesn't match
// cacheRead/total or cacheRead/(cacheRead+input) on real data), so it's
// approximated as a token-weighted average of each device's own rate rather
// than guessed at from raw tokens.
export function mergeCurrent(combinedDevices) {
  const totals = { cost: 0, calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  const models = new Map();
  const projects = new Map();
  const branches = new Map();
  const unpriced = new Set();
  let hitWeightedSum = 0;
  let hitWeightTotal = 0;
  for (const device of combinedDevices ?? []) {
    const c = device.payload?.current ?? {};
    totals.cost += c.cost ?? 0;
    totals.calls += c.calls ?? 0;
    totals.inputTokens += c.inputTokens ?? 0;
    totals.outputTokens += c.outputTokens ?? 0;
    totals.cacheReadTokens += c.cacheReadTokens ?? 0;
    totals.cacheWriteTokens += c.cacheWriteTokens ?? 0;
    const deviceTokens = (c.inputTokens ?? 0) + (c.outputTokens ?? 0) + (c.cacheReadTokens ?? 0) + (c.cacheWriteTokens ?? 0);
    if (deviceTokens > 0 && typeof c.cacheHitPercent === "number") {
      hitWeightedSum += c.cacheHitPercent * deviceTokens;
      hitWeightTotal += deviceTokens;
    }
    for (const m of c.topModels ?? []) {
      const row = models.get(m.name) ?? { name: m.name, calls: 0, cost: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
      row.calls += m.calls ?? 0;
      row.cost += m.cost ?? 0;
      row.inputTokens += m.inputTokens ?? 0;
      row.outputTokens += m.outputTokens ?? 0;
      row.cacheReadTokens += m.cacheReadTokens ?? 0;
      row.cacheWriteTokens += m.cacheWriteTokens ?? 0;
      models.set(m.name, row);
    }
    for (const p of c.topProjects ?? []) {
      const row = projects.get(p.name) ?? { name: p.name, sessions: 0, cost: 0 };
      row.sessions += p.sessions ?? 0;
      row.cost += p.cost ?? 0;
      projects.set(p.name, row);
    }
    for (const b of c.byBranch ?? []) {
      const row = branches.get(b.branch) ?? { branch: b.branch, cost: 0, calls: 0, sessions: 0 };
      row.cost += b.cost ?? 0;
      row.calls += b.calls ?? 0;
      row.sessions += b.sessions ?? 0;
      branches.set(b.branch, row);
    }
    for (const u of c.unpricedModels ?? []) unpriced.add(typeof u === "string" ? u : (u.name ?? u.model ?? ""));
  }
  return {
    ...totals,
    cacheHitPercent: hitWeightTotal > 0 ? hitWeightedSum / hitWeightTotal : 0,
    topModels: [...models.values()].sort((a, b) => b.cost - a.cost),
    topProjects: [...projects.values()].sort((a, b) => b.cost - a.cost),
    byBranch: [...branches.values()],
    unpricedModels: [...unpriced],
  };
}

// Removes every personal (device + provider) contribution from each
// device's `current` block entirely, so personal spend doesn't show up in
// Totals, Models, cache-hit rate, or anywhere else `mergeCurrent` feeds —
// the panel is about work (Vertex) spend. `providerDetails` doesn't carry
// cacheWriteTokens (verified against real codeburn output), so that one
// field can't be exactly subtracted; in practice it's negligible for a
// personal Codex account, which barely uses prompt caching.
export function stripPersonal(combinedDevices) {
  return (combinedDevices ?? []).map((device) => {
    const c = device.payload?.current;
    if (!c) return device;
    const removed = (c.providerDetails ?? []).filter((pd) => isPersonal(device.name, pd.id));
    if (!removed.length) return device;
    const sub = (field) => removed.reduce((s, pd) => s + (pd[field] ?? 0), 0);
    return {
      ...device,
      payload: {
        ...device.payload,
        current: {
          ...c,
          providerDetails: (c.providerDetails ?? []).filter((pd) => !isPersonal(device.name, pd.id)),
          topModels: (c.topModels ?? []).filter((m) => !isPersonal(device.name, providerOfModel(m.name))),
          cost: (c.cost ?? 0) - sub("cost"),
          calls: (c.calls ?? 0) - sub("calls"),
          inputTokens: (c.inputTokens ?? 0) - sub("inputTokens"),
          outputTokens: (c.outputTokens ?? 0) - sub("outputTokens"),
          cacheReadTokens: (c.cacheReadTokens ?? 0) - sub("cacheReadTokens"),
        },
      },
    };
  });
}

// Theme color-token names (read via theme() in ui.js, never a hardcoded hex —
// see theme/README.md's colour rule), one per rank from highest spend down.
// None of these is `accent`: that color is reserved for the context-fill bar
// elsewhere in this panel, so a cost bar is never confused for one.
export const RANK_COLORS = ["red", "peach", "yellow", "green", "teal", "sky", "sapphire", "lavender", "mauve", "pink"];

// Models, already sorted by cost descending (as codeburn's topModels is),
// assigned a fixed color by rank for the stacked breakdown bar. Anything past
// RANK_COLORS.length, plus any gap between the shown models' cost and
// `totalCost` (unpriced models, or models smaller than the ones shown),
// collapses into one dim "Other" segment (color: null) so the bar never needs
// an 11th color and never implies full coverage it doesn't have.
export function modelBreakdown(models, totalCost) {
  const pct = (cost) => (totalCost > 0 ? (cost / totalCost) * 100 : 0);
  const shown = models.slice(0, RANK_COLORS.length).map((m, i) => ({ name: m.name, cost: m.cost ?? 0, color: RANK_COLORS[i], percent: pct(m.cost ?? 0) }));
  const shownCost = shown.reduce((s, m) => s + m.cost, 0);
  const restCost = models.slice(RANK_COLORS.length).reduce((s, m) => s + (m.cost ?? 0), 0);
  const otherCost = restCost + Math.max(0, totalCost - shownCost - restCost);
  if (otherCost > 0.005) shown.push({ name: "Other", cost: otherCost, color: null, percent: pct(otherCost) });
  return shown;
}

export function accuracyNotes({ providers, unpriced, unclassified }) {
  const notes = [];
  if (providers?.has("gemini")) notes.push("Gemini: Carbon and Hydrogen use verified Vertex rates; Neon uses a blended standard/priority rate; Argon, 3.8 Flash and Flash Lite mix standard/priority traffic under one model name, so those use reference-only rates.");
  if (providers?.has("pi")) notes.push("Pi can keep agent-recorded costs that the overrides don't reprice.");
  if (providers?.has("grok build") || providers?.has("grok")) notes.push("Grok is priced at codeburn defaults; no Vertex override yet.");
  if (unpriced?.length) notes.push(`No price for: ${unpriced.join(", ")}`);
  if (unclassified > 0.005) notes.push(`${money(unclassified)} of daily spend couldn't be split by model (top-5 cap); counted as work.`);
  return notes;
}

// A space on one of these always shows its repo total: codeburn's byBranch
// sums every repo that has ever used that branch name, so "master" mixes
// spend across every project you've ever worked on, open or not.
export const DEFAULT_BRANCHES = new Set(["main", "master"]);

function repoName(repo) {
  return (repo ?? "").split("/").filter(Boolean).pop() ?? "";
}

export function buildSpaces({ targets, activeId, byBranch, agents, repos, rangeCost }) {
  const targetEntries = Object.entries(targets ?? {});
  const claudeCostByBranch = new Map((byBranch ?? []).map((b) => [b.branch, b.cost]));

  // branch name -> set of repo names currently open on it, to catch the same
  // branch name shared by two open spaces in different repos.
  const reposByBranch = new Map();
  for (const [, t] of targetEntries) {
    if (!reposByBranch.has(t.branch)) reposByBranch.set(t.branch, new Set());
    reposByBranch.get(t.branch).add(repoName(t.repo));
  }

  // Two open herdr spaces can point at the exact same repo+branch — two tabs
  // on the same checkout, or the same repo cloned on two machines (confirmed:
  // a space on the Mac and two on Omen all on usemaximum/maximum's `main`).
  // codeburn's branch/repo cost is the same either way (byBranch and repo
  // totals are keyed by name, not by which space asked), so they'd otherwise
  // show as identical-cost duplicate rows. Grouped by repo+branch first; the
  // group's cwd names (every member's, not just one — different machines can
  // have different paths for the "same" checkout) are kept so an agent still
  // attaches via any of them.
  const groups = new Map();
  for (const [id, t] of targetEntries) {
    const key = `${repoName(t.repo)}::${t.branch}`;
    (groups.get(key) ?? groups.set(key, []).get(key)).push({ id, ...t });
  }

  const rowsById = new Map();
  for (const members of groups.values()) {
    const activeMember = members.find((m) => m.id === activeId);
    const rep = activeMember ?? members[0];
    const name = repoName(rep.repo);
    const shared = DEFAULT_BRANCHES.has(rep.branch) || (reposByBranch.get(rep.branch)?.size ?? 0) > 1;
    // codeburn's live-session `project` is basename(cwd), not the repo name — a
    // worktree's folder is usually named after its branch or task, not its
    // repo — so an agent matches by either the repo name or the worktree's own
    // folder name, whichever the running session actually reports.
    const cwdNames = new Set(members.map((m) => repoName(m.cwd)));
    rowsById.set(rep.id, { id: rep.id, repo: name, cwdNames, branch: rep.branch, active: Boolean(activeMember), shared, agents: [], rate: 0, cost: 0, claudeCost: 0, liveCost: 0 });
  }

  let other = null;
  let live = 0;
  let rate = 0;
  for (const a of agents ?? []) {
    live += 1;
    rate += a.rate;
    const row = [...rowsById.values()].find((r) => r.branch === a.branch && (r.repo === a.project || r.cwdNames.has(a.project)));
    if (row) {
      row.agents.push(a);
      row.rate += a.rate;
    } else {
      other ??= { id: "other", repo: "Other (no space)", branch: null, active: false, shared: false, agents: [], rate: 0, cost: 0, claudeCost: 0, liveCost: 0 };
      other.agents.push(a);
      other.rate += a.rate;
      other.cost += a.sessionCost;
    }
  }

  for (const row of rowsById.values()) {
    if (row.shared) {
      row.cost = repos?.get(row.repo) ?? 0;
    } else {
      row.claudeCost = claudeCostByBranch.get(row.branch) ?? 0;
      row.liveCost = row.agents.filter((a) => a.provider !== "claude").reduce((sum, a) => sum + a.sessionCost, 0);
      row.cost = row.claudeCost + row.liveCost;
    }
  }

  const all = [...rowsById.values()];
  const activeRows = all.filter((r) => r.active);
  const restRows = all.filter((r) => !r.active);

  const quiet = { count: 0, cost: 0, rows: [] };
  const kept = [];
  for (const row of restRows) {
    if (row.agents.length === 0 && row.cost <= 0.005) continue; // nothing was ever spent here: not even worth a quiet-space line
    if (row.agents.length === 0 && row.cost < 0.02 * (rangeCost ?? 0)) {
      quiet.count += 1;
      quiet.cost += row.cost;
      quiet.rows.push(row);
    } else {
      kept.push(row);
    }
  }

  kept.sort((a, b) => {
    const aHas = a.agents.length > 0;
    const bHas = b.agents.length > 0;
    if (aHas !== bHas) return aHas ? -1 : 1;
    return aHas ? b.rate - a.rate : b.cost - a.cost;
  });

  return { rows: [...activeRows, ...kept], quiet, other, live, rate };
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Same toLocaleString caveat as money(): built manually, not via Intl.
export function monthName(d) {
  return MONTH_NAMES[d.getMonth()];
}

export function shortDate(d) {
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function ago(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
