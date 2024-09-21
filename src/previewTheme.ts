import chalk from 'chalk';
import { execSync } from 'child_process';
import { Readable, Writable } from 'stream';
import terminalSize from 'terminal-size';
import { Config } from './getConfig';
import { getContextForConfig } from './context';
import { loadTheme } from './themes';
import { transformContentsStreaming } from './transformContentsStreaming';
import { DEFAULT_THEME_DIRECTORY } from './getGitConfig';

const CONFIG = {
    MIN_LINE_WIDTH: 40,
    WRAP_LINES: true,
    HIGHLIGHT_LINE_CHANGES: true,
};

async function previewTheme(
    themeDirectory: string,
    themeName: string,
    content: string
) {
    const theme = loadTheme(themeDirectory, themeName);

    const { rows, columns } = terminalSize();
    const config: Config = {
        ...CONFIG,
        ...theme,
    };

    const context = await getContextForConfig(config, chalk, columns);

    let linesWritten = 0;
    await transformContentsStreaming(
        context,
        Readable.from(content),
        new (class extends Writable {
            write(chunk: Buffer) {
                if (linesWritten < rows - 1) {
                    process.stdout.write(chunk);
                }
                linesWritten++;
                return true;
            }
        })()
    );
}

function main() {
    if (process.argv.length < 4) {
        console.error(
            `Usage: ${process.argv[1]} <sha> <theme name> [theme directory]`
        );
        process.exit(1);
    }

    const [, , sha, themeName, themeDirectory = DEFAULT_THEME_DIRECTORY] =
        process.argv;

    const content = execSync(`git show ${sha}`).toString();

    // Clear screen
    process.stdout.write('\x1bc');

    previewTheme(themeDirectory, themeName, content);
}

main();
