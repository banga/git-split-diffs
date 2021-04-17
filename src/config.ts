import { Theme } from './themes';

export type Config = Theme & {
    SCREEN_WIDTH: number;
    LINE_NUMBER_WIDTH: number;
    MIN_LINE_WIDTH: number;
    WRAP_LINES: boolean;
};
