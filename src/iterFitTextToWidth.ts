import { Context } from './context';
import { wrapLineByWord } from './wrapLineByWord';

/**
 * Wraps or truncates the given line to into the allowed width, depending on
 * the config.
 */
export function* iterFitTextToWidth(
    text: string,
    width: number,
    shouldWrap: boolean
): Iterable<string> {
    if (shouldWrap) {
        yield* wrapLineByWord(text, width);
    } else {
        yield text.slice(0, width);
    }
}
