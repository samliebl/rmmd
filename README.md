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
| `--colour=always --width=80` | `--colour<mark>always --width</mark>80` | left alone |
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
│   ├── wrapHtml.js                Full-document wrapper
│   └── syntax/
│       ├── inlineAttention.js     Delimiter parser (one factory, five elements)
│       ├── span.js                `[text]{tag}` parser
│       ├── abbreviations.js       `*[TERM]: expansion` definitions
│       ├── semantic.js            Mounts the registry as a remark plugin
│       └── gfm.js                 GFM, minus strikethrough
└── test/
```

Run the suite with `npm test`.

## Upgrading from 2.x

Version 3 keeps `-c`, `-e`, `-f` and the three original elements working, but
two of the delimiters changed. What to know:

- **All three delimiters doubled:** `=marked=` is now `==marked==`, `+dfn+` is
  `++dfn++`, and `~s~` is `~~s~~`. The single forms matched any two markers on
  a line, so `key=value` prose, `--flag=x --flag=y`, `~/.bashrc` and
  `| a=1 | b=2 |` table cells produced stray elements. See
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

To migrate a document, doubling every delimiter mechanically is usually wrong:
render with 2.x and 3.x and diff, since the passages that change are largely
the ones 2.x was getting wrong.

## License

MIT. See `LICENSE.txt`.

[unified]: https://unifiedjs.com
[micromark]: https://github.com/micromark/micromark
