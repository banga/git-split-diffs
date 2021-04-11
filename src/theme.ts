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
    HUNK_HEADER_COLOR: Chalk;
    DELETED_LINE_COLOR: Chalk;
    INSERTED_LINE_COLOR: Chalk;
    UNMODIFIED_LINE_COLOR: Chalk;
};

export function defaultTheme(chalkInstance: Chalk, screenWidth: number): Theme {
    return {
        COMMIT_SHA_COLOR: chalkInstance.cyan,
        COMMIT_AUTHOR_COLOR: chalkInstance.greenBright,
        COMMIT_DATE_COLOR: chalkInstance.white,
        FILE_NAME_COLOR: chalkInstance.yellowBright,
        HUNK_HEADER_COLOR: chalkInstance.white.dim,
        DELETED_LINE_COLOR: chalkInstance.redBright,
        INSERTED_LINE_COLOR: chalkInstance.greenBright,
        UNMODIFIED_LINE_COLOR: chalkInstance.white,

        SCREEN_WIDTH: screenWidth,
        LINE_NUMBER_WIDTH: 5,
        LINE_PREFIX_WIDTH: 5,
        MIN_LINE_WIDTH: 8,
    };
}
