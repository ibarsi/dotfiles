// Deploys panel: native rendering of the `<!-- branch-deploy-status -->` bot
// comment for the active space's PR. Opened from my-spaces/indicators.js's
// deploy chip. gh and argocd always run on this computer (`exec` without
// `on`), whichever machine the space itself lives on — see design doc.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, run, spaces, theme, shared, setShared, layout } from "herdr";
import { parseComment, isUnhealthy } from "./parse.js";

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
  return find(layout(), "panel-body")?.active === "deploys" && panel?.hidden !== true;
}

function openUrl(url) {
  exec("open", [url]).catch(() => exec("xdg-open", [url]).catch(() => {}));
}

// Runs `gh bd <pr> -R <repo> --stage <stage>` exactly as the alias prints it,
// in a terminal on this computer. Positional args keep the stage/repo/PR out
// of the shell script text (they come from the bot comment, not from us).
function openStageLogs(target, stage) {
  const argv = ["sh", "-c", 'gh bd "$1" -R "$2" --stage "$3" | less -R', "sh", String(target.pr), target.repo, stage.name];
  const active = spaces().find((s) => s.active);
  if (!active || active.machine === null) { run("terminal.open", { argv, place: "down" }); return; }
  const existing = spaces().find((s) => s.machine === null && s.named && s.name === "Deploys");
  if (existing) run("tab.new", { space: existing.id, argv, name: `${stage.name} logs`, focus: true });
  else run("space.new", { name: "Deploys", argv, focus: true });
}

export default class Deploys extends View {
  init(_props, cx) {
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    if (!enabled.includes("deploys")) setShared("workspace.panels", [...enabled, "deploys"]);
    this.tick(cx);
    cx.timer.every(1000, (cx) => this.tick(cx));
  }

  target() {
    const id = spaces().find((s) => s.active)?.id;
    if (!id) return null;
    return (shared("deploys.targets") ?? {})[id] ?? null;
  }

  tick(cx) {
    const visible = showing();
    const target = this.target();
    const key = target ? `${target.repo}#${target.pr}` : null;
    if (visible && (!this.wasVisible || key !== this.key || Date.now() - this.lastFetch > FETCH_EVERY)) {
      this.key = key;
      if (target) this.fetch(cx, target);
      else { this.sources = null; this.error = "No PR for this space"; cx.notify(); }
    }
    if (visible !== this.wasVisible) cx.notify();
    this.wasVisible = visible;
  }

