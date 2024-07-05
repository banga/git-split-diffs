import { Readable, Writable } from 'stream';
import { Config } from './getConfig';
import { getContextForConfig } from './context';
import { Theme, ThemeColorName } from './themes';
import { transformContentsStreaming } from './transformContentsStreaming';
import { ChalkInstance } from 'chalk';

const TEST_THEME = Object.fromEntries(
    Object.keys(ThemeColorName).map((name) => [name, {}])
) as Theme;

const replaceColoredText =
    (r: number, g: number, b: number) => (text: string) =>
        text.replace(/./g, '░');

// Provide a fake chalk implementation to make it easier to read snapshots
const TEST_CHALK = {
    rgb: replaceColoredText,
    bgRgb: replaceColoredText,
} as ChalkInstance;

const TEST_CONFIG: Config = {
    MIN_LINE_WIDTH: 60,
    WRAP_LINES: false,
    HIGHLIGHT_LINE_CHANGES: false,
    ...TEST_THEME,
};

type TestOverrides = Partial<Config>;

const SCREEN_WIDTH = 240;
const CONFIG_OVERRIDES: Record<string, TestOverrides> = {
    splitWithoutWrapping: {
        MIN_LINE_WIDTH: 60,
        WRAP_LINES: false,
    },
    splitWithWrapping: {
        MIN_LINE_WIDTH: 60,
        WRAP_LINES: true,
    },
    unifiedWithWrapping: {
        MIN_LINE_WIDTH: 200,
        WRAP_LINES: true,
    },
    // This is in split mode
    inlineChangesHighlighted: {
        MIN_LINE_WIDTH: 60,
        HIGHLIGHT_LINE_CHANGES: true,
        DELETED_WORD_COLOR: { color: { r: 255, g: 0, b: 0, a: 255 } },
        INSERTED_WORD_COLOR: { color: { r: 0, g: 255, b: 0, a: 255 } },
    },
    unifiedWithInlineChangesHighlighted: {
        MIN_LINE_WIDTH: 200,
        HIGHLIGHT_LINE_CHANGES: true,
        DELETED_WORD_COLOR: { color: { r: 255, g: 0, b: 0, a: 255 } },
        INSERTED_WORD_COLOR: { color: { r: 0, g: 255, b: 0, a: 255 } },
    },
    syntaxHighlighted: {
        MIN_LINE_WIDTH: 60,
        WRAP_LINES: false,
        SYNTAX_HIGHLIGHTING_THEME: 'dark-plus',
    },
};

