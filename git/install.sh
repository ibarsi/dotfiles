#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

ln -sf "$DOTFILES_ROOT/git/.gitconfig" "$HOME/.gitconfig"
ln -sf "$DOTFILES_ROOT/git/.gitignore" "$HOME/.gitignore"
ln -sf "$DOTFILES_ROOT/git/.gitattributes" "$HOME/.gitattributes"
