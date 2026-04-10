#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/mise"
ln -sf "$DOTFILES_ROOT/mise/config.toml" "$HOME/.config/mise/config.toml"

# Git clean filter to strip machine-local trusted_config_paths from commits
git -C "$DOTFILES_ROOT" config filter.mise-local.clean 'grep -v "^trusted_config_paths"'
git -C "$DOTFILES_ROOT" config filter.mise-local.smudge cat
