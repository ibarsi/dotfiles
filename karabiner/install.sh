#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
ASSETS_DIR="$HOME/.config/karabiner/assets/complex_modifications"
CONFIG_PATH="$HOME/.config/karabiner/karabiner.json"
BRAVE_RULE_PATH="$DOTFILES_ROOT/karabiner/complex_modifications/brave-control-shortcuts.json"
ZEN_RULE_PATH="$DOTFILES_ROOT/karabiner/complex_modifications/zen-control-shortcuts.json"
SLACK_RULE_PATH="$DOTFILES_ROOT/karabiner/complex_modifications/slack-control-shortcuts.json"
BRAVE_RULE_DESCRIPTION="Brave: Ctrl browser shortcuts emulate Command"
ZEN_RULE_DESCRIPTION="Zen: Ctrl browser shortcuts emulate Command"
SLACK_RULE_DESCRIPTION="Slack: Ctrl shortcuts emulate Command"
LEGACY_LABEL="com.ibarsi.capslock-control"
LEGACY_PATH="$HOME/Library/LaunchAgents/${LEGACY_LABEL}.plist"

mkdir -p "$ASSETS_DIR"
ln -sfn "$BRAVE_RULE_PATH" "$ASSETS_DIR/brave-control-shortcuts.json"
ln -sfn "$ZEN_RULE_PATH" "$ASSETS_DIR/zen-control-shortcuts.json"
ln -sfn "$SLACK_RULE_PATH" "$ASSETS_DIR/slack-control-shortcuts.json"

if [ ! -f "$CONFIG_PATH" ]; then
	echo "Karabiner profile not created yet; linked the Brave rule for import after Karabiner first launches."
	exit 0
fi

temporary_config="$(mktemp "${CONFIG_PATH}.XXXXXX")"
trap 'rm -f "$temporary_config"' EXIT

jq --slurpfile brave_rule "$BRAVE_RULE_PATH" --slurpfile zen_rule "$ZEN_RULE_PATH" \
	--slurpfile slack_rule "$SLACK_RULE_PATH" --arg brave_description "$BRAVE_RULE_DESCRIPTION" \
	--arg zen_description "$ZEN_RULE_DESCRIPTION" --arg slack_description "$SLACK_RULE_DESCRIPTION" '
  .profiles |= map(
    if .selected == true then
      .simple_modifications = (
        ((.simple_modifications // []) | map(select(.from.key_code != "caps_lock")))
        + [{"from": {"key_code": "caps_lock"}, "to": [{"key_code": "left_control"}]}]
      ) |
      .complex_modifications = (
        (.complex_modifications // {}) + {
          rules: (
            ((.complex_modifications.rules // []) |
              map(select(.description != $brave_description and .description != $zen_description and .description != $slack_description)))
            + $brave_rule[0].rules
            + $zen_rule[0].rules
            + $slack_rule[0].rules
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
