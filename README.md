# Igor's `dotfiles`

A modern, topic-based dotfile configuration for macOS and Omarchy (Arch Linux
/ Hyprland), used daily as peers. A shared Bash/Zsh layer of aliases and
functions works on both; platform-specific setup lives in dedicated guides
linked below.

## Guides

- **[macOS guide](docs/guides/macos.md)** — Homebrew bootstrap, Brewfile,
  macOS system defaults, keyboard tuning, Obsidian.
- **[Omarchy guide](docs/guides/omarchy.md)** — additive bootstrap, hardware
  benchmarking (`benchall`), VoxType voice-to-text sync.
- **[Shared workflows](docs/guides/workflows.md)** — Ghostty, cmux, tmux, SSH,
  networking, Kubernetes, FZF, git worktrees, mise, pre-commit, Codex, Claude,
  Agy, Zed, and the docs site itself.

## Installation

### macOS

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap.sh
```

Installs Homebrew, syncs `Brewfile`, links every topic's config, sets Zsh as
the default shell, and applies macOS defaults. Details in the
[macOS guide](docs/guides/macos.md).

### Omarchy (and other Bash-based Linux)

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap-omarchy.sh
```

Adds the shared Bash aliases/functions, Git aliases, Gitmoji preferences,
tmux config, and the VoxType vocabulary sync — additively, without replacing
Omarchy's `~/.bashrc` or `~/.gitconfig`, and without installing packages or
changing the default shell. Details in the
[Omarchy guide](docs/guides/omarchy.md).

Both scripts use the repository root internally, so they can be re-run
reliably even when invoked from different working directories.

## Platform Support

Generated from `bootstrap.sh`, `bootstrap-omarchy.sh`, and each topic's
`install.sh`. Regenerate with `mise run docs-build`; `mise run docs-check`
fails the build if this table is stale. A topic marked macOS-only is
intentional — it's managed natively through that platform rather than through
this repo, not a gap to fill.

<!-- BEGIN GENERATED: platform-matrix -->

| Topic | macOS | Omarchy |
|-------|-------|---------|
| `bash` | ✅ | ✅ |
| `claude` | ✅ | — macOS only |
| `cmux` | ✅ | — macOS only |
| `codex` | ✅ | — macOS only |
| `ghostty` | ✅ | — macOS only |
| `git` | ✅ | ◐ aliases only |
| `gitmoji` | ✅ | ✅ |
| `glow` | ✅ | — macOS only |
| `k9s` | ✅ | — macOS only |
| `launchagents` | ✅ | — macOS only |
| `macos` | ✅ | — macOS only |
| `mise` | ✅ | — macOS only |
| `ssh` | ✅ | — macOS only |
| `system` | ✅ | — macOS only |
| `theme` | ✅ | — macOS only |
| `tmux` | ✅ | ✅ |
| `vim` | ✅ | — macOS only |
| `voice-to-text` | ✅ | ✅ |
| `zed` | ✅ | — macOS only |
| `zsh` | ✅ | — macOS only |

<!-- END GENERATED: platform-matrix -->

## Quick Commands

Use `mise run ...` directly for project workflows:

- `mise run check` → full validation pipeline
- `mise run verify` → AI doctor + bootstrap link verification
- `mise run ai-doctor` → AI CLI/tooling health check
- `mise run docs-build` → regenerate the docs site data from repo sources
- `mise run docs-check` → fail if regenerating docs would change `docs/site-data.*`
- `mise run docs-serve` → serve the docs site locally with mise-managed Python
- `dotdocs` → start the docs site from any directory and open it in the browser
- `mise run lint-shell` / `mise run fmt-shell` / `mise run fmt-check`
- `mise run precommit-install` / `mise run precommit-run`
- `mise run secrets-scan` → run explicit repo secret scan
- `upall` → upgrade Homebrew packages/casks when Homebrew is present and upgrade mise-managed tools
- `dsync` → safe dotfiles update preview (fetch/status + next commands)
- `groot` → jump to git repo root quickly
- `wtnew <branch> [base]` → create a worktree under `~/worktrees/<repo>/<branch>` and enter it
- `wtsesh` → attach/create a tmux session for the current repo+branch
- `pr` → open existing PR in browser or create one

## Structure

The repository is organized into **topics**, making it easy to modularize your configuration:

