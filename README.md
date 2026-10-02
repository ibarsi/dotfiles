# Igor's `dotfiles`

A modern, topic-based dotfile configuration for macOS and Omarchy (Arch Linux
/ Hyprland), used daily as peers. A shared Bash/Zsh layer of aliases and
functions works on both; platform-specific setup and tool documentation live beside their configuration.

## Documentation

- [macOS setup](macos/README.md) · [Omarchy/Linux setup](omarchy/README.md)
- [Topic documentation](#structure) · [Documentation maintenance and reference site](docs/README.md)

## Installation

### macOS

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap.sh
```

Installs Homebrew, syncs `Brewfile`, links every topic's config, sets Zsh as
the default shell, and applies macOS defaults. Details in the
[macOS guide](macos/README.md).

### Omarchy (and other Bash-based Linux)

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap-omarchy.sh
```

Adds the shared Bash layer, Git/delta includes, GitHub aliases, Gitmoji,
tmux, Herdr, llama server configuration, Starship, and VoxType vocabulary sync — additively, without replacing
Omarchy's `~/.bashrc` or `~/.gitconfig`, and without installing packages or
changing the default shell. Details in the
[Omarchy guide](omarchy/README.md).

Both scripts use the repository root internally, so they can be re-run
reliably even when invoked from different working directories.

## Platform Support

Generated from `bootstrap.sh`, `bootstrap-omarchy.sh`, and each topic's
`install.sh`. Regenerate with `mise run docs-build`; `mise run docs-check`
fails the build if this table is stale. A topic marked macOS-only is
intentional — it's managed natively through that platform rather than through
this repo, not a gap to fill. Linux-only installers are invoked but skipped by
the macOS bootstrap.

<!-- BEGIN GENERATED: platform-matrix -->

| Topic | macOS | Omarchy |
|-------|-------|---------|
| `bash` | ✅ | ✅ |
| `claude` | ✅ | — macOS only |
| `codex` | ✅ | — macOS only |
| `gh` | ✅ | ✅ |
| `ghostty` | ✅ | — macOS only |
| `git` | ✅ | ◐ aliases + optional delta |
| `gitmoji` | ✅ | ✅ |
| `glow` | ✅ | — macOS only |
| `herdr` | ✅ | ✅ |
| `k9s` | ✅ | — macOS only |
| `karabiner` | ✅ | — macOS only |
| `llama` | — Linux only | ✅ |
| `macos` | ✅ | — macOS only |
| `mise` | ✅ | — macOS only |
| `ssh` | ✅ | — macOS only |
| `system` | ✅ | — macOS only |
| `theme` | ✅ | ◐ Starship only |
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
- `mise run docs-check` → validate topic coverage, local links/anchors, and generated output
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

Each folder owns its documentation.

| Topic | Documentation |
|---|---|
| [bash](bash/README.md) | Additive Bash startup |
| [zsh](zsh/README.md) | Modular Zsh startup and plugins |
| [system](system/README.md) | Shared environment, aliases and workflows |
| [git](git/README.md) | Git config and worktrees |
| [gh](gh/README.md) | GitHub CLI aliases |
| [gitmoji](gitmoji/README.md) | Commit preferences |
| [ssh](ssh/README.md) | Managed hosts and terminal compatibility |
| [ghostty](ghostty/README.md) | Terminal settings and keybindings |
| [herdr](herdr/README.md) | Workspaces, remote sessions and sidebar feed |
| [tmux](tmux/README.md) | Sessions, panes and notifications |
| [glow](glow/README.md) | Markdown rendering |
| [k9s](k9s/README.md) | Kubernetes TUI |
| [mise](mise/README.md) | Global tools and repository tasks |
| [codex](codex/README.md) | Codex config, hooks and Grafana MCP |
| [claude](claude/README.md) | Claude Code settings and themes |
| [zed](zed/README.md) | Editor settings and keybindings |
| [vim](vim/README.md) | Vim configuration |
| [karabiner](karabiner/README.md) | App-scoped macOS keyboard mappings |
| [macos](macos/README.md) | macOS bootstrap and system defaults |
| [omarchy](omarchy/README.md) | Additive Linux bootstrap |
| [theme](theme/README.md) | Palette rules, Starship and app themes |
| [llama](llama/README.md) | Local inference server |
| [voice-to-text](voice-to-text/README.md) | Dictation vocabulary automation |
| [scripts](scripts/README.md) | Validation and maintenance |
| [docs](docs/README.md) | Reference site and documentation conventions |
| [.rtk](.rtk/README.md) | RTK command guidance and filters |

Nested operations: [NAS Arr queue monitoring](system/nas/README.md). Root agent entry points: [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md).

## Features

Generated from `FEATURE_NOTES` in `scripts/generate-docs.py` — the same data
that backs the [docs site](docs/README.md#docs-site). Regenerate
with `mise run docs-build`; `mise run docs-check` fails the build if this list
is stale.

<!-- BEGIN GENERATED: features -->

- **Topic-based organization**: Splits configuration into independent topic directories so any tool's setup can be added, edited, or removed without touching the rest.
- **Bootstrap workflow**: Installs Homebrew dependencies, creates config symlinks, applies themes, and runs macOS setup.
- **Omarchy bootstrap**: Adds shared Bash, Git/delta, GitHub aliases, Gitmoji, tmux, Herdr, llama, Starship, and VoxType configuration on Linux without applying macOS defaults.
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
- **Mise integration**: Layers global settings through conf.d and provides project tools/tasks for reproducible shell workflows.
- **Validation scripts**: Provides deterministic checks for AI tooling and bootstrap results.
- **Generated reference site**: A searchable docs app under docs/ inventories aliases, functions, git shortcuts, mise tasks, bootstrap links, features, and the platform support matrix from source files.
- **Deterministic guardrails**: Optional pre-commit hooks for shell lint/format, merge hygiene, and secret scanning.
- **NAS Arr import monitoring**: A read-only Sonarr/Radarr queue exporter backs Grafana alerts for completed downloads that need manual import.
- **Hardware benchmarking**: benchall runs a bounded network/disk/RAM/CPU/GPU/thermal sweep and emits a Markdown report suited for handing to an agent.

<!-- END GENERATED: features -->
