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

### VS Code
1. Install extension: **Catppuccin for VSCode**
2. Command Palette → `Color Theme` → `Catppuccin Mocha`
3. Settings sync will handle the rest

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

## Tools Integrated

- ✅ iTerm2 terminal colors
- ✅ Starship prompt
- ✅ VS Code editor theme
- ✅ Vim colorscheme
- ✅ Bat syntax highlighting
- ✅ FZF fuzzy finder
- ✅ eza directory listings
- ✅ Less/man page colors

## File Structure

```
theme/
├── catppuccin.zsh        # Shell env vars & FZF/bat/eza config
├── starship.toml         # Prompt theme configuration
├── iterm2-catppuccin.json # iTerm2 color preset
├── install.sh            # One-command setup
├── vim-colors.vim        # Vim colorscheme config
├── vscode-settings.json  # VS Code theme settings
└── README.md             # This file
```

## Switching Flavors

To use a different flavor (e.g., Macchiato):

1. Edit `catppuccin.zsh`: Change `CATPPUCCIN_FLAVOR="mocha"` to `"macchiato"`
2. Update colors in the export statements
3. For VS Code: Command Palette → Color Theme → Catppuccin Macchiato
4. For iTerm2: Import the Macchiato variant (see catppuccin.org for downloads)

## Credits

[Catppuccin](https://catppuccin.com) - Soothing pastel theme for the high-spirited!
