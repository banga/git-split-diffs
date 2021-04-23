import { FormattedString } from './formattedString';
import { wrapSpannedStringByWord } from './wrapSpannedStringByWord';

/**
 * Wraps or truncates the given line to into the allowed width, depending on
 * the config.
 */
export function* iterFitTextToWidth(
    formattedString: FormattedString,
    width: number,
    shouldWrap: boolean
): Iterable<FormattedString> {
    if (shouldWrap) {
        yield* wrapSpannedStringByWord(formattedString, width);
    } else {
        yield formattedString.slice(0, width);
    }
}
