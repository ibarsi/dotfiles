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
check_link "$HOME/.config/herdr/config.toml"
check_link "$HOME/.config/ibarsi-dotfiles/bashrc"
check_link "$HOME/.config/ibarsi-dotfiles/git-aliases.gitconfig"
check_link "$HOME/.config/ibarsi-dotfiles/git-delta.gitconfig"
check_link "$HOME/Library/Application Support/k9s/config.yaml"
check_link "$HOME/Library/Application Support/k9s/skins/catppuccin-mocha.yaml"
check_link "$HOME/.config/zed/settings.json"
check_link "$HOME/.config/zed/keymap.json"
check_link "$HOME/.config/mise/config.toml"
check_link "$HOME/.config/glow/glow.yml"
check_link "$HOME/.config/glow/catppuccin-mocha.json"
check_link "$HOME/.config/starship.toml"
check_link "$HOME/.config/karabiner/assets/complex_modifications/brave-control-shortcuts.json"
check_link "$HOME/.config/karabiner/assets/complex_modifications/zen-control-shortcuts.json"
check_link "$HOME/.config/karabiner/assets/complex_modifications/slack-control-shortcuts.json"
check_link "$HOME/.config/karabiner/assets/complex_modifications/discord-control-shortcuts.json"
check_link "$HOME/.codex/config.toml"
check_link "$HOME/.codex/hooks.json"
check_link "$HOME/.codex/hooks"
check_link "$HOME/.claude/settings.json"
check_link "$HOME/Library/Preferences/gitmoji-nodejs/config.json"

if [ "$status" -eq 0 ]; then
	echo "Done."
else
	echo "Done with warnings."
fi

exit "$status"
