# gh

GitHub CLI aliases imported on both platforms without replacing the rest of the CLI configuration.

## Installation

Both [macOS](../macos/README.md#bootstrap) and [Omarchy](../omarchy/README.md#bootstrap) bootstrap run `bash gh/install.sh`. Run it from the repository root to refresh this topic independently.

## GitHub CLI Aliases

`gh/aliases.yml` holds GitHub CLI aliases; bootstrap imports them on both platforms with `gh/install.sh` (`gh alias import --clobber`). Edit the file and re-run the installer — changes made with `gh alias set` are overwritten on the next import.

- `gh ci` lists the current branch's PR checks, colour-coded and sorted failures first. Pass a PR number, URL, or branch to inspect another PR: `gh ci 123`. Add `--failed` to show only failed checks.
- `gh url` prints the current branch's PR URL. Pass a PR number or branch for another PR: `gh url 123`.
- `gh mq` lists the `main` merge queue with each entry's position, state, PR number, author, and title.

## Verification

Run `gh alias list` and confirm `ci`, `url` and `mq`. The installer skips when `gh` is absent; rerun it after installing the CLI.

## Related documentation

[Git worktrees and PR flow](../git/README.md#git-worktree-workflow)

[Repository index](../README.md)
