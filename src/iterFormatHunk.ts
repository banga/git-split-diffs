import { Context } from './context';
import {
    formatAndFitHunkLine,
    formatAndFitHunkLinePair,
} from './formatAndFitHunkLine';
import { T, FormattedString } from './formattedString';
import { iterFitTextToWidth } from './iterFitTextToWidth';

function* iterFormatHunkSplit(
    context: Context,
    fileNameA: string,
    fileNameB: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number
): Iterable<FormattedString> {
    const { INSERTED_LINE_COLOR, DELETED_LINE_COLOR, BLANK_LINE } = context;

    for (let i = 0; i < hunkLinesA.length || i < hunkLinesB.length; i++) {
        const lineA = i < hunkLinesA.length ? hunkLinesA[i] : null;
        const lineB = i < hunkLinesB.length ? hunkLinesB[i] : null;

        const { formattedLinesA, formattedLinesB } = formatAndFitHunkLinePair(
            context,
            fileNameA,
            lineNoA,
            lineA,
            fileNameB,
            lineNoB,
            lineB
        );

        let j = 0;
        while (j < formattedLinesA.length && j < formattedLinesB.length) {
            yield T()
                .appendSpannedString(formattedLinesA[j])
                .appendSpannedString(formattedLinesB[j]);
            j++;
        }
        while (j < formattedLinesA.length) {
            yield T()
                .appendSpannedString(formattedLinesA[j])
                .appendString(BLANK_LINE, INSERTED_LINE_COLOR);
            j++;
        }
        while (j < formattedLinesB.length) {
            yield T()
                .appendString(BLANK_LINE, DELETED_LINE_COLOR)
                .appendSpannedString(formattedLinesB[j]);
            j++;
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
    lineNoB: number
): Iterable<FormattedString> {
    for (let indexA = 0, indexB = 0; indexA < hunkLinesA.length; indexA++) {
        const hunkLineA = hunkLinesA[indexA];
        const prefixA = hunkLineA?.slice(0, 1) ?? null;

        if (prefixA === null) {
            // Ignore the missing lines we insert to match up indexes
            continue;
        } else if (prefixA === '-') {
            yield* formatAndFitHunkLine(
                context,
                fileNameA,
                lineNoA,
                hunkLineA,
                null
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
                        null
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
                null
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

    if (SPLIT_DIFFS) {
        yield* iterFormatHunkSplit(
            context,
            fileNameA,
            fileNameB,
            hunkLinesA,
            hunkLinesB,
            lineNoA,
            lineNoB
        );
    } else {
        yield* iterFormatHunkUnified(
            context,
            fileNameA,
            fileNameB,
            hunkLinesA,
            hunkLinesB,
            lineNoA,
            lineNoB
        );
    }
}
