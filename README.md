# Igor's dotfiles

Forked from Mathias Bynens' excellent repo!

https://github.com/mathiasbynens/dotfiles.git

## Steps to Configure (OSX) Environment
1. Install Xcode
2. Install Homebrew.
3. `source brew.sh`
3. `source pip.sh`
4. `source bootstrap.sh`
5. Manually symlink nested files to their appropriate locations (I'll add these steps to `bootstrap.sh` eventually).
6. Manually install global npm packages listed in `npm-ls.txt` (hopefully, this can be automated at some point).
7. `source .macos`
8. Restart.
9. ????
10. PROFIT!!!

### TODOs

* Bootstrap.sh - Implement symlink creation of files nested in folders (currently only creates links one level deep, in the root).
* node-ls.txt - Manually generated (`npm-store`) _and_ installed list of global npm packages. Would be awesome if this could all be automated.
* .vscode/settings.json - This currently needs to be symlinked to VS Code's machine config location (`~/Library/Application\ Support/Code/User/`).
* .vscode/extensions.json - Would be nice to find a way to generate this automatically from currently installed extensions.
