import { Change } from 'diff';
import { Context } from './context';
import { formatAndFitHunkLine } from './formatAndFitHunkLine';
import { T, FormattedString } from './formattedString';
import { getChangesInLines } from './highlightChangesInLine';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { zip } from './zip';

function* iterFormatHunkSplit(
    context: Context,
    fileNameA: string,
    fileNameB: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number,
    lineChanges: ([Change[], Change[]] | [null, null])[]
): Iterable<FormattedString> {
    const { MISSING_LINE_COLOR, BLANK_LINE } = context;

    for (const [lineA, lineB, changes] of zip(
        hunkLinesA,
        hunkLinesB,
        lineChanges
    )) {
        const [changesA, changesB] = changes ?? [];

        const formattedLinesA = formatAndFitHunkLine(
            context,
            fileNameA,
            lineNoA,
            lineA ?? null,
            changesA ?? null
        );
        const formattedLinesB = formatAndFitHunkLine(
            context,
            fileNameB,
            lineNoB,
            lineB ?? null,
            changesB ?? null
        );

        const missingLine = T().appendString(BLANK_LINE, MISSING_LINE_COLOR);

        for (const [formattedLineA, formattedLineB] of zip(
            formattedLinesA,
            formattedLinesB
        )) {
            yield T()
                .appendSpannedString(formattedLineA ?? missingLine)
                .appendSpannedString(formattedLineB ?? missingLine);
        }

        if (lineA !== null) {
            lineNoA++;
        }
        if (lineB !== null) {
            lineNoB++;
        }
    }
}

function* iterFormatHunkUnified(
    context: Context,
    fileNameA: string,
    fileNameB: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number,
    lineChanges: ([Change[], Change[]] | [null, null])[]
): Iterable<FormattedString> {
    for (let indexA = 0, indexB = 0; indexA < hunkLinesA.length; indexA++) {
        const hunkLineA = hunkLinesA[indexA];
        const prefixA = hunkLineA?.slice(0, 1) ?? null;
        const [changesA, changesB] = lineChanges[indexA];

        if (prefixA === null) {
            // Ignore the missing lines we insert to match up indexes
            continue;
        } else if (prefixA === '-') {
            yield* formatAndFitHunkLine(
                context,
                fileNameA,
                lineNoA,
                hunkLineA,
                changesA
            );
            lineNoA++;
        } else {
            // indexA is pointing to an unmodified line, so yield all the
            // inserted lines from indexB up to this line
            while (indexB < indexA) {
                const hunkLineB = hunkLinesB[indexB];
                if (hunkLineB !== null) {
                    yield* formatAndFitHunkLine(
                        context,
                        fileNameB,
                        lineNoB,
                        hunkLineB,
                        changesB
                    );
                    lineNoB++;
                }
                indexB++;
            }

            // now yield the unmodified line, which should be present in both
            yield* formatAndFitHunkLine(
                context,
                fileNameA,
                lineNoA,
                hunkLineA,
                changesA
            );
            lineNoA++;
            lineNoB++;
            indexB++;
        }
    }
}

export function* iterFormatHunk(
    context: Context,
    hunkHeaderLine: string,
    fileNameA: string,
    fileNameB: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number
): Iterable<FormattedString> {
    const { HUNK_HEADER_COLOR, SCREEN_WIDTH, SPLIT_DIFFS } = context;

    yield* iterFitTextToWidth(
        context,
        T().appendString(hunkHeaderLine),
        SCREEN_WIDTH,
        HUNK_HEADER_COLOR
    );

    const changes = getChangesInLines(context, hunkLinesA, hunkLinesB);

    if (SPLIT_DIFFS) {
        yield* iterFormatHunkSplit(
            context,
            fileNameA,
            fileNameB,
            hunkLinesA,
            hunkLinesB,
            lineNoA,
            lineNoB,
            changes
        );
    } else {
        yield* iterFormatHunkUnified(
            context,
            fileNameA,
            fileNameB,
            hunkLinesA,
            hunkLinesB,
            lineNoA,
            lineNoB,
            changes
        );
    }
}
