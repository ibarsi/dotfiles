#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/opencode"
ln -sf "$DOTFILES_ROOT/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"
