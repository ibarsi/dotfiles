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
check_bin pi
check_bin mise
check_bin rg
check_bin fd
check_bin bat

if [ -f "$HOME/.codex/config.toml" ]; then ok "$HOME/.codex/config.toml present"; else warn "$HOME/.codex/config.toml missing"; fi
if [ -f "$HOME/.claude/settings.json" ]; then ok "$HOME/.claude/settings.json present"; else warn "$HOME/.claude/settings.json missing"; fi
if [ -f "$HOME/.pi/agent/settings.json" ]; then ok "$HOME/.pi/agent/settings.json present"; else warn "$HOME/.pi/agent/settings.json missing"; fi
if [ -f "$HOME/.pi/agent/models.json" ]; then ok "$HOME/.pi/agent/models.json present"; else warn "$HOME/.pi/agent/models.json missing"; fi

if [ -n "${OMLX_API_KEY:-}" ]; then ok "OMLX_API_KEY is set"; else warn "OMLX_API_KEY is not set (needed for the repo-managed Pi oMLX provider)"; fi

# Endpoint reachability (status only, no secrets)
local_models_url="http://127.0.0.1:1234/v1/models"
if curl -sS -I --max-time 5 "$local_models_url" >/dev/null; then ok "Reachable: $local_models_url"; else warn "Cannot reach: $local_models_url"; fi

echo "Done."
