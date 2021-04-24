import { mergeColors } from './themes';

test('simple', () => {
    expect(mergeColors()).toEqual(undefined);

    expect(mergeColors({ r: 1, g: 2, b: 3, a: 0 })).toEqual({
        r: 1,
        g: 2,
        b: 3,
        a: 0,
    });
});

test('second color wins with no transparency', () => {
    expect(
        mergeColors(
            { r: 255, g: 0, b: 0, a: 255 },
            { r: 0, g: 255, b: 0, a: 255 }
        )
    ).toEqual({ r: 0, g: 255, b: 0, a: 255 });
});

test('first color wins with full transparency', () => {
    expect(
        mergeColors(
            { r: 255, g: 0, b: 0, a: 255 },
            { r: 0, g: 255, b: 0, a: 0 }
        )
    ).toEqual({ r: 255, g: 0, b: 0, a: 255 });
});
