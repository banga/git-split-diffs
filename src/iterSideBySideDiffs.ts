import * as assert from 'assert';
import { ANSI_COLOR_CODE_REGEX } from './iterLinesWithoutAnsiColors';
import { Theme } from './theme';

export function iterSideBySideDiff({
    SCREEN_WIDTH,
    LINE_NUMBER_WIDTH,
    LINE_PREFIX_WIDTH,
    MIN_LINE_WIDTH,
    COMMIT_SHA_COLOR,
    COMMIT_AUTHOR_COLOR,
    COMMIT_DATE_COLOR,
    FILE_NAME_COLOR,
    HUNK_HEADER_COLOR,
    DELETED_LINE_COLOR,
    INSERTED_LINE_COLOR,
    UNMODIFIED_LINE_COLOR,
}: Theme) {
    /*
        Each line in a hunk is rendered as follows: <lineNo> <linePrefix[1]>
        <lineWithoutPrefix><lineNo> <linePrefix> <lineWithoutPrefix>

        So (LINE_NUMBER_WIDTH + 1 + LINE_PREFIX_WIDTH + 1 + LINE_TEXT_WIDTH) * 2
        = SCREEN_WIDTH
    */
    const LINE_TEXT_WIDTH = Math.max(
        Math.floor(
            SCREEN_WIDTH / 2 - 1 - LINE_PREFIX_WIDTH - 1 - LINE_NUMBER_WIDTH
        ),
        MIN_LINE_WIDTH
    );
    const FORMATTED_MISSING_LINE = ''.padStart(
        LINE_NUMBER_WIDTH + 1 + LINE_PREFIX_WIDTH + 1 + LINE_TEXT_WIDTH
    );

    function formatCommitLine(line: string) {
        const [label] = line.split(' ', 1);

        let labelColor;
        switch (label) {
            case 'commit':
                labelColor = COMMIT_SHA_COLOR;
                break;
            case 'Author:':
                labelColor = COMMIT_AUTHOR_COLOR;
                break;
            case 'Date:':
                labelColor = COMMIT_DATE_COLOR;
                break;
            default:
                return line;
        }

        return `${label}${labelColor(line.slice(label.length))}`;
    }

    function formatFileName(fileNameA: string, fileNameB: string) {
        let line: string;
        if (!fileNameA) {
            line = `${FILE_NAME_COLOR(fileNameB)}`;
        } else if (!fileNameB) {
            line = `${FILE_NAME_COLOR(fileNameA)}`;
        } else if (fileNameA === fileNameB) {
            line = FILE_NAME_COLOR(fileNameA);
        } else {
            line = `${FILE_NAME_COLOR(fileNameA)} -> ${FILE_NAME_COLOR(
                fileNameB
            )}`;
        }

        // TODO: move to a util function
        const lineLength = line.replace(ANSI_COLOR_CODE_REGEX, '').length;
        const paddingLength = SCREEN_WIDTH - lineLength - 2;
        const leftPadding = FILE_NAME_COLOR.dim(
            ''.padStart(paddingLength / 2, '-')
        );
        const rightPadding = FILE_NAME_COLOR.dim(
            ''.padStart(paddingLength - paddingLength / 2, '-')
        );

        return `${leftPadding} ${line} ${rightPadding}`;
    }

    function formatHunkLine(lineNo: number, line: string, fileName: string) {
        if (!fileName) {
            return FORMATTED_MISSING_LINE;
        }

        let lineColor;
        switch (line[0]) {
            case '-':
                lineColor = DELETED_LINE_COLOR;
                break;
            case '+':
                lineColor = INSERTED_LINE_COLOR;
                break;
            default:
                lineColor = UNMODIFIED_LINE_COLOR;
        }
        const lineNoString = lineNo.toString().padStart(LINE_NUMBER_WIDTH);
        const linePrefix = line.slice(0, 1).padStart(LINE_PREFIX_WIDTH);
        const lineWithoutPrefix = line
            .slice(1, LINE_TEXT_WIDTH + 1)
            .padEnd(LINE_TEXT_WIDTH);
        return `${lineColor.dim(lineNoString)} ${lineColor(
            `${linePrefix} ${lineWithoutPrefix}`
        )}`;
    }

    function formatHunkSideBySide(
        hunkHeaderLine: string,
        hunkLines: string[],
        lineNoA: number,
        lineNoB: number,
        fileNameA: string,
        fileNameB: string
    ) {
        const formattedLines = [];
        formattedLines.push(
            HUNK_HEADER_COLOR(hunkHeaderLine.padEnd(SCREEN_WIDTH))
        );

        let linesA: string[] = [];
        let linesB: string[] = [];

        // Each contiguous sequence of removals and additions represents a change
        // operation starting at the same line on both sides (since it has to occur
        // in the originl file). So we can render a side-by-side diff by rendering
        // the deletions and inserts in parallel, leaving out room if there are more
        // lines on one side than the other.
        function flushHunkChange() {
            let indexA = 0;
            let indexB = 0;

            while (indexA < linesA.length && indexB < linesB.length) {
                formattedLines.push(
                    formatHunkLine(lineNoA, linesA[indexA], fileNameA) +
                        formatHunkLine(lineNoB, linesB[indexB], fileNameB)
                );
                lineNoA++;
                lineNoB++;
                indexA++;
                indexB++;
            }
            while (indexA < linesA.length) {
                formattedLines.push(
                    formatHunkLine(lineNoA, linesA[indexA], fileNameA) +
                        FORMATTED_MISSING_LINE
                );
                lineNoA++;
                indexA++;
            }
            while (indexB < linesB.length) {
                formattedLines.push(
                    FORMATTED_MISSING_LINE +
                        formatHunkLine(lineNoB, linesB[indexB], fileNameB)
                );
                lineNoB++;
                indexB++;
            }
        }

        for (const line of hunkLines) {
            if (line.startsWith('-')) {
                linesA.push(line);
            } else if (line.startsWith('+')) {
                linesB.push(line);
            } else {
                flushHunkChange();
                linesA = [line];
                linesB = [line];
            }
        }

        flushHunkChange();

        return formattedLines;
    }

    return async function* (lines: AsyncIterable<string>) {
        let state: 'commit' | 'diff' | 'hunk' = 'commit';

        // File metadata
        let fileNameA: string = '';
        let fileNameB: string = '';
        function* yieldFileName() {
            yield '';
            yield formatFileName(fileNameA, fileNameB);
            yield '';
        }

        // Hunk metadata
        let startA: number = -1;
        let startB: number = -1;
        let hunkHeaderLine: string = '';
        let hunkLines: string[] = [];
        function* yieldHunk() {
            // console.error('yieldHunk', { hunkHeaderLine, hunkLines });
            yield* formatHunkSideBySide(
                hunkHeaderLine,
                hunkLines,
                startA,
                startB,
                fileNameA,
                fileNameB
            );
        }

        for await (const line of lines) {
            // Handle state transitions
            if (line.startsWith('commit ')) {
                if (state === 'diff') {
                    yield* yieldFileName();
                } else if (state === 'hunk') {
                    yield* yieldHunk();
                }

                state = 'commit';
            } else if (line.startsWith('diff ')) {
                if (state === 'hunk') {
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
                hunkLines = [];

                // Don't add the first line to hunkLines
                continue;
            }

            // Handle state
            switch (state) {
                case 'commit': {
                    yield formatCommitLine(line);
                    break;
                }
                case 'diff':
                    {
                        if (line.startsWith('--- a/')) {
                            fileNameA = line.slice(6);
                        } else if (line.startsWith('+++ b/')) {
                            fileNameB = line.slice(6);
                        }
                    }
                    break;
                case 'hunk': {
                    hunkLines.push(line);
                    break;
                }
            }
        }

        yield* yieldHunk();
    };
}
