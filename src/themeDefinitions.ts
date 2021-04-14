import { ThemeDefinition } from './themes';

const THEME_DEFINITIONS: { [key in string]: ThemeDefinition } = {
    default: {
        DEFAULT_COLOR: 'white',
        BORDER_COLOR: { modifiers: ['dim'] },
        COMMIT_SHA_COLOR: 'green',
        COMMIT_AUTHOR_COLOR: 'blue',
        FILE_NAME_COLOR: 'yellow',
        HUNK_HEADER_COLOR: { modifiers: ['dim'] },
        DELETED_LINE_COLOR: 'red',
        INSERTED_LINE_COLOR: 'green',
        DELETED_LINE_NO_COLOR: { color: 'red', modifiers: ['dim'] },
        INSERTED_LINE_NO_COLOR: { color: 'green', modifiers: ['dim'] },
        UNMODIFIED_LINE_NO_COLOR: { modifiers: ['dim'] },
    },
    'color-test': { DEFAULT_COLOR: { modifiers: ['inverse', 'bold'] } },
    'github-dark-dimmed': {
        DEFAULT_COLOR: { color: 'adbac7', backgroundColor: '22272e' },
        BORDER_COLOR: { color: '444c56' },
        COMMIT_COLOR: { color: 'c6e6ff' },
        COMMIT_AUTHOR_COLOR: { modifiers: ['bold'] },
        HUNK_HEADER_COLOR: { color: '768390', backgroundColor: '263441' },
        DELETED_LINE_COLOR: { color: 'e5534b', backgroundColor: '442d30' },
        INSERTED_LINE_COLOR: { color: '57ab5a', backgroundColor: '253230' },
        UNMODIFIED_LINE_COLOR: { backgroundColor: '22282d' },
        MISSING_LINE_COLOR: { backgroundColor: '2d333b' },
        DELETED_LINE_NO_COLOR: { color: 'e5534b', backgroundColor: '442d30' },
        INSERTED_LINE_NO_COLOR: { color: '57ab5a', backgroundColor: '253230' },
        UNMODIFIED_LINE_NO_COLOR: { backgroundColor: '22282d' },
    },
};
export default THEME_DEFINITIONS;
