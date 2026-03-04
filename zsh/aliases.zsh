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

# Claude Code CLI
alias cc="claude"
alias ccr="claude --resume"
alias ccdoctor="claude doctor"
alias ccupdate='if command -v brew >/dev/null && brew list --cask claude-code >/dev/null 2>&1; then brew upgrade --cask claude-code; else claude update; fi'

# Mise
alias ms="mise"
alias msi="mise install"
alias msu="mise upgrade"
alias msr="mise run"
alias msd="mise doctor"

# Unified AI wrappers
# ai-plan: safe planning flow (no edits) using Claude plan mode
function ai-plan() {
  claude --permission-mode plan "$@"
}

# ai-review: review current local changes with Codex
function ai-review() {
  codex "/review the current git diff for correctness, security, and maintainability"
}

# ai-fix: targeted minimal fix flow with Codex
function ai-fix() {
  if [[ -z "$*" ]]; then
    echo "Usage: ai-fix \"what to fix\""
    return 1
  fi
  codex "Apply a minimal, focused fix for: $* . Keep changes small, run relevant checks, and explain what changed."
}
