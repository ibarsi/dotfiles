# Shared Workflows

Everything on this page works the same on macOS and Omarchy. Platform-specific
setup lives in the [macOS guide](macos.md) and the [Omarchy guide](omarchy.md).

## Docs Site

The repo includes a lightweight static docs app in `docs/` for browsing the current shell surface area and major dotfiles capabilities.

- Source-driven generator: `scripts/generate-docs.py`
- Generated data file: `docs/site-data.json`
- Includes: aliases, functions, git shortcuts from `git/aliases.gitconfig` plus git-focused shell helpers, mise tasks, bootstrap-managed symlinks, curated repo feature summaries, and the platform support matrix

Refresh the docs after any feature, alias, function, task, bootstrap link, or platform-support change:

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
| `cmd+shift+←` / `cmd+shift+→` | Split pane left / right |
| `cmd+shift+↑` / `cmd+shift+↓` | Split pane up / down |
| `cmd+w` | Close pane / tab |
| `cmd+k cmd+z` | Toggle fullscreen (zen mode) |
| `cmd+=` / `cmd+-` | Increase / decrease font size |
| `cmd+0` | Reset font size |

> **Note:** `theme/iterm2-catppuccin.json` is preserved in the repo for historical reference but is no longer used.

## Herdr Sidebar

`herdr/install.sh` runs `herdr/herdr-sidebar-feed` as a user service
(systemd on Omarchy, launchd on macOS). It adds a cmux-style third line to
each workspace in Herdr's sidebar:

- **`$pr`**: the PR for the workspace's branch, e.g. `#3750 ✗` (state shown only for draft, merged or closed), where
  `✓` / `✗` / `…` summarise CI. Refreshed every 60s through `gh`.
- **`$ports`**: TCP ports listened on by processes started from the
  workspace's panes, e.g. `:3000,8080`. Refreshed every 5s. Docker-published
  ports belong to the Docker daemon, not a pane, so they don't show.

The rows live in `[ui.sidebar.spaces]` in `herdr/config.toml`. Check the
service with `systemctl --user status herdr-sidebar-feed` (Omarchy) or
`~/Library/Logs/herdr-sidebar-feed.log` (macOS). See the pushed values with
`herdr api snapshot | jq -c '.. | objects | select(has("tokens")) | {label, tokens}'`.

## Markdown Workflow

`glow` is installed from `Brewfile` and configured from `glow/glow.yml` with the Catppuccin Mocha Glamour style for paged terminal Markdown rendering.

**Markdown functions (`system/.functions`):**
- `md [file|url|repo]` → render Markdown with Glow; with no argument it opens `README.md` when present, otherwise starts Glow's current-directory browser
- `mdf` → fuzzy-pick a local Markdown file and preview it with Glow before rendering
- `mdrepo <owner/repo>` → render a GitHub/GitLab README; shorthand like `mdrepo charmbracelet/glow` expands to `github.com/charmbracelet/glow`

This gives you a fast terminal path for local READMEs, generated docs, changelogs, and remote project docs without leaving the shell.

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

**Omen remote sessions (macOS Zsh only):**
- `omux` → attach/create an Omen tmux session named from the current Mac repo and branch
- `omux <session>` → attach/create a custom named Omen tmux session
- `omux ls` → list Omen tmux sessions
- `omux kill <session>` → confirm, then kill one Omen tmux session

`omux` connects as `ibarsi@omen`. When creating a new session from a Mac worktree under `~/worktrees/`, it starts in the matching Omen worktree if that directory exists; otherwise it starts in Omen's login directory. Reattached sessions retain their existing working directory. It is intentionally defined only in `zsh/aliases.zsh`, so it does not change the shared shell layer or Omarchy bootstrap.

## SSH Workflow

Use `sshx` instead of `ssh` for remote hosts that mis-handle Ghostty's default `xterm-ghostty` terminal type.

- `sshx user@host` → run SSH with `TERM=xterm-256color`
- `sshx -p 2222 user@host` → same behavior with explicit port/flags

