// Search popup: find a live terminal, on this computer or Omen, by name,
// cwd, visible screen text or scrollback. Opened with ctrl-space / (keys.json).
// Cmd-P keeps the stock picker (names only); this adds text search on top,
// read fresh every time the popup opens — measured fast enough that no
// cache or background sweep is needed (see the design doc).
//
// Root and the results list have an explicit pixel size (never w_full()/
// flex_1()/overflow_y_scrollbar() alone): a raw scrollback line can be
// thousands of chars with no spaces, and a flex child without a hard width/
// min_w(0) grows to fit that instead of truncating it, which blew the popup
// up to nearly the window's width the first time this was wired up.
// overflow_y_scrollbar() also turned out not to actually cap an element's
// own height here (it still grows to content), so the results list uses the
// stock picker mod's technique instead: a hard-capped container with rows
// placed at absolute, manually tracked scroll offsets. Proven in this exact
// codebase; see ~/.config/herdr-app/mods/picker/main.js.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { agents, terminals, panes, spaces, run, hc, theme, props, closeOverlay } from "herdr";
import { search, lineKind } from "./search.js";

const SCROLLBACK_LINES = "1000";
const MAX_RESULTS = 20;
const PREVIEW_CONTEXT = 9;
const PREVIEW_LINE_CAP = 300; // belt-and-suspenders ahead of search.js's own snippet() clipping
const POPUP_W = 860;
const LIST_W = 320;
const LIST_MAX_H = 440;
const EMPTY_H = 120;
const ROW_H = 46;
const HEADER_H = 29;
const MACHINE_COLORS = ["ansi3", "ansi4", "ansi5", "ansi2", "ansi1"];

// terminals() only reliably carries address/state/cwd; name/program live on
// the typed, documented spaces()/panes()/agents() instead (see design doc's
// note on what broke: a terminal's own "where" string the standalone `hc`
// CLI prints isn't actually a field on these objects).
function buildEntries() {
  const tabCtx = new Map();
  for (const w of spaces()) for (const tb of w.tabs) tabCtx.set(tb.id, { spaceName: w.name, tabName: tb.name });
  const paneByTerminal = new Map(panes().map((p) => [p.terminal, p]));
  const agentByAddress = new Map(agents().map((a) => [a.address, a]));

  return terminals()
    .filter((t) => t.state === "live")
    .map((t) => {
      const pane = paneByTerminal.get(t.address);
      const ctx = pane ? tabCtx.get(pane.tab) : null;
      const agent = agentByAddress.get(t.address);
      const cwd = t.cwd || pane?.cwd || "";
      const base = cwd.replace(/\/+$/, "").split("/").pop();
      const title = ctx?.spaceName || base || t.address;
      return {
        address: t.address,
        name: [title, agent?.program?.name].filter(Boolean).join(" "),
        cwd,
        screen: "",
        scrollback: "",
        title,
        status: agent?.status ?? null,
      };
    });
}

function machineOf(address) {
  return address.includes("/") ? address.split("/")[0] : null;
}

export default class Search extends View {
  init(_props, cx) {
    this.entries = buildEntries();
    this.pending = 0;
    this.sel = 0;
    this.query = "";
    this.scroll = 0;
    this.input = InputState.new({ placeholder: "Search terminals…" });
    this.input.on("change", (_e, cx) => {
      this.query = this.input.value();
      this.sel = 0;
      cx.notify();
    });
    this.input.on("submit", (_e, cx) => this.pick(this.hits()[this.sel], cx));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();

    for (const e of this.entries) {
      cx.spawn(async (cx) => {
        try {
          const r = await hc(["read", "--json", e.address]);
          if (r.code === 0) e.screen = JSON.parse(r.stdout).text ?? "";
        } catch {}
        cx.notify();
      });
      this.pending++;
      cx.spawn(async (cx) => {
        try {
          const r = await hc(["read", "--json", "--lines", SCROLLBACK_LINES, e.address]);
          if (r.code === 0) e.scrollback = JSON.parse(r.stdout).text ?? "";
        } catch {
        } finally {
          this.pending--;
          cx.notify();
        }
      });
    }
  }

  close() {
    closeOverlay(props().overlay);
  }

  hits() {
    return search(this.entries, this.query);
  }

  pick(hit, cx) {
    if (!hit) return;
    this.close();
    const isAgent = agents().some((a) => a.address === hit.address);
    run(isAgent ? "agent.focus" : "pane.focus", { terminal: hit.address });
  }

