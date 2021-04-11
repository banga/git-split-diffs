import { Readable } from 'stream';

/**
 * Convenience function for transforming a readable stream, `input`, via a
 * series of transformers written as async iterable functions, into a writable
 * stream, `output`.
 */
export function transformStreamWithIterables(
    input: Readable,
    firstTransformer: (input: Readable) => AsyncIterable<string>,
    ...restTransformers: ((
        iterable: AsyncIterable<string>
    ) => AsyncIterable<string>)[]
): Readable {
    let i = firstTransformer(input);
    for (const transformer of restTransformers) {
        i = transformer(i);
    }
    return Readable.from(i);
}
