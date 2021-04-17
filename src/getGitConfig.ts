import { Chalk } from 'chalk';
import { exec } from 'child_process';
import * as util from 'util';
import { Config } from './config';
import { THEME_DEFINITIONS } from './themeDefinitions';
import { parseTheme } from './themes';
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

    // Defaults to true
    const wrapLines = rawConfig['wrap-lines'] === 'false' ? false : true;

    const themeName =
        rawConfig['theme-name'] in THEME_DEFINITIONS
            ? rawConfig['theme-name']
            : 'default';

    return {
        SCREEN_WIDTH: screenWidth,
        LINE_NUMBER_WIDTH: 5,
        MIN_LINE_WIDTH: 8,
        WRAP_LINES: wrapLines,
        ...parseTheme(THEME_DEFINITIONS[themeName], chalk),
    };
}
