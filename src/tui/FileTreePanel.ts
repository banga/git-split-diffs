import * as path from 'path';
import { Context } from '../context';
import { applyFormatting, T } from '../formattedString';
import { Screen } from './Screen';
import { DiffFile } from './collectDiffData';
import { RESET } from './ansi';
import { getFileIcon, FOLDER_CLOSED, FOLDER_OPEN } from './fileIcons';

type DirNode = {
    type: 'dir';
    name: string;
    path: string;
    children: TreeNode[];
    expanded: boolean;
    depth: number;
};

type FileNode = {
    type: 'file';
    name: string;
    path: string;
    file: DiffFile;
    fileIndex: number;
    depth: number;
};

type TreeNode = DirNode | FileNode;

type VisibleNode =
    | { type: 'dir'; node: DirNode }
    | { type: 'file'; node: FileNode; fileIndex: number };

export function buildTree(files: DiffFile[]): TreeNode[] {
    const root: TreeNode[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = file.fileNameB || file.fileNameA || file.displayName;
        const parts = filePath.split('/');
        let children = root;
        let currentPath = '';

        for (let j = 0; j < parts.length - 1; j++) {
            currentPath = currentPath ? currentPath + '/' + parts[j] : parts[j];
            let dir = children.find(
                (n) => n.type === 'dir' && n.name === parts[j]
            ) as DirNode | undefined;
            if (!dir) {
                dir = {
                    type: 'dir',
                    name: parts[j],
                    path: currentPath,
                    children: [],
                    expanded: true,
                    depth: j,
                };
                children.push(dir);
            }
            children = dir.children;
        }

        children.push({
            type: 'file',
            name: parts[parts.length - 1],
            path: filePath,
            file,
            fileIndex: i,
            depth: parts.length - 1,
        });
    }

    return root;
}

export function flattenVisible(nodes: TreeNode[]): VisibleNode[] {
    const result: VisibleNode[] = [];
    for (const node of nodes) {
        if (node.type === 'dir') {
            result.push({ type: 'dir', node });
            if (node.expanded) {
                result.push(...flattenVisible(node.children));
            }
        } else {
            result.push({
                type: 'file',
                node,
                fileIndex: node.fileIndex,
            });
        }
    }
    return result;
}

