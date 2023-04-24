import { SpannedString } from './SpannedString';

const SPACE_REGEX = /\s/;

/**
 * Returns an array of indices where the string should be broken to fit in lines
 * of up to `width` characters.
 *
 * This handles double-width CJK characters
 * (https://en.wikipedia.org/wiki/Duospaced_font), and will break words if they
 * cannot fit in a line.
 */
function getLineBreaksForString(
    string: string,
    charWidths: number[],
    width: number
): number[] {
    const lineBreaks: number[] = [];
    let budget = width;
    let curLineEnd = 0;

    function flushLine() {
        lineBreaks.push(curLineEnd);
        budget = width;
    }

    function pushWord(startIndex: number, endIndex: number) {
        let wordWidth = 0;
        for (let i = startIndex; i < endIndex; i++) {
            wordWidth += charWidths[i];
        }

        // word can fit on current line
        if (wordWidth <= budget) {
            curLineEnd = endIndex;
            budget -= wordWidth;
            return;
        }

        // word can fit in the new line, so start a new one
        if (wordWidth <= width) {
            flushLine();
            curLineEnd = endIndex;
            budget -= wordWidth;
            return;
        }

        // word is too long to fit in any line, so lets break it and push each
        // part
        for (let i = startIndex; i < endIndex; i++) {
            const charLength = charWidths[i];
            if (budget < charLength) {
                flushLine();
            }
            budget -= charLength;
            curLineEnd++;
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
    const charWidths = spannedString.getCharWidths();
    const stringWidth = charWidths.reduce((a, b) => a + b, 0);
    if (stringWidth < width) {
        yield spannedString;
        return;
    }

    const lineBreaks = getLineBreaksForString(string, charWidths, width);
    let prevLineBreak = 0;
    for (const lineBreak of lineBreaks) {
        yield spannedString.slice(prevLineBreak, lineBreak);
        prevLineBreak = lineBreak;
    }
    if (prevLineBreak < stringWidth - 1) {
        yield spannedString.slice(prevLineBreak);
    }
}
