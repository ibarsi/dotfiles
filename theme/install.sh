#!/usr/bin/env bash
# Install Catppuccin theme configurations

set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

echo "🎨 Installing Catppuccin theme..."

# Symlink starship config
echo "→ Symlinking Starship config..."
mkdir -p "$HOME/.config"
ln -sf "$DOTFILES_ROOT/theme/starship.toml" "$HOME/.config/starship.toml"

# Install bat themes
echo "→ Installing bat themes..."
mkdir -p "$(bat --config-dir)/themes"
wget -P "$(bat --config-dir)/themes" https://github.com/catppuccin/bat/raw/main/themes/Catppuccin%20Mocha.tmTheme
bat cache --build

echo "→ Ghostty: Catppuccin theme is built-in (configured via ghostty/config)"

# BetterDiscord app install
echo "→ Installing BetterDiscord into Discord Stable..."
if command -v bdcli >/dev/null 2>&1; then
	bdcli install --channel stable
else
	echo "  bdcli not found; run brew bundle first, then rerun theme/install.sh"
fi

# BetterDiscord theme wrapper
echo "→ Symlinking BetterDiscord Catppuccin theme..."
BETTERDISCORD_THEME_DIR="$HOME/Library/Application Support/BetterDiscord/themes"
mkdir -p "$BETTERDISCORD_THEME_DIR"
ln -sf "$DOTFILES_ROOT/theme/betterdiscord/mocha.theme.css" "$BETTERDISCORD_THEME_DIR/mocha.theme.css"

# Vim setup
echo "→ Setting up Vim Catppuccin..."
mkdir -p "$HOME/.vim/pack/catppuccin/start"
if [[ ! -d "$HOME/.vim/pack/catppuccin/start/vim" ]]; then
	git clone https://github.com/catppuccin/vim.git "$HOME/.vim/pack/catppuccin/start/vim"
else
	echo "  Catppuccin vim already installed"
fi

# k9s skin (macOS uses ~/Library/Application Support/k9s/)
echo "→ Installing k9s Catppuccin skin..."
K9S_DIR="$HOME/Library/Application Support/k9s"
mkdir -p "$K9S_DIR/skins"
curl -fsSL https://github.com/catppuccin/k9s/raw/main/dist/catppuccin-mocha.yaml \
	-o "$K9S_DIR/skins/catppuccin-mocha.yaml"

echo "✅ Catppuccin theme installed!"
echo ""
echo "Manual steps:"
echo "  1. Ghostty: Catppuccin Mocha theme is applied automatically via config symlink"
echo "  2. BetterDiscord: Discord Stable is installed via bdcli; open Discord Settings > BetterDiscord > Themes and enable Catppuccin Mocha"
echo "  3. Obsidian (optional): if you want Obsidian to match, run these yourself:"
echo "     obsidian theme:install name=Catppuccin"
echo "     obsidian theme:set name=Catppuccin"
echo "  4. Restart your terminal"
