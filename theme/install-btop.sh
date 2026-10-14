#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
# shellcheck disable=SC1091
source "$DOTFILES_ROOT/theme/palette.sh"

BTOP_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/btop"
mkdir -p "$BTOP_DIR/themes"
if [[ -f "$BTOP_DIR/btop.conf" && ! -L "$BTOP_DIR/btop.conf" ]]; then
	mv "$BTOP_DIR/btop.conf" "$BTOP_DIR/btop.conf.backup.$(date +%Y%m%d%H%M%S)"
fi
ln -sf "$DOTFILES_ROOT/theme/btop.conf" "$BTOP_DIR/btop.conf"

# Colour mapping follows https://github.com/catppuccin/btop.
# Generate locally so the shared palette remains the colour source of truth.
cat >"$BTOP_DIR/themes/catppuccin_mocha.theme" <<EOF
theme[main_bg]="$CATPPUCCIN_BASE"
theme[main_fg]="$CATPPUCCIN_TEXT"
theme[title]="$CATPPUCCIN_TEXT"
theme[hi_fg]="$CATPPUCCIN_BLUE"
theme[selected_bg]="$CATPPUCCIN_SURFACE1"
theme[selected_fg]="$CATPPUCCIN_BLUE"
theme[inactive_fg]="$CATPPUCCIN_OVERLAY1"
theme[graph_text]="$CATPPUCCIN_ROSEWATER"
theme[meter_bg]="$CATPPUCCIN_SURFACE1"
theme[proc_misc]="$CATPPUCCIN_ROSEWATER"
theme[cpu_box]="$CATPPUCCIN_MAUVE"
theme[mem_box]="$CATPPUCCIN_GREEN"
theme[net_box]="$CATPPUCCIN_MAROON"
theme[proc_box]="$CATPPUCCIN_BLUE"
theme[div_line]="$CATPPUCCIN_OVERLAY0"
theme[temp_start]="$CATPPUCCIN_GREEN"
theme[temp_mid]="$CATPPUCCIN_YELLOW"
theme[temp_end]="$CATPPUCCIN_RED"
theme[cpu_start]="$CATPPUCCIN_TEAL"
theme[cpu_mid]="$CATPPUCCIN_SAPPHIRE"
theme[cpu_end]="$CATPPUCCIN_LAVENDER"
theme[free_start]="$CATPPUCCIN_MAUVE"
theme[free_mid]="$CATPPUCCIN_LAVENDER"
theme[free_end]="$CATPPUCCIN_BLUE"
theme[cached_start]="$CATPPUCCIN_SAPPHIRE"
theme[cached_mid]="$CATPPUCCIN_BLUE"
theme[cached_end]="$CATPPUCCIN_LAVENDER"
theme[available_start]="$CATPPUCCIN_PEACH"
theme[available_mid]="$CATPPUCCIN_MAROON"
theme[available_end]="$CATPPUCCIN_RED"
theme[used_start]="$CATPPUCCIN_GREEN"
theme[used_mid]="$CATPPUCCIN_TEAL"
theme[used_end]="$CATPPUCCIN_SKY"
theme[download_start]="$CATPPUCCIN_PEACH"
theme[download_mid]="$CATPPUCCIN_MAROON"
theme[download_end]="$CATPPUCCIN_RED"
theme[upload_start]="$CATPPUCCIN_GREEN"
theme[upload_mid]="$CATPPUCCIN_TEAL"
theme[upload_end]="$CATPPUCCIN_SKY"
theme[process_start]="$CATPPUCCIN_SAPPHIRE"
theme[process_mid]="$CATPPUCCIN_LAVENDER"
theme[process_end]="$CATPPUCCIN_MAUVE"
EOF
