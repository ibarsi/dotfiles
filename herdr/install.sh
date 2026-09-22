#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/herdr"
ln -sf "$DOTFILES_ROOT/herdr/config.toml" "$HOME/.config/herdr/config.toml"
