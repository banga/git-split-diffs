import { FileTreePanel } from './FileTreePanel';
import { DiffViewPanel } from './DiffViewPanel';

/**
 * When the user selects a file in the tree, scroll the diff view to that file.
 */
export function syncTreeToDiff(
    tree: FileTreePanel,
    diff: DiffViewPanel,
    fileBoundaries: number[]
): void {
    const idx = tree.selectedIndex;
    if (idx >= 0 && idx < fileBoundaries.length) {
        diff.scrollToLine(fileBoundaries[idx]);
    }
}

/**
 * When the user scrolls the diff view, update the tree to highlight
 * the file visible at the top of the viewport.
 */
export function syncDiffToTree(
    diff: DiffViewPanel,
    tree: FileTreePanel,
    fileBoundaries: number[]
): void {
    if (fileBoundaries.length === 0) return;

    const topLine = diff.getTopVisibleLine();
    let fileIndex = binarySearchBoundary(fileBoundaries, topLine);
    tree.selectFile(fileIndex);
}

/**
 * Binary search: find the last boundary <= topLine.
 */
function binarySearchBoundary(
    boundaries: number[],
    topLine: number
): number {
    let lo = 0;
    let hi = boundaries.length - 1;
    let result = 0;

    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (boundaries[mid] <= topLine) {
            result = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    return result;
}
