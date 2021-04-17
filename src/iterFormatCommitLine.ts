import { Context } from './context';

export function* iterFormatCommitLine(
    context: Context,
    line: string
): Iterable<string> {
    const {
        COMMIT_AUTHOR_COLOR,
        COMMIT_COLOR,
        COMMIT_DATE_COLOR,
        COMMIT_SHA_COLOR,
        SCREEN_WIDTH,
    } = context;

    const [label] = line.split(' ', 1);

    let labelColor;
    switch (label) {
        case 'commit':
            labelColor = COMMIT_SHA_COLOR;
            break;
        case 'Author:':
            labelColor = COMMIT_AUTHOR_COLOR;
            break;
        case 'Date:':
            labelColor = COMMIT_DATE_COLOR;
            break;
        default:
            yield COMMIT_COLOR(line.padEnd(SCREEN_WIDTH));
            return;
    }

    yield COMMIT_COLOR(
        `${label} ${labelColor(line.slice(label.length + 1))}` +
            ''.padEnd(SCREEN_WIDTH - line.length)
    );
}
