import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = resolve('tools/workflow.mjs');
function fixture(t) {
  const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'workflow-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => {
    const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
  };
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test');
  writeFileSync(join(dir, 'source.txt'), 'baseline\n'); git('add', 'source.txt'); git('commit', '-qm', 'baseline');
  const base = git('rev-parse', 'HEAD');
  function run(...args) {
    const r = spawnSync(process.execPath, [cli, '--repo', dir, ...args], { encoding: 'utf8' });
    return { code: r.status, text: r.stdout + r.stderr, data: r.status === 0 ? JSON.parse(r.stdout) : null };
  }
  let n = 0;
  function add(id, changes = {}) {
    // Specs live outside the worktree so they cannot pollute the baseline.
    const spec = join(dir, '.git', `spec-${n++}.json`);
    writeFileSync(spec, JSON.stringify({ id, workdir: dir, base, files: ['source.txt'],
      dependsOn: [], resources: [], checks: [{ id: 'test', command: [process.execPath, '-e', 'process.stdout.write("real evidence")'] }], ...changes }));
    return run('add', spec);
  }
  return { dir, git, base, run, add };
}
function ok(result) { assert.equal(result.code, 0, result.text); return result.data; }
function bad(result, pattern) { assert.notEqual(result.code, 0, result.text); assert.match(result.text, pattern); }

test('state persists, claims are unique, evidence gates verification and integration', t => {
  const f = fixture(t); ok(f.add('T1'));
  assert.deepEqual(ok(f.run('ready')).ready, ['T1']);
  ok(f.run('claim', 'T1', '--session', 'child-1'));
  bad(f.run('claim', 'T1', '--session', 'child-2'), /state|running/i);
  writeFileSync(join(f.dir, 'source.txt'), 'implemented\n');
  ok(f.run('review', 'T1'));
  bad(f.run('verify', 'T1'), /evidence/i);
  const ev = ok(f.run('run', 'T1', 'test', '--by', 'techlead'));
  assert.equal(ev.exitCode, 0); assert.equal(readFileSync(ev.stdout, 'utf8'), 'real evidence');
  ok(f.run('verify', 'T1'));
  f.git('add', 'source.txt'); f.git('commit', '-qm', 'implementation');
  ok(f.run('integrate', 'T1', '--target', 'HEAD'));
  assert.equal(ok(f.run('status')).tickets.T1.state, 'integrated');
});

test('worker evidence and stale evidence cannot satisfy techlead verification', t => {
  const f = fixture(t); ok(f.add('T1')); ok(f.run('claim', 'T1', '--session', 'child'));
  ok(f.run('run', 'T1', 'test', '--by', 'worker')); ok(f.run('review', 'T1'));
  bad(f.run('verify', 'T1'), /evidence/i);
  ok(f.run('run', 'T1', 'test', '--by', 'techlead'));
  writeFileSync(join(f.dir, 'source.txt'), 'changed after test\n');
  bad(f.run('verify', 'T1'), /evidence|stale/i);
});

test('failed commands, untracked files and scope violations are recorded accurately', t => {
  const f = fixture(t); ok(f.add('T1', { checks: [{ id: 'fail', command: [process.execPath, '-e', 'console.error("failure");process.exit(7)'] }] }));
  ok(f.run('claim', 'T1', '--session', 'child')); ok(f.run('review', 'T1'));
  const r = f.run('run', 'T1', 'fail', '--by', 'techlead');
  assert.equal(r.code, 7); assert.match(r.text, /"exitCode": 7/);
  writeFileSync(join(f.dir, 'extra.txt'), 'outside scope');
  bad(f.run('verify', 'T1'), /scope/i);
});

test('reconciliation detects dirty interrupted work and never deletes or resumes it automatically', t => {
  const f = fixture(t); ok(f.add('T1')); ok(f.run('claim', 'T1', '--session', 'child'));
  writeFileSync(join(f.dir, 'source.txt'), 'partial\n');
  ok(f.run('interrupt', 'T1', '--reason', 'alarm reached'));
  const r = ok(f.run('reconcile'));
  assert.equal(r.tickets[0].state, 'interrupted'); assert.equal(r.tickets[0].dirty, true);
  assert.equal(readFileSync(join(f.dir, 'source.txt'), 'utf8'), 'partial\n');
  bad(f.run('claim', 'T1', '--session', 'new-child'), /state|interrupted/i);
  ok(f.run('resume', 'T1', '--session', 'child', '--reason', 'Reviewed diff; finish remaining assertion'));
  assert.equal(ok(f.run('status')).tickets.T1.state, 'running');
});

