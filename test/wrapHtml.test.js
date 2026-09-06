import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapInHtmlDocument } from '../lib/wrapHtml.js';
import { render } from '../lib/render.js';

test('produces a complete document', async () => {
  const out = wrapInHtmlDocument('<p>hi</p>', { title: 'T' });
  assert.match(out, /^<!doctype html>\n<html lang="en">/);
  assert.match(out, /<title>T<\/title>/);
  assert.match(out, /<\/html>\n$/);
});

test('escapes the title and lang', () => {
  const out = wrapInHtmlDocument('', { title: 'A & B <c> "d"' });
  assert.match(out, /<title>A &amp; B &lt;c&gt; &quot;d&quot;<\/title>/);
});

test('links stylesheets, escaping the href', () => {
  const out = wrapInHtmlDocument('', { stylesheets: ['/a.css', 'b"c.css'] });
  assert.match(out, /<link rel="stylesheet" href="\/a\.css">/);
  assert.match(out, /href="b&quot;c\.css"/);
});

test('honours a custom language', () => {
  assert.match(wrapInHtmlDocument('', { lang: 'fr' }), /<html lang="fr">/);
});

test('the first H1 becomes the document title', async () => {
  const { title } = await render('# Hello *there*\n\n# Second');
  assert.equal(title, 'Hello there');
});

test('no heading means no title', async () => {
  const { title } = await render('just text');
  assert.equal(title, undefined);
});
