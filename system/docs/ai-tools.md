# AI shell shortcuts

The shared [aliases](../.aliases) and [functions](../.functions) expose shortcuts for installed AI tools; they do not install the tools or copy their configurations.

## Machine-local configuration

Codex configuration and hooks under `~/.codex/`, Claude Code settings and themes under `~/.claude/`, and Agy settings under `~/.gemini/antigravity-cli/` are machine-local. This repository does not store or symlink them. The shared shell retains shortcuts for the installed tools.

- Codex: `cx`, `cxe`, `cxr`, `cxreview`, `cxyolo`.
- Claude Code: `cc`, `cce`, `ccr`, `ccreview`, `ccyolo`.
- Agy: `agye` (`agy -p`), `agyr`, `agyreview`, `agyyolo`. Agy reads prompts only from `-p`, `-i` or stdin, so `agyreview` passes `/review` through `-i`.
- `cxyolo`, `ccyolo` and `agyyolo` explicitly request bypass modes; normal launch aliases retain the tool’s configured policy.
- The macOS-only `aiup` updater is documented under [Zsh](../../zsh/README.md#updates).

[Local environment conventions](../README.md#local-environment-conventions) · [AI diagnostics](../../scripts/README.md#ai-diagnostics)
