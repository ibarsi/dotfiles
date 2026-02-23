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
- `ghostty/`: Ghostty terminal configuration (symlinked to `~/.config/ghostty/`).
- `zed/`: Zed editor settings and keybindings (symlinked to `~/.config/zed/`).
- `codex/`: Codex CLI configuration (symlinked to `~/.codex/`).
- `claude/`: Claude Code settings (symlinked to `~/.claude/`).
- `zsh/`: Zsh configuration, plugins, and modular initialization.

## Features

- **Topic-based organization**: Modular and easy to maintain.
- **Modern CLI tools**: Integrated with `eza`, `bat`, `fzf`, `zoxide`, and `starship`.
- **Zsh Power-ups**: Syntax highlighting and autosuggestions out of the box.
- **Auto-update**: Automatically checks for updates to your dotfiles once a day.
- **Mise integration**: Blazing fast management for Node, Ruby, Python, and more.
- **Advanced Git**: Includes `gh-dash` and powerful log visualization.
- **Ghostty terminal**: GPU-accelerated terminal with Catppuccin theme, Fira Code font, and custom keybindings — fully configured as dotfiles.
- **Zed editor**: Primary editor with Catppuccin theme, Fira Code font, Prettier formatting, and custom keybindings — all managed as dotfiles.
- **Codex CLI workflow**: Safe-by-default Codex config, shell shortcuts, and completion for day-to-day AI coding.
- **Claude Code workflow**: Claude Code settings + shell shortcuts tuned for regular use alongside Codex.

## Ghostty Terminal

[Ghostty](https://ghostty.org) is configured as the primary terminal. Config lives in `ghostty/` and is symlinked to `~/.config/ghostty/` by `bootstrap.sh`.

| File | Destination | Purpose |
|------|-------------|---------|
| `ghostty/config` | `~/.config/ghostty/config` | Terminal settings, theme, keybindings |

**Key settings:**
- **Theme**: Catppuccin Mocha (dark) / Catppuccin Latte (light), follows system appearance — built-in to Ghostty, no extra install needed
- **Font**: Fira Code 13px with ligatures (`calt`, `liga`)
- **Cursor**: Blinking bar (ported from iTerm2)
- **Shell integration**: Auto-detected — enables semantic zones, prompt detection, sudo passthrough
- **Privacy**: Crash reporting disabled

**Keybindings (ported from iTerm2 / VS Code terminal):**

| Shortcut | Action |
|----------|--------|
| `cmd+]` / `cmd+[` | Next / previous tab |
| `cmd+d` | Split pane right |
| `cmd+w` | Close pane / tab |
| `cmd+k cmd+z` | Toggle fullscreen (zen mode) |
| `cmd+=` / `cmd+-` | Increase / decrease font size |
| `cmd+0` | Reset font size |

> **Note:** `theme/iterm2-catppuccin.json` is preserved in the repo for historical reference but is no longer used.

## Codex CLI Workflow

[Codex CLI](https://developers.openai.com/codex/cli/) is configured for a secure, fast terminal-first AI coding flow.

| File | Destination | Purpose |
|------|-------------|---------|
| `codex/config.toml` | `~/.codex/config.toml` | Default model, approvals/sandbox, search mode, feature toggles |

**Install Codex CLI:**

```bash
brew install --cask codex
npm i -g @openai/codex  # cross-platform alternative
```

**Key defaults in this repo:**
- `model = "gpt-5.3-codex"`
- `approval_policy = "on-request"`
- `sandbox_mode = "workspace-write"`
- `web_search = "cached"` (safer default than live web)
- `/review` uses `review_model = "gpt-5.3-codex"`

**Enabled quality-of-life features:**
- `shell_snapshot` (faster repeated command runs)
- `unified_exec` (improved command execution path)
- `undo` (safer edit iteration)

**Zsh shortcuts:**
- `cx` → `codex`
- `cxe` → `codex exec`
- `cxr` → `codex resume --last`
- `cxreview` → start Codex with `/review`
- `cxup` → upgrade Codex CLI (uses Homebrew cask when Codex was installed with brew; otherwise npm)

> Security note: This setup intentionally avoids `danger-full-access` / `--yolo` defaults, and `sandbox_mode = "workspace-write"` prevents destructive commands like `rm -rf ~/` from writing outside the workspace.

## Claude Code Workflow

[Claude Code](https://code.claude.com/docs/en/setup) is configured for a reliable daily-driver workflow that can coexist with Codex.

| File | Destination | Purpose |
|------|-------------|---------|
| `claude/settings.json` | `~/.claude/settings.json` | Update channel and attribution preferences |

**Install Claude Code CLI:**

```bash
brew install --cask claude-code
# or native installer (recommended by Anthropic):
curl -fsSL https://claude.ai/install.sh | bash
```

**Key defaults in this repo:**
- `$schema` enabled for editor validation/autocomplete
- `autoUpdatesChannel = "stable"` to reduce surprise regressions
- `cleanupPeriodDays = 30` to avoid keeping transcripts indefinitely
- `respectGitignore = true` to keep ignored/private files out of file suggestions
- `permissions.disableBypassPermissionsMode = "disable"` to block bypass mode
- `permissions.ask` prompts on high-risk network/sensitive reads (`git push`, `curl`, `wget`, `.env`, `./secrets/**`)
- `permissions.deny` blocks obviously dangerous shell patterns (`sudo *`, `rm -rf /`, `rm -rf ~/`)
- `attribution.commit` / `attribution.pr` are blanked to avoid automatic AI bylines in commits/PRs

**Zsh shortcuts:**
- `cc` → `claude`
- `ccr` → `claude --resume`
- `ccdoctor` → `claude doctor`
- `ccupdate` → upgrade Claude Code (brew cask if installed via Homebrew, otherwise `claude update`)

> Workflow note: Codex and Claude configs are independent (`~/.codex/` and `~/.claude/`), so switching between them is frictionless.

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
