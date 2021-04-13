import { wrapLineByWord } from './wrapLineByWord';

test('single line', () => {
    expect(wrapLineByWord('one two three', 100)).toEqual(['one two three']);
});

test('one word per line', () => {
    expect(wrapLineByWord('one two three', 5)).toEqual([
        'one ',
        'two ',
        'three',
    ]);
});

test('multiple words per line', () => {
    expect(wrapLineByWord('one two three four five six', 10)).toEqual([
        'one two ',
        'three four',
        ' five six',
    ]);
});

test('leading and trailing spaces', () => {
    expect(wrapLineByWord(' one two ', 3)).toEqual([
        ' ',
        'one',
        ' ',
        'two',
        ' ',
    ]);
});

test('multiple spaces', () => {
    expect(wrapLineByWord('one   two', 4)).toEqual(['one ', '  ', 'two']);
});

test('break long words', () => {
    expect(wrapLineByWord('one longword two', 3)).toEqual([
        'one',
        ' lo',
        'ngw',
        'ord',
        ' ',
        'two',
    ]);
});

test('snapshot tests', () => {
    function wrapAndJoin(text: string, width: number): string {
        return wrapLineByWord(text, width).join('\n');
    }

    expect(
        wrapAndJoin(
            `export function defaultTheme(chalkInstance: Chalk): Theme {
    return {
        COMMIT_SHA_COLOR: chalkInstance.green,
        COMMIT_AUTHOR_COLOR: chalkInstance.blueBright,
        COMMIT_DATE_COLOR: chalkInstance.white,
        FILE_NAME_COLOR: chalkInstance.yellowBright,
        FILE_NAME_BORDER_COLOR: chalkInstance.yellow,
        HUNK_HEADER_COLOR: chalkInstance.white.dim,
        DELETED_LINE_COLOR: chalkInstance.redBright,
        INSERTED_LINE_COLOR: chalkInstance.greenBright,
        UNMODIFIED_LINE_COLOR: chalkInstance.white,
        MISSING_LINE_COLOR: chalkInstance.white,
    };
}`,
            80
        )
    ).toMatchInlineSnapshot(`
        "export function defaultTheme(chalkInstance: Chalk): Theme {
            return {
               
         COMMIT_SHA_COLOR: chalkInstance.green,
                COMMIT_AUTHOR_COLOR: 
        chalkInstance.blueBright,
                COMMIT_DATE_COLOR: chalkInstance.white,
              
          FILE_NAME_COLOR: chalkInstance.yellowBright,
                FILE_NAME_BORDER_COLOR: 
        chalkInstance.yellow,
                HUNK_HEADER_COLOR: chalkInstance.white.dim,
              
          DELETED_LINE_COLOR: chalkInstance.redBright,
                INSERTED_LINE_COLOR: 
        chalkInstance.greenBright,
                UNMODIFIED_LINE_COLOR: chalkInstance.white,
         
               MISSING_LINE_COLOR: chalkInstance.white,
            };
        }"
    `);

    expect(
        wrapAndJoin(
            `“TO THE RED-HEADED LEAGUE: On account of the bequest of the late Ezekiah Hopkins, of Lebanon, Pennsylvania, U.S.A., there is now another vacancy open which entitles a member of the League to a salary of £ 4 a week for purely nominal services. All red-headed men who are sound in body and mind and above the age of twenty-one years, are eligible. Apply in person on Monday, at eleven o’clock, to Duncan Ross, at the offices of the League, 7 Pope’s Court, Fleet Street.”`,
            40
        )
    ).toMatchInlineSnapshot(`
        "“TO THE RED-HEADED LEAGUE: On account of
         the bequest of the late Ezekiah 
        Hopkins, of Lebanon, Pennsylvania, 
        U.S.A., there is now another vacancy 
        open which entitles a member of the 
        League to a salary of £ 4 a week for 
        purely nominal services. All red-headed 
        men who are sound in body and mind and 
        above the age of twenty-one years, are 
        eligible. Apply in person on Monday, at 
        eleven o’clock, to Duncan Ross, at the 
        offices of the League, 7 Pope’s Court, 
        Fleet Street.”"
    `);
});
