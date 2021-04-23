import { Chalk } from 'chalk';
import { exec } from 'child_process';
import * as util from 'util';
import { Config } from './config';
import { THEME_DEFINITIONS } from './themeDefinitions';
import { parseThemeDefinition } from './themes';
const execAsync = util.promisify(exec);

const GIT_CONFIG_KEY_PREFIX = 'split-diffs';
const GIT_CONFIG_LINE_REGEX = new RegExp(
    `${GIT_CONFIG_KEY_PREFIX}\.([^=]+)=(.*)`
);

async function getRawGitConfig() {
    const { stdout } = await execAsync('git config -l');

    const rawConfig: Record<string, string> = {};
    for (const line of stdout.trim().split('\n')) {
        const match = line.match(GIT_CONFIG_LINE_REGEX);
        if (!match) {
            continue;
        }
        const [, key, value] = match;
        rawConfig[key] = value;
    }
    return rawConfig;
}

// TODO: Make this less manual
export async function getGitConfig(
    screenWidth: number,
    chalk: Chalk
): Promise<Config> {
    const rawConfig = await getRawGitConfig();

    // Falls back to "default" if misssing/invalid
    const themeName =
        rawConfig['theme-name'] in THEME_DEFINITIONS
            ? rawConfig['theme-name']
            : 'default';
    const theme = parseThemeDefinition(THEME_DEFINITIONS[themeName], chalk);

    // Defaults to the theme's setting
    const syntaxHighlightingTheme =
        rawConfig['syntax-highlighting-theme'] ??
        theme.SYNTAX_HIGHLIGHTING_THEME;

    // Defaults to true
    const wrapLines = rawConfig['wrap-lines'] === 'false' ? false : true;

    // Defaults to true
    const highlightLineChanges =
        rawConfig['highlight-line-changes'] === 'false' ? false : true;

    // Defaults to 80
    let minLineWidth = 80;
    try {
        const parsedMinLineWidth = parseInt(rawConfig['min-line-width'], 10);
        if (!isNaN(parsedMinLineWidth)) {
            minLineWidth = parsedMinLineWidth;
        }
    } catch {}

    return {
        ...theme,
        SCREEN_WIDTH: screenWidth,
        MIN_LINE_WIDTH: minLineWidth,
        WRAP_LINES: wrapLines,
        HIGHLIGHT_LINE_CHANGES: highlightLineChanges,
        SYNTAX_HIGHLIGHTING_THEME: syntaxHighlightingTheme,
    };
}
