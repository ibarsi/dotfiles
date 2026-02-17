#!/usr/bin/env bash
# Install Catppuccin theme configurations

set -e

DOTFILES="$HOME/dotfiles"

echo "🎨 Installing Catppuccin theme..."

# Symlink starship config
echo "→ Symlinking Starship config..."
mkdir -p "$HOME/.config"
ln -sf "$DOTFILES/theme/starship.toml" "$HOME/.config/starship.toml"

# Install bat themes
echo "→ Installing bat themes..."
mkdir -p "$(bat --config-dir)/themes"
wget -P "$(bat --config-dir)/themes" https://github.com/catppuccin/bat/raw/main/themes/Catppuccin%20Mocha.tmTheme
bat cache --build

# Ghostty theme — built-in Catppuccin, no extra install needed
echo "→ Ghostty: Catppuccin theme is built-in (configured via ghostty/config)"

# Vim setup
echo "→ Setting up Vim Catppuccin..."
mkdir -p "$HOME/.vim/pack/catppuccin/start"
if [[ ! -d "$HOME/.vim/pack/catppuccin/start/vim" ]]; then
  git clone https://github.com/catppuccin/vim.git "$HOME/.vim/pack/catppuccin/start/vim"
else
  echo "  Catppuccin vim already installed"
fi

echo "✅ Catppuccin theme installed!"
echo ""
echo "Manual steps:"
echo "  1. Ghostty: Catppuccin Mocha theme is applied automatically via config symlink"
echo "  2. Restart your terminal"
