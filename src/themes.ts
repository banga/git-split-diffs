import * as assert from 'assert';

type KeywordColor =
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'blackBright'
    | 'redBright'
    | 'greenBright'
    | 'yellowBright'
    | 'blueBright'
    | 'magentaBright'
    | 'cyanBright'
    | 'whiteBright';

/** `#000000` to `#FFFFFF` */
type HexColor = string;

type Color = KeywordColor | HexColor;

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

type ColorDefinition =
    | Color
    | {
          color?: Color;
          backgroundColor?: Color;
          modifiers?: ColorModifier[];
      };

export const THEME_COLOR_VARIABLE_NAMES = [
    'COMMIT_COLOR',
    'COMMIT_SHA_COLOR',
    'COMMIT_AUTHOR_COLOR',
    'COMMIT_DATE_COLOR',
    'BORDER_COLOR',
    'FILE_NAME_COLOR',
    'HUNK_HEADER_COLOR',
    'DELETED_WORD_COLOR',
    'DELETED_LINE_COLOR',
    'DELETED_LINE_NO_COLOR',
    'INSERTED_WORD_COLOR',
    'INSERTED_LINE_COLOR',
    'INSERTED_LINE_NO_COLOR',
    'UNMODIFIED_LINE_COLOR',
    'UNMODIFIED_LINE_NO_COLOR',
    'MISSING_LINE_COLOR',
] as const;

type ThemeColorVariables = typeof THEME_COLOR_VARIABLE_NAMES[number];

export type ThemeDefinition = {
    SYNTAX_HIGHLIGHTING_THEME?: string;
} & {
    [key in ThemeColorVariables]: ColorDefinition;
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

function hexToRgba(hex: string): ColorRgba {
    if (hex[0] === '#') {
        hex = hex.slice(1);
    }

    let hexNo = parseInt(hex, 16);

    let a = 255;
    if (hex.length === 8) {
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
    SYNTAX_HIGHLIGHTING_THEME?: string;
} & {
    [key in ThemeColorVariables]: ThemeColor;
};

export function parseColorDefinition(definition: ColorDefinition): ThemeColor {
    if (typeof definition === 'string') {
        return { color: hexToRgba(definition) };
    }
    return {
        color: definition.color ? hexToRgba(definition.color) : undefined,
        backgroundColor: definition.backgroundColor
            ? hexToRgba(definition.backgroundColor)
            : undefined,
        modifiers: definition.modifiers,
    };
}

export function parseThemeDefinition(themeDefinition: ThemeDefinition): Theme {
    const theme: Partial<Theme> = {
        SYNTAX_HIGHLIGHTING_THEME: themeDefinition.SYNTAX_HIGHLIGHTING_THEME,
    };
    for (const variableName of THEME_COLOR_VARIABLE_NAMES) {
        const value = themeDefinition[variableName];
        if (!value) {
            assert.fail(`${variableName} is missing in theme`);
        }
        theme[variableName] = parseColorDefinition(value);
    }

    return theme as Theme;
}
