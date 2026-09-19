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
- **[Shared workflows](docs/guides/workflows.md)** — Ghostty, tmux, SSH,
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
| `codex` | ✅ | — macOS only |
| `ghostty` | ✅ | — macOS only |
| `git` | ✅ | ◐ aliases only |
| `gitmoji` | ✅ | ✅ |
| `glow` | ✅ | — macOS only |
| `k9s` | ✅ | — macOS only |
| `karabiner` | ✅ | — macOS only |
| `llama` | ✅ | ✅ |
| `macos` | ✅ | — macOS only |
| `mise` | ✅ | — macOS only |
| `omarchy` | ✅ | ✅ |
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
- `claude/`: Claude Code settings (symlinked to `~/.claude/`).
- `voice-to-text/`: Dictation tooling automation. A daily job regenerates the dictation engine's custom vocabulary from a project glossary markdown file — via launchd into TypeWhisper on macOS, via a systemd user timer into VoxType on Omarchy.
- `docs/`: Lightweight static documentation app for aliases, functions, tasks, links, and features. `docs/guides/` holds the hand-written platform and workflow guides linked above.
- `scripts/`: Repository automation scripts (`doctor-ai`, `bootstrap-verify`).
- `zsh/`: Zsh configuration, plugins, and modular initialization.
- `AGENTS.md`: Agent operating guidance for this repository.

## Features

Generated from `FEATURE_NOTES` in `scripts/generate-docs.py` — the same data
that backs the [docs site](docs/guides/workflows.md#docs-site). Regenerate
with `mise run docs-build`; `mise run docs-check` fails the build if this list
is stale.

<!-- BEGIN GENERATED: features -->

- **Topic-based organization**: Splits configuration into independent topic directories so any tool's setup can be added, edited, or removed without touching the rest.
- **Bootstrap workflow**: Installs Homebrew dependencies, creates config symlinks, applies themes, and runs macOS setup.
- **Omarchy bootstrap**: Sets up shared Bash, Git-alias, Gitmoji, tmux, and VoxType layers on Linux, additively, without applying macOS-only configuration.
- **Modular Zsh shell**: Loads shared paths, Zsh modules, system aliases/functions, plugin integrations, and shell quality-of-life defaults.
- **Additive Bash shell**: Integrates the shared shell layer with an existing Bash startup file without replacing host-managed configuration.
- **Zsh power-ups**: Catppuccin Mocha syntax highlighting and history-backed autosuggestions, plus fzf shell integration, through Homebrew-managed paths.
- **Catppuccin theme setup**: Installs the repository-managed shell prompt, terminal, and app theming assets.
- **Modern CLI tools**: Integrates eza, bat, glow, fzf, zoxide, and starship for a modern terminal experience.
- **Lean networking toolkit**: Modern DNS/HTTP/traffic-inspection helpers (doggo, mtr, iperf3, tcpdump, netcat) as thin wrappers with sensible defaults.
- **FZF workflows**: Fast file/dir navigation, branch switching, ripgrep jump-to-file, and process-kill helpers.
- **tmux workflow**: Catppuccin-styled tmux with AI-friendly pane/window ergonomics and Claude quiet-window notifications.
- **Portable Git aliases**: Shares Git aliases through an include file without replacing a host-managed Git configuration.
- **Advanced Git log**: A `git l` alias renders a compact, colorized log graph for quick history review.
- **Gitmoji subject format**: Global gitmoji-cli defaults keep the emoji and type in the commit subject line instead of pushing it into the body.
- **SSH commit signing**: Git signs commits with ~/.ssh/id_ed25519.pub via gpg.format=ssh.
- **SSH compatibility helper**: sshx forces TERM=xterm-256color for hosts that break on Ghostty's xterm-ghostty terminal type.
- **Ghostty terminal config**: Ships a managed Ghostty configuration with Catppuccin styling, keybindings, and shell integration defaults.
- **Zed editor config**: Stores editor settings and keybindings in-repo and links them into ~/.config/zed.
- **k9s defaults**: Bootstrap links a repo-managed k9s config using the Catppuccin Mocha skin, a 1000-line log tail, and wrapped log lines by default.
- **Obsidian theme notes**: Obsidian stays in Brewfile; the Catppuccin docs include the manual CLI commands if you want Obsidian to match.
- **Codex CLI config**: Maintains Codex defaults in-repo with trusted project settings and experimental workflow features.
- **Claude Code config**: Stores Claude Code settings in the repo and links them into ~/.claude during bootstrap.
- **Mise integration**: Configured global settings and project tools/tasks for reproducible shell workflows.
- **Validation scripts**: Provides deterministic checks for AI tooling and bootstrap results.
- **Generated reference site**: A searchable docs app under docs/ inventories aliases, functions, git shortcuts, mise tasks, bootstrap links, features, and the platform support matrix from source files.
- **Deterministic guardrails**: Optional pre-commit hooks for shell lint/format, merge hygiene, and secret scanning.
- **NAS Arr import monitoring**: A read-only Sonarr/Radarr queue exporter backs Grafana alerts for completed downloads that need manual import.
- **Hardware benchmarking**: benchall runs a bounded network/disk/RAM/CPU/GPU/thermal sweep and emits a Markdown report suited for handing to an agent.

<!-- END GENERATED: features -->

### Shell quality-of-life defaults
- Completion caching via `.zcompdump` (faster shell startup)
- Better history ergonomics (`HIST_IGNORE_SPACE`, `EXTENDED_HISTORY`)
- History-backed zsh autosuggestions: type the start of a previous command, then press `Shift-Tab` to accept the gray suggestion; use `Tab` for normal expansion/completion
- Interactive completion menu + clearer completion descriptions
