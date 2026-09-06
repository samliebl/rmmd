import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const cli = fileURLToPath(new URL('../bin/rmmd.js', import.meta.url));

/** Run the CLI, capturing stdout, stderr and the exit code. */
async function rmmd(args, input) {
  const child = run('node', [cli, ...args]);
  if (input !== undefined) {
    child.child.stdin.end(input);
  } else {
    child.child.stdin.end();
  }
  try {
    const { stdout, stderr } = await child;
    return { stdout, stderr, code: 0 };
  } catch (error) {
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      code: error.code,
    };
  }
}

let dir;
test.before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'rmmd-'));
});

test('reads stdin', async () => {
  const { stdout, code } = await rmmd([], '# Hi');
  assert.equal(code, 0);
  assert.equal(stdout.trim(), '<h1>Hi</h1>');
});

test('reads a file', async () => {
  const file = join(dir, 'a.md');
  await writeFile(file, '# From file');
  const { stdout } = await rmmd([file]);
  assert.equal(stdout.trim(), '<h1>From file</h1>');
});

test('--custom enables semantic elements', async () => {
  const plain = await rmmd([], '==x==');
  assert.equal(plain.stdout.trim(), '<p>==x==</p>');

  const custom = await rmmd(['-c'], '==x==');
  assert.equal(custom.stdout.trim(), '<p><mark>x</mark></p>');
});

test('--elements takes a subset', async () => {
  const { stdout } = await rmmd(['--elements', 'mark'], '==a== ++b++');
  assert.equal(stdout.trim(), '<p><mark>a</mark> ++b++</p>');
});

test('-c does not swallow the filename', async () => {
  // `-c` is a boolean precisely so this works; an optional option-argument
  // would read `f` as the element list.
  const f = join(dir, 'swallow.md');
  await writeFile(f, '==x==');
  const { stdout, code } = await rmmd(['-c', f]);
  assert.equal(code, 0);
  assert.equal(stdout.trim(), '<p><mark>x</mark></p>');
});

test('an unknown element fails with a message and exit 1', async () => {
  const { stderr, code } = await rmmd(['--elements', 'bogus'], 'x');
  assert.equal(code, 1);
  assert.match(stderr, /Unknown element 'bogus'/);
});

test('--enclose wraps, taking the title from the first H1', async () => {
  const { stdout } = await rmmd(['-e'], '# Doc Title\n\ntext');
  assert.match(stdout, /<!doctype html>/);
  assert.match(stdout, /<title>Doc Title<\/title>/);
});

test('--title overrides the heading', async () => {
  const { stdout } = await rmmd(['-e', '--title', 'Override'], '# Doc');
  assert.match(stdout, /<title>Override<\/title>/);
});

test('--output writes the file and keeps stdout clean', async () => {
  const out = join(dir, 'out.html');
  const { stdout, stderr, code } = await rmmd(['-o', out], '# Written');
  assert.equal(code, 0);
  // Status belongs on stderr; stdout is a data stream.
  assert.equal(stdout, '');
  assert.match(stderr, /HTML written to/);
  assert.match(await readFile(out, 'utf8'), /<h1>Written<\/h1>/);
});

test('-f still works as an alias for --output', async () => {
  const out = join(dir, 'alias.html');
  await rmmd(['-f', out], '# Alias');
  assert.match(await readFile(out, 'utf8'), /<h1>Alias<\/h1>/);
});

test('several files concatenate', async () => {
  const a = join(dir, 'one.md');
  const b = join(dir, 'two.md');
  await writeFile(a, '# One');
  await writeFile(b, '# Two');
  const { stdout } = await rmmd([a, b]);
  assert.match(stdout, /<h1>One<\/h1>/);
  assert.match(stdout, /<h1>Two<\/h1>/);
});

test('--out-dir writes one file per input', async () => {
  const a = join(dir, 'p.md');
  await writeFile(a, '# P');
  const outDir = join(dir, 'site');
  const { code, stderr } = await rmmd(['--out-dir', outDir, a]);
  assert.equal(code, 0);
  assert.match(stderr, /p\.md -> /);
  assert.match(await readFile(join(outDir, 'p.html'), 'utf8'), /<h1>P<\/h1>/);
});

test('a missing file fails with a message and exit 1', async () => {
  const { stderr, code } = await rmmd([join(dir, 'nope.md')]);
  assert.equal(code, 1);
  assert.match(stderr, /rmmd: /);
  assert.match(stderr, /no such file/i);
});

test('--list prints the element reference', async () => {
  const { stdout, code } = await rmmd(['--list']);
  assert.equal(code, 0);
  for (const tag of ['mark', 'dfn', 'sup', 'sub', 'cite', 'q', 'abbr']) {
    assert.match(stdout, new RegExp(`<${tag}>`));
  }
});

test('--version and --help work', async () => {
  const version = await rmmd(['-v']);
  assert.match(version.stdout, /^\d+\.\d+\.\d+/);

  const help = await rmmd(['-h']);
  assert.match(help.stdout, /--enclose/);
});

test('--no-gfm disables tables', async () => {
  const { stdout } = await rmmd(['--no-gfm'], '| a |\n|---|\n| 1 |');
  assert.doesNotMatch(stdout, /<table>/);
});

test('a closed pipe is not an error', async () => {
  // `rmmd big.md | head` closes stdout early; that must not crash.
  const { execSync } = await import('node:child_process');
  const big = join(dir, 'big.md');
  await writeFile(big, '# Heading\n\n'.repeat(5000));
  const out = execSync(`node ${cli} ${big} | head -2`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.match(out, /<h1>Heading<\/h1>/);
});

test('--legacy-check reports 2.x syntax and exits 1', async () => {
  const f = join(dir, 'legacy.md');
  await writeFile(f, 'This is =marked text= in markdown.');
  const { stdout, stderr, code } = await rmmd(['--legacy-check', f]);
  assert.equal(code, 1);
  assert.match(stdout, /"=marked text=" would have been <mark> in 2\.x/);
  assert.match(stderr, /1 passage would render as literal text/);
});

test('--legacy-check exits 0 on a clean document', async () => {
  const f = join(dir, 'clean.md');
  await writeFile(f, 'This is ==marked text== in markdown.');
  const { stderr, code } = await rmmd(['--legacy-check', f]);
  assert.equal(code, 0);
  assert.match(stderr, /No rmmd 2\.x syntax found/);
});

test('--legacy-check reads stdin', async () => {
  const { stdout, code } = await rmmd(['--legacy-check'], 'a =b= c');
  assert.equal(code, 1);
  assert.match(stdout, /<stdin>/);
});
