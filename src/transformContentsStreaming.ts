import stream, { Readable, Writable } from 'stream';
import { Context } from './context';
import { iterlinesFromReadable } from './iterLinesFromReadable';
import { iterReplaceTabsWithSpaces } from './iterReplaceTabsWithSpaces';
import { iterSideBySideDiffs } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';

export async function transformContentsStreaming(
    context: Context,
    input: Readable,
    output: Writable
): Promise<void> {
    return new Promise((resolve, reject) => {
        const transformedInput = Readable.from(
            iterWithNewlines(
                context,
                iterSideBySideDiffs(
                    context,
                    iterReplaceTabsWithSpaces(
                        context,
                        iterlinesFromReadable(input)
                    )
                )
            )
        );

        stream.pipeline(transformedInput, output, (err) => {
            if (err) {
                switch (err.code) {
                    case 'EPIPE':
                        // This can happen if the process exits while we are still
                        // processing the input and writing to stdout.
                        break;
                    default:
                        reject(err);
                        return;
                }
            }
            resolve();
        });
    });
}
