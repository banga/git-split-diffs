import { SpannedString } from './SpannedString';

const SPACE_REGEX = /\s/;

function getLineBreaksForString(string: string, width: number): number[] {
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
    let prevIsSpace = SPACE_REGEX.test(string[prevIndex]);

    // Add one word at a time
    while (curIndex < string.length) {
        const isSpace = SPACE_REGEX.test(string[curIndex]);
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

    return lineBreaks;
}

export function* wrapSpannedStringByWord<T>(
    spannedString: SpannedString<T>,
    width: number
): Iterable<SpannedString<T>> {
    // Short circuit if no wrapping is required
    const string = spannedString.getString();
    if (string.length < width) {
        yield spannedString;
        return;
    }

    const lineBreaks = getLineBreaksForString(string, width);
    let prevLineBreak = 0;
    for (const lineBreak of lineBreaks) {
        yield spannedString.slice(prevLineBreak, lineBreak);
        prevLineBreak = lineBreak;
    }
    if (prevLineBreak < string.length - 1) {
        yield spannedString.slice(prevLineBreak);
    }
}
