/** @type {import('jest').Config} */
const jestConfig = {
    preset: 'ts-jest/presets/default-esm',
    roots: ['<rootDir>/src'],
    testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
};

export default jestConfig;
