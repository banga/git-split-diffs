import { Context } from './context';
import { T, FormattedString } from './formattedString';
import { iterFitTextToWidth } from './iterFitTextToWidth';

export function* iterFormatFileName(
    context: Context,
    fileNameA: string,
    fileNameB: string
): Iterable<FormattedString> {
    const {
        HORIZONTAL_SEPARATOR,
        INSERTED_LINE_COLOR,
        DELETED_LINE_COLOR,
        INSERTED_LINE_NO_COLOR,
        DELETED_LINE_NO_COLOR,
        FILE_NAME_COLOR,
        SCREEN_WIDTH,
    } = context;

    yield HORIZONTAL_SEPARATOR;

    const formattedString = T().appendString(' ■■ ');
    let fileNameLabel;
    if (!fileNameA) {
        formattedString
            .addSpan(1, 3, INSERTED_LINE_NO_COLOR)
            .addSpan(1, 3, INSERTED_LINE_COLOR);
        fileNameLabel = fileNameB;
    } else if (!fileNameB) {
        formattedString
            .addSpan(1, 3, DELETED_LINE_NO_COLOR)
            .addSpan(1, 3, DELETED_LINE_COLOR);
        fileNameLabel = fileNameA;
    } else if (fileNameA === fileNameB) {
        formattedString
            .addSpan(1, 2, DELETED_LINE_NO_COLOR)
            .addSpan(2, 3, INSERTED_LINE_NO_COLOR)
            .addSpan(1, 2, DELETED_LINE_COLOR)
            .addSpan(2, 3, INSERTED_LINE_COLOR);
        fileNameLabel = fileNameA;
    } else {
        formattedString
            .addSpan(1, 2, DELETED_LINE_NO_COLOR)
            .addSpan(2, 3, INSERTED_LINE_NO_COLOR)
            .addSpan(1, 2, DELETED_LINE_COLOR)
            .addSpan(2, 3, INSERTED_LINE_COLOR);
        fileNameLabel = `${fileNameA} -> ${fileNameB}`;
    }
    formattedString.appendString(fileNameLabel);

    yield* iterFitTextToWidth(
        context,
        formattedString,
        SCREEN_WIDTH,
        FILE_NAME_COLOR
    );

    yield HORIZONTAL_SEPARATOR;
}
