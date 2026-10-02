# codex

macOS-managed Codex config and hooks. On Omarchy, the CLI configuration is host-managed.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash codex/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Configuration

[Codex CLI](https://developers.openai.com/codex/cli/) is configured for a secure, fast terminal-first AI coding flow.

| File | Destination | Purpose |
|------|-------------|---------|
| `codex/config.toml` | `~/.codex/config.toml` | Default model, approvals/sandbox, search mode, feature toggles |
| `codex/mcp-grafana-nas` | Invoked by Codex | Read-only Grafana MCP launcher; loads its token from macOS Keychain |

**Install Codex CLI:**

```bash
brew install --cask codex
npm i -g @openai/codex  # cross-platform alternative
```

**Key defaults in this repo:**

- `model = "gpt-5.6-terra"`
- `approval_policy = "on-request"`
- `sandbox_mode = "workspace-write"`
- `web_search = "cached"` (safer default than live web)
- Native TUI footer shows model/reasoning, branch, current directory, context usage, and five-hour/weekly limits.

**Enabled quality-of-life features:**

- `shell_snapshot` (faster repeated command runs)
- `unified_exec` (improved command execution path)
- `undo` (safer edit iteration)
- `voice_transcription` (hold Space to speak in supported Codex CLI builds)

**Grafana MCP:**

- Connects to the NAS Grafana instance at `http://192.168.0.39:3340` in read-only mode.
- Create a Grafana Viewer service-account token and store it in the login keychain under service name `codex-grafana-mcp` and your macOS username before starting Codex.

**TUI footer:**

- Use `/statusline` in Codex to interactively reorder or trim footer items.
- The repo default shows model/reasoning, git branch, current directory, context usage, and the five-hour/weekly usage meters.

## Shell shortcuts

- `cx` → `codex`
- `cxe` → `codex exec`
- `cxr` → `codex resume --last`
- `cxreview` → start Codex with `/review`
- `cxup` → upgrade Codex CLI (uses Homebrew cask when Codex was installed with brew; otherwise npm)

The checked-in config uses `on-request` approvals and `workspace-write` sandboxing. Explicit bypass launch options can override these defaults; see [AI shell shortcuts](../system/docs/ai-tools.md).

## Hooks and machine-local integration

The installer also links [hooks.json](hooks.json) and [hooks/](hooks) under `~/.codex/`. The PreToolUse hook runs `require-semble-for-search.py` to enforce Semble-first discovery.

The config contains a machine-specific notification command and trusted project paths. Review these for a different host. The [Grafana launcher](mcp-grafana-nas) reads a Keychain token; do not put token values in this repo.

## Verification

Check the config and hook symlinks under `~/.codex/`, then run `mise run ai-doctor` from the repository root.

[Repository index](../README.md)
