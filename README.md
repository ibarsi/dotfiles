# Igor's `dotfiles`

A modern, topic-based dotfile configuration for macOS. Optimized for Apple Silicon and productivity.

## Installation

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap.sh
```

`bootstrap.sh` is path-safe and uses the repository root internally, so it can be re-run reliably even when invoked from different working directories.

## Structure

The repository is organized into **topics**, making it easy to modularize your configuration:

- `git/`: Git configuration and aliases.
- `macos/`: macOS system defaults and UI/UX settings.
- `system/`: Global environment variables, paths, and generic aliases.
- `vim/`: Vim configuration.
- `ghostty/`: Ghostty terminal configuration (symlinked to `~/.config/ghostty/`).
- `zed/`: Zed editor settings and keybindings (symlinked to `~/.config/zed/`).
- `mise/`: Mise global config (symlinked to `~/.config/mise/`).
- `codex/`: Codex CLI configuration (symlinked to `~/.codex/`).
- `claude/`: Claude Code settings (symlinked to `~/.claude/`).
- `scripts/`: Repository automation scripts (`doctor-ai`, `bootstrap-verify`).
- `zsh/`: Zsh configuration, plugins, and modular initialization.
- `AGENTS.md`: Agent operating guidance for this repository.

## Features

- **Topic-based organization**: Modular and easy to maintain.
- **Modern CLI tools**: Integrated with `eza`, `bat`, `fzf`, `zoxide`, and `starship`.
- **Lean networking toolkit**: Modern DNS/HTTP/traffic inspection helpers (`doggo`, `mtr`, `iperf3`, `tcpdump`, `netcat`).
- **FZF workflows**: Fast file/dir navigation, branch switching, ripgrep jump-to-file, and process kill helpers.
- **Zsh Power-ups**: Syntax highlighting and autosuggestions out of the box.
- **Auto-update**: Automatically checks for updates to your dotfiles once a day.
- **Mise integration**: Configured global settings + project tool/tasks for reproducible shell workflows.
- **AI workflow diagnostics**: One-command checks for toolchain health and bootstrap verification.
- **Deterministic guardrails**: Optional pre-commit hooks for shell lint/format and basic hygiene checks.
- **Advanced Git**: Includes `gh-dash` and powerful log visualization.
- **Ghostty terminal**: GPU-accelerated terminal with Catppuccin theme, Fira Code font, and custom keybindings — fully configured as dotfiles.
- **Zed editor**: Primary editor with Catppuccin theme, Fira Code font, Prettier formatting, and custom keybindings — all managed as dotfiles.
- **Codex CLI workflow**: Safe-by-default Codex config, shell shortcuts, and completion for day-to-day AI coding.
- **Claude Code workflow**: Claude Code settings + shell shortcuts tuned for regular use alongside Codex.
- **zsh-ai workflow**: Natural-language command generation in terminal using Anthropic by default.
- **Startup smart tips**: On new terminal sessions, show one practical alias/function tip (can be disabled).

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

## Networking Workflow

This repo now includes a lightweight, practical network-debug toolkit for daily use.

**Added tools (Brewfile):**
- `doggo` — modern DNS client (`dig` alternative)
- `mtr` — traceroute + ping combined
- `iperf3` — throughput testing

Use your existing aliases for basics (`ip`, `lip`, `ips`, `flushdns`), and call modern tools directly (`doggo`, `curl`, `tcpdump`). (`flushdns` runs both `dscacheutil` and `mDNSResponder` refresh.)

**Network functions (`system/.functions`):**
- `dnstrace <domain>` — DNS trace path
- `httptime <url>` — DNS/connect/TLS/TTFB/total timing
- `listeners` — compact open listener view
- `nclisten [port]` / `ncprobe <host> <port>` — netcat helpers
- `pcap [iface] [file] [filter...]` — capture packets to `.pcap` (for Wireshark/offline analysis)
- `sniffweb [iface]` — quick live console view for web ports (80/443), no file output
- `netpath <host>` — MTR report (20 cycles, quick path/latency snapshot)
- `netspeed <iperf3-server> [seconds]` — iperf3 client run

This keeps the setup lean: mostly thin wrappers over proven tools, with sensible defaults.

## FZF Workflow

`fzf` is already installed via Brewfile; this repo now includes practical shell functions in `system/.functions` tailored for your setup (`bat`, `rg`, `zed`, git-heavy workflow).

**Included functions:**
- `ff` → fuzzy-find file and open in Zed (fallback: VS Code / `$EDITOR`)
- `fcd` → fuzzy-find directory and `cd` into it
- `fbr` → fuzzy-switch git branches (supports remote tracking branches)
- `frg [query]` → fuzzy-select from `rg` results and jump to file+line
- `fkill` → fuzzy-select running process and kill it

These are designed for daily terminal usage with your current tooling stack and should work across your repos out of the box.

## Startup Smart Tips

A lightweight startup tip appears once per new interactive terminal session, suggesting one useful alias/function from your actual setup.

- File: `zsh/startup-tip.zsh`
- Behavior: one random tip at shell start
- Opt-out: `export DOTFILES_STARTUP_TIPS=0`
- Optional AI mode: `export DOTFILES_STARTUP_TIPS_AI=1` (uses `zsh-ai` and caches one generated tip per day)

## zsh-ai Workflow

[zsh-ai](https://github.com/matheusml/zsh-ai) is integrated as a shell plugin with Anthropic defaults tuned for your existing CLI stack.

| File | Purpose |
|------|---------|
| `zsh/zsh-ai.zsh` | Provider/model defaults, prompt preferences, API key loading |

**Install path**
- Homebrew tap: `matheusml/zsh-ai`
- Formula: `zsh-ai`
- Plugin sourced from: `$(brew --prefix)/share/zsh-ai/zsh-ai.plugin.zsh`

**Defaults configured:**
- `ZSH_AI_PROVIDER="anthropic"`
- `ZSH_AI_ANTHROPIC_MODEL="claude-haiku-4-5"`
- `ZSH_AI_ANTHROPIC_URL="https://api.anthropic.com/v1/messages"`
- `ZSH_AI_PROMPT_EXTEND` tuned to your tools (`rg`, `fd`, `bat`, `eza`, `zed`)

**API key handling (secure-by-default):**
- Uses existing `ANTHROPIC_API_KEY` if already set
- Otherwise loads from `~/.config/anthropic/api_key` (single-line key file)
- No API key is stored in git or committed dotfiles

**Usage:**
- Type `# what you want` and press Enter, or run `zsh-ai "your request"`

