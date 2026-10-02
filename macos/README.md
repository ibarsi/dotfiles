# macos

macOS bootstrap and system defaults. Individual applications own their documentation in their topic folders.

## Bootstrap

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap.sh
```

`bootstrap.sh`:

1. Installs Homebrew if it isn't already present.
2. Runs `brew bundle --file Brewfile` to sync every tap, formula, and cask.
3. Runs **every** topic's `install.sh` (it globs `*/install.sh`), linking each
   topic's config into place. See the platform matrix in the top-level
   [README](../README.md) for exactly which topics that includes.

4. Sets Zsh as the default shell if it isn't already (`chsh -s $(command -v zsh)`).

Re-run it any time; every step is idempotent.

## macOS System Defaults

`macos/install.sh` applies `macos/.macos` (requires sudo): standard macOS
`defaults write` tuning for Finder, Dock, and system behavior.

## Topic setup

- [Zsh](../zsh/README.md), [shared shell](../system/README.md), and [mise](../mise/README.md)
- [Keyboard remapping](../karabiner/README.md)
- [Starship and app themes](../theme/README.md)
- [Ghostty](../ghostty/README.md), [Herdr](../herdr/README.md), and [tmux](../tmux/README.md)
- [Dictation vocabulary sync](../voice-to-text/README.md#macos---typewhisper)
- [Microphone processing research](docs/research/2026-09-14-oss-macos-mic-processing.md)

Obsidian comes from `Brewfile`; manual theme activation is documented in [theme](../theme/README.md#obsidian).

## Verification

After bootstrap, run `mise run bootstrap-verify` and `mise run ai-doctor` from the repository root. Applying `macos/.macos` requires sudo and changes system preferences; keyboard mappings require Karabiner permission.

[Repository index](../README.md)
