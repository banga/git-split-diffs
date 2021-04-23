# git-split-diffs (beta)

> ⚠️ This package is currently in beta, please use it at your own risk.

GitHub style split diffs in your terminal.

![Screenshot of default theme](screenshots/default.png?raw=true)

![Screenshot of github-light theme](screenshots/github-light.png?raw=true)

[Demo 1](https://asciinema.org/a/6MZ4GWjfIyODdts9tjnN0YPy8?t=3) | [Demo 2](https://asciinema.org/a/qqkVNGVX7WyL5PQ3rfXTTISMv?t=3)

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

Syntax highlighting is enabled by default. It uses the same technology as vscode, via [shiki](shikijs/shiki). Each theme specifies a default syntax highlighting theme to use, but that can be overridden by:

```
git config split-diffs.syntax-highlighting-theme <name>
```

Supported syntax highlighting themes are named here: https://github.com/shikijs/shiki/blob/master/docs/themes.md

Syntax highlighting is the slowest operation, so you can disable it for faster diffs:

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
