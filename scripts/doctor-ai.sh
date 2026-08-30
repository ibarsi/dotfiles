#!/usr/bin/env bash
set -euo pipefail

ok() { printf "✅ %s\n" "$1"; }
warn() { printf "⚠️  %s\n" "$1"; }
err() { printf "❌ %s\n" "$1"; }

check_bin() {
	local name="$1"
	if command -v "$name" >/dev/null 2>&1; then ok "$name installed"; else warn "$name missing"; fi
}

echo "== AI Toolchain Doctor =="

check_bin codex
check_bin claude
check_bin mise
check_bin rg
check_bin fd
check_bin bat

if [ -f "$HOME/.codex/config.toml" ]; then ok "$HOME/.codex/config.toml present"; else warn "$HOME/.codex/config.toml missing"; fi
if [ -f "$HOME/.claude/settings.json" ]; then ok "$HOME/.claude/settings.json present"; else warn "$HOME/.claude/settings.json missing"; fi
echo "Done."
