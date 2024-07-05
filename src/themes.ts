import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as shiki from 'shiki';

const THEMES_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'themes'
);
/**
 * Colors are always specified as hex strings
 */
type Color = string;

type ColorModifier =
    | 'reset'
    | 'bold'
    | 'dim'
    | 'italic'
    | 'underline'
    | 'inverse'
    | 'hidden'
    | 'strikethrough'
    | 'visible';

type ColorDefinition = {
    color?: Color;
    backgroundColor?: Color;
    modifiers?: ColorModifier[];
};

export enum ThemeColorName {
    DEFAULT_COLOR = 'DEFAULT_COLOR',
    COMMIT_HEADER_LABEL_COLOR = 'COMMIT_HEADER_LABEL_COLOR',
    COMMIT_HEADER_COLOR = 'COMMIT_HEADER_COLOR',
    COMMIT_SHA_COLOR = 'COMMIT_SHA_COLOR',
    COMMIT_AUTHOR_COLOR = 'COMMIT_AUTHOR_COLOR',
    COMMIT_DATE_COLOR = 'COMMIT_DATE_COLOR',
    COMMIT_TITLE_COLOR = 'COMMIT_TITLE_COLOR',
    COMMIT_MESSAGE_COLOR = 'COMMIT_MESSAGE_COLOR',
    BORDER_COLOR = 'BORDER_COLOR',
    FILE_NAME_COLOR = 'FILE_NAME_COLOR',
    HUNK_HEADER_COLOR = 'HUNK_HEADER_COLOR',
    DELETED_WORD_COLOR = 'DELETED_WORD_COLOR',
    DELETED_LINE_COLOR = 'DELETED_LINE_COLOR',
    DELETED_LINE_NO_COLOR = 'DELETED_LINE_NO_COLOR',
    INSERTED_WORD_COLOR = 'INSERTED_WORD_COLOR',
    INSERTED_LINE_COLOR = 'INSERTED_LINE_COLOR',
    INSERTED_LINE_NO_COLOR = 'INSERTED_LINE_NO_COLOR',
    UNMODIFIED_LINE_COLOR = 'UNMODIFIED_LINE_COLOR',
    UNMODIFIED_LINE_NO_COLOR = 'UNMODIFIED_LINE_NO_COLOR',
    MISSING_LINE_COLOR = 'MISSING_LINE_COLOR',
}

export type ThemeDefinition = {
    SYNTAX_HIGHLIGHTING_THEME?: shiki.BundledTheme;
} & {
    [key in ThemeColorName]: ColorDefinition;
};

type ColorRgba = {
    r: number;
    g: number;
    b: number;
    a: number;
};

export type ThemeColor = {
    color?: ColorRgba;
    backgroundColor?: ColorRgba;
    modifiers?: ColorModifier[];
};

/**
 * The hex string is of the format #rrggbb(aa)
 */
function hexToRgba(hex: string): ColorRgba {
    assert.ok(hex.length === 7 || hex.length === 9);

    let hexNo = parseInt(hex.slice(1), 16);

    let a = 255;
    if (hex.length === 9) {
        a = hexNo & 0xff;
        hexNo >>>= 8;
    }

    const b = hexNo & 0xff;
    hexNo >>>= 8;

    const g = hexNo & 0xff;
    hexNo >>>= 8;

    const r = hexNo & 0xff;

    return { r, g, b, a };
}

export function mergeColors(
    a?: ColorRgba,
    b?: ColorRgba
): ColorRgba | undefined {
    if (!b || b.a === 0) {
        return a;
    }
    if (!a) {
        return b;
    }
    const t = 1.0 - b.a / 255.0;
    return {
        r: b.r * (1 - t) + a.r * t,
        g: b.g * (1 - t) + a.g * t,
        b: b.b * (1 - t) + a.b * t,
        a: b.a * (1 - t) + a.a * t,
    };
}

function mergeModifiers(
    a: ColorModifier[] | undefined,
    b: ColorModifier[] | undefined
): ColorModifier[] | undefined {
    if (a && b) {
        return a.concat(b);
    }
    return a ?? b;
}

function mergeThemeColors(a: ThemeColor, b: ThemeColor): ThemeColor {
    return {
        color: mergeColors(a.color, b.color),
        backgroundColor: mergeColors(a.backgroundColor, b.backgroundColor),
        modifiers: mergeModifiers(a.modifiers, b.modifiers),
    };
}

export function reduceThemeColors(colors: ThemeColor[]): ThemeColor {
    // Colors are applied in reverse, which allows us to do apply specific
    // formatting (like syntax highlighting) first and apply more generic colors
    // (like line colors) last
    let themeColor: ThemeColor = {};
    for (let i = colors.length - 1; i >= 0; i--) {
        themeColor = mergeThemeColors(themeColor, colors[i]);
    }
    return themeColor;
}

export type Theme = {
    SYNTAX_HIGHLIGHTING_THEME?: shiki.BundledTheme;
} & {
    [key in ThemeColorName]: ThemeColor;
};

export function parseColorDefinition(definition: ColorDefinition): ThemeColor {
    return {
        color: definition.color ? hexToRgba(definition.color) : undefined,
        backgroundColor: definition.backgroundColor
            ? hexToRgba(definition.backgroundColor)
            : undefined,
        modifiers: definition.modifiers,
    };
}

function loadThemeDefinition(themeName: string): ThemeDefinition {
    return JSON.parse(
        fs.readFileSync(path.join(THEMES_DIR, `${themeName}.json`)).toString()
    ) as ThemeDefinition;
}

export function loadTheme(themeName: string): Theme {
    const themeDefinition = loadThemeDefinition(themeName);

    const theme: Partial<Theme> = {
        SYNTAX_HIGHLIGHTING_THEME: themeDefinition.SYNTAX_HIGHLIGHTING_THEME,
    };

    const themeColorNames = Object.keys(ThemeColorName) as ThemeColorName[];
    for (const variableName of themeColorNames) {
        const value = themeDefinition[variableName];
        if (!value) {
            assert.fail(`${variableName} is missing in theme`);
        }
        theme[variableName] = parseColorDefinition(value);
    }

    return theme as Theme;
}
