import ansiRegex from 'ansi-regex';
import * as assert from 'assert';
import chalk from 'chalk';
import * as os from 'os';
import * as process from 'process';
import * as stream from 'stream';
import termSize from 'term-size';

/*
    Each line in a hunk is rendered as follows:
    <lineNo[maxLineNoWidth]> <linePrefix[1]> <lineWithoutPrefix[LINE_WIDTH]><lineNo[maxLineNoWidth]> <linePrefix[1]> <lineWithoutPrefix[LINE_WIDTH]>

    So (maxLineNoWidth + 1 + 1 + 1 + LINE_WIDTH) * 2 = SCREEN_WIDTH
*/
const { columns: SCREEN_WIDTH } = termSize();
const LINE_NUMBER_WIDTH = 5;
const MIN_LINE_WIDTH = 8;
const LINE_WIDTH = Math.max(
    Math.floor(SCREEN_WIDTH / 2 - 3 - LINE_NUMBER_WIDTH),
    MIN_LINE_WIDTH
);

const FILE_NAME_COLOR = chalk.yellow;
const HUNK_HEADER_COLOR = chalk.dim;
const DELETED_LINE_COLOR = chalk.redBright;
const INSERTED_LINE_COLOR = chalk.greenBright;
const UNMODIFIED_LINE_COLOR = chalk.white;

const ANSI_COLOR_CODE_REGEX = ansiRegex();
const NEWLINE_REGEX = /\r\n|\n/;

/**
 * Converts a readable stream to an iterator that yields the stream's contents
 * line-by-line.
 */
async function* iterlinesFromReadableAsync(readable: stream.Readable) {
    let prevLine: string | undefined = undefined;
    for await (const chunk of readable) {
        const lines: string[] = chunk.toString().split(NEWLINE_REGEX);
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (i === 0 && prevLine) {
                yield prevLine + line;
            } else if (i === lines.length - 1 && line.length > 0) {
                // If the last line is not empty, there was no trailing newline,
                // so we must not yield it yet
                prevLine = line;
            } else {
                yield line;
            }
        }
    }
    if (prevLine !== undefined && prevLine?.length > 0) {
        yield prevLine;
    }
}

/**
 * Strips out ANSI color escape codes, which may be present in diff output if
 * --color is used.
 */
async function* iterateLinesWithoutAnsiColors(lines: AsyncIterable<string>) {
    for await (const line of lines) {
        yield line.replace(ANSI_COLOR_CODE_REGEX, '');
    }
}

