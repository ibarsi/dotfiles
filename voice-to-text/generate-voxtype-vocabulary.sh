#!/usr/bin/env bash
set -euo pipefail

# Regenerates VoxType's custom vocabulary from a markdown glossary (a table
# with a bolded Term column, e.g. "| **Term** | definition | ... |") - the
# Linux counterpart to generate-typewhisper-dictionary.sh.
#
# Unlike whisper, the parakeet engine has no decoder-side vocabulary bias
# (whisper.initial_prompt is whisper-only), so the terms are applied *after*
# transcription in two places:
#
#   1. [text.replacements] in VoxType's config.toml - deterministic casing,
#      hyphen and acronym fixes. Zero latency, always applied.
#   2. glossary.txt - the plain term list, which voxtype-glossary-correct.sh
#      hands to a local LLM for context-aware correction.
#
# Set GLOSSARY_MARKDOWN_PATH to the glossary file to read - this is
# machine/project-specific, so keep it out of this tracked script and set it
# in system/.extra (gitignored) instead. Same variable the macOS sync uses.

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# .extra is the normal source of GLOSSARY_MARKDOWN_PATH, but let an explicit
# environment value win so a one-off run can be pointed at another glossary.
glossary_override="${GLOSSARY_MARKDOWN_PATH:-}"
# shellcheck source=/dev/null
[[ -f "$DOTFILES_ROOT/system/.extra" ]] && source "$DOTFILES_ROOT/system/.extra"
[[ -n "$glossary_override" ]] && GLOSSARY_MARKDOWN_PATH="$glossary_override"

DEFAULT_CONFIG="$HOME/.config/voxtype/config.toml"
CONFIG_FILE="${VOXTYPE_CONFIG:-$DEFAULT_CONFIG}"
GLOSSARY_FILE="${VOXTYPE_GLOSSARY:-$(dirname "$CONFIG_FILE")/glossary.txt}"

BEGIN_MARKER="# >>> glossary-sync (generated - do not edit, changes are overwritten)"
END_MARKER="# <<< glossary-sync"

if [[ -z "${GLOSSARY_MARKDOWN_PATH:-}" ]]; then
	echo "GLOSSARY_MARKDOWN_PATH is not set - export it in system/.extra." >&2
	exit 1
fi

if [[ ! -f "$GLOSSARY_MARKDOWN_PATH" ]]; then
	echo "Glossary not found: $GLOSSARY_MARKDOWN_PATH" >&2
	exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
	echo "VoxType config not found: $CONFIG_FILE" >&2
	exit 1
fi

# Only the Term column on table rows, not every bold span in the doc - a
# glossary markdown file may also use bold for emphasis or labels elsewhere
# (e.g. a worked-example dialogue) that aren't glossary terms.
terms="$(
	awk -F'|' '/^\|/ && $2 ~ /\*\*/ {print $2}' "$GLOSSARY_MARKDOWN_PATH" \
		| sed -E 's/\*//g; s/^[[:space:]]+//; s/[[:space:]]+$//' \
		| grep -v '^$' \
		| sort -u
)"

if [[ -z "$terms" ]]; then
	echo "No bolded terms found in $GLOSSARY_MARKDOWN_PATH - is it a glossary table?" >&2
	exit 1
fi

mkdir -p "$(dirname "$GLOSSARY_FILE")"
printf '%s\n' "$terms" >"$GLOSSARY_FILE"

# --- [text.replacements] ------------------------------------------------
#
# Replacements are case-insensitive whole-text substitutions with no sense of
# context, so we only emit fixes derivable from the term's own spelling:
# casing, hyphens, split compounds and acronyms. A bare capitalised English
# word (Card, Hold, Wire, Person) is skipped - "card" => "Card" would
# capitalise the word in ordinary prose for no benefit.

# Acronyms that are also ordinary English words. The rule above lets any
# all-caps term through, but "bin" => "BIN" would shout in "empty the bin".
# Add to this list if the glossary grows another one.
DENYLIST="${VOXTYPE_VOCABULARY_DENYLIST:-bin pan swift}"

# Spoken form of each term: split CamelCase, hyphens to spaces, lowercased.
spoken="$(printf '%s\n' "$terms" | sed -E 's/([a-z])([A-Z])/\1 \2/g; s/-/ /g' | tr '[:upper:]' '[:lower:]')"

