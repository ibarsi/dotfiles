#!/usr/bin/env bash
set -euo pipefail

# llama.cpp inference server - an OpenAI-compatible endpoint on 127.0.0.1:1234.
#
# presets.ini is user-owned and read by llama-server running as this user, so
# it is symlinked directly and needs no privileges.
#
# The systemd unit lives in /etc and is parsed by PID 1 early in boot, before
# /home is guaranteed, so it is copied rather than symlinked: a link into the
# dotfiles checkout resolves to nothing at that point and the unit silently
# disappears. Writing it needs root. It is only touched when it has actually
# drifted, which keeps a re-run of bootstrap-omarchy.sh from asking to
# authenticate for nothing.

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
SOURCE_DIR="$DOTFILES_ROOT/llama"
PRESETS="$HOME/models/presets.ini"
UNIT_NAME="llama-server.service"
UNIT_PATH="/etc/systemd/system/$UNIT_NAME"

# Run a shell snippet as root behind a single authentication prompt.
#
# sudo when there is a terminal to type a password into, which is the normal
# case for someone running bootstrap-omarchy.sh by hand. pkexec's graphical
# dialog when there isn't - launched from an agent, a hook or a menu entry -
# since sudo cannot prompt without a tty and fails outright.
as_root() {
	if [[ -t 0 ]]; then
		sudo /bin/sh -c "$1"
	elif [[ -n "${WAYLAND_DISPLAY:-}${DISPLAY:-}" ]] && command -v pkexec >/dev/null 2>&1; then
		echo "llama: requesting authentication, look for a system dialog..." >&2
		pkexec /bin/sh -c "$1"
	else
		return 1
	fi
}

install_presets() {
	mkdir -p "$(dirname "$PRESETS")"

	# Preserve a hand-edited file once, so tuning done on the machine but never
	# committed isn't silently destroyed by the symlink.
	if [[ -e "$PRESETS" && ! -L "$PRESETS" ]]; then
		mv "$PRESETS" "$PRESETS.bak.$(date +%s)"
	fi

	ln -sfn "$SOURCE_DIR/presets.ini" "$PRESETS"
}

install_unit() {
	# A symlink here is the old layout and always counts as drift, even when it
	# points at an identical file, so upgrading a machine replaces it.
	if [[ -f "$UNIT_PATH" && ! -L "$UNIT_PATH" ]] &&
		cmp -s "$SOURCE_DIR/$UNIT_NAME" "$UNIT_PATH"; then
		return 0
	fi

	# Everything root needs to do, as one snippet, so there is a single prompt
	# rather than one per command. systemd caches parsed units, so the
	# daemon-reload is what actually makes the new unit take effect.
	# Paths are assumed free of single quotes, which holds for a dotfiles
	# checkout under $HOME.
	local snippet
	snippet="
		set -e
		if [ -f '$UNIT_PATH' ] && [ ! -L '$UNIT_PATH' ]; then
			cp -p '$UNIT_PATH' '$UNIT_PATH.bak.$(date +%s)'
		fi
		rm -f '$UNIT_PATH'
		install -m644 '$SOURCE_DIR/$UNIT_NAME' '$UNIT_PATH'
		systemctl daemon-reload
		systemctl restart '$UNIT_NAME'
	"

	if as_root "$snippet"; then
		return 0
	fi

	cat >&2 <<-EOF
		llama: not authenticated, $UNIT_PATH left unchanged. To finish, run:
		  sudo install -m644 $SOURCE_DIR/$UNIT_NAME $UNIT_PATH
		  sudo systemctl daemon-reload
		  sudo systemctl restart $UNIT_NAME
	EOF
}

if [[ "$(uname -s)" != "Linux" ]]; then
	echo "llama: Linux-only (systemd + CUDA), skipping." >&2
	exit 0
fi

install_presets
install_unit
