import chalk from 'chalk';
import * as process from 'process';
import terminalSize from 'term-size';
import { getContextForConfig } from './context';
import { getGitConfig } from './getGitConfig';
import { transformContentsStreaming } from './transformContentsStreaming';

async function main() {
    const config = await getGitConfig(terminalSize().columns, chalk);
    const context = await getContextForConfig(config);
    await transformContentsStreaming(context, process.stdin, process.stdout);
}

main();
