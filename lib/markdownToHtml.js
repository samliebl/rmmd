import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export async function markdownToHtml(input) {
  const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);
  const file = await processor.process(input);
  return String(file);
}
