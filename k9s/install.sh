#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
K9S_DIR="$HOME/Library/Application Support/k9s"
K9S_CONFIG="$K9S_DIR/config.yaml"

mkdir -p "$K9S_DIR"

if [[ -e "$K9S_CONFIG" && ! -L "$K9S_CONFIG" ]]; then
	backup="$K9S_CONFIG.backup.$(date +%Y%m%d%H%M%S)"
	echo "Backing up existing k9s config to $backup"
	mv "$K9S_CONFIG" "$backup"
fi

ln -sfn "$DOTFILES_ROOT/k9s/config.yaml" "$K9S_CONFIG"
