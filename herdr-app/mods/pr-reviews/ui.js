// The design kit: Herdr's own conventions (sizes, radii, type, spacing), as
// tokens and small components, with only what this mod uses. UI only: values
// in, callbacks out. Components return ordinary elements, so callers can chain.
// Adapted from munza/herdr-mods' branch-pr (Apache-2.0): views/ui.js, trimmed
// to this panel's scope (a single PR, no checks/files/merge yet).
import { div, svg } from "gpui-kit";
import { h_flex, v_flex, Popover, Textarea, TextView } from "gpui-base";
import { theme, settings } from "herdr";

export const TEXT = { badge: 10, caption: 11, small: 12, tab: 12.8, body: 13 };
export const SPIN_MS = 900;

// A theme colour at half strength, for a background quieter than `raised`.
export const halfTone = (color) => `${color.slice(0, 7)}80`;

export const codeFont = () => settings().font_family ?? "JetBrains Mono";

export const Icon = (name, size = 14) => svg(`mods/pr-reviews/${name}.svg`).size(size).flex_none();

export function Panel(id) {
  const t = theme();
  return v_flex().id(id).size_full().min_h(0).overflow_hidden().rounded(10)
    .bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(TEXT.body);
}

export function PanelHeader() {
  const t = theme();
  return h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border);
}

function Badge(text) {
  const t = theme();
  return div().flex_none().px(5).py(1).rounded(4).border_1().border_color(t.border).text_size(TEXT.badge).text_color(t.muted).child(String(text));
}

// A tab within a view, quieter than the panel header: its weight is a line
// that sits on the rule under the row.
export function SubTab({ id, label, count, active, onClick }) {
  const t = theme();
  return h_flex().id(id).h(32).flex_none().mb(-1).gap(6).items_center().border_b(2).border_color(active ? t.foreground : t.background)
    .text_size(TEXT.small).text_color(active ? t.foreground : t.muted).cursor_pointer().hover((s) => s.text_color(t.foreground))
    .role("tab").aria_selected(Boolean(active)).on_click((_e, cx) => onClick(cx)).child(label)
    .when(count !== undefined && count !== null, (el) => el.child(Badge(count)));
}

export function IconButton({ id, icon, label, onClick, disabled = false, spinning = false, small = false }) {
  const t = theme();
  return div().id(id).size(small ? 22 : 26).flex_none().flex().items_center().justify_center().rounded(6)
    .text_color(t.dim).accessibility_label(label).tooltip(label)
    .when(!disabled, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); }))
    .child(spinning ? Icon(icon, 15).spin(SPIN_MS) : Icon(icon, small ? 13 : 15));
}

// A small labelled action, for a row with room to say what it does.
export function TextButton({ id, label, active = false, disabled = false, onClick }) {
  const t = theme();
  return h_flex().id(id).h(22).flex_none().px(6).gap(4).items_center().rounded(4).text_size(TEXT.caption)
    .text_color(active ? t.foreground : t.dim).when(active, (el) => el.bg(t.selected))
    .when(!disabled, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); }))
    .child(label);
}

// A full-size action. `primary` is the solid one; a view has at most one.
export function Button({ id, label, onClick, primary = false, disabled = false }) {
  const t = theme();
  const solid = primary && !disabled;
  return h_flex().id(id).h(32).flex_none().px(14).gap(7).items_center().justify_center().rounded(8)
    .text_size(TEXT.small).bg(solid ? t.solid : t.raised).text_color(solid ? t.solid_foreground : disabled ? t.dim : t.foreground)
    .accessibility_label(label)
    .when(!disabled, (el) => el.cursor_pointer().hover((s) => (solid ? s.opacity(0.88) : s.bg(t.hover))).on_click((_e, cx) => onClick(cx)))
    .child(label);
}

// A small bordered action, for a row with other things in it.
export function SmallButton({ id, label, onClick, disabled = false }) {
  const t = theme();
  return h_flex().id(id).h(26).flex_none().px(8).gap(5).items_center().rounded(6).border_1().border_color(t.border)
    .text_size(TEXT.small).text_color(disabled ? t.dim : t.foreground).accessibility_label(label)
    .when(!disabled, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => { cx.stop_propagation(); onClick(cx); }))
    .child(label);
}

// The same, as the trigger of a menu/chooser.
export function MenuButton({ id, label }) {
  const t = theme();
  return h_flex().id(id).h(26).flex_none().px(8).gap(5).items_center().rounded(6).border_1().border_color(t.border)
    .text_size(TEXT.small).cursor_pointer().accessibility_label(label).hover((s) => s.bg(t.hover))
    .child(label).child(div().text_size(10).text_color(t.dim).child("▾"));
}

