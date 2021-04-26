# git-split-diffs

GitHub style split diffs with syntax highlighting in your terminal.

![Screenshot of default theme](screenshots/default.png?raw=true)

![Screenshot of github-light theme](screenshots/github-light.png?raw=true)

[Demo 1](https://asciinema.org/a/Bsk7CFtZkDZ4Ea89BwDcbD8LA) | [Demo 2](https://asciinema.org/a/7HrYqF2vjfrKXt28bv6BUAcym)

## Usage

This currently requires `node` version 12 or newer to run.

### Install globally

```sh
npm install -g git-split-diffs

git config --global core.pager git-split-diffs --color | less -RFX
```

### Install locally

```sh
npm install git-split-diffs

git config core.pager npx git-split-diffs --color | less -RFX
```

### Use manually

```sh
git diff | git-split-diffs --color | less
```

## Customization

### Line wrapping

By default, lines are wrapped to fit in the screen. If you prefer to truncate them update the `wrap-lines` setting:

```
git config split-diffs.wrap-lines false
```

### Inline changes

By default, salient changes within lines are also highlighted:
![Screenshot of inline changes](screenshots/inline-changes.png?raw=true)

This adds a small overhead to rendering. You can disable this with the `highlight-line-changes` setting:

```
git config split-diffs.highlight-line-changes false
```

### Syntax highlighting

Syntax highlighting is supported using the same grammars and themes as vscode, via [shiki](https://github.com/shikijs/shiki/). Each theme specifies a default syntax highlighting theme to use, but that can be overridden by:

```
git config split-diffs.syntax-highlighting-theme <name>
```

Supported syntax highlighting theme names are mentioned here: https://github.com/shikijs/shiki/blob/master/docs/themes.md#all-themes

Note that syntax highlighting is the slowest operation, so you can disable it for faster diffs:

```
git config split-diffs.syntax-highlighting-theme ''
```

### Narrow terminals

Split diffs can be hard to read on narrow widths, so if we cannot fit two lines of `min-line-width` on screen, we revert to unified diffs. This value is configurable:

```
git config split-diffs.min-line-width 40
```

This defaults to `80`, so screens below `160` characters will display unified diffs. Set it to `0` to always show split diffs.

### Themes

You can pick between several [themes](src/themeDefinitions.ts):

#### Default

```
git config split-diffs.theme default
```

![Screenshot of default theme](screenshots/default.png?raw=true)

#### Light

```
git config split-diffs.theme light
```

![Screenshot of light theme](screenshots/light.png?raw=true)

#### GitHub Light

```
git config split-diffs.theme github-light
```

![Screenshot of GitHub Light theme](screenshots/github-light.png?raw=true)

#### GitHub Dark (Dim)

```
git config split-diffs.theme github-dark-dim
```

![Screenshot of GitHub Dark (Dim) theme](screenshots/github-dark-dim.png?raw=true)

#### Arctic

Based on https://www.nordtheme.com/

```
git config split-diffs.theme arctic
```

![Screenshot of GitHub Dark (Dim) theme](screenshots/arctic.png?raw=true)
