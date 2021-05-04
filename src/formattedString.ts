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
    const { CHALK, DEFAULT_COLOR } = context;

    let formattedString = '';
    for (const [substring, colors] of string.iterSubstrings()) {
        let formattedSubstring = substring;
        const themeColor = reduceThemeColors([...colors, DEFAULT_COLOR]);

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