// A section heading in a list. With `onClick` it collapses its section;
// `divided` draws the rule that separates it from the one before.
export function GroupHeader({ id, label, count, action, collapsed = false, divided = false, onClick }) {
  const t = theme();
  return h_flex().id(id).h(30).flex_none().px(8).gap(6).items_center().text_size(TEXT.caption).text_color(t.muted)
    .when(divided, (el) => el.mt(6).pt(2).h(34).border_t(1).border_color(t.border))
    .when(Boolean(onClick), (el) => el.cursor_pointer().hover((s) => s.text_color(t.foreground)).on_click((_e, cx) => onClick(cx)).child(Chevron(!collapsed)))
    .child(div().flex_none().font_medium().child(label))
    .when(count !== undefined && count !== null, (el) => el.child(Badge(count)))
    .child(div().flex_1()).when(Boolean(action), (el) => el.child(action));
}

export function Chevron(open) {
  const t = theme();
  return div().w(14).flex_none().flex().items_center().justify_center().text_color(t.dim)
    .child(div().text_size(10).child(open ? "▾" : "▸"));
}

// A one-line list row.
export function Row({ id, onClick }) {
  const t = theme();
  return h_flex().id(id).h(28).flex_none().px(8).gap(6).items_center().rounded(7)
    .when(Boolean(onClick), (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => onClick(cx)));
}

// A name and its value on one line, the value carrying the colour.
export function Stat({ id, value, label, color, detail, onClick }) {
  const t = theme();
  return h_flex().id(id).flex_none().gap(4).items_center().text_size(TEXT.small).tooltip(detail)
    .when(Boolean(onClick), (el) => el.cursor_pointer().hover((s) => s.underline()).on_click((_e, cx) => onClick(cx)))
    .child(div().text_color(t.dim).child(label)).child(div().font_medium().text_color(color).child(value));
}

// Waiting for the whole panel: fills the content area below the header.
export function Busy(label) {
  const t = theme();
  return v_flex().id("pr-busy").flex_1().min_h(0).gap(10).items_center().justify_center()
    .text_size(TEXT.small).text_color(t.dim).child(Icon("refresh", 20).spin(SPIN_MS)).child(label);
}

export function Message(text, error = false) {
  const t = theme();
  return div().flex_none().p(8).text_size(TEXT.small).whitespace_normal().text_color(error ? t.ansi1 : t.dim).child(text);
}

export const Markdown = (id, text) => TextView.markdown(id, text).text_size(TEXT.body).w_full().min_w(0).scrollable(false).selectable(true);

export function CodeBlock(text) {
  const t = theme();
  return div().flex_none().p(8).rounded(6).bg(t.canvas).text_size(TEXT.small).font_family(codeFont()).text_color(t.muted).child(text);
}

export function TextBox({ id, state, label, height = 96 }) {
  const t = theme();
  return Textarea.new(state).id(id).w_full().h(height).px(10).py(7).rounded(8).border_1().border_color(t.border)
    .bg(t.input).text_size(TEXT.small).text_color(t.foreground).accessibility_label(label);
}

function MenuBody({ id, width, focus, children, onKey }) {
  const t = theme();
  return v_flex().id(`${id}-menu`).w(width).max_h(300).overflow_y_scrollbar().p(5).gap(1).rounded(7)
    .border_1().border_color(t.border).bg(t.popover).text_color(t.foreground).track_focus(focus).on_key_down(onKey).children(children);
}

// A chooser: a trigger and a popup of `choices`, with arrow keys, Enter and Esc.
// Each choice is {id, label, detail?, disabled?, divided?}. `value` marks the current one.
export function Select({ id, trigger, choices, value, open, index, focus, width = 200, anchor = "top_right", accessibilityLabel, onOpenChange, onMove, onChoose }) {
  const t = theme();
  const enabled = choices.filter((c) => !c.disabled);
  const onKey = (event, cx) => {
    if (event.key === "escape") { cx.stop_propagation(); onOpenChange(false, cx); }
    else if ((event.key === "up" || event.key === "down") && enabled.length) { cx.stop_propagation(); onMove((index + (event.key === "down" ? 1 : enabled.length - 1)) % enabled.length, cx); }
    else if (event.key === "enter" && enabled[index]) { cx.stop_propagation(); onChoose(enabled[index], cx); }
  };
  const highlighted = enabled[index]?.id;
  const options = choices.flatMap((choice) => [
    ...(choice.divided ? [div().h(1).my(4).flex_none().bg(t.border)] : []),
    v_flex().id(`${id}-option-${choice.id}`).flex_none().min_h(31).px(8).py(5).gap(1).justify_center().rounded(7)
      .text_size(TEXT.tab).text_color(choice.disabled ? t.dim : t.foreground).role("list_box_option").aria_selected(choice.id === value)
      .when(choice.id === highlighted, (el) => el.bg(t.selected))
      .when(!choice.disabled, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => onChoose(choice, cx)))
      .child(div().truncate().child(choice.label))
      .when(Boolean(choice.detail), (el) => el.child(div().truncate().text_size(TEXT.caption).text_color(t.dim).child(choice.detail))),
  ]);
  return Popover.new(id).accessibility_label(accessibilityLabel).open(open).anchor(anchor).track_focus(focus)
    .on_open_change((v, cx) => onOpenChange(v, cx)).trigger(trigger)
    .when(open, (el) => el.content(MenuBody({ id, width, focus, children: options, onKey })));
}
