// PR Reviews panel: native rendering of the active space's PR reviews, with
// resolved reviews collapsed/dimmed and a launch icon on unresolved ones that
// spawns an `agy` shell — /pr-babysit for a bot review, /pr-review-response
// <id> for a human one — in a split pane on the worktree's own machine.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, run, spaces, panes, terminals, theme, shared, setShared, layout } from "herdr";
import { QUERY, shapeReviews, relativeTime, parseDiffHunk } from "./gql.js";
import { TEXT, Panel, PanelHeader, IconButton, Row, Chevron, Message, Busy } from "./ui.js";

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

// One letter per state, same column treatment as changes/main.js's A/M/D/U status glyph.
const STATE_GLYPH = { APPROVED: "✓", CHANGES_REQUESTED: "!", COMMENTED: "·", DISMISSED: "×", PENDING: "…" };
const STATE_COLOR = (state, t) => (state === "APPROVED" ? t.ansi2 : state === "CHANGES_REQUESTED" ? t.ansi1 : state === "DISMISSED" ? t.dim : t.muted);

// Mirrors changes/main.js's diffRow: a hunk-header row, or a line-numbered row
// tinted green/red for an addition/removal, so a comment's code context reads
// exactly like the Changes panel's own diff viewer.
function diffLine({ kind, number, text }, t) {
  if (kind === "@") return div().w_full().px(8).h(18).flex_none().truncate().bg(t.raised).text_color(t.dim).text_size(10).font_family("monospace").child(text);
  return h_flex().w_full().h(18).flex_none().gap(8)
    .when(kind === "+", (e) => e.bg(t.ansi2 + "18")).when(kind === "-", (e) => e.bg(t.ansi1 + "18"))
    .child(div().w(28).flex_none().text_right().text_color(t.dim).text_size(10).font_family("monospace").child(number === undefined ? "" : String(number)))
    .child(div().flex_1().min_w(0).truncate().font_family("monospace").text_size(10).child(text));
}

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

  // Each comment renders as its own bordered card: a path:line header (same
  // raised-background treatment as changes/main.js's hunk-header row), the
  // comment's own diff hunk so you see the code being discussed, then the
  // comment body in a clearly offset block below it.
  reviewDetail(review, t) {
    const content = v_flex().flex_none().pl(22).pr(8).py(4).gap(8);
    if (!review.comments.length) return content.child(Message("No unresolved comments"));
    return content.children(review.comments.map((c) => {
      const rows = parseDiffHunk(c.diffHunk);
      return v_flex().id(`pr-review-comment-${c.id}`).gap(0).rounded(8).overflow_hidden().border_1().border_color(t.border)
        .child(div().px(8).py(3).text_size(TEXT.caption).text_color(t.muted).bg(t.raised).truncate().child(c.line != null ? `${c.path}:${c.line}` : c.path))
        .when(rows.length > 0, (el) => el.children(rows.map((row) => diffLine(row, t))))
        .child(div().p(8).text_size(TEXT.small).text_color(t.foreground).bg(t.canvas).whitespace_normal().child(c.body));
    }));
  }

  reviewRow(review, t) {
    const open = this.isOpen(review);
    const dim = review.resolved;
    return v_flex().id(`pr-review-${review.id}`)
      .child(Row({ id: `pr-review-toggle-${review.id}`, onClick: (cx) => this.toggleReview(review.id, cx) }).when(open, (el) => el.bg(t.selected))
        .child(Chevron(open))
        .child(div().w(14).flex_none().text_size(12).text_color(dim ? t.dim : STATE_COLOR(review.state, t)).child(STATE_GLYPH[review.state] ?? "·"))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).text_color(dim ? t.dim : t.foreground).child(review.author))
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(relativeTime(review.submittedAt)))
        .when(review.commitsSince > 0, (el) => el.child(div().text_size(TEXT.caption).text_color(t.dim).child(`+${review.commitsSince} commit${review.commitsSince === 1 ? "" : "s"}`)))
        .when(!review.resolved, (el) => el.child(IconButton({ id: `pr-review-launch-${review.id}`, icon: "launch", label: review.isBot ? "Investigate with /pr-babysit" : "Respond with /pr-review-response", onClick: () => this.launch(review) }))))
      .when(open, (el) => el.child(this.reviewDetail(review, t)));
  }

  render(cx) {
    const t = theme();
    const target = this.target();
    const open = this.reviews?.filter((r) => !r.resolved).length ?? 0;
    const root = Panel("pr-reviews")
      .child(PanelHeader()
        .child(div().font_semibold().child(target?.pr ? `PR Reviews · #${target.pr}` : "PR Reviews"))
        .when(Boolean(this.reviews?.length), (el) => el.child(div().px(5).py(1).rounded(4).border_1().border_color(t.border).text_size(TEXT.badge).text_color(t.muted).child(`${this.reviews.length} review${this.reviews.length === 1 ? "" : "s"}`)))
        .child(div().flex_1())
        .when(open > 0, (el) => el.child(div().text_size(11).text_color(t.ansi1).child(`${open} open`)))
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
