#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

if ! command -v gh >/dev/null 2>&1; then
	echo "  gh not found; skipping GitHub CLI extensions (re-run gh/install.sh once gh is installed)" >&2
	exit 0
fi

# Capture once so failures propagate and pipefail cannot hide matches via SIGPIPE.
installed=$(gh extension list)
repositories=$(awk '{print $3}' <<<"$installed")
while IFS= read -r extension || [ -n "$extension" ]; do
	case "$extension" in
	'' | \#*) continue ;;
	esac
	if ! grep -Fxq "$extension" <<<"$repositories"; then
		gh extension install "$extension"
	fi
done <"$DOTFILES_ROOT/gh/extensions.txt"
