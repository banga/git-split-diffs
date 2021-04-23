import { Context } from './context';
import { FormattedString } from './formattedString';
import { ThemeColor } from './themes';
import { wrapSpannedStringByWord } from './wrapSpannedStringByWord';

/**
 * Wraps or truncates the given line to into the allowed width, depending on
 * the config.
 */
export function* iterFitTextToWidth(
    context: Context,
    formattedString: FormattedString,
    width: number,
    backgroundColor?: ThemeColor
): Iterable<FormattedString> {
    if (context.WRAP_LINES) {
        for (const wrappedLine of wrapSpannedStringByWord(
            formattedString,
            width
        )) {
            wrappedLine.padEnd(width);
            if (backgroundColor) {
                wrappedLine.addSpan(0, width, backgroundColor);
            }
            yield wrappedLine;
        }
    } else {
        const truncatedLine = formattedString.slice(0, width).padEnd(width);
        if (backgroundColor) {
            truncatedLine.addSpan(0, width, backgroundColor);
        }
        yield truncatedLine;
    }
}
