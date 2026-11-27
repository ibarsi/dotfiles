// The Comments tab: everything said on the PR, read-only, with an agent icon per review.
// Adapted from munza/herdr-mods' branch-pr (Apache-2.0): views/conversation.js.
// A comment's diff hunk renders with changes/main.js's own line-numbered,
// colored row treatment instead of a flat code block.
import { div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme } from "herdr";
import { authorsOf, conversationEntries, isBot, lastLines, parseDiffHunk, timeAgo, who } from "./model.js";
import { TEXT, Chevron, IconButton, Markdown, Message, TextButton, MenuButton, codeFont } from "./ui.js";

const HUNK_LINES = 6;

// Mirrors changes/main.js's diffRow: a hunk-header row, or a line-numbered row
// tinted green/red for an addition/removal.
function diffLine({ kind, number, text }, t) {
  if (kind === "@") return div().w_full().px(8).h(18).flex_none().truncate().bg(t.raised).text_color(t.dim).text_size(10).font_family(codeFont()).child(text);
  return h_flex().w_full().h(18).flex_none().gap(8)
    .when(kind === "+", (e) => e.bg(t.ansi2 + "18")).when(kind === "-", (e) => e.bg(t.ansi1 + "18"))
    .child(div().w(28).flex_none().text_right().text_color(t.dim).text_size(10).font_family(codeFont()).child(number === undefined ? "" : String(number)))
    .child(div().flex_1().min_w(0).truncate().font_family(codeFont()).text_size(10).child(text));
}

export const conversationMethods = {
  conversationFilters(pr) {
    const t = theme();
    const authors = ["", ...authorsOf(pr)];
    return h_flex().id("pr-comment-filters").flex_none().px(14).py(8).gap(6).flex_wrap().items_center().border_b(1).border_color(t.border)
      .child(this.authorChooser(authors))
      .child(TextButton({ id: "pr-unresolved", label: "Unresolved", active: Boolean(this.unresolved), onClick: (cx) => { this.unresolved = !this.unresolved; cx.notify(); } }));
  },

  authorChooser(authors) {
    return this.chooser({
      id: "pr-author",
      accessibilityLabel: "Filter by author",
      width: 220,
      trigger: MenuButton({ id: "pr-author-trigger", label: `Author: ${this.author || "All"}` }),
      choices: authors.map((a) => ({ id: a || "all", label: a || "All authors" })),
      value: this.author || "all",
      onChoose: (id) => { this.author = id === "all" ? "" : id; },
    });
  },

  commentBlock(comment, t) {
    return v_flex().gap(4).min_w(0)
      .child(h_flex().gap(6).items_center()
        .child(div().flex_none().font_medium().text_size(TEXT.small).text_color(t.foreground).child(who(comment)))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.caption).text_color(t.dim).child(timeAgo(comment.createdAt ?? comment.submittedAt)))
        .when(Boolean(comment.url), (el) => el.child(IconButton({ id: `pr-copy-${comment.id}`, icon: "copy", label: "Copy link", small: true, onClick: (cx) => { cx.write_to_clipboard(comment.url); this.notice = "Comment link copied."; cx.notify(); } }))))
      .child(Markdown(`pr-comment-${comment.id}`, comment.body || "No comment text."));
  },

  conversationView(body, pr) {
    const entries = conversationEntries(pr, { author: this.author, unresolved: this.unresolved });
    if (!entries.length) body.child(Message(this.author || this.unresolved ? "No comments match these filters." : "No comments yet."));
    entries.forEach((entry, i) => body.child(this.entryBlock(entry, { divided: i > 0 })));
  },

  // A single collapsible row: a comment, a review, or (nested one level in,
  // inside a review's drawer) one of its inline-comment threads. Everything
  // starts closed — newest-first ordering means the one you want is at the
  // top, not necessarily the one with the most text. A review's own agent
  // icon sits right on this header, clickable without opening anything:
  // like Deploys' investigate icon, straight to a ccyolo (opus) agent
  // running /review-judge for a person's review or an agyyolo agent running
  // /pr-babysit for a bot's.
  entryBlock(entry, { indent = false, divided = false } = {}) {
    const t = theme();
    const thread = entry.thread;
    const isReview = entry.threads !== undefined;
    const comments = thread ? thread.comments : [entry];
    const open = this.entryOpen[entry.id] ?? false;
    const block = v_flex().id(`conversation-${entry.id}`).flex_none().min_w(0)
      .when(divided, (el) => el.mt(4).border_t(1).border_color(t.border))
      .child(h_flex().id(`pr-entry-toggle-${entry.id}`).h(32).px(indent ? 16 : 8).gap(6).min_w(0).items_center().cursor_pointer()
        .text_size(TEXT.caption).text_color(thread && !thread.isResolved ? t.ansi3 : t.dim)
        .on_click((_e, cx) => { this.entryOpen[entry.id] = !open; cx.notify(); })
        .child(Chevron(open)).child(div().flex_none().child(entry.kind))
        .when(Boolean(thread), (el) => el.child(div().flex_1().min_w(0).truncate().text_color(t.accent ?? t.ansi4).font_family(codeFont()).tooltip(`${thread.path}:${thread.line ?? ""}`).child(`${thread.path}:${thread.line ?? ""}`)))
        .when(!thread, (el) => el.child(div().flex_1()))
        .when(!open, (el) => el.child(div().flex_none().max_w(140).truncate().text_color(t.dim).child(who(comments[0]))))
        .child(div().flex_none().text_color(t.dim).child(timeAgo(entry.at)))
        .when(isReview, (el) => el.child(IconButton({
          id: `pr-review-agent-${entry.id}`, icon: "agent", small: true, color: t.accent ?? t.ansi4,
          label: `Address with agent (${isBot(who(entry)) ? "/pr-babysit" : "/review-judge"})`,
          onClick: () => this.addressReview(entry),
        }))));
    if (open) {
      const content = v_flex().px(indent ? 16 : 8).pb(10).gap(10).min_w(0);
      const hunk = thread?.comments[0]?.diffHunk;
      if (hunk) content.children(parseDiffHunk(lastLines(hunk, HUNK_LINES)).map((row) => diffLine(row, t)));
      content.children(comments.map((c) => this.commentBlock(c, t)));
      if (entry.threads?.length) content.child(this.drawer(entry));
      block.child(content);
    }
    return block;
  },

  // The count row that hides a review's inline comments until asked for,
  // closed regardless of whether they're resolved.
  drawer(entry) {
    const t = theme();
    const open = this.drawerOpen[entry.id] ?? false;
    const label = `${entry.threads.length} inline comment${entry.threads.length === 1 ? "" : "s"}`;
    const box = v_flex().gap(0).min_w(0)
      .child(h_flex().id(`pr-drawer-${entry.id}`).h(26).gap(6).items_center().cursor_pointer()
        .text_size(TEXT.caption).text_color(t.dim).hover((s) => s.text_color(t.foreground))
        .on_click((_e, cx) => { this.drawerOpen[entry.id] = !open; cx.notify(); })
        .child(Chevron(open)).child(div().child(label)));
    if (open) box.children(entry.threads.map((nested) => this.entryBlock(nested, { indent: true })));
    return box;
  },
};
