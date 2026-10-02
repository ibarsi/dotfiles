# glow

Catppuccin terminal Markdown rendering. Configuration is installed on macOS; shared helpers also work on Linux when Glow is installed.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash glow/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Markdown Workflow

`glow` is installed from `Brewfile` and configured from `glow/glow.yml` with the Catppuccin Mocha Glamour style for paged terminal Markdown rendering.

**Markdown functions (`system/.functions`):**

- `md [file|url|repo]` → render Markdown with Glow; with no argument it opens `README.md` when present, otherwise starts Glow's current-directory browser
- `mdf` → fuzzy-pick a local Markdown file and preview it with Glow before rendering
- `mdrepo <owner/repo>` → render a GitHub/GitLab README; shorthand like `mdrepo charmbracelet/glow` expands to `github.com/charmbracelet/glow`

This gives you a fast terminal path for local READMEs, generated docs, changelogs, and remote project docs without leaving the shell.

## Managed files

[glow.yml](glow.yml) and [catppuccin-mocha.json](catppuccin-mocha.json) are linked under `~/.config/glow/`.

## Verification

Run `md glow/README.md` from the repository root; use `mdf` to browse the topic docs.

## Related documentation

[Shared shell layer](../system/README.md)

[Repository index](../README.md)
