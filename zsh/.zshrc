# shellcheck shell=bash disable=SC1090,SC1091,SC2034
# .zshrc - Modular Zsh configuration for ibarsi

# --- Path & Environment ---
if [[ $(uname -m) == "arm64" ]]; then
	export HOMEBREW_PREFIX="/opt/homebrew"
else
	export HOMEBREW_PREFIX="/usr/local"
fi
export PATH="$HOMEBREW_PREFIX/bin:$HOMEBREW_PREFIX/sbin:$PATH"
export PATH="$HOME/.local/share/mise/shims:$PATH"

# Define dotfiles location
export DOTFILES="$HOME/dotfiles"

# --- Load Topics ---
# Load order: path -> everything else -> plugins
# This finds all *.zsh files in the topic directories and sources them.

# 1. First, load all .path files
while IFS= read -r file; do
	source "$file"
done < <(find "$DOTFILES" -type f -name '*.path' | sort)

# 2. Load all other .zsh files (except plugins/completion)
while IFS= read -r file; do
	if [[ "$file" != *"plugins.zsh"* && "$file" != *"completion.zsh"* ]]; then
		source "$file"
	fi
done < <(find "$DOTFILES" -type f -name '*.zsh' | sort)

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

# mise (version manager)
# Keep activation near the end so later PATH edits don't override mise tools.
if command -v mise >/dev/null; then
	eval "$(mise activate zsh)"
fi

# --- Zsh Specifics ---
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt APPEND_HISTORY
setopt SHARE_HISTORY
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_IGNORE_SPACE
setopt HIST_REDUCE_BLANKS
setopt EXTENDED_HISTORY

# Completion (cached for faster startup; full refresh roughly once per day)
autoload -Uz compinit
if find "$HOME/.zcompdump" -prune -mtime +0 -print 2>/dev/null | grep -q .; then
	compinit
else
	compinit -C
fi
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
zstyle ':completion:*' menu select
zstyle ':completion:*:descriptions' format '%F{yellow}-- %d --%f'

# Codex CLI completion (safe no-op when codex isn't installed yet)
if command -v codex >/dev/null; then
	eval "$(codex completion zsh 2>/dev/null)"
fi

# Case-insensitive globbing
setopt nocaseglob

# --- Keybindings ---
bindkey -e

# Claude Code - GCP Vertex AI Configuration
# Added by dev-tooling setup gcp
export CLAUDE_CODE_USE_VERTEX=1
export ANTHROPIC_MODEL=claude-opus-4-6
export ANTHROPIC_DEFAULT_SONNET_MODEL='claude-sonnet-4-6'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='claude-haiku-4-5@20251001'
export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-6'
export ANTHROPIC_VERTEX_PROJECT_ID=vertex-internal-490520
export CLOUD_ML_REGION=us-east5

# Gemini - GCP Vertex AI Configuration
export GOOGLE_CLOUD_PROJECT=vertex-internal-490520
export GOOGLE_CLOUD_LOCATION=global
