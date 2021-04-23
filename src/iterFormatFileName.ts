import { Context } from './context';
import { T, FormattedString } from './formattedString';

export function* iterFormatFileName(
    context: Context,
    fileNameA: string,
    fileNameB: string
): Iterable<FormattedString> {
    const {
        HORIZONTAL_SEPARATOR,
        INSERTED_LINE_NO_COLOR,
        DELETED_LINE_NO_COLOR,
        FILE_NAME_COLOR,
        SCREEN_WIDTH,
    } = context;

    yield T().appendString(HORIZONTAL_SEPARATOR);

    const formattedString = T().appendString(' ');
    if (!fileNameA) {
        formattedString
            .appendString('■■', INSERTED_LINE_NO_COLOR)
            .appendString(' ')
            .appendString(fileNameB);
    } else if (!fileNameB) {
        formattedString
            .appendString('■■', DELETED_LINE_NO_COLOR)
            .appendString(' ')
            .appendString(fileNameA);
    } else if (fileNameA === fileNameB) {
        formattedString
            .appendString('■', DELETED_LINE_NO_COLOR)
            .appendString('■', INSERTED_LINE_NO_COLOR)
            .appendString(' ')
            .appendString(fileNameA);
    } else {
        formattedString
            .appendString('■', DELETED_LINE_NO_COLOR)
            .appendString('■', INSERTED_LINE_NO_COLOR)
            .appendString(' ')
            .appendString(`${fileNameA} -> ${fileNameB}`);
    }
    formattedString
        .padEnd(SCREEN_WIDTH)
        .addSpan(0, SCREEN_WIDTH, FILE_NAME_COLOR);
    yield formattedString;

    yield T().appendString(HORIZONTAL_SEPARATOR);
}
