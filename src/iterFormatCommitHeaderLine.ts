import { Context } from './context';
import { T, FormattedString } from './formattedString';
import { iterFitTextToWidth } from './iterFitTextToWidth';

export function* iterFormatCommitHeaderLine(
    context: Context,
    line: string
): Iterable<FormattedString> {
    const {
        COMMIT_HEADER_LABEL_COLOR,
        COMMIT_AUTHOR_COLOR,
        COMMIT_HEADER_COLOR,
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

    const formattedLine = T()
        .appendString(line)
        .addSpan(0, label.length, COMMIT_HEADER_LABEL_COLOR);
    if (labelColor) {
        formattedLine.addSpan(0, SCREEN_WIDTH - label.length - 1, labelColor);
    }

    yield* iterFitTextToWidth(
        context,
        formattedLine,
        SCREEN_WIDTH,
        COMMIT_HEADER_COLOR
    );
}
