import * as assert from 'assert';
import { Config } from './config';
import { Context } from './context';
import { iterFormatHunkSideBySide } from './iterFormatHunkSideBySide';
import { iterFormatCommitLine } from './iterFormatCommitLine';
import { iterFormatFileName } from './iterFormatFileName';

/**
 * Binary file diffs are hard to parse, because they are printed like:
 * "Binary files (a/<filename>|/dev/null) and (b/<filename>|/dev/null) differ"
 * but spaces in file names are not escaped, so the " and " could appear in
 * a path. So we use a regex to hopefully find the right match.
 */
const BINARY_FILES_DIFF_REGEX = /^Binary files (?:a\/(.*)|\/dev\/null) and (?:b\/(.*)|\/dev\/null) differ$/;

export function getSideBySideDiffIterator(config: Config) {
    /*
        Each line in a hunk is rendered as follows: <lineNo> <linePrefix[1]>
        <lineWithoutPrefix><lineNo> <linePrefix> <lineWithoutPrefix>

        So (LINE_NUMBER_WIDTH + 1 + 1 + 1 + LINE_TEXT_WIDTH) * 2
        = SCREEN_WIDTH
    */
    const LINE_WIDTH = Math.max(
        Math.floor(config.SCREEN_WIDTH / 2),
        config.MIN_LINE_WIDTH
    );
    const LINE_TEXT_WIDTH = Math.max(
        LINE_WIDTH - 1 - 1 - 1 - config.LINE_NUMBER_WIDTH
    );
    const BLANK_LINE = ''.padStart(LINE_WIDTH);
    const HORIZONTAL_SEPARATOR = config.BORDER_COLOR(
        ''.padStart(config.SCREEN_WIDTH, '─')
    );

    const context: Context = {
        ...config,
        LINE_WIDTH,
        LINE_TEXT_WIDTH,
        BLANK_LINE,
        HORIZONTAL_SEPARATOR,
    };

    return async function* iterSideBySideDiffs(lines: AsyncIterable<string>) {
        let state: 'commit' | 'diff' | 'hunk' = 'commit';

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
            yield* iterFormatHunkSideBySide(
                context,
                hunkHeaderLine,
                // Ignore text for missing files
                fileNameA ? hunkLinesA : [],
                fileNameB ? hunkLinesB : [],
                startA,
                startB
            );
            hunkLinesA = [];
            hunkLinesB = [];
        }

        for await (const line of lines) {
            // Handle state transitions
            if (line.startsWith('commit ')) {
                if (state === 'diff') {
                    yield* yieldFileName();
                } else if (state === 'hunk') {
                    yield* yieldHunk();
                    yield HORIZONTAL_SEPARATOR;
                }

                state = 'commit';
            } else if (line.startsWith('diff --git')) {
                if (state === 'diff') {
                    yield* yieldFileName();
                } else if (state === 'hunk') {
                    yield* yieldHunk();
                }

                state = 'diff';
                fileNameA = '';
                fileNameB = '';
            } else if (line.startsWith('@@')) {
                if (state === 'diff') {
                    yield* yieldFileName();
                } else if (state === 'hunk') {
                    yield* yieldHunk();
                }

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

                state = 'hunk';

                // Don't add the first line to hunkLines
                continue;
            }

            // Handle state
            switch (state) {
                case 'commit': {
                    yield* iterFormatCommitLine(context, line);
                    break;
                }
                case 'diff':
                    {
                        if (line.startsWith('--- a/')) {
                            fileNameA = line.slice('--- a/'.length);
                        } else if (line.startsWith('+++ b/')) {
                            fileNameB = line.slice('+++ b/'.length);
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
                    }
                    break;
                case 'hunk': {
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

        if (state === 'diff') {
            yield* yieldFileName();
        } else if (state === 'hunk') {
            yield* yieldHunk();
        }
    };
}
