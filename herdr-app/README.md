# Herdr app

Settings, keybindings and Catppuccin Mocha theme for the Herdr desktop app
(`/Applications/Herdr.app` on macOS, `/usr/bin/herdr-app` on Omarchy). The app
runs on its own `herdr-core` (`hc`) and keeps its config in
`~/.config/herdr-app/` on both platforms, so one tracked setup keeps the Mac
and Omarchy in sync.

## Installation

Install the app by hand (there is no Homebrew cask), launch it once, then run
`bash herdr-app/install.sh` from the repository root. macOS bootstrap runs it
with every other `*/install.sh`, and `bootstrap-omarchy.sh` runs it on Linux.
Existing unlinked files are moved aside as `<name>.backup.<timestamp>`.

Some bindings in `keys.json` use `cmd-…`. They're for macOS and may do nothing
on Linux, or clash with Hyprland's Super bindings. The Ctrl-Space prefix,
Alt and Ctrl-Alt bindings behave the same on both.

Cmd-M minimizes the window and Cmd-A selects all terminal contents, matching
the macOS defaults added in Herdr 0.1.16.

## What is tracked

- `keys.json` is linked into `~/.config/herdr-app/`. On top of the app's
  defaults it adds the Ctrl-Space prefix bindings from the old herdr TUI:
  split (`h`/`v`, Alt-Enter), close pane (`x`, Alt-Esc), zoom (`z`), new and
  rename tab (`c`/`r`), close tab (Ctrl-K), new, rename and close space
  (Shift-C/R/K), plus Alt-arrows for tabs and spaces, Ctrl-Alt-arrows to
  focus panes and Alt-1..9 for tabs. Because the file has been edited, app
  updates no longer add new default shortcuts to it; add them by hand.
- `settings.json` is linked to `settings.macos.json` on macOS and
  `settings.linux.json` elsewhere (Omarchy). Both select the `catppuccin-mocha`
  theme, turn on font ligatures and turn off sounds and pane scrollbars. The app
  writes through the link, so zoom (Cmd +/-) and other Settings changes land in
  that platform's file only and show up in `git diff`. `zoom`, `font_size` and `font_weight`
  are per screen or platform and may differ. Keep everything else identical: copy other
  changes to the other file by hand.
  `mise run herdr-settings-check` reports drift, and the `herdr-settings-sync`
  pre-commit hook runs it when either file is staged. To commit an intentional
  difference, use `SKIP=herdr-settings-sync git commit`.
- `themes/catppuccin-mocha.json` is generated from
  [palette.sh](../theme/palette.sh) on each install, following the
  [colour rule](../theme/README.md#colour-rule-reference-the-palette-never-hardcode-hex).
  Re-run the installer after a palette change.

Window position, open spaces and mod state stay untracked because the app
rewrites them.

## Sidebar indicators

`install.sh` links `mods/my-spaces/` and generates `layouts/my-main.json`
from the shipped `main` layout with `my-spaces` in place of `spaces`. Pick
the layout once with `herdr-app do layout.switch '{"name":"my-main"}'` (or
Ctrl-Shift-L).

`my-spaces` is a clone of Herdr's spaces mod. `indicators.js` adds a line under
each space with its PR and ports: on the left the PR number
coloured by CI, grey while the PR is a draft and teal in the merge queue (click it to open the PR in your browser) and listening ports;
the deploy icon and then one status icon in fixed columns on the right edge, so
each keeps its place when the other is absent. The status icon is the
first that applies (none while queued): crossing arrows for a merge conflict
(peach), a check for approval, or a comment bubble for changes requested or a
new review since your last non-merge commit. Deployment uses outlined circles
with a check (success), clock (pending/running), cross (failure), or pause (inactive).
All seven icons use a 24-unit SVG grid, 2-unit rounded strokes and a 14px rendered
size, centered in the existing 24px columns; hover shows their meaning. Assets live
in `mods/my-spaces/icons/` and take their colors from the active theme. Status logic
remains in `mods/my-spaces/status.js` (tested with `node --test
herdr-app/mods/my-spaces/status.test.mjs`). Click the conflict icon to split a
`claude --model haiku /rebase` pane (skipping permissions) into that space's shown
tab without switching to it. A second click does nothing while that session is
still running. PR data comes from one `gh api graphql` query every 60s; ports from one
`lsof`/`ss` scan per machine every 5s, so Omen spaces get theirs too.

Rows have no letter avatar. Instead, a bar down the row's left edge shows each
agent in the space as one segment, most urgent on top: blocked (pulses), done,
working, then idle (dimmed), at most four. Spaces without agents have no bar.
Those lines are marked `// agents`. The collapsed rail still shows one dot.

Each row's white title is the name you gave the space (Shift-R), else its git
branch, else the folder its first terminal is in (`~` for the home folder). The
grey text on the right shows only the repo, omitted for worktrees and spaces
named after the repo. Branch and space names are not repeated there; ahead/behind
counts remain. Those lines are marked `// branch-first`.

Worktree rows sit at half the upstream indent (11px). Those lines are marked
`// indent`.

The clone's `main.js` differs from upstream only in lines marked
`// indicators`, `// agents`, `// sticky`, `// branch-first`, `// indent` and `// local: <repo>#<n>`.
Mark every new change to it the same way so `herdr-update` can merge
upstream changes around it.

Local fixes to the clone, such as a backport of an upstream PR that hasn't
shipped yet or a fix for an open issue, go straight into `main.js`. Each hunk
gets one line ending in `// local: herdrdev/herdr-app#<n>`. Keep a backport
byte-identical to the upstream PR apart from that marker. Once a release ships
the marked line verbatim, `herdr-update` drops the marker before merging, so
the hunk merges away. A fix that upstream makes differently shows up as a
normal conflict. Until then `herdr-update` lists the open markers. The previous
backports, herdrdev/herdr-app#856 (bounded git checks) and #857 (retain the last
git result on a transient failure), shipped in 0.1.16; no local backports remain.

