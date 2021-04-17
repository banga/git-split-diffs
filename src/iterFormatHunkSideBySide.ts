import { Context } from './context';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { ThemeColor } from './themes';

function formatAndFitHunkLineHalf(
    context: Context,
    lineNo: number,
    line: string | null
): string[] {
    const {
        LINE_WIDTH,
        LINE_NUMBER_WIDTH,
        LINE_TEXT_WIDTH,
        MISSING_LINE_COLOR,
        DELETED_LINE_COLOR,
        DELETED_LINE_NO_COLOR,
        INSERTED_LINE_COLOR,
        INSERTED_LINE_NO_COLOR,
        UNMODIFIED_LINE_COLOR,
        UNMODIFIED_LINE_NO_COLOR,
    } = context;

    if (line === null) {
        return [MISSING_LINE_COLOR(''.padStart(LINE_WIDTH))];
    }

    const linePrefix = line.slice(0, 1);
    const lineText = line.slice(1);

    let lineColor: ThemeColor;
    let lineNoColor: ThemeColor;
    switch (line[0]) {
        case '-':
            lineColor = DELETED_LINE_COLOR;
            lineNoColor = DELETED_LINE_NO_COLOR;
            break;
        case '+':
            lineColor = INSERTED_LINE_COLOR;
            lineNoColor = INSERTED_LINE_NO_COLOR;
            break;
        default:
            lineColor = UNMODIFIED_LINE_COLOR;
            lineNoColor = UNMODIFIED_LINE_NO_COLOR;
            break;
    }

    let isFirstLine = true;
    const formattedHunkLineHalves = [];
    for (const text of iterFitTextToWidth(context, lineText, LINE_TEXT_WIDTH)) {
        formattedHunkLineHalves.push(
            lineNoColor(lineNo.toString().padStart(LINE_NUMBER_WIDTH)) +
                lineColor(
                    ' ' +
                        (isFirstLine ? linePrefix : '').padStart(1) +
                        ' ' +
                        text.padEnd(LINE_TEXT_WIDTH)
                )
        );
        isFirstLine = false;
    }
    return formattedHunkLineHalves;
}

function* iterFormatAndFitHunkLine(
    context: Context,
    lineNoA: number,
    lineTextA: string | null,
    lineNoB: number,
    lineTextB: string | null
) {
    const { BLANK_LINE, INSERTED_LINE_COLOR, DELETED_LINE_COLOR } = context;
    const formattedLinesA = formatAndFitHunkLineHalf(
        context,
        lineNoA,
        lineTextA
    );
    const formattedLinesB = formatAndFitHunkLineHalf(
        context,
        lineNoB,
        lineTextB
    );
    let i = 0;
    while (i < formattedLinesA.length && i < formattedLinesB.length) {
        yield formattedLinesA[i] + formattedLinesB[i];
        i++;
    }
    while (i < formattedLinesA.length) {
        yield formattedLinesA[i] + INSERTED_LINE_COLOR(BLANK_LINE);
        i++;
    }
    while (i < formattedLinesB.length) {
        yield DELETED_LINE_COLOR(BLANK_LINE) + formattedLinesB[i];
        i++;
    }
}

export function* iterFormatHunkSideBySide(
    context: Context,
    hunkHeaderLine: string,
    hunkLinesA: (string | null)[],
    hunkLinesB: (string | null)[],
    lineNoA: number,
    lineNoB: number
) {
    const { HUNK_HEADER_COLOR, SCREEN_WIDTH } = context;

    for (const line of iterFitTextToWidth(
        context,
        hunkHeaderLine,
        SCREEN_WIDTH
    )) {
        yield HUNK_HEADER_COLOR(line.padEnd(SCREEN_WIDTH));
    }

    for (let i = 0; i < hunkLinesA.length || i < hunkLinesB.length; i++) {
        const lineA = i < hunkLinesA.length ? hunkLinesA[i] : null;
        const lineB = i < hunkLinesB.length ? hunkLinesB[i] : null;
        yield* iterFormatAndFitHunkLine(
            context,
            lineNoA,
            lineA,
            lineNoB,
            lineB
        );
        if (lineA !== null) {
            lineNoA++;
        }
        if (lineB !== null) {
            lineNoB++;
        }
    }
}
