import { exec } from 'child_process';
import * as util from 'util';
import { Config } from './config';
import { THEME_DEFINITIONS } from './themeDefinitions';
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
export async function getGitConfig() {
    const rawConfig = await getRawGitConfig();
    const config: Partial<Config> = {};

    if (rawConfig['wrap-lines'] === 'true') {
        config.WRAP_LINES = true;
    } else if (rawConfig['wrap-lines'] === 'false') {
        config.WRAP_LINES = false;
    }

    const themeNames = Object.keys(THEME_DEFINITIONS);
    if (themeNames.includes(rawConfig['theme-name'])) {
        config.THEME_NAME = rawConfig['theme-name'];
    }

    return config;
}
