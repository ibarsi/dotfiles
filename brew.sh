#!/usr/bin/env bash

# Install command-line tools using Homebrew.

# Make sure we’re using the latest Homebrew.
brew update

# Upgrade any already-installed formulae.
brew upgrade --all

# Install GNU core utilities (those that come with macOS are outdated).
# Don’t forget to add `$(brew --prefix coreutils)/libexec/gnubin` to `$PATH`.
brew install coreutils
ln -s /usr/local/bin/gsha256sum /usr/local/bin/sha256sum

# Install some other useful utilities like `sponge`.
brew install moreutils

# Install GNU `find`, `locate`, `updatedb`, and `xargs`, `g`-prefixed.
brew install findutils

# Install GNU `sed`, overwriting the built-in `sed`.
# brew install gnu-sed --with-default-names

# Install Bash 4.
# Note: don’t forget to add `/usr/local/bin/bash` to `/etc/shells` before
# running `chsh`.
brew install bash
brew tap homebrew/versions
brew install bash-completion2

# Switch to using brew-installed bash as default shell
if ! fgrep -q '/usr/local/bin/bash' /etc/shells; then
    echo '/usr/local/bin/bash' | sudo tee -a /etc/shells;
    chsh -s /usr/local/bin/bash;
fi;

# Install `wget` with IRI support.
brew install wget --with-iri

# Install more recent versions of some macOS tools.
brew install vim --with-override-system-vi
brew install homebrew/dupes/grep
brew install homebrew/dupes/openssh
# brew install homebrew/dupes/screen

# Install other useful binaries.
brew install dark-mode                  # Toggle Mac dark mode
brew install exiv2                      # Read/Write image metadata
brew install git                        # Source control
brew install git-lfs                    # System for managing large files in source control via Git LFS
brew install imagemagick --with-webp    # Create, edit, compose or convert bitmap images
brew install p7zip                      # 7zip for Mac
# brew install pigz                     # Parallel implementation of gzip
brew install speedtest_cli              # Test your internet connection speed
brew install ssh-copy-id                # Add ssh identity to remote host for easy login
brew install testssl                    # Test ssl configuration strength
brew install tree                       # View tree list of folder/file structures
brew install webkit2png                 # Take full screenshots of a webpage
# brew install zopfli                   # Ability to use Zopfli compression
brew install gnupg gnupg2               # Encrypt and sign data/communication via GnuPG

# Development
brew install python                     # Python language
brew install nginx                      # High performance load balancer, web server and reverse proxy
brew install node                       # Server-side JavaScript
brew install mongodb                    # NoSQL database
brew install watchman                   # File watching tool

# Applications
brew cask install iterm2                # Improved Mac Terminal
brew cask install opera                 # Opera browser
brew cask install google-chrome         # Chrome browser
brew cask install firefox               # Firefox browser
brew cask install visual-studio-code    # VS Code text editor
brew cask install brackets              # Brackets text editor
brew cask install slack                 # IM team chat application
brew cask install spotify               # Music subsciption service/player
brew cask install postman               # API request compose/debugger

# Remove outdated versions from the cellar.
brew cleanup
brew cask cleanup
