#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/ghostty"
ln -sf "$DOTFILES_ROOT/ghostty/config" "$HOME/.config/ghostty/config"
