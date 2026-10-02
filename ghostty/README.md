# ghostty

Primary terminal configuration, installed by this repository on macOS.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash ghostty/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Configuration

[Ghostty](https://ghostty.org) is configured as the primary terminal. Config lives in `ghostty/` and is symlinked to `~/.config/ghostty/` by `bootstrap.sh`.

| File | Destination | Purpose |
|------|-------------|---------|
| `ghostty/config` | `~/.config/ghostty/config` | Terminal settings, theme, keybindings |

**Key settings:**

- **Theme**: Catppuccin Mocha (dark) / Catppuccin Latte (light), follows system appearance — built-in to Ghostty, no extra install needed
- **Font**: Fira Code 13px with ligatures (`calt`, `liga`)
- **Cursor**: Blinking bar (ported from iTerm2)
- **Shell integration**: Auto-detected — enables semantic zones, prompt detection, sudo passthrough

**Keybindings (ported from iTerm2):**

| Shortcut | Action |
|----------|--------|
| `cmd+]` / `cmd+[` | Next / previous tab |
| `cmd+shift+←` / `cmd+shift+→` | Split pane left / right |
| `cmd+shift+↑` / `cmd+shift+↓` | Split pane up / down |
| `cmd+w` | Close pane / tab |
| `cmd+k cmd+z` | Toggle fullscreen (zen mode) |
| `cmd+=` / `cmd+-` | Increase / decrease font size |
| `cmd+0` | Reset font size |


## Option-arrow integration

The left Option key is configured as Alt. Alt-arrow sends modified-arrow sequences for [Herdr](../herdr/README.md#keyboard-and-remote-sessions), including when attached to Omen; Option-Left/Right therefore does not perform Ghostty word navigation.

Ghostty also enables SSH environment and terminfo integration. For appliances that still mishandle `xterm-ghostty`, use [`sshx`](../ssh/README.md#ssh-workflow).

## Verification

Check `readlink ~/.config/ghostty/config` and open a new Ghostty window to confirm the theme and shortcuts.

[Repository index](../README.md)
