/**
 * rmmd's semantic element registry.
 *
 * Markdown has no syntax for a family of semantic inline HTML elements. This
 * table is where rmmd adds it, and it is the single source of truth: the
 * parser, the `--custom` option, and the `--list` output are all generated
 * from these entries. Adding a ninth element is one entry here and nothing else.
 *
 * Two syntaxes, chosen by what the element needs:
 *
 *   delimiter  A paired character, for elements you reach for constantly.
 *   span       `[text]{tag}`, for elements that carry an attribute or are
 *              rare enough not to deserve a character of their own.
 *
 * Every delimiter is doubled: `minSize: 2`, so a lone marker is always
 * literal. These are ordinary characters -- `--flag=value`, `2^8`, `^C`,
 * `%d%s`, `~/.bashrc`, `C++`, `i++` -- and CommonMark's flanking rules alone
 * do not save them. Doubling makes ordinary prose safe by construction rather
 * than by luck, and lands on forms people already know: `==highlight==` from
 * Obsidian, `~~struck~~` from GitHub.
 *
 * See test/prose.test.js, which holds the corpus this was measured against.
 * A new delimiter should keep `minSize: 2` unless measured otherwise.
 */

/** Elements written with a paired delimiter character. */
export const delimiterElements = [
  {
    tag: 'mark',
    node: 'mark',
    marker: '=',
    minSize: 2,
    example: '==marked==',
    describe: 'Text of special relevance in its context.',
  },
  {
    tag: 'dfn',
    node: 'dfn',
    marker: '+',
    minSize: 2,
    example: '++defined term++',
    describe: 'The defining instance of a term.',
  },
  {
    tag: 's',
    node: 'strikethrough',
    marker: '~',
    minSize: 2,
    example: '~~struck~~',
    describe: 'Content no longer accurate or no longer relevant.',
  },
  {
    tag: 'sup',
    node: 'superscript',
    marker: '^',
    minSize: 2,
    example: 'e^^iπ^^',
    describe: 'Superscript.',
  },
  {
    tag: 'sub',
    node: 'subscript',
    marker: '%',
    minSize: 2,
    example: 'H%%2%%O',
    describe: 'Subscript.',
  },
];

/** Elements written as `[text]{tag}`. `attribute` is filled from the value. */
export const spanElements = [
  {
    tag: 'cite',
    attribute: null,
    example: '[The Waste Land]{cite}',
    describe: 'The title of a cited creative work.',
  },
  {
    tag: 'q',
    attribute: 'cite',
    example: '[to be or not to be]{q}',
    describe: 'A short inline quotation. Value sets `cite`.',
  },
  {
    tag: 'abbr',
    attribute: 'title',
    example: '[HTML]{abbr HyperText Markup Language}',
    describe: 'An abbreviation. Value sets `title`.',
  },
];

/** Every element, in one list. */
export const allElements = [...delimiterElements, ...spanElements];

/** Every tag name a user may pass to `--custom`. */
export const elementTags = allElements.map((element) => element.tag);

/**
 * Resolve a comma-separated selection into registry entries.
 *
 * @param {string[] | true | undefined} selection
 *   `true` (or undefined) selects everything; an array selects by tag name.
 * @returns {{delimiters: typeof delimiterElements, spans: typeof spanElements}}
 * @throws {Error} When a name is not a known element.
 */
export function selectElements(selection) {
  if (selection === true || selection === undefined) {
    return { delimiters: delimiterElements, spans: spanElements };
  }

  const wanted = new Set(selection);

  for (const name of wanted) {
    if (!elementTags.includes(name)) {
      throw new Error(
        `Unknown element '${name}'. Known elements: ${elementTags.join(', ')}.`,
      );
    }
  }

  return {
    delimiters: delimiterElements.filter((element) => wanted.has(element.tag)),
    spans: spanElements.filter((element) => wanted.has(element.tag)),
  };
}
