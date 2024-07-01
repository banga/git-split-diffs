import * as shikiji from 'shikiji';
import { Config } from './getConfig';
import { FormattedString, T } from './formattedString';
import { ChalkInstance } from 'chalk';

/**
 * Internal context object used to pass around config and config-derived
 * constants.
 */
export type Context = Config & {
    CHALK: ChalkInstance;
    SPLIT_DIFFS: boolean;
    SCREEN_WIDTH: number;
    HORIZONTAL_SEPARATOR: FormattedString;
    HIGHLIGHTER?: shikiji.Highlighter;
};

export async function getContextForConfig(
    config: Config,
    chalk: ChalkInstance,
    screenWidth: number
): Promise<Context> {
    const SCREEN_WIDTH = screenWidth;

    // Only split diffs if there's enough room
    const SPLIT_DIFFS = SCREEN_WIDTH >= config.MIN_LINE_WIDTH * 2;

    const HORIZONTAL_SEPARATOR = T()
        .fillWidth(SCREEN_WIDTH, '─')
        .addSpan(0, SCREEN_WIDTH, config.BORDER_COLOR);

    let HIGHLIGHTER = undefined;
    if (config.SYNTAX_HIGHLIGHTING_THEME) {
        HIGHLIGHTER = await shikiji.getHighlighter({
            themes: [config.SYNTAX_HIGHLIGHTING_THEME],
            langs: [],
        });
    }
    return {
        ...config,
        CHALK: chalk,
        SCREEN_WIDTH,
        SPLIT_DIFFS,
        HORIZONTAL_SEPARATOR,
        HIGHLIGHTER,
    };
}
