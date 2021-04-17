import { Context } from './context';
import { wrapLineByWord } from './wrapLineByWord';

/**
 * Wraps or truncates the given line to into the allowed width, depending on
 * the config.
 */
export function* iterFitTextToWidth(
    context: Context,
    text: string,
    width: number
): Iterable<string> {
    const { WRAP_LINES } = context;

    if (WRAP_LINES) {
        yield* wrapLineByWord(text, width);
    } else {
        yield text.slice(0, width);
    }
}
