#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
# shellcheck disable=SC1091
source "$DOTFILES_ROOT/theme/palette.sh"

APP_DIR="$HOME/.config/herdr-app"
mkdir -p "$APP_DIR/themes"

# The app applies these live; an invalid edit leaves <name>.error beside it.
# Settings are per OS: zoom (Cmd/Ctrl +/-) writes through the link, so one
# shared file would make each machine clobber the other's zoom.
[[ $(uname -s) == Darwin ]] && os=macos || os=linux
for f in keys.json settings.json; do
	if [[ -f "$APP_DIR/$f" && ! -L "$APP_DIR/$f" ]]; then
		mv "$APP_DIR/$f" "$APP_DIR/$f.backup.$(date +%Y%m%d%H%M%S)"
	fi
	src=$f
	[[ $f == settings.json ]] && src=settings.$os.json
	ln -sf "$DOTFILES_ROOT/herdr-app/$src" "$APP_DIR/$f"
done

# my-spaces is a clone of Herdr's spaces mod plus PR/port indicators. my-tabs is
# a clone of its tabs mod with Deploys and Code Burn buttons added. deploys,
# codeburn and pr-reviews are from-scratch panel mods (not clones) for the
# Deploys and Code Burn chips and the PR Reviews tab. The app doesn't hot-reload
# through these links; herdr-update re-shows the layout instead.
mkdir -p "$APP_DIR/mods" "$APP_DIR/layouts"
for mod in my-spaces my-tabs deploys codeburn pr-reviews; do
	if [[ -e "$APP_DIR/mods/$mod" && ! -L "$APP_DIR/mods/$mod" ]]; then
		mv "$APP_DIR/mods/$mod" "$APP_DIR/mods/$mod.backup.$(date +%Y%m%d%H%M%S)"
	fi
	ln -sfn "$DOTFILES_ROOT/herdr-app/mods/$mod" "$APP_DIR/mods/$mod"
done

# my-main is Herdr's main layout with my-spaces in place of spaces, my-tabs in
# place of tabs, and deploys/codeburn blocks added to the panel-body stack
# (alongside files/changes). Generated from the shipped file (written on app
# start) so app updates flow through.
if [[ -f "$APP_DIR/layouts/main.json" ]]; then
	jq --arg v "$(herdr-app --version 2>/dev/null | awk '{print $2}')" \
		'(.. | objects | select(.mod? == "spaces") | .mod) = "my-spaces"
		| (.. | objects | select(.mod? == "tabs") | .mod) = "my-tabs"
		| (.. | objects | select(.id? == "panel-body") | .children) |=
			(if any(.[]; .id == "deploys") then . else . + [{id: "deploys", type: "block", content: {mod: "deploys"}}] end)
		| (.. | objects | select(.id? == "panel-body") | .children) |=
			(if any(.[]; .id == "codeburn") then . else . + [{id: "codeburn", type: "block", content: {mod: "codeburn"}}] end)
			(if any(.[]; .id == "pr-reviews") then . else . + [{id: "pr-reviews", type: "block", content: {mod: "pr-reviews"}}] end)
		| .cloned_from = {name: "main", version: $v}' \
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
    "peach": "$CATPPUCCIN_PEACH",
    "mauve": "$CATPPUCCIN_MAUVE",
    "sky": "$CATPPUCCIN_SKY",
    "sapphire": "$CATPPUCCIN_SAPPHIRE",
    "lavender": "$CATPPUCCIN_LAVENDER",
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
