import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/render.js';
import { delimiterElements } from '../lib/elements.js';

/**
 * The corpus that decided the delimiters.
 *
 * A delimiter is only worth having if ordinary technical prose survives it.
 * Each line here is text somebody would plausibly write in a document rmmd is
 * meant to render; none of it may produce an element. This is what forced
 * `=`, `^` and `%` to be doubled -- at a single character they matched
 * `--flag=value`, `2^8` and `%d%s` respectively.
 */
const prose = [
  ['shell flags', 'Run with --colour=always --width=80 for output.'],
  ['yaml-ish', 'key=value, other=thing, third=item'],
  ['js equality', 'If a == b and c == d then continue.'],
  ['js strict equality', 'Use a === b and c === d instead.'],
  ['assignment', 'Set x=1 and y=2 before running.'],
  ['table cells', '| a=1 | b=2 |'],
  ['rules of equals', 'The line ===== separates the ==== blocks.'],
  ['exponents', 'Compute 2^8 then 2^16 for the table.'],
  ['regex anchors', 'Match ^foo at the start and ^bar too.'],
  ['control keys', 'Press ^C to abort, ^D for EOF.'],
  ['printf formats', 'Format with %d%s for compact output.'],
  ['printf literal', 'Use printf "100%%" and "50%%" carefully.'],
  ['percentages', 'Up 50% this year and 20% last year.'],
  ['home paths', 'Copy ~/.bashrc and ~/.profile over.'],
  ['approximations', 'Roughly ~50 users, maybe ~100 by June.'],
  ['C++', 'Written in C++ and compiled with C++17.'],
  ['plus ratings', 'Rated 5+ stars, needs 3+ reviewers.'],
  ['urls with tildes', 'See http://x.com/a~b and http://y.com/c~d.'],
  ['emoticons', 'Nice work :^) and also :^D there.'],
  ['equations', 'We know x = y and y = z, so x = z.'],
  ['arrows', 'The a -> b => c pipeline runs nightly.'],
  ['math ranges', 'Values from 10%-20% are typical.'],
];

const elementPattern = /<(mark|dfn|s|sup|sub|cite|q|abbr)[\s>]/;

for (const [label, text] of prose) {
  test(`ordinary prose is left alone: ${label}`, async () => {
    const { html } = await render(text, { elements: true });
    assert.doesNotMatch(
      html,
      elementPattern,
      `"${text}" should not produce an element, but rendered:\n  ${html.trim()}`,
    );
  });
}

test('every delimiter element still matches when written deliberately', async () => {
  // The corpus above proves the delimiters are quiet; this proves they work.
  for (const element of delimiterElements) {
    const { html } = await render(element.example, { elements: true });
    assert.match(
      html,
      new RegExp(`<${element.tag}>`),
      `${element.example} should produce <${element.tag}>`,
    );
  }
});
