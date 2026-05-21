# Catppuccin Theme Integration

Soothing pastel theme for your entire development environment.

## Flavors

- **Mocha** (default): Dark, cozy, color-rich
- **Macchiato**: Medium contrast, gentle
- **Frappé**: Subdued, muted aesthetic
- **Latte**: Light theme (solarized-style)

To switch flavors, edit `catppuccin.zsh` and change `CATPPUCCIN_FLAVOR`.

## Installation

Run the install script:

```bash
./theme/install.sh
```

Or apply manually to each tool:

### Terminal (iTerm2)
1. Open iTerm2 → Preferences → Profiles → Colors
2. Color Presets → Import → Select `theme/iterm2-catppuccin.json`
3. Select "Catppuccin Mocha"

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
Already configured in `starship.toml`. Ensure your `.zshrc` loads it:

```zsh
eval "$(starship init zsh)"
```

### BetterDiscord

Bootstrap installs the BetterDiscord CLI from Homebrew, injects BetterDiscord when Discord Stable is present, and symlinks `theme/betterdiscord/mocha.theme.css` into BetterDiscord's theme folder:

```text
~/Library/Application Support/BetterDiscord/themes/mocha.theme.css
```

After bootstrap, open Discord Settings → BetterDiscord → Themes and enable `Catppuccin Mocha`. If the theme list is stale, reload Discord with `Cmd+R`.

The `com.ibarsi.ensure-betterdiscord` LaunchAgent checks at user-session load and reruns `bdcli install --channel stable` when Discord Stable is present and an update removes the BetterDiscord injection.

### k9s

Bootstrap downloads the Catppuccin Mocha k9s skin into:

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

- ✅ iTerm2 terminal colors
- ✅ Starship prompt
- ✅ Ghostty editor theme
- ✅ BetterDiscord CLI install + theme wrapper
- ✅ Obsidian manual theme commands documented
- ✅ Vim colorscheme
- ✅ Bat syntax highlighting
- ✅ FZF fuzzy finder
- ✅ eza directory listings
- ✅ Less/man page colors

## File Structure

```
theme/
├── catppuccin.zsh        # Shell env vars & FZF/bat/eza config
├── betterdiscord/        # BetterDiscord Catppuccin theme wrapper
├── starship.toml         # Prompt theme configuration
├── iterm2-catppuccin.json # iTerm2 color preset
├── install.sh            # One-command setup
├── vim-colors.vim        # Vim colorscheme config
└── README.md             # This file
```

## Switching Flavors

To use a different flavor (e.g., Macchiato):

1. Edit `catppuccin.zsh`: Change `CATPPUCCIN_FLAVOR="mocha"` to `"macchiato"`
2. Update colors in the export statements
3. For Ghostty: Already included (no extra setup)
4. For iTerm2: Import the Macchiato variant (see catppuccin.org for downloads)

## Credits

[Catppuccin](https://catppuccin.com) - Soothing pastel theme for the high-spirited!
