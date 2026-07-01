#!/usr/bin/env bash
set -euo pipefail

echo "== Bootstrap Verify =="

status=0

check_link() {
	local path="$1"
	if [ -L "$path" ] || [ -f "$path" ]; then
		echo "✅ $path"
	else
		echo "⚠️  missing: $path"
		status=1
	fi
}

check_link "$HOME/.config/ghostty/config"
check_link "$HOME/Library/Application Support/k9s/config.yaml"
check_link "$HOME/Library/Application Support/k9s/skins/catppuccin-mocha.yaml"
check_link "$HOME/.config/zed/settings.json"
check_link "$HOME/.config/zed/keymap.json"
check_link "$HOME/.config/mise/config.toml"
check_link "$HOME/.config/glow/glow.yml"
check_link "$HOME/.config/glow/catppuccin-mocha.json"
check_link "$HOME/.config/cmux/cmux.json"
check_link "$HOME/.codex/config.toml"
check_link "$HOME/.codex/hooks.json"
check_link "$HOME/.claude/settings.json"
check_link "$HOME/.pi/agent/settings.json"
check_link "$HOME/.pi/agent/models.json"
check_link "$HOME/Library/Preferences/gitmoji-nodejs/config.json"
check_link "$HOME/Library/LaunchAgents/com.ibarsi.capslock-control.plist"

if [ "$status" -eq 0 ]; then
	echo "Done."
else
	echo "Done with warnings."
fi

exit "$status"
