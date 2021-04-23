import * as os from 'os';
import { Context } from './context';

export async function* iterWithNewlines(
    context: Context,
    lines: AsyncIterable<string>
) {
    for await (const line of lines) {
        yield line + os.EOL;
    }
}
