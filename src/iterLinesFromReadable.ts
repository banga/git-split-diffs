import * as stream from 'stream';

const NEWLINE_REGEX = /\r\n|\n/;

/**
 * Converts a readable stream to an iterator that yields the stream's contents
 * line-by-line.
 */
export async function* iterlinesFromReadableAsync(
    readable: stream.Readable
): AsyncIterable<string> {
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
