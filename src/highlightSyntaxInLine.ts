import chalk from 'chalk';
import path from 'path';
import { Highlighter } from 'shiki';
import { FormattedString } from './formattedString';
import { parseColorDefinition, ThemeColor } from './themes';
export type HighlightedText = [string, ThemeColor | null];

export function highlightSyntaxInLine(
    line: FormattedString,
    fileName: string,
    highlighter?: Highlighter
): void {
    if (!highlighter) {
        return;
    }
    const language = path.extname(fileName).slice(1);
    try {
        const tokensByLine = highlighter.codeToThemedTokens(
            line.getString(),
            language,
            undefined,
            { includeExplanation: false }
        );
        const [tokens] = tokensByLine;
        let index = 0;
        for (const { content, color } of tokens) {
            if (color) {
                const syntaxColor = parseColorDefinition(color);
                line.addSpan(index, index + content.length, syntaxColor);
                index += content.length;
            }
        }
    } catch (e) {
        // Highlighting fails if a language grammar or theme is missing
    }
}
