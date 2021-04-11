import * as os from 'os';

export async function* iterWithNewlines(lines: AsyncIterable<string>) {
    for await (const line of lines) {
        yield line + os.EOL;
    }
}
