# Igor's `dotfiles`

A modern, topic-based dotfile configuration for macOS. Optimized for Apple Silicon and productivity.

## Installation

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap.sh
```

`bootstrap.sh` is path-safe and uses the repository root internally, so it can be re-run reliably even when invoked from different working directories.

## Quick Commands

Use `mise run ...` directly for project workflows:

- `mise run check` → full validation pipeline
- `mise run verify` → AI doctor + bootstrap link verification
- `mise run ai-doctor` → AI CLI/tooling health check
- `mise run docs-build` → regenerate the docs site data from repo sources
- `mise run docs-check` → fail if `docs/site-data.json` is stale
- `mise run docs-serve` → serve the docs site locally with mise-managed Python
- `dotdocs` → start the docs site from any directory and open it in the browser
- `mise run lint-shell` / `mise run fmt-shell` / `mise run fmt-check`
- `mise run precommit-install` / `mise run precommit-run`
- `mise run secrets-scan` → run explicit repo secret scan
- `dsync` → safe dotfiles update preview (fetch/status + next commands)
- `groot` → jump to git repo root quickly
- `wtnew <branch> [base]` → create a worktree under `~/worktrees/<repo>/<branch>` and enter it
- `wtsesh` → attach/create a tmux session for the current repo+branch
- `pr` → open existing PR in browser or create one

## Structure

The repository is organized into **topics**, making it easy to modularize your configuration:

- `git/`: Git configuration and aliases.
- `ssh/`: SSH client configuration for GitHub and related tooling.
- `macos/`: macOS system defaults and UI/UX settings.
- `system/`: Global environment variables, paths, and generic aliases.
- `vim/`: Vim configuration.
- `tmux/`: tmux configuration (symlinked to `~/.tmux.conf`).
- `ghostty/`: Ghostty terminal configuration (symlinked to `~/.config/ghostty/`).
- `gitmoji/`: Global `gitmoji-cli` preferences (symlinked to `~/Library/Preferences/gitmoji-nodejs/`).
- `zed/`: Zed editor settings and keybindings (symlinked to `~/.config/zed/`).
- `mise/`: Mise global config (symlinked to `~/.config/mise/`).
- `codex/`: Codex CLI configuration (symlinked to `~/.codex/`).
- `claude/`: Claude Code settings (symlinked to `~/.claude/`).
- `opencode/`: OpenCode configuration (symlinked to `~/.config/opencode/`).
- `docs/`: Lightweight static documentation app for aliases, functions, tasks, links, and features.
- `scripts/`: Repository automation scripts (`doctor-ai`, `bootstrap-verify`).
- `zsh/`: Zsh configuration, plugins, and modular initialization.
- `AGENTS.md`: Agent operating guidance for this repository.

## Features

- **Topic-based organization**: Modular and easy to maintain.
- **Modern CLI tools**: Integrated with `eza`, `bat`, `fzf`, `zoxide`, and `starship`.
- **Lean networking toolkit**: Modern DNS/HTTP/traffic inspection helpers (`doggo`, `mtr`, `iperf3`, `tcpdump`, `netcat`).
- **FZF workflows**: Fast file/dir navigation, branch switching, ripgrep jump-to-file, and process kill helpers.
- **Zsh Power-ups**: Syntax highlighting/autosuggestions plus faster completion startup and improved history behavior.
- **tmux workflow**: Catppuccin-styled tmux with AI-friendly pane/window ergonomics and Claude quiet-window notifications.
- **Auto-update**: Automatically checks for updates to your dotfiles once a day.
- **macOS keyboard tuning**: Bootstrap applies fast key repeat, short repeat delay, disables press-and-hold accent popups, and reloads a Caps Lock to Control remap at login.
- **Mise integration**: Configured global settings + project tool/tasks for reproducible shell workflows.
- **AI workflow diagnostics**: One-command checks for toolchain health and bootstrap verification.
- **Generated reference site**: A searchable docs app under `docs/` inventories aliases, functions, git shortcuts, mise tasks, bootstrap links, and major repo capabilities from source files.
- **Deterministic guardrails**: Optional pre-commit hooks for shell lint/format, merge hygiene, and secret scanning.
- **Advanced Git**: Includes `gh-dash` and powerful log visualization.
- **Gitmoji subject format**: Global `gitmoji-cli` defaults keep the message in the commit subject as `✨ (feat): Title` instead of pushing it into the body.
- **SSH commit signing**: Git signs commits with `~/.ssh/id_ed25519.pub` via `gpg.format=ssh`.
- **SSH compatibility helper**: `sshx` forces `TERM=xterm-256color` for hosts that break on `xterm-ghostty` during interactive sessions.
- **Ghostty terminal**: GPU-accelerated terminal with Catppuccin theme, Fira Code font, and custom keybindings — fully configured as dotfiles.
- **Zed editor**: Primary editor with Catppuccin theme, Fira Code font, Prettier formatting, and custom keybindings — all managed as dotfiles.
- **Obsidian theme notes**: Obsidian stays in `Brewfile`, and the Catppuccin docs include the manual CLI commands if you want Obsidian to match.
- **Codex CLI workflow**: Safe-by-default Codex config, shell shortcuts, and completion for day-to-day AI coding.
- **Claude Code workflow**: Claude Code settings + shell shortcuts tuned for regular use alongside Codex.
- **OpenCode workflow**: Local LM Studio-backed OpenCode config managed in dotfiles.
### Shell quality-of-life defaults
- Completion caching via `.zcompdump` (faster shell startup)
- Better history ergonomics (`HIST_IGNORE_SPACE`, `EXTENDED_HISTORY`)
- Interactive completion menu + clearer completion descriptions
- **Startup smart tips**: On new terminal sessions, generate one practical AI tip from your dotfiles context (can be disabled).

## Docs Site

The repo includes a lightweight static docs app in `docs/` for browsing the current shell surface area and major dotfiles capabilities.

- Source-driven generator: `scripts/generate-docs.py`
- Generated data file: `docs/site-data.json`
- Includes: aliases, functions, git shortcuts from `git/.gitconfig` plus git-focused shell helpers, mise tasks, bootstrap-managed symlinks, and curated repo feature summaries

Refresh the docs after any feature, alias, function, task, or bootstrap link change:

```bash
mise run docs-build
```

Serve the site locally from the repo root:

```bash
mise install
mise run docs-serve
```

Then open `http://localhost:4173`.

