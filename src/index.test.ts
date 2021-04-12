import chalk from 'chalk';
import { Readable } from 'stream';
import { iterlinesFromReadableAsync } from './iterLinesFromReadable';
import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors';
import { iterSideBySideDiff } from './iterSideBySideDiffs';
import { iterWithNewlines } from './iterWithNewlines';
import { defaultTheme } from './theme';
import { transformStreamWithIterables } from './transformStreamWithIterables';

const testTheme = defaultTheme(new chalk.Instance({ level: 0 }), 120);
const iterSideBySideDiffWithoutColors = iterSideBySideDiff(testTheme);

async function transform(input: string): Promise<string> {
    let string = '';
    const transformedStream = transformStreamWithIterables(
        Readable.from(input),
        iterlinesFromReadableAsync,
        iterLinesWithoutAnsiColors,
        iterSideBySideDiffWithoutColors,
        iterWithNewlines
    );
    for await (const chunk of transformedStream) {
        string += chunk.toString();
    }
    return string;
}

test('empty', async function () {
    expect(await transform(``)).toMatchInlineSnapshot(`
        "
        "
    `);
});

test('with ANSI color codes', async function () {
    expect(
        await transform(`
[1;32mcommit f735de7025c6d626c5ae1a291fe24f143dea0313[m
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 11 15:25:34 2021 -0700

    Add theme support

[1;33mdiff --git a/todo.md b/todo.md[m
[1;33mindex 9f14e96..eaf3730 100644[m
[1;33m--- a/todo.md[m
[1;33m+++ b/todo.md[m
[1;32m@@ -7,6 +7,7 @@[m
 -   [x] Handle file addition/deletion properly[m
 -   [x] Fix incorrect line positions when a hunk has discontinuous inserts and/or deletes[m
 -   [x] Organize code[m
[1;32m+[m[1;32m-   [x] Move visual config to theme[m
 -   [ ] Handle empty diffs[m
 -   [ ] Handle moves and renames without diffs[m
 -   [ ] Highlight changes in lines[m

`)
    ).toMatchInlineSnapshot(`
        "
        commit f735de7025c6d626c5ae1a291fe24f143dea0313
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sun Apr 11 15:25:34 2021 -0700

            Add theme support

        ─────────────────────────────────────────────────────── todo.md ────────────────────────────────────────────────────────
        @@ -7,6 +7,7 @@                                                                                                         
            7       -   [x] Handle file addition/deletion properly      7       -   [x] Handle file addition/deletion properly  
            8       -   [x] Fix incorrect line positions when a hunk    8       -   [x] Fix incorrect line positions when a hunk
                     has discontinuous inserts and/or deletes                    has discontinuous inserts and/or deletes       
            9       -   [x] Organize code                               9       -   [x] Organize code                           
                                                                       10     + -   [x] Move visual config to theme             
           10       -   [ ] Handle empty diffs                         11       -   [ ] Handle empty diffs                      
           11       -   [ ] Handle moves and renames without diffs     12       -   [ ] Handle moves and renames without diffs  
           12       -   [ ] Highlight changes in lines                 13       -   [ ] Highlight changes in lines              
           13                                                          14                                                       
           14                                                          15                                                       
        "
    `);
});

test('commits without diffs', async function () {
    expect(
        await transform(`
commit e5f896655402f8cf2d947c528d45e1d56bbf5717 (HEAD -> main)
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 11 16:23:54 2021 -0700

    Small refactor to allow testing end-to-end

commit b637f38029f4a89c6a3b73b2b84a6a5b9e260730
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 11 11:53:02 2021 -0700

    Organize code

commit f323143e03af95fee5d38c21238a92ffd4461847
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 11 10:39:17 2021 -0700

    more todos
`)
    ).toMatchInlineSnapshot(`
        "
        commit e5f896655402f8cf2d947c528d45e1d56bbf5717 (HEAD -> main)
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sun Apr 11 16:23:54 2021 -0700

            Small refactor to allow testing end-to-end

        commit b637f38029f4a89c6a3b73b2b84a6a5b9e260730
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sun Apr 11 11:53:02 2021 -0700

            Organize code

        commit f323143e03af95fee5d38c21238a92ffd4461847
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sun Apr 11 10:39:17 2021 -0700

            more todos

        "
    `);
});

