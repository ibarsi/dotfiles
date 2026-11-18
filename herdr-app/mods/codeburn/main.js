// Code Burn panel: what the coding agents cost, priced at the Vertex contract
// rates configured in codeburn/README.md (not subscription plans). Opened
// from a "Code Burn" button in the tabs bar next to Deploys (my-tabs/main.js).
// State and fetching live here; small render helpers are in ui.js, all the
// pure number-crunching is in model.js (tested standalone, no imports).
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, theme, shared, setShared, layout, spaces } from "herdr";
import {
  RANGES, PERSONAL, money, tokens, ago, monthName, shortDate, projectMonth, splitSpend, dailyWork,
  providerOfModel, isPersonal, agents, repoTotals, accuracyNotes, buildSpaces, mergeCurrent, stripPersonal, modelBreakdown, EXPORT_JQ,
} from "./model.js";
import { TEXT, Panel, PanelHeader, Chip, Section, Bar, StackedBar, Swatch, Spark, Stat, Approx, Link, IconButton, Message, Busy } from "./ui.js";

const FETCH_EVERY = 60000; // codeburn is fast (~0.5s/call); 60s keeps the panel fresh without hammering it
const STALE_AFTER = 180000;

// codeburn (codeburn/README.md) is installed through mise as a global npm
// package. Herdr's own process doesn't source the shell profile that puts
// mise on PATH — `herdr.exec("codeburn", ...)` fails with ENOENT even though
// a terminal finds it fine — so PATH is extended by hand with mise's own bin
// dir. The shim at ~/.local/share/mise/shims/codeburn isn't reliable across
// machines either: Omen's mise has no global version pinned for it ("No
// version is set for shim: codeburn") even though the shim file exists,
// while `mise exec npm:codeburn -- codeburn ...` resolves the installed
// version directly regardless of any shim/version-pin state. Verified
// against both machines directly over SSH before relying on it here.
const PATH_PREFIX = 'PATH="$HOME/.local/bin:$PATH"';
const RUN = "mise exec npm:codeburn -- codeburn";
const STATUS_SH = `${PATH_PREFIX}; ${RUN} status --format menubar-json --scope combined --combined-details --no-optimize --period "$1"`;
// Same call with no --scope, so it never recurses into fetching other paired
// devices: this is the call made directly on each remote device (see
// fetchRemoteCurrent) to get that device's own un-sanitized data — codeburn
// strips branch names, project paths and live sessions from what a device
// shares with its peers (sanitizeForSharing in codeburn's own source), so
// those three things are only ever accurate read straight from the device
// that has them.
const LOCAL_STATUS_SH = `${PATH_PREFIX}; ${RUN} status --format menubar-json --no-optimize --period "$1"`;

// Slims a codeburn export to disk, then jq's it down to what the panel needs
// (cost per repo, cost per completed session, and the last few minutes of
// per-call records for live burn rate) before it ever reaches JS — a raw
// export over real history is tens of megabytes.
const EXPORT_SH = `${PATH_PREFIX}
f=$(mktemp -t codeburn).json
trap 'rm -f "$f"' EXIT
${RUN} export --format json --from "$1" --to "$2" -o "$f" >/dev/null && jq -c --argjson personal "$3" --arg cutoff "$4" "$5" "$f"`;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function rangeFrom(period, today) {
  if (period === "today") return fmtDate(today);
  if (period === "week") return fmtDate(addDays(today, -6));
  if (period === "30days") return fmtDate(addDays(today, -29));
  if (period === "month") return fmtDate(new Date(today.getFullYear(), today.getMonth(), 1));
  return "2000-01-01"; // all
}

function firstLine(s) {
  return (s ?? "").trim().split("\n")[0] || null;
}

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function showing() {
  const panel = find(layout(), "panel");
  return find(layout(), "panel-body")?.active === "codeburn" && panel?.hidden !== true;
}

export default class CodeBurn extends View {
  init(_props, cx) {
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    if (!enabled.includes("codeburn")) setShared("workspace.panels", [...enabled, "codeburn"]);
    this.period = "today";
    this.range = null;
    this.month = null;
    this.slim = null;
    this.error = null;
    this.loading = false;
    this.lastFetch = 0;
    this.wasVisible = false;
    this.flipped = new Set(); // ids whose expand state differs from the default (active space open, others closed)
    this.showQuiet = false;
    this.tick(cx);
    cx.timer.every(1000, (cx) => this.tick(cx));
  }

