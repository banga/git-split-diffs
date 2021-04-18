import { Context } from './context';
import {
    formatAndFitHunkLine,
    formatAndFitHunkLinePair,
} from './formatAndFitHunkLine';
import { iterFitTextToWidth } from './iterFitTextToWidth';

function* iterFormatHunkSplit(
    context: Context,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number
) {
    const { INSERTED_LINE_COLOR, DELETED_LINE_COLOR, BLANK_LINE } = context;

    for (let i = 0; i < hunkLinesA.length || i < hunkLinesB.length; i++) {
        const lineA = i < hunkLinesA.length ? hunkLinesA[i] : null;
        const lineB = i < hunkLinesB.length ? hunkLinesB[i] : null;

        const { formattedLinesA, formattedLinesB } = formatAndFitHunkLinePair(
            context,
            lineNoA,
            lineA,
            lineNoB,
            lineB
        );

        let j = 0;
        while (j < formattedLinesA.length && j < formattedLinesB.length) {
            yield formattedLinesA[j] + formattedLinesB[j];
            j++;
        }
        while (j < formattedLinesA.length) {
            yield formattedLinesA[j] + INSERTED_LINE_COLOR(BLANK_LINE);
            j++;
        }
        while (j < formattedLinesB.length) {
            yield DELETED_LINE_COLOR(BLANK_LINE) + formattedLinesB[j];
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
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number
) {
    for (let indexA = 0, indexB = 0; indexA < hunkLinesA.length; indexA++) {
        const hunkLineA = hunkLinesA[indexA];
        const prefixA = hunkLineA?.slice(0, 1) ?? null;

        if (prefixA === null) {
            // Ignore the missing lines we insert to match up indexes
            continue;
        } else if (prefixA === '-') {
            yield* formatAndFitHunkLine(context, lineNoA, hunkLineA, null);
            lineNoA++;
        } else {
            // indexA is pointing to an unmodified line, so yield all the
            // inserted lines from indexB up to this line
            while (indexB < indexA) {
                const hunkLineB = hunkLinesB[indexB];
                if (hunkLineB !== null) {
                    yield* formatAndFitHunkLine(
                        context,
                        lineNoB,
                        hunkLineB,
                        null
                    );
                    lineNoB++;
                }
                indexB++;
            }

            // now yield the unmodified line, which should be present in both
            yield* formatAndFitHunkLine(context, lineNoA, hunkLineA, null);
            lineNoA++;
            lineNoB++;
            indexB++;
        }
    }
}

export function* iterFormatHunk(
    context: Context,
    hunkHeaderLine: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number
) {
    const {
        HUNK_HEADER_COLOR,
        SCREEN_WIDTH,
        WRAP_LINES,
        SPLIT_DIFFS,
    } = context;

    for (const line of iterFitTextToWidth(
        hunkHeaderLine,
        SCREEN_WIDTH,
        WRAP_LINES
    )) {
        yield HUNK_HEADER_COLOR(line.padEnd(SCREEN_WIDTH));
    }

    if (SPLIT_DIFFS) {
        yield* iterFormatHunkSplit(
            context,
            hunkLinesA,
            hunkLinesB,
            lineNoA,
            lineNoB
        );
    } else {
        yield* iterFormatHunkUnified(
            context,
            hunkLinesA,
            hunkLinesB,
            lineNoA,
            lineNoB
        );
    }
}
