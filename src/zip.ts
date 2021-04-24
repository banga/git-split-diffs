export function* zip<T extends Array<any>>(
    ...iterables: { [K in keyof T]: Iterable<T[K]> }
): Iterable<{ [K in keyof T]: T[K] | undefined }> {
    const iterators = iterables.map((iterable) => iterable[Symbol.iterator]());

    while (true) {
        const values = [];
        let hasMore = false;
        for (const iterator of iterators) {
            const { done, value } = iterator.next();
            hasMore ||= !done;
            values.push(value);
        }
        if (!hasMore) {
            return;
        }
        yield values as T;
    }
}
