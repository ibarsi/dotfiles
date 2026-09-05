#!/usr/bin/env bash
set -euo pipefail

# Minimal, additive setup for Omarchy and other Bash-based Linux hosts.
DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

if [[ "$(uname -s)" != "Linux" ]]; then
	echo "bootstrap-omarchy.sh is for Linux hosts; use ./bootstrap.sh on macOS." >&2
	exit 1
fi

echo "Setting up the shared Bash shell layer..."
bash "$DOTFILES_ROOT/bash/install.sh"

echo "Adding portable Git aliases..."
bash "$DOTFILES_ROOT/git/install-aliases.sh"

echo "Linking Gitmoji preferences..."
bash "$DOTFILES_ROOT/gitmoji/install.sh"

echo "Omarchy setup complete. Restart Bash or run: source ~/.bashrc"
