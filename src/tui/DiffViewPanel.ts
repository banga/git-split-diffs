import { Screen, truncateAnsi } from './Screen';
import { RESET } from './ansi';

export class DiffViewPanel {
    private lines: string[];
    private width: number;
    private height: number;
    scrollOffset: number = 0;

    constructor(lines: string[], width: number, height: number) {
        this.lines = lines;
        this.width = width;
        this.height = height;
    }

    get viewHeight(): number {
        return this.height;
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.clampScroll();
    }

    setLines(lines: string[]): void {
        this.lines = lines;
        this.clampScroll();
    }

    scrollUp(n: number = 1): void {
        this.scrollOffset = Math.max(0, this.scrollOffset - n);
    }

    scrollDown(n: number = 1): void {
        this.scrollOffset = Math.min(this.maxScroll(), this.scrollOffset + n);
    }

    pageUp(): void {
        this.scrollUp(this.height - 1);
    }

    pageDown(): void {
        this.scrollDown(this.height - 1);
    }

    scrollToLine(lineIndex: number): void {
        this.scrollOffset = Math.max(
            0,
            Math.min(lineIndex, this.maxScroll())
        );
    }

    scrollToTop(): void {
        this.scrollOffset = 0;
    }

    scrollToBottom(): void {
        this.scrollOffset = this.maxScroll();
    }

    getTopVisibleLine(): number {
        return this.scrollOffset;
    }

    private maxScroll(): number {
        return Math.max(0, this.lines.length - this.height);
    }

    private clampScroll(): void {
        this.scrollOffset = Math.max(
            0,
            Math.min(this.scrollOffset, this.maxScroll())
        );
    }

    render(screen: Screen, startCol: number, startRow: number): void {
        for (let row = 0; row < this.height; row++) {
            const lineIndex = this.scrollOffset + row;
            const screenRow = startRow + row;

            if (lineIndex >= this.lines.length) {
                screen.clearLine(screenRow);
                continue;
            }

            const line = this.lines[lineIndex];
            screen.writeAt(
                screenRow,
                startCol,
                truncateAnsi(line, this.width) + RESET,
                this.width
            );
        }
    }
}
