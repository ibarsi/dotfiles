# voice-to-text

Automation for dictation tooling: a daily refresh of the dictation engine's
custom vocabulary, sourced from a project glossary markdown file.

Both platforms read the same `GLOSSARY_MARKDOWN_PATH` variable, set in the
gitignored `system/.extra` since the path is project-specific, and both
extract the same thing: the bolded Term column of a markdown glossary table
(`| **Term** | definition | ... |`), ignoring bold used for emphasis
elsewhere in the doc.

`install.sh` branches on `uname` and sets up whichever side applies.

## macOS - TypeWhisper

- `generate-typewhisper-dictionary.sh` writes a TypeWhisper
  settings-backup-shaped JSON to `~/Documents/obsidian/voice-to-text/`
  (Syncthing-shared with the Omen machine) and imports it into a running
  TypeWhisper instance via the `typewhisper` CLI if it's on `PATH`.
- `com.ibarsi.typewhisper-dictionary-sync.plist` runs that script every day
  at 7:00 AM via launchd. Change `StartCalendarInterval` to adjust the time.
- Re-running is safe: TypeWhisper dedupes dictionary entries by
  `(type, original)`, so nothing is duplicated or overwritten.

Logs: `~/Library/Logs/typewhisper-dictionary-sync.log`.

**Known gap:** the import is additive only — renaming or removing a term in
the glossary doesn't clean up the old entry in TypeWhisper. Harmless (it's
just extra vocabulary bias, not a wrong correction) but worth knowing.

## Omarchy - VoxType

VoxType runs the parakeet engine, which has no decoder-side vocabulary bias
(`whisper.initial_prompt` is whisper-only). So terms are applied *after*
transcription, by **`[text.replacements]`** in `~/.config/voxtype/config.toml`
— deterministic casing, hyphen and acronym fixes, at zero latency.

`generate-voxtype-vocabulary.sh` writes that block, and also dumps the plain
term list to `~/.config/voxtype/glossary.txt` for the (currently disabled) LLM
pass described below.

### The LLM pass — built, tested, currently OFF

`voxtype-glossary-correct.sh` is a `output.post_process.command` script that
pipes the transcription through a local `llama-server` with the glossary in
the system prompt, correcting terms with the sentence in view
(`"the account accrues interest"` → `"the Product accrues interest"`, while
`"my bank account"` is left alone).

It works, but **it is not wired up**, because no suitable local model is
installed. The only one available, `muse-glimmer`, is a custom 28B
architecture that reasons unconditionally — it emits `reasoning_content`
before `content` and cannot be told to stop (`enable_thinking: false`,
`reasoning_budget: 0` and a prefilled `<think></think>` were all ignored).
In practice that meant:

- 2891 generated tokens in reply to a 126-character sentence
- a 10s stall, then a timeout fallback to the raw transcription
- capping `max_tokens` fixed the stall but truncated the reply mid-thought,
  so the pass never corrected anything

To revisit, install a small **non-reasoning** instruct model — Qwen3-4B-
Instruct-2507 or Qwen2.5-7B-Instruct are good fits; note plain `Qwen3-4B` is
hybrid-reasoning and reproduces the bug. Then:

```bash
voxtype config set output.post_process.command \
  ~/dotfiles/voice-to-text/voxtype-glossary-correct.sh
export VOXTYPE_LLM_MODEL=<preset-name>   # in system/.extra
systemctl --user restart voxtype
```

Watch out for VRAM: `muse-glimmer` is configured with a 512k context and
leaves ~600 MiB free on a 32 GB card, so its `ctx-size` needs lowering first.

`voxtype config unset output.post_process.command` does **not** work — it
leaves an empty `[output.post_process]` table, which VoxType rejects as
`missing field 'command'`. Delete the whole two-line section instead.

`voxtype-vocabulary-sync.timer` runs it daily at 07:00 (`Persistent=true`, so
a run missed while the machine was off fires at next login). Adjust with
`OnCalendar`.

Logs: `journalctl --user -u voxtype-vocabulary-sync`.

### What gets a replacement entry

Replacements are case-insensitive substitutions with no sense of context, so
only fixes derivable from the term's own spelling are emitted — never a change
of word choice. The "Aliases to avoid" column is deliberately **not** mapped:
`"account" = "Product"` would rewrite every "account" you ever dictate.

| Term | Entry | Why |
| ---- | ----- | --- |
| `Ledger Transfer` | `"ledger transfer"` | multi-word |
| `Sub-Ledger` | `"sub ledger"` | hyphen, spoken as a space |
| `FedNow` | `"fed now"` | CamelCase compound |
| `ACH` | `"ach"` | acronym |
| `Card` | *(skipped)* | bare English word — would capitalise ordinary prose |
| `BIN` | *(skipped)* | acronym that's also an English word; see `DENYLIST` |

Hand-written entries in `[text.replacements]` outside the generated markers
are preserved, and win over a generated entry with the same key — a duplicate
key would be a TOML parse error and would take the whole config down.

Unlike the macOS side, this regenerates rather than appends, so **removing a
term from the glossary removes it here too.**

### Overrides

| Variable | Default |
| -------- | ------- |
| `GLOSSARY_MARKDOWN_PATH` | *(required, from `system/.extra`)* |
| `VOXTYPE_CONFIG` | `~/.config/voxtype/config.toml` |
| `VOXTYPE_GLOSSARY` | `~/.config/voxtype/glossary.txt` |
| `VOXTYPE_VOCABULARY_DENYLIST` | `bin pan swift` |
| `VOXTYPE_LLM_ENDPOINT` | `http://127.0.0.1:1234/v1/chat/completions` |
| `VOXTYPE_LLM_MODEL` | `muse-glimmer` |
| `VOXTYPE_LLM_TIMEOUT_SECS` | `10` |

The `VOXTYPE_LLM_*` variables only matter if the LLM pass is re-enabled. It
fails open: no glossary, no `llama-server`, a timeout, a refusal, or a
suspiciously long reply all fall back to the raw transcription. The
replacements table still applies in that case, since it runs inside VoxType.

### Tests

```bash
bash voice-to-text/test-generate-voxtype-vocabulary.sh
```

Runs the generator against a throwaway glossary and config, covering the TOML
splice, the term filter and idempotency. Does not touch the real config or
restart the daemon.
