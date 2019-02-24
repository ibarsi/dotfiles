echo "Installing xcode"
xcode-select --install
sudo xcodebuild -license accept

echo "Installing Homebrew"
if test ! $(which brew); then
echo "Installing homebrew..."
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
fi

echo "Installing Git"
brew install git

echo "Generating SSH key"
ssh-keygen -t rsa -f ~/.ssh/id_rsa
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

echo "Installing pip"
curl --silent --show-error --retry 5 https://bootstrap.pypa.io/get-pip.py | sudo python

echo "Installing Python packages"
source ~/Projects/dotfiles/pip.sh

echo "Boostrapping file system"
cd ~/Projects/dotfiles
source bootstrap.sh
cd -

echo "Configuring VS Code"
source ~/Projects/dotfiles/vscode.sh"
ln -s /Users/Igor/Projects/dotfiles/.vscode/settings.json /Users/Igor/Library/Application\ Support/Code/User
ln -s /Users/Igor/Projects/dotfiles/.vscode/keybindings.json /Users/Igor/Library/Application\ Support/Code/User
mkdir /Users/Igor/.config
ln -s /Users/Igor/Projects/dotfiles/.config/pep8 /Users/Igor/.config

echo "Installing NVM"
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash

echo "Applying OSX configurations"
source ~/Projects/dotfiles/.macos

echo "All done! Please restart to apply final changes :)"

