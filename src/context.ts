import * as shiki from 'shiki';
import { Config } from './getConfig';
import { FormattedString, T } from './formattedString';
import { ChalkInstance } from 'chalk';

/**
 * Internal context object used to pass around config and config-derived
 * constants.
 */
export type Context = Config & {
    CHALK: ChalkInstance;
    SCREEN_WIDTH: number;
    HORIZONTAL_SEPARATOR: FormattedString;
    HIGHLIGHTER?: shiki.Highlighter;
};

export async function getContextForConfig(
    config: Config,
    chalk: ChalkInstance,
    screenWidth: number
): Promise<Context> {
    const SCREEN_WIDTH = screenWidth;

    const HORIZONTAL_SEPARATOR = T()
        .fillWidth(SCREEN_WIDTH, '─')
        .addSpan(0, SCREEN_WIDTH, config.BORDER_COLOR);

    let HIGHLIGHTER = undefined;
    if (config.SYNTAX_HIGHLIGHTING_THEME) {
        HIGHLIGHTER = await shiki.createHighlighter({
            themes: [config.SYNTAX_HIGHLIGHTING_THEME],
            langs: [],
        });
    }
    return {
        ...config,
        CHALK: chalk,
        SCREEN_WIDTH,
        HORIZONTAL_SEPARATOR,
        HIGHLIGHTER,
    };
}
