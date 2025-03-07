#!/bin/bash

echo "Set default shell to bash"
chsh -s /bin/bash
exec bash

echo "Installing xcode"
xcode-select --install

echo "Installing Homebrew"
if test ! $(which brew); then
echo "Installing homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/igorbarsi/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

echo "Installing Git"
brew install git

echo "Generating SSH key"
ssh-keygen -t rsa -f ~/.ssh/id_rsa
eval "$(ssh-agent -s)"
ssh-add
cat ~/.ssh/id_rsa.pub | pbcopy

echo "Generated SSH public key has been copied. Please add it to Github before proceeding \n"
echo "https://github.com/account/ssh \n"
read -p "Press [Enter] once complete..."

echo "Setup Dotfiles"
mkdir ~/Projects
git clone git@github.com:ibarsi/dotfiles.git ~/Projects/dotfiles

echo "Installing Homebrew packages"
source ~/Projects/dotfiles/brew.sh

echo "Generating GPG key"
gpg --gen-key
gpg --list-secret-keys --keyid-format LONG

echo "Please copy the long key"
read -p "Press [Enter] once complete..."
pbpaste | gpg --armor --export | pbcopy

echo "Generated GPG key has been copied. Please add it to Github before proceeding \n"
echo "https://github.com/account/ssh \n"
read -p "Press [Enter] once complete..."

echo "Boostrapping file system"
cd ~/Projects/dotfiles
source bootstrap.sh
cd -

echo "Configuring VS Code"
$HOME/Projects/dotfiles/vscode.sh
ln -s ~/Projects/dotfiles/.vscode/settings.json ~/Library/Application\ Support/Code/User
ln -s ~/Projects/dotfiles/.vscode/keybindings.json ~/Library/Application\ Support/Code/User

echo "Installing NVM"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

echo "Applying OSX configurations"
source ~/Projects/dotfiles/.macos

echo "All done! Please restart to apply final changes 💃"
