#!/usr/bin/env bash

git pull;

# Remove all files that exist in current directory from root and create symlinks to replace them.
function doIt() {
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

    cd ~

    # WARNING: Not ready, needs more work.
    # find $DIR -mindepth 1 -maxdepth 2 -type f \( -iname "*" ! -iname ".DS_Store" ! -iname "README.md" ! -iname "bootstrap.sh" \) -not -path "./.git/*" | tail -n +2 | cut -c 3- | while read file; do
    #     echo "Removing $file from $HOME."
    #     rm "$file"
    #     echo "Linking $file from $DIR to $HOME."
    #     # TODO: Does not create directory for link if it is missing.
    #     ln -s "$DIR/$file" .
    # done

    cd $DIR

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
