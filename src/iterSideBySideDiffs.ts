import ansiRegex from 'ansi-regex';
import * as assert from 'assert';
import { Context } from './context';
import { applyFormatting, FormattedString, T } from './formattedString';
import { iterFormatCommitBodyLine } from './iterFormatCommitBodyLine';
import { iterFormatCommitHeaderLine } from './iterFormatCommitHeaderLine';
import { iterFormatFileName } from './iterFormatFileName';
import { HunkPart, iterFormatHunk } from './iterFormatHunk';

const ANSI_COLOR_CODE_REGEX = ansiRegex();

/**
 * Binary file diffs are hard to parse, because they are printed like:
 * "Binary files (a/<filename>|/dev/null) and (b/<filename>|/dev/null) differ"
 * but spaces in file names are not escaped, so the " and " could appear in
 * a path. So we use a regex to hopefully find the right match.
 */
const BINARY_FILES_DIFF_REGEX =
    /^Binary files (?:a\/(.*)|\/dev\/null) and (?:b\/(.*)|\/dev\/null) differ$/;

// Combined hunk headers begin with N+1 @ characters for N parents
const COMBINED_HUNK_HEADER_START_REGEX = /^(@{2,}) /;

type State =
    | 'unknown'
    | 'commit-header'
    | 'commit-body'
    // "Unified" diffs (normal diffs)
    | 'unified-diff'
    | 'unified-diff-hunk-header'
    | 'unified-diff-hunk-body'
    // "Combined" diffs (diffs with multiple parents)
    | 'combined-diff'
    | 'combined-diff-hunk-header'
    | 'combined-diff-hunk-body';

export type DiffEvent =
    | { type: 'line'; content: FormattedString }
    | { type: 'file-start'; fileNameA: string; fileNameB: string; additions: number; deletions: number };

export async function* iterSideBySideDiffs(
    context: Context,
    lines: AsyncIterable<string>
) {
    for await (const event of iterSideBySideDiffEvents(context, lines)) {
        if (event.type === 'line') {
            yield applyFormatting(context, event.content);
        }
    }
}

