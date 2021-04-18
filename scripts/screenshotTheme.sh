git config core.pager "./bin/git-split-diffs --color"
git config split-diffs.theme-name "$1"

CWD=$(pwd)
SCRIPT='
tell app "Terminal"
    activate
    do script"'
SCRIPT+="cd $CWD; git show"
SCRIPT+='"
end tell
'
osascript -e "$SCRIPT"

screencapture -x -T 1 "screenshots/$1.png"
