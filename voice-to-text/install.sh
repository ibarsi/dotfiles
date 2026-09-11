#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
LABEL="com.ibarsi.typewhisper-dictionary-sync"

mkdir -p "$HOME/Library/LaunchAgents"
ln -sf "$DOTFILES_ROOT/voice-to-text/$LABEL.plist" "$HOME/Library/LaunchAgents/$LABEL.plist"

if command -v launchctl >/dev/null 2>&1; then
	launchctl bootout "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || true
	launchctl bootstrap "gui/$(id -u)" \
		"$HOME/Library/LaunchAgents/$LABEL.plist" >/dev/null 2>&1 || true
	launchctl kickstart -k "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || true
fi
