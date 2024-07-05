import path from 'path';
import * as shiki from 'shiki';
import { FormattedString } from './formattedString';
import { ColorModifier, parseColorDefinition, ThemeColor } from './themes';
export type HighlightedText = [string, ThemeColor | null];

function parseShikiColor(token: shiki.ThemedToken): ThemeColor {
    let modifiers: ColorModifier[] | undefined;
    if (
        token.fontStyle !== undefined &&
        token.fontStyle !== shiki.FontStyle.NotSet &&
        token.fontStyle !== shiki.FontStyle.None
    ) {
        modifiers = [];
        if (token.fontStyle & shiki.FontStyle.Bold) {
            modifiers.push('bold');
        }
        if (token.fontStyle & shiki.FontStyle.Italic) {
            modifiers.push('italic');
        }
        if (token.fontStyle & shiki.FontStyle.Underline) {
            modifiers.push('underline');
        }
    }
    const themeColor = parseColorDefinition({
        color: token.color,
        backgroundColor: token.bgColor,
        modifiers,
    });
    return themeColor;
}

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

    for (const token of tokens.flat()) {
        line.addSpan(
            token.offset,
            token.offset + token.content.length,
            parseShikiColor(token)
        );
    }
}
