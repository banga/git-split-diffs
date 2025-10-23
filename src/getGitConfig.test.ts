import {
    DEFAULT_MIN_LINE_WIDTH,
    DEFAULT_THEME_DIRECTORY,
    DEFAULT_THEME_NAME,
    GitConfig,
    getGitConfig,
} from './getGitConfig';

const DEFAULT_CONFIG: GitConfig = {
    WRAP_LINES: true,
    HIGHLIGHT_LINE_CHANGES: true,
    MIN_LINE_WIDTH: DEFAULT_MIN_LINE_WIDTH,
    THEME_NAME: DEFAULT_THEME_NAME,
    THEME_DIRECTORY: DEFAULT_THEME_DIRECTORY,
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
split-diffs.theme-directory=/tmp
split-diffs.syntax-highlighting-theme=dark-plus
            `)
        ).toEqual({
            WRAP_LINES: false,
            HIGHLIGHT_LINE_CHANGES: false,
            MIN_LINE_WIDTH: 40,
            THEME_NAME: 'arctic',
            THEME_DIRECTORY: '/tmp',
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

    describe('theme-directory path expansion', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            // Set up test environment variables
            process.env = {
                ...originalEnv,
                TEST_HOME: '/home/testuser',
                TEST_USER: 'testuser',
                TEST_CUSTOM: 'custom_value',
            };
        });

        afterEach(() => {
            // Restore original environment
            process.env = originalEnv;
        });

        test('expands $TEST_HOME environment variable', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=$TEST_HOME/my/themes/split-diff
            `);
            expect(result.THEME_DIRECTORY).toBe('/home/testuser/my/themes/split-diff');
        });

        test('expands ${TEST_HOME} environment variable with braces', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=\${TEST_HOME}/my/themes/split-diff
            `);
            expect(result.THEME_DIRECTORY).toBe('/home/testuser/my/themes/split-diff');
        });

        test('expands $TEST_USER environment variable in path', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=/Users/$TEST_USER/my/themes/split-diff
            `);
            expect(result.THEME_DIRECTORY).toBe('/Users/testuser/my/themes/split-diff');
        });

        test('expands ${TEST_USER} environment variable with braces', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=/Users/\${TEST_USER}/my/themes/split-diff
            `);
            expect(result.THEME_DIRECTORY).toBe('/Users/testuser/my/themes/split-diff');
        });

        test('expands multiple environment variables', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=$TEST_HOME/\${TEST_USER}/themes/\${TEST_CUSTOM}
            `);
            expect(result.THEME_DIRECTORY).toBe('/home/testuser/testuser/themes/custom_value');
        });

        test('handles missing environment variables as empty string', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=$TEST_HOME/\${NONEXISTENT}/themes
            `);
            expect(result.THEME_DIRECTORY).toBe('/home/testuser/themes');
        });

        test('returns absolute path for relative input', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=./relative/path
            `);
            expect(result.THEME_DIRECTORY).toContain('/relative/path');
            expect(result.THEME_DIRECTORY.startsWith('./')).toBe(false);
        });

        test('leaves absolute paths unchanged (except expansion)', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=/absolute/path
            `);
            expect(result.THEME_DIRECTORY).toBe('/absolute/path');
        });

        test('does not expand when theme-directory is not set', () => {
            const result = getGitConfig(`
split-diffs.theme-name=arctic
            `);
            expect(result.THEME_DIRECTORY).toBe(DEFAULT_THEME_DIRECTORY);
        });

        test('expands ~ to actual home directory', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=~
            `);
            // Should expand to the actual home directory 
            expect(result.THEME_DIRECTORY).not.toBe('~');
            expect(result.THEME_DIRECTORY).toBeTruthy();
        });

        test('expands ~/ to actual home directory with path', () => {
            const result = getGitConfig(`
split-diffs.theme-directory=~/my/themes/split-diff
            `);
            // Should expand to the actual home directory + path
            expect(result.THEME_DIRECTORY).not.toContain('~');
            expect(result.THEME_DIRECTORY).toContain('/my/themes/split-diff');
        });
    });
});
