import path from 'path';
import { BUNDLED_LANGUAGES, Highlighter, IThemedToken, Lang } from 'shiki';
import { FormattedString } from './formattedString';
import { parseColorDefinition, ThemeColor } from './themes';
export type HighlightedText = [string, ThemeColor | null];

const _seenLanguages = new Set<string>();

export function highlightSyntaxInLine(
    line: FormattedString,
    fileName: string,
    highlighter?: Highlighter
): void {
    if (!highlighter) {
        return;
    }
    const language = path.extname(fileName).slice(1);
    if (!_seenLanguages.has(language)) {
        if (BUNDLED_LANGUAGES.some((l) => l.id === language)) {
            highlighter.loadLanguage(language as Lang);
        }
        _seenLanguages.add(language);
    }

    let tokens: IThemedToken[];
    try {
        [tokens] = highlighter.codeToThemedTokens(
            line.getString(),
            language,
            undefined,
            { includeExplanation: false }
        );
    } catch (e) {
        // Highlighting fails if a language grammar or theme is missing
        return;
    }

    let index = 0;
    for (const { content, color } of tokens) {
        if (color) {
            const syntaxColor = parseColorDefinition({
                color: color,
            });
            line.addSpan(index, index + content.length, syntaxColor);
            index += content.length;
        }
    }
}
