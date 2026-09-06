# rmmd

`rmmd` converts Markdown to HTML — and adds syntax for the semantic inline
elements Markdown leaves out.

Markdown gives you `<em>` and `<strong>`. It has never given you `<mark>`,
`<dfn>`, `<abbr>`, `<cite>`, `<q>`, `<sub>`, `<sup>` or `<s>`. `rmmd` does,
without dropping to raw HTML in the middle of your prose.

```bash
echo 'The +bibliography+ lists =every= [HTML]{abbr HyperText Markup Language} source.' | rmmd -c
```

```html
<p>The <dfn>bibliography</dfn> lists <mark>every</mark> <abbr title="HyperText Markup Language">HTML</abbr> source.</p>
```

Built on [unified][], with the custom syntax implemented as
[micromark][] extensions — the same mechanism GFM uses — so it composes with
emphasis, links, tables and each other, and its output is escaped correctly.

## Contents

1. [Installation](#installation)
1. [The semantic elements](#the-semantic-elements)
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
| `=marked=` | `<mark>` | Text of special relevance in its context |
| `+defined term+` | `<dfn>` | The defining instance of a term |
| `~struck~` | `<s>` | No longer accurate or no longer relevant |
| `e^iπ^` | `<sup>` | Superscript |
| `H%2%O` | `<sub>` | Subscript |
| `[The Waste Land]{cite}` | `<cite>` | The title of a cited creative work |
| `[to be]{q}` | `<q>` | A short inline quotation |
| `[HTML]{abbr HyperText Markup Language}` | `<abbr>` | An abbreviation, with `title` |

Run `rmmd --list` to print this table from the CLI.

The five frequent elements use a paired delimiter. The other three use the
`[text]{tag}` span form, because they are either rarer or need an attribute —
`{q}` takes an optional value that becomes `cite`, `{abbr}` one that becomes
`title`.

Both forms parse their content as ordinary Markdown, so they nest freely:

```markdown
[a **bold** =highlighted= citation]{cite}
```

Delimiters follow the same flanking rules as emphasis, so ordinary prose is
left alone. `3 = 3 = 3`, `50% off`, `a ~ b` and `2 ^ 3` all pass through
untouched, and `\=escaped\=` stays literal.

### Enable only what you want

```bash
rmmd --custom notes.md                 # all eight
rmmd --elements mark,dfn notes.md      # just <mark> and <dfn>
```

`--custom` is a plain switch and `--elements` takes the list, so that
`rmmd -c notes.md` cannot mistake the filename for an element name.

### A note on `~`

GitHub Flavored Markdown reads `~~text~~` as `<del>`. `rmmd` reads both
`~text~` and `~~text~~` as `<s>`, which is the distinction the HTML spec draws:
`<del>` is content *edited out* of a document, `<s>` is content *no longer
accurate*. Prose wants the second far more often than the first. The other GFM
constructs — tables, task lists, autolinks, footnotes — work as normal.

If you want `<del>`, write it as HTML; raw HTML passes through by default.

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
in a pipeline. Errors exit non-zero.

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

const { html, title } = await render('# Hi\n\nA =highlight=.', {
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
import { remarkSemantic } from 'rmmd';

const processor = unified()
  .use(remarkParse)
  .use(remarkSemantic, { elements: ['mark', 'abbr'] })
  .use(remarkRehype)
  .use(rehypeStringify);
```

## Adding an element

`lib/elements.js` is the single source of truth. The parser, the `--custom`
option and `--list` are all generated from it, so a new element is one entry
and nothing else.

A delimiter element. Pick a character Markdown does not already use — `*`,
`_`, `` ` ``, `[`, `]`, `!`, `#`, `>` and `-` are taken, and `|` is best left
to tables:

```js
{
  tag: 'kbd',
  node: 'keyboard',
  marker: ';',
  example: ';Ctrl;',
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
│       ├── semantic.js            Mounts the registry as a remark plugin
│       └── gfm.js                 GFM, minus strikethrough
└── test/
```

Run the suite with `npm test`.

## Upgrading from 2.x

Version 3 keeps `-c`, `-e`, `-f` and the three original elements working. What
changed:

- **Delimiters now follow flanking rules.** In 2.x, `=` and `~` matched any two
  occurrences on a line, so `3 = 3 = 3` produced a stray `<mark>` and `a ~ b`
  a stray `<s>`. Text like that is now left alone. This is the one change that
  can alter existing output — where it does, 2.x was producing markup you did
  not ask for.
- **Content is escaped.** 2.x assembled HTML strings by hand, so `+a & b+`
  emitted an unescaped `&`. Elements are now real syntax-tree nodes.
- **`~~text~~` renders `<s>`,** where before it produced `<s>~text</s>~`.
- **GFM is on** by default; disable with `--no-gfm`.
- **Status messages moved to stderr,** so stdout is clean in a pipeline.
- `--output` is the new name for `--file`; `-f` still works.
- The internal modules `markdownToHtml.js`, `customMarkup.js` and the three
  `remark*.js` plugins are gone, replaced by `lib/render.js` and `lib/syntax/`.

## License

MIT. See `LICENSE.txt`.

[unified]: https://unifiedjs.com
[micromark]: https://github.com/micromark/micromark
