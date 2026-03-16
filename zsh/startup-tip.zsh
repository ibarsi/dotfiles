# zsh/startup-tip.zsh
# Shows one lightweight, useful tip when a new interactive terminal starts.

# Opt-out: export DOTFILES_STARTUP_TIPS=0
if [[ ! -o interactive ]]; then
  return
fi

if [[ "${DOTFILES_STARTUP_TIPS:-1}" == "0" ]]; then
  return
fi

# Prevent duplicate tips in the same shell process.
if [[ -n "${__DOTFILES_TIP_SHOWN:-}" ]]; then
  return
fi
export __DOTFILES_TIP_SHOWN=1

local -a tips

tips=(
  "Use 'frg <query>' to fuzzy-jump from ripgrep results straight to file:line in Zed."
  "Use 'fbr' to fuzzy-switch git branches with a live commit preview."
  "Use 'fcd' to fuzzy-jump directories faster than manual cd navigation."
  "Use 'cxreview' to kick off a Codex '/review' quickly in terminal."
  "Use 'ccr' to resume your last Claude Code session in one command."
  "Use 'msr check' to run full repo validation (lint + format check + shell syntax)."
  "Use 'dnstrace <domain>' for quick DNS path tracing with doggo."
  "Use 'httptime <url>' to get DNS/connect/TLS/TTFB timing in one line."
  "Use 'whichport <port>' to see exactly what process is listening."
  "Use 'killport <port>' to quickly stop the process bound to a port."
  "Use 'reload-dotfiles' after pulling changes to re-bootstrap and reload shell."
)

if command -v zsh-ai >/dev/null 2>&1; then
  tips+=("Try '# draft a curl command for this API endpoint' to use zsh-ai inline.")
fi

local idx=$(( (RANDOM % ${#tips[@]}) + 1 ))
if [[ -t 1 ]]; then
  print -P "%F{244}💡 ${tips[$idx]}%f"
fi
