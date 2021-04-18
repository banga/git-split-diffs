git config core.pager "./bin/git-split-diffs --color"
git config split-diffs.theme-name "$1"

clear
git show
screencapture -x -T 1 "screenshots/$1.png"
