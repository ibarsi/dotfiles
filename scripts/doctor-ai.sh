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
check_bin opencode
check_bin zsh-ai
check_bin mise
check_bin rg
check_bin fd
check_bin bat

if [ -f "$HOME/.codex/config.toml" ]; then ok "$HOME/.codex/config.toml present"; else warn "$HOME/.codex/config.toml missing"; fi
if [ -f "$HOME/.claude/settings.json" ]; then ok "$HOME/.claude/settings.json present"; else warn "$HOME/.claude/settings.json missing"; fi
if [ -f "$HOME/.config/opencode/opencode.json" ]; then ok "$HOME/.config/opencode/opencode.json present"; else warn "$HOME/.config/opencode/opencode.json missing"; fi
if [ -f "$HOME/.config/anthropic/api_key" ]; then ok "$HOME/.config/anthropic/api_key present"; else warn "$HOME/.config/anthropic/api_key missing"; fi

if [ -n "${ANTHROPIC_API_KEY:-}" ]; then ok "ANTHROPIC_API_KEY is set"; else warn "ANTHROPIC_API_KEY is not set"; fi
if [ -n "${OPENAI_API_KEY:-}" ]; then ok "OPENAI_API_KEY is set"; else warn "OPENAI_API_KEY is not set (optional)"; fi

# Endpoint reachability (status only, no secrets)
for url in "https://api.anthropic.com" "https://api.openai.com"; do
	if curl -sS -I --max-time 5 "$url" >/dev/null; then ok "Reachable: $url"; else warn "Cannot reach: $url"; fi
done

echo "Done."
