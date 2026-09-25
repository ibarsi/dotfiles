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

## Starship Prompt

`theme/starship.toml` is linked to `~/.config/starship.toml`. The first line
keeps the Mac icon in a Catppuccin powerline segment, then shows the current
directory with the repository root emphasized. The branch and compact Git
changes follow; a clean repository has no status marker. Commands taking at
least five seconds show their duration. The second line is reserved for the
command arrow, which turns red after a failed command. Username, language
versions, and an always-on clock are omitted. `bootstrap-omarchy.sh` links
the same file on Omarchy.

`aiup` upgrades Claude Code, Codex, and Grok Build through Homebrew, then
upgrades Herdr through mise.

The `herdr/` topic links `~/.config/herdr/config.toml`. Its complete `[keys]`
table matches Omen's Herdr config. Agent finished and needs-input sounds are
off (`[ui.sound] enabled = false`); reload a running session with
`herdr server reload-config`. Alt-Left/Right switches tabs, Alt-Up/Down
switches workspaces, and Ctrl-Alt-arrow focuses adjacent panes. The same
prefix, split, resize, rename, copy-mode, and close shortcuts also apply when
attaching through `herdr --remote omen`.
Ghostty sends modified-arrow sequences for Option-arrow instead of treating
Option-Left/Right as word navigation shortcuts. Use the left Option key, which
`ghostty/config` configures as Alt.

## macOS System Defaults

`macos/install.sh` applies `macos/.macos` (requires sudo): standard macOS
`defaults write` tuning for Finder, Dock, and system behavior.

## Keyboard Tuning

Bootstrap applies fast key repeat and a short initial repeat delay, disables
the press-and-hold accent-character popup, and maps Caps Lock to left Control
through Karabiner-Elements.

Karabiner-Elements is installed through the Brewfile. The `karabiner/` topic
links app-scoped Brave, Zen, Slack, Discord, and Linear rules and enables them
in the selected Karabiner profile. In all five apps, Control-Left/Right moves
by word, Control-Shift-Left/Right selects by word, and Control-X/C/V cuts,
copies, and pastes. These mappings emit the corresponding Option or Command
shortcuts; Control keeps its normal behavior in other apps.

Browser rules also cover new, close, and reopen tab; address bar; find; and
reload. Zen retains its native Control-Tab and Control-Shift-Tab navigation.
Slack maps Control-K to Quick Switcher and Control-G to message search.
Discord carries the same Control-T/F/R/K/G mappings as Slack. In these four
apps, Control-Delete emits Command-Delete.

Linear (`com.linear`) maps Control-T/W/F/K to its tab, find, and command-menu
shortcuts. Its Control-Delete emits Option-Delete to remove a word while
editing: Command-Delete can delete a selected issue in Linear. Linear keeps
its native Control-Tab and Control-R shortcuts.

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