  tick(cx) {
    const visible = showing();
    // !this.loading matters because lastFetch stays unchanged while a fetch is
    // in flight: without this guard, a slow or hanging codeburn call gets a
    // fresh set of 3 processes launched every second on top of it.
    if (visible && !this.loading && (!this.wasVisible || Date.now() - this.lastFetch > FETCH_EVERY)) this.fetch(cx);
    if (visible !== this.wasVisible) cx.notify();
    this.wasVisible = visible;
  }

  setPeriod(period, cx) {
    if (period === this.period) return;
    this.period = period;
    this.lastFetch = 0;
    cx.notify();
    this.fetch(cx);
  }

  toggleSpace(id, cx) {
    if (this.flipped.has(id)) this.flipped.delete(id);
    else this.flipped.add(id);
    cx.notify();
  }

  isOpen(id, activeId) {
    return (id === activeId) !== this.flipped.has(id);
  }

  fetch(cx) {
    const period = this.period;
    this.loading = true;
    cx.notify();
    cx.spawn(async (cx) => {
      const today = new Date();
      const from = rangeFrom(period, today);
      const to = fmtDate(today);
      const cutoff = new Date(Date.now() - 10 * 60000).toISOString();
      const [rangeR, monthR] = await Promise.all([
        exec("sh", ["-c", STATUS_SH, "sh", period], { timeout: 30000 }).catch((e) => ({ code: 1, stderr: String(e) })),
        period === "month" ? Promise.resolve(null) : exec("sh", ["-c", STATUS_SH, "sh", "month"], { timeout: 30000 }).catch((e) => ({ code: 1, stderr: String(e) })),
      ]);
      if (this.period !== period) return; // stale: range chip moved on while this was in flight
      // lastFetch is set on every path below, success or failure: tick()'s
      // retry gate reads it unconditionally, so a persistent failure without
      // this would retry every second instead of waiting FETCH_EVERY.
      if (rangeR.code !== 0) {
        this.error = firstLine(rangeR.stderr) ?? "codeburn unavailable";
        this.lastFetch = Date.now();
        this.loading = false;
        cx.notify();
        return;
      }
      let range;
      try {
        range = JSON.parse(rangeR.stdout);
      } catch {
        this.error = "codeburn status: unreadable output";
        this.lastFetch = Date.now();
        this.loading = false;
        cx.notify();
        return;
      }
      this.error = null;
      // codeburn's combined/shared payload deliberately strips branch names,
      // project paths and live sessions from what a device shares with its
      // peers (sanitizeForSharing in codeburn's own source) — a remote
      // device's spaces and live agents are invisible to Spaces otherwise.
      // Fetched straight from the device, in parallel, with the range call
      // already in hand so we know which devices are even paired. A device
      // that's unreachable, isn't named the same as its herdr machine id, or
      // doesn't have codeburn installed just falls back to the already-fetched
      // sanitized data (aggregate cost/tokens/models only, no branch/project
      // detail, no live agents from it).
      const remoteDevices = (range.combinedDevices ?? []).filter((d) => !d.local);
      // codeburn export only ever covers this machine, so "personal" here
      // means this machine's own PERSONAL entries — found from the local
      // device's own name, now that `range` says what codeburn calls it.
      const localDeviceName = range.combinedDevices?.find((d) => d.local)?.name ?? "";
      const personalProviders = PERSONAL.filter((p) => p.device.test(localDeviceName)).map((p) => p.provider);
      const [remoteResults, exportR] = await Promise.all([
        Promise.all(remoteDevices.map(async (d) => {
          try {
            const r = await exec("sh", ["-c", LOCAL_STATUS_SH, "sh", period], { on: d.name, timeout: 30000 });
            return r.code === 0 ? JSON.parse(r.stdout) : null;
          } catch {
            return null;
          }
        })),
        exec("sh", ["-c", EXPORT_SH, "sh", from, to, JSON.stringify(personalProviders), cutoff, EXPORT_JQ], { timeout: 30000 }).catch((e) => ({ code: 1, stderr: String(e) })),
      ]);
      range.combinedDevices = (range.combinedDevices ?? []).map((d) => {
        if (d.local) return d;
        const fresh = remoteResults[remoteDevices.indexOf(d)];
        if (!fresh) return d;
        return { ...d, payload: { ...d.payload, current: fresh.current ?? d.payload?.current, liveSessions: fresh.liveSessions ?? d.payload?.liveSessions } };
      });
      if (this.period !== period) return; // stale: range chip moved on while the remote enrichment was in flight
      this.range = range;
      if (period === "month") this.month = this.range;
      else if (monthR?.code === 0) {
        try { this.month = JSON.parse(monthR.stdout); } catch { /* keep the previous month figure over a one-off parse failure */ }
      }
      if (exportR.code === 0 && exportR.stdout.trim()) {
        try { this.slim = JSON.parse(exportR.stdout); } catch { /* keep the previous slim data over a one-off parse failure */ }
      }
      this.lastFetch = Date.now();
      this.loading = false;
      cx.notify();
    });
  }

