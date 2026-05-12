#!/usr/bin/env bash
set -euo pipefail

echo "== Bootstrap Verify =="

check_link() {
	local path="$1"
	if [ -L "$path" ] || [ -f "$path" ]; then
		echo "✅ $path"
	else
		echo "⚠️  missing: $path"
	fi
}

check_link "$HOME/.config/ghostty/config"
check_link "$HOME/Library/Application Support/BetterDiscord/themes/mocha.theme.css"
check_link "$HOME/.config/zed/settings.json"
check_link "$HOME/.config/zed/keymap.json"
check_link "$HOME/.config/mise/config.toml"
check_link "$HOME/.config/glow/glow.yml"
check_link "$HOME/.config/glow/catppuccin-mocha.json"
check_link "$HOME/.codex/config.toml"
check_link "$HOME/.claude/settings.json"
check_link "$HOME/.pi/agent/settings.json"
check_link "$HOME/.pi/agent/models.json"
check_link "$HOME/Library/Preferences/gitmoji-nodejs/config.json"
check_link "$HOME/Library/LaunchAgents/com.ibarsi.capslock-control.plist"

echo "Done."
