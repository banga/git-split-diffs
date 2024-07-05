import path from 'path';
import * as shiki from 'shiki';
import { FormattedString } from './formattedString';
import { parseColorDefinition, ThemeColor } from './themes';
export type HighlightedText = [string, ThemeColor | null];

export async function highlightSyntaxInLine(
    line: FormattedString,
    fileName: string,
    highlighter: shiki.Highlighter,
    theme: shiki.BundledTheme
): Promise<void> {
    const language = path.extname(fileName).slice(1) as shiki.BundledLanguage;
    if (!shiki.bundledLanguages[language]) {
        return;
    }

    await highlighter.loadLanguage(language);

    const { tokens } = highlighter.codeToTokens(line.getString(), {
        includeExplanation: false,
        lang: language,
        theme,
    });

    let index = 0;
    for (const { content, color } of tokens.flat()) {
        if (color) {
            const syntaxColor = parseColorDefinition({
                color: color,
            });
            line.addSpan(index, index + content.length, syntaxColor);
            index += content.length;
        }
    }
}
