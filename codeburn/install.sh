#!/usr/bin/env bash
set -euo pipefail

# Apply the verified CodeBurn price overrides. Idempotent: the script only
# writes (with a backup) when the managed rates differ. It needs python3 but
# not the CodeBurn CLI, so topic order relative to mise/install.sh is irrelevant.

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# A refusal (existing flat Haiku override, discounts) needs a human, not a failed bootstrap.
python3 "$DOTFILES_ROOT/codeburn/configure-pricing.py" --apply ||
	echo "⚠️  CodeBurn pricing not applied; see codeburn/README.md" >&2
