# system/auto-update.zsh - Keep dotfiles in sync

function check_dotfiles_update() {
    # Only check once every 24 hours
    local last_check_file="$HOME/.dotfiles_last_update"
    local current_time=$(date +%s)
    local one_day=86400

    if [ -f "$last_check_file" ]; then
        local last_check=$(cat "$last_check_file")
        if (( current_time - last_check < one_day )); then
            return
        fi
    fi

    echo -n "Checking for dotfiles updates... "
    # Assuming the repo is at ~/dotfiles
    if [ -d "$HOME/dotfiles" ]; then
        (cd "$HOME/dotfiles" && git fetch origin master -q)
        local local_hash=$(cd "$HOME/dotfiles" && git rev-parse HEAD)
        local remote_hash=$(cd "$HOME/dotfiles" && git rev-parse origin/master)

        if [ "$local_hash" != "$remote_hash" ]; then
            echo "New version available! Run 'reload-dotfiles' to update."
        else
            echo "Up to date."
        fi
    fi

    echo "$current_time" > "$last_check_file"
}

# Run check in background (non-blocking)
check_dotfiles_update &!
