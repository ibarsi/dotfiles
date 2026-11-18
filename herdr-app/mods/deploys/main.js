// Deploys panel: native rendering of the `<!-- branch-deploy-status -->` bot
// comment for the active space's PR. Opened from my-spaces/indicators.js's
// deploy chip, or the Deploys button in my-tabs. gh (GitHub API) runs on this
// computer regardless; local kubectl/argocd calls run on target.machine in
// target.cwd (the worktree indicators.js saw the pane in), since the Kind
// cluster lives there and mise resolves kubectl/argocd per-directory.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, run, spaces, panes, terminals, theme, shared, setShared, layout } from "herdr";
import { parseComment, isUnhealthy, isFailed } from "./parse.js";
import { branchSuffix, bankInstance, bankNamespace, parentAppName, LOCAL_CONTEXT, LOCAL_CHILD_GROUPS } from "./local.js";
import { podProblems, parsePodLines, POD_TEMPLATE } from "./pods.js";
import { TEXT, Panel, PanelHeader, Badge, IconButton, Row, Chevron, Link, CodeBlock, Message, Busy } from "./ui.js";

const AGENT_ARGV = ["claude", "--dangerously-skip-permissions", "--model", "haiku"]; // ccyolo, haiku

const FETCH_EVERY = 60000;

// `argocd --core` reads Applications through the kubeconfig context's own
// namespace, which defaults to "default", not sys-argocd — so every call
// runs against a namespace-scoped temp copy, the same trick devcd's
// CoreClient uses (dev-tooling/tasks/argocd/client.py). No login, no
// --server/--grpc-web: --core talks to the Kubernetes API directly.
const LOCAL_ARGOCD_SH = `set -e
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
kubectl config view --minify --context ${LOCAL_CONTEXT} --raw > "$tmp" 2>/dev/null
KUBECONFIG="$tmp" kubectl config set-context --current --namespace sys-argocd >/dev/null 2>&1
KUBECONFIG="$tmp" argocd "$@" --core --kube-context ${LOCAL_CONTEXT}`;

const LOCAL_PROBE_SH = `kubectl --context ${LOCAL_CONTEXT} get nodes --request-timeout=3s >/dev/null 2>&1 || { echo no-cluster; exit; }
kubectl --context ${LOCAL_CONTEXT} get deploy -n "$1" gat-main --request-timeout=3s >/dev/null 2>&1 || { echo not-deployed; exit; }
echo ok`;

// PR deploys land on max1-dev-us-gcp-e4. Machines reach it under different
// context names (Omen: the Tailscale API server; a Mac: Connect Gateway, no VPN;
// the direct gke_ one needs the VPN), so pod calls take the first that exists
// where they run. Namespaces follow usemaximum/maximum's
// dev-tooling/tasks/branch_deploy/targets.py namespace().
const REMOTE_CONTEXTS = [
  "max1-dev-us-gcp-e4-apiserver.tail59cd7d.ts.net",
  "connectgateway_max1-dev-us-454015_global_max1-dev-us-gcp-e4",
  "gke_max1-dev-us-454015_us-east4_max1-dev-us-gcp-e4",
].join(" ");
const remoteNamespace = (target, pr) => (target === "platform" ? `bnk-pr-${pr}` : `${target}-pr-${pr}`);

// $1: space-separated candidate contexts, first one configured wins.
const PICK_CONTEXT = `ctx=; for c in $1; do kubectl config get-contexts "$c" >/dev/null 2>&1 && { ctx=$c; break; }; done
[ -n "$ctx" ] || { echo "no-context" >&2; exit 3; }
`;
const PODS_SH = `${PICK_CONTEXT}kubectl --context "$ctx" get pods -n "$2" -o go-template="$3" --request-timeout=8s`;
// --previous first: a crashlooping container's useful output is from the run that died.
// $4 names the failing container; without it (pod never started one) take them all.
const POD_DETAIL_SH = `${PICK_CONTEXT}sel=--all-containers; [ -n "$4" ] && sel="--container=$4"
echo "== Warning events =="
kubectl --context "$ctx" -n "$2" get events --field-selector "involvedObject.name=$3,type=Warning" --sort-by=.lastTimestamp --request-timeout=8s 2>&1 | tail -n 8
echo; echo "== Logs\${4:+ ($4)} (last 30) =="
kubectl --context "$ctx" -n "$2" logs "$3" "$sel" --tail 30 --previous --request-timeout=8s 2>/dev/null \\
  || kubectl --context "$ctx" -n "$2" logs "$3" "$sel" --tail 30 --request-timeout=8s 2>&1`;

