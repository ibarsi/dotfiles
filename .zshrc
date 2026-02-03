# .zshrc - Modern Zsh configuration for ibarsi

# --- Path & Environment ---
# Handle Apple Silicon (opt/homebrew) vs Intel (usr/local)
if [[ $(uname -m) == "arm64" ]]; then
    export HOMEBREW_PREFIX="/opt/homebrew"
else
    export HOMEBREW_PREFIX="/usr/local"
fi
export PATH="$HOMEBREW_PREFIX/bin:$HOMEBREW_PREFIX/sbin:$PATH"

# Load generic path extensions
[ -f "$HOME/.path" ] && source "$HOME/.path"

# --- Plugin & Tool Init ---
# mise (replaces nvm/rvm)
if command -v mise >/dev/null; then
  eval "$(mise activate zsh)"
fi

# zoxide (better cd)
if command -v zoxide >/dev/null; then
  eval "$(zoxide init zsh)"
fi

# starship (prompt)
if command -v starship >/dev/null; then
  eval "$(starship init zsh)"
fi

# fzf (fuzzy finder)
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# --- Load modular dotfiles ---
for file in ~/.{exports,aliases,functions,extra}; do
    [ -r "$file" ] && [ -f "$file" ] && source "$file"
done
unset file

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
bindkey -e # Use emacs keybindings
