# .zshrc - Modular Zsh configuration for ibarsi

# --- Path & Environment ---
if [[ $(uname -m) == "arm64" ]]; then
    export HOMEBREW_PREFIX="/opt/homebrew"
else
    export HOMEBREW_PREFIX="/usr/local"
fi
export PATH="$HOMEBREW_PREFIX/bin:$HOMEBREW_PREFIX/sbin:$PATH"

# Define dotfiles location
export DOTFILES="$HOME/dotfiles"

# --- Load Topics ---
# Load order: path -> everything else -> plugins
# This finds all *.zsh files in the topic directories and sources them.

# 1. First, load all .path files
for file in $DOTFILES/**/*.path; do
    source "$file"
done

# 2. Load mise (version manager)
if command -v mise >/dev/null; then
  eval "$(mise activate zsh)"
fi

# 3. Load all other .zsh files (except plugins/completion)
for file in $DOTFILES/**/*.zsh(N); do
    if [[ "$file" != *"plugins.zsh"* && "$file" != *"completion.zsh"* ]]; then
        source "$file"
    fi
done

# 4. Load legacy bash-style files from system topic
for file in $DOTFILES/system/.{exports,aliases,functions,extra}; do
    [ -r "$file" ] && [ -f "$file" ] && source "$file"
done

# --- Tool Init ---
# zoxide (better cd)
if command -v zoxide >/dev/null; then
  eval "$(zoxide init zsh)"
fi

# starship (prompt)
if command -v starship >/dev/null; then
  eval "$(starship init zsh)"
fi

# plugins
source "$DOTFILES/zsh/plugins.zsh"

# --- Zsh Specifics ---
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt APPEND_HISTORY
setopt SHARE_HISTORY
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_REDUCE_BLANKS

# Completion
autoload -Uz compinit && compinit
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'

# Case-insensitive globbing
setopt nocaseglob

# --- Keybindings ---
bindkey -e
