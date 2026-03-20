# shellcheck shell=bash
# zsh-ai defaults
# Docs: https://github.com/matheusml/zsh-ai

# Use local Ollama by default
export ZSH_AI_PROVIDER="ollama"

# Local Ollama model served by Ollama
export ZSH_AI_OLLAMA_MODEL="deepseek-coder-v2:16b"

# Default local Ollama endpoint
export ZSH_AI_OLLAMA_URL="http://localhost:11434"

# Make generated commands align with this dotfiles stack
export ZSH_AI_PROMPT_EXTEND="Use the simplest correct zsh command. For listing the current folder, prefer eza. Use recursive commands only when explicitly requested. Prefer fd over find for recursive file searches, rg over grep for text searches, bat over cat for file viewing, and zed for opening files. Avoid destructive commands (rm -rf, sudo rm, disk wipe actions) unless explicitly requested."

# Local Ollama mode requires no API key.