export async function* iterSideBySideDiffEvents(
    context: Context,
    lines: AsyncIterable<string>
): AsyncIterable<DiffEvent> {
    const { HORIZONTAL_SEPARATOR } = context;

    let state: State = 'unknown';
    let isFirstCommitBodyLine = false;
    let fileNameA: string = '';
    let fileNameB: string = '';
    let fileAdditions: number = 0;
    let fileDeletions: number = 0;
    let hunkParts: HunkPart[] = [];
    let hunkHeaderLine: string = '';

    function* yieldFileNameLines() {
        yield* iterFormatFileName(context, fileNameA, fileNameB);
    }

    async function* yieldHunkLines(
        diffType: 'unified-diff' | 'combined-diff'
    ) {
        yield* iterFormatHunk(context, diffType, hunkHeaderLine, hunkParts);
        for (const hunkPart of hunkParts) {
            hunkPart.startLineNo = -1;
            hunkPart.lines = [];
        }
    }

    async function* flushPendingEvents(): AsyncIterable<DiffEvent> {
        if (state === 'unified-diff' || state === 'combined-diff') {
            yield {
                type: 'file-start',
                fileNameA,
                fileNameB,
                additions: fileAdditions,
                deletions: fileDeletions,
            };
            for (const line of yieldFileNameLines()) {
                yield { type: 'line', content: line };
            }
        } else if (state === 'unified-diff-hunk-body') {
            for await (const line of yieldHunkLines('unified-diff')) {
                yield { type: 'line', content: line };
            }
        } else if (state === 'combined-diff-hunk-body') {
            for await (const line of yieldHunkLines('combined-diff')) {
                yield { type: 'line', content: line };
            }
        }
    }

    for await (const rawLine of lines) {
        const line = rawLine.replace(ANSI_COLOR_CODE_REGEX, '');

        let nextState: State | null = null;
        if (line.startsWith('commit ')) {
            nextState = 'commit-header';
        } else if (state === 'commit-header' && line.startsWith('    ')) {
            nextState = 'commit-body';
        } else if (line.startsWith('diff --git')) {
            nextState = 'unified-diff';
        } else if (line.startsWith('@@ ')) {
            nextState = 'unified-diff-hunk-header';
        } else if (state === 'unified-diff-hunk-header') {
            nextState = 'unified-diff-hunk-body';
        } else if (
            line.startsWith('diff --cc') ||
            line.startsWith('diff --combined')
        ) {
            nextState = 'combined-diff';
        } else if (COMBINED_HUNK_HEADER_START_REGEX.test(line)) {
            nextState = 'combined-diff-hunk-header';
        } else if (state === 'combined-diff-hunk-header') {
            nextState = 'combined-diff-hunk-body';
        } else if (
            state === 'commit-body' &&
            line.length > 0 &&
            !line.startsWith('    ')
        ) {
            nextState = 'unknown';
        }

        if (nextState) {
            yield* flushPendingEvents();

            switch (nextState) {
                case 'commit-header':
                    if (
                        state === 'unified-diff-hunk-header' ||
                        state === 'unified-diff-hunk-body'
                    ) {
                        yield {
                            type: 'line',
                            content: HORIZONTAL_SEPARATOR,
                        };
                    }
                    break;
                case 'unified-diff':
                    fileNameA = '';
                    fileNameB = '';
                    fileAdditions = 0;
                    fileDeletions = 0;
                    break;
                case 'unified-diff-hunk-header':
                    hunkParts = [
                        { fileName: fileNameA, startLineNo: -1, lines: [] },
                        { fileName: fileNameB, startLineNo: -1, lines: [] },
                    ];
                    break;
                case 'commit-body':
                    isFirstCommitBodyLine = true;
                    break;
            }

            state = nextState;
        }

        switch (state) {
            case 'unknown': {
                yield { type: 'line', content: T().appendString(rawLine) };
                break;
            }
            case 'commit-header': {
                for (const l of iterFormatCommitHeaderLine(context, line)) {
                    yield { type: 'line', content: l };
                }
                break;
            }
            case 'commit-body': {
                for (const l of iterFormatCommitBodyLine(
                    context,
                    line,
                    isFirstCommitBodyLine
                )) {
                    yield { type: 'line', content: l };
                }
                isFirstCommitBodyLine = false;
                break;
            }
            case 'unified-diff':
            case 'combined-diff': {
                if (line.startsWith('--- a/')) {
                    fileNameA = line.slice('--- a/'.length);
                } else if (line.startsWith('+++ b/')) {
                    fileNameB = line.slice('+++ b/'.length);
                } else if (line.startsWith('--- ')) {
                    fileNameA = line.slice('--- '.length);
                    // /dev/null indicates file creation/deletion
                    // per git diff-format spec
                    if (fileNameA === '/dev/null') {
                        fileNameA = '';
                    }
                } else if (line.startsWith('+++ ')) {
                    fileNameB = line.slice('+++ '.length);
                    if (fileNameB === '/dev/null') {
                        fileNameB = '';
                    }
                } else if (line.startsWith('rename from ')) {
                    fileNameA = line.slice('rename from '.length);
                } else if (line.startsWith('rename to ')) {
                    fileNameB = line.slice('rename to '.length);
                } else if (line.startsWith('Binary files')) {
                    const match = line.match(BINARY_FILES_DIFF_REGEX);
                    if (match) {
                        [, fileNameA, fileNameB] = match;
                    }
                }
                break;
            }
            case 'unified-diff-hunk-header': {
                const hunkHeaderStart = line.indexOf('@@ ');
                const hunkHeaderEnd = line.indexOf(' @@', hunkHeaderStart + 1);
                assert.ok(hunkHeaderStart >= 0);
                assert.ok(hunkHeaderEnd > hunkHeaderStart);
                const hunkHeader = line.slice(
                    hunkHeaderStart + 3,
                    hunkHeaderEnd
                );
                hunkHeaderLine = line;
                const [aHeader, bHeader] = hunkHeader.split(' ');
                const [startAString] = aHeader.split(',');
                const [startBString] = bHeader.split(',');
                assert.ok(startAString.startsWith('-'));
                hunkParts[0].startLineNo = parseInt(startAString.slice(1), 10);
                assert.ok(startBString.startsWith('+'));
                hunkParts[1].startLineNo = parseInt(startBString.slice(1), 10);
                break;
            }
            case 'unified-diff-hunk-body': {
                const [{ lines: hunkLinesA }, { lines: hunkLinesB }] =
                    hunkParts;
                if (line.startsWith('-')) {
                    hunkLinesA.push(line);
                    fileDeletions++;
                } else if (line.startsWith('+')) {
                    hunkLinesB.push(line);
                    fileAdditions++;
                } else {
                    while (hunkLinesA.length < hunkLinesB.length) {
                        hunkLinesA.push(null);
                    }
                    while (hunkLinesB.length < hunkLinesA.length) {
                        hunkLinesB.push(null);
                    }
                    hunkLinesA.push(line);
                    hunkLinesB.push(line);
                }
                break;
            }
            case 'combined-diff-hunk-header': {
                const match = COMBINED_HUNK_HEADER_START_REGEX.exec(line);
                assert.ok(match);
                const hunkHeaderStart =
                    match.index + match[0].length;
                const hunkHeaderEnd = line.lastIndexOf(' ' + match[1]);
                assert.ok(hunkHeaderStart >= 0);
                assert.ok(hunkHeaderEnd > hunkHeaderStart);
                const hunkHeader = line.slice(hunkHeaderStart, hunkHeaderEnd);
                hunkHeaderLine = line;
                const fileRanges = hunkHeader.split(' ');
                hunkParts = [];
                for (let i = 0; i < fileRanges.length; i++) {
                    const fileRange = fileRanges[i];
                    const [fileRangeStart] = fileRange.slice(1).split(',');
                    hunkParts.push({
                        fileName:
                            i === fileRanges.length - 1 ? fileNameB : fileNameA,
                        startLineNo: parseInt(fileRangeStart, 10),
                        lines: [],
                    });
                }
                break;
            }
            case 'combined-diff-hunk-body': {
                // Combined diffs have N+1 columns: first N show changes
                // relative to each parent, last shows the merge result.
                // Prefix chars: + (added), - (removed), space (unchanged).
                // See: https://git-scm.com/docs/git-diff#_combined_diff_format
                const linePrefix = line.slice(0, hunkParts.length - 1);
                const lineSuffix = line.slice(hunkParts.length - 1);
                const isLineAdded = linePrefix.includes('+');
                const isLineRemoved = linePrefix.includes('-');
                let i = 0;
                while (i < hunkParts.length - 1) {
                    const hunkPart = hunkParts[i];
                    const partPrefix = linePrefix[i];
                    if (isLineAdded) {
                        if (partPrefix === '+') {
                            hunkPart.lines.push(null);
                        } else {
                            hunkPart.lines.push('+' + lineSuffix);
                        }
                    } else if (isLineRemoved) {
                        if (partPrefix === '-') {
                            hunkPart.lines.push('-' + lineSuffix);
                        } else {
                            hunkPart.lines.push(null);
                        }
                    } else {
                        hunkPart.lines.push(' ' + lineSuffix);
                    }
                    i++;
                }
                // Final part: the merge result (current commit state)
                if (isLineRemoved) {
                    hunkParts[i].lines.push('-' + lineSuffix);
                    fileDeletions++;
                } else if (isLineAdded) {
                    hunkParts[i].lines.push('+' + lineSuffix);
                    fileAdditions++;
                } else {
                    hunkParts[i].lines.push(' ' + lineSuffix);
                }
                break;
            }
        }
    }

    yield* flushPendingEvents();
}
