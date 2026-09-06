/**
 * Finding 2.x syntax in a document.
 *
 * rmmd 2.x matched single delimiters: `=marked=`, `+dfn+`, `~s~`. rmmd 3
 * requires them doubled, so a passage written for 2.x now renders as literal
 * text -- visibly wrong on the page, but nothing fails at build time. That is
 * the one upgrade hazard worth tooling.
 *
 * This deliberately reports rather than rewrites. 2.x matched *any* two
 * delimiters on a line, so some of what it produced was markup the author
 * meant and some was `--color=always` being torn in half. Only the author can
 * tell those apart, so `rmmd --legacy-check` points at each passage and leaves
 * the judgement where it belongs.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { inlineAttention } from './syntax/inlineAttention.js';
import { delimiterElements } from './elements.js';

/** A processor that matches delimiters the way 2.x did: one character. */
function legacyProcessor() {
  function plugin() {
    const data = this.data();
    const micromarkExtensions =
      data.micromarkExtensions ?? (data.micromarkExtensions = []);
    const fromMarkdownExtensions =
      data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = []);

    const enter = {};
    const exit = {};

    for (const element of delimiterElements) {
      micromarkExtensions.push(
        inlineAttention({ marker: element.marker, name: element.node, minSize: 1 }),
      );
      enter[element.node] = function (token) {
        this.enter(
          { type: element.node, children: [], data: { hName: element.tag } },
          token,
        );
      };
      exit[element.node] = function (token) {
        this.exit(token);
      };
    }

    fromMarkdownExtensions.push({ enter, exit });
  }

  return unified().use(remarkParse).use(plugin);
}

const nodeTypes = new Set(delimiterElements.map((element) => element.node));
const tagByNode = new Map(
  delimiterElements.map((element) => [element.node, element.tag]),
);
const markerByNode = new Map(
  delimiterElements.map((element) => [element.node, element.marker]),
);

/**
 * Find passages that 2.x would have turned into an element and 3 will not.
 *
 * @param {string} input - Markdown source.
 * @returns {Array<{line: number, column: number, text: string, tag: string}>}
 */
export function findLegacySyntax(input) {
  const tree = legacyProcessor().parse(input);
  const found = [];

  visit(tree, (node) => {
    if (!nodeTypes.has(node.type) || !node.position) return;

    const { start, end } = node.position;
    const marker = markerByNode.get(node.type);

    // A doubled run is valid in 3 as well, so it is not a finding.
    if (input.slice(start.offset, start.offset + 2) === marker + marker) return;

    found.push({
      line: start.line,
      column: start.column,
      text: input.slice(start.offset, end.offset),
      tag: tagByNode.get(node.type),
    });
  });

  return found.sort((a, b) => a.line - b.line || a.column - b.column);
}
