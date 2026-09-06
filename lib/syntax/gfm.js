/**
 * GFM, composed by hand so that `~` stays rmmd's.
 *
 * `remark-gfm` is all-or-nothing, and its strikethrough construct claims the
 * tilde for `<del>`. In rmmd the tilde means `<s>` -- "no longer accurate"
 * rather than "edited out" -- so this module assembles the other four GFM
 * constructs and leaves the tilde alone.
 *
 * Everything here is the same code `remark-gfm` would have pulled in; only
 * strikethrough is left out.
 */

import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { gfmAutolinkLiteral } from 'micromark-extension-gfm-autolink-literal';
import { gfmAutolinkLiteralFromMarkdown } from 'mdast-util-gfm-autolink-literal';
import { gfmTaskListItem } from 'micromark-extension-gfm-task-list-item';
import { gfmTaskListItemFromMarkdown } from 'mdast-util-gfm-task-list-item';
import { gfmFootnote } from 'micromark-extension-gfm-footnote';
import { gfmFootnoteFromMarkdown } from 'mdast-util-gfm-footnote';

/**
 * Tables, autolinks, task list items and footnotes. No strikethrough.
 */
export function remarkGfmWithoutStrikethrough() {
  const data = this.data();
  const micromarkExtensions =
    data.micromarkExtensions ?? (data.micromarkExtensions = []);
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = []);

  micromarkExtensions.push(
    gfmTable(),
    gfmAutolinkLiteral(),
    gfmTaskListItem(),
    gfmFootnote(),
  );

  fromMarkdownExtensions.push(
    gfmTableFromMarkdown(),
    gfmAutolinkLiteralFromMarkdown(),
    gfmTaskListItemFromMarkdown(),
    gfmFootnoteFromMarkdown(),
  );
}
