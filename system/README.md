# system

Shared Bash/Zsh environment, aliases and functions. macOS also installs the global EditorConfig and curl defaults.

## Installation

Both shell topics load this layer. On macOS, `bash system/install.sh` additionally links `~/.editorconfig` and `~/.curlrc`. Commands assume the repository root.

## Files and loading

| File | Purpose |
|---|---|
| [.path](.path) | Platform identity, available Homebrew paths, local binaries and language tool paths |
| [.exports](.exports) | Editor, locale, history, REPL and pager defaults |
| [.aliases](.aliases) | Portable aliases with platform guards |
| [.functions](.functions) | Shared workflow helpers |
| `.extra` (untracked) | Private or machine-specific overrides, loaded last |
| [.editorconfig](.editorconfig) / [.curlrc](.curlrc) | macOS-installed global defaults |

[Bash](../bash/README.md#startup-order) and [Zsh](../zsh/README.md#startup-order) source the shared files directly. Linux bootstrap uses this layer through Bash even though it does not run `system/install.sh`.

## Local environment conventions

Keep credentials and project-specific paths in the gitignored `system/.extra` or other untracked environment files. This checkout has no `.env.example`; inspect [AI diagnostics](../scripts/README.md#ai-diagnostics) for the variables it checks. `GLOSSARY_MARKDOWN_PATH` is documented under [voice-to-text](../voice-to-text/README.md).

## Maintenance

- `upall` upgrades Homebrew packages/casks when available and runs `mise up -C "$repo_root"`; global mise tools participate too.
- `dsync` fetches and previews dotfiles update status.
- `dotdocs` opens the [generated reference site](../docs/README.md#docs-site).

## Workflow documentation

- [Networking](docs/networking.md)
- [FZF navigation](docs/navigation.md)
- [Kubernetes](docs/kubernetes.md)
- [Hardware benchmarking](docs/benchmarking.md)
- [AI shell shortcuts](docs/ai-tools.md)
- [Git worktrees](../git/README.md#git-worktree-workflow)
- [Markdown rendering](../glow/README.md#markdown-workflow)
- [SSH compatibility](docs/networking.md#ssh-compatibility)
- [NAS queue monitoring](nas/README.md)

## Verification

Run `bash -n system/.aliases system/.exports system/.functions system/.path` from the repository root, then start a new shell and inspect the helper you changed. Do not run update commands just to test loading.

[Repository index](../README.md)
