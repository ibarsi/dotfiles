// PR Reviews panel: a single-PR clone of munza/herdr-mods' branch-pr (Apache-2.0),
// kept to this panel's existing frame (tab button, sidebar icon, bootstrap — see
// my-tabs/main.js and my-spaces/indicators.js) and scope (Overview + Comments;
// Checks, Files, PR list navigation and merge actions are a later pass).
import { View, div } from "gpui-kit";
import { v_flex, h_flex, TextareaState } from "gpui-base";
import { spaces, layout, shared, theme } from "herdr";
import { fetchPR, postComment, replyToThread, resolveThread, requestReviewAgain as apiRequestReviewAgain } from "./reads.js";
import { overviewMethods } from "./overview.js";
import { conversationMethods } from "./conversation.js";
import { agentMethods } from "./agents.js";
import { TEXT, Panel, PanelHeader, IconButton, Busy, Message, Select } from "./ui.js";

const FETCH_EVERY = 60000;
const NOTICE_MS = 5000;

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
  return find(layout(), "panel-body")?.active === "pr-reviews" && panel?.hidden !== true;
}

class PrReviews extends View {
  init(_props, cx) {
    this.closedGroups = new Set();
    this.entryOpen = {};
    this.drawerOpen = {};
    this.author = "";
    this.unresolved = false;
    this.section = "overview";
    this.menuFocus = cx.focus_handle();
    this.editor = TextareaState.new({ placeholder: "Write a comment…", rows: 4 });
    this.editor.on("change", (_e, cx) => cx.notify());
    this.newComment = TextareaState.new({ placeholder: "Write a comment…", rows: 4 });
    this.newComment.on("change", (_e, cx) => cx.notify());
    this.tick(cx);
    cx.timer.every(1000, (cx) => this.tick(cx));
  }

  resetPR() {
    this.pr = null;
    this.entryOpen = {};
    this.drawerOpen = {};
    this.author = "";
    this.unresolved = false;
    this.section = "overview";
    this.composer = null;
  }

  target() {
    const id = spaces().find((s) => s.active)?.id;
    if (!id) return null;
    return (shared("deploys.targets") ?? {})[id] ?? null;
  }

  tick(cx) {
    const visible = showing();
    this.sp = spaces().find((s) => s.active) ?? null;
    this.spaceKey = this.sp?.id ?? null;
    const target = this.target();
    const key = target ? `${target.repo}@${target.pr}` : null;
    if (visible && (!this.wasVisible || key !== this.key || Date.now() - this.lastFetch > FETCH_EVERY)) {
      const switched = key !== this.key;
      this.key = key;
      if (switched) this.resetPR();
      if (target) this.fetch(cx, target);
      else { this.pr = null; this.error = "No repo detected for this space"; cx.notify(); }
    }
    if (this.notice && Date.now() - (this.noticeSince ?? 0) > NOTICE_MS) { this.notice = null; cx.notify(); }
    if (visible !== this.wasVisible) cx.notify();
    this.wasVisible = visible;
  }

