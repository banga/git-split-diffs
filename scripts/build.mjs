import * as esbuild from 'esbuild';
import fs from 'fs';

/** @type {esbuild.BuildOptions} */
const commonOptions = {
    outdir: './build',
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    external: [
        'benchmark',
        ...Object.keys(
            JSON.parse(fs.readFileSync('package.json', 'utf-8')).dependencies
        ),
    ],
    banner: { js: '#!/usr/bin/env node' },
    outExtension: { '.js': '.mjs' },
    sourcemap: false,
    logLevel: 'info',
};

/** @type {esbuild.BuildOptions} */
const devOptions = {
    ...commonOptions,
    entryPoints: ['src/index.ts', 'src/benchmark.ts', 'src/previewTheme.ts'],
};

/** @type {esbuild.BuildOptions} */
const prodOptions = {
    ...commonOptions,
    entryPoints: ['src/index.ts'],
    minify: true,
};

async function main(args) {
    let isProd = false;
    let shouldWatch = false;

    for (const arg of args) {
        switch (arg) {
            case '--prod':
                isProd = true;
                break;
            case '--watch':
                shouldWatch = true;
                break;
            default:
                throw new Error(`Unknown arg: ${arg}`);
        }
    }

    /** @type {esbuild.BuildOptions} */
    const buildOptions = {
        ...(isProd ? prodOptions : devOptions),
    };

    console.log('Building with options:', buildOptions);

    if (shouldWatch) {
        const context = await esbuild.context(buildOptions);
        await context.watch();
        console.log('Watching...');
    } else {
        await esbuild.build(buildOptions);
    }
}

main(process.argv.slice(2));
