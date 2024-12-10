export function wrapInHtmlDocument(content) {
  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Output</title>
</head>
<body>
    ${content}
</body>
</html>`;
}
