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

# Install iTerm2 color preset
echo "→ Installing iTerm2 color preset..."
if [[ -d "$HOME/Library/Application Support/iTerm2/DynamicProfiles" ]]; then
  mkdir -p "$HOME/Library/Application Support/iTerm2/DynamicProfiles"
  ln -sf "$DOTFILES/theme/iterm2-catppuccin.json" "$HOME/Library/Application Support/iTerm2/DynamicProfiles/catppuccin.json"
fi

# Zed theme - auto-installed via settings
echo "→ Zed: Catppuccin theme auto-installs via auto_install_extensions in zed/settings.json"

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
echo "  1. Open Zed - Catppuccin theme installs automatically"
echo "  2. In iTerm2: Preferences → Profiles → Colors → Color Presets → Catppuccin Mocha"
echo "  3. Restart your terminal"
