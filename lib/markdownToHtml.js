import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { customMarkup } from './customMarkup.js';

export async function markdownToHtml(input, options = { useCustomSyntax: false }) {
  const selectedPlugins = options.useCustomSyntax
    ? customMarkup(['remarkMark', 'remarkDfn', 'remarkStrikethrough'])
    : [];

  const processor = unified()
    .use(remarkParse)
    .use(selectedPlugins) // Add custom plugins if enabled
    .use(remarkRehype, { allowDangerousHtml: true }) // Allow inline HTML
    .use(rehypeStringify, { allowDangerousHtml: true }); // Serialize with inline HTML

  const file = await processor.process(input);
  return String(file);
}
