import { execSync } from 'child_process';

export type StagingStatus = 'staged' | 'partial' | 'unstaged';

/**
 * Run `git status --porcelain` and return a map of file path → staging status.
 * Returns empty map if not in a git repo or git is unavailable.
 */
export function getGitStagingStatus(): Map<string, StagingStatus> {
    const result = new Map<string, StagingStatus>();

    try {
        const output = execSync('git status --porcelain', {
            encoding: 'utf-8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        for (const line of output.split('\n')) {
            if (line.length < 4) continue;

            const x = line[0]; // index (staging area)
            const y = line[1]; // working tree

            let filePath = line.slice(3);

            // Handle renames: "R  old -> new"
            const arrowIdx = filePath.indexOf(' -> ');
            if (arrowIdx !== -1) {
                filePath = filePath.slice(arrowIdx + 4);
            }

            const xChanged = x !== ' ' && x !== '?';
            const yChanged = y !== ' ' && y !== '?';

            if (xChanged && !yChanged) {
                result.set(filePath, 'staged');
            } else if (xChanged && yChanged) {
                result.set(filePath, 'partial');
            } else if (!xChanged && yChanged) {
                result.set(filePath, 'unstaged');
            }
        }
    } catch {
        // Not in a git repo or git not available — return empty
    }

    return result;
}
