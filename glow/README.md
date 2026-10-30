# glow

Catppuccin terminal Markdown rendering. Configuration is installed on macOS; shared helpers also work on Linux when Glow is installed.

## Installation

On macOS, [bootstrap](../macos/README.md#bootstrap) runs `bash glow/install.sh`. To refresh only this topic, run that command from the repository root. Omarchy manages this application natively; its bootstrap does not run this installer.

## Markdown Workflow

`glow` is installed by mise (global tools in [mise/config.toml](../mise/config.toml)) and configured from `glow/glow.yml` with the Catppuccin Mocha Glamour style for paged terminal Markdown rendering. The `glow` shell function wraps at the terminal width up to 120 columns; pass `-w` to override.

**Markdown functions (`system/.functions`):**

- `md [file|url|repo]` → render Markdown with Glow; with no argument it opens `README.md` when present, otherwise starts Glow's current-directory browser. A local file with ```` ```mermaid ```` blocks has each flowchart or sequence diagram drawn as ASCII by `mermaid-ascii` (also installed by mise) and opens in `less -S`: prose wraps to the terminal, wide diagrams scroll sideways with the arrow keys. Other diagram types keep their source
- `mdf` → fuzzy-pick a local Markdown file and preview it with Glow before rendering
- `mdrepo <owner/repo>` → render a GitHub/GitLab README; shorthand like `mdrepo charmbracelet/glow` expands to `github.com/charmbracelet/glow`

This gives you a fast terminal path for local READMEs, generated docs, changelogs, and remote project docs without leaving the shell.

## Managed files

[glow.yml](glow.yml) and [catppuccin-mocha.json](catppuccin-mocha.json) are linked under `~/.config/glow/`. `GLAMOUR_STYLE` (set in [theme/catppuccin.zsh](../theme/catppuccin.zsh)) points at the repo copy of the style instead, so the shell helpers, `gh` markdown rendering and the `gh` aliases get Catppuccin on Linux too, where this installer doesn't run.

## Verification

Run `md glow/README.md` from the repository root; use `mdf` to browse the topic docs.

## Related documentation

[Shared shell layer](../system/README.md)

[Repository index](../README.md)
