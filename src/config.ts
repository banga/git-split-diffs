export type Config = {
    SCREEN_WIDTH: number;
    LINE_NUMBER_WIDTH: number;
    MIN_LINE_WIDTH: number;

    /* 
        If true, lines longer than half the screen width will be wrapped around.
        If false, they will be truncated.
    */
    WRAP_LINES: boolean;
    THEME_NAME: string;
};

export const CONFIG_DEFAULTS = {
    LINE_NUMBER_WIDTH: 5,
    MIN_LINE_WIDTH: 8,
    WRAP_LINES: true,
    THEME_NAME: 'default',
};
