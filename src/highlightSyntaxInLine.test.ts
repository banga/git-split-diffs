import * as shikiji from 'shikiji';
import { T } from './formattedString';
import { highlightSyntaxInLine } from './highlightSyntaxInLine';

test('highlighting should load languages on-demand', async () => {
    const string = 'int main {}';
    const referenceString = T().appendString(string);

    const highlighter = await shikiji.getHighlighter({
        themes: ['dark-plus'],
        langs: [],
    });
    expect(highlighter.getLoadedLanguages()).toEqual([]);

    await highlightSyntaxInLine(referenceString, 'test.c', highlighter);
    expect(highlighter.getLoadedLanguages()).toEqual(['c']);
});
