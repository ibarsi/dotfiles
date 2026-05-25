# shellcheck shell=bash disable=SC1090,SC1091,SC2034
# zsh/plugins.zsh - Zsh Productivity Power-ups

# 1. zsh-autosuggestions
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
if [ -d "$HOMEBREW_PREFIX/share/zsh-autosuggestions" ]; then
	source "$HOMEBREW_PREFIX/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
fi

# 2. zsh-syntax-highlighting
if [ -d "$HOMEBREW_PREFIX/share/zsh-syntax-highlighting" ]; then
	[ -r "$DOTFILES/zsh/catppuccin_mocha-zsh-syntax-highlighting.theme" ] && source "$DOTFILES/zsh/catppuccin_mocha-zsh-syntax-highlighting.theme"
	source "$HOMEBREW_PREFIX/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
fi

# 3. fzf shell integration
if [ -d "$HOMEBREW_PREFIX/opt/fzf/shell" ]; then
	export FZF_CTRL_R_OPTS="${FZF_CTRL_R_OPTS:---height 60% --layout=reverse --border}"
	[ -r "$HOMEBREW_PREFIX/opt/fzf/shell/completion.zsh" ] && source "$HOMEBREW_PREFIX/opt/fzf/shell/completion.zsh" 2>/dev/null
	[ -r "$HOMEBREW_PREFIX/opt/fzf/shell/key-bindings.zsh" ] && source "$HOMEBREW_PREFIX/opt/fzf/shell/key-bindings.zsh" 2>/dev/null
fi
