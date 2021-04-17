import { Context } from './context';

export function* iterFormatFileName(
    context: Context,
    fileNameA: string,
    fileNameB: string
): Iterable<string> {
    const {
        HORIZONTAL_SEPARATOR,
        INSERTED_LINE_COLOR,
        DELETED_LINE_COLOR,
        FILE_NAME_COLOR,
        SCREEN_WIDTH,
    } = context;

    yield HORIZONTAL_SEPARATOR;

    let indicator;
    let label;
    if (!fileNameA) {
        indicator = INSERTED_LINE_COLOR('■■');
        label = fileNameB;
    } else if (!fileNameB) {
        indicator = DELETED_LINE_COLOR('■■');
        label = fileNameA;
    } else if (fileNameA === fileNameB) {
        indicator = DELETED_LINE_COLOR('■') + INSERTED_LINE_COLOR('■');
        label = fileNameA;
    } else {
        indicator = DELETED_LINE_COLOR('■') + INSERTED_LINE_COLOR('■');
        label = FILE_NAME_COLOR(`${fileNameA} -> ${fileNameB}`);
    }
    yield FILE_NAME_COLOR(' ') +
        indicator +
        FILE_NAME_COLOR(' ' + label.padEnd(SCREEN_WIDTH - 2 - 2));

    yield HORIZONTAL_SEPARATOR;
}
