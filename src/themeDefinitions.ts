import { ThemeDefinition } from './themes';

export const THEME_DEFINITIONS: { [key in string]: ThemeDefinition } = {
    default: {
        SYNTAX_HIGHLIGHTING_THEME: 'dark-plus',

        COMMIT_HEADER_COLOR: 'cccccc',
        COMMIT_HEADER_LABEL_COLOR: '00000022',
        COMMIT_SHA_COLOR: '00eeaa',
        COMMIT_AUTHOR_COLOR: '00aaee',
        COMMIT_DATE_COLOR: 'cccccc',
        COMMIT_MESSAGE_COLOR: 'cccccc',
        COMMIT_TITLE_COLOR: { modifiers: ['bold'] },

        FILE_NAME_COLOR: 'ffdd99',
        BORDER_COLOR: { color: 'ffdd9966', modifiers: ['dim'] },

        HUNK_HEADER_COLOR: { modifiers: ['dim'] },

        DELETED_WORD_COLOR: {
            color: 'ffcccc',
            backgroundColor: 'ff000033',
        },
        INSERTED_WORD_COLOR: {
            color: 'ccffcc',
            backgroundColor: '00ff0033',
        },

        DELETED_LINE_NO_COLOR: {
            color: '00000022',
            backgroundColor: '00000022',
        },
        INSERTED_LINE_NO_COLOR: {
            color: '00000022',
            backgroundColor: '00000022',
        },
        UNMODIFIED_LINE_NO_COLOR: { color: '666666' },

        DELETED_LINE_COLOR: { color: 'cc6666', backgroundColor: '3a3030' },
        INSERTED_LINE_COLOR: { color: '66cc66', backgroundColor: '303a30' },
        UNMODIFIED_LINE_COLOR: { color: 'ffffff' },
        MISSING_LINE_COLOR: {},
    },
    light: {
        SYNTAX_HIGHLIGHTING_THEME: 'light-plus',

        COMMIT_HEADER_COLOR: { color: '333333', backgroundColor: 'eeeeee' },
        COMMIT_HEADER_LABEL_COLOR: {},
        COMMIT_SHA_COLOR: { color: '006600' },
        COMMIT_AUTHOR_COLOR: { color: '663333' },
        COMMIT_DATE_COLOR: {},
        COMMIT_MESSAGE_COLOR: { color: '666666', backgroundColor: 'eeeeee' },
        COMMIT_TITLE_COLOR: { color: '333333' },

        FILE_NAME_COLOR: { color: '336666', backgroundColor: 'eeeeee' },
        BORDER_COLOR: { color: 'cccccc', backgroundColor: 'eeeeee' },

        HUNK_HEADER_COLOR: { color: '666666', backgroundColor: 'e0e0e0' },

        DELETED_WORD_COLOR: { backgroundColor: 'eeaaaa' },
        INSERTED_WORD_COLOR: { backgroundColor: 'aaeeaa' },

        DELETED_LINE_NO_COLOR: {
            color: 'ff000022',
            backgroundColor: '00000011',
        },
        INSERTED_LINE_NO_COLOR: {
            color: '00ff0022',
            backgroundColor: '00000011',
        },
        UNMODIFIED_LINE_NO_COLOR: {
            color: 'ffffff88',
            backgroundColor: '00000008',
        },

        DELETED_LINE_COLOR: { color: '333333', backgroundColor: 'eecccc' },
        INSERTED_LINE_COLOR: { color: '333333', backgroundColor: 'cceecc' },
        UNMODIFIED_LINE_COLOR: { color: '666666', backgroundColor: 'eeeeee' },
        MISSING_LINE_COLOR: { backgroundColor: 'e8e8e8' },
    },
    'github-light': {
        SYNTAX_HIGHLIGHTING_THEME: 'github-light',

        COMMIT_HEADER_COLOR: { color: '24292e', backgroundColor: 'f1f8fe' },
        COMMIT_HEADER_LABEL_COLOR: { color: '586069' },
        COMMIT_AUTHOR_COLOR: { color: '444d56' },
        COMMIT_SHA_COLOR: { color: '444d56' },
        COMMIT_DATE_COLOR: { color: '444d56' },
        COMMIT_MESSAGE_COLOR: { color: '444d56', backgroundColor: 'f1f8fe' },
        COMMIT_TITLE_COLOR: { color: '05264c', modifiers: ['bold'] },

        BORDER_COLOR: { color: 'e1e4e8', backgroundColor: 'ffffff' },
        FILE_NAME_COLOR: { color: '05264c', backgroundColor: 'ffffff' },

        HUNK_HEADER_COLOR: { color: '4c5154', backgroundColor: 'f1f8ff' },

        DELETED_WORD_COLOR: { backgroundColor: 'fdb8c0' },
        INSERTED_WORD_COLOR: { backgroundColor: 'acf2bd' },

        DELETED_LINE_NO_COLOR: { color: 'c2a9ad', backgroundColor: 'ffdce0' },
        INSERTED_LINE_NO_COLOR: { color: 'a5cfb0', backgroundColor: 'cdffd8' },
        UNMODIFIED_LINE_NO_COLOR: {
            color: 'd1d5da',
            backgroundColor: 'ffffff',
        },

        DELETED_LINE_COLOR: { color: '24292e', backgroundColor: 'ffeef0' },
        INSERTED_LINE_COLOR: { color: '24292e', backgroundColor: 'e6ffed' },
        UNMODIFIED_LINE_COLOR: { color: '6a737d', backgroundColor: 'ffffff' },
        MISSING_LINE_COLOR: { backgroundColor: 'fafbfc' },
    },
    'github-dark-dim': {
        SYNTAX_HIGHLIGHTING_THEME: 'github-dark',

        COMMIT_HEADER_COLOR: { color: 'adbac7', backgroundColor: '22272e' },
        COMMIT_HEADER_LABEL_COLOR: { color: '768390' },
        COMMIT_SHA_COLOR: {},
        COMMIT_DATE_COLOR: {},
        COMMIT_AUTHOR_COLOR: {},
        COMMIT_MESSAGE_COLOR: { color: '909dab', backgroundColor: '22272e' },
        COMMIT_TITLE_COLOR: { color: 'c6e6ff', modifiers: ['bold'] },

        BORDER_COLOR: { color: '444c56', backgroundColor: '22272e' },
        FILE_NAME_COLOR: { color: 'adbac7', backgroundColor: '22272e' },

        HUNK_HEADER_COLOR: { color: '768390', backgroundColor: '263441' },

        DELETED_WORD_COLOR: { backgroundColor: 'c93c3733' },
        INSERTED_WORD_COLOR: { backgroundColor: '46954a33' },

        DELETED_LINE_NO_COLOR: {
            color: 'e5534b',
            backgroundColor: 'c93c371a',
        },
        INSERTED_LINE_NO_COLOR: {
            color: '57ab5a',
            backgroundColor: '46954a1a',
        },
        UNMODIFIED_LINE_NO_COLOR: { backgroundColor: '22282d' },

        DELETED_LINE_COLOR: { backgroundColor: '442d30' },
        INSERTED_LINE_COLOR: { backgroundColor: '2a3c33' },
        UNMODIFIED_LINE_COLOR: { color: '768390', backgroundColor: '22282d' },
        MISSING_LINE_COLOR: { backgroundColor: '2d333b' },
    },
    arctic: {
        SYNTAX_HIGHLIGHTING_THEME: 'nord',

        COMMIT_HEADER_COLOR: '4C566A',
        COMMIT_HEADER_LABEL_COLOR: '88C0D0',
        COMMIT_SHA_COLOR: 'BF616A',
        COMMIT_AUTHOR_COLOR: 'D08770',
        COMMIT_DATE_COLOR: 'EBCB8B',
        COMMIT_MESSAGE_COLOR: 'D8DEE9',
        COMMIT_TITLE_COLOR: 'ECEFF4',

        FILE_NAME_COLOR: 'EBCB8B',
        BORDER_COLOR: { color: 'EBCB8B' },

        HUNK_HEADER_COLOR: {
            color: '4C566A',
        },

        DELETED_WORD_COLOR: {
            color: 'EBCB8B',
            backgroundColor: 'BF616A33',
        },
        INSERTED_WORD_COLOR: {
            color: 'EBCB8B',
            backgroundColor: 'A3BE8C33',
        },

        DELETED_LINE_NO_COLOR: {
            color: 'BF616A',
        },
        INSERTED_LINE_NO_COLOR: {
            color: 'A3BE8C',
        },
        UNMODIFIED_LINE_NO_COLOR: {
            color: '4C566A',
        },

        DELETED_LINE_COLOR: {
            color: 'BF616A',
            backgroundColor: '3a3035',
        },
        INSERTED_LINE_COLOR: {
            color: 'A3BE8C',
            backgroundColor: '303a35',
        },
        UNMODIFIED_LINE_COLOR: {
            color: 'E5E9F0',
        },

        MISSING_LINE_COLOR: {
            backgroundColor: '2E3440',
        },
    },
};