test('ready uses dependencies, exclusive resources and unique worktrees; unknown deps and invalid paths fail', t => {
  const f = fixture(t);
  bad(f.add('bad', { dependsOn: ['missing'] }), /depend/i);
  bad(f.add('bad', { files: ['../escape'] }), /path|file/i);
  ok(f.add('T1', { resources: ['editor'] }));
  const second = join(f.dir, '.git', 'other-worktree');
  f.git('worktree', 'add', '--detach', second, f.base);
  ok(f.add('T2', { workdir: second, resources: ['editor'] }));
  ok(f.add('T3', { workdir: second, dependsOn: ['T1'] }));
  ok(f.run('claim', 'T1', '--session', 'one'));
  const r = ok(f.run('ready')); assert.deepEqual(r.ready, []);
  assert.match(JSON.stringify(r.blocked.T2), /resource|file/i);
  assert.match(JSON.stringify(r.blocked.T3), /depend/i);
});

test('state lock rejects concurrent writers and malformed state is not silently reset', t => {
  const f = fixture(t); ok(f.add('T1'));
  const root = join(f.dir, '.git', 'workflow-runtime');
  mkdirSync(join(root, 'lock'));
  bad(f.run('interrupt', 'T1', '--reason', 'test'), /lock/i);
  rmSync(join(root, 'lock'), { recursive: true });
  writeFileSync(join(root, 'state.json'), '{}');
  bad(f.run('status'), /state|schema/i);
});

test('committed scope changes and mode changes invalidate gates', t => {
  const f = fixture(t); ok(f.add('T1')); ok(f.run('claim', 'T1', '--session', 'child'));
  writeFileSync(join(f.dir, 'outside.txt'), 'outside'); f.git('add', 'outside.txt'); f.git('commit', '-qm', 'outside');
  ok(f.run('review', 'T1')); ok(f.run('run', 'T1', 'test', '--by', 'techlead'));
  bad(f.run('verify', 'T1'), /scope/i);
});
test('index mode changes after verification invalidate the integration gate', t => {
  const f = fixture(t); ok(f.add('T1')); ok(f.run('claim', 'T1', '--session', 'child'));
  ok(f.run('review', 'T1')); ok(f.run('run', 'T1', 'test', '--by', 'techlead')); ok(f.run('verify', 'T1'));
  f.git('config', 'core.filemode', 'false'); f.git('update-index', '--chmod=+x', 'source.txt'); f.git('commit', '-qm', 'mode');
  bad(f.run('integrate', 'T1', '--target', 'HEAD'), /content/i);
});

test('a target beyond the verified ticket commit requires separate integration evidence', t => {
  const f = fixture(t); ok(f.add('T1')); ok(f.run('claim', 'T1', '--session', 'child'));
  ok(f.run('review', 'T1')); ok(f.run('run', 'T1', 'test', '--by', 'techlead')); ok(f.run('verify', 'T1'));
  const ticketHead=f.git('rev-parse','HEAD');
  writeFileSync(join(f.dir,'source.txt'),'combined change');f.git('add','source.txt');f.git('commit','-qm','combined');
  const target=f.git('rev-parse','HEAD'); f.git('checkout','--detach',ticketHead);
  bad(f.run('integrate','T1','--target',target),/combined target/i);
});

test('runner timeout and tree-mutating checks cannot produce a verification pass', t => {
  const f = fixture(t); ok(f.add('T1', { checks: [
    { id: 'timeout', command: [process.execPath, '-e', 'setTimeout(()=>{},5000)'], timeoutMs: 100 },
    { id: 'mutate', command: [process.execPath, '-e', 'require("fs").writeFileSync("source.txt","changed")'] },
  ] }));
  ok(f.run('claim', 'T1', '--session', 'child')); ok(f.run('review', 'T1'));
  const timeout = f.run('run', 'T1', 'timeout', '--by', 'techlead');
  assert.notEqual(timeout.code, 0); assert.match(timeout.text, /ETIMEDOUT/);
  const mutated = ok(f.run('run', 'T1', 'mutate', '--by', 'techlead')); assert.equal(mutated.stable, false);
  bad(f.run('verify', 'T1'), /evidence/i);
});
