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

- `upall` upgrades Homebrew packages/casks when available and runs `mise up -C "$repo_root"`; global mise tools participate too. On macOS, after those steps succeed, it runs `sudo /usr/sbin/softwareupdate --install --all` to check for, download and install all applicable Apple updates (including macOS, Safari and Command Line Tools when offered). Earlier failures stop the sequence.
- Plain `upall` leaves any required restart to you; installation of some OS updates finishes only after restarting. After the Apple step succeeds, it prints a reminder: if a macOS update was downloaded, save your work, open **System Settings → General → Software Update**, and click **Update Now** or **Restart Now** (whichever is shown) to finish installation and restart manually. Use `upall --restart` to add `--restart` and let macOS restart automatically when needed. Save your work and connect power before running it. Linux skips the Apple update step.
- The Apple step may prompt for administrator authentication and, on Apple silicon, volume-owner authorization. Passwords are not stored; this is an interactive terminal workflow, not a guaranteed unattended updater. It installs what Software Update offers this Mac, rather than downloading a full macOS installer or selecting a particular major version. See `man softwareupdate` for the installed tool's options and [Apple's update process](https://support.apple.com/guide/deployment/dep02c211f3e/web) for authorization requirements.
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

## Verification

Run `bash -n system/.aliases system/.exports system/.functions system/.path` from the repository root, then start a new shell and inspect the helper you changed. Do not run update commands just to test loading.

[Repository index](../README.md)