## AI Diagnostics

Scripts under `scripts/`:
- `doctor-ai.sh` → checks binaries, config presence, env presence, endpoint reachability
- `bootstrap-verify.sh` → validates expected post-bootstrap symlinks/files

## Deterministic Checks (Pre-commit)

Optional pre-commit config is included in `.pre-commit-config.yaml`:
- merge conflict checks
- trailing whitespace / EOF hygiene
- `shellcheck`
- `shfmt`

Setup:
```bash
pre-commit install
pre-commit run --all-files
```

## Mise Workflow

[mise](https://mise.jdx.dev/) is now wired as an active part of this repo instead of just being installed.

| File | Destination | Purpose |
|------|-------------|---------|
| `mise/config.toml` | `~/.config/mise/config.toml` | Global mise behavior/settings |
| `mise.toml` | `~/dotfiles/mise.toml` | Project tools + tasks for dotfiles maintenance |

**Best-practice defaults applied (from official mise docs):**
- `auto_install = true` for smoother `mise run` / `mise exec` workflows
- `env_cache = true` and `env_cache_ttl = "2h"` for faster repeated prompt/env resolution
- `color_theme = "catppuccin"` to match terminal/editor theme choices
- `min_version` soft floor in project config to reduce config drift

**Project tools managed by mise:**
- `shellcheck`
- `shfmt`

**Project tasks:**
- `mise run mise-install` → install configured tools
- `mise run lint-shell` → lint shell scripts
- `mise run fmt-shell` → format shell scripts
- `mise run fmt-check` → check formatting without writing
- `mise run check` → full local validation pipeline
- `mise run bootstrap-verify` → verify expected post-bootstrap links/files
- `mise run ai-smoke` → verify AI toolchain binaries/config/env
- `mise run doctor` → run mise diagnostics

**Shell helpers:**
- `ms` / `msi` / `msu` / `msr` / `msd`

> Note: `mise activate zsh` is intentionally loaded near the end of `.zshrc` so later PATH edits don’t override mise-managed tool versions.

## Local Environment Conventions

- Use `.env.example` as the reference for expected local AI environment variables.
- Keep real values in untracked local files/shell env (for example `.env.local` or your shell profile).
- Preferred Anthropic key file path for local loading: `~/.config/anthropic/api_key`.

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
