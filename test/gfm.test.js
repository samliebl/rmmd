import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/render.js';

test('GFM constructs are on by default', async () => {
  const { html } = await render('| a |\n|---|\n| 1 |');
  assert.match(html, /<table>/);

  const task = await render('- [x] done');
  assert.match(task.html, /type="checkbox" checked/);

  const link = await render('See https://example.com now');
  assert.match(link.html, /<a href="https:\/\/example\.com">/);

  const note = await render('Text.[^1]\n\n[^1]: A note.');
  assert.match(note.html, /class="footnotes"/);
});

test('GFM can be turned off', async () => {
  const { html } = await render('| a |\n|---|\n| 1 |', { gfm: false });
  assert.doesNotMatch(html, /<table>/);
});

test('the tilde belongs to rmmd, not to GFM strikethrough', async () => {
  // GFM would render <del>; in rmmd the tilde means <s> -- "no longer
  // accurate" rather than "edited out" -- in both single and double form.
  const single = await render('~struck~', { elements: true });
  assert.equal(single.html.trim(), '<p><s>struck</s></p>');

  const double = await render('~~struck~~', { elements: true });
  assert.equal(double.html.trim(), '<p><s>struck</s></p>');

  assert.doesNotMatch(single.html, /<del>/);
  assert.doesNotMatch(double.html, /<del>/);
});

test('semantic elements coexist with GFM tables', async () => {
  const { html } = await render('| a |\n|---|\n| ==hi== |', { elements: true });
  assert.match(html, /<td><mark>hi<\/mark><\/td>/);
});

test('raw HTML passes through by default and can be dropped', async () => {
  const kept = await render('<div>x</div>');
  assert.match(kept.html, /<div>x<\/div>/);

  const dropped = await render('<div>x</div>', { allowHtml: false });
  assert.doesNotMatch(dropped.html, /<div>/);
});
