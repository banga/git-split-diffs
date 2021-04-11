import chalk from 'chalk';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable';
import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors';
import { iterSideBySideDiff } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';
import { defaultTheme } from './theme';
import { transformStreamWithIterables } from './transformStreamWithIterables';

const testTheme = defaultTheme(new chalk.Instance({ level: 0 }), 120);
const iterSideBySideDiffWithoutColors = iterSideBySideDiff(testTheme);

async function transform(input: string): Promise<string> {
    let string = '';
    const transformedStream = transformStreamWithIterables(
        Readable.from(input),
        iterlinesFromReadableAsync,
        iterLinesWithoutAnsiColors,
        iterSideBySideDiffWithoutColors,
        iterWithNewlines
    );
    for await (const chunk of transformedStream) {
        string += chunk.toString();
    }
    return string;
}

test.skip('empty', async function () {
    expect(await transform(``)).toEqual(``);
});
