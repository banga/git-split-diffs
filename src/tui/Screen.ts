import ansiRegex from 'ansi-regex';
import * as process from 'process';
import {
    ENTER_ALT_SCREEN,
    EXIT_ALT_SCREEN,
    HIDE_CURSOR,
    SHOW_CURSOR,
    CLEAR_SCREEN,
    CLEAR_LINE,
    ERASE_TO_EOL,
    moveTo,
    RESET,
} from './ansi';

const ANSI_REGEX = ansiRegex();

export class Screen {
    rows: number;
    cols: number;
    private buffer: string = '';
    private resizeHandler: (() => void) | null = null;

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
    }

    enter(): void {
        this.write(ENTER_ALT_SCREEN + HIDE_CURSOR + CLEAR_SCREEN);
        this.flush();
    }

    clear(): void {
        this.buffer += CLEAR_SCREEN;
    }

    exit(): void {
        this.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
        this.flush();
    }

    onResize(handler: () => void): void {
        this.resizeHandler = () => {
            this.rows = process.stdout.rows ?? this.rows;
            this.cols = process.stdout.columns ?? this.cols;
            handler();
        };
        process.stdout.on('resize', this.resizeHandler);
    }

    removeResizeListener(): void {
        if (this.resizeHandler) {
            process.stdout.removeListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }

    writeAt(row: number, col: number, text: string, maxWidth: number): void {
        this.buffer += moveTo(row, col);
        this.buffer += truncateAnsi(text, maxWidth);
        this.buffer += ERASE_TO_EOL;
    }

    clearLine(row: number): void {
        this.buffer += moveTo(row, 0) + CLEAR_LINE;
    }

    drawVerticalBorder(col: number, startRow: number, endRow: number, style: string): void {
        for (let r = startRow; r < endRow; r++) {
            this.buffer += moveTo(r, col) + style + '│' + RESET;
        }
    }

    flush(): void {
        if (this.buffer.length > 0) {
            process.stdout.write(this.buffer);
            this.buffer = '';
        }
    }

    private write(data: string): void {
        this.buffer += data;
    }
}

/**
 * Truncate an ANSI-formatted string to a visible width.
 * Preserves escape sequences, counts only visible characters.
 */
export function truncateAnsi(str: string, maxWidth: number): string {
    let visibleLen = 0;
    let result = '';
    let lastIndex = 0;

    ANSI_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = ANSI_REGEX.exec(str)) !== null) {
        // Text before this escape sequence
        const textBefore = str.slice(lastIndex, match.index);
        const remaining = maxWidth - visibleLen;

        if (textBefore.length <= remaining) {
            result += textBefore;
            visibleLen += textBefore.length;
        } else {
            result += textBefore.slice(0, remaining);
            visibleLen = maxWidth;
            result += RESET;
            return result;
        }

        // Always include the escape sequence
        result += match[0];
        lastIndex = match.index + match[0].length;
    }

    // Remaining text after last escape
    const tail = str.slice(lastIndex);
    const remaining = maxWidth - visibleLen;
    if (tail.length <= remaining) {
        result += tail;
    } else {
        result += tail.slice(0, remaining);
        result += RESET;
    }

    return result;
}
