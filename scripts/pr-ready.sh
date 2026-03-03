#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run inside a git repository."
  exit 1
fi

echo "== PR Ready Check =="

if command -v mise >/dev/null 2>&1; then
  mise run check || { echo "Checks failed"; exit 1; }
else
  echo "⚠️  mise not found, skipping mise run check"
fi

branch=$(git rev-parse --abbrev-ref HEAD)
base="master"

echo

echo "Suggested PR body:"
echo "-------------------"
echo "## Summary"
git diff --name-only "$base...$branch" | sed 's/^/- /'
echo
echo "## Why"
echo "- Improve developer workflow and reliability"
echo
echo "## Validation"
echo "- [ ] mise run check"
echo "- [ ] manual smoke test"
