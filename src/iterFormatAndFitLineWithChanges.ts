import { Change, diffWords } from 'diff';
import { Context } from 'vm';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { ThemeColor } from './themes';

const HIGHLIGHT_CHANGE_RATIO = 1.0;

/**
 * Given a pair of lines from a diff, returns more granular changes to the
 * lines. Attempts to only return changes that are useful. The current heuristic
 * is to only show granular changes if the ratio of change to unchanged parts in
 * the line is below a threshold, otherwise the lines have changed substantially
 * enough for the granular diffs to not be useful.
 */
export function getChangesInLine(
    context: Context,
    lineA: string | null,
    lineB: string | null
):
    | { changesA: Change[]; changesB: Change[] }
    | { changesA: null; changesB: null } {
    const { HIGHLIGHT_LINE_CHANGES } = context;

    if (!HIGHLIGHT_LINE_CHANGES || lineA === null || lineB === null) {
        return { changesA: null, changesB: null };
    }

    // Drop the prefix
    const lineTextA = lineA.slice(1);
    const lineTextB = lineB.slice(1);
    const changes = diffWords(lineTextA, lineTextB, {
        ignoreCase: false,
        ignoreWhitespace: false,
    });

    const changesA = [];
    const changesB = [];
    let changedWords = 0;
    let totalWords = 0;
    for (const change of changes) {
        if (change.removed) {
            changedWords += change.count ?? 0;
            changesA.push(change);
        } else if (change.added) {
            changedWords += change.count ?? 0;
            changesB.push(change);
        } else {
            totalWords += change.count ?? 0;
            changesA.push(change);
            changesB.push(change);
        }
    }
    if (changedWords <= totalWords * HIGHLIGHT_CHANGE_RATIO) {
        return { changesA, changesB };
    }
    return { changesA: null, changesB: null };
}

export function* iterFormatAndFitLineWithChanges(
    lineText: string,
    changes: Change[] | null,
    lineWidth: number,
    wrapLines: boolean,
    lineColor: ThemeColor,
    highlightColor: ThemeColor
) {
    let changeIndex = 0;
    let changeStartIndex = 0;
    for (const wrappedLine of iterFitTextToWidth(
        lineText,
        lineWidth,
        wrapLines
    )) {
        if (changes) {
            let highlightedText = '';
            let linePaddingLength = lineWidth;
            let remainingLength = wrappedLine.length;
            while (remainingLength > 0) {
                const change = changes[changeIndex];
                let changeText = change.value.slice(changeStartIndex);
                if (changeText.length > remainingLength) {
                    changeText = changeText.slice(0, remainingLength);
                    changeStartIndex += remainingLength;
                    remainingLength = 0;
                } else {
                    changeIndex++;
                    changeStartIndex = 0;
                }
                remainingLength -= changeText.length;
                highlightedText +=
                    change.added || change.removed
                        ? highlightColor(changeText)
                        : lineColor(changeText);
                linePaddingLength -= changeText.length;
            }
            yield lineColor(' ') +
                highlightedText +
                lineColor(''.padEnd(linePaddingLength));
        } else {
            yield lineColor(' ' + wrappedLine.padEnd(lineWidth));
        }
    }
}
