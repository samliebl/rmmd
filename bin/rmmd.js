#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import process, { stdin, stdout, stderr } from 'node:process';
import { program, Option } from 'commander';
import { render } from '../lib/render.js';
import { wrapInHtmlDocument } from '../lib/wrapHtml.js';
import { allElements, elementTags } from '../lib/elements.js';
import { findLegacySyntax } from '../lib/legacy.js';

// A downstream reader may close the pipe early (`rmmd big.md | head`).
// That is normal, not an error: stop quietly rather than crashing on EPIPE.
stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

/** Read all of stdin. */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => (data += chunk));
    stdin.on('end', () => resolve(data));
    stdin.on('error', reject);
  });
}

/** Print the element registry as a reference table. */
function listElements() {
  const width = Math.max(...allElements.map((e) => e.example.length));
  stdout.write('\nrmmd semantic elements\n\n');
  for (const element of allElements) {
    stdout.write(
      `  ${element.example.padEnd(width)}  ->  <${element.tag}>\n` +
        `  ${' '.repeat(width)}      ${element.describe}\n\n`,
    );
  }
  stdout.write(
    `  *[TERM]: expansion${' '.repeat(Math.max(0, width - 18))}  ->  <abbr>\n` +
      `  ${' '.repeat(width)}      Defines an abbreviation, expanded everywhere.\n\n` +
      `Enable all with --custom, or a subset with ` +
      `--elements ${elementTags.slice(0, 2).join(',')}\n\n`,
  );
}

program
  .name(packageJson.name)
  .description(
    'Convert Markdown to HTML, with syntax for the semantic inline elements\n' +
      'Markdown leaves out: <mark> <dfn> <s> <sup> <sub> <cite> <q> <abbr>.',
  )
  .version(packageJson.version, '-v, --version', 'Output the version number')
  .argument('[files...]', 'Markdown files to process; omit to read stdin')
  .option('-o, --output <path>', 'Write output to a file instead of stdout')
  .option('-d, --out-dir <dir>', 'Write each input to its own .html file here')
  .option('-e, --enclose', 'Wrap output in a full HTML document')
  .option('-c, --custom', 'Enable rmmd\'s semantic elements')
  .option(
    '--elements <list>',
    `Enable only these elements, comma separated\n` +
      `                             (${elementTags.join(', ')})`,
  )
  .option('--title <text>', 'Document title for --enclose (default: first H1)')
  .option('--lang <code>', 'Document language for --enclose', 'en')
  .option('--css <href...>', 'Stylesheet to link from --enclose')
  .option('--no-gfm', 'Disable tables, task lists, autolinks and footnotes')
  .option('--no-html', 'Drop raw HTML present in the Markdown source')
  .option('--list', 'List the semantic elements and their syntax')
  .option(
    '--legacy-check',
    'Report passages using rmmd 2.x single-delimiter syntax',
  )
  .addOption(new Option('-f, --file <path>', 'Alias for --output').hideHelp());

program.parse(process.argv);

const options = program.opts();
const files = program.args;

/**
 * Resolve --custom / --elements into what render() expects.
 *
 * These are two flags rather than one optional-argument flag because
 * `rmmd -c file.md` would otherwise read the filename as the element list.
 */
function customSelection() {
  if (options.elements !== undefined) {
    return options.elements
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }
  return options.custom ? true : false;
}

async function renderOne(source, input) {
  const { html, title } = await render(input, {
    elements: customSelection(),
    gfm: options.gfm,
    allowHtml: options.html,
  });

  if (!options.enclose) return html;

  return wrapInHtmlDocument(html, {
    title: options.title ?? title ?? (source ? basename(source) : 'Untitled'),
    lang: options.lang,
    stylesheets: options.css ?? [],
  });
}

/**
 * Report 2.x syntax without rendering anything.
 *
 * Exits non-zero when something is found, so it can gate a migration.
 */
async function legacyCheck(sources) {
  let total = 0;

  for (const { name, text } of sources) {
    const found = findLegacySyntax(text);
    if (found.length === 0) continue;

    total += found.length;
    stdout.write(`\n${name}\n`);
    for (const hit of found) {
      stdout.write(
        `  ${String(hit.line).padStart(4)}:${String(hit.column).padEnd(3)} ` +
          `${JSON.stringify(hit.text)} would have been <${hit.tag}> in 2.x\n`,
      );
    }
  }

  if (total === 0) {
    stderr.write('No rmmd 2.x syntax found.\n');
    return;
  }

  stderr.write(
    `\n${total} passage${total === 1 ? '' : 's'} would render as literal text.\n` +
      `Double the delimiters you meant as markup; leave the rest alone.\n`,
  );
  process.exitCode = 1;
}

async function main() {
  if (options.list) {
    listElements();
    return;
  }

  const output = options.output ?? options.file;

  if (options.legacyCheck) {
    const sources =
      files.length > 0
        ? await Promise.all(
            files.map(async (name) => ({
              name,
              text: await readFile(name, 'utf8'),
            })),
          )
        : [{ name: '<stdin>', text: await readStdin() }];
    await legacyCheck(sources);
    return;
  }

  if (options.outDir && output) {
    throw new Error(
      '--out-dir writes one file per input and --output writes a single ' +
        'file; use one or the other.',
    );
  }

  // Per-file output: each input becomes its own document.
  if (options.outDir) {
    if (files.length === 0) {
      throw new Error('--out-dir needs at least one input file.');
    }

    // Inputs from different directories can share a basename. Refuse rather
    // than let the second write silently destroy the first.
    const targets = new Map();
    for (const source of files) {
      const target = join(
        options.outDir,
        `${basename(source, extname(source))}.html`,
      );
      if (targets.has(target)) {
        throw new Error(
          `${source} and ${targets.get(target)} would both be written to ` +
            `${target}. Rename one, or run them separately.`,
        );
      }
      targets.set(target, source);
    }

    await mkdir(options.outDir, { recursive: true });

    for (const [target, source] of targets) {
      const result = await renderOne(source, await readFile(source, 'utf8'));
      await writeFile(target, result, 'utf8');
      stderr.write(`${source} -> ${target}\n`);
    }

    return;
  }

  let results;

  if (files.length > 0) {
    results = [];
    for (const source of files) {
      results.push(await renderOne(source, await readFile(source, 'utf8')));
    }
  } else if (!stdin.isTTY) {
    results = [await renderOne(null, await readStdin())];
  } else {
    // Nothing piped and no file named: show help rather than hanging.
    program.outputHelp({ error: true });
    stderr.write('\nNo input. Name a Markdown file or pipe content in.\n');
    process.exitCode = 1;
    return;
  }

  // Always leave the stream on a newline boundary.
  const joined = results.join('\n');
  const result = joined.endsWith('\n') ? joined : `${joined}\n`;

  if (output) {
    await writeFile(output, result, 'utf8');
    // Status goes to stderr so stdout stays a clean data stream.
    stderr.write(`HTML written to ${output}\n`);
  } else {
    stdout.write(result);
  }
}

main().catch((error) => {
  // Markdown nested thousands of levels deep exhausts the stack inside
  // mdast-to-hast. Say so, rather than repeating the engine's message.
  if (error instanceof RangeError && /call stack/i.test(error.message)) {
    stderr.write(
      'rmmd: the document nests too deeply to convert ' +
        '(thousands of levels of list, quote or emphasis).\n',
    );
  } else {
    stderr.write(`rmmd: ${error.message}\n`);
  }
  process.exitCode = 1;
});
