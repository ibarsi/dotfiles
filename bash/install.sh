#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
CONFIG_DIR="$HOME/.config/ibarsi-dotfiles"
FRAGMENT="$CONFIG_DIR/bashrc"
BASHRC="$HOME/.bashrc"
START_MARKER="# >>> ibarsi dotfiles >>>"
END_MARKER="# <<< ibarsi dotfiles <<<"

mkdir -p "$CONFIG_DIR"
ln -sfn "$DOTFILES_ROOT/bash/bashrc" "$FRAGMENT"

if ! grep -Fqx "$START_MARKER" "$BASHRC" 2>/dev/null; then
	{
		printf '\n%s\n' "$START_MARKER"
		# shellcheck disable=SC2016 # Keep $HOME for expansion by the user's Bash shell.
		printf '%s\n' '[ -r "$HOME/.config/ibarsi-dotfiles/bashrc" ] && . "$HOME/.config/ibarsi-dotfiles/bashrc"'
		printf '%s\n' "$END_MARKER"
	} >>"$BASHRC"
fi
