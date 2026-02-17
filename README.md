# Igor's `dotfiles`

A modern, topic-based dotfile configuration for macOS. Optimized for Apple Silicon and productivity.

## Installation

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap.sh
```

## Structure

The repository is organized into **topics**, making it easy to modularize your configuration:

- `git/`: Git configuration and aliases.
- `macos/`: macOS system defaults and UI/UX settings.
- `system/`: Global environment variables, paths, and generic aliases.
- `vim/`: Vim configuration.
- `zed/`: Zed editor settings and keybindings (symlinked to `~/.config/zed/`).
- `zsh/`: Zsh configuration, plugins, and modular initialization.

## Features

- **Topic-based organization**: Modular and easy to maintain.
- **Modern CLI tools**: Integrated with `eza`, `bat`, `fzf`, `zoxide`, and `starship`.
- **Zsh Power-ups**: Syntax highlighting and autosuggestions out of the box.
- **Auto-update**: Automatically checks for updates to your dotfiles once a day.
- **Mise integration**: Blazing fast management for Node, Ruby, Python, and more.
- **Advanced Git**: Includes `gh-dash` and powerful log visualization.
- **Zed editor**: Primary editor with Catppuccin theme, Fira Code font, Prettier formatting, and custom keybindings — all managed as dotfiles.

## Zed Editor

[Zed](https://zed.dev) is configured as the primary editor. Config files live in `zed/` and are symlinked to `~/.config/zed/` by `bootstrap.sh`.

| File | Destination | Purpose |
|------|-------------|---------|
| `zed/settings.json` | `~/.config/zed/settings.json` | Editor settings, theme, formatting |
| `zed/keymap.json` | `~/.config/zed/keymap.json` | Custom keybindings |

**Key settings:**
- **Theme**: Catppuccin Mocha (dark) / Catppuccin Latte (light), follows system appearance
- **Font**: Fira Code 13px with ligatures
- **Formatting**: Prettier on save for JS/TS/TSX/JSON/HTML/Markdown
- **Extensions**: Auto-installed on first launch (Catppuccin, Prettier, ESLint, Dockerfile, etc.)
- **Telemetry**: Disabled

**Keybindings (ported from VS Code):**

| Shortcut | Action |
|----------|--------|
| `cmd+]` / `cmd+[` | Next / previous terminal pane |
| `cmd+d` | New terminal |
| `cmd+w` | Close active item |
| `cmd+k cmd+z` | Toggle centered layout (zen mode) |
