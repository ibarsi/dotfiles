# bash

An additive interactive shell fragment for macOS and Omarchy; it preserves the existing `~/.bashrc`.

## Installation

Both [macOS](../macos/README.md#bootstrap) and [Omarchy](../omarchy/README.md#bootstrap) bootstrap run `bash bash/install.sh`. Run it from the repository root to refresh this topic independently.

The installer links `bashrc` under `~/.config/ibarsi-dotfiles/` and appends one marked source block to `~/.bashrc` when absent.

## Startup order

[bashrc](bashrc) returns immediately in non-interactive shells. It uses `DOTFILES` (default `~/dotfiles`) to load:

1. [Theme exports](../theme/catppuccin.zsh).
2. Shared `.path`, `.exports`, `.aliases`, `.functions`, then optional `.extra` from [system/](../system/README.md).
3. zoxide, Starship and mise activation when their binaries exist.

For a checkout somewhere else, set `DOTFILES` before this fragment is sourced.

## Verification

Check `readlink ~/.config/ibarsi-dotfiles/bashrc`; start a new interactive Bash shell and confirm shared aliases are available.

## Related documentation

[Omarchy bootstrap](../omarchy/README.md) · [Shared helpers](../system/README.md)

[Repository index](../README.md)
