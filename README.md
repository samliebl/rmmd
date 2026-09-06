# rmmd

`rmmd` converts Markdown to HTML — and adds syntax for the semantic inline
elements Markdown leaves out.

Markdown gives you `<em>` and `<strong>`. It has never given you `<mark>`,
`<dfn>`, `<abbr>`, `<cite>`, `<q>`, `<sub>`, `<sup>` or `<s>`. `rmmd` does,
without dropping to raw HTML in the middle of your prose.

```bash
echo 'The ++bibliography++ lists ==every== [HTML]{abbr HyperText Markup Language} source.' | rmmd -c
```

```html
<p>The <dfn>bibliography</dfn> lists <mark>every</mark> <abbr title="HyperText Markup Language">HTML</abbr> source.</p>
```

Built on [unified][], with the custom syntax implemented as [micromark][]
extensions — the same mechanism GFM uses — so it composes with emphasis, links,
tables and each other, and its output is escaped correctly.

## Contents

1. [Installation](#installation)
1. [The semantic elements](#the-semantic-elements)
1. [Abbreviation definitions](#abbreviation-definitions)
1. [Why delimiters are doubled](#why-delimiters-are-doubled)
1. [Usage](#usage)
1. [Options](#options)
1. [Using rmmd as a library](#using-rmmd-as-a-library)
1. [Adding an element](#adding-an-element)
1. [Upgrading from 2.x](#upgrading-from-2x)
1. [Releasing](#releasing)
1. [License](#license)

## Installation

```bash
npm install -g rmmd
```

Requires Node 18 or newer.

## The semantic elements

Custom syntax is **off by default**. Enable it with `--custom` (`-c`).

| Syntax | Element | Meaning |
| --- | --- | --- |
| `==marked==` | `<mark>` | Text of special relevance in its context |
| `++defined term++` | `<dfn>` | The defining instance of a term |
| `~~struck~~` | `<s>` | No longer accurate or no longer relevant |
| `e^^iπ^^` | `<sup>` | Superscript |
| `H%%2%%O` | `<sub>` | Subscript |
| `[The Waste Land]{cite}` | `<cite>` | The title of a cited creative work |
| `[to be]{q}` | `<q>` | A short inline quotation |
| `[HTML]{abbr HyperText Markup Language}` | `<abbr>` | An abbreviation, with `title` |

Run `rmmd --list` to print this table from the CLI.

The five frequent elements use a paired delimiter, always doubled. The other
three use the `[text]{tag}` span form, because they are either rarer or need an
attribute — `{q}` takes an optional value that becomes `cite`, `{abbr}` one
that becomes `title`.

Both forms parse their content as ordinary Markdown, so they nest freely:

```markdown
[a **bold** ==highlighted== citation]{cite}
```

### Enable only what you want

```bash
rmmd --custom notes.md                 # all eight
rmmd --elements mark,dfn notes.md      # just <mark> and <dfn>
```

`--custom` is a plain switch and `--elements` takes the list, so that
`rmmd -c notes.md` cannot mistake the filename for an element name.

### A note on `~~`

You already type `~~struck~~` on GitHub, and it works here — but it produces
`<s>`, not `<del>`. That is the distinction the HTML spec draws: `<del>` is
content *edited out* of a document, `<s>` is content *no longer accurate*.
Prose wants the second far more often than the first.

The other GFM constructs — tables, task lists, autolinks, footnotes — work as
normal. If you want `<del>`, write it as HTML; raw HTML passes through by
default.

## Abbreviation definitions

Define an abbreviation once and every occurrence is expanded:

```markdown
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

HTML and CSS are the point.
```

```html
<p><abbr title="HyperText Markup Language">HTML</abbr> and
<abbr title="Cascading Style Sheets">CSS</abbr> are the point.</p>
```

The definition lines are removed from the output. Terms match whole words only,
so a definition of `HTML` leaves `HTMLElement` alone, and matching is
case-sensitive, so `html` is a different abbreviation. Code spans are never
expanded, and an explicit `[HTML]{abbr …}` overrides the definition for that
occurrence.

This is the syntax Markdown Extra established, and it needs `<abbr>` to be
enabled — `--custom`, or `--elements abbr`.

## Why delimiters are doubled

**One rule: every delimiter is doubled.** A single `=`, `+`, `~`, `^` or `%`
never means anything.

That rule exists because these are ordinary characters, and CommonMark's
flanking rules alone do not save them. With single delimiters, real prose comes
apart:

| Written | With a single delimiter | With a doubled one |
| --- | --- | --- |
| `--color=always --width=80` | `--color<mark>always --width</mark>80` | left alone |
| `key=value, other=thing` | `key<mark>value, other</mark>thing` | left alone |
| `Compute 2^8 then 2^16` | `Compute 2<sup>8 then 2</sup>16` | left alone |
| `Format with %d%s` | `Format with <sub>d</sub>s` | left alone |

`~/.bashrc`, `C++`, `i++`, `5+` ratings, `~50` approximations, `~~~` fences and
`printf "100%%"` are all safe by construction rather than by luck.

`test/prose.test.js` holds the corpus this was measured against — 29 lines of
ordinary technical writing, none of which may produce an element. Any delimiter
change has to keep it intact.

The doubled forms are also the ones people already know: `==highlight==` is
what Obsidian, Bear and Discourse use, and `~~struck~~` is what GitHub uses.
Two of the five need no learning at all.

## Usage

```bash
rmmd README.md                       # file to stdout
cat README.md | rmmd                 # stdin to stdout
rmmd README.md -o out.html           # write a file
rmmd README.md -e                    # wrap in a full HTML document
rmmd a.md b.md c.md                  # concatenate several files
rmmd *.md --out-dir site/            # one .html per input
```

`--enclose` takes the document title from the first `<h1>`, or from `--title`:

```bash
rmmd post.md -c -e --css /style.css -o post.html
```

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The First Heading</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1>The First Heading</h1>
</body>
</html>
```

Status messages go to stderr and the rendered HTML to stdout, so `rmmd` behaves
in a pipeline. Errors exit non-zero, and a closed pipe (`rmmd big.md | head`)
is not an error.

`--out-dir` names each output after its input, so two inputs from different
directories can collide. `rmmd a/notes.md b/notes.md --out-dir site/` refuses
the whole run rather than letting the second write destroy the first, and
`--out-dir` cannot be combined with `--output`.

### Limits

Markdown nested thousands of levels deep — a document that is ten thousand
nested blockquotes — exhausts the call stack inside `mdast-to-hast` and is
reported as such rather than converted. This is upstream behavior, reproducible
with `remark-parse` and `remark-rehype` alone; ordinary documents are nowhere
near it.

An abbreviation term longer than 100 characters is ignored, on the grounds that
it is not an abbreviation. Any number of definitions is fine; they are matched
in batches.

## Options

| Option | Description |
| --- | --- |
| `-c, --custom` | Enable rmmd's semantic elements |
| `--elements <list>` | Enable only these elements, comma separated |
| `-e, --enclose` | Wrap output in a full HTML document |
| `-o, --output <path>` | Write to a file instead of stdout |
| `-d, --out-dir <dir>` | Write each input to its own `.html` file |
| `--title <text>` | Document title for `--enclose` (default: first `<h1>`) |
| `--lang <code>` | Document language for `--enclose` (default: `en`) |
| `--css <href...>` | Stylesheets to link from `--enclose` |
| `--no-gfm` | Disable tables, task lists, autolinks and footnotes |
| `--no-html` | Drop raw HTML present in the Markdown source |
| `--list` | List the semantic elements and their syntax |
| `--legacy-check` | Report passages using 2.x single-delimiter syntax |
| `-v, --version` | Output the version number |
| `-h, --help` | Display help |

`-f, --file` remains as an alias for `--output`.

## Using rmmd as a library

```js
import { render, wrapInHtmlDocument } from 'rmmd';

const { html, title } = await render('# Hi\n\nA ==highlight==.', {
  elements: true,        // or ['mark', 'dfn'], or false
  gfm: true,
  allowHtml: true,
});

console.log(wrapInHtmlDocument(html, { title }));
```

The remark plugins are exported too, so you can mount the syntax in your own
unified pipeline:

```js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkSemantic, remarkAbbreviations } from 'rmmd';

const processor = unified()
  .use(remarkParse)
  .use(remarkSemantic, { elements: ['mark', 'abbr'] })
  .use(remarkAbbreviations)
  .use(remarkRehype)
  .use(rehypeStringify);
```

## Adding an element

`lib/elements.js` is the single source of truth. The parser, the `--custom`
option and `--list` are all generated from it, so a new element is one entry
and nothing else.

A delimiter element. Pick a character Markdown does not already use — `*`, `_`,
`` ` ``, `[`, `]`, `!`, `#`, `>` and `-` are taken, and `|` is best left to
tables. Keep `minSize: 2` unless you have measured that a single character is
safe:

```js
{
  tag: 'kbd',
  node: 'keyboard',
  marker: ';',
  minSize: 2,
  example: ';;Ctrl;;',
  describe: 'User input from a keyboard.',
}
```

Or a span element, if it needs an attribute:

```js
{
  tag: 'time',
  attribute: 'datetime',
  example: '[last Tuesday]{time 2026-09-01}',
  describe: 'A date or time. Value sets `datetime`.',
}
```

Then add a line to the corpus in `test/prose.test.js` covering how your new
character appears in ordinary writing, and run `npm test`.

### Project structure

```plaintext
rmmd/
├── bin/
│   └── rmmd.js                    CLI
├── lib/
│   ├── index.js                   Library entry point
│   ├── elements.js                The element registry
│   ├── render.js                  The unified pipeline
│   ├── legacy.js                  Finds 2.x syntax for --legacy-check
│   ├── wrapHtml.js                Full-document wrapper
│   └── syntax/
│       ├── inlineAttention.js     Delimiter parser (one factory, five elements)
│       ├── span.js                `[text]{tag}` parser
│       ├── abbreviations.js       `*[TERM]: expansion` definitions
│       ├── semantic.js            Mounts the registry as a remark plugin
│       └── gfm.js                 GFM, minus strikethrough
└── test/
```

Run the suite with `npm test` — 121 tests, about five seconds.

Beyond the unit tests, the suite carries two files worth knowing about.
`test/prose.test.js` is the corpus that decides the delimiters. `test/robustness.test.js` runs a bounded deterministic fuzz plus the malformed
inputs — unclosed spans, lone surrogates, BOMs, CRLF, combining marks, ragged
tables, self-referential footnotes — that must render rather than throw.

## Upgrading from 2.x

Version 3 keeps `-c`, `-e`, `-f` and the three original elements working, but
two of the delimiters changed. What to know:

- **Every delimiter is doubled.** `=marked=` is now `==marked==`, `+dfn+` is
  `++dfn++`, and `~s~` is `~~s~~`. The single forms matched any two markers on
  a line, so `key=value` prose, `--flag=x --flag=y`, `~/.bashrc` and
  `| a=1 | b=2 |` table cells produced stray elements. A lone marker is now
  always literal. See
  [Why delimiters are doubled](#why-delimiters-are-doubled).
- **`~~text~~` is now the strikethrough you already type on GitHub,** and
  `==text==` the highlight you already type in Obsidian.
- **Delimiters now follow flanking rules,** so `3 = 3 = 3` and `a ~ b` are left
  alone where 2.x mangled them.
- **Content is escaped.** 2.x assembled HTML strings by hand, so `+a & b+`
  emitted an unescaped `&`. Elements are now real syntax-tree nodes.
- **GFM is on** by default; disable with `--no-gfm`.
- **Status messages moved to stderr,** so stdout is clean in a pipeline.
- `--custom` no longer takes a value; use `--elements` for a subset.
- `--output` is the new name for `--file`; `-f` still works.
- The internal modules `markdownToHtml.js`, `customMarkup.js` and the three
  `remark*.js` plugins are gone, replaced by `lib/render.js` and `lib/syntax/`.

### What actually changes

Rendering the same documents through 2.3.0 and 3.0.0:

**Without `--custom`, output is byte-identical** apart from a trailing newline.
This project's own 2.x README renders to the same 214 lines through both
versions; the only difference is that 3.0.0 terminates the final one. Turning
GFM on by default changed nothing in it.

**With `--custom`, every 2.x element becomes literal text.** A document written
the way the 2.x README taught loses all of its markup:

```html
<!-- 2.3.0 -->  <p>This is <mark>marked text</mark> in markdown.</p>
<!-- 3.0.0 -->  <p>This is =marked text= in markdown.</p>
```

Nothing errors — the page just shows `=marked text=` to readers. That is the
one upgrade hazard, and it is why `--legacy-check` exists.

The same comparison shows what 2.x was doing to ordinary prose:

```html
<!-- 2.3.0 -->  <p>Copy <s>/.bashrc and </s>/.profile over.
                Written in C<dfn>+ with C</dfn>+17 support.</p>
<!-- 3.0.0 -->  <p>Copy ~/.bashrc and ~/.profile over.
                Written in C++ with C++17 support.</p>
```

2.x did not merely add stray tags there; it **deleted characters**. `~/.bashrc`
lost its tilde and `C++` lost a plus.

### Migrating

```bash
rmmd --legacy-check docs/*.md
```

```
docs/guide.md
     3:5   "+the config file+" would have been <dfn> in 2.x
     3:52  "=always --width=" would have been <mark> in 2.x
     6:32  "^8 then 2^" would have been <sup> in 2.x
```

It exits non-zero when it finds anything, so it can gate a migration in CI.

It reports rather than rewrites, deliberately. Those three lines are two
different problems: the first was markup the author meant and wants doubled;
the second and third were 2.x tearing `--color=always --width=80` and
`2^8 then 2^16` in half, and want leaving alone. No tool can tell them apart —
double the delimiters you meant, and leave the rest.

## Releasing

Tests run on Node 18, 20, 22 and 24, and a separate job installs the built
tarball into an empty project with production dependencies only — which is what
catches a dependency that is used but never declared.

Publishing is automated. Tag a version and push it:

```bash
npm version 3.0.1
git push --follow-tags
```

The release workflow re-runs the tests, refuses the tag if it disagrees with
`package.json`, and publishes with [npm provenance][provenance], so npmjs.com
records which workflow and which commit produced the tarball. It needs an npm
automation token stored as the `NPM_TOKEN` repository secret.

`npm publish` run by hand still works; `prepublishOnly` runs the suite first
and a failure stops the publish.

## License

MIT. See `LICENSE.txt`.

[unified]: https://unifiedjs.com
[micromark]: https://github.com/micromark/micromark
[provenance]: https://docs.npmjs.com/generating-provenance-statements
