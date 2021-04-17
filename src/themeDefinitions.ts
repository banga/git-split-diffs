import { ThemeDefinition } from './themes';

export const THEME_DEFINITIONS: { [key in string]: ThemeDefinition } = {
    default: {
        DEFAULT_COLOR: 'white',
        BORDER_COLOR: { modifiers: ['dim'] },
        COMMIT_SHA_COLOR: 'green',
        COMMIT_AUTHOR_COLOR: 'blue',
        FILE_NAME_COLOR: 'yellow',
        HUNK_HEADER_COLOR: { modifiers: ['dim'] },
        DELETED_WORD_COLOR: { color: 'red', modifiers: ['inverse'] },
        INSERTED_WORD_COLOR: { color: 'green', modifiers: ['inverse'] },
        DELETED_LINE_COLOR: 'red',
        INSERTED_LINE_COLOR: 'green',
        DELETED_LINE_NO_COLOR: { color: 'red', modifiers: ['dim'] },
        INSERTED_LINE_NO_COLOR: { color: 'green', modifiers: ['dim'] },
        UNMODIFIED_LINE_NO_COLOR: { modifiers: ['dim'] },
    },
    light: {
        DEFAULT_COLOR: { color: '333', backgroundColor: 'eee' },
        BORDER_COLOR: { color: 'ccc' },
        COMMIT_SHA_COLOR: { color: '060' },
        COMMIT_AUTHOR_COLOR: { color: '633' },
        FILE_NAME_COLOR: '366',
        HUNK_HEADER_COLOR: { color: '666', backgroundColor: 'e0e0e0' },
        DELETED_WORD_COLOR: { backgroundColor: 'eaa' },
        INSERTED_WORD_COLOR: { backgroundColor: 'aea' },
        DELETED_LINE_COLOR: { backgroundColor: 'ecc' },
        INSERTED_LINE_COLOR: { backgroundColor: 'cec' },
        DELETED_LINE_NO_COLOR: {
            color: '633',
            backgroundColor: 'ecc',
            modifiers: ['dim'],
        },
        INSERTED_LINE_NO_COLOR: {
            color: '363',
            backgroundColor: 'cec',
            modifiers: ['dim'],
        },
        UNMODIFIED_LINE_COLOR: { color: '666' },
        UNMODIFIED_LINE_NO_COLOR: { modifiers: ['dim'] },
        MISSING_LINE_COLOR: { backgroundColor: 'e8e8e8' },
    },
    'color-test': { DEFAULT_COLOR: { modifiers: ['inverse', 'bold'] } },
    'github-light': {
        DEFAULT_COLOR: { color: '05264c', backgroundColor: 'ffffff' },
        BORDER_COLOR: { color: 'e1e4e8' },
        COMMIT_COLOR: { backgroundColor: 'f1f8fe' },
        COMMIT_AUTHOR_COLOR: { modifiers: ['bold'], backgroundColor: 'f1f8fe' },
        COMMIT_DATE_COLOR: { backgroundColor: 'f1f8fe' },
        COMMIT_SHA_COLOR: { backgroundColor: 'f1f8fe' },
        HUNK_HEADER_COLOR: { color: '4c5154', backgroundColor: 'f1f8ff' },
        DELETED_WORD_COLOR: { color: '24292e', backgroundColor: 'fdb8c0' },
        INSERTED_WORD_COLOR: { color: '24292e', backgroundColor: 'acf2bd' },
        DELETED_LINE_COLOR: { color: '24292e', backgroundColor: 'ffeef0' },
        INSERTED_LINE_COLOR: { color: '24292e', backgroundColor: 'e6ffed' },
        UNMODIFIED_LINE_COLOR: { color: '6a737d' },
        MISSING_LINE_COLOR: { backgroundColor: 'fafbfc' },
        DELETED_LINE_NO_COLOR: { color: 'c2a9ad', backgroundColor: 'ffdce0' },
        INSERTED_LINE_NO_COLOR: { color: 'a5cfb0', backgroundColor: 'cdffd8' },
        UNMODIFIED_LINE_NO_COLOR: { color: 'd1d5da' },
    },
    'github-dark-dim': {
        DEFAULT_COLOR: { color: 'adbac7', backgroundColor: '22272e' },
        BORDER_COLOR: { color: '444c56' },
        COMMIT_COLOR: { color: 'c6e6ff' },
        COMMIT_AUTHOR_COLOR: { modifiers: ['bold'] },
        HUNK_HEADER_COLOR: { color: '768390', backgroundColor: '263441' },
        DELETED_WORD_COLOR: { backgroundColor: '873534' },
        INSERTED_WORD_COLOR: { backgroundColor: '3a6e3f' },
        DELETED_LINE_COLOR: { backgroundColor: '442d30' },
        INSERTED_LINE_COLOR: { backgroundColor: '2a3c33' },
        UNMODIFIED_LINE_COLOR: { color: '768390', backgroundColor: '22282d' },
        MISSING_LINE_COLOR: { backgroundColor: '2d333b' },
        DELETED_LINE_NO_COLOR: { color: 'e5534b', backgroundColor: '442d30' },
        INSERTED_LINE_NO_COLOR: { color: '57ab5a', backgroundColor: '253230' },
        UNMODIFIED_LINE_NO_COLOR: { backgroundColor: '22282d' },
    },
};
