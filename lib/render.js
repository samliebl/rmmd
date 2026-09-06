/**
 * The rmmd rendering pipeline.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import { remarkSemantic } from './syntax/semantic.js';
import { remarkAbbreviations } from './syntax/abbreviations.js';
import { remarkGfmWithoutStrikethrough } from './syntax/gfm.js';

/**
 * Record the first level-one heading on the virtual file, so `--enclose` can
 * give the document a real `<title>` instead of a placeholder.
 */
function remarkCaptureTitle() {
  return function transformer(tree, file) {
    visit(tree, 'heading', (node) => {
      if (node.depth === 1 && !file.data.title) {
        file.data.title = toString(node);
      }
    });
  };
}

/**
 * Convert Markdown to an HTML fragment.
 *
 * @param {string} input
 * @param {object} [options]
 * @param {string[] | true | false} [options.elements=false]
 *   rmmd's semantic elements: `true` for all, an array of tag names to select,
 *   `false` to disable.
 * @param {boolean} [options.gfm=true]
 *   Tables, task lists, autolinks and footnotes.
 * @param {boolean} [options.allowHtml=true]
 *   Pass raw HTML in the source through to the output.
 * @returns {Promise<{html: string, title: string | undefined}>}
 */
export async function render(input, options = {}) {
  const { elements = false, gfm = true, allowHtml = true } = options;

  const processor = unified().use(remarkParse);

  if (gfm) processor.use(remarkGfmWithoutStrikethrough);
  if (elements !== false) {
    processor.use(remarkSemantic, { elements });

    // `*[TERM]: expansion` belongs to <abbr>, so it follows that element.
    const wantsAbbr = elements === true || elements.includes('abbr');
    if (wantsAbbr) processor.use(remarkAbbreviations);
  }

  processor
    .use(remarkCaptureTitle)
    .use(remarkRehype, { allowDangerousHtml: allowHtml })
    .use(rehypeStringify, { allowDangerousHtml: allowHtml });

  const file = await processor.process(input);

  return { html: String(file), title: file.data.title };
}
