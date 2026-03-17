#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this inside a git repository."
  exit 1
fi

base="${1:-master}"
branch="$(git rev-parse --abbrev-ref HEAD)"

echo "== PR Ready =="
echo "Base:   $base"
echo "Branch: $branch"
echo

echo "Running: mise run check"
if command -v mise >/dev/null 2>&1; then
  mise run check
else
  echo "⚠️  mise not found; skipping automated checks"
fi

echo
echo "Suggested PR body scaffold"
echo "-------------------------"
echo "## Summary"
git diff --name-only "$base...$branch" | sed 's/^/- /'
echo
echo "## Why"
echo "- "
echo
echo "## Validation"
echo "- [ ] mise run check"
echo "- [ ] manual smoke test"
