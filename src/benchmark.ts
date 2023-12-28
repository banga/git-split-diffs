import { wrapSpannedStringByWord } from './wrapSpannedStringByWord.js';

import Benchmark, { Event } from 'benchmark';
import { SpannedString } from './SpannedString';
const suite = new Benchmark.Suite();

const string = SpannedString.create().appendString(
    'Once upon a midnight dreary'
);

suite
    .add('wrapLineByWord', function () {
        wrapSpannedStringByWord(string, 3);
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
