#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import { program } from 'commander';
import { markdownToHtml } from '../lib/markdownToHtml.js';
import { wrapInHtmlDocument } from '../lib/wrapHtml.js';

// Dynamically read the package.json file to get the version
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

program
  .name(packageJson.name)
  .description('A command-line tool to convert Markdown to HTML')
  .version(packageJson.version, '-v, --version', 'Output the version number')
  .option('-f, --file <path>', 'Write output to a file instead of stdout')
  .option('-e, --enclose', 'Wrap output in a fully compliant HTML document')
  .option('-c, --custom', 'Enable all custom syntax processing')
  .argument('[filepath]', 'Path to a Markdown file to process (optional)', null);

program.parse(process.argv);

const options = program.opts();
const filepath = program.args[0];

async function main() {
  try {
    let input = '';

    if (filepath) {
      input = await readFile(filepath, 'utf8');
    } else if (!stdin.isTTY) {
      input = await new Promise((resolve, reject) => {
        let data = '';
        stdin.on('data', chunk => (data += chunk));
        stdin.on('end', () => resolve(data));
        stdin.on('error', reject);
      });
    } else {
      console.error('No input provided. Use a file path or pipe Markdown content.');
      process.exit(1);
    }

    // Process the Markdown with or without custom syntax
    const output = await markdownToHtml(input, { useCustomSyntax: options.custom });

    // Optionally wrap in a full HTML document
    const finalOutput = options.enclose ? wrapInHtmlDocument(output) : output;

    if (options.file) {
      await writeFile(options.file, finalOutput, 'utf8');
      console.log(`HTML output written to ${options.file}`);
    } else {
      stdout.write(finalOutput);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
