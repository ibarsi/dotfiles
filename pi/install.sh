#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.pi/agent"
ln -sf "$DOTFILES_ROOT/pi/settings.json" "$HOME/.pi/agent/settings.json"
ln -sf "$DOTFILES_ROOT/pi/models.json" "$HOME/.pi/agent/models.json"
