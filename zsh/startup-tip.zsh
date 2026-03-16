# zsh/startup-tip.zsh
# Shows one lightweight, useful tip when a new interactive terminal starts.

# Opt-out: export DOTFILES_STARTUP_TIPS=0
# Optional AI mode: export DOTFILES_STARTUP_TIPS_AI=1 (uses zsh-ai + daily cache)
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

typeset -a tips
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

_dotfiles_generate_ai_tip() {
  [[ "${DOTFILES_STARTUP_TIPS_AI:-0}" == "1" ]] || return 1
  command -v zsh-ai >/dev/null 2>&1 || return 1

  typeset cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/dotfiles"
  typeset cache_file="$cache_dir/startup-tip-ai.txt"
  typeset today
  today="$(date +%F)"

  if [[ -r "$cache_file" ]]; then
    typeset cached_line cached_date cached_tip
    cached_line="$(head -n 1 "$cache_file" 2>/dev/null)"
    cached_date="${cached_line%%|*}"
    cached_tip="${cached_line#*|}"
    if [[ "$cached_date" == "$today" && -n "$cached_tip" ]]; then
      print -r -- "$cached_tip"
      return 0
    fi
  fi

  typeset aliases_preview functions_preview prompt ai_tip
  aliases_preview="$({
    grep -hE '^[[:space:]]*alias[[:space:]]+[^=]+=' "$DOTFILES"/zsh/aliases.zsh "$DOTFILES"/system/.aliases 2>/dev/null || true
  } | sed -E 's/^[[:space:]]*alias[[:space:]]+([^=]+)=.*/\1/' | head -n 12 | tr '\n' ', ' | sed 's/, $//')"

  functions_preview="$({
    grep -hE '^[a-zA-Z_][a-zA-Z0-9_-]*[[:space:]]*\(\)' "$DOTFILES"/system/.functions 2>/dev/null || true
  } | sed -E 's/[[:space:]]*\(\).*//' | head -n 12 | tr '\n' ', ' | sed 's/, $//')"

  prompt="Generate ONE short startup tip (max 120 chars) for this shell setup. Be practical and specific. No markdown, no quotes, no preface. Use these available commands as context. Aliases: ${aliases_preview:-unknown}. Functions: ${functions_preview:-unknown}."

  ai_tip="$(zsh-ai "$prompt" 2>/dev/null | head -n 1 | sed -E 's/^[[:space:]"'\''-]+//; s/[[:space:]"'\''-]+$//')"
  [[ -n "$ai_tip" ]] || return 1

  mkdir -p "$cache_dir" 2>/dev/null || true
  print -r -- "$today|$ai_tip" >| "$cache_file" 2>/dev/null || true
  print -r -- "$ai_tip"
}

typeset tip
if tip="$(_dotfiles_generate_ai_tip 2>/dev/null)" && [[ -n "$tip" ]]; then
  :
else
  typeset idx=$(( (RANDOM % ${#tips[@]}) + 1 ))
  tip="${tips[$idx]}"
fi

if [[ -t 1 && -n "$tip" ]]; then
  print -P "%F{244}💡 ${tip}%f"
fi
