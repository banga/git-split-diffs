import { Change, diffWords } from 'diff';
import { Context } from './context';
import { FormattedString } from './formattedString';
import { ThemeColor } from './themes';
import { zip } from './zip';

const HIGHLIGHT_CHANGE_RATIO = 1.0;

/**
 * Given a pair of lines from a diff, returns more granular changes to the
 * lines. Attempts to only return changes that are useful. The current heuristic
 * is to only show granular changes if the ratio of change to unchanged parts in
 * the line is below a threshold, otherwise the lines have changed substantially
 * enough for the granular diffs to not be useful.
 */
function getChangesInLine(
    context: Context,
    lineA: string | null,
    lineB: string | null
): Change[] | null {
    const { HIGHLIGHT_LINE_CHANGES } = context;

    if (!HIGHLIGHT_LINE_CHANGES || lineA === null || lineB === null) {
        return null;
    }

    // Drop the prefix
    const lineTextA = lineA.slice(1);
    const lineTextB = lineB.slice(1);
    const changes = diffWords(lineTextA, lineTextB, {
        ignoreCase: false,
        ignoreWhitespace: false,
    });

    // Count how many words changed vs total words. Note that a replacement gets
    // double counted.
    let changedWords = 0;
    let totalWords = 0;
    for (const { added, removed, count } of changes) {
        if (added || removed) {
            changedWords += count ?? 0;
        } else {
            totalWords += count ?? 0;
        }
    }
    if (changedWords > totalWords * HIGHLIGHT_CHANGE_RATIO) {
        return null;
    }

    return changes;
}

export function getChangesInLines(
    context: Context,
    linesA: (string | null)[],
    linesB: (string | null)[]
): Array<Change[] | null> {
    const changes = [];
    for (const [lineA, lineB] of zip(linesA, linesB)) {
        changes.push(getChangesInLine(context, lineA ?? null, lineB ?? null));
    }
    return changes;
}

export function highlightChangesInLine(
    context: Context,
    linePrefix: string,
    formattedLine: FormattedString,
    changes: Change[] | null
): void {
    if (!changes) {
        return;
    }

    const { DELETED_WORD_COLOR, INSERTED_WORD_COLOR, UNMODIFIED_LINE_COLOR } =
        context;

    let wordColor: ThemeColor;
    switch (linePrefix) {
        case '-':
            wordColor = DELETED_WORD_COLOR;
            break;
        case '+':
            wordColor = INSERTED_WORD_COLOR;
            break;
        default:
            wordColor = UNMODIFIED_LINE_COLOR; // This is actually not used
            break;
    }

    let lineIndex = 0;
    for (const change of changes) {
        // Skip changes that would not be present in the line
        if (change.removed && linePrefix === '+') {
            continue;
        }
        if (change.added && linePrefix === '-') {
            continue;
        }
        if (change.removed || change.added) {
            formattedLine.addSpan(
                lineIndex,
                lineIndex + change.value.length,
                wordColor
            );
        }
        lineIndex += change.value.length;
    }
}
