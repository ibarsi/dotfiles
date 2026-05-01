#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.warp/themes"
ln -sf "$DOTFILES_ROOT/warp/themes/catppuccin-mocha.yaml" "$HOME/.warp/themes/catppuccin-mocha.yaml"

echo "Warp Catppuccin Mocha theme linked. Select it in Warp Settings > Appearance > Themes."
