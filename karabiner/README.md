# karabiner

macOS-only keyboard remapping, installed from the Brewfile and configured by this topic.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash karabiner/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

The installer links the five [complex modification assets](complex_modifications) and updates only the selected profile in `~/.config/karabiner/karabiner.json`.

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

## Verification

Confirm Input Monitoring permission, check the selected profile in Karabiner, and try the relevant shortcut in the target app. Changes should remain app-scoped.

## Related documentation

[macOS defaults](../macos/README.md#macos-system-defaults)

[Repository index](../README.md)
