# zed

Primary editor configuration, installed by this repository on macOS.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash zed/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Configuration

[Zed](https://zed.dev) is configured as the primary editor. Config files live in `zed/` and are symlinked to `~/.config/zed/` by `bootstrap.sh`.

| File | Destination | Purpose |
|------|-------------|---------|
| `zed/settings.json` | `~/.config/zed/settings.json` | Editor settings, theme, formatting |
| `zed/keymap.json` | `~/.config/zed/keymap.json` | Custom keybindings |

**Key settings:**

- **Theme**: Catppuccin Mocha (dark) / Catppuccin Latte (light), follows system appearance
- **Font**: FiraCode Nerd Font Mono, 13px buffer / 14px UI, with ligatures
- **Formatting**: Prettier on save for JS/TS/TSX/JSON/HTML/Markdown
- **Extensions**: Auto-installed on first launch (Catppuccin, Prettier, ESLint, Dockerfile, etc.)
- **Telemetry**: Disabled

**Keybindings:**

| Shortcut | Action |
|----------|--------|
| `cmd+]` / `cmd+[` | Next / previous terminal pane |
| `cmd+d` | New terminal |
| `cmd+w` | Close active item |
| `cmd+k cmd+z` | Toggle centered layout (zen mode) |

The settings also select the Claude ACP registry agent, disable edit predictions, and trust worktrees. Review those choices when applying this configuration to another host.

## Verification

Check both symlinks under `~/.config/zed/`, then open Zed and confirm the theme and terminal shortcuts.

[Repository index](../README.md)
