/**
 * Wrap an HTML fragment in a complete, standards-compliant document.
 */

/** Escape a string for use in text content or a double-quoted attribute. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} content - The rendered HTML fragment.
 * @param {object} [options]
 * @param {string} [options.title='Untitled'] - Document title.
 * @param {string} [options.lang='en'] - Value for the `lang` attribute.
 * @param {string[]} [options.stylesheets=[]] - Hrefs to link.
 * @returns {string}
 */
export function wrapInHtmlDocument(content, options = {}) {
  const { title = 'Untitled', lang = 'en', stylesheets = [] } = options;

  const links = stylesheets
    .map((href) => `\n    <link rel="stylesheet" href="${escapeHtml(href)}">`)
    .join('');

  // Indent the fragment one level to sit correctly inside <body>.
  const body = content
    .replace(/\n+$/, '')
    .split('\n')
    .map((line) => (line ? `    ${line}` : line))
    .join('\n');

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>${links}
</head>
<body>
${body}
</body>
</html>
`;
}
