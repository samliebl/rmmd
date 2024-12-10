
# rmmd

`rmmd` is a lightweight command-line tool to convert Markdown into HTML. It supports standard input, file processing, and advanced options for wrapping output in a full HTML document. Built on unified.js.

## Features

- **Convert Markdown to HTML**: Quickly process Markdown files or input streams into semantic HTML.
- **Flexible Input Options**: Provide input via a file, stdin, or direct piping from another command.
- **File Output**: Write the output to a file using the `--file` or `-f` option.
- **Full HTML Document Wrapping**: Use the `--enclose` or `-e` option to wrap the HTML content in a complete, standards-compliant HTML document.
- **Command-line Options**:
  - Process a file or piped content by default.
  - `--file` (`-f`): Specify a file to write the output.
  - `--enclose` (`-e`): Wrap output in a fully compliant HTML document.
  - `--version` (`-v`): Output the version.
  - `--help` (`-h`): Display help information.
- **Modern Web Standards**: Outputs valid HTML5 for browser compatibility.

## Installation

Install **rmmd** globally using npm:

```bash
npm install -g rmmd
```

This makes the `rmmd` command available globally on your system.

## Usage

### Basic Conversion

Convert a Markdown file to HTML:

```bash
rmmd example.md
```

### Piping Markdown Content

Pipe Markdown content directly into `rmmd`:

```bash
cat example.md | rmmd
```

### Write to a File

Use the `--file` or `-f` option to specify an output file:

```bash
rmmd example.md -f output.html
```

### Wrap Output in an HTML Document

Use the `--enclose` or `-e` option to wrap the output in a complete HTML document:

```bash
rmmd example.md -e
```

Combine it with file output:

```bash
rmmd example.md -e -f wrapped.html
```

### Display Version and Help

Check the version:

```bash
rmmd -v
```

Display help:

```bash
rmmd -h
```

## Examples

1. Convert Markdown to HTML and print to `stdout`:
   ```bash
   rmmd example.md
   ```

2. Convert Markdown and write output to a file:
   ```bash
   rmmd example.md -f result.html
   ```

3. Convert Markdown, wrap in an HTML document, and print:
   ```bash
   rmmd example.md -e
   ```

4. Convert, wrap, and save to a file:
   ```bash
   rmmd example.md -e -f full-document.html
   ```

5. Pipe Markdown content into `rmmd` and wrap in a document:
   ```bash
   cat example.md | rmmd -e
   ```

## Output Formats

### Default HTML Output

By default, the tool converts Markdown to clean HTML:

```html
<h1>Hello, World</h1>
<p>This is Markdown rendered as HTML.</p>
```

### Enclosed HTML Output

Using the `--enclose` option wraps the output in a valid HTML document:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Output</title>
</head>
<body>
  <h1>Hello, World</h1>
  <p>This is Markdown rendered as HTML.</p>
</body>
</html>`
```

## Error Handling

The tool provides helpful error messages:

- If no input is provided:
  ```
  No input provided. Use a file path or pipe Markdown content.
  ```
- If the specified file does not exist:
  ```
  Error: ENOENT: no such file or directory, open 'example.md'
  ```
- If invalid options are passed:
  ```
  error: unknown option '--invalid'
  ```

## Developer Notes

The tool is modular, using separate libraries for Markdown processing and HTML wrapping. It follows modern ESM standards.

### Project Structure

```plaintext
rmmd/
|-- bin/
|   |-- rmmd.js            # CLI logic
|-- lib/
|   |-- markdownToHtml.js  # Markdown to HTML conversion
|   |-- wrapHtml.js        # HTML wrapping logic
|-- package.json           # npm package configuration
|-- README.md              # Project documentation
```

### Internal Modules

- `markdownToHtml.js`: Handles Markdown-to-HTML conversion.
- `wrapHtml.js`: Wraps HTML output in a complete HTML document.

## Contributing

We welcome contributions! Follow these steps:

1. Fork the repository.
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

Enjoy using **rmmd**!
