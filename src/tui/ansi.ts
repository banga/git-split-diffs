export const ESC = '\x1b';

// Alternate screen buffer
export const ENTER_ALT_SCREEN = `${ESC}[?1049h`;
export const EXIT_ALT_SCREEN = `${ESC}[?1049l`;

// Cursor
export const HIDE_CURSOR = `${ESC}[?25l`;
export const SHOW_CURSOR = `${ESC}[?25h`;

// Positioning
export function moveTo(row: number, col: number): string {
    return `${ESC}[${row + 1};${col + 1}H`;
}

// Clearing
export const CLEAR_SCREEN = `${ESC}[2J`;
export const CLEAR_LINE = `${ESC}[2K`;
export const ERASE_TO_EOL = `${ESC}[0K`;

// Style
export const RESET = `${ESC}[0m`;
export const INVERSE = `${ESC}[7m`;
export const INVERSE_OFF = `${ESC}[27m`;
