# git-split-diffs

GitHub style split (side by side) diffs with syntax highlighting in your terminal.

![Screenshot of dark theme](screenshots/dark.png?raw=true)

![Screenshot of github-light theme](screenshots/github-light.png?raw=true)

[Demo 1](https://asciinema.org/a/Bsk7CFtZkDZ4Ea89BwDcbD8LA) | [Demo 2](https://asciinema.org/a/7HrYqF2vjfrKXt28bv6BUAcym)

## Usage

This currently requires `node` version 14 or newer to run.

### Install globally

```sh
npm install -g git-split-diffs

git config --global core.pager "git-split-diffs --color | less -RFX"
```

### Install locally

```sh
npm install git-split-diffs

git config core.pager "npx git-split-diffs --color | less -RFX"
```

### Use manually

```sh
git diff | git-split-diffs --color | less -RFX
```

## Customization

### Line wrapping

By default, lines are wrapped to fit in the screen. If you prefer to truncate them, update the `wrap-lines` setting:

```
git config split-diffs.wrap-lines false
```

### Inline changes

By default, salient changes within lines are also highlighted:
![Screenshot of inline changes](screenshots/inline-changes.png?raw=true)

You can disable this with the `highlight-line-changes` setting:

```
git config split-diffs.highlight-line-changes false
```

### Enable scrolling in the terminal

```sh
git config --global core.pager "git-split-diffs --color | less -+LFX"
```

(note the difference from the main configuration with the added `+` to the `less` command)

### Syntax highlighting

Syntax highlighting is supported via [shiki](https://github.com/shikijs/shiki/), which uses the same grammars and themes as vscode. Each theme specifies a default syntax highlighting theme to use, which can be overridden by:

```
git config split-diffs.syntax-highlighting-theme <name>
```

The supported syntax highlighting themes are listed at https://github.com/shikijs/textmate-grammars-themes/tree/main/packages/tm-themes#tm-themes

You can disable syntax highlighting by setting the name to empty:

```
git config split-diffs.syntax-highlighting-theme ''
```

### Narrow terminals

Split diffs can be hard to read on narrow terminals, so we revert to unified diffs if we cannot fit two lines of `min-line-width` on screen. This value is configurable:

```
git config split-diffs.min-line-width 40
```

This defaults to `80`, so screens below `160` characters will display unified diffs. Set it to `0` to always show split diffs.

### Custom theme directory

You can specify a custom directory for themes using the `theme-directory` setting. This supports path expansion for convenient configuration:

```
git config split-diffs.theme-directory ~/my/themes/split-diff
```

The following expansions are supported:
- `~` and `~/` expand to your home directory
- `$HOME`, `${HOME}`, `$USER`, and other environment variables are expanded
- Relative paths are resolved to absolute paths

## Themes

You can pick between several [themes](themes/):

### Arctic

Based on https://www.nordtheme.com/

```
git config split-diffs.theme-name arctic
```

![Screenshot of GitHub Dark (Dim) theme](screenshots/arctic.png?raw=true)

### Dark

This is the default theme.

```
git config split-diffs.theme-name dark
```

![Screenshot of dark theme](screenshots/dark.png?raw=true)

### Light

```
git config split-diffs.theme-name light
```

![Screenshot of light theme](screenshots/light.png?raw=true)

### GitHub Dark (Dim)

```
git config split-diffs.theme-name github-dark-dim
```

![Screenshot of GitHub Dark (Dim) theme](screenshots/github-dark-dim.png?raw=true)

### GitHub Light

```
git config split-diffs.theme-name github-light
```

![Screenshot of GitHub Light theme](screenshots/github-light.png?raw=true)

### Solarized Dark

As seen on https://github.com/altercation/solarized

```
git config split-diffs.theme-name solarized-dark
```

![Screenshot of Solarized Dark theme](screenshots/solarized-dark.png?raw=true)

### Solarized Light

```
git config split-diffs.theme-name solarized-light
```

![Screenshot of Solarized Light theme](screenshots/solarized-light.png?raw=true)

### Monochrome Dark

```
git config split-diffs.theme-name monochrome-dark
```

![Screenshot of Monochrome Dark theme](screenshots/monochrome-dark.png?raw=true)

### Monochrome Light

```
git config split-diffs.theme-name monochrome-light
```

![Screenshot of Monochrome Light theme](screenshots/monochrome-light.png?raw=true)

## Custom Themes

Default themes are loaded from the `git-split-diffs` bundle. To load a custom theme, set `theme-directory` in git config and create a `{theme-name}.json` file in that directory with the theme's definition. You can use one of the existing themes in [themes/](https://github.com/banga/git-split-diffs/tree/main/themes) as a starting point.

```
git config split-diffs.theme-directory </path/to/theme>
git config split-diffs.theme-name <name>
```

This will use `/path/to/theme/name.json` as the theme.

## Performance

Tested by measuring the time it took to pipe the output `git log -p` to `/dev/null` via `git-split-diffs` with the default theme:

| Features enabled                                      | ms/kloc |
| ----------------------------------------------------- | ------- |
| Everything                                            | 45      |
| No syntax highlighting                                | 15      |
| No syntax highlighting, no inline change highlighting | 13      |

## Troubleshooting

### Not seeing diffs side-by-side?

See [#narrow-terminals](#narrow-terminals)

### Not seeing colors, or seeing fewer colors?

Text coloring is implemented using Chalk which supports [various levels of color](https://github.com/chalk/chalk#supportscolor). If Chalk is producing fewer colors than your terminal supports, try overriding Chalk's detection using a variation of the `--color` flag, e.g. `--color=16m` for true color. See Chalk's documentation or [this useful gist on terminal support](https://gist.github.com/XVilka/8346728) if issues persist.

### Want to remove background colors from a theme?

See [#custom-themes](#custom-themes) for instructions on customizing themes. Removing `backgroundColor` should usually work.

## Acknowledgements

-   [diff-so-fancy](https://github.com/so-fancy/diff-so-fancy) for showing what's possible
-   [shikijs](https://github.com/shikijs/shiki) for making it easy to do high quality syntax highlighting
-   [chalk](https://github.com/chalk/chalk) for making it easy to do terminal styling reliably
-   [delta](https://github.com/dandavison/delta) which approaches the same problem in Rust
