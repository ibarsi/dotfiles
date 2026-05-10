#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/glow"
ln -sf "$DOTFILES_ROOT/glow/glow.yml" "$HOME/.config/glow/glow.yml"
ln -sf "$DOTFILES_ROOT/glow/catppuccin-mocha.json" "$HOME/.config/glow/catppuccin-mocha.json"
