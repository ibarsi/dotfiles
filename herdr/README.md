# herdr

Shared workspace configuration and sidebar status feed on macOS and Omarchy.

## Installation

Both [macOS](../macos/README.md#bootstrap) and [Omarchy](../omarchy/README.md#bootstrap) bootstrap run `bash herdr/install.sh`. Run it from the repository root to refresh this topic independently.

## Keyboard and remote sessions

The `herdr/` topic links `~/.config/herdr/config.toml`. Its complete `[keys]`
table matches Omen's Herdr config. Agent finished and needs-input sounds are
off (`[ui.sound] enabled = false`); reload a running session with
`herdr server reload-config`. Alt-Left/Right switches tabs, Alt-Up/Down
switches workspaces, and Ctrl-Alt-arrow focuses adjacent panes. The same
prefix, split, resize, rename, copy-mode, and close shortcuts also apply when
attaching through `herdr --remote omen`.

Use the left Option key in [Ghostty](../ghostty/README.md#option-arrow-integration).

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
  `$deploy` (▲ live, △ deploying, ▼ failed).

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
