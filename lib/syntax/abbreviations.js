/**
 * Abbreviation definitions.
 *
 *     *[HTML]: HyperText Markup Language
 *
 *     HTML is everywhere.
 *
 * gives
 *
 *     <p><abbr title="HyperText Markup Language">HTML</abbr> is everywhere.</p>
 *
 * The definition line is removed from the output and every later occurrence of
 * the term is wrapped. This is the convention Markdown Extra established, and
 * it is the right ergonomics for the job: an abbreviation is defined once and
 * expanded everywhere, which is exactly what `<abbr title>` is for.
 *
 * Unlike the inline elements this runs on the syntax tree rather than in the
 * tokenizer, because it matches whole words rather than delimiters. It still
 * builds real nodes, so content is escaped on the way out.
 */

import { visit, SKIP } from 'unist-util-visit';

/** `*[TERM]: expansion` */
const DEFINITION = /^\*\[([^\]]+)\]:[ \t]*(.*)$/;

/** Escape a term for use inside a regular expression. */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Collect definitions, removing their paragraphs from the tree.
 * @returns {Map<string, string>}
 */
function collectDefinitions(tree) {
  const definitions = new Map();

  visit(tree, 'paragraph', (node, index, parent) => {
    // A definition block is a paragraph made only of definition lines.
    if (node.children.length !== 1 || node.children[0].type !== 'text') return;

    const lines = node.children[0].value.split('\n');
    const matches = lines.map((line) => DEFINITION.exec(line));

    if (!matches.every(Boolean)) return;

    for (const match of matches) {
      const term = match[1].trim();
      const title = match[2].trim();
      if (term) definitions.set(term, title);
    }

    parent.children.splice(index, 1);
    return [SKIP, index];
  });

  return definitions;
}

/**
 * Wrap occurrences of defined terms in `<abbr>` nodes.
 *
 * Terms are matched whole, longest first, and case-sensitively -- `HTML` and
 * `html` are different abbreviations, and usually only one of them is meant.
 */
function applyDefinitions(tree, definitions) {
  const terms = [...definitions.keys()].sort((a, b) => b.length - a.length);
  if (terms.length === 0) return;

  // `\w` boundaries so `HTML` does not match inside `HTMLElement`.
  const pattern = new RegExp(
    `(?<!\\w)(${terms.map(escapeRegExp).join('|')})(?!\\w)`,
    'g',
  );

  visit(tree, 'text', (node, index, parent) => {
    if (!parent || index === undefined) return;
    // Do not expand a term that is already inside an abbreviation.
    if (parent.data?.hName === 'abbr') return;

    const children = [];
    let lastIndex = 0;

    for (const match of node.value.matchAll(pattern)) {
      if (match.index > lastIndex) {
        children.push({
          type: 'text',
          value: node.value.slice(lastIndex, match.index),
        });
      }

      children.push({
        type: 'abbreviation',
        data: {
          hName: 'abbr',
          hProperties: { title: definitions.get(match[1]) },
        },
        children: [{ type: 'text', value: match[1] }],
      });

      lastIndex = match.index + match[1].length;
    }

    if (children.length === 0) return;

    if (lastIndex < node.value.length) {
      children.push({ type: 'text', value: node.value.slice(lastIndex) });
    }

    parent.children.splice(index, 1, ...children);
    // Skip past what we just inserted rather than rescanning it.
    return [SKIP, index + children.length];
  });
}

/**
 * remark plugin: `*[TERM]: expansion` definitions.
 */
export function remarkAbbreviations() {
  return function transformer(tree) {
    const definitions = collectDefinitions(tree);
    applyDefinitions(tree, definitions);
  };
}
