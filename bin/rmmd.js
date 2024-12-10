#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import { program } from 'commander';
import { markdownToHtml } from '../lib/markdownToHtml.js';
import { wrapInHtmlDocument } from '../lib/wrapHtml.js';

const packageJson = {
  name: 'rmmd',
  version: '1.0.0',
};

program
  .name(packageJson.name)
  .description('A command-line tool to convert Markdown to HTML')
  .version(packageJson.version, '-v, --version', 'Output the version number')
  .option('-f, --file <path>', 'Write output to a file instead of stdout')
  .option('-e, --enclose', 'Wrap output in a fully compliant HTML document')
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

    let output = await markdownToHtml(input);

    if (options.enclose) {
      output = wrapInHtmlDocument(output);
    }

    if (options.file) {
      await writeFile(options.file, output, 'utf8');
      console.log(`HTML output written to ${options.file}`);
    } else {
      stdout.write(output);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
