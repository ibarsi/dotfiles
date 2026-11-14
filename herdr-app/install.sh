#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
# shellcheck disable=SC1091
source "$DOTFILES_ROOT/theme/palette.sh"

APP_DIR="$HOME/.config/herdr-app"
mkdir -p "$APP_DIR/themes"

# The app applies these live; an invalid edit leaves <name>.error beside it.
for f in keys.json settings.json; do
	if [[ -f "$APP_DIR/$f" && ! -L "$APP_DIR/$f" ]]; then
		mv "$APP_DIR/$f" "$APP_DIR/$f.backup.$(date +%Y%m%d%H%M%S)"
	fi
	ln -sf "$DOTFILES_ROOT/herdr-app/$f" "$APP_DIR/$f"
done

# settings.json selects this theme by name. Generated so palette.sh stays the
# colour source of truth (JSON can't read variables).
cat >"$APP_DIR/themes/catppuccin-mocha.json" <<JSON
{
  "background": "$CATPPUCCIN_BASE",
  "foreground": "$CATPPUCCIN_TEXT",
  "selection": "$CATPPUCCIN_SURFACE2",
  "cursor": "$CATPPUCCIN_ROSEWATER",
  "ansi": [
    "$CATPPUCCIN_SURFACE1", "$CATPPUCCIN_RED", "$CATPPUCCIN_GREEN", "$CATPPUCCIN_YELLOW",
    "$CATPPUCCIN_BLUE", "$CATPPUCCIN_PINK", "$CATPPUCCIN_TEAL", "$CATPPUCCIN_SUBTEXT1",
    "$CATPPUCCIN_SURFACE2", "$CATPPUCCIN_RED", "$CATPPUCCIN_GREEN", "$CATPPUCCIN_YELLOW",
    "$CATPPUCCIN_BLUE", "$CATPPUCCIN_PINK", "$CATPPUCCIN_TEAL", "$CATPPUCCIN_SUBTEXT0"
  ],
  "colors": {
    "canvas": "$CATPPUCCIN_CRUST",
    "chrome": "$CATPPUCCIN_MANTLE",
    "popover": "$CATPPUCCIN_MANTLE",
    "surface": "$CATPPUCCIN_BASE",
    "raised": "$CATPPUCCIN_SURFACE0",
    "hover": "$CATPPUCCIN_SURFACE0",
    "border": "$CATPPUCCIN_SURFACE0",
    "selected": "$CATPPUCCIN_SURFACE1",
    "input": "$CATPPUCCIN_SURFACE1",
    "foreground": "$CATPPUCCIN_TEXT",
    "muted": "$CATPPUCCIN_SUBTEXT0",
    "dim": "$CATPPUCCIN_OVERLAY1",
    "accent": "$CATPPUCCIN_BLUE",
    "accent_foreground": "$CATPPUCCIN_CRUST",
    "solid": "$CATPPUCCIN_BLUE",
    "solid_foreground": "$CATPPUCCIN_CRUST",
    "working": "$CATPPUCCIN_YELLOW",
    "blocked": "$CATPPUCCIN_RED",
    "done": "$CATPPUCCIN_GREEN",
    "idle": "$CATPPUCCIN_OVERLAY0",
    "unknown": "$CATPPUCCIN_OVERLAY1"
  }
}
JSON
