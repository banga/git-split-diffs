import * as shiki from 'shiki';
import { T } from './formattedString';
import { highlightSyntaxInLine } from './highlightSyntaxInLine';

test('highlighting should load languages on-demand', async () => {
    const string = 'int main {}';
    const referenceString = T().appendString(string);

    const highlighter = await shiki.createHighlighter({
        themes: ['dark-plus'],
        langs: [],
    });
    expect(highlighter.getLoadedLanguages()).toEqual([]);

    await highlightSyntaxInLine(referenceString, 'test.c', highlighter);
    expect(highlighter.getLoadedLanguages()).toEqual(['c']);
});
