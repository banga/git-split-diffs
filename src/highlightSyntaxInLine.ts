import path from 'path';
import shiki from 'shiki';
import { FormattedString } from './formattedString';
import { parseColorDefinition, ThemeColor } from './themes';
export type HighlightedText = [string, ThemeColor | null];

async function _loadHighlighterLanguage(
    highlighter: shiki.Highlighter,
    fileExtension: string
): Promise<shiki.Lang | null> {
    const language = fileExtension as shiki.Lang;

    // Skip if already loaded
    if (highlighter.getLoadedLanguages().includes(language)) {
        return language;
    }

    // If supported, load it and return
    const hasLanguage = shiki.BUNDLED_LANGUAGES.some(
        (l) => l.id === fileExtension || l.aliases?.includes(fileExtension)
    );
    if (hasLanguage) {
        await highlighter.loadLanguage(language);
        return language;
    }

    // Unsupported language
    return null;
}

export async function highlightSyntaxInLine(
    line: FormattedString,
    fileName: string,
    highlighter?: shiki.Highlighter
): Promise<void> {
    if (!highlighter) {
        return;
    }

    const fileExtension = path.extname(fileName).slice(1);
    const language = await _loadHighlighterLanguage(highlighter, fileExtension);
    if (!language) {
        return;
    }

    const [tokens] = highlighter.codeToThemedTokens(
        line.getString(),
        language,
        undefined,
        { includeExplanation: false }
    );

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
