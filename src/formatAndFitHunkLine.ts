import { Change } from 'diff';
import { Context } from './context';
import { FormattedString, T } from './formattedString';
import { highlightChangesInLine } from './highlightChangesInLine';
import { highlightSyntaxInLine } from './highlightSyntaxInLine';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { ThemeColor } from './themes';

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
        LINE_WIDTH,
        MISSING_LINE_COLOR,
        DELETED_LINE_COLOR,
        DELETED_LINE_NO_COLOR,
        INSERTED_LINE_COLOR,
        INSERTED_LINE_NO_COLOR,
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

    let lineColor: ThemeColor;
    let lineNoColor: ThemeColor;
    switch (linePrefix) {
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

    /*
        Each line is rendered as follows: 
        <lineNo>  <linePrefix> <lineText>

        So (LINE_NUMBER_WIDTH + 2 + 1 + 1 + lineTextWidth) * 2 = LINE_WIDTH
    */
    const lineTextWidth = LINE_WIDTH - 2 - 1 - 1 - LINE_NUMBER_WIDTH;

    let isFirstLine = true;
    const formattedLine = T().appendString(lineText);
    highlightChangesInLine(context, linePrefix, formattedLine, changes);
    highlightSyntaxInLine(formattedLine, fileName, context.HIGHLIGHTER);

    for (const fittedLine of iterFitTextToWidth(
        context,
        formattedLine,
        lineTextWidth
    )) {
        const lineNoText =
            (isFirstLine ? lineNo.toString() : '').padStart(LINE_NUMBER_WIDTH) +
            ' ';
        const wrappedLinePrefix = (isFirstLine ? linePrefix : '')
            .padStart(2)
            .padEnd(3);
        yield T()
            .appendString(lineNoText, lineNoColor)
            .appendString(wrappedLinePrefix)
            .appendSpannedString(fittedLine)
            .addSpan(0, LINE_WIDTH, lineColor);
        isFirstLine = false;
    }
}
