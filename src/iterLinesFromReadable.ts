import * as stream from 'stream';

const NEWLINE_REGEX = /\r\n|\n/g;

/**
 * Given a string, yields each part in the string terminated by a newline and
 * returns the final part without a newline.
 */
function* yieldLinesFromString(string: string) {
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = NEWLINE_REGEX.exec(string))) {
        yield string.slice(lastIndex, match.index);
        lastIndex = match.index + match[0].length;
    }
    return string.slice(lastIndex);
}

/**
 * Converts a readable stream to an iterator that yields the stream's contents
 * line-by-line.
 */
export async function* iterlinesFromReadable(
    readable: stream.Readable
): AsyncIterable<string> {
    let string: string = '';
    for await (const chunk of readable) {
        string += (chunk as Buffer).toString();
        string = yield* yieldLinesFromString(string);
    }
    yield string;
}
