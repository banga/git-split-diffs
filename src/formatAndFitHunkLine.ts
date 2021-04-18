import { Change } from 'diff';
import { Context } from './context';
import {
    getChangesInLine,
    iterFormatAndFitLineWithChanges,
} from './iterFormatAndFitLineWithChanges';
import { ThemeColor } from './themes';

// Assuming people aren't editing lines >=100k lines
const LINE_NUMBER_WIDTH = 5;

export function formatAndFitHunkLine(
    context: Context,
    lineNo: number,
    line: string | null,
    changes: Change[] | null
): string[] {
    const {
        WRAP_LINES,
        LINE_WIDTH,
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

    if (line === null) {
        return [MISSING_LINE_COLOR(''.padStart(LINE_WIDTH))];
    }

    const linePrefix = line?.slice(0, 1) ?? null;
    const lineText = line?.slice(1) ?? null;

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

    /*
        Each line is rendered as follows: 
        <lineNo> <linePrefix> <lineText>

        So (LINE_NUMBER_WIDTH + 1 + 1 + 1 + lineTextWidth) * 2 = LINE_WIDTH
    */
    const lineTextWidth = Math.max(LINE_WIDTH - 1 - 1 - 1 - LINE_NUMBER_WIDTH);

    let isFirstLine = true;
    const formattedLines = [];
    const formattedLineNo = lineNoColor(
        lineNo.toString().padStart(LINE_NUMBER_WIDTH)
    );
    for (const formattedLineText of iterFormatAndFitLineWithChanges(
        lineText,
        changes,
        lineTextWidth,
        WRAP_LINES,
        lineColor,
        wordColor
    )) {
        const formattedLinePrefix = lineColor(
            (isFirstLine ? linePrefix : '').padStart(2)
        );
        formattedLines.push(
            formattedLineNo + formattedLinePrefix + formattedLineText
        );
        isFirstLine = false;
    }
    return formattedLines;
}

export function formatAndFitHunkLinePair(
    context: Context,
    lineNoA: number,
    lineA: string | null,
    lineNoB: number,
    lineB: string | null
) {
    const { changesA, changesB } = getChangesInLine(context, lineA, lineB);
    const formattedLinesA = formatAndFitHunkLine(
        context,
        lineNoA,
        lineA,
        changesA
    );
    const formattedLinesB = formatAndFitHunkLine(
        context,
        lineNoB,
        lineB,
        changesB
    );
    return { formattedLinesA, formattedLinesB };
}
