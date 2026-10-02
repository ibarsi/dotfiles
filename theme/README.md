# Catppuccin Theme Integration

Soothing pastel theme for your entire development environment.

## Flavors

- **Mocha** (default): Dark, cozy, color-rich
- **Macchiato**: Medium contrast, gentle
- **Frappé**: Subdued, muted aesthetic
- **Latte**: Light theme (solarized-style)

To switch flavors, see [Switching Flavors](#switching-flavors).

## Colour Rule: Reference the Palette, Never Hardcode Hex

`palette.sh` is the single source of truth for theme colours. Any config that
can read variables must use the `CATPPUCCIN_*` names instead of repeating hex
values, so a theme change is one edit:

- **Shell env** (`catppuccin.zsh`): `$CATPPUCCIN_RED` directly, or
  `$(_ctp_rgb "$CATPPUCCIN_RED")` where a tool wants `r;g;b` truecolor (eza, less).

- **tmux** (`tmux/theme.conf`): `$CATPPUCCIN_RED` inside double quotes. Colour
  settings must stay in `theme.conf`, not `.tmux.conf`: tmux parses a whole file
  before running it, so the variables only expand in a file sourced after
  `palette.sh`.

- **Shell functions and scripts**: read the exported `CATPPUCCIN_*` variables.

Keep `palette.sh` as plain `NAME="#hex"` lines (no `export`, no logic) so both
shells and tmux can parse it.

Still hardcoded, because these formats can't read environment variables:
`starship.toml` (own palette table), `git/delta.gitconfig`, `herdr/config.toml`,
and the vendored upstream theme files (`claude/themes/`, `glow/`,
`zsh/catppuccin_mocha-zsh-syntax-highlighting.theme`). Don't add new ones.

## Installation

Run the install script:

```bash
./theme/install.sh
```

Or apply manually to each tool:

### Vim

Install the colorscheme:

```bash
git clone https://github.com/catppuccin/vim.git ~/.vim/pack/catppuccin/start/vim
```

### Bat (syntax highlighting)

```bash
mkdir -p "$(bat --config-dir)/themes"
wget -P "$(bat --config-dir)/themes" https://github.com/catppuccin/bat/raw/main/themes/Catppuccin%20Mocha.tmTheme
bat cache --build
```

### Starship

`starship.toml` is linked to `~/.config/starship.toml` by `install-starship.sh` on both platforms. Zsh and Bash initialize Starship when it is installed.

The prompt has an OS icon and directory in Catppuccin segments, followed by branch and compact Git status. Clean repos have no status marker. Commands taking at least five seconds show duration; the second-line arrow turns red after failure. Username, language versions and a persistent clock are omitted.

macOS uses the Mac icon. The checked-in `Linux` symbol is the Arch icon for all Linux hosts, including Omarchy. The prompt uses a fixed Mocha palette rather than following Omarchy theme changes.

### k9s

On macOS, the theme installer downloads the Catppuccin Mocha k9s skin into:

```text
~/Library/Application Support/k9s/skins/catppuccin-mocha.yaml
```

The k9s app config itself is managed by `k9s/config.yaml` and symlinked by `k9s/install.sh`, so defaults such as log wrapping stay reproducible.

### Obsidian

This repo does not automate Obsidian theme setup. If you want Obsidian to match, enable the Obsidian CLI yourself and run:

```bash
obsidian theme:install name=Catppuccin
obsidian theme:set name=Catppuccin
```

## Tools Integrated

- ✅ Starship prompt
- ✅ Ghostty terminal theme
- ✅ Obsidian manual theme commands documented
- ✅ Vim colorscheme
- ✅ Bat syntax highlighting
- ✅ FZF fuzzy finder
- ✅ eza directory listings
- ✅ Less/man page colors

## File Structure

```
theme/
├── palette.sh            # Colour source of truth (shells + tmux)
├── catppuccin.zsh        # Exports palette; FZF/bat/eza/less config built from it
├── starship.toml         # Prompt theme configuration
├── install-starship.sh   # Shared prompt symlink
├── install.sh            # macOS theme setup
├── vim-colors.vim        # Vim colorscheme config
└── README.md             # This file
```

## Switching Flavors

To use a different flavor (e.g., Macchiato):

1. Replace the hex values in `palette.sh` (shell tools and tmux follow automatically)
2. Update the still-hardcoded configs listed under the colour rule above
3. For Ghostty: Already included (no extra setup)

## Credits

[Catppuccin](https://catppuccin.com) - Soothing pastel theme for the high-spirited!

## Platforms and verification

macOS bootstrap runs `theme/install.sh`, installing Starship, bat/Vim themes and the k9s skin. Omarchy bootstrap runs only `theme/install-starship.sh`; its Bash fragment still sources the shared shell palette. Other app themes are host-managed there.

Check `readlink ~/.config/starship.toml`, then open a fresh shell. For the terminal’s built-in dark/light themes, see [Ghostty](../ghostty/README.md).

[Repository index](../README.md)
