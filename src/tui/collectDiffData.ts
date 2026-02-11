import { Readable } from 'stream';
import { Context } from '../context';
import { applyFormatting } from '../formattedString';
import { iterlinesFromReadable } from '../iterLinesFromReadable';
import { iterReplaceTabsWithSpaces } from '../iterReplaceTabsWithSpaces';
import {
    DiffEvent,
    iterSideBySideDiffsWithEvents,
} from '../iterSideBySideDiffs';

export interface DiffFile {
    fileNameA: string;
    fileNameB: string;
    displayName: string;
    startLineIndex: number;
}

export interface DiffData {
    files: DiffFile[];
    allRenderedLines: string[];
    fileBoundaries: number[];
}

function getDisplayName(fileNameA: string, fileNameB: string): string {
    if (!fileNameA) return fileNameB || '(unknown)';
    if (!fileNameB) return fileNameA;
    if (fileNameA === fileNameB) return fileNameA;
    return `${fileNameA} → ${fileNameB}`;
}

export async function collectDiffData(
    context: Context,
    input: Readable
): Promise<DiffData> {
    const files: DiffFile[] = [];
    const allRenderedLines: string[] = [];
    const fileBoundaries: number[] = [];

    const lines = iterReplaceTabsWithSpaces(
        context,
        iterlinesFromReadable(input)
    );

    const events: AsyncIterable<DiffEvent> = iterSideBySideDiffsWithEvents(
        context,
        lines
    );

    for await (const event of events) {
        if (event.type === 'file-start') {
            const startLineIndex = allRenderedLines.length;
            files.push({
                fileNameA: event.fileNameA,
                fileNameB: event.fileNameB,
                displayName: getDisplayName(event.fileNameA, event.fileNameB),
                startLineIndex,
            });
            fileBoundaries.push(startLineIndex);
        } else {
            allRenderedLines.push(applyFormatting(context, event.content));
        }
    }

    return { files, allRenderedLines, fileBoundaries };
}
