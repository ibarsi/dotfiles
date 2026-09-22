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

The `herdr/` topic links `~/.config/herdr/config.toml`. Its keybindings match
the Herdr config on Omen, including Ctrl-Space as the prefix, pane controls,
Alt-arrow tab and workspace navigation, and the matching resize shortcuts.

## macOS System Defaults

`macos/install.sh` applies `macos/.macos` (requires sudo): standard macOS
`defaults write` tuning for Finder, Dock, and system behavior.

## Keyboard Tuning

Bootstrap applies fast key repeat and a short initial repeat delay, disables
the press-and-hold accent-character popup, and maps Caps Lock to left Control
through Karabiner-Elements.

Karabiner-Elements is installed through the Brewfile. The `karabiner/` topic
links app-scoped Brave, Zen, Slack, and Discord rules and enables them in the selected
Karabiner profile: physical Control matches application shortcuts while Command
remains the macOS modifier. Browser rules cover new, close, and reopen tab;
address bar; find; and reload. Zen keeps its native Control-Tab and
Control-Shift-Tab tab navigation. In all four apps, Control-Left/Right moves
by word and Control-Shift-Left/Right selects by word, matching the native
Option-Arrow behavior; Control-X, Control-C, and Control-V cut, copy, and paste.
Control-Delete invokes its native Command-Delete equivalent. Slack maps Control-K to
Quick Switcher, Control-G to message search, and Control-T, Control-F, and
Control-R to their native Command equivalents. Discord maps those same five
Control chords to Command. The rules apply only to Brave
(`com.brave.Browser`), Zen (`app.zen-browser.zen`), and Slack
(`com.tinyspeck.slackmacgap`), and Discord (`com.hnc.Discord`), so Control
keeps its normal behavior everywhere else.

Karabiner must have its Input Monitoring permission approved once in
**System Settings → Privacy & Security → Input Monitoring**. Re-run
`./bootstrap.sh` after a fresh Karabiner install if its profile did not yet
exist during the first bootstrap.

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
- `karabiner/` — app-scoped keyboard mappings, linked to Karabiner's Complex
  Modifications assets directory.
- `gitmoji/` — on macOS, linked to `~/Library/Preferences/gitmoji-nodejs/config.json`.
- `voice-to-text/` — on macOS, a daily launchd job regenerates TypeWhisper's
  dictionary from a project glossary file. See `voice-to-text/README.md` for
  the full TypeWhisper/VoxType setup on both platforms.
