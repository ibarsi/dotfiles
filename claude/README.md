# claude

macOS-managed Claude Code preferences and custom theme. Omarchy manages the CLI configuration natively.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash claude/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Configuration

[Claude Code](https://code.claude.com/docs/en/setup) is configured for a reliable daily-driver workflow that can coexist with Codex.

| File | Destination | Purpose |
|------|-------------|---------|
| `claude/settings.json` | `~/.claude/settings.json` | Update channel and attribution preferences |

**Install Claude Code CLI:**

```bash
brew install --cask claude-code
# or native installer (recommended by Anthropic):
curl -fsSL https://claude.ai/install.sh | bash
```

**Key defaults in this repo:**

- `$schema` enabled for editor validation/autocomplete
- `autoUpdatesChannel = "stable"` to reduce surprise regressions
- `cleanupPeriodDays = 30` to avoid keeping transcripts indefinitely
- `respectGitignore = true` to keep ignored/private files out of file suggestions
- `model = "opus"`, `effortLevel = "high"`, and `permissions.defaultMode = "auto"`
- `permissions.ask` prompts on high-risk network/sensitive reads (`git push`, `curl`, `wget`, `.env`, `./secrets/**`)
- `permissions.deny` blocks obviously dangerous shell patterns (`sudo *`, `rm -rf /`, `rm -rf ~/`)
- `attribution.commit` / `attribution.pr` are blanked to avoid automatic AI bylines in commits/PRs

## Shell shortcuts

- `cc` → `claude`
- `cce` → `claude -p`
- `ccr` → `claude --continue`
- `ccreview` → start Claude with `/review`
- `ccyolo` → `claude --dangerously-skip-permissions`
- `ccdoctor` → `claude doctor`
- `ccupdate` → upgrade Claude Code (brew cask if installed via Homebrew, otherwise `claude update`)

> Workflow note: Codex and Claude configs are independent (`~/.codex/` and `~/.claude/`), so switching between them is frictionless.

## Themes and local dependencies

The installer also links [themes/](themes) into `~/.claude/themes`; the settings select `custom:catppuccin-mocha`. The status-line command refers to a machine-local script under `/Users/igorbarsi/.claude/`, which is not provisioned by this topic. Review that path on another host. Enabled plugins and marketplace declarations are in [settings.json](settings.json).

## Verification

Check `readlink ~/.claude/settings.json` and `readlink ~/.claude/themes`, then run `mise run ai-doctor` from the repository root.

[Repository index](../README.md)
