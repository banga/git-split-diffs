import * as assert from 'assert';
import { padColoredText } from './color-utils';
import { Theme } from './theme';
import wrapAnsi from 'wrap-ansi';
import { Chalk } from 'chalk';

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
    const LINE_WIDTH = Math.max(Math.floor(SCREEN_WIDTH / 2), MIN_LINE_WIDTH);
    const LINE_TEXT_WIDTH = Math.max(
        LINE_WIDTH - 1 - LINE_PREFIX_WIDTH - 1 - LINE_NUMBER_WIDTH
    );
    const BLANK_LINE = ''.padStart(LINE_WIDTH);

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
        return padColoredText(
            ` ${line} `,
            SCREEN_WIDTH,
            'center',
            FILE_NAME_COLOR.dim('─')
        );
    }

    type HunkLineHalf = {
        number: string;
        prefix: string;
        text: string;
    } | null /* if line is missing */;

    function formatHunkLineHalf(lineHalf: HunkLineHalf) {
        const lineNo = lineHalf?.number ?? '';
        const linePrefix = lineHalf?.prefix ?? '';
        const lineText = lineHalf?.text ?? '';

        let lineColor: Chalk;
        switch (linePrefix) {
            case '-':
                lineColor = DELETED_LINE_COLOR;
                break;
            case '+':
                lineColor = INSERTED_LINE_COLOR;
                break;
            default:
                lineColor = UNMODIFIED_LINE_COLOR;
        }

        const formattedLineNo = lineColor.dim(
            lineNo.padStart(LINE_NUMBER_WIDTH)
        );
        const formattedLinePrefix = lineColor(
            linePrefix.padStart(LINE_PREFIX_WIDTH)
        );
        const formattedLine = lineColor(lineText);

        const wrappedLines = wrapAnsi(formattedLine, LINE_TEXT_WIDTH, {
            hard: true,
            trim: false,
        }).split('\n');
        return wrappedLines.map((wrappedLine, index) => {
            if (index === 0) {
                return [
                    formattedLineNo,
                    formattedLinePrefix,
                    padColoredText(wrappedLine, LINE_TEXT_WIDTH, 'left'),
                ].join(' ');
            } else {
                return padColoredText(
                    padColoredText(wrappedLine, LINE_TEXT_WIDTH, 'left'),
                    LINE_WIDTH,
                    'right'
                );
            }
        });
    }

    function formatHunkLine(lineHalfA: HunkLineHalf, lineHalfB: HunkLineHalf) {
        const formattedLinesA = formatHunkLineHalf(lineHalfA);
        const formattedLinesB = formatHunkLineHalf(lineHalfB);
        const formattedHunkLines = [];
        for (
            let indexA = 0, indexB = 0;
            indexA < formattedLinesA.length || indexB < formattedLinesB.length;
            indexA++, indexB++
        ) {
            const formattedLineA =
                indexA < formattedLinesA.length
                    ? formattedLinesA[indexA]
                    : BLANK_LINE;
            const formattedLineB =
                indexB < formattedLinesB.length
                    ? formattedLinesB[indexB]
                    : BLANK_LINE;
            formattedHunkLines.push(formattedLineA + formattedLineB);
        }

        return formattedHunkLines;
    }

    function formatHunkSideBySide(
        hunkHeaderLine: string,
        hunkLines: string[],
        lineNoA: number,
        lineNoB: number,
        fileNameA: string,
        fileNameB: string
    ) {
        const formattedLines: string[] = [];
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

            while (indexA < linesA.length || indexB < linesB.length) {
                let lineA: HunkLineHalf = null;
                let lineB: HunkLineHalf = null;
                if (indexA < linesA.length) {
                    lineA = {
                        number: lineNoA.toString(),
                        prefix: linesA[indexA].slice(0, 1),
                        // truncate lines
                        text: linesA[indexA].slice(1),
                    };
                    lineNoA++;
                    indexA++;
                }
                if (indexB < linesB.length) {
                    lineB = {
                        number: lineNoB.toString(),
                        prefix: linesB[indexB].slice(0, 1),
                        // truncate lines
                        text: linesB[indexB].slice(1),
                    };
                    lineNoB++;
                    indexB++;
                }
                formattedLines.push(...formatHunkLine(lineA, lineB));
            }
        }

        for (const line of hunkLines) {
            if (line.startsWith('-')) {
                linesA.push(line);
            } else if (line.startsWith('+')) {
                linesB.push(line);
            } else {
                flushHunkChange();
                linesA = fileNameA ? [line] : [];
                linesB = fileNameB ? [line] : [];
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
            yield formatFileName(fileNameA, fileNameB);
        }

        // Hunk metadata
        let startA: number = -1;
        let startB: number = -1;
        let hunkHeaderLine: string = '';
        let hunkLines: string[] = [];
        function* yieldHunk() {
            yield* formatHunkSideBySide(
                hunkHeaderLine,
                hunkLines,
                startA,
                startB,
                fileNameA,
                fileNameB
            );
            hunkLines = [];
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
                    yield formatCommitLine(line);
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
                        }
                    }
                    break;
                case 'hunk': {
                    hunkLines.push(line);
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
