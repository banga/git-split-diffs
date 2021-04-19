const SPACE_REGEX = /\s/;

export function wrapLineByWord(text: string, width: number): string[] {
    // Short circuit if no wrapping is required
    if (text.length <= width) {
        return [text];
    }

    const lineBreaks: number[] = [];
    let budget = width;
    let curLineEnd = 0;

    function flushLine() {
        lineBreaks.push(curLineEnd);
        budget = width;
    }

    function pushWord(startIndex: number, endIndex: number) {
        const wordLength = endIndex - startIndex;
        // word can fit on current line
        if (wordLength <= budget) {
            curLineEnd = endIndex;
            budget -= wordLength;
            return;
        }

        // word can fit in the new line, so start a new one
        if (wordLength <= width) {
            flushLine();
            curLineEnd = endIndex;
            budget -= wordLength;
            return;
        }

        // word is too long to fit in any line, so lets break it and push each
        // part
        while (startIndex < endIndex) {
            if (budget === 0) {
                flushLine();
            }
            let remainingLengthInLine = Math.min(budget, endIndex - startIndex);
            curLineEnd += remainingLengthInLine;
            startIndex += remainingLengthInLine;
            flushLine();
        }
    }

    let prevIndex = 0;
    let curIndex = 1;
    let prevIsSpace = SPACE_REGEX.test(text[prevIndex]);

    // Add one word at a time
    while (curIndex < text.length) {
        const isSpace = SPACE_REGEX.test(text[curIndex]);
        if (isSpace) {
            pushWord(prevIndex, curIndex);
            prevIndex = curIndex;
        } else if (prevIsSpace) {
            pushWord(prevIndex, curIndex);
            prevIndex = curIndex;
        }
        prevIsSpace = isSpace;
        curIndex++;
    }
    if (prevIndex < curIndex) {
        pushWord(prevIndex, curIndex);
    }
    if (budget < width) {
        flushLine();
    }

    const lines = [];
    let prevLineBreak = 0;
    for (const lineBreak of lineBreaks) {
        lines.push(text.slice(prevLineBreak, lineBreak));
        prevLineBreak = lineBreak;
    }
    if (prevLineBreak < text.length - 1) {
        lines.push(text.slice(prevLineBreak));
    }

    return lines;
}
