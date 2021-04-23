import { Readable } from 'stream';
import { Context } from './context';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable';

/**
 * Convenience function for transforming a readable stream, `input`, via a
 * series of transformers written as async iterable functions, into a writable
 * stream, `output`.
 */
export function transformStreamWithIterables(
    context: Context,
    input: Readable,
    transformers: ((
        context: Context,
        iterable: AsyncIterable<string>
    ) => AsyncIterable<string>)[]
): Readable {
    let i = iterlinesFromReadableAsync(input);
    for (const transformer of transformers) {
        i = transformer(context, i);
    }
    return Readable.from(i);
}
