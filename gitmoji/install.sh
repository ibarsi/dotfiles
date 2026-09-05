#!/usr/bin/env bash
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

case "$(uname -s)" in
Darwin)
	GITMOJI_CONFIG_DIR="$HOME/Library/Preferences/gitmoji-nodejs"
	;;
Linux)
	GITMOJI_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/gitmoji-nodejs"
	;;
*)
	echo "Unsupported operating system for Gitmoji configuration: $(uname -s)" >&2
	exit 1
	;;
esac

mkdir -p "$GITMOJI_CONFIG_DIR"
ln -sf "$DOTFILES_ROOT/gitmoji/config.json" "$GITMOJI_CONFIG_DIR/config.json"
