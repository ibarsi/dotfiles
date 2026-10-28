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
check_link "$HOME/.config/starship.toml"
# macOS-only links; bootstrap-omarchy.sh does not install these.
if [ "$(uname -s)" = "Darwin" ]; then
	check_link "$HOME/Library/Application Support/k9s/config.yaml"
	check_link "$HOME/Library/Application Support/k9s/skins/catppuccin-mocha.yaml"
	check_link "$HOME/.config/zed/settings.json"
	check_link "$HOME/.config/zed/keymap.json"
	check_link "$HOME/.config/mise/conf.d/00-dotfiles.toml"
	check_link "$HOME/.config/glow/glow.yml"
	check_link "$HOME/.config/glow/catppuccin-mocha.json"
	check_link "${XDG_CONFIG_HOME:-$HOME/.config}/btop/btop.conf"
	check_link "${XDG_CONFIG_HOME:-$HOME/.config}/btop/themes/catppuccin_mocha.theme"
	check_link "$HOME/.config/karabiner/assets/complex_modifications/brave-control-shortcuts.json"
	check_link "$HOME/.config/karabiner/assets/complex_modifications/zen-control-shortcuts.json"
	check_link "$HOME/.config/karabiner/assets/complex_modifications/slack-control-shortcuts.json"
	check_link "$HOME/.config/karabiner/assets/complex_modifications/discord-control-shortcuts.json"
	check_link "$HOME/.config/karabiner/assets/complex_modifications/linear-control-shortcuts.json"
	check_link "$HOME/Library/Preferences/gitmoji-nodejs/config.json"
else
	check_link "${XDG_CONFIG_HOME:-$HOME/.config}/gitmoji-nodejs/config.json"
fi

# Read once: under pipefail, grep -q exiting early SIGPIPEs gh and fails the check.
gh_aliases=$(gh alias list 2>/dev/null || true)
for alias in bd ci mq url; do
	if grep -q "^$alias: " <<<"$gh_aliases"; then
		echo "✅ gh alias $alias"
	else
		echo "⚠️  missing: gh alias $alias (run gh/install.sh)"
		status=1
	fi
done

if [ "$status" -eq 0 ]; then
	echo "Done."
else
	echo "Done with warnings."
fi

exit "$status"
