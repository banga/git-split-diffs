import { Context } from './context';
import { SpannedString } from './SpannedString';
import { reduceThemeColors, ThemeColor } from './themes';

export class FormattedString extends SpannedString<ThemeColor> {}

export function T(): FormattedString {
    return FormattedString.create();
}

export function applyFormatting(
    context: Context,
    string: FormattedString
): string {
    const { CHALK } = context;

    let formattedString = '';
    for (const [substring, colors] of string.iterSubstrings()) {
        let formattedSubstring = substring;
        const themeColor = reduceThemeColors(colors);

        const { color, backgroundColor, modifiers } = themeColor;
        if (color) {
            formattedSubstring = CHALK.rgb(
                Math.floor(color.r),
                Math.floor(color.g),
                Math.floor(color.b)
            )(formattedSubstring);
        }
        if (backgroundColor) {
            formattedSubstring = CHALK.bgRgb(
                Math.floor(backgroundColor.r),
                Math.floor(backgroundColor.g),
                Math.floor(backgroundColor.b)
            )(formattedSubstring);
        }
        if (modifiers) {
            for (const modifier of modifiers) {
                formattedSubstring = CHALK[modifier](formattedSubstring);
            }
        }
        formattedString += formattedSubstring;
    }
    return formattedString;
}

// function parseColorModifier(modifier: ColorModifier, chalk: Chalk): Chalk {
//     switch (modifier) {
//         case 'reset':
//         case 'bold':
//         case 'dim':
//         case 'italic':
//         case 'underline':
//         case 'inverse':
//         case 'hidden':
//         case 'strikethrough':
//         case 'visible':
//             return chalk[modifier];
//         default:
//             throw Error(`Invalid color modifier ${modifier}`);
//     }
// }

// function parseColor(color: Color, chalk: Chalk): Chalk {
//     switch (color) {
//         case 'black':
//         case 'red':
//         case 'green':
//         case 'yellow':
//         case 'blue':
//         case 'magenta':
//         case 'cyan':
//         case 'white':
//         case 'blackBright':
//         case 'redBright':
//         case 'greenBright':
//         case 'yellowBright':
//         case 'blueBright':
//         case 'magentaBright':
//         case 'cyanBright':
//         case 'whiteBright':
//             return chalk[color];
//         default:
//             return chalk.hex(color);
//     }
// }

// function parseBackgroundColor(color: Color, chalk: Chalk): Chalk {
//     switch (color) {
//         case 'black':
//         case 'red':
//         case 'green':
//         case 'yellow':
//         case 'blue':
//         case 'magenta':
//         case 'cyan':
//         case 'white':
//         case 'blackBright':
//         case 'redBright':
//         case 'greenBright':
//         case 'yellowBright':
//         case 'blueBright':
//         case 'magentaBright':
//         case 'cyanBright':
//         case 'whiteBright': {
//             const bgFunctionName = `bg${color
//                 .slice(0, 1)
//                 .toUpperCase()}${color.slice(1)}`;
//             // @ts-expect-error
//             return chalk[bgFunctionName];
//         }
//         default:
//             return chalk.bgHex(color);
//     }
// }
