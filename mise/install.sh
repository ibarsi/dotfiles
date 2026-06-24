#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/mise/conf.d"

# Layer the curated config via conf.d as a symlink (stays in sync with the repo).
ln -sf "$DOTFILES_ROOT/mise/config.toml" "$HOME/.config/mise/conf.d/00-dotfiles.toml"

# Keep ~/.config/mise/config.toml a REAL file (not a symlink into this repo) so
# mise treats it as a genuine global config. Tools like the maximum monorepo
# write trusted_config_paths into the global config via `mise settings add`;
# mise only honors that (and stays quiet) when the global config is a real file
# at the canonical path. A symlink resolves to the repo path and gets classified
# non-global -> "trusted_config_paths ... is ignored for security reasons".
[ -L "$HOME/.config/mise/config.toml" ] && rm "$HOME/.config/mise/config.toml"
touch "$HOME/.config/mise/config.toml"

# Git clean filter to strip machine-local trusted_config_paths from commits
# (belt-and-suspenders; with the layout above mise writes to the real config.toml,
# not the symlinked repo file, so the repo file should stay clean on its own).
git -C "$DOTFILES_ROOT" config filter.mise-local.clean 'grep -v "^trusted_config_paths"'
git -C "$DOTFILES_ROOT" config filter.mise-local.smudge cat
