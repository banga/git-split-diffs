git config core.pager "./bin/git-split-diffs --color"
git config split-diffs.theme-name "$1"

# CWD=$(pwd)
# SCRIPT='
# tell app "Finder"
#     set b to bounds of window of desktop
# end tell
# tell app "Terminal"
#     activate
#     do script"'
# SCRIPT+="cd $CWD; git show"
# SCRIPT+='"
#     set the bounds of the front window to b
# end tell
# '
# osascript -e "$SCRIPT"

open -a Terminal

screencapture -x -T 1 "screenshots/$1.png"
