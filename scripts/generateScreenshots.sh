rows=$(tput lines)
window_id=$(osascript -e 'tell app "iTerm" to id of window 1') 

for theme in "$@"
do
    git config --replace-all split-diffs.theme-name "$theme"
    clear
    git --no-pager show 5a00d16095a255b57c762289fa434e18088b956b src/iterSideBySideDiffs.ts | ./bin/git-split-diffs --color | head -n $(($rows-1))
    screencapture -x -T 1 -l $window_id "screenshots/$theme.png"
    open -a ImageOptim "screenshots/$theme.png"
done

git config --unset split-diffs.theme-name

