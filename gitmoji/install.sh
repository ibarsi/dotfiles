#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/Library/Preferences/gitmoji-nodejs"
ln -sf "$DOTFILES_ROOT/gitmoji/config.json" "$HOME/Library/Preferences/gitmoji-nodejs/config.json"
