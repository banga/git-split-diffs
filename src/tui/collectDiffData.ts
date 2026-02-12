import { Readable } from 'stream';
import { Context } from '../context';
import { applyFormatting } from '../formattedString';
import { iterlinesFromReadable } from '../iterLinesFromReadable';
import { iterReplaceTabsWithSpaces } from '../iterReplaceTabsWithSpaces';
import {
    DiffEvent,
    iterSideBySideDiffEvents,
} from '../iterSideBySideDiffs';

import { StagingStatus } from './gitStatus';

export interface DiffFile {
    fileNameA: string;
    fileNameB: string;
    displayName: string;
    startLineIndex: number;
    additions: number;
    deletions: number;
    stagingStatus?: StagingStatus;
}

export interface DiffData {
    files: DiffFile[];
    allRenderedLines: string[];
    fileBoundaries: number[];
    rawLines: string[];
}

function getDisplayName(fileNameA: string, fileNameB: string): string {
    if (!fileNameA) return fileNameB || '(unknown)';
    if (!fileNameB) return fileNameA;
    if (fileNameA === fileNameB) return fileNameA;
    return `${fileNameA} → ${fileNameB}`;
}

/**
 * Re-render diff lines from raw input with a given context.
 * Used for dynamic width changes (terminal resize, tree toggle).
 */
export async function rerenderDiffLines(
    context: Context,
    rawLines: string[]
): Promise<{ allRenderedLines: string[]; fileBoundaries: number[] }> {
    const allRenderedLines: string[] = [];
    const fileBoundaries: number[] = [];

    async function* iterLines() {
        for (const line of rawLines) yield line;
    }

    const events = iterSideBySideDiffEvents(context, iterLines());
    for await (const event of events) {
        if (event.type === 'file-start') {
            fileBoundaries.push(allRenderedLines.length);
        } else {
            allRenderedLines.push(applyFormatting(context, event.content));
        }
    }

    return { allRenderedLines, fileBoundaries };
}

export async function collectDiffData(
    context: Context,
    input: Readable
): Promise<DiffData> {
    const files: DiffFile[] = [];
    const allRenderedLines: string[] = [];
    const fileBoundaries: number[] = [];
    const rawLines: string[] = [];

    const lines = iterReplaceTabsWithSpaces(
        context,
        iterlinesFromReadable(input)
    );

    // Buffer raw lines for later re-rendering
    async function* captureLines() {
        for await (const line of lines) {
            rawLines.push(line);
            yield line;
        }
    }

    const events: AsyncIterable<DiffEvent> = iterSideBySideDiffEvents(
        context,
        captureLines()
    );

    for await (const event of events) {
        if (event.type === 'file-start') {
            const startLineIndex = allRenderedLines.length;
            files.push({
                fileNameA: event.fileNameA,
                fileNameB: event.fileNameB,
                displayName: getDisplayName(event.fileNameA, event.fileNameB),
                startLineIndex,
                additions: event.additions,
                deletions: event.deletions,
            });
            fileBoundaries.push(startLineIndex);
        } else {
            allRenderedLines.push(applyFormatting(context, event.content));
        }
    }

    return { files, allRenderedLines, fileBoundaries, rawLines };
}
