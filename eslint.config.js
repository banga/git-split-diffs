import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
    { files: ['src/**/*.ts'], ignores: ['build/**/*'] },
    { languageOptions: { globals: globals.node } },
    { rules: { 'require-await': 'error' } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
];

export default config;
