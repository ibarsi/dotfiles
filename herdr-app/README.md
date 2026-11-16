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
  that platform's file only and show up in `git diff`. `zoom` and `font_size`
  are per screen and may differ. Keep everything else identical: copy other
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
first that applies (none while queued): ↯ merge conflict (peach), ✓ approved,
※ changes requested or a new review since your last non-merge commit
(`mods/my-spaces/status.js`, tested with `node --test
herdr-app/mods/my-spaces/status.test.mjs`). Click ↯ to split a
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
grey text on the right is the repo, unless the row is a worktree or the space is
named after the repo, then the branch for a renamed space or the space name for
the rest, unless it matches the branch. Those lines are marked `// branch-first`.

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
