import { Chalk } from 'chalk';

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

export const THEME_VARIABLE_NAMES = [
    'DEFAULT_COLOR',
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
    'UNMODIFIED_WORD_COLOR',
    'UNMODIFIED_LINE_COLOR',
    'UNMODIFIED_LINE_NO_COLOR',
    'MISSING_LINE_COLOR',
] as const;

type ThemeVariables = typeof THEME_VARIABLE_NAMES[number];

export type ThemeColor = (text: string) => string;

export type ThemeDefinition = { [key in ThemeVariables]?: ColorDefinition };

export type Theme = { [key in ThemeVariables]: ThemeColor };

function parseColor(color: Color, chalk: Chalk): Chalk {
    switch (color) {
        case 'black':
        case 'red':
        case 'green':
        case 'yellow':
        case 'blue':
        case 'magenta':
        case 'cyan':
        case 'white':
        case 'blackBright':
        case 'redBright':
        case 'greenBright':
        case 'yellowBright':
        case 'blueBright':
        case 'magentaBright':
        case 'cyanBright':
        case 'whiteBright':
            return chalk[color];
        default:
            return chalk.hex(color);
    }
}

function parseBackgroundColor(color: Color, chalk: Chalk): Chalk {
    switch (color) {
        case 'black':
        case 'red':
        case 'green':
        case 'yellow':
        case 'blue':
        case 'magenta':
        case 'cyan':
        case 'white':
        case 'blackBright':
        case 'redBright':
        case 'greenBright':
        case 'yellowBright':
        case 'blueBright':
        case 'magentaBright':
        case 'cyanBright':
        case 'whiteBright': {
            const bgFunctionName = `bg${color
                .slice(0, 1)
                .toUpperCase()}${color.slice(1)}`;
            // @ts-expect-error
            return chalk[bgFunctionName];
        }
        default:
            return chalk.bgHex(color);
    }
}

function parseColorModifier(modifier: ColorModifier, chalk: Chalk): Chalk {
    switch (modifier) {
        case 'reset':
        case 'bold':
        case 'dim':
        case 'italic':
        case 'underline':
        case 'inverse':
        case 'hidden':
        case 'strikethrough':
        case 'visible':
            return chalk[modifier];
        default:
            throw Error(`Invalid color modifier ${modifier}`);
    }
}

function parseColorFunction(definition: ColorDefinition, chalk: Chalk): Chalk {
    if (typeof definition === 'string') {
        return parseColor(definition, chalk);
    }
    let fn = chalk;
    if (definition.color) {
        fn = parseColor(definition.color, fn);
    }
    if (definition.backgroundColor) {
        fn = parseBackgroundColor(definition.backgroundColor, fn);
    }
    if (definition.modifiers) {
        for (const modifier of definition.modifiers) {
            fn = parseColorModifier(modifier, fn);
        }
    }
    return fn;
}

export function parseTheme(theme: ThemeDefinition, chalk: Chalk): Theme {
    let defaultColor = theme['DEFAULT_COLOR'] ?? 'white';
    if (typeof defaultColor === 'string') {
        defaultColor = { color: defaultColor };
    }

    const themeFunctions: Partial<Theme> = {};
    for (const variableName of THEME_VARIABLE_NAMES) {
        let value = theme[variableName];
        if (typeof value === 'string') {
            value = { color: value };
        }

        themeFunctions[variableName] = parseColorFunction(
            {
                ...defaultColor,
                ...value,
            },
            chalk
        );
    }
    return themeFunctions as Theme;
}
