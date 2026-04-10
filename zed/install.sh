#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/zed"
ln -sf "$DOTFILES_ROOT/zed/settings.json" "$HOME/.config/zed/settings.json"
ln -sf "$DOTFILES_ROOT/zed/keymap.json" "$HOME/.config/zed/keymap.json"
