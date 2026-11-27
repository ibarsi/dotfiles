// Reopen popup: lists agent sessions (Claude Code, Codex, Antigravity CLI)
// that no longer run, on every machine, and resumes one in its own space on
// its own machine. Opened with ctrl-space u (keys.json). Nothing runs while
// it is closed: each open runs MACHINE_SCRIPT once on each machine.
//
// Placement: mod.json overlays only take "at": "top"/pointer, and the herdr
// API gives no window size. So mod.open first shows a 1 px launcher copy that
// reads window.viewport_size() in render, then opens the real popup at the
// bottom right with openOverlay and closes itself.
//
// The list uses the search mod's fixed-pixel rows at manual scroll offsets:
// overflow_y_scrollbar() does not cap a popup's height here (see search/main.js).

import { View, div, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { machines, spaces, panes, exec, hc, run, theme, props, openOverlay, closeOverlay } from "herdr";
import { MACHINE_SCRIPT, buildRows, filterRows, ago, resumeArgv } from "./sessions.js";

const POPUP_W = 400;
const POPUP_H = 500;
const MARGIN = 16;
const LIST_H = 360;
const ROW_H = 44;
const ICONS = { claude: "icons/claude.svg", codex: "icons/codex.svg", agy: "icons/antigravity.svg" };
const machineLabel = (m) => m ?? "This Mac";

export default class Reopen extends View {
  init(_props, cx) {
    this.launcher = props()?.view !== "list";
    if (this.launcher) return;
    this.results = [];
    this.finished = [];
    this.loading = new Set();
    this.rowError = new Map();
    this.busy = false;
    this.sel = 0;
    this.scroll = 0;
    this.query = "";
    this.input = InputState.new({ placeholder: "Filter by title, folder or space…" });
    this.input.on("change", (_e, cx) => { this.query = this.input.value(); this.sel = 0; cx.notify(); });
    this.input.on("submit", (_e, cx) => this.resume(this.visibleRows()[this.sel], cx));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
    this.load(cx);
  }

  load(cx) {
    cx.spawn(async (cx) => {
      try {
        const r = await hc(["ls", "--all", "--json"]);
        if (r.code === 0) this.finished = (JSON.parse(r.stdout).terminals || []).filter((t) => t.state === "finished");
      } catch { /* "where" is optional */ }
      cx.notify();
    });
    for (const m of machines()) {
      const name = m.name ?? null;
      if (m.layout !== "ready") { this.results.push({ machine: name, error: `${machineLabel(name)} is offline` }); continue; }
      this.loading.add(name);
      cx.spawn(async (cx) => {
        try {
          const r = await exec("sh", ["-c", MACHINE_SCRIPT], { on: name, timeout: 10000 });
          this.results.push(r.code === 0 ? { machine: name, stdout: r.stdout } : { machine: name, error: r.stderr.trim() || `exit ${r.code}` });
        } catch (e) {
          this.results.push({ machine: name, error: String(e?.message ?? e) });
        }
        this.loading.delete(name);
        cx.notify();
      });
    }
  }

  rows() {
    return buildRows(this.results, spaces(), panes(), this.finished, Date.now());
  }

  visibleRows() {
    return filterRows(this.rows().rows, this.query);
  }

  close() {
    if (props()?.overlay) closeOverlay(props().overlay);
  }

  // Checks the folder on the session's machine, then opens the exact resume in
  // a new tab of its space (or a new space there). The popup closes on success.
  resume(row, cx) {
    if (!row || this.busy) return;
    this.busy = true;
    cx.spawn(async (cx) => {
      const key = `${row.machine}/${row.id}`;
      try {
        const t = await exec("test", ["-d", row.cwd], { on: row.machine, timeout: 10000 });
        if (t.code === 0) {
          const argv = resumeArgv(row);
          if (row.space) run("tab.new", { space: row.space.id, folder: row.cwd, argv });
          else run("space.new", { folder: row.cwd, machine: row.machine, argv });
          this.busy = false;
          return this.close();
        }
        this.rowError.set(key, "Folder is gone");
      } catch (e) {
        this.rowError.set(key, String(e?.message ?? e));
      }
      this.busy = false;
      cx.notify();
    });
  }

  renderLauncher(cx) {
    if (!this.opened && props()?.overlay) { // no overlay during `herdr-app check`
      this.opened = true;
      const { width, height } = window.viewport_size();
      const x = Math.max(0, width - POPUP_W - MARGIN);
      const y = Math.max(0, height - POPUP_H - MARGIN);
      cx.timer.after(0, () => {
        closeOverlay(props().overlay);
        openOverlay({ mod: "reopen", props: { view: "list" }, kind: "popup", at: { x, y }, width: POPUP_W, height: POPUP_H });
      });
    }
    return div().size(1);
  }

  render(cx) {
    if (this.launcher) return this.renderLauncher(cx);
    const t = theme();
    const { rows: all, errors } = this.rows(); // parse once per render
    const rows = filterRows(all, this.query);
    this.sel = rows.length ? Math.min(this.sel, rows.length - 1) : 0;
    const now = Date.now();

    const tops = rows.map((_, i) => i * ROW_H);
    const y = rows.length * ROW_H;
    const fixed = y > LIST_H;
    const maxScroll = Math.max(0, y - LIST_H);
    if (rows.length) {
      if (tops[this.sel] < this.scroll) this.scroll = tops[this.sel];
      if (tops[this.sel] + ROW_H > this.scroll + LIST_H) this.scroll = tops[this.sel] + ROW_H - LIST_H;
    }
    this.scroll = Math.max(0, Math.min(this.scroll, maxScroll));
    const place = (el, i) => (fixed ? el.absolute().left(0).right(0).top(tops[i] - this.scroll).h(ROW_H) : el);
    const visible = (i) => !fixed || (tops[i] + ROW_H > this.scroll && tops[i] < this.scroll + LIST_H);

    const row = (r, i) => {
      const err = this.rowError.get(`${r.machine}/${r.id}`);
      const place = r.space ? r.space.name : "No space";
      const where = r.where && !r.where.startsWith(`${place} /`) ? ` (was ${r.where})` : "";
      return h_flex().id(`reopen-${r.machine}-${r.id}`).h(ROW_H).px(8).gap(8).items_center().rounded(6).cursor_pointer()
        .when(i === this.sel, (el) => el.bg(t.hover))
        .hover((s) => s.bg(t.hover))
        .on_click((_e, cx) => { this.sel = i; this.resume(r, cx); })
        .child(image(ICONS[r.tool]).size(14).flex_none())
        .child(v_flex().flex_1().min_w(0).gap(1)
          .child(div().truncate().text_size(12).text_color(t.foreground).child(r.title))
          .child(div().truncate().text_size(10).text_color(err ? t.blocked : t.dim)
            .child(err ?? `${place}${where} · ${machineLabel(r.machine)} · ${ago(r.stoppedAt, now)}`)));
    };

    const status = this.loading.size
      ? `Reading ${[...this.loading].map(machineLabel).join(", ")}…`
      : errors.map((e) => `${machineLabel(e.machine)}: ${e.error}`).join(" · ");

    return v_flex().id("reopen").track_focus(this.handle).w(POPUP_W).h(POPUP_H).p(10).gap(8).bg(t.popover).text_size(12)
      .on_key_down((e, cx) => {
        if (e.key === "escape") return this.close();
        if (e.key === "down") this.sel = rows.length ? (this.sel + 1) % rows.length : 0;
        else if (e.key === "up") this.sel = rows.length ? (this.sel + rows.length - 1) % rows.length : 0;
        else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(h_flex().h(24).items_center()
        .child(div().flex_1().text_size(13).font_semibold().text_color(t.foreground).child("Reopen agents"))
        .child(div().id("reopen-close").px(6).text_color(t.dim).cursor_pointer().on_click(() => this.close()).child("×")))
      .child(h_flex().h(30).px(8).items_center().rounded(6).border_1().border_color(t.accent).bg(t.background)
        .child(Input.new(this.input).flex_1().min_w(0).h_full().text_size(12).text_color(t.foreground)))
      .child(rows.length
        ? v_flex().id("reopen-list").h(LIST_H).min_h(0).flex_none()
            .when(fixed, (el) => el.overflow_hidden().on_scroll_wheel((e, cx) => {
              this.scroll = Math.max(0, Math.min(this.scroll - e.delta.y, maxScroll));
              cx.notify();
            }))
            .children(rows.map((r, i) => (visible(i) ? place(row(r, i), i) : null)).filter(Boolean))
        : v_flex().h(LIST_H).items_center().justify_center().text_color(t.dim)
            .child(this.loading.size ? "Reading sessions…" : "Nothing to reopen"))
      .child(h_flex().flex_none().pt(6).border_t(1).border_color(t.border).text_size(10).text_color(t.dim)
        .child(div().flex_1().truncate().child(status || "↵ Resume    esc Close"))
        .child(div().flex_none().child(`${rows.length} session${rows.length === 1 ? "" : "s"}`)));
  }
}
