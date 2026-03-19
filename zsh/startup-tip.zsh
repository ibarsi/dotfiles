# shellcheck shell=bash
# zsh/startup-tip.zsh
# Shows one lightweight AI-generated tip when a new interactive terminal starts.

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

# AI-only mode: if zsh-ai is unavailable, skip silently.
command -v zsh-ai >/dev/null 2>&1 || return

_dotfiles_generate_ai_tip() {
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
	print -r -- "$today|$ai_tip" >|"$cache_file" 2>/dev/null || true
	print -r -- "$ai_tip"
}

typeset tip
tip="$(_dotfiles_generate_ai_tip 2>/dev/null)" || return

if [[ -t 1 && -n "$tip" ]]; then
	print -P "%F{244}💡 ${tip}%f"
fi
