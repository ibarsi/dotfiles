#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.claude"
ln -sf "$DOTFILES_ROOT/claude/settings.json" "$HOME/.claude/settings.json"
