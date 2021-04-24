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
): [Change[], Change[]] | [null, null] {
    const { HIGHLIGHT_LINE_CHANGES } = context;

    if (!HIGHLIGHT_LINE_CHANGES || lineA === null || lineB === null) {
        return [null, null];
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
    if (changedWords > totalWords * HIGHLIGHT_CHANGE_RATIO) {
        return [null, null];
    }

    return [changesA, changesB];
}

export function getChangesInLines(
    context: Context,
    linesA: (string | null)[],
    linesB: (string | null)[]
): ([Change[], Change[]] | [null, null])[] {
    const changes = [];
    for (const [lineA, lineB] of zip(linesA, linesB)) {
        changes.push(getChangesInLine(context, lineA ?? null, lineB ?? null));
    }
    return changes;
}

export function highlightChangesInLine(
    formattedLine: FormattedString,
    changes: Change[] | null,
    highlightColor: ThemeColor
): void {
    if (!changes) {
        return;
    }

    let lineIndex = 0;
    for (const change of changes) {
        if (change.added || change.removed) {
            formattedLine.addSpan(
                lineIndex,
                lineIndex + change.value.length,
                highlightColor
            );
        }
        lineIndex += change.value.length;
    }
}
