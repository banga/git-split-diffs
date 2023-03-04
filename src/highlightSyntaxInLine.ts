import path from 'path';
import shiki from 'shiki';
import { FormattedString } from './formattedString';
import { parseColorDefinition, ThemeColor } from './themes';
export type HighlightedText = [string, ThemeColor | null];

export function highlightSyntaxInLine(
    line: FormattedString,
    fileName: string,
    highlighter?: shiki.Highlighter
): void {
    if (!highlighter) {
        return;
    }
    const language = path.extname(fileName).slice(1);

    let tokens: shiki.IThemedToken[];
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
