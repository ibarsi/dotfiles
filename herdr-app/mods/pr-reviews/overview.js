// The Overview tab: who this PR is, who's on it, and what it says.
// Adapted from munza/herdr-mods' branch-pr (Apache-2.0): views/detail.js,
// trimmed to this panel's scope (no merge/close actions or worktrees yet).
import { div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme } from "herdr";
import { REVIEW_STATES, prStats, prStatus, reviewersOf, who } from "./model.js";
import { agentName } from "./agents.js";
import { TEXT, IconButton, Markdown, Message, GroupHeader, Row, Stat, halfTone, codeFont } from "./ui.js";

const AGENT_COLORS = { working: "working", blocked: "blocked", done: "done" };

export const overviewMethods = {
  // Fixed above the tabs: identity first, then where it stands.
  about(pr) {
    const t = theme();
    const status = prStatus(pr);
    return v_flex().id("pr-about").flex_none().px(14).pt(10).pb(4).gap(6)
      .child(h_flex().gap(8).min_w(0).items_center()
        .child(div().flex_none().text_size(TEXT.small).font_medium().text_color(t[status.color] ?? t.dim).child(status.label))
        .child(h_flex().flex_1().min_w(0).gap(6)
          .child(div().min_w(0).font_medium().whitespace_normal().child(pr.title))
          .child(div().flex_none().text_color(t.dim).font_family(codeFont()).child(`#${pr.number}`)))
        .child(IconButton({ id: "pr-github", icon: "github", label: "Open on GitHub", onClick: (cx) => cx.open_url(pr.url) }).mr(-6)))
      .child(h_flex().gap(8).min_h(26).items_center()
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.caption).text_color(t.dim).tooltip(`${pr.headRefName} → ${pr.baseRefName}`)
          .child(`${who(pr)} · ${pr.headRefName} → ${pr.baseRefName}`)))
      .child(this.statsRow(pr));
  },

  statsRow(pr) {
    const t = theme();
    const COLORS = { danger: t.ansi1, waiting: t.ansi3, good: t.ansi2, none: t.muted };
    const stats = prStats(pr);
    return h_flex().id("pr-stats").px(10).py(6).gap(8).flex_wrap().items_center().rounded(6).bg(halfTone(t.raised))
      .children(stats.map((stat, i) => h_flex().flex_none().gap(8).items_center()
        .child(Stat({ id: `pr-stat-${stat.key}`, value: stat.value, label: stat.label, color: COLORS[stat.tone], detail: stat.detail }))
        .when(i < stats.length - 1, (el) => el.child(div().text_color(t.dim).child("·")))));
  },

  overview(body, pr) {
    this.groupsDrawn = 0;
    this.agentRows(body);
    this.reviewerRows(body, pr);
    this.group(body, { key: "description", label: "Description" }, (into) =>
      into.child(div().px(8).pt(2).pb(10).min_w(0).child(Markdown(`pr-description-${pr.id}`, pr.body || "No description provided."))));
  },

  // A collapsible part of the Overview; the first has no rule above it.
  group(body, { key, label, count, action }, fill) {
    const open = !this.closedGroups.has(key);
    body.child(GroupHeader({ id: `pr-group-${key}`, label, count, action, collapsed: !open, divided: this.groupsDrawn++ > 0, onClick: (cx) => this.toggleGroup(key, cx) }));
    if (open) fill(body);
  },

  toggleGroup(key, cx) {
    if (this.closedGroups.has(key)) this.closedGroups.delete(key); else this.closedGroups.add(key);
    cx.notify();
  },

  agentRows(body) {
    const t = theme();
    const list = this.prAgents();
    if (!list.length) return;
    this.group(body, { key: "agents", label: "Agents", count: list.length }, (into) => {
      for (const agent of list)
        into.child(Row({ id: `pr-agent-${agent.address}`, onClick: () => this.focusAgent(agent) }).tooltip("Go to this agent")
          .child(div().size(8).flex_none().mx(3).rounded(4).bg(t[AGENT_COLORS[agent.status] ?? "dim"]))
          .child(div().flex_1().min_w(0).truncate().child(agentName(agent)))
          .child(div().flex_none().text_size(TEXT.caption).text_color(t.dim).child(agent.status)));
    });
  },

  reviewerRows(body, pr) {
    const t = theme();
    const reviewers = reviewersOf(pr);
    const open = pr.state === "OPEN";
    this.group(body, { key: "reviewers", label: "Reviewers", count: reviewers.length }, (into) => {
      if (!reviewers.length) into.child(Message("No reviewers yet."));
      for (const reviewer of reviewers) {
        const state = REVIEW_STATES[reviewer.state] ?? REVIEW_STATES.REQUESTED;
        into.child(Row({ id: `pr-reviewer-${reviewer.login}` })
          .child(div().w(14).flex_none().text_size(11).text_color(t[state.color] ?? t.muted).child("●"))
          .child(div().flex_1().min_w(0).truncate().tooltip(reviewer.login).child(reviewer.login))
          .child(div().flex_none().text_size(TEXT.caption).text_color(t.dim).child(state.label))
          .when(open && reviewer.state !== "REQUESTED", (el) => el.child(IconButton({ id: `pr-reviewer-again-${reviewer.login}`, icon: "refresh", label: `Ask ${reviewer.login} to review again`, disabled: this.mutating, onClick: (cx) => this.requestReviewAgain(reviewer.login, cx) }))));
      }
    });
  },
};
