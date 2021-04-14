import * as process from 'process';
import stream from 'stream';
import terminalSize from 'term-size';
import { Config, CONFIG_DEFAULTS } from './config';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable';
import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors';
import { iterSideBySideDiff } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';
import { parseTheme, Theme } from './themes';
import THEME_DEFINITIONS from './themeDefinitions';
import { transformStreamWithIterables } from './transformStreamWithIterables';
import chalk from 'chalk';

function main() {
    const config: Config = {
        ...CONFIG_DEFAULTS,
        SCREEN_WIDTH: terminalSize().columns,
        WRAP_LINES: true,
    };
    const theme: Theme = parseTheme(THEME_DEFINITIONS['default'], chalk);

    stream.pipeline(
        transformStreamWithIterables(
            process.stdin,
            iterlinesFromReadableAsync,
            iterLinesWithoutAnsiColors,
            iterSideBySideDiff(config, theme),
            iterWithNewlines
        ),
        process.stdout,
        (err) => {
            if (err) {
                switch (err.code) {
                    case 'EPIPE':
                        // This can happen if the process exits while we are still
                        // processing the input and writing to stdout.
                        break;
                    default:
                        throw err;
                }
            }
        }
    );
}

main();
