#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

mkdir -p "$HOME/.config/herdr"
ln -sf "$DOTFILES_ROOT/herdr/config.toml" "$HOME/.config/herdr/config.toml"

# herdr-sidebar-feed pushes the $pr and $ports tokens config.toml renders in
# the sidebar, so it runs as a long-lived user service on both platforms.
install_macos() {
	local label="com.ibarsi.herdr-sidebar-feed"
	local agent_path="$HOME/Library/LaunchAgents/$label.plist"

	mkdir -p "$HOME/Library/LaunchAgents"
	ln -sf "$DOTFILES_ROOT/herdr/$label.plist" "$agent_path"

	if command -v launchctl >/dev/null 2>&1; then
		launchctl bootout "gui/$(id -u)/$label" >/dev/null 2>&1 || true
		launchctl bootstrap "gui/$(id -u)" "$agent_path" >/dev/null
	fi
}

install_linux() {
	local unit="herdr-sidebar-feed.service"
	local unit_dir="$HOME/.config/systemd/user"

	mkdir -p "$unit_dir"
	ln -sf "$DOTFILES_ROOT/herdr/$unit" "$unit_dir/$unit"

	if command -v systemctl >/dev/null 2>&1; then
		systemctl --user daemon-reload
		systemctl --user enable "$unit" >/dev/null
		systemctl --user restart "$unit"
	fi
}

case "$(uname -s)" in
Darwin) install_macos ;;
Linux) install_linux ;;
*) echo "herdr: unsupported platform $(uname -s), sidebar feed not installed." >&2 ;;
esac