# Keys already set by hand outside the generated block. A duplicate key in a
# TOML table is a parse error, which would take the whole config down.
manual_keys="$(
	awk -v b="$BEGIN_MARKER" -v e="$END_MARKER" '
		$0 == b { skipping = 1 }
		skipping { if ($0 == e) skipping = 0; next }
		/^[[:space:]]*\[/ { in_table = ($0 ~ /^[[:space:]]*\[text\.replacements\][[:space:]]*$/); next }
		in_table && match($0, /"[^"]+"/) { print tolower(substr($0, RSTART + 1, RLENGTH - 2)) }
	' "$CONFIG_FILE"
)"

replacements="$(
	paste -d'\t' <(printf '%s\n' "$spoken") <(printf '%s\n' "$terms") \
		| awk -F'\t' -v manual="$manual_keys" -v denylist="$DENYLIST" '
			BEGIN {
				n = split(manual, m, "\n"); for (i = 1; i <= n; i++) if (m[i] != "") taken[m[i]] = 1
				n = split(denylist, d, " "); for (i = 1; i <= n; i++) if (d[i] != "") denied[d[i]] = 1
			}
			function emit(k, t) {
				if (k == "" || k in denied || k in taken) return
				taken[k] = 1
				printf "\"%s\" = \"%s\"\n", k, t
			}
			{
				key = $1; term = $2
				# Worth an entry only if speech-to-text has something to get
				# wrong beyond capitalising a single ordinary word.
				if (term !~ / / && term !~ /-/ && term !~ /^[A-Z0-9]{2,6}$/ && key == tolower(term)) next
				if (key in denied) next
				# A hyphenated compound comes back from the engine in any of
				# three renderings, and a lookup table has no fuzzy matching to
				# fall back on - all three need a key or the fix lands at
				# random. Observed live: "Sub-Ledger" transcribed as
				# "subledger", "Non-Accrual" as "non-accrual".
				#   spaced      "sub ledger"   (the derived spoken form)
				#   hyphenated  "sub-ledger"   (the term itself, lowercased)
				#   joined      "subledger"
				# emit() dedupes, so a term with no hyphen just no-ops twice.
				# Watch for a join that lands on an English word (Co-Op =>
				# "coop") - that needs a DENYLIST entry.
				emit(key, term)
				variant = tolower(term)
				emit(variant, term)
				gsub(/-/, "", variant)
				emit(variant, term)
			}
		'
)"

block_file="$(mktemp)"
trap 'rm -f "$block_file"' EXIT
{
	printf '%s\n' "$BEGIN_MARKER"
	printf '# Source: %s\n' "$GLOSSARY_MARKDOWN_PATH"
	printf '%s\n' "$replacements"
	printf '%s\n' "$END_MARKER"
} >"$block_file"

updated="$(
	awk -v b="$BEGIN_MARKER" -v e="$END_MARKER" -v blockfile="$block_file" '
		function emit(  line) { while ((getline line < blockfile) > 0) print line; close(blockfile) }
		$0 == b { skipping = 1 }
		skipping { if ($0 == e) skipping = 0; next }
		/^[[:space:]]*\[/ {
			if (in_table && !done) { emit(); done = 1 }
			in_table = ($0 ~ /^[[:space:]]*\[text\.replacements\][[:space:]]*$/)
		}
		{ print }
		END {
			if (in_table && !done) { emit(); done = 1 }
			if (!done) { print ""; print "[text.replacements]"; emit() }
		}
	' "$CONFIG_FILE"
)"

term_count="$(printf '%s\n' "$terms" | wc -l | tr -d ' ')"
entry_count="$(printf '%s\n' "$replacements" | grep -c '^"' || true)"

if [[ "$updated" == "$(cat "$CONFIG_FILE")" ]]; then
	echo "Vocabulary already current: $term_count terms, $entry_count replacements."
	exit 0
fi

printf '%s\n' "$updated" >"$CONFIG_FILE"
echo "Wrote $entry_count replacements to $CONFIG_FILE and $term_count terms to $GLOSSARY_FILE"

# text.* is flagged "needs restart" in `voxtype config schema`. Only bounce the
# daemon when we actually rewrote the config it's running from - a run against
# some other file (a test, a dry run) has no business interrupting dictation.
if [[ "$CONFIG_FILE" == "$DEFAULT_CONFIG" ]] && systemctl --user is-active --quiet voxtype.service; then
	systemctl --user restart voxtype.service
	echo "Restarted voxtype.service"
fi
