#!/usr/bin/env bash
set -uo pipefail

# Checks generate-voxtype-vocabulary.sh against a throwaway glossary and
# config. Nothing here touches the real VoxType config or the daemon.
#
# The risk being covered: the script does TOML surgery on a live, hand-edited
# config file. A duplicate key or a mangled section is a parse error that
# takes VoxType's whole config down, and the failure only shows up the next
# time you try to dictate.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
GENERATOR="$HERE/generate-voxtype-vocabulary.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

status=0

check() {
	local label="$1" expected="$2" actual="$3"
	if [[ "$expected" == "$actual" ]]; then
		echo "✅ $label"
	else
		echo "⚠️  $label: expected '$expected', got '$actual'"
		status=1
	fi
}

cat >"$tmp/glossary.md" <<'EOF'
# Glossary

Some **bold prose** outside a table that must not become a term.

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Ledger Transfer** | Internal movement | Posting |
| **Sub-Ledger** | Attached account | Child account |
| **FedNow** | Instant rail | Instant payment |
| **ACH** | Batch rail | EFT |
| **BIN** | Bank Identification Number | IIN |
| **Card** | Payment instrument | Plastic |
EOF

cat >"$tmp/config.toml" <<'EOF'
engine = "parakeet"

[text.replacements]
"hyper land" = "Hyprland"
"ach" = "Already Claimed By Hand"

[vad]
enabled = true
EOF

run() {
	GLOSSARY_MARKDOWN_PATH="$tmp/glossary.md" \
		VOXTYPE_CONFIG="$tmp/config.toml" \
		VOXTYPE_GLOSSARY="$tmp/glossary.txt" \
		bash "$GENERATOR" 2>&1
}

run >/dev/null

replacements() {
	python3 -c "
import tomllib, sys
print(repr(tomllib.load(open('$tmp/config.toml','rb'))['text']['replacements']))
" 2>&1
}

parsed="$(replacements)"
if [[ "$parsed" == *Error* || "$parsed" == *Traceback* ]]; then
	echo "⚠️  config is not valid TOML after generation: $parsed"
	exit 1
fi
echo "✅ config is still valid TOML"

has() { [[ "$parsed" == *"$1"* ]] && echo yes || echo no; }

check "multi-word term gets a casing fix" yes "$(has "'ledger transfer': 'Ledger Transfer'")"
check "hyphenated term maps from its spoken form" yes "$(has "'sub ledger': 'Sub-Ledger'")"
check "CamelCase term is split" yes "$(has "'fed now': 'FedNow'")"
check "bare English word is skipped" no "$(has "'card'")"
check "English-word acronym is denylisted" no "$(has "'bin': 'BIN'")"
check "bold text outside a table is ignored" no "$(has "bold prose")"
check "hand-written entry is preserved" yes "$(has "'hyper land': 'Hyprland'")"
check "hand-written key wins over generated" yes "$(has "'ach': 'Already Claimed By Hand'")"
check "unrelated section survives" yes "$(grep -qc '^\[vad\]' "$tmp/config.toml" && echo yes || echo no)"
check "glossary term list written" 6 "$(wc -l <"$tmp/glossary.txt" | tr -d ' ')"

# Re-running must be a no-op, otherwise the daily timer restarts the daemon
# every morning for nothing.
before="$(cat "$tmp/config.toml")"
second="$(run)"
check "second run is idempotent" yes "$([[ "$before" == "$(cat "$tmp/config.toml")" ]] && echo yes || echo no)"
check "second run reports no change" yes "$([[ "$second" == *"already current"* ]] && echo yes || echo no)"

# A term dropped from the glossary must disappear from the config - the whole
# reason the block is regenerated rather than appended to.
grep -v 'FedNow' "$tmp/glossary.md" >"$tmp/trimmed.md" && mv "$tmp/trimmed.md" "$tmp/glossary.md"
run >/dev/null
parsed="$(replacements)"
check "removed term is dropped from config" no "$(has "'fed now'")"

exit "$status"
