import shiki from 'shiki';
import { T } from './formattedString';
import { highlightSyntaxInLine } from './highlightSyntaxInLine';

// TODO: load languages on-demand
test.skip('highlighting should load languages on-demand', async () => {
    const string = 'one `two` three';
    const referenceString = T().appendString(string);
    const testString = T().appendString(string);

    {
        const referenceHighlighter = await shiki.getHighlighter({
            theme: 'nord',
        });
        highlightSyntaxInLine(referenceString, 'test.md', referenceHighlighter);
    }

    {
        const highlighter2 = await shiki.getHighlighter({
            theme: 'nord',
            langs: [],
        });
        highlightSyntaxInLine(testString, 'test.md', highlighter2);
    }

    expect([...testString.iterSubstrings()]).toEqual([
        ...referenceString.iterSubstrings(),
    ]);
});
