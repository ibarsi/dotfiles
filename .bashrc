[ -n "$PS1" ] && source ~/.bash_profile;

# OLD

export PATH="$PATH:$HOME/.rvm/bin" # Add RVM to PATH for scripting
[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

export PATH="/usr/local/sbin:$PATH" # Add Homebrew's sbin to PATH (`brew doctor` suggestion)

# NOTE: This was added automatically, not sure how just yet... Going to leave commented, in case I find out its actually needed.
# export PYTHONPATH=.:..:../lib
# if [ -f ~/.git-completion.sh ]; then . ~/.git-completion.sh; fi
# export PS1='\T-\u \w$(__git_ps1 "(%s)")\$ '
