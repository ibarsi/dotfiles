" Catppuccin Color Scheme for Vim
" Add this to your .vimrc or source it separately

try
    set termguicolors
    colorscheme catppuccin_mocha
catch
    " Fallback if catppuccin not installed yet
    colorscheme desert
endtry

set background=dark