test('commit with addition', async function () {
    expect(
        await transform(`
commit f735de7025c6d626c5ae1a291fe24f143dea0313
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 11 15:25:34 2021 -0700

    Add theme support

diff --git a/todo.md b/todo.md
index 9f14e96..eaf3730 100644
--- a/todo.md
+++ b/todo.md
@@ -9,2 +9,3 @@
 -   [x] Organize code
+-   [x] Move visual config to theme
 -   [ ] Handle empty diffs
`)
    ).toMatchInlineSnapshot(`
        "
        commit f735de7025c6d626c5ae1a291fe24f143dea0313
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sun Apr 11 15:25:34 2021 -0700

            Add theme support

        ─────────────────────────────────────────────────────── todo.md ────────────────────────────────────────────────────────
        @@ -9,2 +9,3 @@                                                                                                         
            9       -   [x] Organize code                               9       -   [x] Organize code                           
                                                                       10     + -   [x] Move visual config to theme             
           10       -   [ ] Handle empty diffs                         11       -   [ ] Handle empty diffs                      
           11                                                          12                                                       
        "
    `);
});

test('commit with deletion', async function () {
    expect(`commit eccfb5a2b3d76ba53df315f977da74b18d50113e
Author: Shrey Banga <shrey@quip.com>
Date:   Thu Aug 22 10:07:25 2019 -0700

    Remove deprecated option

diff --git a/Code/User/settings.json b/Code/User/settings.json
index a33d267..ae58a01 100644
--- a/Code/User/settings.json
+++ b/Code/User/settings.json
@@ -26,5 +26,4 @@
   // search
   "search.location": "panel",
-  "search.usePCRE2": true,

   // telemetry
`).toMatchInlineSnapshot(`
        "commit eccfb5a2b3d76ba53df315f977da74b18d50113e
        Author: Shrey Banga <shrey@quip.com>
        Date:   Thu Aug 22 10:07:25 2019 -0700

            Remove deprecated option

        diff --git a/Code/User/settings.json b/Code/User/settings.json
        index a33d267..ae58a01 100644
        --- a/Code/User/settings.json
        +++ b/Code/User/settings.json
        @@ -26,5 +26,4 @@
           // search
           \\"search.location\\": \\"panel\\",
        -  \\"search.usePCRE2\\": true,

           // telemetry
        "
    `);
});

