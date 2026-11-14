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

# my-spaces is a clone of Herdr's spaces mod plus PR/port indicators. The app
# doesn't hot-reload through this link; herdr-update re-shows the layout instead.
mkdir -p "$APP_DIR/mods" "$APP_DIR/layouts"
if [[ -e "$APP_DIR/mods/my-spaces" && ! -L "$APP_DIR/mods/my-spaces" ]]; then
	mv "$APP_DIR/mods/my-spaces" "$APP_DIR/mods/my-spaces.backup.$(date +%Y%m%d%H%M%S)"
fi
ln -sfn "$DOTFILES_ROOT/herdr-app/mods/my-spaces" "$APP_DIR/mods/my-spaces"

# my-main is Herdr's main layout with my-spaces in place of spaces. Generated
# from the shipped file (written on app start) so app updates flow through.
if [[ -f "$APP_DIR/layouts/main.json" ]]; then
	jq --arg v "$(herdr-app --version 2>/dev/null | awk '{print $2}')" \
		'(.. | objects | select(.mod? == "spaces") | .mod) = "my-spaces" | .cloned_from = {name: "main", version: $v}' \
		"$APP_DIR/layouts/main.json" >"$APP_DIR/layouts/my-main.json.tmp"
	mv "$APP_DIR/layouts/my-main.json.tmp" "$APP_DIR/layouts/my-main.json"
else
	echo "herdr-app: launch Herdr.app once, then re-run to generate the my-main layout." >&2
fi

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
