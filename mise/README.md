# mise

Repository-managed global settings are installed on macOS. Project tasks also run on Linux when mise is available.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash mise/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Configuration

[mise](https://mise.jdx.dev/) provides global tool settings and repository maintenance tasks.

| File | Destination | Purpose |
|------|-------------|---------|
| `mise/config.toml` | `~/.config/mise/conf.d/00-dotfiles.toml` | Shared global settings/tools fragment |
| `mise.toml` | `~/dotfiles/mise.toml` | Project tools + tasks for dotfiles maintenance |

**Checked-in settings:**

- `auto_install = true` for smoother `mise run` / `mise exec` workflows
- `env_cache = true` and `env_cache_ttl = "2h"` for faster repeated prompt/env resolution
- `color_theme = "catppuccin"` to match terminal/editor theme choices
- `min_version` soft floor in project config to reduce config drift

**Project tools managed by mise:**

- Python 3.13.11
- `shellcheck`
- `shfmt`
- `gitleaks`

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

## Local trust settings

The installer keeps `~/.config/mise/config.toml` as a real, machine-local file and layers the tracked fragment through `conf.d`. It also registers the `mise-local` Git clean filter to strip `trusted_config_paths` from the tracked config. Zsh exports `MISE_TRUSTED_CONFIG_PATHS=$HOME/worktrees`.

Global tools in [config.toml](config.toml) include Node, uv, Go, gitmoji-cli, gopls and RTK. The project [mise.toml](../mise.toml) owns maintenance tasks and tool versions.

See [repository validation](../scripts/README.md) and [docs generation](../docs/README.md#docs-site) for the complete maintenance flow.

## Verification

Check `readlink ~/.config/mise/conf.d/00-dotfiles.toml`, confirm `~/.config/mise/config.toml` is a regular file, and run `mise config ls`.

[Repository index](../README.md)