test('commits with diffs', async function () {
    expect(
        await transform(`
commit 26ca49fb83758bace20a473e231d576aa1bbe115
Author: Shrey Banga <shrey@quip.com>
Date:   Tue May 23 16:47:17 2017 -0700

    sonos to brew

diff --git a/Brewfile b/Brewfile
index 5a38bdb..ef4ff52 100644
--- a/Brewfile
+++ b/Brewfile
@@ -19,2 +19,3 @@ brew 'python3'
 brew 'socat'
+brew 'sonos'
 brew 'terminal-notifier'
@@ -42,3 +43,2 @@ cask 'rescuetime'
 cask 'slate'
-cask 'sonos'
 cask 'spotify'

commit 0efea05a16425b355210c2f1e0d11ed692350d49
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Tue May 16 21:21:36 2017 -0700

    java

diff --git a/Brewfile b/Brewfile
index 371b5f0..5a38bdb 100644
--- a/Brewfile
+++ b/Brewfile
@@ -37,2 +37,3 @@ cask 'google-chrome'
 cask 'iterm2'
+cask 'java'
 cask 'ngrok'

commit 0de4eb9a05b52362d8ff02aba14e389cc76a6f91
Author: Shrey Banga <shrey@quip.com>
Date:   Tue May 16 00:45:40 2017 -0700

    tldr

diff --git a/Brewfile b/Brewfile
index 26b77f3..371b5f0 100644
--- a/Brewfile
+++ b/Brewfile
@@ -20,2 +20,3 @@ brew 'socat'
 brew 'terminal-notifier'
+brew 'tldr'
 brew 'tree'
    `)
    ).toMatchInlineSnapshot(`
        "
        commit 26ca49fb83758bace20a473e231d576aa1bbe115
        Author: Shrey Banga <shrey@quip.com>
        Date:   Tue May 23 16:47:17 2017 -0700

            sonos to brew

        ─────────────────────────────────────────────────────── Brewfile ───────────────────────────────────────────────────────
        @@ -19,2 +19,3 @@ brew 'python3'                                                                                        
           19       brew 'socat'                                       19       brew 'socat'                                    
                                                                       20     + brew 'sonos'                                    
           20       brew 'terminal-notifier'                           21       brew 'terminal-notifier'                        
        @@ -42,3 +43,2 @@ cask 'rescuetime'                                                                                     
           42       cask 'slate'                                       43       cask 'slate'                                    
           43     - cask 'sonos'                                                                                                
           44       cask 'spotify'                                     44       cask 'spotify'                                  
           45                                                          45                                                       
        commit 0efea05a16425b355210c2f1e0d11ed692350d49
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Tue May 16 21:21:36 2017 -0700

            java

        ─────────────────────────────────────────────────────── Brewfile ───────────────────────────────────────────────────────
        @@ -37,2 +37,3 @@ cask 'google-chrome'                                                                                  
           37       cask 'iterm2'                                      37       cask 'iterm2'                                   
                                                                       38     + cask 'java'                                     
           38       cask 'ngrok'                                       39       cask 'ngrok'                                    
           39                                                          40                                                       
        commit 0de4eb9a05b52362d8ff02aba14e389cc76a6f91
        Author: Shrey Banga <shrey@quip.com>
        Date:   Tue May 16 00:45:40 2017 -0700

            tldr

        ─────────────────────────────────────────────────────── Brewfile ───────────────────────────────────────────────────────
        @@ -20,2 +20,3 @@ brew 'socat'                                                                                          
           20       brew 'terminal-notifier'                           20       brew 'terminal-notifier'                        
                                                                       21     + brew 'tldr'                                     
           21       brew 'tree'                                        22       brew 'tree'                                     
           22                                                          23                                                       
        "
    `);
});

test('commit with a new file', async function () {
    expect(
        await transform(`
commit e4951eee3b9a8fa471d01dd64075c5fd44879a26
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sat Apr 10 14:35:42 2021 -0700

    wip

diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..6499edf
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,2 @@
+node_modules/**
+build/**
\ No newline at end of file`)
    ).toMatchInlineSnapshot(`
        "
        commit e4951eee3b9a8fa471d01dd64075c5fd44879a26
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sat Apr 10 14:35:42 2021 -0700

            wip

        ────────────────────────────────────────────────────── .gitignore ──────────────────────────────────────────────────────
        @@ -0,0 +1,2 @@                                                                                                         
                                                                        1     + node_modules/**                                 
                                                                        2     + build/**                                        
                                                                        3       No newline at end of file                       
        "
    `);
});

