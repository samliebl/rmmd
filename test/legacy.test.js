import test from 'node:test';
import assert from 'node:assert/strict';
import { findLegacySyntax } from '../lib/legacy.js';

test('finds each 2.x delimiter form', async () => {
  const found = findLegacySyntax('=a= and +b+ and ~c~ and ^d^ and %e%');
  assert.deepEqual(
    found.map((hit) => hit.tag),
    ['mark', 'dfn', 's', 'sup', 'sub'],
  );
});

test('reports position and source text', () => {
  const [hit] = findLegacySyntax('line one\n\nThis is =marked text= here.');
  assert.equal(hit.line, 3);
  assert.equal(hit.column, 9);
  assert.equal(hit.text, '=marked text=');
  assert.equal(hit.tag, 'mark');
});

test('current doubled syntax is not a finding', () => {
  assert.deepEqual(findLegacySyntax('==a== ++b++ ~~c~~ ^^d^^ %%e%%'), []);
});

test('a document with no custom syntax is clean', () => {
  assert.deepEqual(findLegacySyntax('# Title\n\nJust **prose** and `code`.'), []);
});

test('reports prose that 2.x would have corrupted', () => {
  // These are the cases where 2.x was wrong, not the author. They are
  // reported for the same reason: the rendering changes, and only the author
  // can say which passages were meant as markup.
  const found = findLegacySyntax('Pass --colour=always --width=80 to it.');
  assert.equal(found.length, 1);
  assert.equal(found[0].text, '=always --width=');
});

test('code spans are not reported', () => {
  assert.deepEqual(findLegacySyntax('The `a = b = c` literal.'), []);
});

test('findings are ordered by position', () => {
  const found = findLegacySyntax('~z~ =a=\n\n+b+');
  const positions = found.map((hit) => [hit.line, hit.column]);
  assert.deepEqual(positions, [...positions].sort((a, b) => a[0] - b[0] || a[1] - b[1]));
});
