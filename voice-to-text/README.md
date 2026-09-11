# voice-to-text

Automation for dictation tooling. Currently: a daily TypeWhisper dictionary
refresh sourced from a project glossary markdown file.

- `generate-typewhisper-dictionary.sh` extracts the Term column from a
  markdown glossary table (`GLOSSARY_MARKDOWN_PATH`, set in the gitignored
  `system/.extra` since the path is project-specific), writes a TypeWhisper
  settings-backup-shaped JSON to `~/Documents/obsidian/voice-to-text/`
  (Syncthing-shared with the Omen machine), and imports it into a running
  TypeWhisper instance via the `typewhisper` CLI if it's on `PATH`.
- `com.ibarsi.typewhisper-dictionary-sync.plist` runs that script every day
  at 7:00 AM via launchd. Change `StartCalendarInterval` to adjust the time.
- Re-running the script is safe: TypeWhisper dedupes dictionary entries by
  `(type, original)`, so nothing is duplicated or overwritten.

Logs: `~/Library/Logs/typewhisper-dictionary-sync.log`.

**Known gap:** the import is additive only — renaming or removing a term in
the glossary doesn't clean up the old entry in TypeWhisper. Harmless (it's
just extra vocabulary bias, not a wrong correction) but worth knowing.
