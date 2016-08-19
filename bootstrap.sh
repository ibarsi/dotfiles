#!/usr/bin/env bash

git pull;

# Remove all files that exist in current directory from root and create symlinks to replace them.
function doIt() {
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

    # Currently only links one level deep :(
    find . -mindepth 1 -maxdepth 1 -type f \( -iname "*" ! -iname ".DS_Store" ! -iname "README.md" ! -iname "bootstrap.sh" \) -not -path "./.git/*" | sed 's#.*/##' | while read file; do
        echo "Removing $file from $HOME."
        rm "$HOME/$file"

        # TODO: Does not create directory for link if it is missing.
        echo "Linking $file from $DIR to $HOME."
        ln -s "$DIR/$file" $HOME/.
    done

    source ~/.bash_profile;
}

if [ "$1" == "--force" -o "$1" == "-f" ]; then
    doIt;
else
    read -p "This may overwrite existing files in your home directory. Are you sure? (y/n) " -n 1;
    echo "";
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        doIt;
    fi;
fi;
unset doIt;