function podsError(stderr, on) {
  const where = on || "this computer";
  if (/no-context/.test(stderr)) return `No kube context for this cluster on ${where}`;
  if (/Reauthentication|refreshing your current auth|gcloud auth login/.test(stderr)) return `GKE auth expired on ${where}: run gcloud auth login`;
  if (/plugin not found|No version is set for shim/.test(stderr)) return `kubectl or gke-gcloud-auth-plugin not available on ${where}`;
  return "Could not list pods";
}

async function fetchPods({ context, namespace, on, cwd }) {
  const r = await exec("sh", ["-c", PODS_SH, "sh", context, namespace, POD_TEMPLATE], { timeout: 15000, on: on || null, cwd }).catch((e) => ({ code: 1, stderr: String(e) }));
  if (r.code !== 0) return { error: podsError(r.stderr ?? "", on) };
  return podProblems(parsePodLines(r.stdout));
}

const localArgocd = (args, timeout, on, cwd) => exec("sh", ["-c", LOCAL_ARGOCD_SH, "sh", ...args], { timeout, on: on || null, cwd });

// Same as my-spaces/status.js terminalSpace: a terminal's space id, machine-prefixed when remote.
function spaceOf(tm) {
  const sp = tm.labels?.["herdr.space"];
  if (!sp) return null;
  const m = tm.machine ?? (tm.address?.includes("/") ? tm.address.split("/")[0] : null);
  return m ? `${m}/${sp}` : sp;
}

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
    const key = target ? `${target.repo}@${target.branch}` : null;
    if (visible && (!this.wasVisible || key !== this.key || Date.now() - this.lastFetch > FETCH_EVERY)) {
      const switched = key !== this.key;
      this.key = key;
      if (switched) { this.sources = null; this.error = null; this.resetStages(); }
      if (target) this.fetch(cx, target);
      else { this.sources = null; this.error = "No repo detected for this space"; cx.notify(); }
    }
    if (visible !== this.wasVisible) cx.notify();
    this.wasVisible = visible;
  }

  fetch(cx, target) {
    if (!target) return;
    this.loading = true;
    cx.notify();
    cx.spawn(async (cx) => {
      let ghEntry = null, ghError = null;
      try {
        if (target.pr) {
          const r = await exec("gh", ["pr", "view", String(target.pr), "-R", target.repo, "--json", "comments"]);
          if (r.code !== 0) ghError = "Could not reach GitHub";
          else {
            // No bot comment yet just means nothing's deployed there, not an error: section stays hidden.
            const bot = (JSON.parse(r.stdout).comments ?? []).find((c) => c.body?.includes("<!-- branch-deploy-status -->"));
            if (bot) ghEntry = parseComment(bot.body);
            for (const tg of ghEntry?.targets ?? []) if (tg.status !== "Torn down") tg.pods = { context: REMOTE_CONTEXTS, namespace: remoteNamespace(tg.name, target.pr), on: target.machine, cwd: target.cwd };
          }
        }
      } catch {
        ghError = "Could not reach GitHub";
      }
      const localEntry = await this.fetchLocal(target.branch, target.machine, target.cwd).catch(() => ({ name: "Local", summary: "Could not read local ArgoCD state", targets: [] }));
      const sources = [ghEntry, localEntry].filter(Boolean);
      await Promise.all(sources.flatMap((s) => s.targets).filter((tg) => tg.pods).map(async (tg) => Object.assign(tg.pods, await fetchPods(tg.pods))));
      if (JSON.stringify(this.target()) !== JSON.stringify(target)) return; // stale: space or branch moved on
      this.sources = sources;
      this.error = ghError;
      this.lastFetch = Date.now();
      await this.checkArgocd();
      this.loading = false;
      cx.notify();
    });
  }

  // The maximum-dev Kind cluster, one namespace per branch (see local.js).
  // One kubectl call reads the parent and every child app's sync/health.
  async fetchLocal(branch, machine, cwd) {
    if (!branch) return null;
    const suffix = branchSuffix(branch);
    const namespace = bankNamespace(suffix);
    const appName = parentAppName(suffix);
    const probe = await exec("sh", ["-c", LOCAL_PROBE_SH, "sh", namespace], { timeout: 8000, on: machine || null, cwd }).catch(() => ({ stdout: "no-cluster" }));
    const state = probe.stdout.trim().split("\n").pop();
    // Nothing deployed locally isn't an error: hide the section rather than show it empty.
    if (state === "no-cluster" || state === "not-deployed") return null;
    try {
      // Three columns, not -o json: the full Application list is megabytes.
      const r = await exec("kubectl", ["--context", LOCAL_CONTEXT, "get", "applications.argoproj.io", "-n", "sys-argocd", "--no-headers", "-o", "custom-columns=N:.metadata.name,H:.status.health.status,S:.status.sync.status", "--request-timeout=8s"], { timeout: 15000, on: machine || null, cwd });
      if (r.code !== 0) return { name: "Local", summary: "Could not read local ArgoCD state", targets: [] };
      const apps = Object.fromEntries(r.stdout.split("\n").map((l) => l.trim().split(/\s+/)).filter((c) => c[0]).map(([n, h, sy]) => [n, { health: h, sync: sy }]));
      const health = apps[appName]?.health ?? "Unknown";
      const sync = apps[appName]?.sync ?? "Unknown";
      return {
        name: "Local",
        summary: `${sync} · ${health}`,
        targets: [{
          name: bankInstance(suffix), status: health, waves: "", links: [],
          stages: LOCAL_CHILD_GROUPS.map((g) => ({ name: g, status: apps[`${appName}-${g}`]?.health ?? "Missing", app: `${appName}-${g}`, local: true, namespace, machine, cwd })),
          pods: { context: LOCAL_CONTEXT, namespace, on: machine, cwd },
        }],
      };
    } catch {
      return { name: "Local", summary: "Could not read local ArgoCD state", targets: [] };
    }
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

  // Runs the same argocd calls as gh bd --stage (gh/aliases.yml) for a remote
  // stage, or the --core equivalent for a local one, rendered in the panel
  // instead of a terminal: sync/health, then a tail of each unhealthy
  // Deployment/StatefulSet's logs. One click, sequential calls.
  loadStage(key, stage, cx) {
    if (stage.pod) return this.loadPod(key, stage, cx);
    if (stage.local) return this.loadLocalStage(key, stage, cx);
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

  loadLocalStage(key, stage, cx) {
    this.stageLoading[key] = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const r = await localArgocd(["app", "get", stage.app, "-o", "json"], 20000, stage.machine, stage.cwd);
        if (r.code !== 0) { this.stageError[key] = r.stderr || "Could not reach local ArgoCD"; return; }
        const data = JSON.parse(r.stdout);
        const lines = [`sync: ${data.status?.sync?.status ?? "-"}  health: ${data.status?.health?.status ?? "-"}`];
        const bad = (data.status?.resources ?? []).filter((res) => (res.health?.status ?? "Healthy") !== "Healthy" && (res.kind === "Deployment" || res.kind === "StatefulSet"));
        if (!bad.length) lines.push("", "No unhealthy Deployment/StatefulSet resources.");
        for (const res of bad) {
          const logs = await localArgocd(["app", "logs", stage.app, "--kind", res.kind, "--group", "apps", "--name", res.name, "--tail", "30"], 20000, stage.machine, stage.cwd).catch((e) => ({ stdout: "", stderr: String(e) }));
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

  loadPod(key, s, cx) {
    this.stageLoading[key] = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const r = await exec("sh", ["-c", POD_DETAIL_SH, "sh", s.context, s.namespace, s.pod, s.container ?? ""], { timeout: 30000, on: s.on || null, cwd: s.cwd });
        this.stageLogs[key] = (r.stdout || r.stderr || "(no output)").trimEnd();
      } catch (e) {
        this.stageError[key] = String(e);
      } finally {
        this.stageLoading[key] = false;
        cx.notify();
      }
    });
  }

  podsBlock(sourceName, tg, t) {
    const p = tg.pods;
    const bad = Boolean(p.error) || p.problems?.length > 0;
    const summary = p.error ?? (!p.total ? "No pods" : p.problems.length ? `${p.problems.length} of ${p.total} unhealthy` : `${p.total} healthy`);
    return v_flex().id(`deploy-pods-${sourceName}-${tg.name}`).pt(6)
      .child(h_flex().px(2).pb(2).gap(6).items_center()
        .child(div().text_size(TEXT.caption).text_color(t.muted).child("Pods"))
        .child(div().text_size(TEXT.caption).text_color(bad ? t.ansi1 : t.dim).child(`· ${summary}`)))
      .children((p.problems ?? []).map((pod) => this.podRow(sourceName, tg, pod, t)));
  }

  podRow(sourceName, tg, pod, t) {
    const key = `${sourceName}:${tg.name}:pod:${pod.name}`;
    const open = this.openStages.has(key);
    const canInvestigate = tg.pods.context === LOCAL_CONTEXT || Boolean(this.target()?.pr);
    return v_flex().id(`deploy-pod-${key}`)
      .child(Row({ id: `deploy-pod-toggle-${key}`, onClick: (cx) => this.toggleStage(key, { ...tg.pods, pod: pod.name, container: pod.container }, cx) })
        .child(Chevron(open))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).text_color(t.foreground).child(pod.name))
        .child(div().text_size(TEXT.caption).text_color(t.ansi1).child(pod.restarts ? `${pod.reason} · ${pod.restarts}×` : pod.reason))
        .when(canInvestigate, (el) => el.child(IconButton({ id: `deploy-investigate-pod-${key}`, icon: "investigate", label: "Investigate with Claude (haiku)", onClick: () => this.investigatePod(tg, pod) }))))
      .when(open, (el) => el.child(this.stageDetail(key, t)));
  }

  // Like the sidebar's rebase icon: splits a haiku agent into the active space's
  // shown tab to investigate, read-only. Skipped while one for the same prompt
  // is still running there.
  spawnAgent(prompt) {
    const target = this.target();
    const space = spaces().find((s) => s.active);
    if (!target || !space) return;
    const argv = [...AGENT_ARGV, prompt + "Read-only: don't sync, delete or edit cluster resources or code. Report the root cause and a suggested fix."];
    const running = terminals().some((tm) => tm.state === "live" && spaceOf(tm) === space.id && tm.argv?.join("\0") === argv.join("\0"));
    if (running) return;
    const tab = space.tabs?.find((tb) => tb.active);
    const tabPanes = panes().filter((p) => p.tab === tab?.id && p.terminal);
    // The new pane starts in the split pane's folder: prefer the worktree's own, where mise provides argocd/kubectl.
    // ponytail: falls back to any pane, whose folder may lack them; wrap argv in `sh -c 'cd …'` if that bites.
    const pane = tabPanes.find((p) => p.cwd === target.cwd) ?? tabPanes[0];
    if (pane) run("pane.split", { direction: "right", pane: pane.pane, argv });
  }

  investigate(stage) {
    const target = this.target();
    if (!target) return;
    const prompt = stage.local
      ? `The ArgoCD app ${stage.app} (stage "${stage.name}") of the local Kind deploy for branch ${target.branch} is ${stage.status}. `
        + `Investigate why: start with \`kubectl --context ${LOCAL_CONTEXT} -n sys-argocd get applications.argoproj.io ${stage.app} -o yaml\` `
        + `(status.conditions, status.resources), then the unhealthy workloads in namespace ${stage.namespace} (pods, events, logs). `
      : `Stage "${stage.name}" of PR #${target.pr}'s branch deploy is ${stage.status}. `
        + `Investigate why: start with \`gh bd ${target.pr} -R ${target.repo} --stage ${stage.name}\`, then dig into the failing resources and their logs. `;
    this.spawnAgent(prompt);
  }

  investigatePod(tg, pod) {
    const target = this.target();
    if (!target) return;
    const p = tg.pods;
    const local = p.context === LOCAL_CONTEXT;
    const restarted = pod.restarts ? ` (restarted ${pod.restarts}×)` : "";
    const container = pod.container ? ` (container ${pod.container})` : "";
    const prompt = local
      ? `Pod ${pod.name} in namespace ${p.namespace} of the local Kind deploy for branch ${target.branch} is ${pod.reason}${restarted}. `
        + `Investigate why: start with \`kubectl --context ${LOCAL_CONTEXT} -n ${p.namespace} describe pod ${pod.name}\`, then its events and logs${container}. `
      : `Pod ${pod.name} in namespace ${p.namespace} of PR #${target.pr}'s branch deploy is ${pod.reason}${restarted}. `
        + `Investigate why: pick a configured kubectl context from "${p.context}", then check the pod's events and logs${container} in that namespace. `;
    this.spawnAgent(prompt);
  }

  stageRow(sourceName, tg, stage, t) {
    const key = `${sourceName}:${tg.name}:${stage.name}`;
    const open = this.openStages.has(key);
    const canInvestigate = isFailed(stage.status) && (stage.local || this.target()?.pr);
    return v_flex().id(`deploy-stage-${key}`)
      .child(Row({ id: `deploy-stage-toggle-${key}`, onClick: (cx) => this.toggleStage(key, stage, cx) })
        .child(Chevron(open))
        .child(div().flex_1().min_w(0).truncate().text_size(TEXT.small).text_color(t.foreground).child(stage.name))
        .child(div().text_size(TEXT.caption).text_color(statusColor(stage.status, t)).child(stage.status))
        .when(canInvestigate, (el) => el.child(IconButton({ id: `deploy-investigate-${key}`, icon: "investigate", label: "Investigate with Claude (haiku)", onClick: () => this.investigate(stage) }))))
      .when(open, (el) => el.child(this.stageDetail(key, t)));
  }

  stageDetail(key, t) {
    const content = v_flex().flex_none().pl(22).pr(4).py(2).gap(4);
    if (this.stageLoading[key]) return content.child(Message("Loading…"));
    if (this.stageError[key]) return content.child(Message(this.stageError[key], true));
    if (this.stageLogs[key] !== undefined) return content.child(CodeBlock(this.stageLogs[key]));
    return content;
  }

  targetBlock(sourceName, tg, t) {
    return v_flex().id(`deploy-target-${sourceName}-${tg.name}`).gap(1).py(4)
      .child(h_flex().px(2).pb(2).gap(8).items_center()
        .child(div().font_semibold().text_size(TEXT.small).child(tg.name))
        .child(Badge(tg.status, statusColor(tg.status, t)))
        .when(Boolean(tg.waves), (el) => el.child(div().text_size(TEXT.caption).text_color(t.dim).child(tg.waves)))
        .child(div().flex_1())
        .when(tg.links.length > 0, (el) => el.child(h_flex().gap(10)
          .children(tg.links.map((l) => Link({ id: `deploy-link-${tg.name}-${l.label}`, label: l.label, onClick: () => openUrl(l.url) }))))))
      .children(tg.stages.map((s) => this.stageRow(sourceName, tg, s, t)))
      .when(Boolean(tg.pods), (el) => el.child(this.podsBlock(sourceName, tg, t)));
  }

  sourceSection(source, t) {
    return v_flex().id(`deploy-source-${source.name}`).gap(1).py(4)
      .child(h_flex().px(2).gap(6).items_center()
        .child(div().font_semibold().text_size(TEXT.small).text_color(t.muted).child(source.name))
        .child(div().text_size(TEXT.caption).text_color(t.dim).child(`· ${source.summary}`)))
      .children(source.targets.map((tg) => this.targetBlock(source.name, tg, t)));
  }

  render(cx) {
    const t = theme();
    const target = this.target();
    const root = Panel("deploys")
      .child(PanelHeader()
        .child(div().font_semibold().child(target?.pr ? `Deploys · #${target.pr}` : "Deploys"))
        .child(div().flex_1())
        .child(IconButton({ id: "deploys-refresh", icon: "refresh", label: "Refresh", spinning: this.loading, disabled: !target, onClick: (cx) => this.fetch(cx, target) })));
    const body = v_flex().id("deploys-body").flex_1().min_h(0).overflow_y_scrollbar().p(8).gap(2);
    if (!target) body.child(Message(this.error ?? "No repo detected for this space"));
    else {
      if (this.loading && !this.sources) body.child(Busy("Loading deploy status…"));
      if (this.error) body.child(Message(this.error, true));
      if (this.sources && !this.sources.length && !this.error) body.child(Message("Not deployed anywhere"));
      // Two sources (branch deploy + local Kind) get a divider and breathing room between
      // them so they read as separate deploys, not one continuous list; one gets none.
      this.sources?.forEach((source, i) => {
        if (i > 0) body.child(div().flex_none().mt(4).mb(6).border_t(1).border_color(t.border));
        body.child(this.sourceSection(source, t));
      });
    }
    if (this.argocd?.loggedIn === false) body.child(h_flex().mt(6).pt(8).px(2).gap(8).items_center().border_t(1).border_color(t.border)
      .child(div().text_size(13).text_color(t.ansi3).child("⚠"))
      .child(div().flex_1().text_size(TEXT.small).text_color(t.dim).child("Not logged in to ArgoCD"))
      .child(Link({ id: "deploys-login", label: this.loggingIn ? "Logging in…" : "Log in", onClick: (cx) => this.login(cx) })));
    return root.child(body);
  }
}
