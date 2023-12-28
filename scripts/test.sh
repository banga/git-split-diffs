#!/bin/bash
# A script to quickly generate a random diff and display it. Hopefully this will
# help repro https://github.com/banga/git-split-diffs/issues/16.

set -e
set -x

cd git-test

git init
touch src.ts

choice=$((RANDOM % 2))

case $choice in
0)
    echo 'Appending some lines'
    cat ../src/context.ts >>src.ts
    ;;
1)
    echo 'Deleting half the lines'
    sed -i '' -n 'p;n' src.ts
    ;;
esac

git commit -am "$(date)"
git show

cd -
