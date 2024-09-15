import path from 'path';
import { fileURLToPath } from 'url';

export type GitConfig = {
    MIN_LINE_WIDTH: number;
    WRAP_LINES: boolean;
    HIGHLIGHT_LINE_CHANGES: boolean;
    THEME_DIRECTORY: string;
    THEME_NAME: string;
    SYNTAX_HIGHLIGHTING_THEME?: string;
};

export const DEFAULT_MIN_LINE_WIDTH = 80;
export const DEFAULT_THEME_DIRECTORY = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'themes'
);
export const DEFAULT_THEME_NAME = 'dark';

const GIT_CONFIG_KEY_PREFIX = 'split-diffs';
const GIT_CONFIG_LINE_REGEX = new RegExp(
    `${GIT_CONFIG_KEY_PREFIX}\\.([^=]+)=(.*)`
);

function extractFromGitConfigString(configString: string) {
    const rawConfig: Record<string, string> = {};
    for (const line of configString.trim().split('\n')) {
        const match = line.match(GIT_CONFIG_LINE_REGEX);
        if (!match) {
            continue;
        }
        const [, key, value] = match;
        rawConfig[key] = value;
    }
    return rawConfig;
}

export function getGitConfig(configString: string): GitConfig {
    const rawConfig = extractFromGitConfigString(configString);

    let minLineWidth = DEFAULT_MIN_LINE_WIDTH;
    try {
        const parsedMinLineWidth = parseInt(rawConfig['min-line-width'], 10);
        if (!isNaN(parsedMinLineWidth)) {
            minLineWidth = parsedMinLineWidth;
        }
    } catch {
        // Ignore invalid values
    }

    return {
        MIN_LINE_WIDTH: minLineWidth,
        WRAP_LINES: rawConfig['wrap-lines'] !== 'false',
        HIGHLIGHT_LINE_CHANGES: rawConfig['highlight-line-changes'] !== 'false',
        THEME_DIRECTORY:
            rawConfig['theme-directory'] ?? DEFAULT_THEME_DIRECTORY,
        THEME_NAME: rawConfig['theme-name'] ?? DEFAULT_THEME_NAME,
        SYNTAX_HIGHLIGHTING_THEME: rawConfig['syntax-highlighting-theme'],
    };
}
