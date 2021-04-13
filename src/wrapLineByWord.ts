const WORD_REGEX = /(\s*)(\S+)/g;
const TRAILING_SPACE_REGEX = /\s+$/g;

export function wrapLineByWord(text: string, width: number): string[] {
    // Short circuit if no wrapping is required
    if (text.length <= width) {
        return [text];
    }

    const lines: string[] = [];
    let budget = width;
    let currentLineParts: string[] = [];

    function flushLine() {
        if (currentLineParts.length) {
            lines.push(currentLineParts.join(''));
            currentLineParts = [];
            budget = width;
        }
    }

    function pushWord(word: string) {
        // word can fit on current line
        if (word.length <= budget) {
            currentLineParts.push(word);
            budget -= word.length;
            return;
        }

        // word can fit in the new line, so start a new one
        if (word.length <= width) {
            flushLine();
            currentLineParts.push(word);
            budget -= word.length;
            return;
        }

        // word is too long to fit in any line, so lets break it and push each
        // part
        let wordPartStart = 0;
        while (wordPartStart < word.length) {
            if (budget === 0) {
                flushLine();
            }
            const wordPart = word.slice(wordPartStart, wordPartStart + budget);
            wordPartStart += budget;
            pushWord(wordPart);
        }
    }

    let match: RegExpMatchArray | null = null;

    // Match by word (non-space characters followed by space) and add one word
    // at a time
    while ((match = WORD_REGEX.exec(text))) {
        const [, leadingSpaces, word] = match;
        if (leadingSpaces !== undefined) {
            for (const leadingSpace of leadingSpaces) {
                pushWord(leadingSpace);
            }
        }
        pushWord(word);
    }
    if ((match = TRAILING_SPACE_REGEX.exec(text))) {
        const [trailingSpaces] = match;
        for (const trailingSpace of trailingSpaces) {
            pushWord(trailingSpace);
        }
    }

    flushLine();

    return lines;
}
