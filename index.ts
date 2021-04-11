import * as fs from 'fs';
import * as assert from 'assert';
import * as process from 'process';
import * as stream from 'stream';
import termSize from 'term-size';
import ansiRegex from 'ansi-regex';
import chalk from 'chalk';

/*
    Each line in a hunk is rendered as follows:
    <lineNo[maxLineNoWidth]> <linePrefix[1]> <lineWithoutPrefix[LINE_WIDTH]> <lineNo[maxLineNoWidth]> <linePrefix[1]> <lineWithoutPrefix[LINE_WIDTH]>

    So (maxLineNoWidth + 1 + 1 + 1 + LINE_WIDTH) * 2 + 1 = SCREEN_WIDTH
*/
const { columns: SCREEN_WIDTH } = termSize();
const LINE_NUMBER_WIDTH = 5;
const MIN_LINE_WIDTH = 8;
const LINE_WIDTH = Math.max(
    Math.floor((SCREEN_WIDTH - 1) / 2 - 3 - LINE_NUMBER_WIDTH),
    MIN_LINE_WIDTH
);

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

const deletedLineColor = chalk.red;
const insertedLineColor = chalk.green;
const normalColor = chalk.white;

function formatHunkLine(lineNo: number, line: string) {
    const linePrefix = line.slice(0, 1);
    const lineWithoutPrefix = line.slice(1);
    let lineColor;
    switch (linePrefix) {
        case '-':
            lineColor = deletedLineColor;
            break;
        case '+':
            lineColor = insertedLineColor;
            break;
        default:
            lineColor = normalColor;
    }
    return [
        lineColor(lineNo.toString().padStart(LINE_NUMBER_WIDTH)),
        lineColor(linePrefix.padStart(1)),
        lineColor(lineWithoutPrefix.slice(0, LINE_WIDTH).padEnd(LINE_WIDTH)),
    ].join(' ');
}

type State = 'commit' | 'diff' | 'hunk';

/**
 * Converts streaming git diff output to unified diff format
 */
async function* iterateUnifiedDiff(lines: AsyncIterable<string>) {
    let state: State = 'commit';

    // Hunk metadata
    let startA: number = -1;
    let deltaA: number = -1;
    let startB: number = -1;
    let deltaB: number = -1;
    let hunkStartLine: string;
    let hunkLines: string[] = [];

    function* yieldHunkIfNeeded() {
        if (hunkLines.length === 0) {
            return;
        }

        yield ` ··· ${hunkStartLine}`;
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
            yield `${formatHunkLine(lineNoA, lineA)} ${formatHunkLine(
                lineNoB,
                lineB
            )}`;
        }
        hunkLines = [];
    }

    for await (const line of lines) {
        // Handle state transitions
        if (line.startsWith('diff ')) {
            yield* yieldHunkIfNeeded();
            state = 'diff';
        } else if (line.startsWith('@@')) {
            yield* yieldHunkIfNeeded();

            const hunkHeaderStart = line.indexOf('@@ ');
            const hunkHeaderEnd = line.indexOf(' @@', hunkHeaderStart + 1);
            assert.ok(hunkHeaderStart >= 0);
            assert.ok(hunkHeaderEnd > hunkHeaderStart);
            const hunkHeader = line.slice(hunkHeaderStart + 3, hunkHeaderEnd);
            hunkStartLine = line.slice(hunkHeaderEnd + 3);

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
            continue;
        }

        // Handle state
        switch (state) {
            case 'commit':
                yield line;
                break;
            case 'diff':
                if (line.startsWith('---')) {
                    yield line.slice(6);
                }
                break;
            case 'hunk': {
                hunkLines.push(line);
                break;
            }
        }
    }

    yield* yieldHunkIfNeeded();
}

async function test() {
    for await (const line of iterateUnifiedDiff(
        iterateLinesWithoutAnsiColors(iterateReadableLinesAsync(process.stdin))
    )) {
        fs.writeSync(process.stdout.fd, line + '\n');
    }
}

test().catch(console.error);
