// Small visual building blocks shared by the Deploys panel's render(), kept
// separate so render() reads as layout, not styling. Values in, elements out.
import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme } from "herdr";

export const TEXT = { badge: 10, caption: 11, small: 12, body: 13 };
export const SPIN_MS = 900;

export const Icon = (name, size = 14) => svg(`mods/deploys/${name}.svg`).size(size).flex_none();

export function Panel(id) {
  const t = theme();
  return v_flex().id(id).size_full().min_h(0).overflow_hidden().rounded(10)
    .bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(TEXT.body);
}

export function PanelHeader() {
  const t = theme();
  return h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border);
}

export function Badge(text, color) {
  const t = theme();
  return div().flex_none().px(5).py(1).rounded(4).border_1().border_color(color ?? t.border)
    .text_size(TEXT.badge).text_color(color ?? t.muted).child(String(text));
}

// `color` picks out the icon like the spaces sidebar's PR/review chips: its
// own colour at rest, that colour's tint behind it on hover, pointer always.
export function IconButton({ id, icon, label, onClick, disabled = false, spinning = false, color }) {
  const t = theme();
  return div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6)
    .text_color(color ?? t.dim).accessibility_label(label).tooltip(label)
    .when(!disabled, (el) => el.cursor_pointer()
      .hover((s) => (color ? s.bg(`${color.slice(0, 7)}2e`) : s.bg(t.hover).text_color(t.foreground)))
      .on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); }))
    .child(spinning ? svg("mods/workspace-chrome/spinner.svg").size(15).flex_none().spin(SPIN_MS) : Icon(icon, 15));
}

// A one-line clickable row, the unit a target or a stage renders as.
export function Row({ id, onClick }) {
  const t = theme();
  return h_flex().id(id).min_h(28).flex_none().px(8).py(4).gap(6).items_center().rounded(7)
    .when(Boolean(onClick), (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => onClick(cx)));
}

export function Chevron(open) {
  const t = theme();
  return div().w(14).flex_none().flex().items_center().justify_center().text_color(t.dim)
    .child(div().text_size(10).child(open ? "▾" : "▸"));
}

export function Link({ id, label, onClick }) {
  const t = theme();
  return div().id(id).text_size(TEXT.small).text_color(t.ansi4).cursor_pointer()
    .hover((s) => s.text_color(t.foreground).underline()).on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); }).child(label);
}

export function CodeBlock(text) {
  const t = theme();
  return div().flex_none().p(8).rounded(6).bg(t.canvas).text_size(TEXT.small)
    .font_family("monospace").text_color(t.muted).whitespace_normal().child(text);
}

export function Message(text, error = false) {
  const t = theme();
  return div().flex_none().p(10).text_size(TEXT.small).text_color(error ? t.ansi1 : t.dim).child(text);
}

// Waiting for the whole panel: fills the content area below the header.
export function Busy(label) {
  const t = theme();
  return v_flex().id("deploys-busy").flex_1().min_h(0).gap(8).items_center().justify_center()
    .text_size(TEXT.small).text_color(t.dim)
    .child(svg("mods/workspace-chrome/spinner.svg").size(18).flex_none().spin(SPIN_MS)).child(label);
}
