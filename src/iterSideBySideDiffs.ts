import ansiRegex from 'ansi-regex';
import * as assert from 'assert';
import { Context } from './context';
import { applyFormatting, FormattedString, T } from './formattedString';
import { iterFormatCommitBodyLine } from './iterFormatCommitBodyLine';
import { iterFormatCommitHeaderLine } from './iterFormatCommitHeaderLine';
import { iterFormatFileName } from './iterFormatFileName';
import { iterFormatHunk } from './iterFormatHunk';

const ANSI_COLOR_CODE_REGEX = ansiRegex();

/**
 * Binary file diffs are hard to parse, because they are printed like:
 * "Binary files (a/<filename>|/dev/null) and (b/<filename>|/dev/null) differ"
 * but spaces in file names are not escaped, so the " and " could appear in
 * a path. So we use a regex to hopefully find the right match.
 */
const BINARY_FILES_DIFF_REGEX =
    /^Binary files (?:a\/(.*)|\/dev\/null) and (?:b\/(.*)|\/dev\/null) differ$/;

type State =
    | 'unknown'
    | 'commit-header'
    | 'commit-body'
    | 'diff'
    | 'hunk-header'
    | 'hunk-body';

async function* iterSideBySideDiffsFormatted(
    context: Context,
    lines: AsyncIterable<string>
): AsyncIterable<FormattedString> {
    const { HORIZONTAL_SEPARATOR } = context;

    let state: State = 'unknown';

    // Commit metadata
    let isFirstCommitBodyLine = false;

    // File metadata
    let fileNameA: string = '';
    let fileNameB: string = '';
    function* yieldFileName() {
        yield* iterFormatFileName(context, fileNameA, fileNameB);
    }

    // Hunk metadata
    let startA: number = -1;
    let startB: number = -1;
    let hunkHeaderLine: string = '';
    let hunkLinesA: (string | null)[] = [];
    let hunkLinesB: (string | null)[] = [];
    function* yieldHunk() {
        yield* iterFormatHunk(
            context,
            hunkHeaderLine,
            fileNameA,
            fileNameB,
            hunkLinesA,
            hunkLinesB,
            startA,
            startB
        );
        hunkLinesA = [];
        hunkLinesB = [];
    }

    function* flushPending() {
        if (state === 'diff') {
            yield* yieldFileName();
        } else if (state === 'hunk-body') {
            yield* yieldHunk();
        }
    }

    for await (const rawLine of lines) {
        const line = rawLine.replace(ANSI_COLOR_CODE_REGEX, '');

        // Update state
        let nextState: State | null = null;
        if (line.startsWith('commit ')) {
            nextState = 'commit-header';
        } else if (state === 'commit-header' && line.startsWith('    ')) {
            nextState = 'commit-body';
        } else if (line.startsWith('diff --git')) {
            nextState = 'diff';
        } else if (line.startsWith('@@ ')) {
            nextState = 'hunk-header';
        } else if (state === 'hunk-header') {
            nextState = 'hunk-body';
        } else if (
            state === 'commit-body' &&
            line.length > 0 &&
            !line.startsWith('    ')
        ) {
            nextState = 'unknown';
        }

        // Handle state starts
        if (nextState) {
            yield* flushPending();

            switch (nextState) {
                case 'commit-header':
                    if (state === 'hunk-header' || state === 'hunk-body') {
                        yield HORIZONTAL_SEPARATOR;
                    }
                    break;
                case 'diff':
                    fileNameA = '';
                    fileNameB = '';
                    break;
                case 'commit-body':
                    isFirstCommitBodyLine = true;
                    break;
            }

            state = nextState;
        }

        // Handle state
        switch (state) {
            case 'unknown': {
                yield T().appendString(rawLine);
                break;
            }
            case 'commit-header': {
                yield* iterFormatCommitHeaderLine(context, line);
                break;
            }
            case 'commit-body': {
                yield* iterFormatCommitBodyLine(
                    context,
                    line,
                    isFirstCommitBodyLine
                );
                isFirstCommitBodyLine = false;
                break;
            }
            case 'diff': {
                if (line.startsWith('--- a/')) {
                    fileNameA = line.slice('--- a/'.length);
                } else if (line.startsWith('+++ b/')) {
                    fileNameB = line.slice('+++ b/'.length);
                } else if (line.startsWith('--- ')) {
                    fileNameA = line.slice('--- '.length);
                    // https://git-scm.com/docs/diff-format says that
                    // `/dev/null` is used to indicate creations and deletions,
                    // so we can special case it.
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
            case 'hunk-header': {
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
                startA = parseInt(startAString.slice(1), 10);

                assert.ok(startBString.startsWith('+'));
                startB = parseInt(startBString.slice(1), 10);
                break;
            }
            case 'hunk-body': {
                if (line.startsWith('-')) {
                    hunkLinesA.push(line);
                } else if (line.startsWith('+')) {
                    hunkLinesB.push(line);
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
        }
    }

    yield* flushPending();
}

export async function* iterSideBySideDiffs(
    context: Context,
    lines: AsyncIterable<string>
) {
    for await (const formattedString of iterSideBySideDiffsFormatted(
        context,
        lines
    )) {
        yield applyFormatting(context, formattedString);
    }
}
