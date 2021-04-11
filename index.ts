import * as fs from 'fs';
import * as assert from 'assert';
import * as process from 'process';
import * as stream from 'stream';
import termSize from 'term-size';
import ansiRegex from 'ansi-regex';
import chalk from 'chalk';

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
async function* iterateLinesWithoutAnsiColors(lines: AsyncIterable<string>) {
    for await (const line of lines) {
        yield line.replace(ANSI_COLOR_CODE_REGEX, '');
    }
}

async function* iterateReadableLinesAsync(readable: stream.Readable) {
    let prevLine: string | undefined = undefined;
    for await (const chunk of readable) {
        const lines: string[] = chunk.toString().split(/\r\n|\n/);
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

function* iterFileName(fileNameA: string, fileNameB: string) {
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
    yield line.padEnd(SCREEN_WIDTH);
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

function* iterHunkLines(
    hunkHeaderLine: string,
    hunkLines: string[],
    startA: number,
    deltaA: number,
    startB: number,
    deltaB: number,
    fileNameA: string,
    fileNameB: string
) {
    yield HUNK_HEADER_COLOR(hunkHeaderLine.padEnd(SCREEN_WIDTH));

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
        yield `${formatHunkLine(lineNoA, lineA, fileNameA)}${formatHunkLine(
            lineNoB,
            lineB,
            fileNameB
        )}`;
    }
}

type State = 'commit' | 'diff' | 'hunk';

async function* iterateUnifiedDiff(lines: AsyncIterable<string>) {
    let state: State = 'commit';

    // File metadata
    let fileNameA: string = '';
    let fileNameB: string = '';
    const yieldFileName = () => iterFileName(fileNameA, fileNameB);

    // Hunk metadata
    let startA: number = -1;
    let deltaA: number = -1;
    let startB: number = -1;
    let deltaB: number = -1;
    let hunkHeaderLine: string = '';
    let hunkLines: string[] = [];
    const yieldHunk = () =>
        iterHunkLines(
            hunkHeaderLine,
            hunkLines,
            startA,
            deltaA,
            startB,
            deltaB,
            fileNameA,
            fileNameB
        );

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

async function test() {
    for await (const line of iterateUnifiedDiff(
        iterateLinesWithoutAnsiColors(iterateReadableLinesAsync(process.stdin))
    )) {
        fs.writeSync(process.stdout.fd, line + '\n');
    }
}

test().catch(console.error);