export class FileTreePanel {
    private files: DiffFile[];
    private rootNodes: TreeNode[];
    private visibleNodes: VisibleNode[] = [];
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
        this.rootNodes = buildTree(files);
        this.regenerateVisible();
    }

    get viewHeight(): number {
        return this.height;
    }

    private regenerateVisible(): void {
        this.visibleNodes = flattenVisible(this.rootNodes);
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
        if (this.selectedIndex < this.visibleNodes.length - 1) {
            this.selectedIndex++;
            this.ensureVisible();
        }
    }

    moveBy(delta: number): void {
        const newIndex = Math.max(
            0,
            Math.min(this.visibleNodes.length - 1, this.selectedIndex + delta)
        );
        this.selectedIndex = newIndex;
        this.ensureVisible();
    }

    /**
     * Toggle expand/collapse on a dir, or focus diff on a file.
     * Returns true if a file was selected (caller should switch focus).
     */
    toggleOrSelect(): boolean {
        const vn = this.visibleNodes[this.selectedIndex];
        if (!vn) return false;
        if (vn.type === 'dir') {
            vn.node.expanded = !vn.node.expanded;
            this.regenerateVisible();
            // Clamp selection if collapsed nodes removed entries below
            if (this.selectedIndex >= this.visibleNodes.length) {
                this.selectedIndex = this.visibleNodes.length - 1;
            }
            this.ensureVisible();
            return false;
        }
        return true; // file selected
    }

    /**
     * Collapse current dir, or navigate to parent dir.
     */
    collapseOrParent(): void {
        const vn = this.visibleNodes[this.selectedIndex];
        if (!vn) return;

        if (vn.type === 'dir' && vn.node.expanded) {
            vn.node.expanded = false;
            this.regenerateVisible();
            if (this.selectedIndex >= this.visibleNodes.length) {
                this.selectedIndex = this.visibleNodes.length - 1;
            }
            this.ensureVisible();
            return;
        }

        // Navigate to parent directory
        const nodePath = vn.node.path;
        const parentPath = path.dirname(nodePath);
        if (parentPath === '.' || parentPath === nodePath) return;

        for (let i = this.selectedIndex - 1; i >= 0; i--) {
            const candidate = this.visibleNodes[i];
            if (candidate.type === 'dir' && candidate.node.path === parentPath) {
                this.selectedIndex = i;
                this.ensureVisible();
                return;
            }
        }
    }

    /**
     * Returns the original file index if a file is selected, undefined for dirs.
     */
    getSelectedFileIndex(): number | undefined {
        const vn = this.visibleNodes[this.selectedIndex];
        if (!vn || vn.type !== 'file') return undefined;
        return vn.fileIndex;
    }

    /**
     * Select a file by its original index in the files array.
     * Expands ancestors if collapsed.
     */
    selectFileByIndex(idx: number): void {
        if (idx < 0 || idx >= this.files.length) return;
        const file = this.files[idx];
        const filePath = file.fileNameB || file.fileNameA || file.displayName;

        // Ensure all ancestor dirs are expanded
        this.expandAncestors(filePath);
        this.regenerateVisible();

        // Find the visible node with this file index
        for (let i = 0; i < this.visibleNodes.length; i++) {
            const vn = this.visibleNodes[i];
            if (vn.type === 'file' && vn.fileIndex === idx) {
                this.selectedIndex = i;
                this.ensureVisible();
                return;
            }
        }
    }

    selectFirst(): void {
        this.selectedIndex = 0;
        this.ensureVisible();
    }

    selectLast(): void {
        this.selectedIndex = Math.max(0, this.visibleNodes.length - 1);
        this.ensureVisible();
    }

    private expandAncestors(filePath: string): void {
        const parts = filePath.split('/');
        let children = this.rootNodes;
        for (let i = 0; i < parts.length - 1; i++) {
            const dir = children.find(
                (n) => n.type === 'dir' && n.name === parts[i]
            ) as DirNode | undefined;
            if (dir) {
                dir.expanded = true;
                children = dir.children;
            } else {
                break;
            }
        }
    }

    private ensureVisible(): void {
        if (this.selectedIndex < this.scrollOffset) {
            this.scrollOffset = this.selectedIndex;
        } else if (this.selectedIndex >= this.scrollOffset + this.height) {
            this.scrollOffset = this.selectedIndex - this.height + 1;
        }
    }

    private clampScroll(): void {
        const maxScroll = Math.max(0, this.visibleNodes.length - this.height);
        this.scrollOffset = Math.min(this.scrollOffset, maxScroll);
        this.scrollOffset = Math.max(0, this.scrollOffset);
    }

    render(
        screen: Screen,
        startCol: number,
        startRow: number
    ): void {
        const {
            FILE_TREE_COLOR,
            FILE_TREE_SELECTED_COLOR,
            FILE_TREE_DIR_COLOR,
            FILE_TREE_ADDITIONS_COLOR,
            FILE_TREE_DELETIONS_COLOR,
            FILE_TREE_FILE_SELECTED_COLOR,
            FILE_TREE_STAGED_COLOR,
            FILE_TREE_PARTIAL_STAGED_COLOR,
        } = this.context;

        for (let row = 0; row < this.height; row++) {
            const visIdx = this.scrollOffset + row;
            const screenRow = startRow + row;

            if (visIdx >= this.visibleNodes.length) {
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

            const vn = this.visibleNodes[visIdx];
            const isSelected = visIdx === this.selectedIndex;
            const indent = '  '.repeat(vn.node.depth);

            if (vn.type === 'dir') {
                const icon = vn.node.expanded ? FOLDER_OPEN : FOLDER_CLOSED;
                const label = ` ${indent}${icon} ${vn.node.name}`;

                const line = T()
                    .appendString(label)
                    .fillWidth(this.width, ' ')
                    .addSpan(0, this.width, FILE_TREE_DIR_COLOR);

                if (isSelected) {
                    line.addSpan(0, this.width, FILE_TREE_SELECTED_COLOR);
                }

                screen.writeAt(
                    screenRow,
                    startCol,
                    applyFormatting(this.context, line) + RESET,
                    this.width
                );
            } else {
                const icon = getFileIcon(vn.node.path);
                const adds = vn.node.file.additions;
                const dels = vn.node.file.deletions;

                // Build the stat suffix
                let stat = '';
                if (adds > 0) stat += `+${adds}`;
                if (dels > 0) stat += (stat ? ' ' : '') + `-${dels}`;

                const prefix = ` ${indent}${icon} `;
                const suffix = stat ? ` ${stat} ` : ' ';
                const maxNameLen = this.width - prefix.length - suffix.length;
                let name = vn.node.name;
                if (name.length > maxNameLen && maxNameLen > 3) {
                    name = name.slice(0, maxNameLen - 1) + '…';
                } else if (maxNameLen <= 3) {
                    name = name.slice(0, Math.max(1, maxNameLen));
                }

                const leftPart = prefix + name;
                const padding = Math.max(
                    0,
                    this.width - leftPart.length - suffix.length
                );
                const fullText = leftPart + ' '.repeat(padding) + suffix;

                const line = T()
                    .appendString(fullText)
                    .fillWidth(this.width, ' ');

                // Specific spans first (first-added wins in reduceThemeColors)
                const staging = vn.node.file.stagingStatus;
                if (staging === 'staged') {
                    line.addSpan(
                        prefix.length,
                        prefix.length + name.length,
                        FILE_TREE_STAGED_COLOR
                    );
                } else if (staging === 'partial') {
                    line.addSpan(
                        prefix.length,
                        prefix.length + name.length,
                        FILE_TREE_PARTIAL_STAGED_COLOR
                    );
                }

                if (stat) {
                    const statStart = this.width - suffix.length + 1;
                    if (adds > 0) {
                        const addStr = `+${adds}`;
                        const addStart = statStart;
                        line.addSpan(
                            addStart,
                            addStart + addStr.length,
                            FILE_TREE_ADDITIONS_COLOR
                        );
                    }
                    if (dels > 0) {
                        const delStr = `-${dels}`;
                        const delStart = this.width - 1 - delStr.length;
                        line.addSpan(
                            delStart,
                            delStart + delStr.length,
                            FILE_TREE_DELETIONS_COLOR
                        );
                    }
                }

                // Selected bg before generic base so it wins the bg merge
                if (isSelected) {
                    line.addSpan(0, this.width, FILE_TREE_FILE_SELECTED_COLOR);
                }

                // Generic base color last (fallback for unspanned regions)
                line.addSpan(0, this.width, FILE_TREE_COLOR);

                screen.writeAt(
                    screenRow,
                    startCol,
                    applyFormatting(this.context, line) + RESET,
                    this.width
                );
            }
        }
    }
}