  render() {
    const t = theme();
    const allHits = this.hits();
    const hits = allHits.slice(0, MAX_RESULTS);
    this.sel = hits.length ? Math.min(this.sel, hits.length - 1) : 0;
    const sel = hits[this.sel] ?? null;
    const selEntry = sel ? this.entries.find((e) => e.address === sel.address) : null;

    // Group order: this computer first, then each remote machine in the
    // order its first hit appears. Counts reflect every match, not just the
    // MAX_RESULTS slice shown.
    const machines = [null, ...new Set(allHits.map((h) => machineOf(h.address)).filter(Boolean))];
    const machineColorOf = (m) => (m ? t[MACHINE_COLORS[machines.indexOf(m) % MACHINE_COLORS.length]] ?? t.accent : t.accent);
    const counts = Object.fromEntries(machines.map((m) => [m ?? "", allHits.filter((h) => machineOf(h.address) === m).length]));

    const statusDot = (status) => {
      if (!status) return null;
      const color = t[status] ?? t.dim;
      return div().size(6).flex_none().rounded_full().bg(color);
    };

    const snippetRow = (h) =>
      h_flex()
        .gap(6)
        .min_w(0)
        .items_center()
        .child(
          div()
            .flex_none()
            .px(5)
            .py(1)
            .rounded(4)
            .bg(t.hover)
            .text_size(10)
            .text_color(t.muted)
            .child(h.field),
        )
        .child(
          h_flex()
            .flex_1()
            .min_w(0)
            .overflow_hidden()
            .text_size(11)
            .text_color(t.dim)
            .child(div().truncate().child(h.line.slice(0, h.at)))
            .child(div().flex_none().text_color(t.accent).font_semibold().child(h.line.slice(h.at, h.at + h.len)))
            .child(div().truncate().child(h.line.slice(h.at + h.len))),
        );

    const row = (h, i) => {
      const e = this.entries.find((en) => en.address === h.address);
      const on = i === this.sel;
      return h_flex()
        .id(`search-row-${h.address}`)
        .px(10)
        .h(46)
        .min_w(0)
        .items_center()
        .gap(8)
        .rounded(7)
        .cursor_pointer()
        .when(on, (el) => el.bg(t.hover))
        .hover((s) => s.bg(t.hover))
        .on_click((_e, cx) => {
          this.sel = i;
          this.pick(h, cx);
        })
        .child(statusDot(e?.status) ?? div().size(6).flex_none())
        .child(
          v_flex()
            .flex_1()
            .min_w(0)
            .gap(1)
            .child(div().truncate().text_color(t.foreground).font_semibold().text_size(13).child(e?.title ?? h.address))
            .child(snippetRow(h)),
        );
    };

    const groupHeader = (m) =>
      h_flex()
        .px(10)
        .pt(10)
        .pb(3)
        .gap(6)
        .items_center()
        .text_size(11)
        .font_semibold()
        .text_color(t.dim)
        .child(div().size(8).flex_none().rounded_full().bg(machineColorOf(m)))
        .child(m ?? "This computer")
        .child(div().text_color(t.muted).child(String(counts[m ?? ""] ?? 0)));

    // One flat list of header/row items so they can be placed at absolute,
    // scroll-tracked offsets below (picker's technique: see the file header).
    const items = [];
    let lastMachine = "__none__";
    hits.forEach((h, i) => {
      const m = machineOf(h.address);
      if (m !== lastMachine) {
        items.push({ kind: "header", machine: m });
        lastMachine = m;
      }
      items.push({ kind: "row", hit: h, index: i });
    });
    const itemH = (it) => (it.kind === "header" ? HEADER_H : ROW_H);
    const tops = [];
    let y = 0;
    items.forEach((it) => {
      tops.push(y);
      y += itemH(it);
    });
    const total = y;
    const listBoxH = items.length ? Math.max(1, Math.min(LIST_MAX_H, total)) : EMPTY_H;
    // The preview always gets full room when there's something to show,
    // regardless of how short the list itself renders with few matches —
    // it has lines of scrollback to show, not just a handful of rows.
    const previewBoxH = items.length ? LIST_MAX_H : EMPTY_H;
    const fixed = total > listBoxH;
    const maxScroll = Math.max(0, total - listBoxH);
    this.scroll = Math.max(0, Math.min(this.scroll, maxScroll));
    const selItem = items.findIndex((it) => it.kind === "row" && it.index === this.sel);
    if (selItem >= 0) {
      if (tops[selItem] < this.scroll) this.scroll = tops[selItem];
      if (tops[selItem] + itemH(items[selItem]) > this.scroll + listBoxH) this.scroll = tops[selItem] + itemH(items[selItem]) - listBoxH;
    }
    const place = (el, i) =>
      fixed ? el.absolute().left(0).right(0).top(tops[i] - this.scroll).bottom(listBoxH - (tops[i] + itemH(items[i]) - this.scroll)) : el;
    const visible = (i) => !fixed || (tops[i] + itemH(items[i]) > this.scroll && tops[i] < this.scroll + listBoxH);
    const renderItem = (it) => (it.kind === "header" ? groupHeader(it.machine) : row(it.hit, it.index));

    // Readability heuristic over plain text, not real ANSI: hc read strips
    // color entirely and the mod API exposes no per-cell styling (see
    // search.js's lineKind comment).
    const KIND_COLOR = { add: t.done, remove: t.blocked, prompt: t.accent, error: t.blocked, ok: t.done };
    const previewLines = () => {
      if (!selEntry || !sel) return [];
      const text = selEntry.scrollback || selEntry.screen || "";
      if (!text) return [];
      const lines = text.split("\n").map((l) => (l.length > PREVIEW_LINE_CAP ? `${l.slice(0, PREVIEW_LINE_CAP)}…` : l));
      const word = sel.line.slice(sel.at, sel.at + sel.len).toLowerCase();
      const idx = word ? lines.findIndex((l) => l.toLowerCase().includes(word)) : -1;
      const from = idx >= 0 ? Math.max(0, idx - PREVIEW_CONTEXT) : 0;
      const to = idx >= 0 ? Math.min(lines.length, idx + PREVIEW_CONTEXT + 1) : Math.min(lines.length, PREVIEW_CONTEXT * 2);
      return lines.slice(from, to).map((l, k) => {
        const li = from + k;
        const color = KIND_COLOR[lineKind(l)] ?? (li === idx ? t.foreground : t.dim);
        if (li !== idx) return div().min_w(0).truncate().text_size(11).text_color(color).child(l || " ");
        const at = l.toLowerCase().indexOf(word);
        return h_flex()
          .min_w(0)
          .overflow_hidden()
          .text_size(11)
          .text_color(color)
          .child(div().truncate().child(l.slice(0, at)))
          .child(div().flex_none().px(2).rounded(3).bg(t.hover).text_color(t.foreground).child(l.slice(at, at + word.length)))
          .child(div().truncate().child(l.slice(at + word.length)));
      });
    };

    return v_flex()
      .id("search")
      .track_focus(this.handle)
      .w(POPUP_W)
      .min_h(0)
      .p(16)
      .gap(10)
      .bg(t.popover)
      .text_size(13)
      .on_key_down((e, cx) => {
        const k = e.key;
        if (k === "escape") return this.close();
        if (k === "down") this.sel = hits.length ? (this.sel + 1) % hits.length : 0;
        else if (k === "up") this.sel = hits.length ? (this.sel + hits.length - 1) % hits.length : 0;
        else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(
        h_flex()
          .h(38)
          .flex_none()
          .px(10)
          .gap(8)
          .items_center()
          .rounded(9)
          .border_1()
          .border_color(t.accent)
          .bg(t.background)
          .child(svg("mods/workspace-chrome/search.svg").size(15).text_color(t.dim))
          .child(Input.new(this.input).flex_1().min_w(0).h_full().text_size(13).text_color(t.foreground))
          .when(this.pending > 0, (el) => el.child(div().flex_none().text_size(11).text_color(t.dim).child("searching scrollback…"))),
      )
      .child(
        h_flex()
          .min_h(0)
          .gap(12)
          .items_start()
          .child(
            items.length
              ? v_flex()
                  .id("search-list")
                  .w(LIST_W)
                  .h(listBoxH)
                  .min_h(0)
                  .flex_none()
                  .when(fixed, (el) =>
                    el.overflow_hidden().on_scroll_wheel((e, cx) => {
                      this.scroll = Math.max(0, Math.min(this.scroll - e.delta.y, maxScroll));
                      cx.notify();
                    }),
                  )
                  .children(items.map((it, i) => (visible(i) ? place(renderItem(it), i) : null)).filter(Boolean))
              : v_flex().w(LIST_W).h(listBoxH).flex_none().items_center().justify_center().text_color(t.dim).child("No matches"),
          )
          .child(
            v_flex()
              .flex_1()
              .min_w(0)
              .h(previewBoxH)
              .overflow_hidden()
              .rounded(7)
              .border_1()
              .border_color(t.border)
              .bg(t.background)
              .p(12)
              .gap(8)
              .when(!selEntry, (el) => el.items_center().justify_center())
              .children(
                selEntry
                  ? [
                      div().flex_none().truncate().font_semibold().text_size(14).text_color(t.foreground).child(selEntry.title),
                      v_flex().min_h(0).gap(1).children(previewLines()),
                    ]
                  : [div().text_color(t.dim).child("Select a result to preview it")],
              ),
          ),
      )
      .child(
        h_flex()
          .flex_none()
          .pt(8)
          .border_t(1)
          .border_color(t.border)
          .items_center()
          .text_size(11)
          .text_color(t.dim)
          .child(div().flex_1().child("↵ Open    esc Close"))
          .child(div().child(`${this.entries.length} terminal${this.entries.length === 1 ? "" : "s"}`)),
      );
  }
}
