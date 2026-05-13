#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

LOG_DIR="$HOME/Library/Logs/dotfiles"
LOG_FILE="$LOG_DIR/ensure-betterdiscord.log"

mkdir -p "$LOG_DIR"

log() {
	printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG_FILE"
}

if ! command -v bdcli >/dev/null 2>&1; then
	log "bdcli not found; skipping BetterDiscord injection check"
	exit 0
fi

output="$(bdcli discover 2>&1)" || {
	log "bdcli discover failed: $output"
	exit 0
}

if ! printf '%s\n' "$output" | awk '$1 == "Discord" { found = 1 } END { exit found ? 0 : 1 }'; then
	log "Discord Stable not discovered; skipping BetterDiscord injection check"
	exit 0
fi

if printf '%s\n' "$output" | awk '$1 == "Discord" && $4 == "yes" { found = 1 } END { exit found ? 0 : 1 }'; then
	exit 0
fi

log "BetterDiscord is not injected into Discord Stable; running bdcli install --channel stable"
if bdcli --silent install --channel stable >>"$LOG_FILE" 2>&1; then
	log "BetterDiscord injection completed"
else
	log "BetterDiscord injection failed"
	exit 1
fi
