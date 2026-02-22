#!/usr/bin/env bash

# bootstrap.sh - Topic-based setup for ibarsi

DOTFILES_ROOT=$(pwd -P)

# 1. Install Homebrew if not present
if ! command -v brew >/dev/null; then
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
brew bundle

# 3. Create symlinks
# We use a simple loop to find files we want to link to $HOME
echo "Creating symlinks..."

# Zsh
ln -sf "$DOTFILES_ROOT/zsh/.zshrc" "$HOME/.zshrc"

# Git
ln -sf "$DOTFILES_ROOT/git/.gitconfig" "$HOME/.gitconfig"
ln -sf "$DOTFILES_ROOT/git/.gitignore" "$HOME/.gitignore"
ln -sf "$DOTFILES_ROOT/git/.gitattributes" "$HOME/.gitattributes"

# System
ln -sf "$DOTFILES_ROOT/system/.editorconfig" "$HOME/.editorconfig"
ln -sf "$DOTFILES_ROOT/system/.curlrc" "$HOME/.curlrc"

# Vim
ln -sf "$DOTFILES_ROOT/vim/.vimrc" "$HOME/.vimrc"

# Zed
mkdir -p "$HOME/.config/zed"
ln -sf "$DOTFILES_ROOT/zed/settings.json" "$HOME/.config/zed/settings.json"
ln -sf "$DOTFILES_ROOT/zed/keymap.json" "$HOME/.config/zed/keymap.json"

# Ghostty
mkdir -p "$HOME/.config/ghostty"
ln -sf "$DOTFILES_ROOT/ghostty/config" "$HOME/.config/ghostty/config"

# Codex CLI
mkdir -p "$HOME/.codex"
ln -sf "$DOTFILES_ROOT/codex/config.toml" "$HOME/.codex/config.toml"

# 4. Install Catppuccin theme
if [ -f "$DOTFILES_ROOT/theme/install.sh" ]; then
  echo "Installing Catppuccin theme..."
  bash "$DOTFILES_ROOT/theme/install.sh"
else
  echo "Theme install script not found, skipping..."
fi

# 5. Set Zsh as default shell
if [ "$SHELL" != "$(which zsh)" ]; then
  echo "Setting Zsh as default shell..."
  chsh -s "$(which zsh)"
fi

# 6. Apply macOS defaults
echo "Applying macOS defaults (requires sudo)..."
./macos/.macos

echo "Setup complete! Restart your terminal to see changes."
