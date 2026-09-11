#!/usr/bin/env bash
# VoxType output.post_process command: reads a transcription on stdin, writes
# the corrected text on stdout.
#
# [text.replacements] can only fix a term's spelling; it can't tell "my bank
# account" from "the account accrues interest". This pass hands the glossary
# term list (written by generate-voxtype-vocabulary.sh) to a local LLM so
# domain terms are corrected with the surrounding sentence in view.
#
# Deliberately not `set -e`: every failure path must still emit the original
# transcription. Dictation that silently disappears is far worse than
# dictation that skipped a correction pass.
set -uo pipefail

text="$(cat)"

fallback() { printf '%s' "$text"; exit 0; }

GLOSSARY_FILE="${VOXTYPE_GLOSSARY:-$HOME/.config/voxtype/glossary.txt}"
ENDPOINT="${VOXTYPE_LLM_ENDPOINT:-http://127.0.0.1:1234/v1/chat/completions}"
MODEL="${VOXTYPE_LLM_MODEL:-muse-glimmer}"
TIMEOUT_SECS="${VOXTYPE_LLM_TIMEOUT_SECS:-8}"

# A correction returns roughly the input back, so cap generation near the
# input's own length. Without this the request is unbounded, and a model that
# decides to explain itself instead of complying burns the whole timeout - a
# 126-character sentence once drew 2891 tokens and stalled dictation for 10s.
# Truncation here is harmless: a clipped reply trips the length guard below
# and falls back to the raw transcription.
max_tokens=$(( ${#text} / 3 + 32 ))

[[ -n "${text//[[:space:]]/}" ]] || fallback
[[ -s "$GLOSSARY_FILE" ]] || fallback
command -v curl >/dev/null 2>&1 || fallback
command -v jq >/dev/null 2>&1 || fallback

read -r -d '' instructions <<'EOF' || true
You are a transcription corrector for a fintech engineering team. The user
message is raw speech-to-text output that may have misheard domain terms.

Rules:
- Fix only misheard or miscased domain terms, using the glossary below.
- Many glossary entries are also ordinary English words (bank, card, hold,
  wire, bin, pan, swift, capture, person, deposit). Only apply the glossary
  form when the sentence is plainly about the banking concept. In everyday
  usage leave the word exactly as spoken: "my bank account is overdrawn" and
  "be swift about it" are already correct and must not change.
- When in doubt, change nothing. A missed correction is a typo; a wrong one
  corrupts what the speaker said.
- Preserve the speaker's wording, tone, filler and punctuation exactly.
- Do not paraphrase, summarise, translate, answer, or add or remove content.
- If nothing needs correcting, return the input unchanged.
- Reply with the corrected text only. No preamble, quotes, or explanation.

Glossary:
EOF

system_prompt="$instructions
$(cat "$GLOSSARY_FILE")"

payload="$(
	jq -n \
		--arg model "$MODEL" \
		--arg system "$system_prompt" \
		--arg user "$text" \
		--argjson max_tokens "$max_tokens" \
		'{model: $model, temperature: 0, stream: false, max_tokens: $max_tokens,
		  messages: [{role: "system", content: $system}, {role: "user", content: $user}]}'
)" || fallback

response="$(curl -sS --max-time "$TIMEOUT_SECS" \
	-H 'Content-Type: application/json' \
	-d "$payload" "$ENDPOINT" 2>/dev/null)" || fallback

corrected="$(jq -r '.choices[0].message.content // empty' <<<"$response" 2>/dev/null)" || fallback
[[ -n "${corrected//[[:space:]]/}" ]] || fallback

# A correction pass only rewrites terms, so length should barely move. A large
# swing means the model editorialised or refused - keep the transcription.
if (( ${#corrected} > (${#text} * 3 / 2) + 40 || ${#corrected} * 2 < ${#text} )); then
	fallback
fi

printf '%s' "$corrected"
