#!/usr/bin/env bash

# Install command-line tools using Homebrew.

# Make sure we’re using the latest Homebrew.
brew update

# Upgrade any already-installed formulae.
brew upgrade

# Install GNU core utilities (those that come with macOS are outdated).
# Don’t forget to add `$(brew --prefix coreutils)/libexec/gnubin` to `$PATH`.
brew install coreutils

# Install some other useful utilities like `sponge`.
brew install moreutils

# Install GNU `find`, `locate`, `updatedb`, and `xargs`, `g`-prefixed.
brew install findutils

# Install GNU `sed`.
brew install gnu-sed

# Install Bash 4.
# Note: don’t forget to add `/usr/local/bin/bash` to `/etc/shells` before
# running `chsh`.
brew install bash
brew install bash-completion2

# Switch to using brew-installed bash as default shell
if ! fgrep -q '/usr/local/bin/bash' /etc/shells; then
    echo '/usr/local/bin/bash' | sudo tee -a /etc/shells;
    chsh -s /usr/local/bin/bash;
fi;

# Install `wget`.
brew install wget

# Install more recent versions of some macOS tools.
brew install vim
brew install grep
brew install openssh

# Install other useful binaries.
brew install ack                        # Beyond `grep`
brew install speedtest_cli              # Test your internet connection speed
brew install ssh-copy-id                # Add ssh identity to remote host for easy login
brew install testssl                    # Test ssl configuration strength
brew install tree                       # View tree list of folder/file structures
brew install gnupg gnupg2               # Encrypt and sign data/communication via GnuPG

# Fonts
brew tap homebrew/cask-fonts
brew install --cask font-fira-code      # Fira (Ligatures)

# Development
brew install git-lfs                    # System for managing large files in source control via Git LFS
git lfs install

brew install nginx                      # High performance load balancer, web server and reverse proxy
brew install gh                         # GitHub CLI
brew install --cask docker              # Docker

# Applications
brew install --cask iterm2 \            # Improved Mac Terminal
    brave-browser /                     # Brave browser
    google-chrome /                     # Chrome browser
    firefox /                           # Firefox browser
    visual-studio-code /                # VS Code text editor
    slack /                             # IM team chat application
    spotify /                           # Music subsciption service/player
    postman /                           # API request compose/debugger
    spectacle /                         # Keyboard shortcuts for window sizing
    licecap                             # GIF screen capture

# Remove outdated versions from the cellar.
brew cleanup
brew cask cleanup
