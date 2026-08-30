#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
CONFIG_DIR="$HOME/.config/ibarsi-dotfiles"
ALIASES_FILE="$CONFIG_DIR/git-aliases.gitconfig"

mkdir -p "$CONFIG_DIR"
ln -sfn "$DOTFILES_ROOT/git/aliases.gitconfig" "$ALIASES_FILE"

if ! git config --global --get-all include.path 2>/dev/null | grep -Fqx "$ALIASES_FILE"; then
	git config --global --add include.path "$ALIASES_FILE"
fi
