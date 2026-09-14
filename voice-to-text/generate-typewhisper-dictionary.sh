#!/usr/bin/env bash
set -euo pipefail

# launchd supplies only system paths; include the standard Homebrew locations
# so scheduled runs can find the TypeWhisper CLI as well as interactive ones.
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Regenerates a TypeWhisper dictionary import file from a markdown glossary
# (a table with a bolded Term column, e.g. "| **Term** | definition | ... |"),
# writes it to Application Support, and (if the app is running) imports it live
# via the `typewhisper` CLI.
#
# Set GLOSSARY_MARKDOWN_PATH to the glossary file to read - this is
# machine/project-specific, so keep it out of this tracked script and set it
# in system/.extra (gitignored) instead.

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
[[ -f "$DOTFILES_ROOT/system/.extra" ]] && source "$DOTFILES_ROOT/system/.extra"

OUTPUT_DIR="${TYPEWHISPER_DICTIONARY_DIR:-$HOME/Library/Application Support/typewhisper-dictionary-sync}"
OUTPUT_FILE="$OUTPUT_DIR/typewhisper-dictionary.json"

if [[ -z "${GLOSSARY_MARKDOWN_PATH:-}" ]]; then
	echo "GLOSSARY_MARKDOWN_PATH is not set - export it in system/.extra." >&2
	exit 1
fi

if [[ ! -f "$GLOSSARY_MARKDOWN_PATH" ]]; then
	echo "Glossary not found: $GLOSSARY_MARKDOWN_PATH" >&2
	exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Only the Term column on table rows, not every bold span in the doc - a
# glossary markdown file may also use bold for emphasis or labels elsewhere
# (e.g. a worked-example dialogue) that aren't glossary terms.
terms_json="$(
	awk -F'|' '/^\|/ && $2 ~ /\*\*/ {print $2}' "$GLOSSARY_MARKDOWN_PATH" \
		| sed -E 's/\*//g; s/^[[:space:]]+//; s/[[:space:]]+$//' \
		| sort -u \
		| jq -R -s -c 'split("\n")[:-1] | map(select(length > 0))'
)"

# Full SettingsBackup shape TypeWhisper's `import` command expects, with
# every section empty except dictionaryEntries - import is additive/dedup'd
# by (type, original.lowercased()), so re-running this daily never
# duplicates or overwrites existing entries.
jq -n --argjson terms "$terms_json" '{
	schemaVersion: 1,
	exportedAt: (now | strftime("%Y-%m-%dT%H:%M:%SZ")),
	appVersion: "dotfiles-generated",
	workflows: [],
	dictionaryEntries: ($terms | map({
		type: "term",
		original: .,
		replacement: null,
		caseSensitive: false,
		isEnabled: true,
		ctcMinSimilarity: null,
		source: "manual"
	})),
	snippets: [],
	promptActions: [],
	profiles: [],
	hotkeys: {},
	plugins: [],
	history: [],
	updateChannel: null,
	preferences: {}
}' >"$OUTPUT_FILE"

echo "Wrote $(jq '.dictionaryEntries | length' "$OUTPUT_FILE") terms to $OUTPUT_FILE"

if command -v typewhisper >/dev/null 2>&1; then
	if import_result="$(typewhisper import "$OUTPUT_FILE" --json 2>&1)"; then
		echo "Imported into TypeWhisper: $import_result"
	elif grep -q "Unknown command 'import'" <<<"$import_result"; then
		echo "Installed TypeWhisper CLI doesn't support 'import' yet - update the app (Settings > Check for Updates) and re-run. File is still up to date at $OUTPUT_FILE" >&2
	else
		echo "TypeWhisper import failed (is the app running?): $import_result" >&2
	fi
else
	echo "typewhisper CLI not found on PATH - import $OUTPUT_FILE manually via Settings > Dictionary." >&2
fi
