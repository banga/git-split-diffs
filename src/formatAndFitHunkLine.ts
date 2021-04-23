import { Change } from 'diff';
import { Context } from './context';
import { T, FormattedString } from './formattedString';
import { highlightSyntaxInLine } from './highlightSyntaxInLine';
import {
    getChangesInLine,
    highlightChangesInLine,
} from './highlightChangesInLine';
import { ThemeColor } from './themes';
import { iterFitTextToWidth } from './iterFitTextToWidth';

// Assuming people aren't editing lines >=100k lines
const LINE_NUMBER_WIDTH = 5;

export function* formatAndFitHunkLine(
    context: Context,
    fileName: string,
    lineNo: number,
    line: string | null,
    changes: Change[] | null
): Iterable<FormattedString> {
    const {
        BLANK_LINE,
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

    // A line number of 0 happens when we read the "No newline at end of file"
    // message as a line at the end of a deleted/inserted file.
    if (line === null || lineNo === 0) {
        yield T().appendString(BLANK_LINE, MISSING_LINE_COLOR);
        return;
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
    const formattedLine = T().appendString(lineText);
    highlightSyntaxInLine(formattedLine, fileName, context.HIGHLIGHTER);
    highlightChangesInLine(formattedLine, changes, wordColor);

    const lineNoText = lineNo.toString().padStart(LINE_NUMBER_WIDTH);

    for (const wrappedFormattedLine of iterFitTextToWidth(
        formattedLine,
        lineTextWidth,
        WRAP_LINES
    )) {
        const wrappedLinePrefix = (isFirstLine ? linePrefix : '')
            .padStart(2)
            .padEnd(3);
        yield T()
            .appendString(lineNoText, lineNoColor)
            .appendString(wrappedLinePrefix)
            .appendSpannedString(wrappedFormattedLine)
            .padEnd(LINE_WIDTH)
            .addSpan(0, LINE_WIDTH, lineColor);
        isFirstLine = false;
    }
}

export function formatAndFitHunkLinePair(
    context: Context,
    fileNameA: string,
    lineNoA: number,
    lineA: string | null,
    fileNameB: string,
    lineNoB: number,
    lineB: string | null
) {
    const { changesA, changesB } = getChangesInLine(context, lineA, lineB);
    const formattedLinesA = Array.from(
        formatAndFitHunkLine(context, fileNameA, lineNoA, lineA, changesA)
    );
    const formattedLinesB = Array.from(
        formatAndFitHunkLine(context, fileNameB, lineNoB, lineB, changesB)
    );
    return { formattedLinesA, formattedLinesB };
}
