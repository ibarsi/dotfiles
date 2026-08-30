window.DOTFILES_DOCS_DATA = {
  "git_revision": "d6223365bed9c043bac1342a1c62c03817db9636",
  "source_hash": "d070b60aeffa",
  "stats": {
    "aliases": 70,
    "functions": 40,
    "git": 53,
    "features": 13,
    "tasks": 15,
    "bootstrap_links": 23,
    "brews": 36,
    "casks": 26
  },
  "aliases": [
    {
      "name": "..",
      "command": "cd ..",
      "group": "Easier navigation",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "...",
      "command": "cd ../..",
      "group": "Easier navigation",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "....",
      "command": "cd ../../..",
      "group": "Easier navigation",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": ".....",
      "command": "cd ../../../..",
      "group": "Easier navigation",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "agye",
      "command": "agy -p",
      "group": "Agy CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "agyr",
      "command": "agy --continue",
      "group": "Agy CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "agyreview",
      "command": "agy \"/review\"",
      "group": "Agy CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "agyyolo",
      "command": "agy --dangerously-skip-permissions",
      "group": "Agy CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "aiup",
      "command": "brew upgrade claude-code@latest claude-devtools codex; agy update",
      "group": "Upgrade AI coding tools",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "cat",
      "command": "bat",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "cc",
      "command": "claude",
      "group": "Claude Code CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "cce",
      "command": "claude -p",
      "group": "Claude Code CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "ccr",
      "command": "claude --continue",
      "group": "Claude Code CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "ccreview",
      "command": "claude \"/review\"",
      "group": "Claude Code CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "ccyolo",
      "command": "claude --dangerously-skip-permissions",
      "group": "Claude Code CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "cdd",
      "command": "cd ~/Desktop",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "cdl",
      "command": "cd ~/Downloads",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "cdp",
      "command": "cd ~/Projects",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "cx",
      "command": "codex",
      "group": "Codex CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "cxe",
      "command": "codex exec",
      "group": "Codex CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "cxr",
      "command": "codex resume --last",
      "group": "Codex CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "cxreview",
      "command": "codex \"/review\"",
      "group": "Codex CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "cxyolo",
      "command": "codex --dangerously-bypass-approvals-and-sandbox",
      "group": "Codex CLI",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "dsync",
      "command": "dotfiles-sync",
      "group": "Navigation",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "dtf",
      "command": "cd \"$DOTFILES\"",
      "group": "Navigation",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "egrep",
      "command": "egrep --color=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "fgrep",
      "command": "fgrep --color=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "fzs",
      "command": "rg --line-number --no-heading --color=always \"\" | fzf --ansi --delimiter \":\" --preview \"bat --color=always --highlight-line {2} {1}\" --preview-window \"+{2}-5\" --bind \"enter:become(${EDITOR:-vim} +{2} {1})\"",
      "group": "fzf content search",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "gm",
      "command": "gitmoji",
      "group": "Gitmoji",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "grep",
      "command": "grep --color=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "ip",
      "command": "curl -s https://ifconfig.me/ip",
      "group": "IP addresses",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "k",
      "command": "kubectl",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kargopw",
      "command": "kubectl -n sys-argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d; echo",
      "group": "ArgoCD",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kctx",
      "command": "kubectl config current-context",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kctxs",
      "command": "kubectl config get-contexts",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kd",
      "command": "kubectl describe",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "ke",
      "command": "kubectl events",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kex",
      "command": "kubectl exec -it",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kgapp",
      "command": "kubectl get applications",
      "group": "ArgoCD",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kgp",
      "command": "kubectl get pods",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kgpa",
      "command": "kubectl get pods -A",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "klf",
      "command": "kubectl logs -f --tail=1000",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "klp",
      "command": "kubectl logs --previous",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kns",
      "command": "kubectl config set-context --current --namespace",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "krr",
      "command": "kubectl rollout restart",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "krs",
      "command": "kubectl rollout status",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "kuc",
      "command": "kubectl config use-context",
      "group": "Kubernetes",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "l",
      "command": "eza -lF --icons=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "l",
      "command": "command ls -lF --color=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "l",
      "command": "command ls -lFG",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "la",
      "command": "eza -laF --icons=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "la",
      "command": "command ls -laF --color=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "la",
      "command": "command ls -laFG",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "ls",
      "command": "eza --icons=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "ls",
      "command": "command ls --color=auto",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "ls",
      "command": "command ls -G",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "ms",
      "command": "mise",
      "group": "Mise",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "msd",
      "command": "mise doctor",
      "group": "Mise",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "msi",
      "command": "mise install",
      "group": "Mise",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "msr",
      "command": "mise run",
      "group": "Mise",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "msu",
      "command": "mise upgrade",
      "group": "Mise",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "path",
      "command": "echo -e ${PATH//:/\\\\n}",
      "group": "IP addresses",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "publicip",
      "command": "curl -s https://ifconfig.me/ip",
      "group": "IP addresses",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "reload",
      "command": "exec \"${SHELL:-/bin/sh}\" -l",
      "group": "IP addresses",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "reload",
      "command": "exec zsh -l",
      "group": "Reload shell",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "sshx",
      "command": "TERM=xterm-256color ssh",
      "group": "SSH compatibility",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "sudo",
      "command": "sudo ",
      "group": "Shortcuts",
      "source": "system/.aliases",
      "source_kind": "system alias"
    },
    {
      "name": "ta",
      "command": "tmux attach -t",
      "group": "tmux",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "tl",
      "command": "tmux ls",
      "group": "tmux",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    },
    {
      "name": "tn",
      "command": "tmux new -s",
      "group": "tmux",
      "source": "zsh/aliases.zsh",
      "source_kind": "zsh alias"
    }
  ],
  "functions": [
    {
      "name": "dnstrace",
      "summary": "Quick DNS trace (A + AAAA + CNAME + NS path)",
      "usage": "dnstrace <domain>",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "dotdocs",
      "summary": "Serve the dotfiles docs site from anywhere and open it in the browser",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "dotfiles-open",
      "summary": "Open a URL or local path with the desktop opener available on this platform.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "dotfiles-sync",
      "summary": "Sync dotfiles safely (fetch + status + optional update)",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "fbr",
      "summary": "Fuzzy-switch git branch",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "fcd",
      "summary": "Fuzzy-find directory and cd into it",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "ff",
      "summary": "Fuzzy-find file and open in Zed",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "fkill",
      "summary": "Fuzzy pick process and kill it",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "flushdns",
      "summary": "Clear the local DNS cache using the resolver available on the current OS.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "frg",
      "summary": "Fuzzy-search ripgrep results and open selected file:line",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "fs",
      "summary": "Determine size of a file or total size of a directory",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "fwt",
      "summary": "Fuzzy-pick a git worktree from the current repo and cd into it",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "fwtr",
      "summary": "Fuzzy-pick a git worktree and remove it with git wtr",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "glow",
      "summary": "Run Glow with the repo-managed config and Catppuccin Glamour style by default.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "groot",
      "summary": "Jump to the current git repository root",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "httptime",
      "summary": "Quick HTTP timing breakdown",
      "usage": "httptime <url>",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "ips",
      "summary": "Print configured IPv4 and IPv6 addresses on macOS or Linux.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "killport",
      "summary": "Kill process by port",
      "usage": "killport <port>",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "klogj",
      "summary": "Stream Kubernetes logs through jq and page them with less when interactive. Press Ctrl-C inside less to pause following, / to search, and Shift-F to resume.",
      "usage": "klogj <pod|resource/name> [kubectl logs flags...]",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "kpf",
      "summary": "Auto-reconnecting kubectl port-forward.",
      "usage": "kpf [--context <ctx>] [-n <ns>] <resource> <port> [port...]",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "lip",
      "summary": "Print the primary LAN IPv4 address without assuming a macOS interface name.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "listeners",
      "summary": "Check open TCP/UDP listeners in a compact view",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "md",
      "summary": "Render Markdown with Glow. With no argument, open README.md when present; otherwise launch Glow's current-directory browser.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "mdf",
      "summary": "Fuzzy-pick a Markdown file and render it with Glow.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "mdrepo",
      "summary": "Render a GitHub/GitLab repository README with Glow.",
      "usage": "mdrepo <owner/repo|github.com/owner/repo|gitlab.com/owner/repo|url>",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "mkd",
      "summary": "Create a new directory and enter it",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "nclisten",
      "summary": "Netcat listener helper (TCP)",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "ncprobe",
      "summary": "Netcat connectivity check helper",
      "usage": "ncprobe <host> <port>",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "netpath",
      "summary": "MTR wrapper with sane defaults",
      "usage": "netpath <host>",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "netspeed",
      "summary": "iperf3 client helper",
      "usage": "netspeed <iperf3-server-host> [seconds]",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "pcap",
      "summary": "tcpdump helper: capture to file with optional filter expression",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "pr",
      "summary": "Open existing PR in browser, or create one if missing",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "reload-dotfiles",
      "summary": "Reload shell only (no git/network side effects)",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "sniffweb",
      "summary": "Live HTTP-ish packet view (ports 80/443)",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "tre",
      "summary": "`tre` is a shorthand for `tree` with hidden files and color enabled, ignoring the `.git` directory, listing directories first. The output gets piped into `less` with options to preserve color, unless the output is small enough for one screen.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "upall",
      "summary": "Upgrade Homebrew when available and mise tools.",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "whichport",
      "summary": "Show process(es) listening on a given port",
      "usage": "whichport <port>",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "wtnew",
      "summary": "Create a new worktree in ~/worktrees/<repo>/<branch> and cd into it",
      "usage": "wtnew <branch> [base]",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "wtpath",
      "summary": "Print the conventional path for a repo worktree under ~/worktrees/<repo>/<name>",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    },
    {
      "name": "wtsesh",
      "summary": "Attach or create a tmux session named from the current repo and branch",
      "usage": "",
      "source": "system/.functions",
      "source_kind": "system function"
    }
  ],
  "git": [
    {
      "name": "dotfiles-sync",
      "command": "dotfiles-sync",
      "summary": "Sync dotfiles safely (fetch + status + optional update)",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "fbr",
      "command": "fbr",
      "summary": "Fuzzy-switch git branch",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "fwt",
      "command": "fwt",
      "summary": "Fuzzy-pick a git worktree from the current repo and cd into it",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "fwtr",
      "command": "fwtr",
      "summary": "Fuzzy-pick a git worktree and remove it with git wtr",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "groot",
      "command": "groot",
      "summary": "Jump to the current git repository root",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "pr",
      "command": "pr",
      "summary": "Open existing PR in browser, or create one if missing",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "wtnew",
      "command": "wtnew <branch> [base]",
      "summary": "Create a new worktree in ~/worktrees/<repo>/<branch> and cd into it",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "wtpath",
      "command": "wtpath",
      "summary": "Print the conventional path for a repo worktree under ~/worktrees/<repo>/<name>",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "wtsesh",
      "command": "wtsesh",
      "summary": "Attach or create a tmux session named from the current repo and branch",
      "kind": "function",
      "source": "system/.functions"
    },
    {
      "name": "amend",
      "command": "commit --amend --reuse-message=HEAD",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "b",
      "command": "!git rev-parse --abbrev-ref HEAD",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "bds",
      "command": "!\"f() { git diff --stat ${1:-main}...HEAD; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "bparent",
      "command": "!\"f() { git log ${1:-main}..HEAD --oneline | tail -1 | cut -d\\\" \\\" -f1 | xargs -I{} git log --oneline -1 {}^; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "branches",
      "command": "branch -a",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "breb",
      "command": "!\"f() { git rebase -i `git merge-base $1 HEAD`; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "browse",
      "command": "!gh repo view --web",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream Delete current branch from origin Git worktree helpers Browse on GitHub",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "c",
      "command": "clone --recursive",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "ca",
      "command": "!git add -A && git commit -av",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "co",
      "command": "checkout",
      "summary": "Shorthand for checkout",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "credit",
      "command": "!\"f() { git commit --amend --author \\\"$1 <$2>\\\" -C HEAD; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "d",
      "command": "!\"git diff-index --quiet HEAD -- || clear; git diff --patch-with-stat\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "di",
      "command": "!\"d() { git diff --patch-with-stat HEAD~$1; }; git diff-index --quiet HEAD -- || clear; d\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "ds",
      "command": "!\"f() { git diff --stat \\\"$1\\\" \\\"${2:-HEAD}\\\"; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "fa",
      "command": "!\"f() { git log --pretty=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)' --decorate --author=$1; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "fb",
      "command": "!\"f() { git branch -a --contains $1; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "fc",
      "command": "!\"f() { git log --pretty=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)' --decorate -S$1; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "fm",
      "command": "!\"f() { git log --pretty=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)' --decorate --grep=$1; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "fo",
      "command": "!git fetch origin",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "ft",
      "command": "!\"f() { git describe --always --contains $1; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "fu",
      "command": "!git fetch upstream",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "go",
      "command": "!\"f() { git checkout -b \\\"$1\\\" 2> /dev/null || git checkout \\\"$1\\\"; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "incoming",
      "command": "!\"f() { b=\\\"${1:-HEAD}\\\"; u=$(git rev-parse --abbrev-ref \\\"${b}@{upstream}\\\" 2>/dev/null) || { echo \\\"no upstream for ${b}\\\" >&2; return 1; }; git fetch -q \\\"${u%%/*}\\\"; git log --no-merges --decorate --pretty=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)' \\\"${b}..${b}@{upstream}\\\"; echo; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch).",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "l",
      "command": "log --graph --abbrev-commit --decorate --format=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)'",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "lcp",
      "command": "l --no-merges --cherry-pick --right-only",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "m",
      "command": "merge",
      "summary": "Shorthand for checkout Shorthand for merge",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "onto",
      "command": "!\"f() { sha=$(git bparent \\\"$1\\\" | cut -d\\\" \\\" -f1) && [ -n \\\"$sha\\\" ] && git rebase --onto origin/${1:-main} \\\"$sha\\\"; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "oreb",
      "command": "!\"f() { git rebase origin/${1:-$(git symbolic-ref --short HEAD)}; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "p",
      "command": "!\"git pull; git submodule foreach git pull origin master\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "pub",
      "command": "!git push -u origin $(git b)",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "reb",
      "command": "!\"r() { git rebase -i HEAD~$1; }; r\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "remotes",
      "command": "remote -v",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "retag",
      "command": "!\"r() { git tag -d $1 && git push origin :refs/tags/$1 && git tag $1; }; r\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it.",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "rh",
      "command": "!git reset --hard origin/$(git symbolic-ref --short HEAD)",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "s",
      "command": "status -s",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "tags",
      "command": "tag -l",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "unpub",
      "command": "!git push origin :$(git b)",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream Delete current branch from origin",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "ureb",
      "command": "!\"f() { git rebase upstream/${1:-$(git symbolic-ref --short HEAD)}; }; f\"",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "wt",
      "command": "worktree",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream Delete current branch from origin Git worktree helpers",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "wtl",
      "command": "worktree list",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream Delete current branch from origin Git worktree helpers",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "wtp",
      "command": "worktree prune",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream Delete current branch from origin Git worktree helpers",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "wtr",
      "command": "worktree remove",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream Delete current branch from origin Git worktree helpers",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "wtx",
      "command": "!git worktree list --porcelain",
      "summary": "Shorthand for checkout Shorthand for merge View abbreviated SHA, description, and history graph of the latest 20 commits View abbreviated SHAs between two branches, excluding cherry picks View the current working tree status using the short format Show the diff between the latest commit and the current state Show the diff between the state `$number` revisions ago and the current state Show per-file and total added/removed line stats from $1 to HEAD, or to $2 if given Show the same stats for the whole current branch, measured from where it forked off $1 Pull in remote changes for the current repository and all its submodules Clone a repository including all submodules Print current branch name Fetch origin Fetch upstream Show commits incoming from a branch's upstream (default: current branch). Hard reset the current branch to its origin branch Commit all changes Switch to a branch, creating it if necessary Show verbose output about tags, branches or remotes Amend the currently staged files to the latest commit Credit an author on the latest commit Interactive rebase with the given number of latest commits Fetch and rebase current branch with origin's master Fetch and rebase current branch with upstream's master Interactively rebase changes in current branch against another branch used as the base Print the parent commit of the oldest commit on the current branch not found in the given base Rebase the current branch onto origin/<base> using bparent as the boundary Remove the old tag with this name and tag the latest commit with it. Find branches containing commit Find tags containing commit Find commits by source code Find commits by commit message Find commits by author Push current branch to origin and set upstream Delete current branch from origin Git worktree helpers",
      "kind": "git alias",
      "source": "git/aliases.gitconfig"
    },
    {
      "name": "gm",
      "command": "gitmoji",
      "summary": "system alias from Gitmoji",
      "kind": "system alias",
      "source": "system/.aliases"
    }
  ],
  "features": [
    {
      "slug": "bootstrap",
      "title": "Bootstrap workflow",
      "summary": "Installs Homebrew dependencies, creates config symlinks, applies themes, and runs macOS setup.",
      "details": [
        "Installs Homebrew when missing and reuses the repo root for path-safe runs.",
        "Uses Brewfile as the package source of truth.",
        "Installs the theme, sets zsh as the default shell, and applies macOS defaults."
      ],
      "source": "bootstrap.sh"
    },
    {
      "slug": "shell",
      "title": "Modular Zsh shell",
      "summary": "Loads shared paths, Zsh modules, system aliases/functions, plugin integrations, and shell quality-of-life defaults.",
      "details": [
        "Sources topic files from the repo instead of duplicating config into the home directory.",
        "Enables history sharing, cached completion, case-insensitive globbing, and tool init for zoxide, starship, and mise.",
        "Loads Codex shell completion when available."
      ],
      "source": "zsh/.zshrc"
    },
    {
      "slug": "bash",
      "title": "Additive Bash shell",
      "summary": "Integrates the shared shell layer with an existing Bash startup file without replacing host-managed configuration.",
      "details": [
        "Bootstrap links the Bash fragment under ~/.config/ibarsi-dotfiles/bashrc and adds a marked source block to ~/.bashrc only when missing.",
        "Loads shared paths, exports, aliases, functions, zoxide, Starship, and mise for interactive Bash shells.",
        "Keeps Omarchy's existing ~/.bashrc content and defaults intact."
      ],
      "source": "bash/bashrc"
    },
    {
      "slug": "git-aliases",
      "title": "Portable Git aliases",
      "summary": "Shares Git aliases through an include file without replacing a host-managed Git configuration.",
      "details": [
        "macOS uses the include from the repository-managed global Git config.",
        "On Linux, git/install-aliases.sh links the aliases file and adds one global include.path entry.",
        "Existing user identity, signing, and host-specific Git settings remain in the host configuration."
      ],
      "source": "git/aliases.gitconfig"
    },
    {
      "slug": "omarchy-bootstrap",
      "title": "Omarchy bootstrap",
      "summary": "Sets up the shared Bash and Git-alias layers on Linux without applying macOS-only configuration.",
      "details": [
        "Runs only the additive Bash and Git-alias installers.",
        "Preserves Omarchy's existing Bash and Git configuration.",
        "Refuses to run outside Linux and does not manage system packages."
      ],
      "source": "bootstrap-omarchy.sh"
    },
    {
      "slug": "plugins",
      "title": "Shell plugin integrations",
      "summary": "Wires autosuggestions, syntax highlighting, and fzf shell integration through Homebrew-managed paths.",
      "details": [
        "Loads zsh-autosuggestions with history-first suggestions, Shift-Tab acceptance, and Tab expansion/completion.",
        "Loads the Catppuccin Mocha zsh-syntax-highlighting styles before the plugin.",
        "Sources Homebrew fzf completion and key bindings, with Ctrl-R history search defaults."
      ],
      "source": "zsh/plugins.zsh"
    },
    {
      "slug": "theme",
      "title": "Catppuccin theme setup",
      "summary": "Installs the repository-managed shell prompt, terminal, and app theming assets.",
      "details": [
        "Bootstraps the theme during setup when the installer script is present.",
        "Links and downloads Catppuccin assets for supported terminal and CLI tools."
      ],
      "source": "theme/install.sh"
    },
    {
      "slug": "ghostty",
      "title": "Ghostty terminal config",
      "summary": "Ships a managed Ghostty configuration with Catppuccin styling, keybindings, and shell integration defaults.",
      "details": [
        "Symlinked into ~/.config/ghostty/config during bootstrap."
      ],
      "source": "ghostty/config"
    },
    {
      "slug": "zed",
      "title": "Zed editor config",
      "summary": "Stores editor settings and keybindings in-repo and links them into ~/.config/zed.",
      "details": [
        "Bootstrap links both settings.json and keymap.json."
      ],
      "source": "zed/settings.json"
    },
    {
      "slug": "codex",
      "title": "Codex CLI config",
      "summary": "Maintains Codex defaults in-repo with trusted project settings and experimental workflow features.",
      "details": [
        "Bootstrap links ~/.codex/config.toml to the repository-managed file.",
        "Bootstrap links ~/.codex/hooks.json so Codex can enforce Semble-first code discovery.",
        "The Grafana MCP launcher reads its service-account token from the macOS login keychain and runs in read-only mode."
      ],
      "source": "codex/config.toml"
    },
    {
      "slug": "cmux",
      "title": "cmux config",
      "summary": "Tracks cmux settings in-repo and links them into ~/.config/cmux during bootstrap.",
      "details": [
        "Homebrew installs cmux from the manaflow-ai/cmux tap.",
        "Bootstrap links ~/.config/cmux/cmux.json to the repository-managed JSONC file.",
        "Bootstrap sets the dark theme to Catppuccin Mocha through the cmux CLI."
      ],
      "source": "cmux/cmux.json"
    },
    {
      "slug": "claude",
      "title": "Claude Code config",
      "summary": "Stores Claude Code settings in the repo and links them into ~/.claude during bootstrap.",
      "details": [
        "AI doctor validates the config path."
      ],
      "source": "claude/settings.json"
    },
    {
      "slug": "validation",
      "title": "Validation scripts",
      "summary": "Provides deterministic checks for AI tooling and bootstrap results.",
      "details": [
        "doctor-ai checks binaries, config files, and env vars.",
        "bootstrap-verify checks expected post-bootstrap files and symlinks."
      ],
      "source": "scripts/doctor-ai.sh"
    }
  ],
  "tasks": [
    {
      "name": "ai-doctor",
      "description": "Check AI toolchain binaries/config/env",
      "run": [
        "./scripts/doctor-ai.sh"
      ],
      "source": "mise.toml"
    },
    {
      "name": "bootstrap-verify",
      "description": "Verify expected post-bootstrap config links/files",
      "run": [
        "./scripts/bootstrap-verify.sh"
      ],
      "source": "mise.toml"
    },
    {
      "name": "check",
      "description": "Run core validation for this repo",
      "run": [
        "mise run lint-shell",
        "mise run fmt-check",
        "mise run docs-check",
        "bash -n bootstrap.sh",
        "bash -n bootstrap-omarchy.sh",
        "bash -n bash/bashrc",
        "bash -n bash/install.sh",
        "bash -n k9s/install.sh",
        "bash -n macos/.macos",
        "bash -n theme/install.sh",
        "bash -n glow/install.sh",
        "bash -n scripts/doctor-ai.sh",
        "bash -n scripts/bootstrap-verify.sh",
        "bash -n system/.aliases",
        "bash -n system/.exports",
        "bash -n system/.functions",
        "bash -n system/.path"
      ],
      "source": "mise.toml"
    },
    {
      "name": "docs-build",
      "description": "Regenerate the docs site data from repo sources",
      "run": [
        "python3 ./scripts/generate-docs.py"
      ],
      "source": "mise.toml"
    },
    {
      "name": "docs-check",
      "description": "Ensure generated docs data is up to date",
      "run": [],
      "source": "mise.toml"
    },
    {
      "name": "docs-serve",
      "description": "Serve the docs site locally with mise-managed Python",
      "run": [
        "python3 -m http.server 4173 --directory docs"
      ],
      "source": "mise.toml"
    },
    {
      "name": "doctor",
      "description": "Run mise diagnostics",
      "run": [
        "mise doctor"
      ],
      "source": "mise.toml"
    },
    {
      "name": "fmt-check",
      "description": "Check shell formatting without writing",
      "run": [
        "shfmt -d bootstrap.sh bootstrap-omarchy.sh bash/*.sh k9s/install.sh macos/.macos theme/install.sh glow/install.sh zsh/.zshrc zsh/*.zsh scripts/*.sh"
      ],
      "source": "mise.toml"
    },
    {
      "name": "fmt-shell",
      "description": "Format shell scripts in this repo",
      "run": [
        "shfmt -w bootstrap.sh bootstrap-omarchy.sh bash/*.sh k9s/install.sh macos/.macos theme/install.sh glow/install.sh zsh/.zshrc zsh/*.zsh scripts/*.sh"
      ],
      "source": "mise.toml"
    },
    {
      "name": "lint-shell",
      "description": "Lint shell scripts in this repo",
      "run": [
        "shellcheck bootstrap.sh bootstrap-omarchy.sh bash/*.sh k9s/install.sh macos/.macos theme/install.sh glow/install.sh system/.aliases system/.exports system/.functions system/.path zsh/.zshrc zsh/*.zsh zsh/*.theme scripts/*.sh"
      ],
      "source": "mise.toml"
    },
    {
      "name": "mise-install",
      "description": "Install tools from mise.toml",
      "run": [
        "mise install"
      ],
      "source": "mise.toml"
    },
    {
      "name": "precommit-install",
      "description": "Install git pre-commit hooks",
      "run": [
        "pre-commit install"
      ],
      "source": "mise.toml"
    },
    {
      "name": "precommit-run",
      "description": "Run pre-commit hooks across all files",
      "run": [
        "pre-commit run --all-files"
      ],
      "source": "mise.toml"
    },
    {
      "name": "secrets-scan",
      "description": "Run gitleaks against repository",
      "run": [
        "gitleaks detect --source . --verbose"
      ],
      "source": "mise.toml"
    },
    {
      "name": "verify",
      "description": "Run AI doctor + bootstrap verification",
      "run": [],
      "source": "mise.toml"
    }
  ],
  "bootstrap_links": [
    {
      "source_path": "claude/settings.json",
      "target_path": "~/.claude/settings.json",
      "source": "claude/install.sh"
    },
    {
      "source_path": "claude/themes",
      "target_path": "~/.claude/themes",
      "source": "claude/install.sh"
    },
    {
      "source_path": "codex/config.toml",
      "target_path": "~/.codex/config.toml",
      "source": "codex/install.sh"
    },
    {
      "source_path": "codex/hooks.json",
      "target_path": "~/.codex/hooks.json",
      "source": "codex/install.sh"
    },
    {
      "source_path": "cmux/cmux.json",
      "target_path": "~/.config/cmux/cmux.json",
      "source": "cmux/install.sh"
    },
    {
      "source_path": "ghostty/config",
      "target_path": "~/.config/ghostty/config",
      "source": "ghostty/install.sh"
    },
    {
      "source_path": "glow/catppuccin-mocha.json",
      "target_path": "~/.config/glow/catppuccin-mocha.json",
      "source": "glow/install.sh"
    },
    {
      "source_path": "glow/glow.yml",
      "target_path": "~/.config/glow/glow.yml",
      "source": "glow/install.sh"
    },
    {
      "source_path": "mise/config.toml",
      "target_path": "~/.config/mise/conf.d/00-dotfiles.toml",
      "source": "mise/install.sh"
    },
    {
      "source_path": "theme/starship.toml",
      "target_path": "~/.config/starship.toml",
      "source": "theme/install.sh"
    },
    {
      "source_path": "zed/keymap.json",
      "target_path": "~/.config/zed/keymap.json",
      "source": "zed/install.sh"
    },
    {
      "source_path": "zed/settings.json",
      "target_path": "~/.config/zed/settings.json",
      "source": "zed/install.sh"
    },
    {
      "source_path": "system/.curlrc",
      "target_path": "~/.curlrc",
      "source": "system/install.sh"
    },
    {
      "source_path": "system/.editorconfig",
      "target_path": "~/.editorconfig",
      "source": "system/install.sh"
    },
    {
      "source_path": "git/.gitattributes",
      "target_path": "~/.gitattributes",
      "source": "git/install.sh"
    },
    {
      "source_path": "git/.gitconfig",
      "target_path": "~/.gitconfig",
      "source": "git/install.sh"
    },
    {
      "source_path": "git/.gitignore",
      "target_path": "~/.gitignore",
      "source": "git/install.sh"
    },
    {
      "source_path": "ssh/config",
      "target_path": "~/.ssh/config",
      "source": "ssh/install.sh"
    },
    {
      "source_path": "tmux/.tmux.conf",
      "target_path": "~/.tmux.conf",
      "source": "tmux/install.sh"
    },
    {
      "source_path": "vim/.vimrc",
      "target_path": "~/.vimrc",
      "source": "vim/install.sh"
    },
    {
      "source_path": "zsh/.zshrc",
      "target_path": "~/.zshrc",
      "source": "zsh/install.sh"
    },
    {
      "source_path": "launchagents/com.ibarsi.capslock-control.plist",
      "target_path": "~/Library/LaunchAgents/com.ibarsi.capslock-control.plist",
      "source": "launchagents/install.sh"
    },
    {
      "source_path": "gitmoji/config.json",
      "target_path": "~/Library/Preferences/gitmoji-nodejs/config.json",
      "source": "gitmoji/install.sh"
    }
  ],
  "packages": {
    "taps": [
      "manaflow-ai/cmux"
    ],
    "brews": [
      "coreutils",
      "moreutils",
      "findutils",
      "gnu-sed",
      "wget",
      "vim",
      "grep",
      "openssh",
      "ack",
      "tree",
      "gnupg",
      "git-lfs",
      "git-delta",
      "gh",
      "tmux",
      "commitizen",
      "pre-commit\"       # Deterministic pre-commit checks",
      "gitleaks\"         # Secret scanning for commits/PRs",
      "cloudflared",
      "jq",
      "oath-toolkit",
      "fzf\"              # Interactive fuzzy selector (pick from lists)",
      "fd\"               # Fast file discovery (complements fzf; not a replacement)",
      "zoxide\"           # Better 'cd",
      "bat\"              # Better 'cat",
      "eza\"              # Better 'ls",
      "glow",
      "mise\"             # Universal version manager",
      "starship\"         # Fast, minimal shell prompt",
      "zsh-autosuggestions",
      "zsh-syntax-highlighting",
      "k9s\"              # Kubernetes cluster TUI",
      "doggo\"            # Modern DNS client (dig replacement for daily use)",
      "mtr\"              # Traceroute + ping in one view",
      "iperf3\"           # Throughput testing",
      "teamookla/speedtest/speedtest\" # Ookla network speed testing"
    ],
    "casks": [
      "ghostty\"           # GPU-accelerated terminal (replaces iTerm2)",
      "codex\"             # OpenAI Codex CLI",
      "cmux",
      "1password-cli",
      "1password",
      "discord",
      "docker-desktop",
      "grandperspective",
      "lulu",
      "nordvpn",
      "obsidian",
      "raindropio",
      "tradingview",
      "brave-browser",
      "google-chrome",
      "zed",
      "slack",
      "spotify",
      "bruno",
      "rectangle\"        # Window manager",
      "signal",
      "wireshark-app\"    # GUI packet analysis",
      "raycast\"          # Productivity launcher",
      "claude-code@latest\" # Claude Code CLI (Anthropic)",
      "typewhisper/tap/typewhisper",
      "font-fira-code-nerd-font\" # Nerd font for icons (eza/starship)"
    ]
  }
}
;