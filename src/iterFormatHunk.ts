import { Context } from './context';
import { T, FormattedString } from './formattedString';
import { getChangesInLines } from './highlightChangesInLine';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { iterFormatHunkSplit } from './iterFormatHunkSplit';
import {
    iterFormatCombinedDiffHunkUnified,
    iterFormatUnifiedDiffHunkUnified,
} from './iterFormatHunkUnified';

export type HunkPart = {
    fileName: string;
    startLineNo: number;
    lines: (string | null)[];
};

export async function* iterFormatHunk(
    context: Context,
    diffType: 'unified-diff' | 'combined-diff',
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
    } else if (diffType === 'unified-diff') {
        yield* iterFormatUnifiedDiffHunkUnified(context, hunkParts, changes);
    } else if (diffType === 'combined-diff') {
        yield* iterFormatCombinedDiffHunkUnified(context, hunkParts, changes);
    }
}
