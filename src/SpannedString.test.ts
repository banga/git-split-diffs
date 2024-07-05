import { SpannedString } from './SpannedString';

function S() {
    return SpannedString.create<string>();
}

function apply(string: SpannedString<string>) {
    return Array.from(string.iterSubstrings())
        .map(([substring, tags]) => {
            let s = substring;
            for (const tag of tags) {
                s = `<${tag}>${s}</${tag}>`;
            }
            return s;
        })
        .join('');
}

function format(string: string, spans: [number, number, string][]) {
    const s = S().appendString(string);
    for (const span of spans) {
        s.addSpan(...span);
    }
    return apply(s);
}

test('no spans', () => {
    expect(format('one two', [])).toEqual('one two');
});

test('single span', () => {
    expect(format('one two', [[0, 3, 'b']])).toEqual('<b>one</b> two');

    expect(format('one two', [[3, 4, 'b']])).toEqual('one<b> </b>two');

    expect(format('one two', [[4, 7, 'b']])).toEqual('one <b>two</b>');
});

test('non-overlapping spans', () => {
    expect(
        format('one two', [
            [0, 3, 'b'],
            [4, 7, 'i'],
        ])
    ).toEqual('<b>one</b> <i>two</i>');

    expect(
        format('one two', [
            [4, 7, 'i'],
            [0, 3, 'b'],
        ])
    ).toEqual('<b>one</b> <i>two</i>');
});

test('adjacent spans', () => {
    expect(
        format('one two', [
            [0, 4, 'b'],
            [4, 7, 'i'],
        ])
    ).toEqual('<b>one </b><i>two</i>');
});

test('containing spans', () => {
    expect(
        format('one two', [
            [2, 4, 'b'],
            [0, 7, 'i'],
        ])
    ).toEqual('<i>on</i><i><b>e </b></i><i>two</i>');

    expect(
        format('one two three', [
            [0, 3, 'i'],
            [4, 7, 'b'],
            [0, 13, 'u'],
        ])
    ).toEqual('<u><i>one</i></u><u> </u><u><b>two</b></u><u> three</u>');

    expect(
        format('one two', [
            [1, 6, 'i'],
            [2, 5, 'b'],
            [3, 4, 'u'],
        ])
    ).toEqual(
        'o<i>n</i><b><i>e</i></b><u><b><i> </i></b></u><b><i>t</i></b><i>w</i>o'
    );
});

test('overlapping spans', () => {
    expect(
        format('one two', [
            [0, 4, 'b'],
            [3, 7, 'i'],
        ])
    ).toEqual('<b>one</b><i><b> </b></i><i>two</i>');

    expect(
        format('one two', [
            [3, 7, 'i'],
            [0, 4, 'b'],
        ])
    ).toEqual('<b>one</b><b><i> </i></b><i>two</i>');
});

test('order of application', () => {
    expect(
        format('one', [
            [0, 3, 'b'],
            [0, 3, 'i'],
        ])
    ).toEqual('<i><b>one</b></i>');

    expect(
        format('one', [
            [0, 3, 'i'],
            [0, 3, 'b'],
        ])
    ).toEqual('<b><i>one</i></b>');

    expect(
        format('one', [
            [0, 3, 'b'],
            [1, 3, 'i'],
        ])
    ).toEqual('<b>o</b><i><b>ne</b></i>');

    expect(
        format('one', [
            [1, 3, 'i'],
            [0, 3, 'b'],
        ])
    ).toEqual('<b>o</b><b><i>ne</i></b>');
});

test('construction', () => {
    const string = S()
        .appendString('one', 'b')
        .appendString(' ')
        .appendString('two', 'b', 'i')
        .appendString(' ')
        .appendString('three', 'u');

    expect(Array.from(string.iterSubstrings())).toEqual([
        ['one', ['b']],
        [' ', []],
        ['two', ['b', 'i']],
        [' ', []],
        ['three', ['u']],
    ]);
});

