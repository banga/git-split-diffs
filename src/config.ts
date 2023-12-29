import { ChalkInstance } from 'chalk';
import { Theme } from './themes';
import * as shikiji from 'shikiji';

export type Config = Theme & {
    CHALK: ChalkInstance;
    SCREEN_WIDTH: number;
    MIN_LINE_WIDTH: number;
    WRAP_LINES: boolean;
    HIGHLIGHT_LINE_CHANGES: boolean;
    SYNTAX_HIGHLIGHTING_THEME?: shikiji.BundledTheme;
};
