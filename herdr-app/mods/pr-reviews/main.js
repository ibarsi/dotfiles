// PR Reviews panel: native rendering of the active space's PR reviews, with
// resolved reviews collapsed/dimmed and a launch icon on unresolved ones that
// spawns an `agy` shell — /pr-babysit for a bot review, /pr-review-response
// <id> for a human one — in a split pane on the worktree's own machine.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, run, spaces, panes, terminals, theme, shared, setShared, layout } from "herdr";
import { QUERY, shapeReviews } from "./gql.js";
import { TEXT, Panel, PanelHeader, Badge, IconButton, Row, Chevron, Message, Busy, CodeBlock } from "./ui.js";

const FETCH_EVERY = 60000;

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

// Same as deploys/main.js: a terminal's space id, machine-prefixed when remote.
function spaceOf(tm) {
  const sp = tm.labels?.["herdr.space"];
  if (!sp) return null;
  const m = tm.machine ?? (tm.address?.includes("/") ? tm.address.split("/")[0] : null);
  return m ? `${m}/${sp}` : sp;
}

const STATE_COLOR = (state, t) => (state === "APPROVED" ? t.ansi2 : state === "CHANGES_REQUESTED" ? t.ansi1 : state === "DISMISSED" ? t.dim : t.muted);

export default class PrReviews extends View {
  init(_props, cx) {
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    if (!enabled.includes("pr-reviews")) setShared("workspace.panels", [...enabled, "pr-reviews"]);
    this.resetReviews();
    this.tick(cx);
    cx.timer.every(1000, (cx) => this.tick(cx));
  }

  resetReviews() {
    this.reviews = null;
    this.toggled = new Set();
  }

  target() {
    const id = spaces().find((s) => s.active)?.id;
    if (!id) return null;
    return (shared("deploys.targets") ?? {})[id] ?? null;
  }

  tick(cx) {
    const visible = showing();
    const target = this.target();
    const key = target ? `${target.repo}@${target.branch}` : null;
    if (visible && (!this.wasVisible || key !== this.key || Date.now() - this.lastFetch > FETCH_EVERY)) {
      const switched = key !== this.key;
      this.key = key;
      if (switched) { this.error = null; this.resetReviews(); }
      if (target) this.fetch(cx, target);
      else { this.reviews = null; this.error = "No repo detected for this space"; cx.notify(); }
    }
    if (visible !== this.wasVisible) cx.notify();
    this.wasVisible = visible;
  }

  fetch(cx, target) {
    if (!target) return;
    if (!target.pr) { this.reviews = null; this.error = "No open PR for this branch"; cx.notify(); return; }
    this.loading = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const [owner, name] = target.repo.split("/");
        const r = await exec("gh", ["api", "graphql", "-f", `owner=${owner}`, "-f", `name=${name}`, "-F", `number=${target.pr}`, "-f", `query=${QUERY}`], { timeout: 30000 });
        if (r.code !== 0) { this.error = "Could not reach GitHub"; this.loading = false; cx.notify(); return; }
        const reviews = shapeReviews(JSON.parse(r.stdout).data);
        if (JSON.stringify(this.target()) !== JSON.stringify(target)) return; // stale: space or branch moved on
        this.reviews = reviews;
        this.error = null;
        this.lastFetch = Date.now();
      } catch {
        this.error = "Could not reach GitHub";
      } finally {
        this.loading = false;
        cx.notify();
      }
    });
  }

  isOpen(review) {
    return review.resolved ? this.toggled.has(review.id) : !this.toggled.has(review.id);
  }

  toggleReview(id, cx) {
    if (this.toggled.has(id)) this.toggled.delete(id); else this.toggled.add(id);
    cx.notify();
  }

  // Like Deploys' investigate(): splits an agy pane into the active space's
  // shown tab. Bot reviews all route to the same PR-wide /pr-babysit pass;
  // human reviews get /pr-review-response for that specific review. Skipped
  // while a terminal with the same argv is already running in this space.
  launch(review) {
    const target = this.target();
    const space = spaces().find((s) => s.active);
    if (!target || !space) return;
    const argv = review.isBot
      ? ["agy", "--dangerously-skip-permissions", "-i", "/pr-babysit"]
      : ["agy", "--dangerously-skip-permissions", "-i", `/pr-review-response ${review.id}`];
    const running = terminals().some((tm) => tm.state === "live" && spaceOf(tm) === space.id && tm.argv?.join("\0") === argv.join("\0"));
    if (running) return;
    const tab = space.tabs?.find((tb) => tb.active);
    const tabPanes = panes().filter((p) => p.tab === tab?.id && p.terminal);
    const pane = tabPanes.find((p) => p.cwd === target.cwd) ?? tabPanes[0];
    if (pane) run("pane.split", { direction: "right", pane: pane.pane, argv });
  }

  reviewDetail(review, t) {
    const content = v_flex().flex_none().pl(22).pr(4).py(2).gap(6);
    if (!review.comments.length) return content.child(Message("No unresolved comments"));
    return content.children(review.comments.map((c) => v_flex().id(`pr-review-comment-${c.id}`).gap(2)
      .child(div().text_size(TEXT.caption).text_color(t.muted).child(c.line != null ? `${c.path}:${c.line}` : c.path))
      .child(CodeBlock(c.body))));
  }

  reviewRow(review, t) {
    const open = this.isOpen(review);
    return v_flex().id(`pr-review-${review.id}`).opacity(review.resolved ? 0.55 : 1)
      .child(Row({ id: `pr-review-toggle-${review.id}`, onClick: (cx) => this.toggleReview(review.id, cx) })
        .child(Chevron(open))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).text_color(t.foreground).child(review.author))
        .child(Badge(review.state, STATE_COLOR(review.state, t)))
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(new Date(review.submittedAt).toLocaleString()))
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(`${review.commitsSince} commit${review.commitsSince === 1 ? "" : "s"} since`))
        .when(!review.resolved, (el) => el.child(IconButton({ id: `pr-review-launch-${review.id}`, icon: "launch", label: review.isBot ? "Investigate with /pr-babysit" : "Respond with /pr-review-response", onClick: () => this.launch(review) }))))
      .when(open, (el) => el.child(this.reviewDetail(review, t)));
  }

  render(cx) {
    const t = theme();
    const target = this.target();
    const root = Panel("pr-reviews")
      .child(PanelHeader()
        .child(div().font_semibold().child(target?.pr ? `PR Reviews · #${target.pr}` : "PR Reviews"))
        .child(div().flex_1())
        .child(IconButton({ id: "pr-reviews-refresh", icon: "refresh", label: "Refresh", spinning: this.loading, disabled: !target, onClick: (cx) => this.fetch(cx, target) })));
    const body = v_flex().id("pr-reviews-body").flex_1().min_h(0).overflow_y_scrollbar().p(8).gap(2);
    if (!target?.pr) body.child(Message(this.error ?? "No open PR for this branch"));
    else {
      if (this.loading && !this.reviews) body.child(Busy("Loading reviews…"));
      if (this.error) body.child(Message(this.error, true));
      if (this.reviews && !this.reviews.length) body.child(Message("No reviews yet"));
      this.reviews?.forEach((review) => body.child(this.reviewRow(review, t)));
    }
    return root.child(body);
  }
}