From any directory, `dotdocs` will start the server if needed and open the same URL automatically.

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

**Keybindings (ported from iTerm2):**

| Shortcut | Action |
|----------|--------|
| `cmd+]` / `cmd+[` | Next / previous tab |
| `cmd+d` | Split pane right |
| `cmd+w` | Close pane / tab |
| `cmd+k cmd+z` | Toggle fullscreen (zen mode) |
| `cmd+=` / `cmd+-` | Increase / decrease font size |
| `cmd+0` | Reset font size |

> **Note:** `theme/iterm2-catppuccin.json` is preserved in the repo for historical reference but is no longer used.

## Obsidian Workflow

[Obsidian](https://obsidian.md) is installed from `Brewfile`, but this repo does not automate its CLI setup or theme activation.

If you want Obsidian to match the Catppuccin theme used elsewhere, enable Obsidian's CLI yourself and then run:

**Theme commands used:**

```bash
obsidian theme:install name=Catppuccin
obsidian theme:set name=Catppuccin
```

## tmux Workflow

`tmux` is configured for a keyboard-first, AI-session-friendly terminal workflow.

| File | Destination | Purpose |
|------|-------------|---------|
| `tmux/.tmux.conf` | `~/.tmux.conf` | Session/window/pane behavior + statusline |

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

## SSH Workflow

Use `sshx` instead of `ssh` for remote hosts that mis-handle Ghostty's default `xterm-ghostty` terminal type.

- `sshx user@host` → run SSH with `TERM=xterm-256color`
- `sshx -p 2222 user@host` → same behavior with explicit port/flags

This is mainly useful for older appliances and NAS shells that render broken line editing or arrow-key behavior over SSH.

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
- `ff` → fuzzy-find file and open in Zed (fallback: `$EDITOR`)
- `fcd` → fuzzy-find directory and `cd` into it
- `fbr` → fuzzy-switch git branches (supports remote tracking branches)
- `frg [query]` → fuzzy-select from `rg` results and jump to file+line
- `fkill` → fuzzy-select running process and kill it
- `fwt` → fuzzy-pick a git worktree from the current repo and `cd` into it
- `fwtr` → fuzzy-pick a sibling git worktree and remove it with `git wtr`

These are designed for daily terminal usage with your current tooling stack and should work across your repos out of the box.

## Git Worktree Workflow

The shell and git config now include a minimal worktree layer aimed at parallel agent sessions without adding much ceremony.

**Git aliases:**
- `git rh` → hard reset the current branch to `origin/<current-branch>`
- `git wt` → raw `git worktree`
- `git wtl` → list worktrees
- `git wtp` → prune stale worktree metadata
- `git wtr <path>` → remove a worktree
- `git wtx` → porcelain worktree listing for scripting
- `git bparent [base-ref]` → print the parent commit of the oldest commit on the current branch not found in the given base
- `git onto [base-ref]` → rebase the current branch onto `origin/<base>` using `git bparent` as the boundary

**Shell helpers:**
- `wtpath [name]` → print the conventional path for the current repo under `~/worktrees/<repo>/<name>`
- `wtnew <branch> [base]` → create a new worktree at that path, print the exact branch/base/path used, and `cd` into it
- `fwt` → fuzzy-pick any worktree from the current repo and `cd` into it
- `wtsesh` → attach/create a tmux session named from the current repo and branch
- `fwtr` → fuzzy-search removable worktrees from the current repo and pass the selected path to `git wtr`

**Recommended flow:**
- From any repo root, run `wtnew feature/my-task`
- Use `fwt` any time you want to jump between existing worktrees for that repo
- Start or attach your worktree tmux session with `wtsesh`
- Run your agent inside that session so each branch/worktree has isolated terminal context
- If `wtnew` fails, it now prints whether the problem is missing `git`, missing repo context, or a rejected `git worktree add`
- When the repo contains `.mise.toml` or `mise.toml`, `wtnew` also runs `mise trust` inside the new worktree

**Three-feature routing example:**
- `wtnew feat/auth-refresh`
- `wtnew feat/billing-export`
- `wtnew feat/mobile-nav`
- Run `wtsesh` inside each worktree and keep one Claude session per worktree
- Treat each worktree as the local checkout for exactly one branch and PR

**When feature work is done in a worktree:**
- Review and commit from inside that worktree:

```bash
git status
git add -A
git commit -m "Implement feature"
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
pr
```

- The branch already exists at that point; the worktree is just the local directory attached to it
- `pr` opens the existing PR or creates one for the current branch

**After the PR is merged:**
- Leave the merged worktree and return to the main repo checkout
- Remove the worktree, then delete the local branch

```bash
git wtl
git wtr ~/worktrees/<repo>/feat/auth-refresh
git branch -d feat/auth-refresh
git wtr ~/worktrees/<repo>/feat/billing-export
git branch -d feat/billing-export
git wtr ~/worktrees/<repo>/feat/mobile-nav
git branch -d feat/mobile-nav
git wtp
```

- If you also want to delete merged remote branches manually:

```bash
git push origin --delete feat/auth-refresh
git push origin --delete feat/billing-export
git push origin --delete feat/mobile-nav
```

Use `git wtl` before cleanup so you can verify the exact worktree paths and avoid removing the wrong checkout.
If you prefer an interactive cleanup flow, run `fwtr` from any checkout in the repo to fuzzy-pick a sibling worktree and remove it directly.

## OpenCode Workflow

[OpenCode](https://opencode.ai) is configured to use your local LM Studio instance through the OpenAI-compatible `/v1` endpoint.

| File | Destination | Purpose |
|------|-------------|---------|
| `opencode/opencode.json` | `~/.config/opencode/opencode.json` | Local provider config for LM Studio-backed OpenCode |

**Defaults configured:**
- Provider: local `lmstudio`
- Endpoint: `http://localhost:1234/v1`
- Model: `qwen2.5-coder-7b-instruct-mlx`

**Local model setup:**
- Ensure LM Studio's local server is running on port `1234`
- Load the configured model in LM Studio before starting OpenCode
- Re-run `./bootstrap.sh` to install the symlinked config

**Usage:**
- Start OpenCode normally with `opencode`

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
- `gitleaks` secret scanning on staged changes

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
- `mise run ai-doctor` → verify AI toolchain binaries/config/env
- `mise run verify` → run both AI doctor + bootstrap verification
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
- `model = "gpt-5.4"`
- `approval_policy = "on-request"`
- `sandbox_mode = "workspace-write"`
- `web_search = "cached"` (safer default than live web)
- `/review` uses `review_model = "gpt-5.3-codex"`
- Native TUI footer enabled for non-tmux use (`model-with-reasoning`, `git-branch`, `project`, `context-window`, `five-hour`)

**Enabled quality-of-life features:**
- `shell_snapshot` (faster repeated command runs)
- `unified_exec` (improved command execution path)
- `undo` (safer edit iteration)
- `voice_transcription` (hold Space to speak in supported Codex CLI builds)

**TUI footer:**
- Use `/statusline` in Codex to interactively reorder or trim footer items.
- The repo default shows model/reasoning, git branch, project, context-window usage, and the 5-hour usage meter.

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
- `ccr` → `claude --continue`
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

**Keybindings:**

| Shortcut | Action |
|----------|--------|
| `cmd+]` / `cmd+[` | Next / previous terminal pane |
| `cmd+d` | New terminal |
| `cmd+w` | Close active item |
| `cmd+k cmd+z` | Toggle centered layout (zen mode) |
