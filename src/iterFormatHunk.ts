import { Change } from 'diff';
import { Context } from './context';
import { formatAndFitHunkLine } from './formatAndFitHunkLine';
import { T, FormattedString } from './formattedString';
import { getChangesInLines } from './highlightChangesInLine';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { zip, zipAsync } from './zip';

export type HunkPart = {
    fileName: string;
    startLineNo: number;
    lines: (string | null)[];
};

async function* iterFormatHunkSplit(
    context: Context,
    hunkParts: HunkPart[],
    lineChanges: (Change[] | null)[]
): AsyncIterable<FormattedString> {
    const { MISSING_LINE_COLOR, BLANK_LINE } = context;

    const lineNos = hunkParts.map((part) => part.startLineNo);

    for (const [changes, ...hunkPartLines] of zip(
        lineChanges,
        ...hunkParts.map((part) => part.lines)
    )) {
        const formattedLineIterables = hunkPartLines.map((hunkPartLine, i) =>
            formatAndFitHunkLine(
                context,
                hunkParts[i].fileName,
                lineNos[i],
                hunkPartLine ?? null,
                changes ?? null
            )
        );

        const missingLine = T().appendString(BLANK_LINE, MISSING_LINE_COLOR);

        for await (const formattedLines of zipAsync(
            ...formattedLineIterables
        )) {
            const formattedLine = T();
            for (const line of formattedLines) {
                formattedLine.appendSpannedString(line ?? missingLine);
            }
            yield formattedLine;
        }

        hunkPartLines.forEach((hunkPartLine, i) => {
            if (hunkPartLine !== null && hunkPartLine !== undefined) {
                lineNos[i]++;
            }
        });
    }
}

async function* iterFormatHunkUnified(
    context: Context,
    hunkParts: HunkPart[],
    lineChanges: (Change[] | null)[]
): AsyncIterable<FormattedString> {
    let [{ fileName: fileNameA, lines: hunkLinesA }, ...restHunkParts] =
        hunkParts;
    let [indexA, ...restIndexes] = hunkParts.map(() => 0);
    let [lineNoA, ...restLineNos] = hunkParts.map(
        ({ startLineNo }) => startLineNo
    );

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
                for (let i = 0; i < restIndexes.length; i++) {
                    let indexB = restIndexes[i];
                    let lineNoB = restLineNos[i];
                    let hunkPartB = restHunkParts[i];
                    while (indexB < indexA) {
                        const hunkLineB = hunkPartB.lines[indexB];
                        if (hunkLineB !== null) {
                            yield* formatAndFitHunkLine(
                                context,
                                hunkPartB.fileName,
                                lineNoB,
                                hunkLineB,
                                lineChanges[indexB]
                            );
                            lineNoB++;
                        }
                        indexB++;
                    }
                    restIndexes[i] = indexB;
                    restLineNos[i] = lineNoB;
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
                for (let i = 0; i < restIndexes.length; i++) {
                    restIndexes[i]++;
                    restLineNos[i]++;
                }
        }

        indexA++;
    }

    // yield any remaining lines in hunk B, which can happen if there were more
    // insertions at the end of the hunk
    for (let i = 0; i < restIndexes.length; i++) {
        let indexB = restIndexes[i];
        let lineNoB = restLineNos[i];
        let hunkPartB = restHunkParts[i];
        while (indexB < hunkPartB.lines.length) {
            const hunkLineB = hunkPartB.lines[indexB];
            if (hunkLineB !== null) {
                yield* formatAndFitHunkLine(
                    context,
                    restHunkParts[i].fileName,
                    lineNoB,
                    hunkLineB,
                    lineChanges[indexB]
                );
                lineNoB++;
            }
            indexB++;
        }
    }
}

export async function* iterFormatHunk(
    context: Context,
    hunkHeaderLine: string,
    hunkParts: HunkPart[]
): AsyncIterable<FormattedString> {
    const { HUNK_HEADER_COLOR, SCREEN_WIDTH, SPLIT_DIFFS } = context;

    yield* iterFitTextToWidth(
        context,
        T().appendString(hunkHeaderLine),
        SCREEN_WIDTH,
        HUNK_HEADER_COLOR
    );

    // TODO: Fix to handle multiple hunk parts
    const changes = getChangesInLines(
        context,
        hunkParts[0].lines,
        hunkParts[1].lines
    );

    if (SPLIT_DIFFS) {
        yield* iterFormatHunkSplit(context, hunkParts, changes);
    } else {
        yield* iterFormatHunkUnified(context, hunkParts, changes);
    }
}
