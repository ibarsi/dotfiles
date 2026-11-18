// Small visual building blocks shared by the Code Burn panel's render(), kept
// separate so render() reads as layout, not styling. Values in, elements out.
// Modeled on mods/deploys/ui.js.
import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme } from "herdr";

export const TEXT = { badge: 10, caption: 11, small: 12, body: 13 };
export const SPIN_MS = 900;

export const Icon = (name, size = 14) => svg(`mods/codeburn/${name}.svg`).size(size).flex_none();

export function IconButton({ id, icon, label, onClick, disabled = false, spinning = false }) {
  const t = theme();
  return div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6)
    .text_color(t.dim).accessibility_label(label).tooltip(label)
    .when(!disabled, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); }))
    .child(spinning ? svg("mods/workspace-chrome/spinner.svg").size(15).flex_none().spin(SPIN_MS) : Icon(icon, 15));
}

export function Panel(id) {
  const t = theme();
  return v_flex().id(id).size_full().min_h(0).overflow_hidden().rounded(10)
    .bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(TEXT.body);
}

export function PanelHeader() {
  const t = theme();
  return h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border);
}

export function Chip({ id, label, on, onClick }) {
  const t = theme();
  return div().id(id).flex_none().h(22).px(10).rounded(11).cursor_pointer()
    .bg(on ? t.selected : t.raised).text_color(on ? t.foreground : t.muted)
    .text_size(TEXT.small).flex().items_center().justify_center()
    .hover((s) => s.bg(on ? t.accent : t.selected).text_color(t.foreground))
    .on_click((_e, cx) => onClick(cx)).child(label);
}

export function Section(title, right) {
  const t = theme();
  const row = h_flex().flex_none().gap(6).items_center()
    .child(div().font_semibold().text_size(TEXT.small).text_color(t.muted).child(title));
  if (right) row.child(div().flex_1()).child(right);
  return row;
}

// A thin proportional-fill track, 4px tall. `fraction` is clamped to [0, 1].
export function Bar(fraction, color) {
  const t = theme();
  const pct = Math.max(0, Math.min(1, fraction || 0));
  return h_flex().h(4).w_full().flex_none().rounded(2).overflow_hidden().bg(t.raised)
    .child(div().h_full().flex_grow(pct).flex_shrink(0).rounded(2).bg(color ?? t.accent))
    .child(div().h_full().flex_grow(1 - pct).flex_shrink(0));
}

// 30 thin bars, tallest at the highest value in the series.
export function Spark(series) {
  const t = theme();
  const max = Math.max(0.01, ...series);
  return h_flex().h(24).flex_none().gap(2).items_end()
    .children(series.map((v, i) => div().id(`codeburn-spark-${i}`).flex_1()
      .h(Math.max(2, Math.round((v / max) * 24))).rounded(1).bg(t.ansi2)));
}

export function Stat(label, value) {
  const t = theme();
  return v_flex().flex_1().min_w(0).gap(1)
    .child(div().text_size(TEXT.caption).text_color(t.dim).child(label))
    .child(div().text_size(TEXT.small).text_color(t.foreground).child(value));
}

// "≈" with a tooltip listing every reason a total might be approximate.
// Renders nothing when there's nothing to flag.
export function Approx(notes) {
  if (!notes || !notes.length) return null;
  const t = theme();
  return div().flex_none().text_size(TEXT.small).text_color(t.dim).tooltip(notes.join("\n")).child("≈");
}

export function Link({ id, label, onClick }) {
  const t = theme();
  return div().id(id).text_size(TEXT.small).text_color(t.ansi4).cursor_pointer()
    .hover((s) => s.text_color(t.foreground).underline()).on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); }).child(label);
}

export function Message(text, error = false) {
  const t = theme();
  return div().flex_none().p(10).text_size(TEXT.small).text_color(error ? t.ansi1 : t.dim).child(text);
}

export function Busy(label) {
  const t = theme();
  return v_flex().id("codeburn-busy").flex_1().min_h(0).gap(8).items_center().justify_center()
    .text_size(TEXT.small).text_color(t.dim)
    .child(svg("mods/workspace-chrome/spinner.svg").size(18).flex_none().spin(SPIN_MS)).child(label);
}