test('multiple inserts and deletes in the same hunk', async function () {
    expect(
        await transform(`
commit e5f896655402f8cf2d947c528d45e1d56bbf5717
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 11 16:23:54 2021 -0700

    Small refactor to allow testing end-to-end

diff --git a/src/index.ts b/src/index.ts
index 149981d..fb507a4 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,5 +1,6 @@
 import chalk from 'chalk';
 import * as process from 'process';
+import stream from 'stream';
 import terminalSize from 'term-size';
 import { iterlinesFromReadableAsync } from './iterLinesFromReadable';
 import { iterLinesWithoutAnsiColors } from './iterLinesWithoutAnsiColors';
@@ -12,15 +13,16 @@ function main() {
     const screenWidth = terminalSize().columns;
     const theme = defaultTheme(chalk, screenWidth);

-    transformStreamWithIterables(
-        process.stdin,
-        [
+    stream.pipeline(
+        transformStreamWithIterables(
+            process.stdin,
             iterlinesFromReadableAsync,
             iterLinesWithoutAnsiColors,
             iterSideBySideDiff(theme),
-            iterWithNewlines,
-        ],
-        process.stdout
+            iterWithNewlines
+        ),
+        process.stdout,
+        console.error
     );
 }
        `)
    ).toMatchInlineSnapshot(`
        "
        commit e5f896655402f8cf2d947c528d45e1d56bbf5717
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sun Apr 11 16:23:54 2021 -0700

            Small refactor to allow testing end-to-end

        ───────────────────────────────────────────────────── src/index.ts ─────────────────────────────────────────────────────
        @@ -1,5 +1,6 @@                                                                                                         
            1       import chalk from 'chalk';                          1       import chalk from 'chalk';                      
            2       import * as process from 'process';                 2       import * as process from 'process';             
                                                                        3     + import stream from 'stream';                    
            3       import terminalSize from 'term-size';               4       import terminalSize from 'term-size';           
            4       import { iterlinesFromReadableAsync } from          5       import { iterlinesFromReadableAsync } from      
                    './iterLinesFromReadable';                                  './iterLinesFromReadable';                      
            5       import { iterLinesWithoutAnsiColors } from          6       import { iterLinesWithoutAnsiColors } from      
                    './iterLinesWithoutAnsiColors';                             './iterLinesWithoutAnsiColors';                 
        @@ -12,15 +13,16 @@ function main() {                                                                                   
           12           const screenWidth = terminalSize().columns;    13           const screenWidth = terminalSize().columns; 
           13           const theme = defaultTheme(chalk,              14           const theme = defaultTheme(chalk,           
                    screenWidth);                                               screenWidth);                                   
           14                                                          15                                                       
           15     -     transformStreamWithIterables(                  16     +     stream.pipeline(                            
           16     -         process.stdin,                             17     +         transformStreamWithIterables(           
           17     -         [                                          18     +             process.stdin,                      
           18                   iterlinesFromReadableAsync,            19                   iterlinesFromReadableAsync,         
           19                   iterLinesWithoutAnsiColors,            20                   iterLinesWithoutAnsiColors,         
           20                   iterSideBySideDiff(theme),             21                   iterSideBySideDiff(theme),          
           21     -             iterWithNewlines,                      22     +             iterWithNewlines                    
           22     -         ],                                         23     +         ),                                      
           23     -         process.stdout                             24     +         process.stdout,                         
                                                                       25     +         console.error                           
           24           );                                             26           );                                          
           25       }                                                  27       }                                               
           26                                                          28                                                       
        "
    `);
});

test('commit with a file move', async function () {
    expect(
        await transform(`
commit 1c76ed4bb05429741fd4a48896bb84b11bc661f5
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sat Apr 10 22:26:15 2021 -0700

    Move sample diff files

diff --git a/colors.diff b/test-data/colors.diff
similarity index 100%
rename from colors.diff
rename to test-data/colors.diff
    `)
    ).toMatchInlineSnapshot(`
        "
        commit 1c76ed4bb05429741fd4a48896bb84b11bc661f5
        Author: Shrey Banga <banga.shrey@gmail.com>
        Date:   Sat Apr 10 22:26:15 2021 -0700

            Move sample diff files

        ───────────────────────────────────────── colors.diff -> test-data/colors.diff ─────────────────────────────────────────
        "
    `);
});
