#!/usr/bin/env bash
set -euo pipefail

# Links the portable Git config fragments and registers them as global
# includes. Additive: never replaces an existing host Git config.
DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
CONFIG_DIR="$HOME/.config/ibarsi-dotfiles"

mkdir -p "$CONFIG_DIR"

# source name -> installed name; delta is skipped unless the binary is present.
FRAGMENTS=(aliases)
if command -v delta >/dev/null 2>&1; then
	FRAGMENTS+=(delta)
else
	echo "  delta not found on PATH; skipping the delta pager include." >&2
fi

for fragment in "${FRAGMENTS[@]}"; do
	target="$CONFIG_DIR/git-$fragment.gitconfig"
	ln -sfn "$DOTFILES_ROOT/git/$fragment.gitconfig" "$target"

	if ! git config --global --get-all include.path 2>/dev/null | grep -Fqx "$target"; then
		git config --global --add include.path "$target"
	fi
done
