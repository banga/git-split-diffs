import * as shikiji from 'shikiji';
import { Config } from './config';
import { FormattedString, T } from './formattedString';

/**
 * Internal context object used to pass around config and config-derived
 * constants.
 */
export type Context = Config & {
    SPLIT_DIFFS: boolean;
    LINE_WIDTH: number;
    BLANK_LINE: string;
    HORIZONTAL_SEPARATOR: FormattedString;
    HIGHLIGHTER?: shikiji.Highlighter;
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
    const HORIZONTAL_SEPARATOR = T()
        .fillWidth(config.SCREEN_WIDTH, '─')
        .addSpan(0, config.SCREEN_WIDTH, config.BORDER_COLOR);

    let HIGHLIGHTER = undefined;
    if (config.SYNTAX_HIGHLIGHTING_THEME) {
        HIGHLIGHTER = await shikiji.getHighlighter({
            themes: [config.SYNTAX_HIGHLIGHTING_THEME],
            langs: [],
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
