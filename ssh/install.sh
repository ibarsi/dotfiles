#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.ssh"
ln -sf "$DOTFILES_ROOT/ssh/config" "$HOME/.ssh/config"
