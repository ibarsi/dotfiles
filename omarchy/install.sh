#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
THEMED_DIR="$HOME/.config/omarchy/themed"

if ! command -v omarchy-theme-set >/dev/null 2>&1; then
	echo "omarchy not found; skipping Omarchy theme templates." >&2
	exit 0
fi

mkdir -p "$THEMED_DIR"
ln -sfn "$DOTFILES_ROOT/omarchy/themed/starship.toml.tpl" "$THEMED_DIR/starship.toml.tpl"

# Starship's own config is superseded by the rendered one; a leftover copy
# would silently win whenever the render is missing.
rm -f "$HOME/.config/starship.toml"

# Render the templates once so a new shell has a config to point at.
omarchy theme set "$(omarchy theme current)"
