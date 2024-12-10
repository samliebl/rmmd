# rmmd

`rmmd` is a lightweight command-line tool to convert Markdown into HTML. It supports standard input, file processing, and advanced options for wrapping output in a full HTML document. Built on unified.js.

<h2 id="Contents">Contents</h2>

1. [Features](#Features)
1. [Installation](#Installation)
1. [Usage](#Usage)
1. [Examples](#Examples)
1. [Output Formats](#OutputFormats)
1. [Error Handling](#ErrorHandling)
1. [Developer Notes](#DeveloperNotes)
1. [Contributing](#Contributing)
1. [License](#License)

---

<h2 id="Features">Features</h2>

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
  - Use `--custom` (`-c`) to enable custom syntax processing.
  - Leave out `--custom` to process only basic Markdown.
- **Modern Web Standards**: Outputs valid HTML5 for browser compatibility.
- **Custom Markup Syntax**:
  - `=` wraps text in `<mark>`:
    ```markdown
    This is =marked text= in markdown.
    ```
    Produces:
    ```html
    <p>This is <mark>marked text</mark> in markdown.</p>
    ```
  - `+` wraps text in `<dfn>`:
    ```markdown
    This is +a definition text+ in markdown.
    ```
    Produces:
    ```html
    <p>This is <dfn>a definition text</dfn> in markdown.</p>
    ```
  - `~` wraps text in `<s>`:
    ```markdown
    This is ~a styled text passage~ in markdown.
    ```
    Produces:
    ```html
    <p>This is <s>a styled text passage</s> in markdown.</p>
    ```

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

<h2 id="Examples">Examples</h2>

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
6. Convert Markdown to HTML with basic syntax:
   ```bash
   rmmd example.md
   ```
7. Convert Markdown to HTML with custom syntax:
   ```bash
   rmmd example.md --custom
   ```
8. Wrap the output in an HTML document:
   ```bash
   rmmd example.md --enclose
   ```
9. Combine custom syntax, file output, and HTML wrapping:
   ```bash
   rmmd example.md --custom --enclose --file output.html
   ```

<h2 id="OutputFormats">Output Formats</h2>

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
</html>
```

<h2 id="ErrorHandling">Error Handling</h2>

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

<h2 id="DeveloperNotes">Developer Notes</h2>

The tool is modular, using separate libraries for Markdown processing and HTML wrapping. It follows modern ESM standards.

### Project Structure

```plaintext
rmmd/
|-- bin/
|   |-- rmmd.js               # CLI logic
|-- lib/
|   |-- customMarkup.js          # Custom markup manager
|   |-- markdownToHtml.js        # Markdown to HTML conversion
|   |-- remarkMark.js            # <mark> syntax plugin
|   |-- remarkDfn.js             # <dfn> syntax plugin
|   |-- remarkStrikethrough.js   # <s> syntax plugin
|   |-- wrapHtml.js              # HTML wrapping logic
```

### Internal Modules

- `markdownToHtml.js`: Handles Markdown-to-HTML conversion.
- `wrapHtml.js`: Wraps HTML output in a complete HTML document.

### Adding New Syntax

1. Create a new plugin file in `lib/`.
2. Register it in `customMarkup.js`.
3. Enable it in the `customMarkup` function call in `markdownToHtml.js`.

<h2 id="Contributing">Contributing</h2>

Contributions welcome! Follow these steps:

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

<h2 id="License">License</h2>

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

Enjoy! -SL