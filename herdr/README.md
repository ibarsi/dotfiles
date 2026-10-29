# herdr

Shared workspace configuration and sidebar status feed on macOS and Omarchy.

## Installation

Both [macOS](../macos/README.md#bootstrap) and [Omarchy](../omarchy/README.md#bootstrap) bootstrap run `bash herdr/install.sh`. Run it from the repository root to refresh this topic independently.

Each run installs or refreshes [Plugin Manager](https://github.com/speardragon/herdr-plugin-manager)
and [herdr-bar](https://github.com/jeffarese/herdr-bar) from their latest
default-branch commits using `herdr plugin install <owner/repo> --yes`.
This requires Git and network access. Existing plugin config and state are preserved;
already running plugin panes use their existing version until reopened.
herdr-bar requires Herdr 0.9.0+ and downloads a prebuilt binary; if unavailable,
its installer falls back to building with Rust 1.88+. Open it with
`herdr plugin action invoke herdr-bar.open`. Automatic task titles are enabled
by default; its watcher starts on server startup, agent detection, or opening the bar.

## Keyboard and remote sessions

The `herdr/` topic links `~/.config/herdr/config.toml`. Its complete `[keys]`
table matches Omen's Herdr config. Agent finished and needs-input sounds are
off (`[ui.sound] enabled = false`); reload a running session with
`herdr server reload-config`. Alt-Left/Right switches tabs, Alt-Up/Down
switches workspaces, and Ctrl-Alt-arrow focuses adjacent panes. The same
prefix, split, resize, rename, copy-mode, and close shortcuts also apply when
attaching through `herdr --remote omen`.

Ctrl-Space then Shift-Up/Down moves the active worktree one row within its
repo group. Herdr has no built-in workspace reorder, so the binding runs
`herdr/herdr-move-workspace` (linked into `~/.config/herdr/` by `install.sh`,
needs `python3`), which calls the socket API's `workspace.move_block`.

Use the left Option key in [Ghostty](../ghostty/README.md#option-arrow-integration).

With [Plugin Manager](https://github.com/speardragon/herdr-plugin-manager) installed,
Ctrl-Space then P opens it (`ray.plugin-manager.open`). Previous tab remains
available on Alt-Left.

Ctrl-Space then K opens herdr-bar's command bar (`herdr-bar.open`). Close tab
uses Ctrl-Space then Ctrl-K to keep these bindings distinct.

## Herdr Sidebar

`herdr/install.sh` runs `herdr/herdr-sidebar-feed` as a user service
(systemd on Omarchy, launchd on macOS). It adds two cmux-style lines to
each workspace in Herdr's sidebar:

- **`$pr`**: the PR for the workspace's branch (the first pane branch with an open PR, so a worktree pane beats a `main` checkout), e.g. `#3750`, coloured by
  rules in `config.toml`: mauve merged, red CI failed, yellow running,
  green passed. The feed tags the number with an invisible zero-width
  character per state for the rules to match. Refreshed every 60s by one
  batched `gh api graphql` query for all workspaces, 1 point of the
  5,000/hour GraphQL budget; a failed refresh (rate limit, offline) leaves the
  icons to expire rather than blanking them.
  Icons follow it on the same line: `$review` (green ✓ approved, red ✗
  changes requested), `$comment` (blue ※ someone else, bots included,
  reviewed or commented since your last non-merge commit — see `gh reviews`
  in [gh](../gh/README.md)), `$merge` (peach ↯ conflict, sky ≡ queued) and
  `$deploy` (▲ live, △ deploying, ▼ failed, ॥ paused).

- **`$ports`**: TCP ports listened on by processes started from the
  workspace's panes, e.g. `:3000,8080`. Refreshed every 5s. Docker-published
  ports belong to the Docker daemon, not a pane, so they don't show.

The rows live in `[ui.sidebar.spaces]` in `herdr/config.toml`. Check the
service with `systemctl --user status herdr-sidebar-feed` (Omarchy) or
`~/Library/Logs/herdr-sidebar-feed.log` (macOS). See the pushed values with
`herdr api snapshot | jq -c '.. | objects | select(has("tokens")) | {label, tokens}'`.

## Verification

After a config edit, run `herdr server reload-config`. Inspect sidebar tokens and service logs using the commands above. Re-running the installer reloads config and restarts the feed.

[Repository index](../README.md)
