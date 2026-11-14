# git

Full Git configuration on macOS; additive aliases, stacked PR defaults and an optional delta pager include on Omarchy.

## Installation

The macOS bootstrap runs `bash git/install.sh`; the Omarchy bootstrap runs `bash git/install-aliases.sh`. Commands here assume the repository root.

## Configuration

The macOS installer links `.gitconfig`, `.gitignore` and `.gitattributes` into the home directory and the aliases/delta/stack fragments under `~/.config/ibarsi-dotfiles/`.

On Linux, `bash git/install-aliases.sh` adds global includes without replacing the host Git config. It includes delta only when the `delta` binary is available. Both platforms include [stack.gitconfig](stack.gitconfig) for the [gh-stack defaults and workflow](../gh/README.md#stacked-pull-requests).

## Signing and host-specific settings

The full [.gitconfig](.gitconfig) enables SSH commit signing with `~/.ssh/id_ed25519.pub`, sets the author identity, and uses the Homebrew GitHub credential helper. Review the identity, key and helper paths before using the full config on another machine. Linux’s additive installer leaves the host identity and signing policy alone.

## Git Worktree Workflow

The shell and git config now include a minimal worktree layer aimed at parallel agent sessions without adding much ceremony.

**Git aliases:**

- `git rh` → hard reset the current branch to `origin/<current-branch>`
- `git wt` → raw `git worktree`
- `git wtl` → list worktrees
- `git wtp` → prune stale worktree metadata
- `git wtr <path>` → remove a worktree
- `git wtx` → porcelain worktree listing for scripting
- `git bparent [base-ref]` → print the parent commit of the oldest commit on the current branch not found in the given base
- `git onto [base-ref]` → rebase the current branch onto `origin/<base>` using `git bparent` as the boundary

**Shell helpers:**

- `wtpath [name]` → print the conventional path for the current repo under `~/worktrees/<repo>/<name>`
- `wtnew <branch> [base]` → create a new worktree at that path, print the exact branch/base/path used, and `cd` into it
- `fwt` → fuzzy-pick any worktree from the current repo and `cd` into it
- `wtsesh` → attach/create a tmux session named from the current repo and branch
- `fwtr` → fuzzy-search removable worktrees from the current repo and pass the selected path to `git wtr`
- `wtclean [-n|--dry-run]` → remove every worktree of the current repo that is neither on a branch with one of your open PRs (`gh`) nor the folder (or a parent of the folder) of a live hc terminal (`hc ls`, every connected machine). `--dry-run` only lists what would go. It flags dirty worktrees (git refuses them; there is no `--force`) and gitignored `docs/` folders that would be lost, asks `[y/N]` before removing, and keeps the branches. Aborts without removing anything if `gh` or `hc` cannot be queried. Needs `git`, `gh`, `hc` and `jq`; works in zsh (macOS) and bash (Omarchy)

**Recommended flow:**

- From any repo root, run `wtnew feature/my-task`
- Use `fwt` any time you want to jump between existing worktrees for that repo
- Start or attach your worktree tmux session with `wtsesh`
- Run your agent inside that session so each branch/worktree has isolated terminal context
- If `wtnew` fails, it now prints whether the problem is missing `git`, missing repo context, or a rejected `git worktree add`
- When the repo contains `.mise.toml` or `mise.toml`, `wtnew` also runs `mise trust` inside the new worktree

**Three-feature routing example:**

- `wtnew feat/auth-refresh`
- `wtnew feat/billing-export`
- `wtnew feat/mobile-nav`
- Run `wtsesh` inside each worktree and keep one Claude session per worktree
- Treat each worktree as the local checkout for exactly one branch and PR

**When feature work is done in a worktree:**

- Review and commit from inside that worktree:

```bash
git status
git add -A
git commit -m "Implement feature"
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
pr
```

- The branch already exists at that point; the worktree is just the local directory attached to it
- `pr` opens the existing PR or creates one for the current branch

**After the PR is merged:**

- Leave the merged worktree and return to the main repo checkout
- Remove the worktree, then delete the local branch

```bash
git wtl
git wtr ~/worktrees/<repo>/feat/auth-refresh
git branch -d feat/auth-refresh
git wtr ~/worktrees/<repo>/feat/billing-export
git branch -d feat/billing-export
git wtr ~/worktrees/<repo>/feat/mobile-nav
git branch -d feat/mobile-nav
git wtp
```

- If you also want to delete merged remote branches manually:

```bash
git push origin --delete feat/auth-refresh
git push origin --delete feat/billing-export
git push origin --delete feat/mobile-nav
```

Use `git wtl` before cleanup so you can verify the exact worktree paths and avoid removing the wrong checkout.
If you prefer an interactive cleanup flow, run `fwtr` from any checkout in the repo to fuzzy-pick a sibling worktree and remove it directly.

## Verification

Inspect `git config --get-regexp "^(alias|include|core.pager)"` and `git wtl` from a repository.

## Related documentation

[GitHub aliases](../gh/README.md) · [Shell navigation](../system/docs/navigation.md) · [tmux sessions](../tmux/README.md)

[Repository index](../README.md)
