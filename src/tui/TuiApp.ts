import { Readable } from 'stream';
import * as process from 'process';
import { Context } from '../context';
import { applyFormatting, T } from '../formattedString';
import { Screen } from './Screen';
import { InputHandler } from './InputHandler';
import { FileTreePanel } from './FileTreePanel';
import { DiffViewPanel } from './DiffViewPanel';
import { collectDiffData, DiffData } from './collectDiffData';
import { syncTreeToDiff, syncDiffToTree } from './sync';
import { getGitStagingStatus } from './gitStatus';
import { RESET } from './ansi';

const TREE_WIDTH = 30;
const BORDER_WIDTH = 1;

type FocusPanel = 'tree' | 'diff';

export class TuiApp {
    private screen!: Screen;
    private input!: InputHandler;
    private tree!: FileTreePanel;
    private diff!: DiffViewPanel;
    private data!: DiffData;
    private context!: Context;
    private focus: FocusPanel = 'tree';
    private resolve!: () => void;

    async run(context: Context, stdin: Readable): Promise<void> {
        this.context = context;

        // Consume all diff data from stdin first
        this.data = await collectDiffData(context, stdin);

        if (this.data.files.length === 0 && this.data.allRenderedLines.length === 0) {
            return;
        }

        // Annotate files with git staging status
        const stagingMap = getGitStagingStatus();
        for (const file of this.data.files) {
            const path = file.fileNameB || file.fileNameA;
            if (path && stagingMap.has(path)) {
                file.stagingStatus = stagingMap.get(path);
            }
        }

        const rows = process.stdout.rows ?? 24;
        const cols = process.stdout.columns ?? 80;

        this.screen = new Screen(rows, cols);
        this.screen.enter();

        const viewHeight = rows;
        const diffWidth = cols - TREE_WIDTH - BORDER_WIDTH;

        this.tree = new FileTreePanel(
            this.data.files,
            TREE_WIDTH,
            viewHeight,
            context
        );
        this.diff = new DiffViewPanel(
            this.data.allRenderedLines,
            diffWidth,
            viewHeight
        );

        // Sync initial position
        if (this.data.files.length > 0) {
            syncTreeToDiff(this.tree, this.diff, this.data.fileBoundaries);
        }

        this.screen.onResize(() => this.handleResize());
        this.input = new InputHandler((key, ctrl) =>
            this.handleKey(key, ctrl)
        );
        this.input.start();

        this.render();

        return new Promise<void>((resolve) => {
            this.resolve = resolve;
        });
    }

    private handleResize(): void {
        const rows = process.stdout.rows ?? 24;
        const cols = process.stdout.columns ?? 80;
        this.screen.rows = rows;
        this.screen.cols = cols;

        const viewHeight = rows;
        const diffWidth = cols - TREE_WIDTH - BORDER_WIDTH;

        this.tree.resize(TREE_WIDTH, viewHeight);
        this.diff.resize(diffWidth, viewHeight);
        this.render();
    }

    private handleKey(key: string, ctrl: boolean): void {
        if (key === 'q' || (ctrl && key === 'c')) {
            this.quit();
            return;
        }

        if (key === 'tab') {
            this.focus = this.focus === 'tree' ? 'diff' : 'tree';
            this.render();
            return;
        }

        if (this.focus === 'tree') {
            this.handleTreeKey(key, ctrl);
        } else {
            this.handleDiffKey(key, ctrl);
        }
    }

