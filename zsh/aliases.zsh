# shellcheck shell=bash
# zsh/aliases.zsh

# macOS AI tool upgrades (Homebrew and mise).
alias aiup="brew upgrade claude-code@latest codex grok-build && mise upgrade herdr"

# macOS-only Omen tmux sessions. This deliberately stays out of system/ so it
# is never sourced by the Bash-based Omarchy bootstrap.
function omux() {
  local action session reply

  action="${1:-}"
  case "$action" in
  "")
    session="$(_omux_session_name)" || return 1
    _omux_attach "$session"
    ;;
  ls | list)
    if [[ -n "${2:-}" ]]; then
      echo "Usage: omux ls" >&2
      return 1
    fi
    command ssh ibarsi@omen 'if ! command -v tmux >/dev/null 2>&1; then echo "tmux is not installed on Omen" >&2; exit 127; fi; tmux list-sessions 2>/dev/null || echo "No Omen tmux sessions."'
    ;;
  kill)
    if [[ -z "${2:-}" || -n "${3:-}" ]]; then
      echo "Usage: omux kill <session>" >&2
      return 1
    fi
    session="$(_omux_session_name "$2")" || return 1
    read -r "reply?Kill Omen tmux session \"$session\"? [y/N] "
    case "$reply" in
    y | Y | yes | YES | Yes)
      command ssh ibarsi@omen "exec tmux kill-session -t '$session'"
      ;;
    *)
      echo "Cancelled."
      ;;
    esac
    ;;
  -h | --help | help)
    cat <<'EOF'
Usage:
  omux                  Attach/create an Omen tmux session named from the local repo and branch.
  omux <session>        Attach/create a custom named Omen tmux session.
  omux ls               List Omen tmux sessions.
  omux kill <session>   Confirm, then kill one Omen tmux session.

The branch-derived name uses the current Mac worktree; the remote shell starts
in the matching Omen worktree when it exists, otherwise Omen's login directory.
Existing sessions always reattach where they already are. This helper is
macOS/Zsh-only.
EOF
    ;;
  *)
    if [[ -n "${2:-}" ]]; then
      echo "Usage: omux [session] | omux ls | omux kill <session>" >&2
      return 1
    fi
    session="$(_omux_session_name "$action")" || return 1
    _omux_attach "$session"
    ;;
  esac
}

function _omux_session_name() {
  local repo_root repo_name branch session

  if [[ -n "${1:-}" ]]; then
    session="$1"
  else
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
      echo "Not inside a git repository; use omux <session> instead" >&2
      return 1
    }
    repo_name=$(basename "$repo_root")
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || return 1
    session="${repo_name}-${branch}"
  fi

  session="${session//\//-}"
  case "$session" in
  "" | *[![:alnum:]._-]*)
    echo "Session names may contain only letters, numbers, dots, underscores, and hyphens" >&2
    return 1
    ;;
  esac
  printf '%s\n' "$session"
}

function _omux_attach() {
  local session="$1" worktree_suffix session_quoted suffix_quoted

  worktree_suffix="$(_omux_remote_worktree_suffix 2>/dev/null || true)"
  session_quoted="$(printf '%q' "$session")"
  suffix_quoted="$(printf '%q' "$worktree_suffix")"

  command ssh -t ibarsi@omen "if tmux has-session -t $session_quoted 2>/dev/null; then exec tmux attach-session -t $session_quoted; fi; worktree_suffix=$suffix_quoted; if [[ -n \$worktree_suffix && -d \$HOME/worktrees/\$worktree_suffix ]]; then start_dir=\$HOME/worktrees/\$worktree_suffix; else start_dir=\$HOME; fi; exec tmux new-session -s $session_quoted -c \$start_dir"
}

function _omux_remote_worktree_suffix() {
  local current_path local_worktrees

  current_path="$(pwd -P)"
  local_worktrees="$HOME/worktrees"
  case "$current_path" in
  "$local_worktrees"/*)
    printf '%s\n' "${current_path#"$local_worktrees"/}"
    ;;
  *)
    return 1
    ;;
  esac
}
