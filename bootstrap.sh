#!/usr/bin/env bash
set -euo pipefail

# bootstrap.sh - Topic-based setup for ibarsi

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$DOTFILES_ROOT"

# 1. Install Homebrew if not present
if ! command -v brew >/dev/null 2>&1; then
	echo "Installing Homebrew..."
	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

	if [[ $(uname -m) == "arm64" ]]; then
		eval "$(/opt/homebrew/bin/brew shellenv)"
	else
		eval "$(/usr/local/bin/brew shellenv)"
	fi
fi

# 2. Install all tools and apps from Brewfile
echo "Syncing tools from Brewfile..."
brew bundle --file "$DOTFILES_ROOT/Brewfile"

# 3. Run each topic's install script
echo "Setting up topics..."
for installer in */install.sh; do
	topic="$(dirname "$installer")"
	echo "  → $topic"
	bash "$installer"
done

# 4. Set Zsh as default shell
ZSH_PATH="$(command -v zsh || true)"
if [ -n "$ZSH_PATH" ] && [ "$SHELL" != "$ZSH_PATH" ]; then
	echo "Setting Zsh as default shell..."
	chsh -s "$ZSH_PATH"
fi

echo "Setup complete! Restart your terminal to see changes."
