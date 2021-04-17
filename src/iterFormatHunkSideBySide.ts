import { Change } from 'diff';
import { Context } from './context';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import {
    getChangesInLine,
    iterFormatAndFitLineWithChanges,
} from './iterFormatAndFitLineWithChanges';
import { ThemeColor } from './themes';

function formatAndFitHunkLineHalf(
    context: Context,
    lineNo: number,
    linePrefix: string | null,
    lineText: string | null,
    changes: Change[] | null
): string[] {
    const {
        WRAP_LINES,
        LINE_WIDTH,
        LINE_NUMBER_WIDTH,
        LINE_TEXT_WIDTH,
        MISSING_LINE_COLOR,
        DELETED_WORD_COLOR,
        DELETED_LINE_COLOR,
        DELETED_LINE_NO_COLOR,
        INSERTED_WORD_COLOR,
        INSERTED_LINE_COLOR,
        INSERTED_LINE_NO_COLOR,
        UNMODIFIED_WORD_COLOR,
        UNMODIFIED_LINE_COLOR,
        UNMODIFIED_LINE_NO_COLOR,
    } = context;

    if (linePrefix === null || lineText === null) {
        return [MISSING_LINE_COLOR(''.padStart(LINE_WIDTH))];
    }

    let wordColor: ThemeColor;
    let lineColor: ThemeColor;
    let lineNoColor: ThemeColor;
    switch (linePrefix) {
        case '-':
            wordColor = DELETED_WORD_COLOR;
            lineColor = DELETED_LINE_COLOR;
            lineNoColor = DELETED_LINE_NO_COLOR;
            break;
        case '+':
            wordColor = INSERTED_WORD_COLOR;
            lineColor = INSERTED_LINE_COLOR;
            lineNoColor = INSERTED_LINE_NO_COLOR;
            break;
        default:
            wordColor = UNMODIFIED_WORD_COLOR;
            lineColor = UNMODIFIED_LINE_COLOR;
            lineNoColor = UNMODIFIED_LINE_NO_COLOR;
            break;
    }

    let isFirstLine = true;
    const formattedHunkLineHalves = [];
    const formattedLineNo = lineNoColor(
        lineNo.toString().padStart(LINE_NUMBER_WIDTH)
    );
    for (const formattedLineText of iterFormatAndFitLineWithChanges(
        lineText,
        changes,
        LINE_TEXT_WIDTH,
        WRAP_LINES,
        lineColor,
        wordColor
    )) {
        const formattedLinePrefix = lineColor(
            (isFirstLine ? linePrefix : '').padStart(2)
        );
        formattedHunkLineHalves.push(
            formattedLineNo + formattedLinePrefix + formattedLineText
        );
        isFirstLine = false;
    }
    return formattedHunkLineHalves;
}

function* iterFormatAndFitHunkLine(
    context: Context,
    lineNoA: number,
    lineA: string | null,
    lineNoB: number,
    lineB: string | null
) {
    const { BLANK_LINE, INSERTED_LINE_COLOR, DELETED_LINE_COLOR } = context;

    const linePrefixA = lineA?.slice(0, 1) ?? null;
    const lineTextA = lineA?.slice(1) ?? null;
    const linePrefixB = lineB?.slice(0, 1) ?? null;
    const lineTextB = lineB?.slice(1) ?? null;

    const { changesA, changesB } = getChangesInLine(
        context,
        lineTextA,
        lineTextB
    );
    const formattedLinesA = formatAndFitHunkLineHalf(
        context,
        lineNoA,
        linePrefixA,
        lineTextA,
        changesA
    );
    const formattedLinesB = formatAndFitHunkLineHalf(
        context,
        lineNoB,
        linePrefixB,
        lineTextB,
        changesB
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
    const { HUNK_HEADER_COLOR, SCREEN_WIDTH, WRAP_LINES } = context;

    for (const line of iterFitTextToWidth(
        hunkHeaderLine,
        SCREEN_WIDTH,
        WRAP_LINES
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
