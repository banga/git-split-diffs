import { zipAsync } from './zipAsync';

async function collectAsync(...params: Parameters<typeof zipAsync>) {
    let items = [];
    for await (const item of zipAsync(...params)) {
        items.push(item);
    }
    return items;
}

test('empty', async () => {
    expect(await collectAsync(zipAsync())).toEqual([]);
});

test('single', async () => {
    async function* gen() {
        yield 1;
        yield 2;
        yield 3;
    }

    expect(await collectAsync(gen())).toEqual([[1], [2], [3]]);
});

test('equal lengths', async () => {
    async function* f() {
        yield 1;
        yield 2;
        yield 3;
    }

    async function* g() {
        yield 10;
        yield 20;
        yield 30;
    }

    expect(await collectAsync(f(), g())).toEqual([
        [1, 10],
        [2, 20],
        [3, 30],
    ]);
});

test('unequal lengths', async () => {
    async function* f() {
        yield 1;
        yield 2;
    }

    async function* g() {
        yield 10;
        yield 20;
        yield 30;
    }

    expect(await collectAsync(f(), g())).toEqual([
        [1, 10],
        [2, 20],
        [undefined, 30],
    ]);

    expect(await collectAsync(g(), f())).toEqual([
        [10, 1],
        [20, 2],
        [30, undefined],
    ]);
});
