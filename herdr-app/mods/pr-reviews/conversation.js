// The Comments tab: everything said on the PR, and answering it or handing it on.
// Adapted from munza/herdr-mods' branch-pr (Apache-2.0): views/conversation.js.
// A comment's diff hunk renders with changes/main.js's own line-numbered,
// colored row treatment instead of a flat code block.
import { div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme } from "herdr";
import { authorsOf, conversationEntries, entryContext, isBot, lastLines, parseDiffHunk, timeAgo, unresolvedThreads, who } from "./model.js";
import { agentName } from "./agents.js";
import { TEXT, Button, Chevron, IconButton, Markdown, Message, TextBox, TextButton, MenuButton, codeFont } from "./ui.js";

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
    const unresolved = unresolvedThreads(pr).length;
    return h_flex().id("pr-comment-filters").flex_none().px(14).py(8).gap(8).flex_wrap().items_center().border_b(1).border_color(t.border)
      .child(h_flex().flex_none().gap(6).items_center()
        .child(this.authorChooser(authors))
        .child(TextButton({ id: "pr-unresolved", label: "Unresolved", active: Boolean(this.unresolved), onClick: (cx) => { this.unresolved = !this.unresolved; cx.notify(); } })))
      .child(h_flex().flex_none().ml_auto().gap(6).items_center()
        .when(unresolved > 0, (el) => el.child(this.agentButton({ id: "pr-send-unresolved", label: `Send ${unresolved} to agent`, send: (agent, cx) => this.sendUnresolved(agent, cx) }))));
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

  entryActions(entry, comments) {
    const thread = entry.thread;
    const last = comments[comments.length - 1];
    const url = last?.url || comments[0]?.url || this.pr.url;
    const row = h_flex().gap(2).items_center()
      .child(TextButton({ id: `pr-reply-${entry.id}`, label: "Reply", disabled: this.mutating || Boolean(thread && thread.viewerCanReply === false), onClick: (cx) => this.compose(thread ? "reply" : "comment", thread?.id, null, cx, { entry: entry.id, url, prefix: thread ? "" : `@${who(last)} ` }) }));
    if (thread && (thread.isResolved ? thread.viewerCanUnresolve : thread.viewerCanResolve))
      row.child(TextButton({ id: `pr-resolve-${entry.id}`, label: thread.isResolved ? "Reopen" : "Resolve", disabled: this.mutating, onClick: (cx) => this.mutate(thread.isResolved ? "reopen" : "resolve", cx, thread.id) }));
    row.child(div().flex_1());
    // A review already has its own agent icon on its header row, dispatching
    // the right skill for the whole review; this generic one would just be a
    // second, less specific way to do the same thing.
    if (entry.threads === undefined) row.child(this.agentButton({ id: `pr-agent-send-${entry.id}`, label: "Send to agent", send: (agent, cx) => this.compose("agent", thread?.id ?? entry.id, entryContext(entry), cx, { entry: entry.id, url, target: agent.address }) }));
    return row;
  },

  conversationView(body, pr) {
    const entries = conversationEntries(pr, { author: this.author, unresolved: this.unresolved });
    if (!entries.length) body.child(Message(this.author || this.unresolved ? "No comments match these filters." : "No comments yet."));
    entries.forEach((entry, i) => body.child(this.entryBlock(entry, { divided: i > 0 })));
    body.child(this.newCommentBox(entries.length > 0));
  },

  // A single collapsible row: a comment, a review, or (nested one level in,
  // inside a review's drawer) one of its inline-comment threads. Everything
  // starts closed — newest-first ordering means the one you want is at the
  // top, not necessarily the one with the most text. A review's own agent
  // icon sits right on this header, clickable without opening anything:
  // like Deploys' investigate icon, straight to an agyyolo agent running
  // /pr-review-response for a person's review or /pr-babysit for a bot's.
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
          label: `Address with agent (${isBot(who(entry)) ? "/pr-babysit" : "/pr-review-response"})`,
          onClick: () => this.addressReview(entry),
        }))));
    if (open) {
      const content = v_flex().px(indent ? 16 : 8).pb(10).gap(10).min_w(0);
      const hunk = thread?.comments[0]?.diffHunk;
      if (hunk) content.children(parseDiffHunk(lastLines(hunk, HUNK_LINES)).map((row) => diffLine(row, t)));
      content.children(comments.map((c) => this.commentBlock(c, t)));
      content.child(this.entryActions(entry, comments));
      if (this.composer?.entry === entry.id) content.child(this.composerView());
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

  // Always here after the last comment, so saying something takes no extra click.
  newCommentBox(divided) {
    const t = theme();
    const posting = this.mutating && !this.composer;
    return v_flex().id("pr-new-comment").flex_none().min_w(0).px(8).py(10).gap(8)
      .when(divided, (el) => el.mt(4).border_t(1).border_color(t.border))
      .child(TextBox({ id: "pr-comment-input", state: this.newComment, label: "New comment" }))
      .child(h_flex().justify_end().child(Button({ id: "pr-add-comment", label: posting ? "Sending…" : "Comment", primary: true, disabled: this.mutating || !this.newComment.value().trim(), onClick: (cx) => this.postCommentOnPR(cx) })));
  },

  composerView() {
    const composer = this.composer;
    const toAgent = composer.kind === "agent";
    const agent = toAgent ? this.agentAt(this.agentTarget) : null;
    const box = v_flex().id(`pr-composer-${composer.entry ?? "general"}`).gap(8).min_w(0);
    if (toAgent) box.child(div().text_size(TEXT.small).font_medium().child(agent ? `Send to ${agentName(agent)}` : "That agent is no longer running."));
    if (agent?.status === "working" && !agent.spawn) box.child(div().text_size(TEXT.caption).text_color(theme().dim).child("It's busy; your message waits in its session."));
    const disabled = this.mutating || !this.editor.value().trim() || (toAgent && !agent);
    return box
      .child(TextBox({ id: "pr-inline-input", state: this.editor, label: "Message" }))
      .child(h_flex().gap(8).justify_end()
        .child(Button({ id: "pr-cancel", label: "Close", disabled: this.mutating, onClick: (cx) => this.closeComposer(cx) }))
        .child(Button({ id: "pr-submit", label: this.mutating ? "Sending…" : toAgent ? "Send" : "Reply", primary: true, disabled, onClick: (cx) => (toAgent ? this.sendAgent(cx) : this.mutate(composer.kind, cx, composer.thread)) })));
  },
};