- `git/`: Git configuration and a portable aliases include. On Linux, `bash git/install-aliases.sh` adds only the aliases without replacing the host Git config.
- `ssh/`: SSH client configuration for GitHub and related tooling.
- `macos/`: macOS system defaults and UI/UX settings.
- `system/`: Global environment variables, paths, and generic aliases.
- `bash/`: Additive Bash shell configuration. Bootstrap links its fragment under `~/.config/ibarsi-dotfiles/` and sources it from the existing `~/.bashrc` without replacing Omarchy defaults.
- `vim/`: Vim configuration.
- `tmux/`: tmux configuration (symlinked to `~/.config/tmux/tmux.conf`).
- `ghostty/`: Ghostty terminal configuration (symlinked to `~/.config/ghostty/`).
- `gitmoji/`: Global `gitmoji-cli` preferences (symlinked to `~/Library/Preferences/gitmoji-nodejs/` on macOS and `~/.config/gitmoji-nodejs/` on Linux).
- `k9s/`: Kubernetes TUI configuration (symlinked to `~/Library/Application Support/k9s/config.yaml`).
- `zed/`: Zed editor settings and keybindings (symlinked to `~/.config/zed/`).
- `mise/`: Mise global config (symlinked to `~/.config/mise/`).
- `codex/`: Codex CLI configuration (symlinked to `~/.codex/`).
- `cmux/`: cmux app configuration (symlinked to `~/.config/cmux/`).
- `claude/`: Claude Code settings (symlinked to `~/.claude/`).
- `voice-to-text/`: Dictation tooling automation. A daily job regenerates the dictation engine's custom vocabulary from a project glossary markdown file — via launchd into TypeWhisper on macOS, via a systemd user timer into VoxType on Omarchy.
- `docs/`: Lightweight static documentation app for aliases, functions, tasks, links, and features. `docs/guides/` holds the hand-written platform and workflow guides linked above.
- `scripts/`: Repository automation scripts (`doctor-ai`, `bootstrap-verify`).
- `zsh/`: Zsh configuration, plugins, and modular initialization.
- `AGENTS.md`: Agent operating guidance for this repository.

## Features

- **Topic-based organization**: Modular and easy to maintain.
- **Modern CLI tools**: Integrated with `eza`, `bat`, `glow`, `fzf`, `zoxide`, and `starship`.
- **Lean networking toolkit**: Modern DNS/HTTP/traffic inspection helpers (`doggo`, `mtr`, `iperf3`, `tcpdump`, `netcat`).
- **FZF workflows**: Fast file/dir navigation, branch switching, ripgrep jump-to-file, and process kill helpers.
- **Zsh Power-ups**: Catppuccin Mocha syntax highlighting/autosuggestions plus faster completion startup and improved history behavior.
- **Shared Bash/Zsh shell layer**: OS-aware paths, aliases, and functions work on macOS and Linux; Bash integrates additively with an existing `~/.bashrc`.
- **tmux workflow**: Catppuccin-styled tmux with AI-friendly pane/window ergonomics and Claude quiet-window notifications.
- **Auto-update**: Automatically checks for updates to your dotfiles once a day.
- **Mise integration**: Configured global settings + project tool/tasks for reproducible shell workflows.
- **AI workflow diagnostics**: One-command checks for toolchain health and bootstrap verification.
- **Generated reference site**: A searchable docs app under `docs/` inventories aliases, functions, git shortcuts, mise tasks, bootstrap links, and major repo capabilities from source files.
- **Deterministic guardrails**: Optional pre-commit hooks for shell lint/format, merge hygiene, and secret scanning.
- **Advanced Git**: Includes `gh-dash` and powerful log visualization.
- **Gitmoji subject format**: Global `gitmoji-cli` defaults keep the message in the commit subject as `✨ (feat): Title` instead of pushing it into the body.
- **SSH commit signing**: Git signs commits with `~/.ssh/id_ed25519.pub` via `gpg.format=ssh`.
- **SSH compatibility helper**: `sshx` forces `TERM=xterm-256color` for hosts that break on `xterm-ghostty` during interactive sessions.
- **Ghostty terminal**: GPU-accelerated terminal with Catppuccin theme, Fira Code font, and custom keybindings — fully configured as dotfiles.
- **k9s defaults**: Bootstrap links a repo-managed k9s config that uses the Catppuccin Mocha skin, shows the last 1000 log lines, and wraps log lines by default.
- **Zed editor**: Primary editor with Catppuccin theme, Fira Code font, Prettier formatting, and custom keybindings — all managed as dotfiles.
- **Obsidian theme notes**: Obsidian stays in `Brewfile`, and the Catppuccin docs include the manual CLI commands if you want Obsidian to match.
- **Codex CLI workflow**: Safe-by-default Codex config, shell shortcuts, and completion for day-to-day AI coding.
- **NAS Arr import monitoring**: A read-only Sonarr/Radarr queue exporter backs Grafana alerts for completed downloads that need manual import.
- **Claude Code workflow**: Claude Code settings + shell shortcuts tuned for regular use alongside Codex.
- **Hardware benchmarking**: `benchall` runs a bounded network/disk/RAM/CPU/GPU/thermal sweep and emits a Markdown report suited for handing to an agent. See the [Omarchy guide](docs/guides/omarchy.md).

### Shell quality-of-life defaults
- Completion caching via `.zcompdump` (faster shell startup)
- Better history ergonomics (`HIST_IGNORE_SPACE`, `EXTENDED_HISTORY`)
- History-backed zsh autosuggestions: type the start of a previous command, then press `Shift-Tab` to accept the gray suggestion; use `Tab` for normal expansion/completion
- Interactive completion menu + clearer completion descriptions
- **Startup smart tips**: On new terminal sessions, generate one practical AI tip from your dotfiles context (can be disabled).
