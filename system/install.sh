#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

ln -sf "$DOTFILES_ROOT/system/.editorconfig" "$HOME/.editorconfig"
ln -sf "$DOTFILES_ROOT/system/.curlrc" "$HOME/.curlrc"