  render(cx) {
    const t = theme();
    const root = Panel("codeburn")
      .child(PanelHeader()
        .child(div().font_semibold().child("Code Burn"))
        .child(div().flex_1())
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(this.lastFetch ? (this.loading ? "refreshing…" : ago(Date.now() - this.lastFetch)) : ""))
        .child(IconButton({ id: "codeburn-refresh", icon: "refresh", label: "Refresh", spinning: this.loading, onClick: (cx) => this.fetch(cx) })));

    const chips = h_flex().id("codeburn-chips").flex_none().px(14).py(8).gap(6)
      .children(RANGES.map((r) => Chip({ id: `codeburn-chip-${r.period}`, label: r.label, on: this.period === r.period, onClick: (cx) => this.setPeriod(r.period, cx) })));

    if (!this.range && !this.error) return root.child(chips).child(Busy("Loading…"));

    if (this.error) {
      return root.child(chips).child(v_flex().flex_1().min_h(0).items_center().justify_center().gap(8)
        .child(Message(this.error, true))
        .child(Link({ id: "codeburn-retry", label: "Retry", onClick: (cx) => this.fetch(cx) })));
    }

    const monthDevices = this.month?.combinedDevices ?? [];
    const rangeDevices = this.range?.combinedDevices ?? [];
    // Personal spend (model.js's PERSONAL table) is stripped before anything
    // else sees these devices, so it never shows up in Totals, Models,
    // cache-hit rate, Spaces, or Projects — this panel is about work (Vertex)
    // spend. combined.combined only has coarse totals (no per-model/-project
    // /-branch breakdown), so those are built by merging every paired
    // device's own `current` block instead of reading just this one.
    const current = mergeCurrent(stripPersonal(rangeDevices));

    const split = splitSpend(monthDevices);
    const daily = dailyWork(monthDevices, 30);
    const projected = projectMonth(split.work);
    const now = new Date();
    const monthLabel = monthName(now).toUpperCase();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthUnpriced = mergeCurrent(monthDevices).unpricedModels;
    const headlineNotes = accuracyNotes({ providers: split.providers, unpriced: monthUnpriced, unclassified: daily.unclassified });

    // Same reasoning as above: a personal agent doesn't attach to a space,
    // doesn't carry a marker, and doesn't contribute a $/h anywhere.
    const liveSessions = rangeDevices.flatMap((d) => (d.payload?.liveSessions?.sessions ?? []).filter((s) => !isPersonal(d.name, s.provider)));
    const agentsList = agents(liveSessions, this.slim ?? { sessions: [], recent: [] });
    // The local export is uncapped (every repo this machine touched); a
    // remote device only has its own `topProjects` (capped, and only
    // populated when fetched directly — see fetch()'s remote enrichment), so
    // the two are merged rather than either alone.
    const repos = repoTotals(this.slim ?? { projects: [] });
    for (const d of rangeDevices) {
      if (d.local) continue;
      for (const p of d.payload?.current?.topProjects ?? []) repos.set(p.name, (repos.get(p.name) ?? 0) + p.cost);
    }
    const targets = shared("deploys.targets");
    const activeId = spaces().find((s) => s.active)?.id;
    const spacesResult = buildSpaces({ targets, activeId, byBranch: current.byBranch ?? [], agents: agentsList, repos, rangeCost: current.cost ?? 0 });

    const body = v_flex().id("codeburn-body").flex_1().min_h(0).overflow_y_scrollbar().px(14).pb(12).gap(10)
      .when(Date.now() - this.lastFetch > STALE_AFTER, (el) => el.opacity(0.6));

