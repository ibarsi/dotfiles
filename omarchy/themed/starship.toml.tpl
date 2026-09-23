# Starship prompt, rendered from the active Omarchy theme's colors.toml.
# omarchy-theme-set-templates writes this to
# ~/.local/state/omarchy/current/theme/starship.toml on every theme switch,
# and bash/bashrc points STARSHIP_CONFIG at that file.
#
# The accent token below is the theme's signature colour, which has no ANSI
# slot. Anything that can live on the 16-colour palette should use a colour
# name instead -- the terminal already swaps those with the theme. Note that
# the renderer substitutes tokens in comments too, so don't write one here.
add_newline = true
command_timeout = 200
format = "${custom.omarchy}[$directory$git_branch$git_status]($style)$character"

[custom.omarchy]
when = 'grep -q "^ID=omarchy$" /etc/os-release'
# U+E900 is the Omarchy logo in the icon font installed on Omen.
symbol = " "
format = '[$symbol]($style)'
style = "bold {{ accent }}"

[character]
error_symbol = "[✗](bold {{ accent }})"
success_symbol = "[❯](bold {{ accent }})"

[directory]
truncation_length = 2
truncation_symbol = "…/"
repo_root_style = "bold {{ accent }}"
repo_root_format = "[$repo_root]($repo_root_style)[$path]($style)[$read_only]($read_only_style) "

[git_branch]
format = "[$branch]($style) "
style = "italic {{ accent }}"

[git_status]
format     = '[$all_status]($style)'
style      = "{{ accent }}"
ahead      = "⇡${count} "
diverged   = "⇕⇡${ahead_count}⇣${behind_count} "
behind     = "⇣${count} "
conflicted = " "
up_to_date = " "
untracked  = "? "
modified   = " "
stashed    = ""
staged     = ""
renamed    = ""
deleted    = ""
