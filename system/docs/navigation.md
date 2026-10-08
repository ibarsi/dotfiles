# FZF Workflow

`fzf` is already installed via Brewfile; this repo includes practical shell functions in `system/.functions` tailored for your setup (`bat`, `rg`, `zed`, git-heavy workflow).

**Included helpers:**

- `ff` → fuzzy-find file and open in Zed (fallback: `$EDITOR`)
- `fzs` → fuzzy-search file contents with `rg`+`fzf` and open the selected line in nvim (fallback: vim)
- `fcd` → fuzzy-find directory and `cd` into it
- `fbr` → fuzzy-switch git branches (supports remote tracking branches)
- `frg [query]` → fuzzy-select from `rg` results and jump to file+line
- `fkill` → fuzzy-select running process and kill it
- `fwt` → fuzzy-pick a git worktree from the current repo and `cd` into it
- `fwtr` → fuzzy-pick a sibling git worktree and remove it with `git wtr`

These are designed for daily terminal usage with your current tooling stack and should work across your repos out of the box.

Worktree creation and cleanup are documented in the [Git workflow](../../git/README.md#git-worktree-workflow).

These helpers are loaded by the [shared shell layer](../README.md); macOS packages come from `Brewfile`, while Linux packages are host-managed.

[System topic](../README.md)
