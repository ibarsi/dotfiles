// Deploys panel: native rendering of the `<!-- branch-deploy-status -->` bot
// comment for the active space's PR. Opened from my-spaces/indicators.js's
// deploy chip, or the Deploys button in my-tabs. gh and argocd always run on
// this computer (`exec` without `on`), whichever machine the space itself
// lives on.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, spaces, theme, shared, setShared, layout } from "herdr";
import { parseComment, isUnhealthy } from "./parse.js";
import { TEXT, Panel, PanelHeader, Badge, IconButton, Row, Chevron, Link, CodeBlock, Message, Busy } from "./ui.js";

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

const statusColor = (status, t) => (status === "Healthy" || status === "Ready" ? t.ansi2 : status === "Torn down" ? t.dim : t.ansi1);

export default class Deploys extends View {
  init(_props, cx) {
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    if (!enabled.includes("deploys")) setShared("workspace.panels", [...enabled, "deploys"]);
    this.resetStages();
    this.tick(cx);
    cx.timer.every(1000, (cx) => this.tick(cx));
  }

  resetStages() {
    this.openStages = new Set();
    this.stageLogs = {};
    this.stageLoading = {};
    this.stageError = {};
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
      const switched = key !== this.key;
      this.key = key;
      if (switched) { this.sources = null; this.error = null; this.resetStages(); }
      if (target) this.fetch(cx, target);
      else { this.sources = null; this.error = "No PR for this space"; cx.notify(); }
    }
    if (visible !== this.wasVisible) cx.notify();
    this.wasVisible = visible;
  }

  fetch(cx, target) {
    if (!target) return;
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

  toggleStage(key, stage, cx) {
    if (this.openStages.has(key)) { this.openStages.delete(key); cx.notify(); return; }
    this.openStages.add(key);
    cx.notify();
    if (this.stageLogs[key] === undefined && !this.stageLoading[key]) this.loadStage(key, stage, cx);
  }

  // Runs the same argocd calls as gh bd --stage (gh/aliases.yml), rendered
  // in the panel instead of a terminal: sync/health, then a tail of each
  // unhealthy Deployment/StatefulSet's logs. One click, sequential calls.
  loadStage(key, stage, cx) {
    if (!stage.app || !stage.server) { this.stageLogs[key] = `status: ${stage.status}`; cx.notify(); return; }
    this.stageLoading[key] = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const r = await exec("argocd", ["app", "get", stage.app, "--server", stage.server, "-o", "json", "--grpc-web"]);
        if (r.code !== 0) { this.stageError[key] = r.stderr || "Could not reach ArgoCD"; return; }
        const data = JSON.parse(r.stdout);
        const lines = [`sync: ${data.status?.sync?.status ?? "-"}  health: ${data.status?.health?.status ?? "-"}`];
        const bad = (data.status?.resources ?? []).filter((res) => (res.health?.status ?? "Healthy") !== "Healthy" && (res.kind === "Deployment" || res.kind === "StatefulSet"));
        if (!bad.length) lines.push("", "No unhealthy Deployment/StatefulSet resources.");
        for (const res of bad) {
          const logs = await exec("argocd", ["app", "logs", stage.app, "--server", stage.server, "--kind", res.kind, "--group", "apps", "--name", res.name, "--tail", "30", "--grpc-web"]).catch((e) => ({ stdout: "", stderr: String(e) }));
          lines.push("", `== ${res.kind}/${res.name} (last 30) ==`, (logs.stdout || logs.stderr || "(no output)").trimEnd());
        }
        this.stageLogs[key] = lines.join("\n");
      } catch (e) {
        this.stageError[key] = String(e);
      } finally {
        this.stageLoading[key] = false;
        cx.notify();
      }
    });
  }

  stageRow(tg, stage, t) {
    const key = `${tg.name}:${stage.name}`;
    const open = this.openStages.has(key);
    return v_flex().id(`deploy-stage-${key}`)
      .child(Row({ id: `deploy-stage-toggle-${key}`, onClick: (cx) => this.toggleStage(key, stage, cx) })
        .child(Chevron(open))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).text_color(t.foreground).child(stage.name))
        .child(div().text_size(TEXT.caption).text_color(statusColor(stage.status, t)).child(stage.status)))
      .when(open, (el) => el.child(this.stageDetail(key, t)));
  }

  stageDetail(key, t) {
    const content = v_flex().flex_none().pl(22).pr(4).py(2).gap(4);
    if (this.stageLoading[key]) return content.child(Message("Loading…"));
    if (this.stageError[key]) return content.child(Message(this.stageError[key], true));
    if (this.stageLogs[key] !== undefined) return content.child(CodeBlock(this.stageLogs[key]));
    return content;
  }

  targetBlock(tg, t) {
    return v_flex().id(`deploy-target-${tg.name}`).gap(1).py(4)
      .child(h_flex().px(2).pb(2).gap(8).items_center()
        .child(div().font_semibold().text_size(TEXT.small).child(tg.name))
        .child(Badge(tg.status, statusColor(tg.status, t)))
        .when(Boolean(tg.waves), (el) => el.child(div().text_size(TEXT.caption).text_color(t.dim).child(tg.waves)))
        .child(div().flex_1())
        .when(tg.links.length > 0, (el) => el.child(h_flex().gap(10)
          .children(tg.links.map((l) => Link({ id: `deploy-link-${tg.name}-${l.label}`, label: l.label, onClick: () => openUrl(l.url) }))))))
      .children(tg.stages.map((s) => this.stageRow(tg, s, t)));
  }

  render(cx) {
    const t = theme();
    const target = this.target();
    const root = Panel("deploys")
      .child(PanelHeader()
        .child(div().font_semibold().child(target ? `Deploys · #${target.pr}` : "Deploys"))
        .child(div().flex_1())
        .child(IconButton({ id: "deploys-refresh", icon: "refresh", label: "Refresh", spinning: this.loading, disabled: !target, onClick: (cx) => this.fetch(cx, target) })));
    const body = v_flex().id("deploys-body").flex_1().min_h(0).overflow_y_scrollbar().p(8).gap(2);
    if (!target) body.child(Message(this.error ?? "No PR for this space"));
    else if (this.loading && !this.sources) body.child(Busy("Loading deploy status…"));
    else if (this.error) body.child(Message(this.error, true));
    else if (this.sources) for (const source of this.sources) {
      body.child(div().px(2).pb(2).text_size(TEXT.caption).text_color(t.dim).child(source.summary));
      for (const tg of source.targets) body.child(this.targetBlock(tg, t));
    }
    if (this.argocd?.loggedIn === false) body.child(h_flex().mt(6).pt(8).px(2).gap(8).items_center().border_t(1).border_color(t.border)
      .child(div().text_size(13).text_color(t.ansi3).child("⚠"))
      .child(div().flex_1().text_size(TEXT.small).text_color(t.dim).child("Not logged in to ArgoCD"))
      .child(Link({ id: "deploys-login", label: this.loggingIn ? "Logging in…" : "Log in", onClick: (cx) => this.login(cx) })));
    return root.child(body);
  }
}
