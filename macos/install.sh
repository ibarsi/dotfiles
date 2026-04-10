#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

echo "Applying macOS defaults (requires sudo)..."
bash "$DOTFILES_ROOT/macos/.macos"
