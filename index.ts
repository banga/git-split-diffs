import * as fs from 'fs';
import * as assert from 'assert';
import * as stream from 'stream';

async function* iterateReadableLinesAsync(readable: stream.Readable) {
    let prevLine: string | undefined = undefined;
    for await (const chunk of readable) {
        const lines: string[] = chunk.toString().split('\n');
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

type State = 'commit' | 'diff' | 'hunk';

async function* iterateParser(lines: AsyncIterable<string>) {
    let state = 'commit';

    // Diff metadata
    let fileNameA: string;
    let fileNameB: string;
    // Hunk metadata
    let startA: number | undefined = undefined;
    let deltaA: number | undefined = undefined;
    let startB: number | undefined = undefined;
    let deltaB: number | undefined = undefined;
    let linesA: string[] | undefined = undefined;
    let linesB: string[] | undefined = undefined;

    function* yieldHunk() {
        if (linesA) {
            yield {
                startA,
                deltaA,
                startB,
                deltaB,
            };
        }
    }

    for await (const line of lines) {
        const [prefix, rest] = line.split(' ', 1);

        switch (prefix) {
            case 'diff':
                if (state !== 'commit') {
                    yield* yieldHunk();
                }
                state = 'diff';
                break;
            case '@@':
                if (state !== 'commit') {
                    yield* yieldHunk();
                }
                state = 'hunk';
                break;
        }

        switch (state) {
            case 'commit':
                yield line;
                break;
            case 'diff':
                switch (prefix) {
                    case '---':
                        fileNameA = rest;
                        break;
                    case '---':
                        fileNameB = rest;
                        break;
                }
                break;
            case 'hunk':
                break;
        }

        yield `${state.toUpperCase()} ${line}`;
    }
}

async function test() {
    const stream = fs.createReadStream('', {
        fd: process.stdin.fd,
    });

    for await (const line of iterateParser(iterateReadableLinesAsync(stream))) {
        // TODO: optimize
        fs.writeSync(process.stdout.fd, line + '\n');
    }
}

test();
