import chalk from 'chalk';
import * as process from 'process';
import stream from 'stream';
import terminalSize from 'term-size';
import { getContextForConfig } from './context';
import { getGitConfig } from './getGitConfig';
import { iterReplaceTabsWithSpaces } from './iterReplaceTabsWithSpaces';
import { iterSideBySideDiffs } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';
import { transformStreamWithIterables } from './transformStreamWithIterables';

async function main() {
    const config = await getGitConfig(terminalSize().columns, chalk);
    const context = await getContextForConfig(config);

    stream.pipeline(
        transformStreamWithIterables(context, process.stdin, [
            iterReplaceTabsWithSpaces,
            iterSideBySideDiffs,
            iterWithNewlines,
        ]),
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
