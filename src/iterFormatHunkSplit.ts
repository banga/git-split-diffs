import { Change } from 'diff';
import { Context } from './context';
import { formatAndFitHunkLine } from './formatAndFitHunkLine';
import { T, FormattedString } from './formattedString';
import { zip, zipAsync } from './zip';
import { HunkPart } from './iterFormatHunk';

export async function* iterFormatHunkSplit(
    context: Context,
    hunkParts: HunkPart[],
    lineChanges: (Change[] | null)[]
): AsyncIterable<FormattedString> {
    const { MISSING_LINE_COLOR } = context;
    const lineWidth = Math.floor(context.SCREEN_WIDTH / hunkParts.length);
    const blankLine = ''.padStart(lineWidth);

    const lineNos = hunkParts.map((part) => part.startLineNo);
    const numDeletes = hunkParts.map(() => 0);

    for (const [changes, ...hunkPartLines] of zip(
        lineChanges,
        ...hunkParts.map((part) => part.lines)
    )) {
        // Count deletions and adjust line numbers for previous deletions
        hunkPartLines.forEach((hunkPartLine, i) => {
            const prefix = hunkPartLine?.slice(0, 1) ?? null;
            if (prefix === '-') {
                numDeletes[i]++;
            } else if (prefix === '+') {
                lineNos[i] -= numDeletes[i];
                numDeletes[i] = 0;
            }
        });

        const formattedLineIterables = hunkPartLines.map((hunkPartLine, i) =>
            formatAndFitHunkLine(
                context,
                lineWidth,
                hunkParts[i].fileName,
                lineNos[i],
                hunkPartLine ?? null,
                changes ?? null
            )
        );

        const missingLine = T().appendString(blankLine, MISSING_LINE_COLOR);

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
