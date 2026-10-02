# tmux

Shared tmux configuration; on Linux it sources Omarchy’s base config before applying the repository’s settings.

## Installation

Both [macOS](../macos/README.md#bootstrap) and [Omarchy](../omarchy/README.md#bootstrap) bootstrap run `bash tmux/install.sh`. Run it from the repository root to refresh this topic independently.

## tmux Workflow

`tmux` is configured for a keyboard-first, AI-session-friendly terminal workflow.

| File | Destination | Purpose |
|------|-------------|---------|
| `tmux/.tmux.conf` | `~/.config/tmux/tmux.conf` | Session/window/pane behavior + statusline (sources Omarchy's tmux base first, when present) |

**Key choices:**

- Prefix: `Ctrl+a`
- Split panes in current working directory
- Pane movement with arrow keys
- Fast pane resizing (`Shift+Arrow`)
- Catppuccin-inspired statusline and borders
- Copy mode with vim keys
- AI helpers:
  - `Ctrl+a M` toggles quiet-window monitoring (`monitor-silence`) for the current window
  - `Ctrl+a A` renames the current window and enables a 15s quiet alert for AI sessions

**Claude Teams fit:**

- Includes a quiet-window notification hook (`alert-silence`) for windows using `monitor-silence`.
- Useful pattern per Claude window:
  - `Ctrl+a A` and name it `claude-impl`, `claude-review`, etc.
  - Or toggle it manually with `Ctrl+a M`
  - Shell equivalent: `tmux setw monitor-silence 15`

**Recommended Claude layout:**

- One tmux session per project (`tn <project>`)
- Window 1: editor/build/test loop
- Window 2: `claude-impl` for implementation work
- Window 3: `claude-review` for code review, debugging, or a second thread
- Window 4: logs, watch mode, or git operations

Prefer separate windows over many panes for independent Claude threads so quiet notifications and window switching stay clean. Use panes when two terminals belong to the same task in the same directory.

**tmux aliases:**

- `tl` → list sessions
- `ta <name>` → attach session
- `tn <name>` → create new named session

For Omen attachment, see [`omux`](../zsh/README.md#omen-remote-sessions). For repo/branch session naming, see [Git worktrees](../git/README.md#git-worktree-workflow).

## Verification

Check `readlink ~/.config/tmux/tmux.conf`. In a running session, reload with `tmux source-file ~/.config/tmux/tmux.conf` and inspect `tmux show-options -g prefix`.

[Repository index](../README.md)
