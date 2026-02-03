#!/usr/bin/env bash

# bootstrap.sh - Modern setup for ibarsi

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

# 3. Create symlinks for dotfiles
echo "Creating symlinks..."
files=(.zshrc .aliases .exports .functions .path .macos .gitconfig .gitignore .editorconfig)
for file in "${files[@]}"; do
  ln -sf "$(pwd)/$file" "$HOME/$file"
done

# 4. Set Zsh as default shell
if [ "$SHELL" != "$(which zsh)" ]; then
  echo "Setting Zsh as default shell..."
  chsh -s "$(which zsh)"
fi

# 5. Apply macOS defaults
echo "Applying macOS defaults (requires sudo)..."
./.macos

echo "Setup complete! Restart your terminal to see changes."
