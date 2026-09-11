# macOS Guide

Setup and behavior specific to macOS. Content that applies to both macOS and
Omarchy lives in [workflows.md](workflows.md) instead; see the
[Omarchy guide](omarchy.md) for the Linux side.

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
   [README](../../README.md) for exactly which topics that includes.
4. Sets Zsh as the default shell if it isn't already (`chsh -s $(command -v zsh)`).

Re-run it any time; every step is idempotent.

## macOS System Defaults

`macos/install.sh` applies `macos/.macos` (requires sudo): standard macOS
`defaults write` tuning for Finder, Dock, and system behavior.

## Keyboard Tuning

Bootstrap applies fast key repeat and a short initial repeat delay, disables
the press-and-hold accent-character popup, and installs a launchd job
(`launchagents/com.ibarsi.capslock-control.plist`, linked by
`launchagents/install.sh`) that remaps Caps Lock to Control and reloads it at
login.

## Obsidian

[Obsidian](https://obsidian.md) is installed from `Brewfile`, but this repo
does not automate its CLI setup or theme activation.

If you want Obsidian to match the Catppuccin theme used elsewhere, enable
Obsidian's CLI yourself and then run:

```bash
obsidian theme:install name=Catppuccin
obsidian theme:set name=Catppuccin
```

## Directories

- `macos/` — macOS system defaults and UI/UX settings (`macos/.macos`).
- `launchagents/` — launchd jobs, symlinked to `~/Library/LaunchAgents/`.
- `gitmoji/` — on macOS, linked to `~/Library/Preferences/gitmoji-nodejs/config.json`.
- `voice-to-text/` — on macOS, a daily launchd job regenerates TypeWhisper's
  dictionary from a project glossary file. See `voice-to-text/README.md` for
  the full TypeWhisper/VoxType setup on both platforms.