  fetch(cx, target) {
    if (!target) return;
    if (!target.pr) { this.pr = null; this.error = "No open PR for this branch"; cx.notify(); return; }
    this.loading = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const pr = await fetchPR(target.repo, target.pr);
        if (JSON.stringify(this.target()) !== JSON.stringify(target)) return; // stale: space or branch moved on
        this.pr = pr;
        this.error = pr ? null : "PR not found";
        this.lastFetch = Date.now();
      } catch (e) {
        this.error = e.message || "Could not reach GitHub";
      } finally {
        this.loading = false;
        cx.notify();
      }
    });
  }

  refresh(cx) {
    const target = this.target();
    if (target) this.fetch(cx, target);
  }

  selectSection(id, cx) {
    this.section = id;
    cx.notify();
  }

  // The one popup open at a time, shared by every chooser in the panel.
  chooser({ id, choices, value, onChoose, ...rest }) {
    const enabled = choices.filter((c) => !c.disabled);
    return Select({
      id, choices, value, ...rest,
      open: this.openMenu === id,
      index: this.menuIndex ?? 0,
      focus: this.menuFocus,
      onOpenChange: (open, cx) => { this.openMenu = open ? id : null; this.menuIndex = Math.max(0, enabled.findIndex((c) => c.id === value)); cx.notify(); },
      onMove: (index, cx) => { this.menuIndex = index; cx.notify(); },
      onChoose: (choice, cx) => { this.openMenu = null; onChoose(choice.id, cx); cx.notify(); },
    });
  }

  compose(kind, thread, context, cx, options = {}) {
    if (this.mutating) return;
    this.composer = { kind, thread, context, ...options };
    this.agentTarget = options.target ?? null;
    this.editor.set_value(kind === "agent" ? "Analyze this comment and suggest a response or fix." : (options.prefix ?? ""));
    this.editor.focus();
    cx.notify();
  }

  closeComposer(cx) {
    if (this.mutating) return;
    this.composer = null;
    cx.notify();
  }

  postCommentOnPR(cx) {
    if (this.mutating || !this.pr) return;
    const key = this.spaceKey;
    const body = this.newComment.value();
    this.mutating = true;
    this.error = null;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        await postComment(this.pr.repository, this.pr.number, body);
        if (key !== this.spaceKey) return;
        this.newComment.set_value("");
        this.notice = "Saved to GitHub.";
        this.noticeSince = Date.now();
        this.refresh(cx);
      } catch (e) {
        if (key === this.spaceKey) this.error = `${e.message}. Refresh before retrying if it may have gone through.`;
      } finally {
        this.mutating = false;
        cx.notify();
      }
    });
  }

  // Reply, resolve or reopen one thread.
  mutate(action, cx, thread) {
    if (this.mutating) return;
    const key = this.spaceKey;
    const body = this.editor.value();
    this.mutating = true;
    this.error = null;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        if (action === "reply") await replyToThread(thread, body);
        else await resolveThread(thread, action === "reopen");
        if (key !== this.spaceKey) return;
        if (action === "reply") this.composer = null;
        this.notice = "Saved to GitHub.";
        this.noticeSince = Date.now();
        this.refresh(cx);
      } catch (e) {
        if (key === this.spaceKey) this.error = `${e.message}. Refresh before retrying if it may have gone through.`;
      } finally {
        this.mutating = false;
        cx.notify();
      }
    });
  }

  requestReviewAgain(login, cx) {
    if (this.mutating || !this.pr) return;
    const key = this.spaceKey;
    this.mutating = true;
    this.error = null;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        await apiRequestReviewAgain(this.pr.repository, this.pr.number, login);
        if (key !== this.spaceKey) return;
        this.notice = `Asked ${login} to review again.`;
        this.noticeSince = Date.now();
        this.refresh(cx);
      } catch (e) {
        if (key === this.spaceKey) this.error = e.message;
      } finally {
        this.mutating = false;
        cx.notify();
      }
    });
  }

  sectionTabs(pr) {
    const t = theme();
    const tab = (id, label, count) => div().id(`pr-${id}`).h(32).flex_none().mb(-1).px(0).gap(6).items_center()
      .border_b(2).border_color(this.section === id ? t.foreground : t.background)
      .text_size(TEXT.small).text_color(this.section === id ? t.foreground : t.muted).cursor_pointer()
      .hover((s) => s.text_color(t.foreground)).on_click((_e, cx) => this.selectSection(id, cx)).child(label);
    return h_flex().id("pr-detail-tabs").flex_none().px(14).pt(8).gap(16).items_center().border_b(1).border_color(t.border)
      .child(tab("overview", "Overview")).child(tab("conversation", "Comments"));
  }

  render(cx) {
    const t = theme();
    const target = this.target();
    const root = Panel("pr-reviews")
      .child(PanelHeader()
        .child(div().font_semibold().child(target?.pr ? `PR Reviews · #${target.pr}` : "PR Reviews"))
        .child(div().flex_1())
        .child(IconButton({ id: "pr-reviews-refresh", icon: "refresh", label: "Refresh", spinning: this.loading, disabled: !target, onClick: (cx) => this.refresh(cx) })));
    const body = v_flex().id("pr-reviews-body").flex_1().min_h(0).overflow_y_scrollbar().p(0);
    if (!target?.pr) { body.p(8).child(Message(this.error ?? "No open PR for this branch")); return root.child(body); }
    if (this.loading && !this.pr) { body.child(Busy("Loading…")); return root.child(body); }
    if (!this.pr) { body.p(8).child(Message(this.error ?? "PR not found", Boolean(this.error))); return root.child(body); }
    const pr = this.pr;
    root.child(this.about(pr));
    if (this.error) root.child(Message(this.error, true).px(14));
    if (this.notice) root.child(Message(this.notice).px(14));
    root.child(this.sectionTabs(pr));
    if (this.section === "conversation") root.child(this.conversationFilters(pr));
    const content = v_flex().id(`pr-detail-${this.section}`).flex_1().min_w(0).min_h(0).overflow_y_scrollbar().p(6);
    if (this.section === "conversation") this.conversationView(content, pr);
    else this.overview(content, pr);
    root.child(content);
    if (this.composer && !this.composer.entry) root.child(v_flex().flex_none().p(10).border_t(1).border_color(t.border).child(this.composerView()));
    return root;
  }
}

Object.assign(PrReviews.prototype, overviewMethods, conversationMethods, agentMethods);

export default PrReviews;
