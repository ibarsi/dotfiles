#!/usr/bin/env bash
set -euo pipefail

# Links the shared Starship prompt; used by both bootstraps.
DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config"
ln -sfn "$DOTFILES_ROOT/theme/starship.toml" "$HOME/.config/starship.toml"
# Older Omarchy runs installed a theme template here that now points nowhere.
rm -f "$HOME/.config/omarchy/themed/starship.toml.tpl"
