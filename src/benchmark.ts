import { wrapLineByWord } from './wrapLineByWord';

import Benchmark, { Event } from 'benchmark';
const suite = new Benchmark.Suite();

// add tests
suite
    .add('wrapLineByWord', function () {
        wrapLineByWord('Once upon a midnight dreary', 3);
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
