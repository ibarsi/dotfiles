# CLAUDE.md — ibarsi/dotfiles

Purpose: help Claude Code contribute safely and effectively to this dotfiles repo.

## Why this repo exists
This repository defines Igor's personal macOS development environment: shell, CLI tooling, editor/terminal config, and AI workflow defaults.

Primary goals:
- reproducible bootstrap on new machines,
- practical productivity defaults,
- security-conscious handling of credentials and local-only state.

## What is in this repo
Top-level map:
- `bootstrap.sh` — installs Brewfile, creates symlinks, applies system defaults.
- `Brewfile` — canonical package/app list.
- `zsh/` — shell startup, aliases, plugin wiring, AI shell integrations.
- `system/` — cross-shell helpers and utility functions.
- `theme/` — visual theme and prompt setup.
- `ghostty/`, `zed/` — terminal/editor configs.
- `mise/` + `mise.toml` — global and project-level mise behavior/tasks.
- `codex/`, `claude/` — AI tool configs.

## How to work in this repo
When making changes:
1. Keep changes small and focused.
2. Prefer extending existing patterns over introducing new frameworks.
3. Preserve bootstrap idempotency (`ln -sf`, `mkdir -p`, safe re-runs).
4. Validate shell changes with syntax checks when possible.
5. Update docs whenever behavior/user workflow changes.

## Commands Claude should know
From repo root:
- `bash -n bootstrap.sh`
- `bash -n theme/install.sh`
- `git status --short`
- `mise run lint-shell` (if mise tools installed)
- `mise run fmt-shell` (if formatting changes are needed)

## Security and secrets (critical)
- Never hardcode API keys, tokens, passwords, or private endpoints into tracked files.
- Prefer env vars or local files under home config paths (e.g., `~/.config/...`) for sensitive material.
- If a user asks for “set up with API key”, wire secure loading paths and document where to place the key locally.

## Repo-specific conventions
- Keep shell UX practical: aliases/functions should save real time, not add novelty.
- New tooling should fit the existing stack (Homebrew + zsh + mise).
- Favor deterministic tools (linters/formatters) over verbose style instructions.
- For AI tooling defaults, use conservative/safe defaults and clear opt-in behavior.

## PR expectations
- Include a concise summary, what changed, and why.
- Call out caveats and any manual post-merge steps.
- Request reviewer `ibarsi` on every PR.

## Progressive disclosure
Read only what is relevant to the current task:
- Package/install task → `Brewfile`, `bootstrap.sh`
- Shell behavior task → `zsh/.zshrc`, `zsh/aliases.zsh`, `system/.functions`
- Theme/UI task → `theme/*`, `ghostty/config`, `zed/*`
- Version/toolchain task → `mise.toml`, `mise/config.toml`
- AI workflow task → `codex/config.toml`, `claude/settings.json`, `zsh/zsh-ai.zsh`

If unsure about intent, ask before broad refactors.
