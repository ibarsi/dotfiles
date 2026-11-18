#!/usr/bin/env bash
set -euo pipefail

# Apply the verified CodeBurn price overrides. Idempotent: the script only
# writes (with a backup) when the managed rates differ. It needs python3 but
# not the CodeBurn CLI, so topic order relative to mise/install.sh is irrelevant.

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# A refusal (existing flat Haiku override, discounts) needs a human, not a failed bootstrap.
python3 "$DOTFILES_ROOT/codeburn/configure-pricing.py" --apply ||
	echo "⚠️  CodeBurn pricing not applied; see codeburn/README.md" >&2

# Keep `codeburn share` running in the background so paired devices can always
# reach this one. The mise `latest` symlink is used, not the shim: the shim fails
# with "No version is set" outside a directory that activates mise, such as under
# systemd or launchd, and `latest` still follows CLI updates.
SHIM="${MISE_DATA_DIR:-$HOME/.local/share/mise}/installs/npm-codeburn/latest/node_modules/.bin/codeburn"

# Write stdin to $1 only when it differs; return 0 when the file changed.
write_if_changed() {
	local tmp
	tmp="$(mktemp)"
	cat >"$tmp"
	if cmp -s "$tmp" "$1" 2>/dev/null; then
		rm -f "$tmp"
		return 1
	fi
	mkdir -p "$(dirname "$1")"
	mv "$tmp" "$1"
}

if [[ "$(uname -s)" == "Darwin" ]]; then
	PLIST="$HOME/Library/LaunchAgents/dev.ibarsi.codeburn-share.plist"
	if write_if_changed "$PLIST" <<PLIST_EOF; then
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>dev.ibarsi.codeburn-share</string>
<key>ProgramArguments</key><array><string>$SHIM</string><string>share</string><string>--always</string></array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
</dict></plist>
PLIST_EOF
		launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
		launchctl bootstrap "gui/$(id -u)" "$PLIST" ||
			echo "⚠️  codeburn-share launch agent not loaded; see codeburn/README.md" >&2
	fi
elif command -v systemctl >/dev/null 2>&1; then
	UNIT="$HOME/.config/systemd/user/codeburn-share.service"
	write_if_changed "$UNIT" <<UNIT_EOF || true
[Unit]
Description=CodeBurn device sharing

[Service]
ExecStart=$SHIM share --always
Restart=on-failure

[Install]
WantedBy=default.target
UNIT_EOF
	systemctl --user daemon-reload
	systemctl --user enable --now codeburn-share.service ||
		echo "⚠️  codeburn-share service not started; see codeburn/README.md" >&2
fi
