import path from 'path';
import * as shikiji from 'shikiji';
import { FormattedString } from './formattedString';
import { parseColorDefinition, ThemeColor } from './themes';
export type HighlightedText = [string, ThemeColor | null];

export async function highlightSyntaxInLine(
    line: FormattedString,
    fileName: string,
    highlighter: shikiji.Highlighter
): Promise<void> {
    const language = path.extname(fileName).slice(1) as shikiji.BundledLanguage;
    if (!shikiji.bundledLanguages[language]) {
        return;
    }

    await highlighter.loadLanguage(language);

    const [tokens] = highlighter.codeToThemedTokens(line.getString(), {
        includeExplanation: false,
        lang: language,
    });

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
