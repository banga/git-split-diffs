import * as assert from 'assert';
import { Theme, ThemeColor } from './themes';
import { Config } from './config';
import { wrapLineByWord } from './wrapLineByWord';

export function iterSideBySideDiff(
    { SCREEN_WIDTH, LINE_NUMBER_WIDTH, MIN_LINE_WIDTH, WRAP_LINES }: Config,
    {
        COMMIT_COLOR,
        COMMIT_SHA_COLOR,
        COMMIT_AUTHOR_COLOR,
        COMMIT_DATE_COLOR,
        BORDER_COLOR,
        FILE_NAME_COLOR,
        HUNK_HEADER_COLOR,
        DELETED_LINE_COLOR,
        DELETED_LINE_NO_COLOR,
        INSERTED_LINE_COLOR,
        INSERTED_LINE_NO_COLOR,
        UNMODIFIED_LINE_COLOR,
        UNMODIFIED_LINE_NO_COLOR,
        MISSING_LINE_COLOR,
    }: Theme
) {
    /*
        Each line in a hunk is rendered as follows: <lineNo> <linePrefix[1]>
        <lineWithoutPrefix><lineNo> <linePrefix> <lineWithoutPrefix>

        So (LINE_NUMBER_WIDTH + 1 + 1 + 1 + LINE_TEXT_WIDTH) * 2
        = SCREEN_WIDTH
    */
    const LINE_WIDTH = Math.max(Math.floor(SCREEN_WIDTH / 2), MIN_LINE_WIDTH);
    const LINE_TEXT_WIDTH = Math.max(
        LINE_WIDTH - 1 - 1 - 1 - LINE_NUMBER_WIDTH
    );
    const BLANK_LINE = ''.padStart(LINE_WIDTH);
    const HORIZONTAL_SEPARATOR = BORDER_COLOR(''.padStart(SCREEN_WIDTH, '─'));

    /**
     * Wraps or truncates the given line to into the allowed width, depending on
     * the config.
     */
    function* iterFitTextToWidth(
        text: string,
        width: number
    ): Iterable<string> {
        if (WRAP_LINES) {
            yield* wrapLineByWord(text, width);
        } else {
            yield text.slice(0, width);
        }
    }

    function* iterFormatCommitLine(line: string): Iterable<string> {
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
                yield COMMIT_COLOR(line.padEnd(SCREEN_WIDTH));
                return;
        }

        yield COMMIT_COLOR(
            `${label} ${labelColor(line.slice(label.length + 1))}` +
                ''.padEnd(SCREEN_WIDTH - line.length)
        );
    }

    function* iterFormatFileName(
        fileNameA: string,
        fileNameB: string
    ): Iterable<string> {
        yield HORIZONTAL_SEPARATOR;

        let indicator;
        let label;
        if (!fileNameA) {
            indicator = INSERTED_LINE_COLOR('■■');
            label = fileNameB;
        } else if (!fileNameB) {
            indicator = DELETED_LINE_COLOR('■■');
            label = fileNameA;
        } else if (fileNameA === fileNameB) {
            indicator = DELETED_LINE_COLOR('■') + INSERTED_LINE_COLOR('■');
            label = fileNameA;
        } else {
            indicator = DELETED_LINE_COLOR('■') + INSERTED_LINE_COLOR('■');
            label = FILE_NAME_COLOR(`${fileNameA} -> ${fileNameB}`);
        }
        yield FILE_NAME_COLOR(' ') +
            indicator +
            FILE_NAME_COLOR(' ' + label.padEnd(SCREEN_WIDTH - 2 - 2));

        yield HORIZONTAL_SEPARATOR;
    }

    function formatAndFitHunkLineHalf(
        lineNo: number,
        line: string | null
    ): string[] {
        if (line === null) {
            return [MISSING_LINE_COLOR(''.padStart(LINE_WIDTH))];
        }

        const linePrefix = line.slice(0, 1);
        const lineText = line.slice(1);

        let lineColor: ThemeColor;
        let lineNoColor: ThemeColor;
        switch (line[0]) {
            case '-':
                lineColor = DELETED_LINE_COLOR;
                lineNoColor = DELETED_LINE_NO_COLOR;
                break;
            case '+':
                lineColor = INSERTED_LINE_COLOR;
                lineNoColor = INSERTED_LINE_NO_COLOR;
                break;
            default:
                lineColor = UNMODIFIED_LINE_COLOR;
                lineNoColor = UNMODIFIED_LINE_NO_COLOR;
                break;
        }

        let isFirstLine = true;
        const formattedHunkLineHalves = [];
        for (const text of iterFitTextToWidth(lineText, LINE_TEXT_WIDTH)) {
            formattedHunkLineHalves.push(
                lineNoColor(lineNo.toString().padStart(LINE_NUMBER_WIDTH)) +
                    lineColor(
                        ' ' +
                            (isFirstLine ? linePrefix : '').padStart(1) +
                            ' ' +
                            text.padEnd(LINE_TEXT_WIDTH)
                    )
            );
            isFirstLine = false;
        }
        return formattedHunkLineHalves;
    }

    function* iterFormatAndFitHunkLine(
        lineNoA: number,
        lineTextA: string | null,
        lineNoB: number,
        lineTextB: string | null
    ) {
        const formattedLinesA = formatAndFitHunkLineHalf(lineNoA, lineTextA);
        const formattedLinesB = formatAndFitHunkLineHalf(lineNoB, lineTextB);
        let i = 0;
        while (i < formattedLinesA.length && i < formattedLinesB.length) {
            yield formattedLinesA[i] + formattedLinesB[i];
            i++;
        }
        while (i < formattedLinesA.length) {
            yield formattedLinesA[i] + INSERTED_LINE_COLOR(BLANK_LINE);
            i++;
        }
        while (i < formattedLinesB.length) {
            yield DELETED_LINE_COLOR(BLANK_LINE) + formattedLinesB[i];
            i++;
        }
    }

    function* iterFormatHunkSideBySide(
        hunkHeaderLine: string,
        hunkLinesA: (string | null)[],
        hunkLinesB: (string | null)[],
        lineNoA: number,
        lineNoB: number
    ) {
        for (const line of iterFitTextToWidth(hunkHeaderLine, SCREEN_WIDTH)) {
            yield HUNK_HEADER_COLOR(line.padEnd(SCREEN_WIDTH));
        }

        for (let i = 0; i < hunkLinesA.length || i < hunkLinesB.length; i++) {
            const lineA = i < hunkLinesA.length ? hunkLinesA[i] : null;
            const lineB = i < hunkLinesB.length ? hunkLinesB[i] : null;
            yield* iterFormatAndFitHunkLine(lineNoA, lineA, lineNoB, lineB);
            if (lineA !== null) {
                lineNoA++;
            }
            if (lineB !== null) {
                lineNoB++;
            }
        }
    }

    /**
     * Binary file diffs are hard to parse, because they are printed like:
     * "Binary files (a/<filename>|/dev/null) and (b/<filename>|/dev/null) differ"
     * but spaces in file names are not escaped, so the " and " could appear in
     * a path. So we use a regex to hopefully find the right match.
     */
    const BINARY_FILES_DIFF_REGEX = /^Binary files (?:a\/(.*)|\/dev\/null) and (?:b\/(.*)|\/dev\/null) differ$/;

    return async function* (lines: AsyncIterable<string>) {
        let state: 'commit' | 'diff' | 'hunk' = 'commit';

        // File metadata
        let fileNameA: string = '';
        let fileNameB: string = '';
        function* yieldFileName() {
            yield* iterFormatFileName(fileNameA, fileNameB);
        }

        // Hunk metadata
        let startA: number = -1;
        let startB: number = -1;
        let hunkHeaderLine: string = '';
        let hunkLinesA: (string | null)[] = [];
        let hunkLinesB: (string | null)[] = [];
        function* yieldHunk() {
            yield* iterFormatHunkSideBySide(
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
                    yield* iterFormatCommitLine(line);
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
