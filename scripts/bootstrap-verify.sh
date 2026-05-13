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

check_betterdiscord_injection() {
	if ! command -v bdcli >/dev/null 2>&1; then
		echo "⚠️  missing: bdcli"
		status=1
		return
	fi

	local output
	if ! output="$(bdcli discover 2>&1)"; then
		echo "⚠️  BetterDiscord discovery failed"
		printf '%s\n' "$output"
		status=1
		return
	fi

	if printf '%s\n' "$output" | awk '$1 == "Discord" && $4 == "yes" { found = 1 } END { exit found ? 0 : 1 }'; then
		echo "✅ BetterDiscord injected into Discord Stable"
	else
		echo "⚠️  BetterDiscord is not injected into Discord Stable"
		printf '%s\n' "$output"
		status=1
	fi
}

check_link "$HOME/.config/ghostty/config"
check_link "$HOME/Library/Application Support/k9s/config.yaml"
check_link "$HOME/Library/Application Support/k9s/skins/catppuccin-mocha.yaml"
check_link "$HOME/Library/Application Support/BetterDiscord/themes/mocha.theme.css"
check_betterdiscord_injection
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
check_link "$HOME/Library/LaunchAgents/com.ibarsi.ensure-betterdiscord.plist"

if [ "$status" -eq 0 ]; then
	echo "Done."
else
	echo "Done with warnings."
fi

exit "$status"
