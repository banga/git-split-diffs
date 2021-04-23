import { Context } from './context';
import { T, FormattedString } from './formattedString';
import { iterFitTextToWidth } from './iterFitTextToWidth';

export function* iterFormatCommitLine(
    context: Context,
    line: string
): Iterable<FormattedString> {
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
    }

    const formattedLine = T().appendString(line);
    if (labelColor) {
        formattedLine.addSpan(
            label.length + 1,
            SCREEN_WIDTH - label.length - 1,
            labelColor
        );
    }

    yield* iterFitTextToWidth(
        context,
        formattedLine,
        SCREEN_WIDTH,
        COMMIT_COLOR
    );
}
