#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/ibarsi-dotfiles"
ln -sfn "$DOTFILES_ROOT/git/aliases.gitconfig" "$HOME/.config/ibarsi-dotfiles/git-aliases.gitconfig"
ln -sf "$DOTFILES_ROOT/git/.gitconfig" "$HOME/.gitconfig"
ln -sf "$DOTFILES_ROOT/git/.gitignore" "$HOME/.gitignore"
ln -sf "$DOTFILES_ROOT/git/.gitattributes" "$HOME/.gitattributes"