async function* iterSideBySideDiff(lines: AsyncIterable<string>) {
    let state: 'commit' | 'diff' | 'hunk' = 'commit';

    // File metadata
    let fileNameA: string = '';
    let fileNameB: string = '';
    function* yieldFileName() {
        yield formatFileName(fileNameA, fileNameB);
    }

    // Hunk metadata
    let startA: number = -1;
    let deltaA: number = -1;
    let startB: number = -1;
    let deltaB: number = -1;
    let hunkHeaderLine: string = '';
    let hunkLines: string[] = [];
    function* yieldHunk() {
        yield* formatHunkSideBySide(
            hunkHeaderLine,
            hunkLines,
            startA,
            deltaA,
            startB,
            deltaB,
            fileNameA,
            fileNameB
        );
    }

    for await (const line of lines) {
        // Handle state transitions
        if (line.startsWith('diff ')) {
            if (state == 'hunk') {
                yield* yieldHunk();
            }

            state = 'diff';
            fileNameA = '';
            fileNameB = '';
        } else if (line.startsWith('@@')) {
            if (state == 'diff') {
                yield* yieldFileName();
            } else if (state == 'hunk') {
                yield* yieldHunk();
            }

            const hunkHeaderStart = line.indexOf('@@ ');
            const hunkHeaderEnd = line.indexOf(' @@', hunkHeaderStart + 1);
            assert.ok(hunkHeaderStart >= 0);
            assert.ok(hunkHeaderEnd > hunkHeaderStart);
            const hunkHeader = line.slice(hunkHeaderStart + 3, hunkHeaderEnd);
            hunkHeaderLine = line;

            const [aHeader, bHeader] = hunkHeader.split(' ');
            const [startAString, deltaAString] = aHeader.split(',');
            const [startBString, deltaBString] = bHeader.split(',');

            assert.ok(startAString.startsWith('-'));
            startA = parseInt(startAString.slice(1), 10);
            deltaA = parseInt(deltaAString, 10);

            assert.ok(startBString.startsWith('+'));
            startB = parseInt(startBString.slice(1), 10);
            deltaB = parseInt(deltaBString, 10);

            state = 'hunk';
            hunkLines = [];

            // Don't add the first line to hunkLines
            continue;
        }

        // Handle state
        switch (state) {
            case 'commit':
                yield line;
                break;
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
}

function formatFileName(fileNameA: string, fileNameB: string) {
    let line: string;
    if (!fileNameA) {
        line = `${FILE_NAME_COLOR(fileNameB)} was added`;
    } else if (!fileNameB) {
        line = `${FILE_NAME_COLOR(fileNameA)} was removed`;
    } else if (fileNameA === fileNameB) {
        line = FILE_NAME_COLOR(fileNameA);
    } else {
        line = `${FILE_NAME_COLOR(fileNameA)} moved to ${FILE_NAME_COLOR(
            fileNameB
        )}`;
    }
    return line.padEnd(SCREEN_WIDTH);
}

function formatHunkLine(lineNo: number, line: string, fileName: string) {
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
    // Don't show line numbers for missing files
    const lineNoString = (fileName ? lineNo.toString() : '').padStart(
        LINE_NUMBER_WIDTH
    );
    const linePrefix = line.slice(0, 1).padStart(1);
    const lineWithoutPrefix = line.slice(1, LINE_WIDTH + 1).padEnd(LINE_WIDTH);
    return `${lineColor.dim(lineNoString)} ${lineColor(
        `${linePrefix} ${lineWithoutPrefix}`
    )}`;
}

function formatHunkSideBySide(
    hunkHeaderLine: string,
    hunkLines: string[],
    startA: number,
    deltaA: number,
    startB: number,
    deltaB: number,
    fileNameA: string,
    fileNameB: string
) {
    const formattedLines = [
        HUNK_HEADER_COLOR(hunkHeaderLine.padEnd(SCREEN_WIDTH)),
    ];

    const linesA = [];
    const linesB = [];
    for (const line of hunkLines) {
        if (line.startsWith('-')) {
            linesA.push(line);
        } else if (line.startsWith('+')) {
            linesB.push(line);
        } else {
            linesA.push(line);
            linesB.push(line);
        }
    }

    let offset = 0;
    let lineNoA = startA;
    let lineNoB = startB;
    while (offset < deltaA || offset < deltaB) {
        let lineA = '';
        let lineB = '';
        if (offset < deltaA) {
            lineA = linesA[offset];
            lineNoA++;
        }
        if (offset < deltaB) {
            lineB = linesB[offset];
            lineNoB++;
        }
        offset++;
        formattedLines.push(
            formatHunkLine(lineNoA, lineA, fileNameA) +
                formatHunkLine(lineNoB, lineB, fileNameB)
        );
    }

    return formattedLines;
}

async function* iterWithNewlines(lines: AsyncIterable<string>) {
    for await (const line of lines) {
        yield line + os.EOL;
    }
}

function transformWithIterables(
    input: stream.Readable,
    [firstTransformer, ...restTransformers]: [
        (input: stream.Readable) => AsyncIterable<string>,
        ...((iterable: AsyncIterable<string>) => AsyncIterable<string>)[]
    ],
    output: stream.Writable
) {
    let i = firstTransformer(input);
    for (const transformer of restTransformers) {
        i = transformer(i);
    }
    stream.pipeline(stream.Readable.from(i), output, (err) => console.error);
}

function main() {
    transformWithIterables(
        process.stdin,
        [
            iterlinesFromReadableAsync,
            iterateLinesWithoutAnsiColors,
            iterSideBySideDiff,
            iterWithNewlines,
        ],
        process.stdout
    );
}

main();
