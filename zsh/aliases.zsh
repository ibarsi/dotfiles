# zsh/aliases.zsh

# Navigation
alias dtf="cd $DOTFILES"

# Reload shell
alias reload="exec zsh -l"

# Codex CLI
alias cx="codex"
alias cxe="codex exec"
alias cxr="codex resume --last"
alias cxreview='codex "/review"'
alias cxup='if command -v brew >/dev/null && brew list --cask codex >/dev/null 2>&1; then brew upgrade --cask codex; else npm i -g @openai/codex@latest; fi'
