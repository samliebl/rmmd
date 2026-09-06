import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/render.js';

async function html(input, options = {}) {
  const { html } = await render(input, { elements: true, ...options });
  return html.trim();
}

test('a definition expands every later occurrence', async () => {
  const out = await html('*[HTML]: HyperText Markup Language\n\nI write HTML.');
  assert.equal(
    out,
    '<p>I write <abbr title="HyperText Markup Language">HTML</abbr>.</p>',
  );
});

test('the definition line is removed from the output', async () => {
  const out = await html('*[HTML]: HyperText Markup Language\n\nText.');
  assert.doesNotMatch(out, /\*\[HTML\]/);
  assert.equal(out, '<p>Text.</p>');
});

test('several definitions can share a block', async () => {
  const out = await html(
    '*[HTML]: HyperText Markup Language\n*[CSS]: Cascading Style Sheets\n\nHTML and CSS.',
  );
  assert.match(out, /<abbr title="HyperText Markup Language">HTML<\/abbr>/);
  assert.match(out, /<abbr title="Cascading Style Sheets">CSS<\/abbr>/);
});

test('terms match whole words only', async () => {
  const out = await html('*[HTML]: HyperText Markup Language\n\nAn HTMLElement.');
  assert.doesNotMatch(out, /<abbr/);
});

test('matching is case sensitive', async () => {
  const out = await html('*[HTML]: HyperText Markup Language\n\nlowercase html.');
  assert.doesNotMatch(out, /<abbr/);
});

test('code spans are not expanded', async () => {
  const out = await html('*[HTML]: HyperText Markup Language\n\nThe `HTML` literal.');
  assert.equal(out, '<p>The <code>HTML</code> literal.</p>');
});

test('an explicit inline abbreviation wins', async () => {
  const out = await html(
    '*[HTML]: HyperText Markup Language\n\n[HTML]{abbr Something Else}',
  );
  assert.equal(out, '<p><abbr title="Something Else">HTML</abbr></p>');
});

test('the longest matching term wins', async () => {
  const out = await html(
    '*[HTML]: HyperText Markup Language\n*[HTML5]: HyperText Markup Language 5\n\nHTML5 here.',
  );
  assert.match(out, /<abbr title="HyperText Markup Language 5">HTML5<\/abbr>/);
});

test('titles are escaped', async () => {
  const out = await html('*[X]: a "quoted" & thing\n\nX here.');
  assert.match(out, /title="a &#x22;quoted&#x22; &#x26; thing"/);
});

test('terms containing regex characters are literal', async () => {
  const out = await html('*[C++]: The C plus plus language\n\nI use C++ daily.');
  assert.match(out, /<abbr title="The C plus plus language">C\+\+<\/abbr>/);
});

test('a paragraph that only looks like a definition is left alone', async () => {
  const out = await html('This *[is]: not a definition line.');
  assert.match(out, /not a definition/);
});

test('definitions require the abbr element to be enabled', async () => {
  const off = await render('*[HTML]: HyperText Markup Language\n\nHTML.', {
    elements: ['mark'],
  });
  assert.doesNotMatch(off.html, /<abbr/);

  const on = await render('*[HTML]: HyperText Markup Language\n\nHTML.', {
    elements: ['abbr'],
  });
  assert.match(on.html, /<abbr/);
});

test('expansion works inside headings and lists', async () => {
  const out = await html('*[API]: Application Programming Interface\n\n# The API\n\n- API note');
  assert.match(out, /<h1>The <abbr title="Application Programming Interface">API<\/abbr><\/h1>/);
  assert.match(out, /<li><abbr title="Application Programming Interface">API<\/abbr> note<\/li>/);
});

test('an over-long term is ignored rather than crashing', async () => {
  // A 50k-character term once built a pattern the regex engine refused to
  // compile, throwing an opaque SyntaxError from inside the renderer.
  const term = 'A'.repeat(50000);
  const out = await html(`*[${term}]: expansion\n\n${term}`);
  assert.doesNotMatch(out, /<abbr/);
});

test('a term at the length limit still works', async () => {
  const term = 'B'.repeat(100);
  const out = await html(`*[${term}]: ok\n\n${term}`);
  assert.match(out, /<abbr title="ok">/);
});

test('very many definitions are matched in batches', async () => {
  const defs = Array.from({ length: 20000 }, (_, i) => `*[T${i}]: E${i}`).join('\n');
  const body = Array.from({ length: 50 }, (_, i) => `T${i} here.`).join(' ');
  const out = await html(`${defs}\n\n${body}`);
  assert.equal((out.match(/<abbr/g) ?? []).length, 50);
});

test('longest match still wins across batches', async () => {
  // Enough terms to force several batches, with an overlapping pair.
  const filler = Array.from({ length: 5000 }, (_, i) => `*[F${i}]: f${i}`).join('\n');
  const out = await html(`${filler}\n*[HTML]: HyperText\n*[HTML5]: HyperText 5\n\nHTML5 here.`);
  assert.match(out, /<abbr title="HyperText 5">HTML5<\/abbr>/);
});
