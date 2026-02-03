# zsh/plugins.zsh - Zsh Productivity Power-ups

# 1. zsh-autosuggestions
if [ -d "$HOMEBREW_PREFIX/share/zsh-autosuggestions" ]; then
    source "$HOMEBREW_PREFIX/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
fi

# 2. zsh-syntax-highlighting
if [ -d "$HOMEBREW_PREFIX/share/zsh-syntax-highlighting" ]; then
    source "$HOMEBREW_PREFIX/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
fi

# 3. fzf-tab (if installed via brew or manually)
# Note: Usually requires cloning or a specific brew tap. 
# For now, we'll assume standard fzf integration which brew handles.
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
