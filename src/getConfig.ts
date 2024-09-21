import { GitConfig } from './getGitConfig';
import { Theme, loadTheme } from './themes';
import * as shiki from 'shiki';

export type Config = Theme & {
    MIN_LINE_WIDTH: number;
    WRAP_LINES: boolean;
    HIGHLIGHT_LINE_CHANGES: boolean;
};

export const CONFIG_DEFAULTS: Omit<Config, keyof Theme> = {
    MIN_LINE_WIDTH: 80,
    WRAP_LINES: true,
    HIGHLIGHT_LINE_CHANGES: true,
};

export function getConfig(gitConfig: GitConfig): Config {
    const theme = loadTheme(gitConfig.THEME_DIRECTORY, gitConfig.THEME_NAME);

    return {
        ...CONFIG_DEFAULTS,
        ...theme,
        ...gitConfig,
        SYNTAX_HIGHLIGHTING_THEME: (gitConfig.SYNTAX_HIGHLIGHTING_THEME ??
            theme.SYNTAX_HIGHLIGHTING_THEME) as shiki.BundledTheme,
    };
}
