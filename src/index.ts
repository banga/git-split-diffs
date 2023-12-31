import chalk from 'chalk';
import { exec } from 'child_process';
import * as process from 'process';
import terminalSize from 'terminal-size';
import * as util from 'util';
import { getContextForConfig } from './context';
import { getGitConfig } from './getGitConfig';
import { transformContentsStreaming } from './transformContentsStreaming';
import { getConfig } from './getConfig';
const execAsync = util.promisify(exec);

async function main() {
    const { stdout: gitConfigString } = await execAsync('git config -l');
    const gitConfig = getGitConfig(gitConfigString);
    const config = getConfig(gitConfig);
    const context = await getContextForConfig(
        config,
        chalk,
        terminalSize().columns
    );
    await transformContentsStreaming(context, process.stdin, process.stdout);
}

main();
