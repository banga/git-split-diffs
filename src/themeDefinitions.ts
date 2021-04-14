import { ThemeDefinition } from './themes';

const THEME_DEFINITIONS: { [key in string]: ThemeDefinition } = {
    default: {
        DEFAULT_COLOR: 'white',
        COMMIT_SHA_COLOR: 'green',
        COMMIT_AUTHOR_COLOR: 'blue',
        COMMIT_DATE_COLOR: 'white',
        FILE_NAME_COLOR: 'yellow',
        HUNK_HEADER_COLOR: {
            color: 'white',
            modifiers: ['dim'],
        },
        DELETED_LINE_COLOR: 'red',
        INSERTED_LINE_COLOR: 'green',
        UNMODIFIED_LINE_COLOR: 'white',
        MISSING_LINE_COLOR: 'white',
        DELETED_LINE_NO_COLOR: { color: 'red', modifiers: ['dim'] },
        INSERTED_LINE_NO_COLOR: { color: 'green', modifiers: ['dim'] },
        UNMODIFIED_LINE_NO_COLOR: { color: 'white', modifiers: ['dim'] },
    },
    'color-test': {
        DEFAULT_COLOR: {
            modifiers: ['inverse', 'bold'],
        },
    },
    'github-dark-dimmed': {
        DEFAULT_COLOR: {
            color: 'white',
            backgroundColor: '22282d',
        },
        COMMIT_AUTHOR_COLOR: {
            modifiers: ['bold'],
        },
        HUNK_HEADER_COLOR: {
            color: '768390',
            backgroundColor: '233040',
        },
        DELETED_LINE_COLOR: {
            color: 'e5534b',
            backgroundColor: '442d30',
        },
        INSERTED_LINE_COLOR: {
            color: '57ab5a',
            backgroundColor: '253230',
        },
        UNMODIFIED_LINE_COLOR: {
            color: 'adbac7',
            backgroundColor: '22282d',
        },
        MISSING_LINE_COLOR: {
            backgroundColor: '2d333b',
        },
        DELETED_LINE_NO_COLOR: {
            color: 'e5534b',
            backgroundColor: '442d30',
        },
        INSERTED_LINE_NO_COLOR: {
            color: '57ab5a',
            backgroundColor: '253230',
        },
        UNMODIFIED_LINE_NO_COLOR: {
            color: 'adbac7',
            backgroundColor: '22282d',
        },
    },
};

export default THEME_DEFINITIONS;
