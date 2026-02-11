import * as path from 'path';

const ICON_MAP: Record<string, string> = {
    '.ts': '\ue628',
    '.tsx': '\ue7ba',
    '.js': '\ue74e',
    '.jsx': '\ue7ba',
    '.json': '\ue60b',
    '.md': '\ue73e',
    '.swift': '\ue755',
    '.py': '\ue73c',
    '.rb': '\ue791',
    '.rs': '\ue7a8',
    '.go': '\ue627',
    '.java': '\ue738',
    '.css': '\ue749',
    '.scss': '\ue749',
    '.less': '\ue749',
    '.html': '\ue736',
    '.yml': '\ue6a8',
    '.yaml': '\ue6a8',
    '.sh': '\ue795',
    '.bash': '\ue795',
    '.zsh': '\ue795',
    '.graphql': '\ue662',
    '.gql': '\ue662',
    '.vue': '\ue6a0',
    '.svelte': '\ue697',
    '.c': '\ue61e',
    '.cpp': '\ue61d',
    '.h': '\ue61e',
    '.hpp': '\ue61d',
    '.cs': '\uf81a',
    '.php': '\ue73d',
    '.lua': '\ue620',
    '.toml': '\ue6b2',
    '.lock': '\uf023',
    '.sql': '\ue706',
    '.dockerfile': '\ue7b0',
    '.docker': '\ue7b0',
    '.xml': '\ue619',
    '.svg': '\ue698',
    '.png': '\uf1c5',
    '.jpg': '\uf1c5',
    '.gif': '\uf1c5',
    '.ico': '\uf1c5',
    '.txt': '\uf15c',
    '.env': '\uf462',
    '.gitignore': '\ue702',
};

const DEFAULT_FILE_ICON = '\uf15b';
export const FOLDER_CLOSED = '\uf07b';
export const FOLDER_OPEN = '\uf07c';

export function getFileIcon(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext && ICON_MAP[ext]) {
        return ICON_MAP[ext];
    }
    const base = path.basename(filePath).toLowerCase();
    if (base === 'dockerfile' || base.startsWith('dockerfile.')) {
        return ICON_MAP['.dockerfile'];
    }
    if (base === '.gitignore') {
        return ICON_MAP['.gitignore'];
    }
    return DEFAULT_FILE_ICON;
}
