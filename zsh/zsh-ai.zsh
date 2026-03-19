# shellcheck shell=bash
# zsh-ai defaults
# Docs: https://github.com/matheusml/zsh-ai

# Use local Ollama by default
export ZSH_AI_PROVIDER="ollama"

# Local Ollama model imported from llmfit GGUF
export ZSH_AI_OLLAMA_MODEL="gpt-oss-20b-local"

# Default local Ollama endpoint
export ZSH_AI_OLLAMA_URL="http://localhost:11434"

# Make generated commands align with this dotfiles stack
export ZSH_AI_PROMPT_EXTEND="Prefer modern tools available on this machine: rg over grep, fd over find when appropriate, bat over cat, eza over ls, and zed for opening files. Avoid destructive commands (rm -rf, sudo rm, disk wipe actions) unless explicitly requested. Prefer dry-run flags first when supported."

# Local Ollama mode requires no API key.
