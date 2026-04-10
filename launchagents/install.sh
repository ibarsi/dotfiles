#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/Library/LaunchAgents"
ln -sf "$DOTFILES_ROOT/launchagents/com.ibarsi.capslock-control.plist" "$HOME/Library/LaunchAgents/com.ibarsi.capslock-control.plist"

if command -v launchctl >/dev/null 2>&1; then
	launchctl bootout "gui/$(id -u)/com.ibarsi.capslock-control" >/dev/null 2>&1 || true
	launchctl bootstrap "gui/$(id -u)" \
		"$HOME/Library/LaunchAgents/com.ibarsi.capslock-control.plist" >/dev/null 2>&1 || true
	launchctl kickstart -k "gui/$(id -u)/com.ibarsi.capslock-control" >/dev/null 2>&1 || true
fi
