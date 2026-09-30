#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# Import rather than symlink: ~/.config/gh/config.yml also holds gh's own
# settings, so only the aliases are managed here.
if ! command -v gh >/dev/null 2>&1; then
	echo "  gh not found; skipping GitHub CLI aliases (re-run gh/install.sh once gh is installed)" >&2
	exit 0
fi
gh alias import --clobber "$DOTFILES_ROOT/gh/aliases.yml"
