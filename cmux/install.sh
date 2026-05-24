#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/cmux"
ln -sf "$DOTFILES_ROOT/cmux/cmux.json" "$HOME/.config/cmux/cmux.json"

cmux themes set --dark "Catppuccin Mocha"
