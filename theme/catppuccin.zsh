# shellcheck shell=bash disable=SC2155 # _ctp_rgb is pure arithmetic; no exit status to mask
# Catppuccin Theme Configuration
# Mocha (dark) flavor - easy to switch to others

# Flavor selection
export CATPPUCCIN_FLAVOR="mocha"

# Core colours live in palette.sh (shared with tmux); export them for tools
# and scripts. Build every colour setting below from these variables.
set -a
. "$DOTFILES/theme/palette.sh"
set +a

# "#rrggbb" -> "r;g;b" for truecolor SGR sequences (eza, less).
_ctp_rgb() {
	local hex="${1#\#}"
	printf '%d;%d;%d' "$((16#${hex:0:2}))" "$((16#${hex:2:2}))" "$((16#${hex:4:2}))"
}

# FZF Catppuccin Theme
export FZF_DEFAULT_OPTS="
  --color=bg+:$CATPPUCCIN_SURFACE0,bg:$CATPPUCCIN_BASE,spinner:$CATPPUCCIN_ROSEWATER,hl:$CATPPUCCIN_RED
  --color=fg:$CATPPUCCIN_TEXT,header:$CATPPUCCIN_RED,info:$CATPPUCCIN_MAUVE,pointer:$CATPPUCCIN_ROSEWATER
  --color=marker:$CATPPUCCIN_LAVENDER,fg+:$CATPPUCCIN_TEXT,prompt:$CATPPUCCIN_MAUVE,hl+:$CATPPUCCIN_RED
  --color=selected-bg:$CATPPUCCIN_SURFACE2
"

# Bat theme
export BAT_THEME="Catppuccin Mocha"

# Glow/Glamour markdown rendering
export GLOW_CONFIG_HOME="$HOME/.config/glow"
# Repo copy, not ~/.config/glow: only the macOS glow installer links that one.
export GLAMOUR_STYLE="$DOTFILES/glow/catppuccin-mocha.json"
export GLOW_HIGH_PERFORMANCE_PAGER="true"

# eza colors
export EZA_COLORS="
  di=38;2;$(_ctp_rgb "$CATPPUCCIN_LAVENDER"):
  fi=38;2;$(_ctp_rgb "$CATPPUCCIN_TEXT"):
  ex=38;2;$(_ctp_rgb "$CATPPUCCIN_GREEN"):
  ln=38;2;$(_ctp_rgb "$CATPPUCCIN_BLUE"):
  or=38;2;$(_ctp_rgb "$CATPPUCCIN_RED"):
  mi=38;2;$(_ctp_rgb "$CATPPUCCIN_RED"):
"

# Less/man pages
export LESS_TERMCAP_mb="\e[1;38;2;$(_ctp_rgb "$CATPPUCCIN_RED")m"
export LESS_TERMCAP_md="\e[1;38;2;$(_ctp_rgb "$CATPPUCCIN_BLUE")m"
export LESS_TERMCAP_me="\e[0m"
export LESS_TERMCAP_se="\e[0m"
export LESS_TERMCAP_so="\e[1;38;2;$(_ctp_rgb "$CATPPUCCIN_BASE");48;2;$(_ctp_rgb "$CATPPUCCIN_SURFACE1")m"
export LESS_TERMCAP_ue="\e[0m"
export LESS_TERMCAP_us="\e[1;38;2;$(_ctp_rgb "$CATPPUCCIN_LAVENDER")m"

unset -f _ctp_rgb