for (const [configName, config] of Object.entries(CONFIG_OVERRIDES)) {
    async function transform(input: string): Promise<string> {
        const testConfig: Config = {
            ...TEST_CONFIG,
            ...config,
        };
        const context = await getContextForConfig(
            testConfig,
            TEST_CHALK,
            SCREEN_WIDTH
        );

        let string = '';
        await transformContentsStreaming(
            context,
            Readable.from(input),
            new (class extends Writable {
                write(chunk: Buffer) {
                    string += chunk.toString();
                    return true;
                }
            })()
        );
        return string;
    }

    describe(configName, () => {
        test('empty', async function () {
            expect(await transform(``)).toMatchSnapshot();
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
            ).toMatchSnapshot();
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
            ).toMatchSnapshot();
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
            ).toMatchSnapshot();
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
`).toMatchSnapshot();
        });

        test('commit with a small diff', async function () {
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
 cask 'spotify'`)
            ).toMatchSnapshot();
        });

        test('commit with a small diff without a/ and b/ prefixs', async function () {
            expect(
                await transform(`
commit 26ca49fb83758bace20a473e231d576aa1bbe115
Author: Shrey Banga <shrey@quip.com>
Date:   Tue May 23 16:47:17 2017 -0700

    sonos to brew

diff --git Brewfile Brewfile
index 5a38bdb..ef4ff52 100644
--- Brewfile
+++ Brewfile
@@ -19,2 +19,3 @@ brew 'python3'
 brew 'socat'
+brew 'sonos'
 brew 'terminal-notifier'
@@ -42,3 +43,2 @@ cask 'rescuetime'
 cask 'slate'
-cask 'sonos'
 cask 'spotify'`)
            ).toMatchSnapshot();
        });

        test('commit with tabs', async function () {
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
 -		[x] Organize code
+-		[x] Move visual config to theme
 -		[ ] Handle empty diffs
`)
            ).toMatchSnapshot();
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
 import terminalSize from 'terminal-size';
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
            ).toMatchSnapshot();
        });

        test('commit with file addition', async function () {
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
            ).toMatchSnapshot();
        });

        test('commit with binary file addition', async function () {
            expect(
                await transform(`
commit c0ca4394fd55f1709430414f03db3d04cb9cc72c (HEAD -> main)
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Wed Apr 14 18:24:29 2021 -0700

    test binary file addition

diff --git a/screenshots/default.png b/screenshots/default.png
new file mode 100644
index 0000000..40e16dc
Binary files /dev/null and b/screenshots/default.png differ
diff --git a/test dir a/default.png b/test dir a/default.png
index 44f1c8a..915e850 100644
Binary files a/test dir a/default.png and b/test dir a/default.png differ`)
            ).toMatchSnapshot();
        });

        test('commit with file move', async function () {
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
            ).toMatchSnapshot();
        });

        test('commit with file deletion', async function () {
            expect(
                await transform(`
commit 1e6ebaccc6fadf3390a749e7aa2cc6372b24325e
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 18 03:17:05 2021 -0700

    Update main.yml

diff --git a/.github/workflows/main.yml b/.github/workflows/main.yml
index dff1332..af022ac 100644
diff --git a/scripts/screenshotTheme b/scripts/screenshotTheme
deleted file mode 100755
index ca15c64..0000000
--- a/scripts/screenshotTheme
+++ /dev/null
@@ -1,7 +0,0 @@
-on run argv
-    with timeout of 5 seconds
-        tell app "Terminal"
-            open "screenshots.sh"
-        end tell
-    end timeout
-end run
\ No newline at end of file`)
            ).toMatchSnapshot();
        });

        test('commit with inline line changes', async function () {
            expect(
                await transform(
                    `
commit 9e424d329800e945e3003c9e275f80bdef69e591
Author: Shrey Banga <banga.shrey@gmail.com>
Date:   Sun Apr 4 19:04:26 2021 -0700

    update lockfile

diff --git a/Brewfile.lock.json b/Brewfile.lock.json
index ecb417f..f412f84 100644
--- a/Brewfile.lock.json
+++ b/Brewfile.lock.json
@@ -5 +5 @@
-        "revision": null
+        "revision": "ee2f8d3ba2976e50ef577d517bf175c94fbbb0dd"
@@ -8 +8 @@
-        "revision": null
+        "revision": "c4cf96857c050dfa4f65f52109862dc68e55f60a"
@@ -11 +11 @@
-        "revision": null
+        "revision": "504d4b93aa6eaf4fce1bf17c19f55828ad7229a4"
@@ -16 +16 @@
-        "version": "1.14.2_1",
+        "version": "1.16.3",
@@ -17,0 +18 @@
+          "rebuild": 0,
@@ -19,0 +21 @@
+          "root_url": "https://homebrew.bintray.com/bottles",
@@ -20,0 +23,8 @@
+            "arm64_big_sur": {
+              "url": "https://homebrew.bintray.com/bottles/go-1.16.3.arm64_big_sur.bottle.tar.gz",
+              "sha256": "e7c1efdd09e951eb46d01a3200b01e7fa55ce285b75470051be7fef34f4233ce"
+            },
+            "big_sur": {
+              "url": "https://homebrew.bintray.com/bottles/go-1.16.3.big_sur.bottle.tar.gz",
+              "sha256": "ea37f33fd27369612a3e4e6db6adc46db0e8bdf6fac1332bf51bafaa66d43969"
+            },
@@ -22,2 +32,2 @@
-              "url": "https://homebrew.bintray.com/bottles/go-1.14.2_1.catalina.bottle.tar.gz",
-              "sha256": "15b5623471330edcc681d7f9d57b449660e6d4b98c7f67af67f4991fc75d61fc"
+              "url": "https://homebrew.bintray.com/bottles/go-1.16.3.catalina.bottle.tar.gz",
+              "sha256": "69c28f5e60612801c66e51e93d32068f822b245ab83246cb6cb374572eb59e15"
@@ -26,6 +36,2 @@
-              "url": "https://homebrew.bintray.com/bottles/go-1.14.2_1.mojave.bottle.tar.gz",
-              "sha256": "fa65e7dabe514e65ae625ed3c84a6bf58df01aceffc6e9aa99752ca8c320ce69"
-            },
-            "high_sierra": {
-              "url": "https://homebrew.bintray.com/bottles/go-1.14.2_1.high_sierra.bottle.tar.gz",
-              "sha256": "0997f6f5cda0e3bdb7789a80b53621cb588202ab37fd89bcd269f8dfafd23351"
+              "url": "https://homebrew.bintray.com/bottles/go-1.16.3.mojave.bottle.tar.gz",
+              "sha256": "bf1e90ed1680b8ee1acb49f2f99426c8a8ac3e49efd63c7f3b41e57e7214dd19"
`
                )
            ).toMatchSnapshot();
        });

        test('commit with double-spaced characters', async function () {
            expect(
                await transform(`
diff --git a/README.ja-JP.md b/README.ja-JP.md
index 5ff5244..b48cf46 100644
--- a/README.ja-JP.md
+++ b/README.ja-JP.md
@@ -4 +4 @@
-このリポジトリは、MS-DOS v1.25 及び MS-DOS v2.0 のオリジナルのソースコード及びコンパイルされたバイナリを含んでいます。
+このリポジトリは、MS-DOS 及び MS-DOS v2.0 のオリジナルのソースコード及びコンパイルされたバイナリを含んでいます。
`)
            ).toMatchSnapshot();
        });

        test('diff from issue #50', async function () {
            expect(
                await transform(`
diff --git a/file1 b/file1
index d88c464..6901818 100644
--- a/file1
+++ b/file1
@@ -1 +1,2 @@
-This is file1
\ No newline at end of file
+This is file1
+Experimental change
diff --git a/file2 b/file2
index 095ee29..439621e 100644
--- a/file2
+++ b/file2
@@ -1 +1,2 @@
+All good
 This is file2`)
            ).toMatchSnapshot();
        });

        test('merge commit with 2 parents', async function () {
            // Source: the TypeScript repo
            expect(
                await transform(`
commit 3f504f4fbc1caf9c10814d48d8897a34f8a34dec
Merge: 2439767601 fbcdb8cf4f
Author: Gabriela Araujo Britto <gabrielaa@microsoft.com>
Date:   Thu Dec 21 17:57:42 2023 -0800

    Merge branch 'main' into gabritto/d2

diff --cc src/compiler/binder.ts
index b2f0d9f384,6ea9b82695..c638984e3b
--- a/src/compiler/binder.ts
+++ b/src/compiler/binder.ts
@@@ -137,9 -136,9 +137,10 @@@ import 
      isBlock,
      isBlockOrCatchScoped,
      IsBlockScopedContainer,
+     isBooleanLiteral,
      isCallExpression,
      isClassStaticBlockDeclaration,
 +    isConditionalExpression,
      isConditionalTypeNode,
      IsContainer,
      isDeclaration,
diff --cc src/compiler/types.ts
index 2e204671f7,e56bba5ab4..ab6229d1b6
--- a/src/compiler/types.ts
+++ b/src/compiler/types.ts
@@@ -5985,8 -6063,7 +6063,8 @@@ export interface NodeLinks 
      decoratorSignature?: Signature;     // Signature for decorator as if invoked by the runtime.
      spreadIndices?: { first: number | undefined, last: number | undefined }; // Indices of first and last spread elements in array literal
      parameterInitializerContainsUndefined?: boolean; // True if this is a parameter declaration whose type annotation contains "undefined".
-     fakeScopeForSignatureDeclaration?: boolean; // True if this is a fake scope injected into an enclosing declaration chain.
 +    contextualReturnType?: Type;        // If the node is a return statement's expression, then this is the contextual return type.
+     fakeScopeForSignatureDeclaration?: "params" | "typeParams"; // If present, this is a fake scope injected into an enclosing declaration chain.
      assertionExpressionType?: Type;     // Cached type of the expression of a type assertion
  }`)
            ).toMatchSnapshot();
        });

        test('merge commit with 3 parents', async function () {
            // Source: the TypeScript repo
            expect(
                await transform(`
commit d6d6a4aedfa78794c1b611c13d2ed1d3a66e1798
Merge: 0dc976df1e 5f16a48236 3eadbf6c96
Author: Andy Hanson <anhans@microsoft.com>
Date:   Thu Sep 1 12:52:42 2016 -0700

    Merge branch 'goto_definition_super', remote-tracking branch 'origin' into constructor_references

diff --cc src/services/services.ts
index b95feb9207,c19eb487d7,83a2192659..7e9a356e73
--- a/src/services/services.ts
+++ b/src/services/services.ts
@@@@ -2788,26 -2792,18 -2788,34 +2792,42 @@@@ namespace ts 
           return node && node.parent && node.parent.kind === SyntaxKind.PropertyAccessExpression && (<PropertyAccessExpression>node.parent).name === node;
       }
   
 +     function climbPastPropertyAccess(node: Node) {
 +         return isRightSideOfPropertyAccess(node) ? node.parent : node;
 +     }
 + 
  -    function climbPastManyPropertyAccesses(node: Node): Node {
  -        return isRightSideOfPropertyAccess(node) ? climbPastManyPropertyAccesses(node.parent) : node;
+++    /** Get \`C\` given \`N\` if \`N\` is in the position \`class C extends N\` or \`class C extends foo.N\` where \`N\` is an identifier. */
+++    function tryGetClassExtendingIdentifier(node: Node): ClassLikeDeclaration | undefined {
+++        return tryGetClassExtendingExpressionWithTypeArguments(climbPastPropertyAccess(node).parent);
++     }
++ 
       function isCallExpressionTarget(node: Node): boolean {
 -         if (isRightSideOfPropertyAccess(node)) {
 -             node = node.parent;
 -         }
  -        node = climbPastPropertyAccess(node);
 --        return node && node.parent && node.parent.kind === SyntaxKind.CallExpression && (<CallExpression>node.parent).expression === node;
 ++        return isCallOrNewExpressionTarget(node, SyntaxKind.CallExpression);
       }
   
       function isNewExpressionTarget(node: Node): boolean {
 -         if (isRightSideOfPropertyAccess(node)) {
 -             node = node.parent;
 -         }
  -        node = climbPastPropertyAccess(node);
 --        return node && node.parent && node.parent.kind === SyntaxKind.NewExpression && (<CallExpression>node.parent).expression === node;
 ++        return isCallOrNewExpressionTarget(node, SyntaxKind.NewExpression);
 ++    }
 ++
 ++    function isCallOrNewExpressionTarget(node: Node, kind: SyntaxKind) {
 ++        const target = climbPastPropertyAccess(node);
 ++        return target && target.parent && target.parent.kind === kind && (<CallExpression>target.parent).expression === target;
 ++    }
 ++
-      /** Get \`C\` given \`N\` if \`N\` is in the position \`class C extends N\` or \`class C extends foo.N\` where \`N\` is an identifier. */
-      function tryGetClassExtendingIdentifier(node: Node): ClassLikeDeclaration | undefined {
-          return tryGetClassExtendingExpressionWithTypeArguments(climbPastPropertyAccess(node).parent);
+++    function climbPastManyPropertyAccesses(node: Node): Node {
+++        return isRightSideOfPropertyAccess(node) ? climbPastManyPropertyAccesses(node.parent) : node;
++     }
++ 
++     /** Returns a CallLikeExpression where \`node\` is the target being invoked. */
++     function getAncestorCallLikeExpression(node: Node): CallLikeExpression | undefined {
++         const target = climbPastManyPropertyAccesses(node);
++         const callLike = target.parent;
++         return callLike && isCallLikeExpression(callLike) && getInvokedExpression(callLike) === target && callLike;
++     }
++ 
++     function tryGetSignatureDeclaration(typeChecker: TypeChecker, node: Node): SignatureDeclaration | undefined {
++         const callLike = getAncestorCallLikeExpression(node);
++         return callLike && typeChecker.getResolvedSignature(callLike).declaration;
       }
   
       function isNameOfModuleDeclaration(node: Node) {
`)
            ).toMatchSnapshot();
        });
    });
}
