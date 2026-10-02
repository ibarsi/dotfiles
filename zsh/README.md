# zsh

Modular Zsh configuration installed on macOS; the Omarchy bootstrap uses the additive Bash topic.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash zsh/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

The installer links `.zshrc` to `~/.zshrc`; bootstrap also sets Zsh as the login shell.

## Startup order

[.zshrc](.zshrc) loads topic `.path` files, topic `.zsh` modules, then the shared system exports/aliases/functions and optional local `.extra`. It initializes zoxide and Starship, loads [plugins.zsh](plugins.zsh), and activates mise near the end. `DOTFILES` defaults to `~/dotfiles`; set it before startup for another checkout location.

## Plugins and shell defaults

Homebrew supplies autosuggestions, syntax highlighting and FZF completion/keybindings. Autosuggestions use history then completion; Shift-Tab accepts and Tab expands/completes. History is shared, duplicate/space-prefixed entries are omitted, completion is cached via `.zcompdump`, matching is case-insensitive, and Codex completion loads when available. The interactive completion menu includes clearer descriptions; extended history records command timing.

## Updates

`aiup` upgrades Claude Code, Codex and Grok Build through Homebrew, then Herdr through mise. Shared `upall` and `dsync` are documented under [system](../system/README.md#maintenance).

## Omen remote sessions


- `omux` → attach/create an Omen tmux session named from the current Mac repo and branch
- `omux <session>` → attach/create a custom named Omen tmux session
- `omux ls` → list Omen tmux sessions
- `omux kill <session>` → confirm, then kill one Omen tmux session

`omux` connects as `ibarsi@omen`. When creating a new session from a Mac worktree under `~/worktrees/`, it starts in the matching Omen worktree if that directory exists; otherwise it starts in Omen's login directory. Reattached sessions retain their existing working directory. It is intentionally defined only in `zsh/aliases.zsh`, so it does not change the shared shell layer or Omarchy bootstrap.

## Verification

Check `readlink ~/.zshrc`. Run `zsh -n zsh/.zshrc zsh/aliases.zsh zsh/plugins.zsh` from the repository root, then restart your shell.

## Related documentation

[tmux](../tmux/README.md) · [Shared helpers](../system/README.md) · [mise](../mise/README.md)

[Repository index](../README.md)
