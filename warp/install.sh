#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.warp/themes"
ln -sf "$DOTFILES_ROOT/warp/themes/catppuccin-mocha.yaml" "$HOME/.warp/themes/catppuccin-mocha.yaml"
ln -sf "$DOTFILES_ROOT/warp/keybindings.yaml" "$HOME/.warp/keybindings.yaml"

echo "Warp Catppuccin Mocha theme and keybindings linked. Select the theme in Warp Settings > Appearance > Themes."
