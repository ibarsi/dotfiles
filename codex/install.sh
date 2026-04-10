#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.codex"
ln -sf "$DOTFILES_ROOT/codex/config.toml" "$HOME/.codex/config.toml"
