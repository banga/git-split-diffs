import { SpannedString } from './SpannedString';
import { ThemeColor } from './themes';

export class FormattedString extends SpannedString<ThemeColor> {}

export function T(): FormattedString {
    return FormattedString.create();
}

export function applyFormatting(string: FormattedString): string {
    let formattedString = '';
    for (const [substring, colors] of string.iterSubstrings()) {
        let formattedSubstring = substring;
        for (const color of colors) {
            formattedSubstring = color(formattedSubstring);
        }
        formattedString += formattedSubstring;
    }
    return formattedString;
}
