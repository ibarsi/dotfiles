#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.codex"
ln -sf "$DOTFILES_ROOT/codex/config.toml" "$HOME/.codex/config.toml"
ln -sf "$DOTFILES_ROOT/codex/hooks.json" "$HOME/.codex/hooks.json"

if [ -e "$HOME/.codex/hooks" ] && [ ! -L "$HOME/.codex/hooks" ]; then
	rm -rf "$HOME/.codex/hooks"
fi

ln -sfn "$DOTFILES_ROOT/codex/hooks" "$HOME/.codex/hooks"
