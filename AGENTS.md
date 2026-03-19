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
- Update README when user-facing behavior changes.

## Safety
- Never commit API keys, tokens, passwords, or local secret files.
- For AI tools, wire key-loading paths and env conventions, not literal key values.

## Validation before PR
Run:
- `mise run check`
- `mise run ai-doctor`
- `mise run bootstrap-verify`

## PR expectations
- Clear summary + rationale.
- Mention caveats/manual follow-up if needed.
- Request review from `ibarsi`.
