# gitmoji

Shared gitmoji-cli preferences on macOS and Linux.

## Installation

Both [macOS](../macos/README.md#bootstrap) and [Omarchy](../omarchy/README.md#bootstrap) bootstrap run `bash gitmoji/install.sh`. Run it from the repository root to refresh this topic independently.

## Configuration

[config.json](config.json) uses emoji output, prompts for scope, capitalizes titles, and leaves automatic staging off. It is linked to:

- macOS: `~/Library/Preferences/gitmoji-nodejs/config.json`
- Linux: `${XDG_CONFIG_HOME:-$HOME/.config}/gitmoji-nodejs/config.json`

The CLI itself is listed in the [global mise config](../mise/config.toml).

## Verification

Inspect the appropriate symlink with `readlink` and confirm the preferences during your next normal `gitmoji` commit.

## Related documentation

[Git configuration](../git/README.md) · [mise](../mise/README.md)

[Repository index](../README.md)
