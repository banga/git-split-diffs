import { Change } from 'diff';
import { Context } from './context';
import { FormattedString, T } from './formattedString';
import { highlightChangesInLine } from './highlightChangesInLine';
import { highlightSyntaxInLine } from './highlightSyntaxInLine';
import { iterFitTextToWidth } from './iterFitTextToWidth';
import { ThemeColor } from './themes';

// Assuming people aren't editing lines >=100k lines
const LINE_NUMBER_WIDTH = 5;

export async function* formatAndFitHunkLine(
    context: Context,
    lineWidth: number,
    fileName: string,
    lineNo: number,
    line: string | null,
    changes: Change[] | null
): AsyncIterable<FormattedString> {
    const {
        MISSING_LINE_COLOR,
        DELETED_LINE_COLOR,
        DELETED_LINE_NO_COLOR,
        INSERTED_LINE_COLOR,
        INSERTED_LINE_NO_COLOR,
        UNMODIFIED_LINE_COLOR,
        UNMODIFIED_LINE_NO_COLOR,
    } = context;

    const blankLine = ''.padStart(lineWidth);

    // A line number of 0 happens when we read the "No newline at end of file"
    // message as a line at the end of a deleted/inserted file.
    if (line === null || lineNo === 0) {
        yield T().appendString(blankLine, MISSING_LINE_COLOR);
        return;
    }

    const linePrefix = line.slice(0, 1);
    const lineText = line.slice(1);

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

        So LINE_NUMBER_WIDTH + 2 + 1 + 1 + lineTextWidth = lineWidth
    */
    const lineTextWidth = lineWidth - 2 - 1 - 1 - LINE_NUMBER_WIDTH;

    let isFirstLine = true;
    const formattedLine = T().appendString(lineText);
    highlightChangesInLine(context, linePrefix, formattedLine, changes);
    if (context.HIGHLIGHTER && context.SYNTAX_HIGHLIGHTING_THEME) {
        await highlightSyntaxInLine(
            formattedLine,
            fileName,
            context.HIGHLIGHTER,
            context.SYNTAX_HIGHLIGHTING_THEME
        );
    }

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

        const hunkLine = T()
            .appendString(lineNoText, lineNoColor)
            .appendString(wrappedLinePrefix)
            .appendSpannedString(fittedLine);
        hunkLine.addSpan(0, hunkLine.getString().length, lineColor);
        yield hunkLine;

        isFirstLine = false;
    }
}
