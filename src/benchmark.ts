import { wrapSpannedStringByWord } from './wrapSpannedStringByWord';
import Benchmark, { Event } from 'benchmark';
import { SpannedString } from './SpannedString';
import { T } from './formattedString';
import { highlightSyntaxInLine } from './highlightSyntaxInLine';
import * as shiki from 'shiki';

{
    const string = SpannedString.create().appendString(
        'Once upon a midnight dreary'
    );
    new Benchmark.Suite('wrapLineByWord')
        .on('start cycle complete', function (event: Event) {
            console.log(event.type, String(event.target));
        })
        .add('wrapLineByWord', function () {
            wrapSpannedStringByWord(string, 3);
        })
        .run({ async: true });
}

{
    const highlighter = await shiki.createHighlighter({
        themes: ['dark-plus'],
        langs: ['typescript'],
    });

    new Benchmark.Suite('highlightSyntaxInline')
        .on('start cycle complete error abort', function (event: Event) {
            console.log(event.type, String(event.target));
        })
        .add('highlightSyntaxInline', async function () {
            const formattedString = T().appendString(
                `const { stdout: gitConfigString } = await execAsync('git config -l');`
            );
            await highlightSyntaxInLine(
                formattedString,
                'index.ts',
                highlighter,
                'dark-plus'
            );
        })
        .run({ async: true });
}
