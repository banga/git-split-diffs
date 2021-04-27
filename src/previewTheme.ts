import chalk from 'chalk';
import { execSync } from 'child_process';
import { Readable, Writable } from 'stream';
import terminalSize from 'term-size';
import { Config } from './config';
import { getContextForConfig } from './context';
import { loadTheme } from './themes';
import { transformContentsStreaming } from './transformContentsStreaming';

const CONFIG = {
    CHALK: chalk,
    MIN_LINE_WIDTH: 40,
    WRAP_LINES: true,
    HIGHLIGHT_LINE_CHANGES: true,
};

async function previewTheme(themeName: string, content: string) {
    const theme = loadTheme(themeName);

    const { rows, columns } = terminalSize();
    const config: Config = {
        ...CONFIG,
        ...theme,
        SCREEN_WIDTH: columns,
    };

    const context = await getContextForConfig(config);

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
    if (process.argv.length !== 4) {
        console.error(`Usage: ${process.argv[1]} <sha> <theme name>`);
        process.exit(1);
    }

    const [, , sha, themeName] = process.argv;

    const content = execSync(`git show ${sha}`).toString();

    // Clear screen
    process.stdout.write('\x1bc');

    previewTheme(themeName, content);
}

main();
