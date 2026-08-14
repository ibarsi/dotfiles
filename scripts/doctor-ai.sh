#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

ok() { printf "✅ %s\n" "$1"; }
warn() { printf "⚠️  %s\n" "$1"; }
err() { printf "❌ %s\n" "$1"; }

check_bin() {
	local name="$1"
	if command -v "$name" >/dev/null 2>&1; then ok "$name installed"; else warn "$name missing"; fi
}

fresh_shell_env() {
	local name="$1"
	if command -v zsh >/dev/null 2>&1; then
		zsh -lic "print -r -- \${$name:-}" 2>/dev/null || true
	fi
}

echo "== AI Toolchain Doctor =="

check_bin codex
check_bin claude
check_bin mini
check_bin mini-extra
check_bin mise
check_bin rg
check_bin fd
check_bin bat

if [ -f "$HOME/.codex/config.toml" ]; then ok "$HOME/.codex/config.toml present"; else warn "$HOME/.codex/config.toml missing"; fi
if [ -f "$HOME/.claude/settings.json" ]; then ok "$HOME/.claude/settings.json present"; else warn "$HOME/.claude/settings.json missing"; fi
if [ -f "$DOTFILES_ROOT/mini-swe-agent/omlx.yaml" ]; then ok "$DOTFILES_ROOT/mini-swe-agent/omlx.yaml present"; else warn "$DOTFILES_ROOT/mini-swe-agent/omlx.yaml missing"; fi

if [ -n "${OMLX_API_KEY:-}" ]; then ok "OMLX_API_KEY is set"; else warn "OMLX_API_KEY is not set (needed for the repo-managed mini-SWE-agent oMLX provider)"; fi
mswea_config_dir="${MSWEA_CONFIG_DIR:-}"
if [ -z "$mswea_config_dir" ]; then
	mswea_config_dir="$(fresh_shell_env MSWEA_CONFIG_DIR)"
fi
if [ "$mswea_config_dir" = "$DOTFILES_ROOT/mini-swe-agent" ]; then ok "MSWEA_CONFIG_DIR points at repo-managed mini-SWE-agent configs"; else warn "MSWEA_CONFIG_DIR is not using $DOTFILES_ROOT/mini-swe-agent"; fi

echo "Done."