test('identical attributes', () => {
    {
        const a = S()
            .appendString('one', 'b')
            .appendString('two')
            .addSpan(0, 6, 'u');
        expect(apply(a)).toEqual('<u><b>one</b></u><u>two</u>');
    }

    {
        const a = S()
            .appendString('one', 'b')
            .appendString('two')
            .addSpan(0, 6, 'b');
        expect(apply(a)).toEqual('<b><b>one</b></b><b>two</b>');
    }
});

describe('slice', () => {
    test('containing spans', () => {
        const string = S().appendString('one', 'b').addSpan(1, 3, 'i');
        expect(apply(string)).toEqual('<b>o</b><i><b>ne</b></i>');

        expect(apply(string.slice(1))).toEqual('<i><b>ne</b></i>');

        expect(apply(string.slice(0, 1))).toEqual('<b>o</b>');

        expect(apply(string.slice(1, 2))).toEqual('<i><b>n</b></i>');

        expect(apply(string.slice(2, 3))).toEqual('<i><b>e</b></i>');
    });

    test('overlapping spans', () => {
        const string = S()
            .appendString('one two three')
            .addSpan(0, 7, 'b')
            .addSpan(4, 13, 'i');
        expect(apply(string)).toEqual(
            '<b>one </b><i><b>two</b></i><i> three</i>'
        );

        expect(apply(string.slice(4, 7))).toEqual('<i><b>two</b></i>');

        expect(apply(string.slice(0, 3))).toEqual('<b>one</b>');

        expect(apply(string.slice(8, 13))).toEqual('<i>three</i>');
    });

    test('empty span', () => {
        const string = S().appendString('one', 'b');
        expect(apply(string.slice(0, 0))).toEqual('');
    });

    test('out of bounds indexes', () => {
        const a = S().appendString('one');

        expect(apply(a.slice(0, 10))).toEqual('one');

        expect(apply(a.slice(10, 10))).toEqual('');

        expect(() => apply(a.slice(-1, 3))).toThrow();
    });

    test('discard leading spans', () => {
        const a = S()
            .appendString('12')
            .addSpan(0, 1, 'i')
            .slice(1, 2)
            .appendString('3');
        expect(apply(a)).toEqual('23');
    });

    test('discard trailing spans', () => {
        const a = S()
            .appendString('12')
            .addSpan(1, 2, 'i')
            .slice(0, 1)
            .appendString('3');
        expect(apply(a)).toEqual('13');
    });
});

describe('appendSpannedString', () => {
    test('no spans', () => {
        const s = S()
            .appendString('one')
            .appendSpannedString(S().appendString('two'));
        expect(apply(s)).toEqual('onetwo');
    });

    test('one span', () => {
        const a = S()
            .appendString('one', 'b')
            .appendSpannedString(S().appendString('two'));
        expect(apply(a)).toEqual('<b>one</b>two');
    });

    test('adjacent spans', () => {
        const a = S()
            .appendString('one', 'b')
            .appendSpannedString(S().appendString('two', 'i'));
        expect(apply(a)).toEqual('<b>one</b><i>two</i>');
    });

    test('multiple spans', () => {
        const a = S()
            .appendString('one', 'b')
            .addSpan(1, 2, 'u')
            .appendSpannedString(
                S().appendString('two', 'i').addSpan(2, 3, 'u')
            );
        expect(apply(a)).toEqual(
            '<b>o</b><u><b>n</b></u><b>e</b><i>tw</i><u><i>o</i></u>'
        );
    });

    test('modify concatenated string', () => {
        const a = S().appendString('one', 'b');
        const b = S().appendString('two', 'i');
        a.appendSpannedString(b).addSpan(0, 6, 'u').addSpan(3, 6, 'em');
        const c = a.slice(3, 6);

        expect(apply(a)).toEqual('<u><b>one</b></u><em><u><i>two</i></u></em>');
        expect(apply(b)).toEqual('<i>two</i>');
        expect(apply(c)).toEqual('<em><u><i>two</i></u></em>');
    });
});
