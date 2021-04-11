import ansiRegex from 'ansi-regex';

export const ANSI_COLOR_CODE_REGEX = ansiRegex();

/**
 * Strips out ANSI color escape codes, which may be present in diff output if
 * --color is used.
 */
export async function* iterLinesWithoutAnsiColors(
    lines: AsyncIterable<string>
) {
    for await (const line of lines) {
        yield line.replace(ANSI_COLOR_CODE_REGEX, '');
    }
}
