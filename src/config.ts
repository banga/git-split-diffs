import { Theme } from './themes';

export type Config = Theme & {
    SCREEN_WIDTH: number;
    MIN_LINE_WIDTH: number;
    WRAP_LINES: boolean;
    HIGHLIGHT_LINE_CHANGES: boolean;
    SYNTAX_HIGHLIGHTING_THEME?: string;
};
