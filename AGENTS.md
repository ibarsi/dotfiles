# AGENTS.md

This file defines how coding agents should operate in this repository.

## Scope
Applies to the entire dotfiles repo.

## Goals
- Keep bootstrap reproducible and idempotent.
- Improve developer throughput with minimal complexity.
- Keep secrets out of version control.

## Working rules
- Make focused, minimal changes.
- Follow existing patterns in `Brewfile`, `bootstrap.sh`, `zsh/`, and `system/`.
- Prefer deterministic checks over stylistic guesswork.
- When user-facing behavior changes, update the guide it belongs to, not `README.md` directly: `docs/guides/macos.md` for macOS-only behavior, `docs/guides/omarchy.md` for Omarchy-only behavior, `docs/guides/workflows.md` for anything that works the same on both. Keep `README.md` itself limited to the landing page, install steps, Quick Commands, Structure, Features, and the generated platform matrix.
- Regenerate `docs/site-data.json` and keep the `docs/` site accurate — and the platform matrix embedded in `README.md` current — when aliases, functions, tasks, bootstrap links, topic install scripts, or user-visible features change. Run `mise run docs-build`.

## Safety
- Never commit API keys, tokens, passwords, or local secret files.
- For AI tools, wire key-loading paths and env conventions, not literal key values.

## Validation before PR
Run:
- `mise run check`
- `mise run docs-check`
- `mise run ai-doctor`
- `mise run bootstrap-verify`

## PR expectations
- Clear summary + rationale.
- Mention caveats/manual follow-up if needed.
- Request review from `ibarsi`.

@RTK.md
