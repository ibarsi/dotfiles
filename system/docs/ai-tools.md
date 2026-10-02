# AI shell shortcuts

The shared [aliases](../.aliases) and [functions](../.functions) expose shortcuts for installed AI tools; they do not install the tools or copy their configurations.

## Agy CLI Workflow

Agy is wired into the shared shell shortcut set with aliases that mirror the Codex and Claude Code patterns where the CLI exposes matching flags.

**Shell shortcuts:**

- `agye` → `agy -p`
- `agyr` → `agy --continue`
- `agyreview` → start Agy with `/review`
- `agyyolo` → `agy --dangerously-skip-permissions`

## Configured tools

- [Codex](../../codex/README.md#shell-shortcuts) owns its config, hooks and shortcuts.
- [Claude Code](../../claude/README.md#shell-shortcuts) owns its settings and shortcuts.
- `cxyolo` and `ccyolo` explicitly request bypass modes; normal launch aliases retain the tool’s configured policy.
- The macOS-only `aiup` updater is documented under [Zsh](../../zsh/README.md#updates).

[Local environment conventions](../README.md#local-environment-conventions) · [AI diagnostics](../../scripts/README.md#ai-diagnostics)
