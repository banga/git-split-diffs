import { Context } from '../context';
import { applyFormatting, T } from '../formattedString';
import { Screen } from './Screen';
import { DiffFile } from './collectDiffData';
import { RESET } from './ansi';

export class FileTreePanel {
    private files: DiffFile[];
    private width: number;
    private height: number;
    private context: Context;
    selectedIndex: number = 0;
    scrollOffset: number = 0;

    constructor(
        files: DiffFile[],
        width: number,
        height: number,
        context: Context
    ) {
        this.files = files;
        this.width = width;
        this.height = height;
        this.context = context;
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.clampScroll();
    }

    moveUp(): void {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.ensureVisible();
        }
    }

    moveDown(): void {
        if (this.selectedIndex < this.files.length - 1) {
            this.selectedIndex++;
            this.ensureVisible();
        }
    }

    selectFile(index: number): void {
        if (index >= 0 && index < this.files.length) {
            this.selectedIndex = index;
            this.ensureVisible();
        }
    }

    getSelectedFile(): DiffFile | undefined {
        return this.files[this.selectedIndex];
    }

    private ensureVisible(): void {
        if (this.selectedIndex < this.scrollOffset) {
            this.scrollOffset = this.selectedIndex;
        } else if (this.selectedIndex >= this.scrollOffset + this.height) {
            this.scrollOffset = this.selectedIndex - this.height + 1;
        }
    }

    private clampScroll(): void {
        const maxScroll = Math.max(0, this.files.length - this.height);
        this.scrollOffset = Math.min(this.scrollOffset, maxScroll);
        this.scrollOffset = Math.max(0, this.scrollOffset);
    }

    render(screen: Screen, startCol: number, startRow: number, focused: boolean): void {
        const { FILE_TREE_COLOR, FILE_TREE_SELECTED_COLOR } = this.context;

        for (let row = 0; row < this.height; row++) {
            const fileIndex = this.scrollOffset + row;
            const screenRow = startRow + row;

            if (fileIndex >= this.files.length) {
                // Empty row — fill with tree background
                const emptyLine = T()
                    .fillWidth(this.width, ' ')
                    .addSpan(0, this.width, FILE_TREE_COLOR);
                screen.writeAt(
                    screenRow,
                    startCol,
                    applyFormatting(this.context, emptyLine),
                    this.width
                );
                continue;
            }

            const file = this.files[fileIndex];
            const isSelected = fileIndex === this.selectedIndex;

            const statusChar = this.getStatusChar(file);
            const label = ` ${statusChar} ${file.displayName} `;

            const line = T()
                .appendString(label)
                .fillWidth(this.width, ' ')
                .addSpan(0, this.width, FILE_TREE_COLOR);

            if (isSelected) {
                line.addSpan(0, this.width, FILE_TREE_SELECTED_COLOR);
                if (focused) {
                    // Add a marker for focused+selected
                    // The inverse modifier already handles highlight
                }
            }

            screen.writeAt(
                screenRow,
                startCol,
                applyFormatting(this.context, line) + RESET,
                this.width
            );
        }
    }

    private getStatusChar(file: DiffFile): string {
        if (!file.fileNameA) return 'A';
        if (!file.fileNameB) return 'D';
        if (file.fileNameA !== file.fileNameB) return 'R';
        return 'M';
    }
}
