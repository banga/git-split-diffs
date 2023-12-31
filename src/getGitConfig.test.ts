import { DEFAULT_THEME_NAME } from './getConfig';
import {
    DEFAULT_MIN_LINE_WIDTH,
    GitConfig,
    getGitConfig,
} from './getGitConfig';

const DEFAULT_CONFIG: GitConfig = {
    WRAP_LINES: true,
    HIGHLIGHT_LINE_CHANGES: true,
    MIN_LINE_WIDTH: DEFAULT_MIN_LINE_WIDTH,
    THEME_NAME: DEFAULT_THEME_NAME,
};

describe('getGitConfig', () => {
    test('empty', () => {
        expect(getGitConfig('')).toEqual(DEFAULT_CONFIG);
    });

    test('full', () => {
        expect(
            getGitConfig(`
split-diffs.wrap-lines=false
split-diffs.highlight-line-changes=false
split-diffs.min-line-width=40
split-diffs.theme-name=arctic
split-diffs.syntax-highlighting-theme=dark-plus
            `)
        ).toEqual({
            WRAP_LINES: false,
            HIGHLIGHT_LINE_CHANGES: false,
            MIN_LINE_WIDTH: 40,
            THEME_NAME: 'arctic',
            SYNTAX_HIGHLIGHTING_THEME: 'dark-plus',
        });
    });

    test('partial', () => {
        expect(
            getGitConfig(`
split-diffs.wrap-lines=true
split-diffs.syntax-highlighting-theme=nord
            `)
        ).toEqual({
            ...DEFAULT_CONFIG,
            WRAP_LINES: true,
            SYNTAX_HIGHLIGHTING_THEME: 'nord',
        });
    });

    test('invalid values', () => {
        expect(
            getGitConfig(`
split-diffs.wrap-lines=1
split-diffs.highlight-line-changes=1
split-diffs.min-line-width=bar
split-diffs.syntax-highlighting-theme=foo
split-diffs.theme-name=baz
            `)
        ).toEqual({
            ...DEFAULT_CONFIG,
            SYNTAX_HIGHLIGHTING_THEME: 'foo',
            THEME_NAME: 'baz',
        });
    });
});
