import * as process from 'process';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable';
import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors';
import { iterSideBySideDiff } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';
import { transformStreamWithIterables } from './transformStreamWithIterables';

function main() {
    transformStreamWithIterables(
        process.stdin,
        [
            iterlinesFromReadableAsync,
            iterLinesWithoutAnsiColors,
            iterSideBySideDiff,
            iterWithNewlines,
        ],
        process.stdout
    );
}

main();
