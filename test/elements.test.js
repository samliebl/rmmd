import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/render.js';

/** Render with every semantic element enabled. */
async function html(input, options = {}) {
  const { html } = await render(input, { elements: true, ...options });
  return html.trim();
}

test('delimiter elements produce their semantic tags', async () => {
  assert.equal(await html('==marked=='), '<p><mark>marked</mark></p>');
  assert.equal(await html('++defined++'), '<p><dfn>defined</dfn></p>');
  assert.equal(await html('~~struck~~'), '<p><s>struck</s></p>');
  assert.equal(await html('e^^iπ^^'), '<p>e<sup>iπ</sup></p>');
  assert.equal(await html('H%%2%%O'), '<p>H<sub>2</sub>O</p>');
});

test('span elements produce their semantic tags', async () => {
  assert.equal(
    await html('[The Waste Land]{cite}'),
    '<p><cite>The Waste Land</cite></p>',
  );
  assert.equal(await html('[to be]{q}'), '<p><q>to be</q></p>');
  assert.equal(
    await html('[HTML]{abbr HyperText Markup Language}'),
    '<p><abbr title="HyperText Markup Language">HTML</abbr></p>',
  );
});

test('flanking rules leave ordinary punctuation alone', async () => {
  // The v2 regexes matched any two markers on a line; these are the cases
  // that produced spurious <mark>/<s> elements.
  assert.equal(await html('3 = 3 = 3'), '<p>3 = 3 = 3</p>');
  assert.equal(await html('a ~ b ~ c'), '<p>a ~ b ~ c</p>');
  assert.equal(await html('2 ^ 3 ^ 4'), '<p>2 ^ 3 ^ 4</p>');
  assert.equal(await html('50% off, 20% more'), '<p>50% off, 20% more</p>');
  assert.equal(await html('1 + 2 + 3'), '<p>1 + 2 + 3</p>');
  // Single runs are inert entirely, so `~/.bashrc`, `C++` and `5+` are safe
  // wherever they appear. test/prose.test.js holds the full corpus.
  assert.equal(await html('~x~'), '<p>~x~</p>');
  assert.equal(await html('+x+'), '<p>+x+</p>');
});

test('content is escaped, never concatenated into raw HTML', async () => {
  // v2 built HTML strings by hand, so `&` came out unescaped and a <script>
  // in the source passed straight through.
  assert.equal(await html('++a & b++'), '<p><dfn>a &#x26; b</dfn></p>');
  assert.equal(
    await html('==<script>alert(1)</script>==', { allowHtml: false }),
    '<p><mark>alert(1)</mark></p>',
  );
});

test('attribute values are escaped', async () => {
  const out = await html('[X]{abbr a "quoted" & thing}');
  assert.match(out, /title="a &#x22;quoted&#x22; &#x26; thing"/);
});

test('elements nest with Markdown and with each other', async () => {
  assert.equal(
    await html('==marked **bold**=='),
    '<p><mark>marked <strong>bold</strong></mark></p>',
  );
  assert.equal(
    await html('[a ==b==]{cite}'),
    '<p><cite>a <mark>b</mark></cite></p>',
  );
  // Delimiters spanning another inline node -- impossible for the v2 text-node
  // transformer, which never saw the two markers in the same node.
  assert.equal(
    await html('==a **b** c=='),
    '<p><mark>a <strong>b</strong> c</mark></p>',
  );
});

test('inline code is not touched', async () => {
  assert.equal(
    await html('`a = b` and `x ~ y`'),
    '<p><code>a = b</code> and <code>x ~ y</code></p>',
  );
});

test('escaped delimiters stay literal', async () => {
  assert.equal(await html('\\=\\=not marked\\=\\='), '<p>==not marked==</p>');
});

test('unmatched delimiters stay literal', async () => {
  assert.equal(await html('== alone'), '<p>== alone</p>');
  assert.equal(await html('++dangling'), '<p>++dangling</p>');
});

test('span syntax declines what it does not own', async () => {
  assert.equal(await html('[text]{bogus}'), '<p>[text]{bogus}</p>');
  assert.equal(await html('[]{cite}'), '<p>[]{cite}</p>');
  assert.equal(await html('[plain]'), '<p>[plain]</p>');
  assert.equal(
    await html('[link](http://x.com)'),
    '<p><a href="http://x.com">link</a></p>',
  );
});

test('elements are off unless asked for', async () => {
  const { html: out } = await render('==marked==');
  assert.equal(out.trim(), '<p>==marked==</p>');
});

test('a subset can be selected by tag name', async () => {
  const { html: out } = await render('==a== and ++b++', { elements: ['mark'] });
  assert.equal(out.trim(), '<p><mark>a</mark> and ++b++</p>');
});

test('an unknown element name is an error', async () => {
  await assert.rejects(
    () => render('x', { elements: ['nope'] }),
    /Unknown element 'nope'/,
  );
});
