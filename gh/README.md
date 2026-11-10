# gh

GitHub CLI aliases and extensions managed on both platforms without replacing the rest of the CLI configuration.

## Installation

Both [macOS](../macos/README.md#bootstrap) and [Omarchy](../omarchy/README.md#bootstrap) bootstrap run `bash gh/install.sh`. Run it from the repository root to refresh this topic independently.

## Extensions and updates

[extensions.txt](extensions.txt) is the shared extension manifest, with one `owner/repository` per line. It currently tracks [github/gh-stack](https://github.com/github/gh-stack). Add new extensions here so another host installs them too. Blank lines and lines starting with `#` are ignored.

Bootstrap installs missing extensions at their latest release and keeps existing installations. It skips GitHub CLI setup when `gh` is absent; install and authenticate the CLI with `gh auth login`, then rerun the installer. gh-stack requires GitHub CLI 2.0+ and Git 2.36+.

[`upall`](../system/README.md#maintenance) installs missing manifest entries, then runs `gh extension upgrade --all` on both platforms. This updates every installed extension, including local additions outside the manifest, subject to GitHub CLI's pinning and local-extension rules. Add local additions to the manifest to reproduce them on other hosts. Upgrade failures stop the remaining update steps. To update extensions independently:

```bash
bash gh/install-extensions.sh
gh extension upgrade --all
```

## Stacked pull requests

Both Git installers link [stack.gitconfig](../git/stack.gitconfig), enabling `rerere` to remember conflict resolutions and setting `remote.pushDefault = origin`. These are global Git defaults; in repositories using another push remote, override with `git config remote.pushDefault <remote>`.

Use the extension directly; stack membership and branches are created per repository when you start a stack:

```bash
gh stack init feature-auth
# Commit the first layer, then add the next.
gh stack add feature-api
# Commit the second layer, then open the pull requests.
gh stack submit
gh stack view
```

See the [upstream guide](https://github.com/github/gh-stack#quick-start) for rebasing and syncing stacks.

## GitHub CLI Aliases

`gh/aliases.yml` holds GitHub CLI aliases; bootstrap imports them on both platforms with `gh/install.sh` (`gh alias import --clobber`). Edit the file and re-run the installer — changes made with `gh alias set` are overwritten on the next import.

- `gh ci` lists the current branch's PR checks, colour-coded and sorted failures first. Pass a PR number, URL, or branch to inspect another PR: `gh ci 123`. Add `--failed` to show only failed checks.
- `gh ci rerun` reruns the failed jobs of the current branch's PR. It finds the `pull_request` workflow runs on the PR's head commit and reruns each with `gh run rerun --failed`, so passing jobs keep their results and push runs and older pushes are left alone. Pass a PR number or branch for another PR: `gh ci rerun 123`.
- `gh reviews` lists the current branch's PR reviews from others (your own are hidden) in order — review ID (the number in its `#pullrequestreview-<id>` link, usable with the REST API), timestamp in Eastern time, author, state — and how many commits were committed after each one. It counts by commit date, so rebases and amends count as new work (a rebase onto `main` resets every count), and skips `Merge …` commits, so merging `main` in doesn't. Pass a PR number or branch for another PR: `gh reviews 123`. Add `--show <id>` to render one review — its summary and every inline comment with file, line and the last six lines of its diff — through glow: `gh reviews 123 --show 5431368198`. Glow renders with `$GLAMOUR_STYLE` (Catppuccin Mocha), passed explicitly so colours survive piping: `gh reviews --show <id> | bat` (or `| less -R`) pages a long review with that theme intact.
- `gh url` prints the current branch's PR URL. Pass a PR number or branch for another PR: `gh url 123`.
- `gh bd` shows the current branch's PR branch-deploy status: the bot's sticky comment, image list and links stripped. Pass a PR number or branch for another PR: `gh bd 123`. `gh bd [pr] --stage <stage>` — `mesh`, `databases`, `infra`, `platform` or `ingress` — drills into that stage's ArgoCD app: last sync result, non-healthy resources, and log tails of unhealthy workloads, with headings in bold and ArgoCD statuses colour-coded. Both views keep their colour when piped, so `| bat` or `| less -R` pages them. Needs `argocd login <server> --sso --grpc-web` against the ArgoCD server the bot links to.
- `gh mq` lists the `main` merge queue with each entry's position, state, PR number, author, and title. Add `--show <pr>` (a leading `#` is accepted, so the PR number column pastes straight in) to list that queue entry's checks in the same colour-coded, failures-first format as `gh ci`: `gh mq --show 3915`. Queue checks run on the temporary merge-group commit rather than the PR head, so `gh ci` can't see them; this reads them from the entry's merge-group commit, paginated because a queue run can exceed 100 checks. Errors if the PR is not in the queue. Add `--failed`, `--pending` or `--passed` to filter the checks, as with `gh ci`.

## Verification

Run `gh alias list` and confirm `bd`, `ci`, `reviews`, `url` and `mq`. Run `gh extension list` and `gh stack --version` to inspect the installation. `mise run bootstrap-verify` checks every extension in the manifest and the shared Git configuration link. Inspect the effective defaults with `git config --get rerere.enabled` and `git config --get remote.pushDefault`.

## Related documentation

[Git worktrees and PR flow](../git/README.md#git-worktree-workflow)

[Repository index](../README.md)
