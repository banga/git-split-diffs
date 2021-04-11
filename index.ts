import * as fs from 'fs';
import * as assert from 'assert';
import * as process from 'process';
import * as stream from 'stream';
import termSize from 'term-size';
import ansiRegex from 'ansi-regex';

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

const ANSI_COLOR_CODE_REGEX = ansiRegex();

async function* iterateLinesWithoutAnsiColors(lines: AsyncIterable<string>) {
    for await (const line of lines) {
        yield line.replace(ANSI_COLOR_CODE_REGEX, '');
    }
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

    // Each line in a diff is rendered as follows:
    // [  lineNoA] [        lineA] [  lineNoB] [       lineB]
    const { columns: screenWidth } = termSize();
    const lineNumberWidth = 4;
    const maxLineLength = Math.max(
        Math.floor((screenWidth - 2 * lineNumberWidth - 3) / 2),
        8
    );

    console.error({ screenWidth, lineNumberWidth, maxLineLength });

    // TODO: line wrapping
    function formatLine(
        lineNoA: number,
        lineA: string,
        lineNoB: number,
        lineB: string
    ) {
        return [
            lineNoA.toString().padStart(lineNumberWidth),
            lineA.slice(0, maxLineLength).padEnd(maxLineLength),
            lineNoB.toString().padStart(lineNumberWidth),
            lineB.slice(0, maxLineLength).padEnd(maxLineLength),
        ].join(' ');
    }

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
            yield formatLine(lineNoA, lineA, lineNoB, lineB);
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
                    yield ''.padStart(maxLineLength * 2, '*');
                    yield line.slice(6);
                    yield ''.padStart(maxLineLength * 2, '*');
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