    // Headline: Vertex (work) spend this month, projected, and a 30-day trend.
    body.child(v_flex().flex_none().gap(4)
      .child(Section(`VERTEX · ${monthLabel}`, Approx(headlineNotes)))
      .child(h_flex().items_baseline().gap(8)
        .child(div().font_semibold().text_size(18).child(money(split.work)))
        .child(div().text_size(TEXT.small).text_color(t.dim).child(`projected ${money(projected)} by ${shortDate(monthEnd)}`)))
      .child(Spark(daily.series)));

    // Spaces: every herdr space that has an open PR/branch, its live agents, and its burn rate.
    const rangeCost = current.cost || 0.01; // percentage denominator; avoids divide-by-zero before any spend exists
    body.child(v_flex().flex_none().gap(4)
      .child(Section(`SPACES · ${spacesResult.rows.length + spacesResult.quiet.count + (spacesResult.other ? 1 : 0)}`, div().text_size(TEXT.caption).text_color(t.dim).child(`${spacesResult.live} agents live · ${money(spacesResult.rate)}/h`)))
      .children(spacesResult.rows.map((row) => this.spaceBlock(row, activeId, rangeCost, t)))
      .when(spacesResult.quiet.count > 0, (el) => el.child(this.quietBlock(spacesResult.quiet, rangeCost, t)))
      .when(Boolean(spacesResult.other), (el) => el.child(this.spaceBlock(spacesResult.other, activeId, rangeCost, t))));

