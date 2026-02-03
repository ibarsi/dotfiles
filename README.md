# Igor's `dotfiles`

A modern, topic-based dotfile configuration for macOS. Optimized for Apple Silicon and productivity.

## Installation

```bash
git clone https://github.com/ibarsi/dotfiles.git ~/dotfiles
cd ~/dotfiles
./bootstrap.sh
```

## Structure

The repository is organized into **topics**, making it easy to modularize your configuration:

- `git/`: Git configuration and aliases.
- `macos/`: macOS system defaults and UI/UX settings.
- `system/`: Global environment variables, paths, and generic aliases.
- `vim/`: Vim configuration.
- `zsh/`: Zsh configuration, plugins, and modular initialization.

## Features

- **Topic-based organization**: Modular and easy to maintain.
- **Modern CLI tools**: Integrated with `eza`, `bat`, `fzf`, `zoxide`, and `starship`.
- **Zsh Power-ups**: Syntax highlighting and autosuggestions out of the box.
- **Auto-update**: Automatically checks for updates to your dotfiles once a day.
- **Mise integration**: Blazing fast management for Node, Ruby, Python, and more.
- **Advanced Git**: Includes `gh-dash` and powerful log visualization.
