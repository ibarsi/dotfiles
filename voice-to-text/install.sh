#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
VOXTYPE_CONFIG="$HOME/.config/voxtype/config.toml"

# Keep ~/.config/voxtype/config.toml a REAL file rather than a symlink into this
# repo: the vocabulary sync writes a glossary generated from a private work
# document into it, and this repo is public. A symlink would park that glossary
# in the working tree permanently, one stray `git add` away from being pushed.
# Seed the config from the repo copy only when there isn't one yet.
install_config() {
	mkdir -p "$(dirname "$VOXTYPE_CONFIG")"
	[ -e "$VOXTYPE_CONFIG" ] || cp "$DOTFILES_ROOT/voice-to-text/voxtype-config.toml" "$VOXTYPE_CONFIG"

	# Clean filter to strip the glossary should the repo copy ever be refreshed
	# from a live config. required=true makes git fail loudly on a clone where
	# this was never run, instead of committing the glossary verbatim.
	git -C "$DOTFILES_ROOT" config filter.voxtype-local.clean \
		"sed '/^# >>> glossary-sync/,/^# <<< glossary-sync/d'"
	git -C "$DOTFILES_ROOT" config filter.voxtype-local.smudge cat
	git -C "$DOTFILES_ROOT" config filter.voxtype-local.required true
}

install_macos() {
	local label="com.ibarsi.typewhisper-dictionary-sync"
	local agent_path="$HOME/Library/LaunchAgents/$label.plist"

	mkdir -p "$HOME/Library/LaunchAgents"
	ln -sf "$DOTFILES_ROOT/voice-to-text/$label.plist" "$agent_path"

	if command -v launchctl >/dev/null 2>&1; then
		launchctl bootout "gui/$(id -u)/$label" >/dev/null 2>&1 || true
		launchctl bootstrap "gui/$(id -u)" "$agent_path" >/dev/null
		launchctl kickstart -k "gui/$(id -u)/$label" >/dev/null
	fi
}

install_linux() {
	local unit_dir="$HOME/.config/systemd/user"
	local unit

	mkdir -p "$unit_dir"
	for unit in voxtype-vocabulary-sync.service voxtype-vocabulary-sync.timer; do
		ln -sf "$DOTFILES_ROOT/voice-to-text/$unit" "$unit_dir/$unit"
	done

	# The LLM correction pass is deliberately NOT wired up. The only local
	# model available (muse-glimmer) reasons unconditionally, which cost 10s
	# per dictation for no correction. See README.md > "The LLM pass" before
	# re-enabling, and re-enable with:
	#   voxtype config set output.post_process.command \
	#     "$DOTFILES_ROOT/voice-to-text/voxtype-glossary-correct.sh"

	if command -v systemctl >/dev/null 2>&1; then
		systemctl --user daemon-reload
		systemctl --user enable --now voxtype-vocabulary-sync.timer >/dev/null
		# Populate the vocabulary now rather than waiting for 07:00. Fails
		# loudly but harmlessly when GLOSSARY_MARKDOWN_PATH isn't set yet.
		systemctl --user start voxtype-vocabulary-sync.service ||
			echo "Initial vocabulary sync failed - see: journalctl --user -u voxtype-vocabulary-sync" >&2
	fi
}

install_config

case "$(uname -s)" in
	Darwin) install_macos ;;
	Linux) install_linux ;;
	*) echo "voice-to-text: unsupported platform $(uname -s), skipping." >&2 ;;
esac
