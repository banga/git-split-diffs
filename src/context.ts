import { getHighlighter, Highlighter } from 'shiki';
import { Config } from './config';

/**
 * Internal context object used to pass around config and config-derived
 * constants.
 */
export type Context = Config & {
    SPLIT_DIFFS: boolean;
    LINE_WIDTH: number;
    BLANK_LINE: string;
    HORIZONTAL_SEPARATOR: string;
    HIGHLIGHTER?: Highlighter;
};

export async function getContextForConfig(config: Config): Promise<Context> {
    // Only split diffs if there's enough room
    const SPLIT_DIFFS = config.SCREEN_WIDTH >= config.MIN_LINE_WIDTH * 2;

    let LINE_WIDTH: number;
    if (SPLIT_DIFFS) {
        LINE_WIDTH = Math.floor(config.SCREEN_WIDTH / 2);
    } else {
        LINE_WIDTH = config.SCREEN_WIDTH;
    }

    const BLANK_LINE = ''.padStart(LINE_WIDTH);
    const HORIZONTAL_SEPARATOR = config.BORDER_COLOR(
        ''.padStart(config.SCREEN_WIDTH, '─')
    );

    let HIGHLIGHTER = undefined;
    if (config.SYNTAX_HIGHLIGHTING_THEME) {
        HIGHLIGHTER = await getHighlighter({
            theme: config.SYNTAX_HIGHLIGHTING_THEME,
        });
    }

    return {
        ...config,
        SPLIT_DIFFS,
        LINE_WIDTH,
        BLANK_LINE,
        HORIZONTAL_SEPARATOR,
        HIGHLIGHTER,
    };
}