    private handleTreeKey(key: string, ctrl: boolean): void {
        if (ctrl) {
            switch (key) {
                case 'd': {
                    const half = Math.floor(this.tree.viewHeight / 2);
                    this.tree.moveBy(half);
                    syncTreeToDiff(
                        this.tree,
                        this.diff,
                        this.data.fileBoundaries
                    );
                    break;
                }
                case 'u': {
                    const half = Math.floor(this.tree.viewHeight / 2);
                    this.tree.moveBy(-half);
                    syncTreeToDiff(
                        this.tree,
                        this.diff,
                        this.data.fileBoundaries
                    );
                    break;
                }
                default:
                    return;
            }
            this.render();
            return;
        }

        switch (key) {
            case 'j':
            case 'down':
                this.tree.moveDown();
                syncTreeToDiff(
                    this.tree,
                    this.diff,
                    this.data.fileBoundaries
                );
                break;
            case 'k':
            case 'up':
                this.tree.moveUp();
                syncTreeToDiff(
                    this.tree,
                    this.diff,
                    this.data.fileBoundaries
                );
                break;
            case 'l':
            case 'right':
            case 'return': {
                const isFile = this.tree.toggleOrSelect();
                if (isFile) {
                    this.focus = 'diff';
                    syncTreeToDiff(
                        this.tree,
                        this.diff,
                        this.data.fileBoundaries
                    );
                }
                break;
            }
            case 'h':
            case 'left':
                this.tree.collapseOrParent();
                syncTreeToDiff(
                    this.tree,
                    this.diff,
                    this.data.fileBoundaries
                );
                break;
            case 'g':
                this.tree.selectFirst();
                syncTreeToDiff(
                    this.tree,
                    this.diff,
                    this.data.fileBoundaries
                );
                break;
            case 'G':
                this.tree.selectLast();
                syncTreeToDiff(
                    this.tree,
                    this.diff,
                    this.data.fileBoundaries
                );
                break;
            default:
                return;
        }
        this.render();
    }

    private handleDiffKey(key: string, ctrl: boolean): void {
        if (ctrl) {
            switch (key) {
                case 'd': {
                    const half = Math.floor(this.diff.viewHeight / 2);
                    this.diff.scrollDown(half);
                    syncDiffToTree(
                        this.diff,
                        this.tree,
                        this.data.fileBoundaries
                    );
                    break;
                }
                case 'u': {
                    const half = Math.floor(this.diff.viewHeight / 2);
                    this.diff.scrollUp(half);
                    syncDiffToTree(
                        this.diff,
                        this.tree,
                        this.data.fileBoundaries
                    );
                    break;
                }
                default:
                    return;
            }
            this.render();
            return;
        }

        switch (key) {
            case 'j':
            case 'down':
                this.diff.scrollDown();
                syncDiffToTree(
                    this.diff,
                    this.tree,
                    this.data.fileBoundaries
                );
                break;
            case 'k':
            case 'up':
                this.diff.scrollUp();
                syncDiffToTree(
                    this.diff,
                    this.tree,
                    this.data.fileBoundaries
                );
                break;
            case 'h':
            case 'left':
                this.focus = 'tree';
                break;
            case 'space':
            case 'pagedown':
                this.diff.pageDown();
                syncDiffToTree(
                    this.diff,
                    this.tree,
                    this.data.fileBoundaries
                );
                break;
            case 'b':
            case 'pageup':
                this.diff.pageUp();
                syncDiffToTree(
                    this.diff,
                    this.tree,
                    this.data.fileBoundaries
                );
                break;
            case 'g':
                this.diff.scrollToTop();
                syncDiffToTree(
                    this.diff,
                    this.tree,
                    this.data.fileBoundaries
                );
                break;
            case 'G':
                this.diff.scrollToBottom();
                syncDiffToTree(
                    this.diff,
                    this.tree,
                    this.data.fileBoundaries
                );
                break;
            default:
                return;
        }
        this.render();
    }

    private render(): void {
        const borderCol = TREE_WIDTH;
        const diffCol = TREE_WIDTH + BORDER_WIDTH;
        const viewHeight = this.screen.rows;

        // Render tree panel
        this.tree.render(this.screen, 0, 0, this.focus === 'tree');

        // Render border — use focused color when tree is focused
        const borderColor = this.focus === 'tree'
            ? this.context.FILE_TREE_BORDER_FOCUSED_COLOR
            : this.context.FILE_TREE_BORDER_COLOR;
        const borderStyle = applyFormatting(
            this.context,
            T().appendString('│').addSpan(0, 1, borderColor)
        );
        for (let r = 0; r < viewHeight; r++) {
            this.screen.writeAt(r, borderCol, borderStyle + RESET, 1);
        }

        // Render diff panel
        this.diff.render(this.screen, diffCol, 0);

        this.screen.flush();
    }

    private quit(): void {
        this.input.stop();
        this.screen.removeResizeListener();
        this.screen.exit();
        this.resolve();
    }
}
