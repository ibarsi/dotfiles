#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# tmux prefers ~/.config/tmux/tmux.conf over ~/.tmux.conf and reads only one of
# them, so this is the path that must carry our config (also lets it layer on
# top of Omarchy's tmux config via `source-file -q` on Linux).
mkdir -p "$HOME/.config/tmux"
ln -sf "$DOTFILES_ROOT/tmux/.tmux.conf" "$HOME/.config/tmux/tmux.conf"
