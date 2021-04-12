import ansiRegex from 'ansi-regex';
import chalk from 'chalk';

export const ANSI_COLOR_CODE_REGEX = ansiRegex();

export function coloredTextLength(text: string) {
    return text.replace(ANSI_COLOR_CODE_REGEX, '').length;
}

export function padColoredText(
    text: string,
    width: number,
    align: 'left' | 'right' | 'center',
    character: string = ' '
) {
    const lineLength = coloredTextLength(text);
    if (lineLength >= width) {
        return text;
    }

    const paddingLength = width - lineLength;
    let leftPaddingLength = 0;
    let rightPaddingLength = 0;
    switch (align) {
        case 'left':
            rightPaddingLength = paddingLength;
            break;
        case 'right':
            leftPaddingLength = paddingLength;
            break;
        case 'center':
            leftPaddingLength = Math.floor(paddingLength / 2);
            rightPaddingLength = Math.ceil(paddingLength - paddingLength / 2);
            break;
    }

    const leftPadding = new Array(leftPaddingLength).fill(character).join('');
    const rightPadding = new Array(rightPaddingLength).fill(character).join('');
    return leftPadding + text + rightPadding;
}
