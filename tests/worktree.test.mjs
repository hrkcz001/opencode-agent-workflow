import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function git(cwd, ...args) {
  const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'worktree-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, 'source repo');
  fs.mkdirSync(repo);
  git(repo, 'init');
  git(repo, 'config', 'user.name', 'Worktree Test');
  git(repo, 'config', 'user.email', 'worktree@example.invalid');
  git(repo, 'commit', '--allow-empty', '-m', 'initial');
  return { root, repo, target: path.join(root, 'new worktree') };
}

function cli(args) {
  return spawnSync(process.execPath, [fileURLToPath(helper), ...args], { encoding: 'utf8' });
}

function createArgs(repo, target, branch = 'worker/test') {
  return ['--repo', repo, 'create', '--path', target, '--branch', branch, '--base', 'HEAD'];
}

const helper = new URL('../tools/worktree.mjs', import.meta.url);

test('creates a real worktree and reports verified canonical paths', t => {
  const { repo, target } = fixture(t);
  const result = cli(createArgs(repo, target));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(target, 'branch', '--show-current'), 'worker/test');
  assert.equal(git(target, 'rev-parse', 'HEAD'), git(repo, 'rev-parse', 'HEAD'));
  const report = JSON.parse(result.stdout);
  assert.equal(fs.realpathSync(report.path), fs.realpathSync(target));
  assert.equal(fs.realpathSync(report.commonDir), fs.realpathSync(git(repo, 'rev-parse', '--path-format=absolute', '--git-common-dir')));
});

test('accepts MSYS drive paths in the real Windows Git invocation', { skip: process.platform !== 'win32' }, t => {
  const { repo, target } = fixture(t);
  const msys = value => value.replaceAll('\\', '/').replace(/^([a-z]):/i, (_, drive) => `/${drive.toLowerCase()}`);
  const result = cli(createArgs(msys(repo), msys(target)));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(target, 'branch', '--show-current'), 'worker/test');
});

test('rejects invalid CLI arguments before creating anything', t => {
  const { repo, target } = fixture(t);
  const valid = createArgs(repo, target);
  const cases = [
    [], valid.slice(0, -2), [...valid, '--unknown', 'value'], [...valid, '--branch', 'duplicate'],
    valid.map(value => value === 'create' ? 'remove' : value),
    createArgs('relative-repo', target), createArgs(repo, 'relative-target'),
    createArgs(repo, target, '--force'), createArgs(repo, target, 'bad branch'),
    valid.map(value => value === 'HEAD' ? '--detach' : value),
    valid.map(value => value === 'HEAD' ? 'missing-base' : value),
  ];
  for (const args of cases) {
    const result = cli(args);
    assert.notEqual(result.status, 0, JSON.stringify(args));
    assert.match(result.stderr, /worktree:/);
    assert.equal(fs.existsSync(target), false);
  }
  assert.equal(git(repo, 'branch', '--list', 'worker/test'), '');
});

test('refuses an existing target even if empty without deleting its contents', t => {
  const { repo, target } = fixture(t);
  fs.mkdirSync(target);
  const result = cli(createArgs(repo, target));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already exists/i);
  assert.equal(fs.existsSync(target), true);
  assert.equal(git(repo, 'branch', '--list', 'worker/test'), '');
});

test('rejects actual Git toplevel and common-directory mismatches', async t => {
  const { repo, target, root } = fixture(t);
  git(repo, 'worktree', 'add', '-b', 'worker/verify', '--', target, 'HEAD');
  const nested = path.join(target, 'nested');
  fs.mkdirSync(nested);
  const other = path.join(root, 'other');
  fs.mkdirSync(other);
  git(other, 'init');
  const { verifyWorktree } = await import(helper);
  assert.throws(() => verifyWorktree(repo, nested), /toplevel.*mismatch/i);
  assert.throws(() => verifyWorktree(other, target), /common.*mismatch/i);
  assert.equal(fs.existsSync(target), true);
});

test('fails post-creation verification without removing worktree evidence', t => {
  const { repo, target } = fixture(t);
  git(repo, 'config', 'extensions.worktreeConfig', 'true');
  const hooks = path.join(repo, '.git', 'hooks');
  const mismatch = path.join(target, 'mismatch').replaceAll('\\', '/').replaceAll("'", "'\\''");
  fs.writeFileSync(path.join(hooks, 'post-checkout'), `#!/bin/sh\nmkdir mismatch\ngit config --worktree core.worktree '${mismatch}'\n`, { mode: 0o755 });
  const result = cli(createArgs(repo, target));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /toplevel.*mismatch/i);
  assert.equal(fs.existsSync(path.join(target, '.git')), true);
  assert.equal(fs.existsSync(path.join(target, 'mismatch')), true);
  assert.equal(git(repo, 'branch', '--list', 'worker/test').includes('worker/test'), true);
});

test('normalizes absolute MSYS and native Windows paths without depending on host platform', async () => {
  const { normalizePath } = await import(helper);
  assert.equal(normalizePath('/c/projects/work tree', 'win32'), 'C:/projects/work tree');
  assert.equal(normalizePath('d:\\projects\\..\\work', 'win32'), 'D:/work');
  assert.equal(normalizePath('C:/work/', 'win32'), 'C:/work/');
  assert.equal(normalizePath('//server/share/work', 'win32'), '//server/share/work');
  assert.equal(normalizePath('/c/projects/work', 'linux'), '/c/projects/work');
  assert.equal(normalizePath('/tmp/../work', 'linux'), '/work');
  for (const candidate of ['work', '../work', '', 'C:work']) {
    assert.throws(() => normalizePath(candidate, 'win32'), /absolute/i);
  }
  assert.throws(() => normalizePath('/projects/work', 'win32'), /absolute/i);
  assert.throws(() => normalizePath('relative', 'linux'), /absolute/i);
});
