// PR and port indicators under each space row, ported from herdr/herdr-sidebar-feed.
// Kept out of main.js so re-cloning Herdr's `spaces` mod only needs the few lines
// marked "indicators" there (herdr-update merges them automatically).
//
// Line under the space name: #PR (coloured by CI, grey while a draft, teal in the merge queue) and listening ports on the left,
// one review/merge status icon (status.js) and the deploy icon on the right.

import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { exec, spaces, panes, terminals } from "herdr";
import { prStatus, alpha } from "./status.js";

const PR_EVERY = 60000; // one batched GraphQL query, ~1 point of the 5,000/hour budget
const PORTS_EVERY = 5000;
// GitHub environment each PR deploys to. Looked up by environment, not commit,
// because rebasing orphans the deployed SHA.
const deployEnv = (n) => `max1-dev-pr-${n}`;

const PR_FRAGMENT = `fragment P on PullRequest {
  number url state isDraft reviewDecision mergeable
  author { login }
  mergeQueueEntry { state }
  reviews(last: 100) { nodes { author { login } submittedAt } }
  commits(last: 100) { nodes { commit { committedDate messageHeadline } } }
  head: commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
}`;

const CI = { FAILURE: "failed", ERROR: "failed", PENDING: "running", EXPECTED: "running", SUCCESS: "passed" };
const DEPLOY = { SUCCESS: "▲", IN_PROGRESS: "△", QUEUED: "△", PENDING: "△", WAITING: "△", FAILURE: "▼", ERROR: "▼", INACTIVE: "॥" };

// "<n> <url> <branch>" for the checkout in each folder argument: upstream branch
// name when set. One exec per machine: herdr-core refuses more than 16 at once.
const KEYS_SH = `n=0; for d; do n=$((n+1)); (cd "$d" 2>/dev/null || exit
url=$(git remote get-url origin 2>/dev/null) || exit
if b=$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null); then b=\${b#*/}; else b=$(git symbolic-ref --short -q HEAD) || exit; fi
echo "$n $url $b"); done`;

// "P <pid> <ppid>" per process, "L <pid> <port>" per listening TCP socket.
// ss is Linux-only and Omarchy ships no lsof; macOS ships no ss.
const PORTS_SH = `ps -e -o pid=,ppid= | awk '{print "P", $1, $2}'
if [ "$(uname -s)" = Darwin ]; then
  lsof -nP -iTCP -sTCP:LISTEN -Fpn 2>/dev/null | awk '/^p/ { pid = substr($0, 2) } /^n/ { n = split($0, a, ":"); print "L", pid, a[n] }'
else
  ss -ltnpH 2>/dev/null | awk '{n = split($4, a, ":"); port = a[n]
    while (match($0, /pid=[0-9]+/)) { print "L", substr($0, RSTART+4, RLENGTH-4), port; $0 = substr($0, RSTART+RLENGTH) }}'
fi`;

const prs = {}; // space id -> summary (see summarize)
const prNums = {}; // "owner/repo branch" -> PR number, for the deployment lookup next refresh
let ports = {}; // space id -> ["3000", ...]
// When each refresh started. A remote exec can hang past its timeout, so a refresh
// older than STUCK no longer blocks the next one.
const busy = { prs: 0, ports: 0 };
const STUCK = 120000;
const claim = (k) => { if (Date.now() - busy[k] < STUCK) return false; busy[k] = Date.now(); return true; };

const RETRY = 10000; // a failed PR refresh (rate limit, offline, refused exec) tries again this soon
let prsNext = 0; // when the next PR refresh is due
let version = 0; // bumped whenever prs or ports may have changed

// The app can start this mod more than once (a layout switch plus a layout file
// rewrite), and a discarded instance's tasks notify a view nobody sees. So each
// view polls `version` and repaints itself, and a new view takes over any
// refresh a discarded one left marked busy.
export function startIndicators(cx) {
  busy.prs = busy.ports = 0;
  prsNext = 0;
  const tick = (cx) => {
    if (Date.now() >= prsNext) refreshPrs(cx);
    refreshPorts(cx);
  };
  tick(cx);
  cx.timer.every(PORTS_EVERY, tick);
  let seen = version;
  cx.timer.every(1000, (cx) => { if (seen !== version) { seen = version; cx.notify(); } });
}

// Space id -> its terminal panes' [machine, cwd], in pane order.
function spacePlaces() {
  const out = {}, spaceOf = {};
  for (const s of spaces()) for (const t of s.tabs ?? []) spaceOf[t.id] = s;
  for (const p of panes()) {
    const s = spaceOf[p.tab];
    if (s && p.terminal && p.cwd) (out[s.id] ??= []).push(JSON.stringify([s.machine ?? null, p.cwd]));
  }
  return out;
}

