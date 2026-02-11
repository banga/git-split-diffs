import chalk from 'chalk';
import { exec } from 'child_process';
import * as process from 'process';
import terminalSize from 'terminal-size';
import * as util from 'util';
import { getContextForConfig } from './context';
import { getGitConfig } from './getGitConfig';
import { transformContentsStreaming } from './transformContentsStreaming';
import { getConfig } from './getConfig';
import { TuiApp } from './tui/TuiApp';
const execAsync = util.promisify(exec);

const TREE_WIDTH = 30;
const BORDER_WIDTH = 1;

async function main() {
    const { stdout: gitConfigString } = await execAsync('git config -l');
    const gitConfig = getGitConfig(gitConfigString);
    const config = getConfig(gitConfig);

    const isInteractive =
        process.argv.includes('--interactive') ||
        process.argv.includes('-i') ||
        config.INTERACTIVE;

    const termCols = terminalSize().columns;
    const screenWidth = isInteractive
        ? termCols - TREE_WIDTH - BORDER_WIDTH
        : termCols;

    const context = await getContextForConfig(config, chalk, screenWidth);

    if (isInteractive) {
        const app = new TuiApp();
        await app.run(context, process.stdin);
    } else {
        await transformContentsStreaming(
            context,
            process.stdin,
            process.stdout
        );

        // Ensure stdout is fully flushed before exiting
        // This is critical when piping to `less` - if we exit before stdout is drained,
        // less may not receive all data or may receive it in a broken state
        if (process.stdout.writableNeedDrain) {
            await new Promise<void>((resolve) => {
                process.stdout.once('drain', resolve);
            });
        }
    }
}

main().catch((err) => {
    // Don't print errors if stdout pipe was closed (EPIPE)
    // This happens when less quits before we finish processing
    if (err.code !== 'EPIPE') {
        console.error(err);
        process.exit(1);
    }
});
