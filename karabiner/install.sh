#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
ASSETS_DIR="$HOME/.config/karabiner/assets/complex_modifications"
CONFIG_PATH="$HOME/.config/karabiner/karabiner.json"
RULE_PATH="$DOTFILES_ROOT/karabiner/complex_modifications/brave-control-shortcuts.json"
RULE_DESCRIPTION="Brave: Ctrl browser shortcuts emulate Command"
LEGACY_LABEL="com.ibarsi.capslock-control"
LEGACY_PATH="$HOME/Library/LaunchAgents/${LEGACY_LABEL}.plist"

mkdir -p "$ASSETS_DIR"
ln -sfn "$RULE_PATH" "$ASSETS_DIR/brave-control-shortcuts.json"

if [ ! -f "$CONFIG_PATH" ]; then
	echo "Karabiner profile not created yet; linked the Brave rule for import after Karabiner first launches."
	exit 0
fi

temporary_config="$(mktemp "${CONFIG_PATH}.XXXXXX")"
trap 'rm -f "$temporary_config"' EXIT

jq --slurpfile rule "$RULE_PATH" --arg description "$RULE_DESCRIPTION" '
  .profiles |= map(
    if .selected == true then
      .simple_modifications = (
        ((.simple_modifications // []) | map(select(.from.key_code != "caps_lock")))
        + [{"from": {"key_code": "caps_lock"}, "to": [{"key_code": "left_control"}]}]
      ) |
      .complex_modifications = (
        (.complex_modifications // {}) + {
          rules: (
            ((.complex_modifications.rules // []) | map(select(.description != $description)))
            + $rule[0].rules
          )
        }
      )
    else . end
  )
' "$CONFIG_PATH" >"$temporary_config"

mv "$temporary_config" "$CONFIG_PATH"
trap - EXIT

if command -v launchctl >/dev/null 2>&1; then
	launchctl bootout "gui/$(id -u)/$LEGACY_LABEL" >/dev/null 2>&1 || true
fi

if [ -L "$LEGACY_PATH" ]; then
	rm "$LEGACY_PATH"
fi

echo "Enabled Caps Lock to Control and Brave Control shortcuts in Karabiner's selected profile."
