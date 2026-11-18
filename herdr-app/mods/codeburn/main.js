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
  providerOfModel, agents, repoTotals, accuracyNotes, buildSpaces, mergeCurrent, EXPORT_JQ,
} from "./model.js";
import { TEXT, Panel, PanelHeader, Chip, Section, Bar, Spark, Stat, Approx, Link, IconButton, Message, Busy } from "./ui.js";

const FETCH_EVERY = 60000; // codeburn is fast (~0.5s/call); 60s keeps the panel fresh without hammering it
const STALE_AFTER = 180000;

// codeburn (codeburn/README.md) is installed through mise as a global npm
// package, so it only exists as a shim at ~/.local/share/mise/shims/codeburn
// (same path on macOS and Omarchy: mise's default XDG data dir). Herdr's own
// process doesn't source the shell profile that puts mise's shims on PATH —
// `herdr.exec("codeburn", ...)` fails with ENOENT even though a terminal
// finds it fine — so every call here runs through `sh -c` with that
// directory prefixed onto PATH.
const MISE_PATH_PREFIX = 'PATH="$HOME/.local/share/mise/shims:$PATH"';
const STATUS_SH = `${MISE_PATH_PREFIX} codeburn status --format menubar-json --scope combined --combined-details --no-optimize --period "$1"`;

// Slims a codeburn export to disk, then jq's it down to what the panel needs
// (cost per repo, cost per completed session, and the last few minutes of
// per-call records for live burn rate) before it ever reaches JS — a raw
// export over real history is tens of megabytes.
const EXPORT_SH = `${MISE_PATH_PREFIX}
f=$(mktemp -t codeburn).json
trap 'rm -f "$f"' EXIT
codeburn export --format json --from "$1" --to "$2" -o "$f" >/dev/null && jq -c --arg cutoff "$3" "$4" "$f"`;

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
      const [rangeR, monthR, exportR] = await Promise.all([
        exec("sh", ["-c", STATUS_SH, "sh", period], { timeout: 30000 }).catch((e) => ({ code: 1, stderr: String(e) })),
        period === "month" ? Promise.resolve(null) : exec("sh", ["-c", STATUS_SH, "sh", "month"], { timeout: 30000 }).catch((e) => ({ code: 1, stderr: String(e) })),
        exec("sh", ["-c", EXPORT_SH, "sh", from, to, cutoff, EXPORT_JQ], { timeout: 30000 }).catch((e) => ({ code: 1, stderr: String(e) })),
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
    // combined.combined only has coarse totals (no per-model/-project/-branch
    // breakdown), so Totals/Models/Projects/Spaces are built by merging every
    // paired device's own `current` block instead of reading just this one.
    const current = mergeCurrent(rangeDevices);

    const split = splitSpend(monthDevices);
    const daily = dailyWork(monthDevices, 30);
    const projected = projectMonth(split.work);
    const now = new Date();
    const monthLabel = monthName(now).toUpperCase();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthUnpriced = mergeCurrent(monthDevices).unpricedModels;
    const headlineNotes = accuracyNotes({ providers: split.providers, unpriced: monthUnpriced, unclassified: daily.unclassified });

    const liveSessions = rangeDevices.flatMap((d) => d.payload?.liveSessions?.sessions ?? []);
    const agentsList = agents(liveSessions, this.slim ?? { sessions: [], recent: [] });
    const repos = repoTotals(this.slim ?? { projects: [] });
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
      .child(Spark(daily.series))
      .when(split.personal > 0.005, (el) => el.child(h_flex().gap(6).items_center()
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(`Personal (${PERSONAL.map((p) => p.provider).join(", ")})`))
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(`${money(split.personal)} at API rates`)))));

    // Spaces: every herdr space that has an open PR/branch, its live agents, and its burn rate.
    const allSpaceRows = [...spacesResult.rows, ...spacesResult.quiet.rows, ...(spacesResult.other ? [spacesResult.other] : [])];
    const maxSpaceCost = Math.max(0.01, ...allSpaceRows.map((r) => r.cost ?? 0));
    body.child(v_flex().flex_none().gap(4)
      .child(Section(`SPACES · ${spacesResult.rows.length + spacesResult.quiet.count + (spacesResult.other ? 1 : 0)}`, div().text_size(TEXT.caption).text_color(t.dim).child(`${spacesResult.live} agents live · ${money(spacesResult.rate)}/h`)))
      .children(spacesResult.rows.map((row) => this.spaceBlock(row, activeId, maxSpaceCost, t)))
      .when(spacesResult.quiet.count > 0, (el) => el.child(this.quietBlock(spacesResult.quiet, maxSpaceCost, t)))
      .when(Boolean(spacesResult.other), (el) => el.child(this.spaceBlock(spacesResult.other, activeId, maxSpaceCost, t))));

    // Totals for the selected range.
    body.child(v_flex().flex_none().gap(6)
      .child(h_flex().gap(12).child(Stat("Total tokens", tokens((current.inputTokens ?? 0) + (current.outputTokens ?? 0) + (current.cacheReadTokens ?? 0) + (current.cacheWriteTokens ?? 0)))).child(Stat("Input", tokens(current.inputTokens))).child(Stat("Output", tokens(current.outputTokens))))
      .child(h_flex().gap(12).child(Stat("Cache read", tokens(current.cacheReadTokens))).child(Stat("Requests", String(current.calls ?? 0))).child(Stat("Cost", money(current.cost))))
      .child(h_flex().gap(8).items_center()
        .child(div().flex_1().child(Bar((current.cacheHitPercent ?? 0) / 100, t.ansi2)))
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(`${(current.cacheHitPercent ?? 0).toFixed(1)}%`))));

    // Models and projects for the selected range.
    const models = (current.topModels ?? []).slice(0, 10);
    const maxModelCost = Math.max(0.01, ...models.map((m) => m.cost ?? 0));
    body.child(v_flex().flex_none().gap(2)
      .child(Section("MODELS"))
      .children(models.map((m) => {
        const approx = Approx(accuracyNotes({ providers: new Set([providerOfModel(m.name)]), unpriced: [], unclassified: 0 }));
        return v_flex().flex_none().gap(2).py(2)
          .child(h_flex().gap(6).items_center()
            .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).child(m.name))
            .when(Boolean(approx), (el) => el.child(approx))
            .child(div().w(50).text_size(TEXT.caption).text_color(t.dim).child(String(m.calls ?? 0)))
            .child(div().w(70).text_size(TEXT.caption).text_color(t.dim).child(tokens((m.inputTokens ?? 0) + (m.outputTokens ?? 0) + (m.cacheReadTokens ?? 0) + (m.cacheWriteTokens ?? 0))))
            .child(div().w(70).text_size(TEXT.caption).text_color(t.foreground).child(money(m.cost))))
          .child(Bar((m.cost ?? 0) / maxModelCost, t.accent));
      })));

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

  spaceBlock(row, activeId, maxSpaceCost, t) {
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
        .child(div().w(36).child(Bar(row.cost / maxSpaceCost, t.accent)))
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

  quietBlock(quiet, maxSpaceCost, t) {
    if (this.showQuiet) {
      return v_flex().id("codeburn-quiet").flex_none()
        .children(quiet.rows.map((row) => this.spaceBlock(row, null, maxSpaceCost, t)))
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
