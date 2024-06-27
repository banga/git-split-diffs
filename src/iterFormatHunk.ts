import { Change } from 'diff';
import { Context } from './context';
import { formatAndFitHunkLine } from './formatAndFitHunkLine';
import { T, FormattedString } from './formattedString';
import { getChangesInLines } from './highlightChangesInLine';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { zip, zipAsync } from './zip';

async function* iterFormatHunkSplit(
    context: Context,
    fileNameA: string,
    fileNameB: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number,
    lineChanges: (Change[] | null)[]
): AsyncIterable<FormattedString> {
    const { MISSING_LINE_COLOR, BLANK_LINE } = context;

    for (const [lineA, lineB, changes] of zip(
        hunkLinesA,
        hunkLinesB,
        lineChanges
    )) {
        const formattedLinesA = formatAndFitHunkLine(
            context,
            fileNameA,
            lineNoA,
            lineA ?? null,
            changes ?? null
        );
        const formattedLinesB = formatAndFitHunkLine(
            context,
            fileNameB,
            lineNoB,
            lineB ?? null,
            changes ?? null
        );

        const missingLine = T().appendString(BLANK_LINE, MISSING_LINE_COLOR);

        for await (const [formattedLineA, formattedLineB] of zipAsync(
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

async function* iterFormatHunkUnified(
    context: Context,
    fileNameA: string,
    fileNameB: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number,
    lineChanges: (Change[] | null)[]
): AsyncIterable<FormattedString> {
    let indexA = 0,
        indexB = 0;
    while (indexA < hunkLinesA.length) {
        const hunkLineA = hunkLinesA[indexA];
        const prefixA = hunkLineA?.slice(0, 1) ?? null;
        const changes = lineChanges[indexA];

        switch (prefixA) {
            case null:
                // Ignore the missing lines we insert to match up indexes
                break;
            case '-':
                yield* formatAndFitHunkLine(
                    context,
                    fileNameA,
                    lineNoA,
                    hunkLineA,
                    changes
                );
                lineNoA++;
                break;
            default:
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
                            changes
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
                    changes
                );
                lineNoA++;
                lineNoB++;
                indexB++;
        }

        indexA++;
    }

    // yield any remaining lines in hunk B, which can happen if there were more
    // insertions at the end of the hunk
    while (indexB < hunkLinesB.length) {
        const hunkLineB = hunkLinesB[indexB];
        if (hunkLineB !== null) {
            yield* formatAndFitHunkLine(
                context,
                fileNameB,
                lineNoB,
                hunkLineB,
                lineChanges[indexB]
            );
            lineNoB++;
        }
        indexB++;
    }
}

export async function* iterFormatHunk(
    context: Context,
    hunkHeaderLine: string,
    fileNameA: string,
    fileNameB: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number
): AsyncIterable<FormattedString> {
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
