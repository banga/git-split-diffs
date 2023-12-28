import { zip, zipAsync } from './zip';

describe('zip', () => {
    test('empty', () => {
        expect([...zip()]).toEqual([]);
    });

    test('single', () => {
        expect([...zip([1, 2, 3])]).toEqual([[1], [2], [3]]);
    });

    test('equal lengths', () => {
        expect([...zip([1, 2], [3, 4])]).toEqual([
            [1, 3],
            [2, 4],
        ]);
    });

    test('unequal lengths', () => {
        expect([...zip([1, 2], [3])]).toEqual([
            [1, 3],
            [2, undefined],
        ]);

        expect([...zip([1], [3, 4])]).toEqual([
            [1, 3],
            [undefined, 4],
        ]);
    });
});

describe('zipAsync', () => {
    async function drain<T>(i: AsyncIterable<T>): Promise<Array<T>> {
        const values = [];
        for await (const value of i) {
            values.push(value);
        }
        return values;
    }

    test('empty', async () => {
        expect(await drain(zipAsync())).toEqual([]);
    });

    test('single', async () => {
        async function* g() {
            yield Promise.resolve(1);
            yield Promise.resolve(2);
            yield Promise.resolve(3);
        }
        expect(await drain(zipAsync(g()))).toEqual([[1], [2], [3]]);
    });

    test('equal lengths', async () => {
        async function* g1() {
            yield Promise.resolve(1);
            yield Promise.resolve(2);
        }
        async function* g2() {
            yield Promise.resolve(3);
            yield Promise.resolve(4);
        }
        expect(await drain(zipAsync(g1(), g2()))).toEqual([
            [1, 3],
            [2, 4],
        ]);
    });

    test('unequal lengths', async () => {
        {
            async function* g1() {
                yield Promise.resolve(1);
                yield Promise.resolve(2);
            }
            async function* g2() {
                yield Promise.resolve(3);
            }
            expect(await drain(zipAsync(g1(), g2()))).toEqual([
                [1, 3],
                [2, undefined],
            ]);
        }

        {
            async function* g1() {
                yield Promise.resolve(1);
            }
            async function* g2() {
                yield Promise.resolve(3);
                yield Promise.resolve(4);
            }
            expect(await drain(zipAsync(g1(), g2()))).toEqual([
                [1, 3],
                [undefined, 4],
            ]);
        }
    });
});
