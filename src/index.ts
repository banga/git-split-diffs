import * as process from 'process';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable.js';
import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors.js';
import { iterSideBySideDiff } from './iterSideBySideDiffs.js';
import { iterWithNewlines } from './iterWithNewlines.js';
import { transformStreamWithIterables } from './transformStreamWithIterables.js';

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
