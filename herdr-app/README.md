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

The panel renders one section per source, and `this.sources` is exactly the
array the original design left room for: a "Branch deploy" entry when there's
an open PR, and a "Local" entry for the `maximum-dev` Kind cluster, shown
whenever a branch is known (PR or not). `mods/deploys/local.js` (no imports,
tested with `node --test herdr-app/mods/deploys/local.test.mjs`) mirrors
`usemaximum/maximum`'s `dev-cd/devcd` naming: a branch slugifies into a
`bnk-max1-<slug>` namespace and a `max1-dev-us-lcl-k1-bnk<slug>` ArgoCD app
(local is branch-slug-keyed, remote is PR-number-keyed — not the same
scheme). The Local section's state is one of: the Kind cluster not running,
the branch not deployed to it, or its parent app's sync/health, with its
child apps (`mesh`, `databases`, `infra`, `platform`, `ingress`, `test`)
checked lazily on click like remote stages are. Local `argocd` calls use
`--core --kube-context kind-maximum-dev` against a namespace-scoped temp
kubeconfig copy (the same trick `dev-tooling/tasks/argocd/client.py`'s
`CoreClient` uses) instead of `--server`/`--grpc-web` — there's no login step
locally, so the "Not logged in to ArgoCD" row never applies to it.

Clicking the sidebar icon from a non-active space switches spaces first.
`my-tabs`' per-space panel memory can revert that switch's panel selection
within 1s (its own pending-restore window), so the click reasserts the panel
open once that settles rather than racing it.

The panel's `gh`/`argocd` calls and the ArgoCD login check always run on this
computer, regardless of which machine the active space lives on. The `gh bd`
alias in [`gh/aliases.yml`](../gh/aliases.yml) also takes its ArgoCD host from
the bot comment's own links for every `--stage` call, so neither it nor the
panel depends on whatever `argocd` context happens to be current.

Because `deploys` and `my-tabs` are mods in this repo, `herdr-update` keeps
them in sync with upstream: `my-tabs` three-way merges against the `tabs`
snapshot in `upstream/mods/tabs/main.js` like `my-spaces` does for `spaces`;
`deploys` has no `cloned_from` (nothing to merge), so a second loop runs
`herdr-app check` on it and any other mod without one.

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