Worktree grouping is sticky: each space remembers the last repo it was seen
in (lines marked `// sticky`, kept across restarts), so a failed git lookup or
a root space whose terminal left the repo no longer un-nests its worktrees.
Lines marked `// local: <repo>#<n>` are upstream fixes backported early;
`herdr-update` drops them once upstream ships the same line.

The clone is reconciled with Herdr 0.1.16. It includes upstream's automatic
scrolling to the active space, flexible title widths and cancellation of folder
watches for repositories no longer shown. PR/port indicators, agent bars, sticky
grouping, custom titles and the reduced worktree indent remain in place.

The app doesn't hot-reload mods through the symlink. After editing, switch
layouts away and back (`herdr-update --check` does this).

## Deploys panel

A **Deploys** button sits in the tabs bar next to Files and Changes (added to
`my-tabs`, a clone of Herdr's `tabs` mod), and a space's deploy icon switches
to that space and opens the same panel. Either shows what
[`gh bd`](../gh/README.md) shows for that space's PR: each target's state and
ArgoCD stages, with every preview URL (Console, Admin, API, Consumer, Docs)
one click away. Clicking a stage expands it in place and, if it's unhealthy,
loads a tail of its Deployment/StatefulSet logs inline — the same `argocd`
calls `gh bd --stage` makes, rendered in the panel instead of a terminal.
Click the button (or the icon on the active space) again to close it.

`mods/deploys/` is a from-scratch mod (not a clone, visuals split into
`main.js` for state/fetching and `ui.js` for small render helpers), linked by
`install.sh` the same way as `my-spaces`, with its `{id: "deploys", ...}`
block appended to the `panel-body` stack in the generated `my-main.json`.
Parsing the bot's `<!-- branch-deploy-status -->` comment lives in
`mods/deploys/parse.js` (no imports, tested with `node --test
herdr-app/mods/deploys/parse.test.mjs`), the same split `my-spaces/status.js`
uses. `indicators.js` publishes each space's `{repo, branch, pr}` through
`setShared("deploys.targets", …)`, only when it changes (`pr` is null without
an open PR — a local deploy is branch-based, not PR-based); the panel fetches
once per space switch (showing a spinner, never the previous space's stale
content), on a manual refresh, and every 60s while shown, and nothing while
hidden.

The panel renders one section per source, and `this.sources` only ever holds
the ones that actually have something deployed: a "Branch deploy" entry once
there's an open PR with a branch-deploy bot comment, and a "Local" entry for
the `maximum-dev` Kind cluster once the branch is actually deployed there.
Neither existing isn't an error — the section is just omitted, so a branch
with no PR and no local deploy shows "Not deployed anywhere" instead of two
empty sections. When both are present they get a divider and extra vertical
space between them so the two deploys read as separate, not one continuous
list. `mods/deploys/local.js` (no imports, tested with `node --test
herdr-app/mods/deploys/local.test.mjs`) mirrors `usemaximum/maximum`'s
`dev-cd/devcd` naming: a branch slugifies into a `bnk-max1-<slug>` namespace
and a `max1-dev-us-lcl-k1-bnk<slug>` ArgoCD app (local is branch-slug-keyed,
remote is PR-number-keyed — not the same scheme). The Local section only
appears once past both checks: the Kind cluster running and the branch
actually deployed to it; from there it shows its parent app's sync/health,
with its child apps (`mesh`, `databases`, `infra`, `platform`, `ingress`, `test`)
read in the same single `kubectl get applications` call (three columns, not `-o json`, which runs to megabytes); clicking one tails
its unhealthy workloads' logs. Those log calls use `argocd --core
--kube-context kind-maximum-dev` against a namespace-scoped temp kubeconfig
copy (the same trick `dev-tooling/tasks/argocd/client.py`'s `CoreClient`
uses) instead of `--server`/`--grpc-web` — there's no login step locally, so
the "Not logged in to ArgoCD" row never applies to it.

Every deployed target also gets a **Pods** line ("2 of 109 unhealthy", "No
pods") from one `kubectl get pods` per refresh, triaged by
`mods/deploys/pods.js` (tested with `node --test
herdr-app/mods/deploys/pods.test.mjs`): non-benign waiting reasons
(CrashLoopBackOff, ImagePullBackOff…), non-`Completed` terminations,
unschedulable or failed pods, and pods with 3+ restarts. kubectl prints only
those fields through a go-template (`POD_TEMPLATE`): full `-o json` for one
109-pod bank is 4.5 MB, and pulling that through `exec` every refresh
crashed the app. Each flagged pod
expands on click to its recent Warning events plus the last 30 log lines of
the failing container, from the previous run when it restarted. Local pods
and PR deploys' pods are both read on the worktree's machine, in its folder,
since that's where its `gcloud` login and mise-pinned `kubectl`/
`gke-gcloud-auth-plugin` live. PR deploys use the `bnk-pr-<n>` /
`<target>-pr-<n>` namespaces on `max1-dev-us-gcp-e4`, through whichever
context that machine has for it: the Tailscale API server (Omen), then
`connectgateway_…` (a Mac, no VPN), then the direct `gke_…` one. The Pods
line names the machine when it has no such context, its `gcloud` login has
expired, or the tools aren't installed there.

A failed stage (Degraded, or a bot status saying failed/error/timed out; not
Progressing, Missing or Unknown, which are still settling) gets a magnifier
icon beside its status. Like the sidebar's rebase icon, it splits a pane to the
right in the space's shown tab running `claude --dangerously-skip-permissions
--model haiku` (`ccyolo`) with a read-only investigation prompt: `gh bd <pr> -R
<repo> --stage <name>` for a branch deploy stage, or the stage's Application
YAML and its namespace's pods/events/logs on `kind-maximum-dev` for a local
one (`gh bd` only knows PR deploys). It splits the pane sitting in the worktree,
so mise's per-folder `argocd`/`kubectl` resolve, and does nothing while an
agent for the same stage is still running there.

Clicking the sidebar icon from a non-active space switches spaces first.
`my-tabs`' per-space panel memory can revert that switch's panel selection
within 1s (its own pending-restore window), so the click reasserts the panel
open once that settles rather than racing it.

The panel's `gh` calls and the remote ArgoCD login check always run on this
computer, regardless of which machine the active space lives on — the `gh bd`
alias in [`gh/aliases.yml`](../gh/aliases.yml) also takes its ArgoCD host from
the bot comment's own links for every `--stage` call, so neither it nor the
panel depends on whatever `argocd` context happens to be current. The Local
source's `kubectl`/`argocd` calls run on `target.machine` in `target.cwd`
instead — the machine and worktree directory `indicators.js` saw the
worktree's pane in — since the Kind cluster itself lives there, not
necessarily on this computer, and mise resolves `kubectl`/`argocd` versions
per-directory, not globally.

Because `deploys` and `my-tabs` are mods in this repo, `herdr-update` keeps
them in sync with upstream: `my-tabs` three-way merges against the `tabs`
snapshot in `upstream/mods/tabs/main.js` like `my-spaces` does for `spaces`;
`deploys` has no `cloned_from` (nothing to merge), so a second loop runs
`herdr-app check` on it and any other mod without one.

## Code Burn panel

A **Code Burn** button sits in the tabs bar next to Deploys. It shows what the
coding agents cost, priced at the [employment Vertex contract rates](../codeburn/README.md)
rather than a subscription plan: this month's work spend against a projected
month-end figure, a 30-day trend, every open space's burn with its live
agents, and the usual totals/models/projects tables. `mods/codeburn/` is a
from-scratch mod, split the same way as `deploys`: `main.js` for
state/fetching, `ui.js` for render helpers, and `model.js` for every number
the panel shows (no imports, tested with `node --test
herdr-app/mods/codeburn/model.test.mjs`).

Each refresh (every 60s while shown, plus a manual Refresh) runs up to three
`codeburn` calls for the selected range chip and the current month (skipped
when the chip already is "Month"): `codeburn status --format menubar-json
--scope combined --combined-details --no-optimize`, and `codeburn export
--format json` for the date range, piped through `jq` down to cost per repo,
cost per completed session and the last 10 minutes of per-call records — a
raw export over real history is tens of megabytes, too much to parse on a
poll. `codeburn` is installed through `mise` as a global npm package
(`codeburn/README.md`); Herdr's own process doesn't source the shell profile
that puts `mise` on PATH, so PATH is extended by hand, and every call runs as
`mise exec npm:codeburn -- codeburn ...` rather than the bare `codeburn` a
terminal resolves fine. `mise exec` resolves the installed version directly
regardless of shim state — the `~/.local/share/mise/shims/codeburn` shim
itself isn't reliable across machines: Omen's mise has no global version
pinned for it ("No version is set for shim: codeburn") even though the shim
file exists, so the shim path that works fine on the Mac fails silently on
Omen. Verified directly over SSH to both machines before relying on it.

A further call per paired non-local device runs the same `status` command
with no `--scope`, directly on that device (`exec(..., { on: device.name })`,
the same pattern Deploys uses for remote `kubectl`/`argocd`) — see "Spaces"
below for why.

**Work vs. personal** is decided per device and provider in `model.js`'s
`PERSONAL` table (`[{ device: /MacBook/i, provider: "codex" }]`): everything
not listed is Vertex (work) spend, by device name and codeburn's own provider
id. Codex on the MacBook is personal; the same Codex on a machine running
work Codex through Vertex would need its own row in that table, matched by
device name — a one-line change, not a redesign. The headline and the dim
"Personal" line both read this split from the current month's data,
regardless of which range chip is selected.

**Totals, Models, Projects and Spaces** are built across every paired device
rather than read off just this one: codeburn's own `combined.combined` block
only has coarse totals (cost, calls, tokens), with no per-model, per-project
or per-branch breakdown across devices, so `model.js`'s `mergeCurrent()`
builds that breakdown itself from each device's own `current` block.
Cache-hit rate isn't a simple token ratio (codeburn's own figure doesn't
match either obvious formula worked out from raw tokens), so it's
approximated as a token-weighted average of each device's own reported rate.

**Spaces** ties spend to open herdr spaces using `shared("deploys.targets")`
(the `{repo, branch, cwd}` map `indicators.js` publishes for Deploys): a
space on a feature branch shows that branch's Claude cost (from codeburn's
`byBranch`, the only per-branch data codeburn has) plus whatever its live
non-Claude agents have spent this session. A space on `main`/`master`, or on
any branch name another open space's repo also uses, shows its **repo**
total instead, labelled `repo` — `byBranch` sums every repo that has ever
used a branch name, open or not, so two spaces both on `master` would
otherwise show each other's spend mixed together. A live agent attaches by
branch plus either the repo name or the worktree folder's own name: codeburn
reports a live session's `project` as `basename(cwd)`, not the repo it
belongs to, so a worktree whose folder isn't named after its repo (the usual
case) still needs to match. An agent that matches neither — including one
whose herdr space closed or moved between codeburn's snapshot and herdr's own,
a real but rare race between two independently-refreshing sources — lands in
an "Other (no space)" row instead of being silently dropped. Busy spaces sort
to the top by $/h; quiet ones below 2% of the range's cost fold into a single
"+ N quiet spaces" row so the list stays short with many spaces open.

None of a device's branch names, project paths or live sessions reach a peer
through `--scope combined`: codeburn's own `sanitizeForSharing` (in its
source, not its docs) strips `byBranch`, `pullRequests` and `liveSessions`
outright and zeroes `topProjects`/`topSessions` before a device's status
crosses the wire to a paired device — by design, not a bug, since those are
the identifying fields (folder layout, feature/PR names). So a remote
device's spaces and live agents are invisible through the combined call alone,
however many are actually running. The extra per-device direct call mentioned
above fetches that device's own un-sanitized `current.byBranch`,
`current.topProjects` and `liveSessions` and splices them in before Spaces
ever sees the data; a device that's unreachable, named differently from its
herdr machine id, or without codeburn installed just falls back to the
sanitized combined figures (cost/tokens/models only) for that refresh. The
default-branch **repo** total merges the uncapped local `codeburn export`
total for that repo with each remote device's own (now real, once fetched
directly) `topProjects` entry, since the two are mutually exclusive sources
(export is this machine only; a remote device's own `topProjects` is only
ever itself).

A small **≈** next to a total means part of it isn't exactly priced:
reference-only Gemini rates, Grok at codeburn's defaults (no Vertex override
yet), Pi's possibly-unrepriced recorded costs, a model with no price at all,
or — because codeburn's daily history caps each day at its top 5 models by
cost — a day's spend that couldn't be split into work/personal and was
counted as work. Hovering it lists which apply.

gpui-shell's embedded JS runtime doesn't honor `Intl` format options:
`Number.prototype.toLocaleString(locale, opts)` and
`Date.prototype.toLocaleDateString(locale, opts)` silently ignore `opts` and
fall back to raw/default output (a dollar figure as its full float, a month
name as a full timestamp). `model.js`'s `money()`, `monthName()` and
`shortDate()` are built from `toFixed` and a fixed month-name array instead —
don't reach for `toLocale*` anywhere in this mod.

`codeburn export`'s records are local-only (confirmed: a paired device's
projects never show up in another device's export), and there's no
equivalent direct-fetch for it the way Spaces now has for branch/project/live
data — exporting over a remote machine's logs would mean copying its whole
history across for every refresh, not one status call. So a remote device's
live agents attach to their real space (branch and project/cwd both come
through the direct per-device fetch) but never get a $/h or session cost from
this panel, same as a subagent's own spend, which codeburn records under a
separate `agent-*` session id its parent session's export rows don't include.
Still to verify once a second device runs work Codex through Vertex: that it
prices its own
usage with its own overrides before sharing, not this one's.

## Updating

`herdr-update` (a shared alias in Bash and Zsh, also run by `aiup` and
[`upall`](../system/README.md#maintenance)) replaces `hc update`. It updates
herdr-core on this computer and on every connected machine (`hc machine
update`), then reports anything that no longer fits:

- **Upstream spaces mod changed**: three-way merges it into `my-spaces`
  using the snapshot in `upstream/`. A clean merge waits for `--apply`; a
  conflict is written to `mods/my-spaces/main.js.merge` to resolve.
- **Mod API changed**: diffs `herdr.d.ts` against `upstream/` and names the
  changed functions that our mods import.
- **Keys**: bindings to commands the app no longer has, and default
  shortcuts added or changed since `upstream/keys.json` (an edited
  `keys.json` never gets new defaults). The defaults check runs on macOS
  only, since `upstream/keys.json` is the macOS keymap and Linux builds ship
  their own.
- **Runtime**: `herdr-app check` on each mod, `herdr-app status` errors and
  `*.error` files.

It exits 1 when something needs fixing. `herdr-update --check` only reports.
`herdr-update --apply` writes clean merges and refreshes the `upstream/`
snapshots it accepted. The app updates itself, and its first start after an
update rewrites the shipped mods, so run `herdr-update` again after an app
restart.

## Reproducing on a new machine

Everything the app needs from this repo is linked or generated by
`install.sh`, so a new Mac or Omarchy machine needs only:

1. Install and launch the app once (it writes the shipped mods and layouts).
2. `bash herdr-app/install.sh` (or the platform bootstrap).
3. Pick the layout: `herdr-app do layout.switch '{"name":"my-main"}'`. The
   chosen layout is app state, so it isn't tracked.
4. `herdr-update --check` should end with "All customizations fit".

## Verification

The app applies edits live. When a file is invalid it keeps the last good
version and writes the reason to `~/.config/herdr-app/keys.error` or
`settings.error`. `ctrl-alt-shift-escape` resets the layout and keys if a
binding locks you out.

[Repository index](../README.md)
