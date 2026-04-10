# shellcheck shell=bash
# zsh/aliases.zsh

# Navigation
alias dtf='cd "$DOTFILES"'
alias dsync="dotfiles-sync"

# Reload shell
alias reload="exec zsh -l"

# SSH compatibility
alias sshx='TERM=xterm-256color ssh'

# Codex CLI
alias cx="codex"
alias cxe="codex exec"
alias cxr="codex resume --last"
alias cxreview='codex "/review"'
alias cxyolo="codex --full-auto"

# Claude Code CLI
alias cc="claude"
alias cce="claude -p"
alias ccr="claude --continue"
alias ccreview='claude "/review"'
alias ccyolo="claude --dangerously-skip-permissions"

# Upgrade AI coding tools
alias aiup="brew upgrade claude-code codex opencode"
alias omlxs='omlx serve --model-dir ~/.omlx/models --port 1234'

# Mise
alias ms="mise"
alias msi="mise install"
alias msu="mise upgrade"
alias msr="mise run"
alias msd="mise doctor"

# tmux
alias tl="tmux ls"
alias ta="tmux attach -t"
alias tn="tmux new -s"