    // Totals for the selected range.
    body.child(v_flex().flex_none().gap(6)
      .child(h_flex().gap(12).child(Stat("Total tokens", tokens((current.inputTokens ?? 0) + (current.outputTokens ?? 0) + (current.cacheReadTokens ?? 0) + (current.cacheWriteTokens ?? 0)))).child(Stat("Input", tokens(current.inputTokens))).child(Stat("Output", tokens(current.outputTokens))))
      .child(h_flex().gap(12).child(Stat("Cache read", tokens(current.cacheReadTokens))).child(Stat("Requests", String(current.calls ?? 0))).child(Stat("Cost", money(current.cost))))
      .child(h_flex().gap(8).items_center()
        .child(div().flex_1().child(Bar((current.cacheHitPercent ?? 0) / 100, t.ansi2)))
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(`${(current.cacheHitPercent ?? 0).toFixed(1)}%`))));

    // Models for the selected range: one stacked bar showing every model's
    // share of total cost (rank-colored, highest first, with a dim "Other"
    // segment for anything past the top 10 or outside topModels entirely),
    // then a row per model with the same rank color as its segment and its
    // percentage in place of a per-row bar.
    const breakdown = modelBreakdown(current.topModels ?? [], current.cost ?? 0);
    const models = (current.topModels ?? []).slice(0, 10);
    const other = breakdown.find((b) => b.color === null);
    body.child(v_flex().flex_none().gap(4)
      .child(Section("MODELS"))
      .child(StackedBar(breakdown))
      .children(models.map((m, i) => {
        const approx = Approx(accuracyNotes({ providers: new Set([providerOfModel(m.name)]), unpriced: [], unclassified: 0 }));
        return h_flex().flex_none().gap(6).items_center().py(2)
          .child(Swatch(breakdown[i]?.color))
          .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).child(m.name))
          .when(Boolean(approx), (el) => el.child(approx))
          .child(div().w(50).text_size(TEXT.caption).text_color(t.dim).child(String(m.calls ?? 0)))
          .child(div().w(70).text_size(TEXT.caption).text_color(t.dim).child(tokens((m.inputTokens ?? 0) + (m.outputTokens ?? 0) + (m.cacheReadTokens ?? 0) + (m.cacheWriteTokens ?? 0))))
          .child(div().w(70).text_size(TEXT.caption).text_color(t.foreground).child(money(m.cost)))
          .child(div().w(36).text_right().text_size(TEXT.caption).text_color(t.dim).child(`${Math.round(breakdown[i]?.percent ?? 0)}%`));
      }))
      .when(Boolean(other), (el) => el.child(h_flex().flex_none().gap(6).items_center().py(2)
        .child(Swatch(null))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).text_color(t.dim).child("Other"))
        .child(div().w(70).text_size(TEXT.caption).text_color(t.dim).child(money(other?.cost)))
        .child(div().w(36).text_right().text_size(TEXT.caption).text_color(t.dim).child(`${Math.round(other?.percent ?? 0)}%`)))));

    const projects = current.topProjects ?? [];
    body.child(v_flex().flex_none().gap(2)
      .child(Section("PROJECTS"))
      .children(projects.map((p) => h_flex().flex_none().gap(6).items_center().py(2)
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).child(p.name))
        .child(div().w(50).text_size(TEXT.caption).text_color(t.dim).child(String(p.sessions ?? 0)))
        .child(div().w(70).text_size(TEXT.caption).text_color(t.foreground).child(money(p.cost))))));

    const footer = h_flex().flex_none().px(14).h(28).items_center().border_t(1).border_color(t.border)
      .child(div().text_size(TEXT.caption).text_color(t.dim).child(`${rangeDevices.length || 1} device${rangeDevices.length === 1 ? "" : "s"} · via codeburn`));

    return root.child(chips).child(body).child(footer);
  }

  spaceBlock(row, activeId, rangeCost, t) {
    const open = this.isOpen(row.id, activeId);
    const workingCount = row.agents.filter((a) => !a.idle).length;
    const idleCount = row.agents.filter((a) => a.idle).length;
    const marker = row.agents.length ? "*".repeat(workingCount) + "o".repeat(idleCount) : "-";
    return v_flex().id(`codeburn-space-${row.id}`).flex_none()
      .child(h_flex().id(`codeburn-space-row-${row.id}`).min_h(26).gap(8).items_center().cursor_pointer()
        .hover((s) => s.bg(t.hover)).on_click((_e, cx) => this.toggleSpace(row.id, cx))
        .child(div().w(14).text_size(TEXT.small).text_color(row.active ? t.foreground : t.dim).child(row.active ? ">" : ""))
        .child(div().w(18).text_size(TEXT.caption).text_color(t.working).child(marker))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).child(`${row.repo}${row.branch ? "  " + row.branch : ""}`))
        .when(row.shared, (el) => el.child(div().text_size(TEXT.caption).text_color(t.dim).child("repo")))
        .when(row.rate > 0, (el) => el.child(div().text_size(TEXT.caption).text_color(t.dim).child(`${money(row.rate)}/h`)))
        .child(div().w(36).text_right().text_size(TEXT.caption).text_color(t.dim).child(`${Math.round((row.cost / rangeCost) * 100)}%`))
        .child(div().w(70).text_right().text_size(TEXT.small).text_color(t.foreground).child(money(row.cost))))
      .when(open && row.agents.length > 0, (el) => el.children(row.agents.map((a) => this.agentRow(a, t))));
  }

  agentRow(a, t) {
    return h_flex().id(`codeburn-agent-${a.id}`).pl(32).pr(8).min_h(20).gap(8).items_center()
      .child(div().w(80).truncate().text_size(TEXT.caption).text_color(t.muted).child(a.model ?? "-"))
      .child(div().w(50).child(Bar(a.fill, t.accent)))
      .child(div().w(30).text_size(TEXT.caption).text_color(t.dim).child(`${Math.round(a.fill * 100)}%`))
      .child(div().flex_1().text_size(TEXT.caption).text_color(t.dim).child(a.idle ? `idle ${Math.floor(a.idleSeconds / 60)}m` : `${money(a.rate)}/h`))
      .child(div().text_size(TEXT.caption).text_color(t.dim).child(`sess ${money(a.sessionCost)}`));
  }

  quietBlock(quiet, rangeCost, t) {
    if (this.showQuiet) {
      return v_flex().id("codeburn-quiet").flex_none()
        .children(quiet.rows.map((row) => this.spaceBlock(row, null, rangeCost, t)))
        .child(this.quietToggle(quiet, t, "hide"));
    }
    return this.quietToggle(quiet, t, "show");
  }

  quietToggle(quiet, t, verb) {
    return h_flex().id("codeburn-quiet-toggle").min_h(24).gap(8).items_center().cursor_pointer()
      .hover((s) => s.bg(t.hover)).on_click((_e, cx) => { this.showQuiet = !this.showQuiet; cx.notify(); })
      .child(div().flex_1().text_size(TEXT.caption).text_color(t.dim).child(`+ ${quiet.count} quiet space${quiet.count === 1 ? "" : "s"}  ${money(quiet.cost)}`))
      .child(Link({ id: "codeburn-quiet-link", label: `[${verb}]`, onClick: (cx) => { this.showQuiet = !this.showQuiet; cx.notify(); } }));
  }
}
