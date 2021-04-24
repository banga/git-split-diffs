import { zip } from './zip';

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