// place -> "owner/repo branch" for every place, one exec per machine. Machines
// whose exec failed are listed in `failed` so their spaces keep their last values.
async function prKeys(places) {
  const byMachine = {};
  for (const pl of places) { const [on, cwd] = JSON.parse(pl); (byMachine[on ?? ""] ??= []).push([pl, cwd]); }
  const out = {}, failed = new Set();
  await Promise.all(Object.entries(byMachine).map(async ([on, list]) => {
    try {
      const r = await exec("sh", ["-c", KEYS_SH, "sh", ...list.map(([, cwd]) => cwd)], { on: on || null, timeout: 20000 });
      for (const line of r.stdout.split("\n")) {
        const m = /^(\d+) \S*github\.com[:/]([^/\s]+)\/(\S+?)(?:\.git)? (\S+)$/.exec(line);
        if (m) out[list[m[1] - 1][0]] = `${m[2]}/${m[3]} ${m[4]}`;
      }
    } catch { failed.add(on || null); } // machine away, or the core refused the exec
  }));
  return { keyOf: out, failed };
}

function summarize(repo) {
  const nodes = repo?.pullRequests?.nodes ?? [];
  // Prefer an open PR for the branch, else the newest one
  const p = nodes.find((n) => n.state === "OPEN") ?? nodes[0];
  if (!p) return null;
  // Drafts stay grey: CI doesn't matter until the PR is up for review
  const ci = p.state === "MERGED" ? "merged" : p.mergeQueueEntry ? "queued" : p.isDraft ? "" : CI[p.head.nodes[0]?.commit.statusCheckRollup?.state ?? ""] ?? "";
  if (p.state !== "OPEN") return { num: p.number, url: p.url, ci, open: false };
  const deploy = DEPLOY[repo.deployments?.nodes?.[0]?.latestStatus?.state ?? ""] ?? "";
  return { num: p.number, url: p.url, ci, open: true, status: prStatus(p), deploy };
}

function refreshPrs(cx) {
  if (!claim("prs")) return;
  prsNext = Date.now() + RETRY;
  cx.spawn(async (cx) => {
    try {
      const places = spacePlaces();
      const all = [...new Set(Object.values(places).flat())];
      const { keyOf, failed } = await prKeys(all);
      const keys = [...new Set(Object.values(keyOf).filter(Boolean))];
      if (!keys.length) return;
      // One aliased repository() block per repo+branch keeps it one query however many spaces are open.
      const args = [], decl = [], q = [];
      keys.forEach((k, i) => {
        const [slug, branch] = k.split(" ");
        const [owner, name] = slug.split("/");
        args.push("-f", `o${i}=${owner}`, "-f", `n${i}=${name}`, "-f", `b${i}=${branch}`);
        decl.push(`$o${i}: String!`, `$n${i}: String!`, `$b${i}: String!`);
        let block = `r${i}: repository(owner: $o${i}, name: $n${i}) { pullRequests(headRefName: $b${i}, first: 5, orderBy: {field: CREATED_AT, direction: DESC}) { nodes { ...P } }`;
        // ponytail: a new PR's deploy icon appears one refresh late; a second round-trip would close that gap
        if (prNums[k]) {
          args.push("-f", `e${i}=${deployEnv(prNums[k])}`);
          decl.push(`$e${i}: String!`);
          block += ` deployments(environments: [$e${i}], last: 1) { nodes { latestStatus { state } } }`;
        }
        q.push(block + " }");
      });
      const r = await exec("gh", ["api", "graphql", ...args, "-f", `query=query(${decl.join(", ")}) { ${q.join("\n")} } ${PR_FRAGMENT}`], { timeout: 30000 });
      if (r.code !== 0) return;
      const data = JSON.parse(r.stdout).data ?? {};
      const byKey = {};
      keys.forEach((k, i) => {
        byKey[k] = summarize(data[`r${i}`]);
        if (byKey[k]?.open) prNums[k] = byKey[k].num;
      });
      for (const [id, pls] of Object.entries(places)) {
        if (pls.some((pl) => failed.has(JSON.parse(pl)[0]))) continue;
        delete prs[id];
        // A space can hold a main checkout beside a worktree: first pane branch with an open PR wins
        const found = pls.map((pl) => byKey[keyOf[pl]]).filter(Boolean);
        const pick = found.find((s) => s.open) ?? found[0];
        if (pick) prs[id] = pick;
      }
      prsNext = Date.now() + PR_EVERY;
    } catch {
      // Machine away, rate limit, gh missing: keep showing the last values
    } finally {
      busy.prs = 0;
      version++;
    }
  });
}

