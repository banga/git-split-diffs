import ansiRegex from 'ansi-regex';
import chalk from 'chalk';

export const ANSI_COLOR_CODE_REGEX = ansiRegex();

export function coloredTextLength(text: string) {
    return text.replace(ANSI_COLOR_CODE_REGEX, '').length;
}

export function centerColoredText(
    text: string,
    width: number,
    character: string = ' ',
    characterColor: chalk.Chalk = chalk.white
) {
    const lineLength = coloredTextLength(text);
    const paddingLength = width - lineLength - 2;
    const leftPadding = characterColor(
        ''.padStart(paddingLength / 2, character)
    );
    const rightPadding = characterColor(
        ''.padStart(paddingLength - paddingLength / 2, character)
    );
    return `${leftPadding} ${text} ${rightPadding}`;
}
