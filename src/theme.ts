import type { Chalk } from 'chalk';

export type Theme = {
    SCREEN_WIDTH: number;
    LINE_NUMBER_WIDTH: number;
    LINE_PREFIX_WIDTH: number;
    MIN_LINE_WIDTH: number;

    COMMIT_SHA_COLOR: Chalk;
    COMMIT_AUTHOR_COLOR: Chalk;
    COMMIT_DATE_COLOR: Chalk;

    FILE_NAME_COLOR: Chalk;
    FILE_NAME_BORDER_COLOR: Chalk;
    HUNK_HEADER_COLOR: Chalk;

    DELETED_LINE_COLOR: Chalk;
    INSERTED_LINE_COLOR: Chalk;
    UNMODIFIED_LINE_COLOR: Chalk;
    MISSING_LINE_COLOR: Chalk;
};

export function defaultTheme(chalkInstance: Chalk, screenWidth: number): Theme {
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

        SCREEN_WIDTH: screenWidth,
        LINE_NUMBER_WIDTH: 5,
        LINE_PREFIX_WIDTH: 5,
        MIN_LINE_WIDTH: 8,
    };
}

export function githubTheme(chalkInstance: Chalk, screenWidth: number): Theme {
    return {
        COMMIT_SHA_COLOR: chalkInstance.white.dim,
        COMMIT_AUTHOR_COLOR: chalkInstance.white.bold,
        COMMIT_DATE_COLOR: chalkInstance.white.dim,
        FILE_NAME_COLOR: chalkInstance.hex('adbac7'),
        FILE_NAME_BORDER_COLOR: chalkInstance.bgHex('22272e'),
        HUNK_HEADER_COLOR: chalkInstance.hex('768390').bgHex('233040'),
        DELETED_LINE_COLOR: chalkInstance.hex('e5534b').bgHex('442d30'),
        INSERTED_LINE_COLOR: chalkInstance.hex('57ab5a').bgHex('253230'),
        UNMODIFIED_LINE_COLOR: chalkInstance.hex('adbac7').bgHex('22282d'),
        MISSING_LINE_COLOR: chalkInstance.bgHex('2d333b'),

        SCREEN_WIDTH: screenWidth,
        LINE_NUMBER_WIDTH: 5,
        LINE_PREFIX_WIDTH: 5,
        MIN_LINE_WIDTH: 8,
    };
}