// Credits each listening TCP port to the space whose terminal shell is an ancestor
// of the listening process. Docker-published ports belong to dockerd, so they don't show.
function refreshPorts(cx) {
  if (!claim("ports")) return;
  cx.spawn(async (cx) => {
    try {
      const shells = {}; // machine -> { shell pid -> space id }
      for (const t of terminals()) {
        const sp = t.labels?.["herdr.space"];
        if (t.state !== "live" || !t.pid || !sp) continue;
        const m = t.machine ?? null;
        (shells[m ?? ""] ??= {})[t.pid] = m ? `${m}/${sp}` : sp;
      }
      const next = {};
      await Promise.all(Object.entries(shells).map(async ([m, shell]) => {
        let out;
        try { out = (await exec("sh", ["-c", PORTS_SH], { on: m || null, timeout: 10000 })).stdout; } catch { return; }
        const parent = {}, seen = {};
        const lines = out.split("\n").map((l) => l.split(" "));
        for (const [k, a, b] of lines) if (k === "P") parent[a] = b;
        for (const [k, pid, port] of lines) {
          if (k !== "L") continue;
          for (let p = pid; p && p !== "1" && p !== "0"; p = parent[p]) {
            if (shell[p]) { (seen[shell[p]] ??= new Set()).add(port); break; }
          }
        }
        for (const [id, set] of Object.entries(seen)) next[id] = [...set].sort((a, b) => a - b);
      }));
      ports = next;
    } finally {
      busy.ports = 0;
      version++;
    }
  });
}

// The extra line for space `id`, or null when there's nothing to show.
// `indent`: px to line it up under the space name. Layout A: #PR and ports on the
// left; on rows with a PR, fixed deploy and status columns pinned right. Each piece is its own element
// (pr-, ports-, status-, deploy-<space>) so a panel can hang a click on it later.
export function indicators(id, t, indent) {
  const p = prs[id];
  const po = ports[id];
  if (!p && !po?.length) return null;
  const ci = { merged: t.mauve ?? t.ansi5, queued: t.ansi6, failed: t.ansi1, running: t.ansi3, passed: t.ansi2 };
  const status = { "↯": t.peach ?? t.ansi3, "✓": t.ansi2, "※": t.ansi4 };
  const deploy = { "▲": t.ansi2, "△": t.ansi3, "▼": t.ansi1 };
  // Bigger hit box; hover tints and outlines the chip in its own colour. Only bg and
  // border_color on hover: text_color inside hover() makes the app silently drop the
  // frame (0.1.15). The border is always there (transparent at rest) so hover can't resize.
  const chip = (key, text, color) => {
    const tint = alpha(color, "2e");
    const el = div().id(`${key}-${id}`).flex_none().px(7).py(2).rounded(4).text_color(color).cursor_pointer();
    // ponytail: non-#rrggbb theme colours get today's plain t.selected hover, no outline
    if (!tint) return el.hover((s) => s.bg(t.selected)).child(text);
    return el.border_1().border_color(alpha(color, "00"))
      .hover((s) => s.bg(tint).border_color(alpha(color, "73"))).child(text);
  };
  return h_flex().pl(indent - 4).pr(2).gap(6).items_center().text_size(11).text_color(t.dim)
    .when(Boolean(p), (el) => el.child(chip("pr", `#${p.num}`, ci[p.ci] ?? t.dim)
      // Keep the press from selecting or dragging the space row underneath.
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_mouse_up("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => { cx.stop_propagation(); openUrl(p.url); })))
    .when(Boolean(po?.length), (el) => el.child(div().id(`ports-${id}`).flex_shrink(1).min_w(0).truncate().child(`:${po.join(",")}`)))
    .child(div().flex_1())
    .when(Boolean(p), (el) => el
      .child(slot(p.deploy && chip("deploy", p.deploy, deploy[p.deploy] ?? t.dim)))
      .child(slot(p.status && chip("status", p.status, status[p.status]))));
}

// Fixed-width column so the deploy and status icons never shift when the other
// one comes or goes. Wide enough for the widest glyph (॥, ※) at 11px plus a hover margin.
const SLOT = 24;
const slot = (el) => (el ? el.w(SLOT).px(0).flex().justify_center() : div().flex_none().w(SLOT));

// Opens in the default browser on this computer (open on macOS, xdg-open elsewhere).
function openUrl(url) {
  if (!url) return;
  exec("open", [url]).catch(() => exec("xdg-open", [url]).catch(() => {}));
}
