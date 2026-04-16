import { truncateAnsi } from './Screen';
import { getFileIcon } from './fileIcons';
import { binarySearchBoundary } from './sync';
import { buildTree, flattenVisible, flattenFlat } from './FileTreePanel';
import { DiffFile } from './collectDiffData';

const RESET = '\x1b[0m';

describe('truncateAnsi', () => {
    test('plain text within limit', () => {
        expect(truncateAnsi('hello', 10)).toBe('hello');
    });

    test('plain text exceeding limit', () => {
        const result = truncateAnsi('hello world', 5);
        expect(result).toBe('hello' + RESET);
    });

    test('zero width returns reset only', () => {
        const result = truncateAnsi('hello', 0);
        expect(result).toBe(RESET);
    });

    test('preserves ANSI escapes, truncates visible chars', () => {
        const input = '\x1b[31mhello\x1b[0m world';
        const result = truncateAnsi(input, 5);
        // Should contain 'hello' colored red but not ' world'
        expect(result).toContain('\x1b[31m');
        expect(result.replace(/\x1b\[[0-9;]*m/g, '')).toBe('hello');
    });

    test('empty string returns empty', () => {
        expect(truncateAnsi('', 10)).toBe('');
    });

    test('exact width returns unchanged', () => {
        expect(truncateAnsi('abcde', 5)).toBe('abcde');
    });
});

describe('getFileIcon', () => {
    test('.ts extension', () => {
        expect(getFileIcon('src/foo.ts')).toBe('\ue628');
    });

    test('.tsx extension', () => {
        expect(getFileIcon('Component.tsx')).toBe('\ue7ba');
    });

    test('unknown extension returns default', () => {
        expect(getFileIcon('file.xyz')).toBe('\uf15b');
    });

    test('Dockerfile without extension', () => {
        expect(getFileIcon('Dockerfile')).toBe('\ue7b0');
    });

    test('Dockerfile with suffix', () => {
        expect(getFileIcon('Dockerfile.prod')).toBe('\ue7b0');
    });

    test('.gitignore', () => {
        expect(getFileIcon('.gitignore')).toBe('\ue702');
    });

    test('case-insensitive extension', () => {
        expect(getFileIcon('README.MD')).toBe('\ue73e');
    });
});

describe('binarySearchBoundary', () => {
    test('single boundary', () => {
        expect(binarySearchBoundary([0], 5)).toBe(0);
    });

    test('exact match returns that index', () => {
        expect(binarySearchBoundary([0, 10, 20], 10)).toBe(1);
    });

    test('between boundaries returns lower', () => {
        expect(binarySearchBoundary([0, 10, 20], 15)).toBe(1);
    });

    test('before first boundary returns 0', () => {
        expect(binarySearchBoundary([5, 10, 20], 2)).toBe(0);
    });

    test('after last boundary returns last index', () => {
        expect(binarySearchBoundary([0, 10, 20], 100)).toBe(2);
    });

    test('at first boundary returns 0', () => {
        expect(binarySearchBoundary([0, 10, 20], 0)).toBe(0);
    });

    test('at last boundary returns last index', () => {
        expect(binarySearchBoundary([0, 10, 20], 20)).toBe(2);
    });
});

function makeDiffFile(fileNameB: string): DiffFile {
    return {
        displayName: fileNameB,
        fileNameA: '',
        fileNameB,
        additions: 0,
        deletions: 0,
        startLineIndex: 0,
    };
}

describe('buildTree', () => {
    test('single file at root', () => {
        const tree = buildTree([makeDiffFile('README.md')]);
        expect(tree).toHaveLength(1);
        expect(tree[0].type).toBe('file');
        expect(tree[0].name).toBe('README.md');
    });

    test('nested file creates dir nodes', () => {
        const tree = buildTree([makeDiffFile('src/tui/App.ts')]);
        expect(tree).toHaveLength(1);
        expect(tree[0].type).toBe('dir');
        expect(tree[0].name).toBe('src');
        const src = tree[0] as { children: any[] };
        expect(src.children[0].type).toBe('dir');
        expect(src.children[0].name).toBe('tui');
    });

    test('sibling files share dir node', () => {
        const tree = buildTree([
            makeDiffFile('src/a.ts'),
            makeDiffFile('src/b.ts'),
        ]);
        expect(tree).toHaveLength(1);
        expect(tree[0].type).toBe('dir');
        const src = tree[0] as { children: any[] };
        expect(src.children).toHaveLength(2);
    });
});

describe('flattenVisible', () => {
    test('returns dirs and files in order', () => {
        const tree = buildTree([
            makeDiffFile('src/a.ts'),
            makeDiffFile('src/b.ts'),
            makeDiffFile('README.md'),
        ]);
        const visible = flattenVisible(tree);
        // dir 'src', file 'a.ts', file 'b.ts', file 'README.md'
        expect(visible).toHaveLength(4);
        expect(visible[0].type).toBe('dir');
        expect(visible[1].type).toBe('file');
        expect(visible[2].type).toBe('file');
        expect(visible[3].type).toBe('file');
    });

    test('collapsed dir hides children', () => {
        const tree = buildTree([
            makeDiffFile('src/a.ts'),
            makeDiffFile('README.md'),
        ]);
        // Collapse 'src'
        const srcDir = tree[0] as { expanded: boolean };
        srcDir.expanded = false;
        const visible = flattenVisible(tree);
        // dir 'src' (collapsed), file 'README.md'
        expect(visible).toHaveLength(2);
        expect(visible[0].type).toBe('dir');
        expect(visible[1].type).toBe('file');
        expect(visible[1].node.name).toBe('README.md');
    });
});

describe('flattenFlat', () => {
    test('returns only files with full paths, no dirs', () => {
        const files = [
            makeDiffFile('src/tui/App.ts'),
            makeDiffFile('src/utils.ts'),
            makeDiffFile('README.md'),
        ];
        const visible = flattenFlat(files);
        expect(visible).toHaveLength(3);
        expect(visible.every((v) => v.type === 'file')).toBe(true);
        expect(visible[0].node.name).toBe('src/tui/App.ts');
        expect(visible[1].node.name).toBe('src/utils.ts');
        expect(visible[2].node.name).toBe('README.md');
    });

    test('all nodes have depth 0', () => {
        const files = [
            makeDiffFile('a/b/c.ts'),
            makeDiffFile('d.ts'),
        ];
        const visible = flattenFlat(files);
        expect(visible.every((v) => v.node.depth === 0)).toBe(true);
    });

    test('preserves file indices', () => {
        const files = [
            makeDiffFile('x.ts'),
            makeDiffFile('y.ts'),
            makeDiffFile('z.ts'),
        ];
        const visible = flattenFlat(files);
        expect(visible[0].type === 'file' && visible[0].fileIndex).toBe(0);
        expect(visible[1].type === 'file' && visible[1].fileIndex).toBe(1);
        expect(visible[2].type === 'file' && visible[2].fileIndex).toBe(2);
    });
});
