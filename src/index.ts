import chalk from 'chalk';
import * as process from 'process';
import stream from 'stream';
import terminalSize from 'term-size';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable';
import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors';
import { iterSideBySideDiff } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';
import { defaultTheme } from './theme';
import { transformStreamWithIterables } from './transformStreamWithIterables';

function main() {
    const screenWidth = terminalSize().columns;
    const theme = defaultTheme(chalk, screenWidth);

    stream.pipeline(
        transformStreamWithIterables(
            process.stdin,
            iterlinesFromReadableAsync,
            iterLinesWithoutAnsiColors,
            iterSideBySideDiff(theme),
            iterWithNewlines
        ),
        process.stdout,
        console.error
    );
}

main();
