#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

install_macos() {
	local label="com.ibarsi.typewhisper-dictionary-sync"

	mkdir -p "$HOME/Library/LaunchAgents"
	ln -sf "$DOTFILES_ROOT/voice-to-text/$label.plist" "$HOME/Library/LaunchAgents/$label.plist"

	if command -v launchctl >/dev/null 2>&1; then
		launchctl bootout "gui/$(id -u)/$label" >/dev/null 2>&1 || true
		launchctl bootstrap "gui/$(id -u)" \
			"$HOME/Library/LaunchAgents/$label.plist" >/dev/null 2>&1 || true
		launchctl kickstart -k "gui/$(id -u)/$label" >/dev/null 2>&1 || true
	fi
}

install_linux() {
	local unit_dir="$HOME/.config/systemd/user"
	local unit

	mkdir -p "$unit_dir"
	for unit in voxtype-vocabulary-sync.service voxtype-vocabulary-sync.timer; do
		ln -sf "$DOTFILES_ROOT/voice-to-text/$unit" "$unit_dir/$unit"
	done

	if command -v voxtype >/dev/null 2>&1; then
		# Only .command is settable - .timeout_ms is in VoxType's README but
		# not in `voxtype config schema`, so the timeout lives in the script's
		# `curl --max-time` instead.
		voxtype config set output.post_process.command \
			"$DOTFILES_ROOT/voice-to-text/voxtype-glossary-correct.sh" >/dev/null
	else
		echo "voxtype not on PATH - skipped wiring output.post_process.command." >&2
	fi

	if command -v systemctl >/dev/null 2>&1; then
		systemctl --user daemon-reload
		systemctl --user enable --now voxtype-vocabulary-sync.timer >/dev/null
		# Populate the vocabulary now rather than waiting for 07:00. Fails
		# loudly but harmlessly when GLOSSARY_MARKDOWN_PATH isn't set yet.
		systemctl --user start voxtype-vocabulary-sync.service ||
			echo "Initial vocabulary sync failed - see: journalctl --user -u voxtype-vocabulary-sync" >&2
	fi
}

case "$(uname -s)" in
	Darwin) install_macos ;;
	Linux) install_linux ;;
	*) echo "voice-to-text: unsupported platform $(uname -s), skipping." >&2 ;;
esac
