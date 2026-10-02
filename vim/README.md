# vim

macOS-installed Vim configuration; Linux keeps its host-managed editor configuration.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash vim/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Configuration

[.vimrc](.vimrc) is linked to `~/.vimrc`. It uses a comma leader, case-aware incremental search, four-space indentation and Catppuccin Mocha with a desert fallback. `,w` saves the current file. Backup and swap files are disabled.

The [theme topic](../theme/README.md#vim) installs the Catppuccin package under `~/.vim/pack/catppuccin/start/vim`.

## Verification

Check `readlink ~/.vimrc` and open Vim to confirm the theme. Inspect settings with `:set shiftwidth? tabstop? expandtab?`.

[Repository index](../README.md)