This is mainly useful for older appliances and NAS shells that render broken line editing or arrow-key behavior over SSH.

The Synology NAS is available as `nas` (`ssh nas`), and the Omen host is pinned as `omen` (`ssh omen`).

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

## Kubernetes Workflow

`kubectl`, `k9s`, and `jq` are installed from `Brewfile`; the shell adds a small Kubernetes shortcut set for common inspect, log, rollout, and context-switching work.

**Kubernetes aliases (`system/.aliases`):**
- `k` -> `kubectl`
- `kgp` / `kgpa` -> get pods in the current namespace / all namespaces
- `kd` -> describe resources
- `klf` / `klp` -> follow logs with a 1000-line tail / show previous container logs
- `kex` -> interactive exec
- `ke` -> cluster events
- `krs` / `krr` -> rollout status / restart
- `kctx` / `kctxs` / `kuc` / `kns` -> show context, list contexts, switch context, or set the current namespace

**Kubernetes functions (`system/.functions`):**
- `klogj <pod|resource/name> [kubectl logs flags...]` -> follow logs through `jq` in `less`, pretty-printing JSON lines while leaving plain text untouched

Use `KLOG_TAIL=200 klogj pod/my-pod -n my-namespace` to override the default 1000-line tail for a single command.
Inside `less`, press `Ctrl-C` to pause live follow mode, `/` to search, and `Shift-F` to resume following.

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

## AI Diagnostics

Scripts under `scripts/`:
- `doctor-ai.sh` → checks binaries, config presence, and env presence
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

> Note: `mise activate zsh` is intentionally loaded near the end of `.zshrc` so later PATH edits don't override mise-managed tool versions.

## Local Environment Conventions

- Use `.env.example` as the reference for expected local AI environment variables.
- Keep real values in untracked local files/shell env (for example `.env.local` or your shell profile).

## Codex CLI Workflow

[Codex CLI](https://developers.openai.com/codex/cli/) is configured for a secure, fast terminal-first AI coding flow.

| File | Destination | Purpose |
|------|-------------|---------|
| `codex/config.toml` | `~/.codex/config.toml` | Default model, approvals/sandbox, search mode, feature toggles |
| `codex/mcp-grafana-nas` | Invoked by Codex | Read-only Grafana MCP launcher; loads its token from macOS Keychain |

**Install Codex CLI:**

```bash
brew install --cask codex
npm i -g @openai/codex  # cross-platform alternative
```

**Key defaults in this repo:**
- `model = "gpt-5.5"`
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

**Grafana MCP:**
- Connects to the NAS Grafana instance at `http://192.168.0.39:3340` in read-only mode.
- Create a Grafana Viewer service-account token and store it in the login keychain under service name `codex-grafana-mcp` and your macOS username before starting Codex.

**TUI footer:**
- Use `/statusline` in Codex to interactively reorder or trim footer items.
- The repo default shows model/reasoning, git branch, project, context-window usage, and the 5-hour usage meter.

**Shell shortcuts:**
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

**Shell shortcuts:**
- `cc` → `claude`
- `cce` → `claude -p`
- `ccr` → `claude --continue`
- `ccreview` → start Claude with `/review`
- `ccyolo` → `claude --dangerously-skip-permissions`
- `ccdoctor` → `claude doctor`
- `ccupdate` → upgrade Claude Code (brew cask if installed via Homebrew, otherwise `claude update`)

> Workflow note: Codex and Claude configs are independent (`~/.codex/` and `~/.claude/`), so switching between them is frictionless.

## Agy CLI Workflow

Agy is wired into the shared shell shortcut set with aliases that mirror the Codex and Claude Code patterns where the CLI exposes matching flags.

**Shell shortcuts:**
- `agye` → `agy -p`
- `agyr` → `agy --continue`
- `agyreview` → start Agy with `/review`
- `agyyolo` → `agy --dangerously-skip-permissions`

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
