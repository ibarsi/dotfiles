# zsh-ai defaults
# Docs: https://github.com/matheusml/zsh-ai

# Use Anthropic by default
export ZSH_AI_PROVIDER="anthropic"

# Fast + capable default model for shell command generation
export ZSH_AI_ANTHROPIC_MODEL="claude-haiku-4-5"

# Official API endpoint (override if needed)
export ZSH_AI_ANTHROPIC_URL="https://api.anthropic.com/v1/messages"

# Make generated commands align with this dotfiles stack
export ZSH_AI_PROMPT_EXTEND="Prefer modern tools available on this machine: rg over grep, fd over find when appropriate, bat over cat, eza over ls, and zed for opening files."

# API key loading strategy (in priority order):
# 1) Existing ANTHROPIC_API_KEY in environment
# 2) ~/.config/anthropic/api_key file (single-line key)
if [[ -z "$ANTHROPIC_API_KEY" && -f "$HOME/.config/anthropic/api_key" ]]; then
  export ANTHROPIC_API_KEY="$(<"$HOME/.config/anthropic/api_key")"
fi