  fetch(cx, target) {
    this.loading = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const r = await exec("gh", ["pr", "view", String(target.pr), "-R", target.repo, "--json", "comments"]);
        if (JSON.stringify(this.target()) !== JSON.stringify(target)) return; // stale: space or PR moved on
        if (r.code !== 0) { this.sources = null; this.error = "Could not reach GitHub"; return; }
        const bot = (JSON.parse(r.stdout).comments ?? []).find((c) => c.body?.includes("<!-- branch-deploy-status -->"));
        if (!bot) { this.sources = null; this.error = `No branch deploy for #${target.pr}`; return; }
        this.sources = [parseComment(bot.body)];
        this.error = null;
        this.lastFetch = Date.now();
        await this.checkArgocd();
      } catch {
        this.sources = null;
        this.error = "Could not reach GitHub";
      } finally {
        this.loading = false;
        cx.notify();
      }
    });
  }

  async checkArgocd() {
    const stages = (this.sources ?? []).flatMap((s) => s.targets.flatMap((t) => t.stages));
    const bad = stages.find((s) => isUnhealthy(s.status) && s.server);
    if (!bad) { this.argocdServer = null; this.argocd = null; return; }
    this.argocdServer = bad.server;
    try {
      const r = await exec("argocd", ["account", "get-user-info", "--server", bad.server, "--grpc-web"]);
      this.argocd = { loggedIn: r.code === 0 };
    } catch {
      this.argocd = { loggedIn: false };
    }
  }

  login(cx) {
    if (!this.argocdServer || this.loggingIn) return;
    this.loggingIn = true;
    cx.notify();
    const server = this.argocdServer;
    cx.spawn(async (cx) => {
      try { await exec("argocd", ["login", server, "--sso", "--grpc-web"]); } catch { /* re-checked below either way */ }
      await this.checkArgocd();
      this.loggingIn = false;
      cx.notify();
    });
  }

  render(cx) {
    const t = theme();
    const target = this.target();
    const color = (status) => (status === "Healthy" ? t.ansi2 : status === "Ready" ? t.ansi2 : status === "Torn down" ? t.dim : t.ansi1);
    const stageChip = (target_, stage) => h_flex().id(`deploy-stage-${stage.name}`).gap(4).items_center().px(6).py(2).rounded(4).cursor_pointer()
      .hover((s) => s.bg(t.hover)).on_click(() => openStageLogs(target_, stage))
      .child(div().text_size(12).text_color(t.foreground).child(stage.name))
      .child(div().text_size(12).text_color(color(stage.status)).child(isUnhealthy(stage.status) ? "▼" : "✅"));
    const linkRow = (links) => h_flex().gap(4).flex_wrap().children(links.map((l, i) => h_flex().gap(4)
      .child(div().id(`deploy-link-${l.label}`).text_size(12).text_color(t.ansi4).cursor_pointer().hover((s) => s.text_color(t.foreground)).on_click(() => openUrl(l.url)).child(l.label))
      .child(i < links.length - 1 ? div().text_size(12).text_color(t.dim).child("·") : div())));
    const targetBlock = (tg) => v_flex().gap(4).py(6)
      .child(h_flex().gap(8).items_center()
        .child(div().font_semibold().text_size(13).child(tg.name))
        .child(div().text_size(12).text_color(color(tg.status)).child(tg.status))
        .when(Boolean(tg.waves), (el) => el.child(div().text_size(12).text_color(t.dim).child(`· ${tg.waves}`))))
      .when(tg.stages.length > 0, (el) => el.child(h_flex().gap(4).flex_wrap().children(tg.stages.map((s) => stageChip({ repo: target.repo, pr: target.pr }, s)))))
      .when(tg.links.length > 0, (el) => el.child(linkRow(tg.links)));
    return v_flex().id("deploys").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(13)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_semibold().child(target ? `Deploys · #${target.pr}` : "Deploys"))
        .child(div().flex_1())
        .child(div().id("deploys-refresh").text_color(t.dim).cursor_pointer().hover((s) => s.text_color(t.foreground))
          .when(Boolean(target), (el) => el.on_click((_e, cx) => this.fetch(cx, target))).child("⟳")))
      .child(v_flex().flex_1().min_h(0).overflow_y_scrollbar().p(10).gap(4)
        .when(!target, (el) => el.child(div().text_color(t.dim).child(this.error ?? "No PR for this space")))
        .when(Boolean(target) && Boolean(this.error), (el) => el.child(div().text_color(t.dim).child(this.error)))
        .when(Boolean(target) && !this.error && !this.sources, (el) => el.child(div().text_color(t.dim).child(this.loading ? "Loading…" : "")))
        .when(Boolean(this.sources), (el) => el.children(this.sources.flatMap((source) => [
          div().text_size(12).text_color(t.dim).child(source.summary),
          ...source.targets.map((tg) => targetBlock(tg)),
        ])))
        .when(Boolean(this.argocd) && this.argocd.loggedIn === false, (el) => el.child(h_flex().gap(8).items_center().py(6).border_t(1).border_color(t.border)
          .child(div().text_size(13).text_color(t.ansi3).child("⚠"))
          .child(div().flex_1().text_size(12).text_color(t.dim).child("Not logged in to ArgoCD"))
          .child(div().id("deploys-login").text_size(12).text_color(t.ansi4).cursor_pointer().hover((s) => s.text_color(t.foreground))
            .on_click((_e, cx) => this.login(cx)).child(this.loggingIn ? "Logging in…" : "Log in")))));
  }
}
