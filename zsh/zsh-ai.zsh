# shellcheck shell=bash
# zsh-ai defaults
# Docs: https://github.com/matheusml/zsh-ai

# Use LM Studio's OpenAI-compatible local server by default
export ZSH_AI_PROVIDER="openai"

# Local LM Studio model served via the OpenAI-compatible API
export ZSH_AI_OPENAI_MODEL="qwen2.5-coder-7b-instruct-mlx"

# Default LM Studio chat completions endpoint
export ZSH_AI_OPENAI_URL="http://localhost:1234/v1/chat/completions"

# Make generated commands align with this dotfiles stack
export ZSH_AI_PROMPT_EXTEND="Use the simplest correct zsh command. For listing the current folder, prefer eza. Use recursive commands only when explicitly requested. Prefer fd over find for recursive file searches, rg over grep for text searches, bat over cat for file viewing, and zed for opening files. Avoid destructive commands (rm -rf, sudo rm, disk wipe actions) unless explicitly requested."

# Local LM Studio mode requires no API key when using the custom URL above.
