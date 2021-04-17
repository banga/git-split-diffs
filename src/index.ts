import chalk from 'chalk';
import * as process from 'process';
import stream from 'stream';
import terminalSize from 'term-size';
import { getGitConfig } from './getGitConfig';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable';
import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors';
import { getSideBySideDiffIterator } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';
import { transformStreamWithIterables } from './transformStreamWithIterables';

async function main() {
    const config = await getGitConfig(terminalSize().columns, chalk);

    stream.pipeline(
        transformStreamWithIterables(
            process.stdin,
            iterlinesFromReadableAsync,
            iterLinesWithoutAnsiColors,
            getSideBySideDiffIterator(config),
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
