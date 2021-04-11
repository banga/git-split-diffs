import * as stream from 'stream';

/**
 * Convenience function for transforming a readable stream, `input`, via a
 * series of transformers written as async iterable functions, into a writable
 * stream, `output`.
 */
export function transformStreamWithIterables(
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
    stream.pipeline(stream.Readable.from(i), output, (err) =>
        console.error(err)
    );
}
