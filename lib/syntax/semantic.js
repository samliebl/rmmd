/**
 * The remark plugin that mounts rmmd's semantic elements.
 *
 * Each registry entry becomes a micromark extension (which parses) plus an
 * mdast extension (which builds the node). Nodes carry `data.hName`, so
 * remark-rehype renders the element and escapes its content -- text is never
 * assembled into raw HTML strings.
 */

import { inlineAttention } from './inlineAttention.js';
import { span, spanFromMarkdown } from './span.js';
import { selectElements } from '../elements.js';

/** mdast extension for the delimiter elements. */
function delimitersFromMarkdown(elements) {
  const enter = {};
  const exit = {};

  for (const element of elements) {
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

  return {
    canContainEols: elements.map((element) => element.node),
    enter,
    exit,
  };
}

/**
 * @param {{elements?: string[] | true}} [options]
 *   `elements` selects by tag name; omit for all of them.
 */
export function remarkSemantic(options = {}) {
  const { delimiters, spans } = selectElements(options.elements);
  if (delimiters.length === 0 && spans.length === 0) return;

  const data = this.data();
  const micromarkExtensions =
    data.micromarkExtensions ?? (data.micromarkExtensions = []);
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = []);

  for (const element of delimiters) {
    micromarkExtensions.push(
      inlineAttention({ marker: element.marker, name: element.node }),
    );
  }

  if (delimiters.length > 0) {
    fromMarkdownExtensions.push(delimitersFromMarkdown(delimiters));
  }

  if (spans.length > 0) {
    const tags = new Map(spans.map((element) => [element.tag, element]));
    micromarkExtensions.push(span({ tags }));
    fromMarkdownExtensions.push(spanFromMarkdown(tags));
  }
}
