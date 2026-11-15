#!/usr/bin/env node
// Local coordination and evidence, not a scheduler service or security boundary.
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync, existsSync, realpathSync, lstatSync, openSync, closeSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';

const args = process.argv.slice(2);
function option(name, fallback) {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  if (!args[i + 1]) throw Error(`Missing ${name}`);
  return args.splice(i, 2)[1];
}
function requireValue(value, name) { if (!value) throw Error(`Required ${name}`); return value; }
function git(dir, ...argv) {
  const r = spawnSync('git', ['-C', dir, ...argv], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, windowsHide: true });
  if (r.status !== 0) throw Error(r.stderr || r.error?.message || 'Git failed');
  return r.stdout.trim();
}
function canonical(dir) { return realpathSync(dir); }
function snapshot(dir) {
  const head = git(dir, 'rev-parse', 'HEAD');
  const files = git(dir, 'ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean);
  const hash = createHash('sha256');
  const modes = new Map(git(dir, 'ls-files', '--stage', '-z').split('\0').filter(Boolean).map(l => { const m = l.match(/^([0-9]+) [a-f0-9]+ 0\t(.*)$/s); if (!m) throw Error('Unmerged index'); return [m[2], m[1]]; }));
  for (const file of [...new Set(files)].sort()) {
    hash.update(JSON.stringify(file));
    const p = join(dir, file);
    if (!existsSync(p)) { hash.update('deleted'); continue; }
    if (!lstatSync(p).isFile()) throw Error(`Unsupported file type or submodule: ${file}`);
    const bytes = readFileSync(p);
    const mode = modes.get(file) ?? ((lstatSync(p).mode & 0o111) ? '100755' : '100644');
    hash.update(`${mode}:${lstatSync(p).mode & 0o111}:${bytes.length}:`); hash.update(bytes);
  }
  return { head, content: hash.digest('hex'), dirty: Boolean(git(dir, 'status', '--porcelain')) };
}
function changed(dir, base) {
  return [...new Set([
    ...git(dir, 'diff', base, '--name-only', '-z', '--no-renames').split('\0'),
    ...git(dir, 'ls-files', '--others', '--exclude-standard', '-z').split('\0'),
  ].filter(Boolean))];
}
const same = (a, b) => a.head === b.head && a.content === b.content;
const active = t => ['running', 'review', 'verified', 'interrupted', 'blocked'].includes(t.state);
const satisfied = t => ['verified', 'integrated'].includes(t.state);
function reasons(t, tickets) {
  const result = [];
  for (const id of t.dependsOn) if (!satisfied(tickets[id])) result.push(`dependency ${id}`);
  for (const other of Object.values(tickets)) {
    if (other.id === t.id || !active(other)) continue;
    if (other.workdir === t.workdir) result.push(`worktree ${other.id}`);
    if (other.state === 'verified' && t.dependsOn.includes(other.id)) continue;
    for (const f of t.files) if (other.files.includes(f)) result.push(`file ${f}: ${other.id}`);
    for (const r of t.resources) if (other.resources.includes(r)) result.push(`resource ${r}: ${other.id}`);
  }
  return result;
}
function validateSpec(t, state, common) {
  if (['__proto__', 'constructor', 'prototype'].includes(t.id) || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/.test(t.id) || Object.hasOwn(state.tickets, t.id)) throw Error('Invalid or duplicate ticket ID');
  for (const k of ['files', 'dependsOn', 'resources', 'checks']) if (!Array.isArray(t[k])) throw Error(`Expected ${k} array`);
  if (!t.files.length || t.files.some(f => typeof f !== 'string' || !f || isAbsolute(f) || f.includes('\\') || f.split('/').some(s => ['', '..', '.', '.git'].includes(s)))) throw Error('Invalid file path allowlist');
  for (const id of t.dependsOn) if (!Object.hasOwn(state.tickets, id)) throw Error(`Unknown dependency ${id}; register prerequisites first`);
  if (t.resources.some(r => typeof r !== 'string' || !r)) throw Error('Invalid resources');
  if (!isAbsolute(t.workdir)) throw Error('workdir must be absolute');
  t.workdir = canonical(t.workdir);
  if (canonical(git(t.workdir, 'rev-parse', '--path-format=absolute', '--git-common-dir')) !== common) throw Error('Worktree belongs to another repository');
  if (git(t.workdir, 'rev-parse', 'HEAD') !== t.base) throw Error('Base SHA mismatch');
  if (snapshot(t.workdir).dirty) throw Error('New ticket worktree must be clean');
  if (!t.checks.length) throw Error('At least one check is required');
  const ids = new Set();
  for (const c of t.checks) {
    if (!/^[A-Za-z0-9_.-]+$/.test(c.id) || ids.has(c.id) || !Array.isArray(c.command) || !c.command.length || c.command.some(s => typeof s !== 'string' || !s)) throw Error('Invalid check');
    ids.add(c.id);
    c.timeoutMs ??= 600000;
    if (!Number.isSafeInteger(c.timeoutMs) || c.timeoutMs < 1 || c.timeoutMs > 3600000) throw Error('Invalid timeoutMs');
  }
}
function print(value) { console.log(JSON.stringify(value, null, 2)); }
function main() {
  const repo = canonical(option('--repo', process.cwd()));
  const common = canonical(git(repo, 'rev-parse', '--path-format=absolute', '--git-common-dir'));
  const root = join(common, 'workflow-runtime');
  const command = args.shift();
  if (!command || command === 'help') {
    print({ usage: 'node workflow.mjs --repo ABSOLUTE_REPO COMMAND', commands: [
      'add SPEC.json', 'status', 'ready', 'claim ID --session ID', 'review ID',
      'run ID CHECK --by worker|techlead', 'verify ID', 'integrate ID --target REF',
      'interrupt ID --reason TEXT', 'block ID --reason TEXT', 'resume ID --session ID --reason TEXT', 'reconcile',
    ] }); return;
  }
  mkdirSync(root, { recursive: true });
  const lock = join(root, 'lock');
  try { mkdirSync(lock); } catch { throw Error(`State lock held: ${lock}. Check for a live runner before manual recovery.`); }
  try {
    writeFileSync(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, started: new Date().toISOString() }));
    const statePath = join(root, 'state.json');
    const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { version: 1, tickets: {} };
    if (state.version !== 1 || !state.tickets || typeof state.tickets !== 'object' || Array.isArray(state.tickets)) throw Error('Invalid state schema; refusing reset');
    const save = () => {
      const temp = join(root, `state-${randomUUID()}.tmp`);
      writeFileSync(temp, JSON.stringify(state, null, 2)); renameSync(temp, statePath);
    };
    const ticket = () => {
      const id = requireValue(args.shift(), 'ticket ID');
      if (!Object.hasOwn(state.tickets, id)) throw Error(`Unknown ticket ${id}`);
      return state.tickets[id];
    };
    const transition = (t, from, to) => {
      if (!from.includes(t.state)) throw Error(`Invalid state ${t.state} -> ${to}`);
      t.history.push({ from: t.state, to, at: new Date().toISOString() }); t.state = to;
    };
    if (command === 'status') { print({ ...state, storage: root }); return; }
    if (command === 'add') {
      const t = JSON.parse(readFileSync(requireValue(args.shift(), 'spec file'), 'utf8'));
      validateSpec(t, state, common);
      state.tickets[t.id] = { id: t.id, workdir: t.workdir, base: t.base, files: t.files,
        dependsOn: t.dependsOn, resources: t.resources, checks: t.checks, state: 'ready', history: [], evidence: [] };
      save(); print(state.tickets[t.id]); return;
    }
    if (command === 'ready') {
      const ready = [], blocked = {};
      for (const t of Object.values(state.tickets).filter(t => t.state === 'ready')) {
        const why = reasons(t, state.tickets); if (why.length) blocked[t.id] = why; else ready.push(t.id);
      }
      print({ ready, blocked, note: 'Candidates, not a mutually disjoint batch; claim sequentially to reserve resources.' }); return;
    }
    if (command === 'reconcile') {
      print({ tickets: Object.values(state.tickets).map(t => {
        try { const s = snapshot(t.workdir); return { id: t.id, state: t.state, session: t.session, ...s,
          sessionLiveness: 'unknown: inspect OpenCode before resume',
          verificationCurrent: Boolean(t.verified && same(t.verified, s)) }; }
        catch (e) { return { id: t.id, state: t.state, error: e.message }; }
      }) }); return;
    }
    const t = ticket();
    if (command === 'claim') {
      if (t.state !== 'ready') throw Error(`Cannot claim state ${t.state}`);
      const why = reasons(t, state.tickets); if (why.length) throw Error(why.join('; '));
      const s = snapshot(t.workdir); if (s.head !== t.base || s.dirty) throw Error('Worktree baseline changed');
      t.session = requireValue(option('--session'), '--session');
      transition(t, ['ready'], 'running');
    } else if (command === 'review') transition(t, ['running'], 'review');
    else if (command === 'interrupt' || command === 'block') {
      t.reason = requireValue(option('--reason'), '--reason');
      transition(t, ['running', 'review', 'verified'], command === 'block' ? 'blocked' : 'interrupted');
      t.recovery = snapshot(t.workdir);
    } else if (command === 'resume') {
      t.reason = requireValue(option('--reason'), '--reason');
      t.session = requireValue(option('--session'), '--session');
      const why = reasons(t, state.tickets); if (why.length) throw Error(why.join('; '));
      transition(t, ['interrupted', 'blocked', 'review'], 'running');
      t.resumeSnapshot = snapshot(t.workdir); delete t.verified;
    } else if (command === 'run') {
      if (!['running', 'review'].includes(t.state)) throw Error('Checks require running or review state');
      const checkID = args.shift();
      const check = t.checks.find(c => c.id === checkID); if (!check) throw Error('Unknown check');
      const by = option('--by'); if (!['worker', 'techlead'].includes(by)) throw Error('Required --by worker|techlead');
      const before = snapshot(t.workdir);
      const id = randomUUID(), evidenceDir = join(root, 'evidence', t.id); mkdirSync(evidenceDir, { recursive: true });
      const stdout = join(evidenceDir, `${id}.stdout.log`), stderr = join(evidenceDir, `${id}.stderr.log`);
      const out = openSync(stdout, 'wx'), err = openSync(stderr, 'wx');
      let r;
      try { r = spawnSync(check.command[0], check.command.slice(1), { cwd: t.workdir, stdio: ['ignore', out, err], timeout: check.timeoutMs, windowsHide: true, shell: false }); }
      finally { closeSync(out); closeSync(err); }
      const after = snapshot(t.workdir);
      const ev = { id, check: check.id, by, command: check.command, cwd: t.workdir, before, after,
        stable: same(before, after), exitCode: r.status ?? 1, signal: r.signal, error: r.error?.code,
        at: new Date().toISOString(), stdout, stderr };
      writeFileSync(join(evidenceDir, `${id}.json`), JSON.stringify(ev, null, 2));
      t.evidence.push(ev); save(); print(ev); process.exitCode = ev.exitCode; return;
    } else if (command === 'verify') {
      if (t.state !== 'review') throw Error('Verification requires review state');
      const outside = changed(t.workdir, t.base).filter(f => !t.files.includes(f)); if (outside.length) throw Error(`Out-of-scope files: ${outside.join(', ')}`);
      const s = snapshot(t.workdir);
      if (spawnSync('git', ['-C', t.workdir, 'merge-base', '--is-ancestor', t.base, s.head], { windowsHide: true }).status !== 0) throw Error('Base is not an ancestor of HEAD');
      for (const c of t.checks) {
        const ev = t.evidence.filter(e => e.by === 'techlead' && e.check === c.id).at(-1);
        if (!ev || ev.exitCode !== 0 || !ev.stable || !same(ev.after, s)) throw Error(`Missing, failed or stale techlead evidence: ${c.id}`);
      }
      t.verified = s; transition(t, ['review'], 'verified');
    } else if (command === 'integrate') {
      if (t.state !== 'verified') throw Error('Integration requires verified state');
      const target = requireValue(option('--target'), '--target');
      const s = snapshot(t.workdir);
      if (s.dirty || s.content !== t.verified.content) throw Error('Commit the verified content without further changes first');
      if (spawnSync('git', ['-C', t.workdir, 'merge-base', '--is-ancestor', s.head, target], { windowsHide: true }).status !== 0) throw Error('Ticket commit is not an ancestor of target');
      const targetHead = git(t.workdir, 'rev-parse', `${target}^{commit}`);
      if (targetHead !== s.head) throw Error('Combined target needs its own registered integration ticket and evidence; this command only records an exactly verified target');
      t.integration = { target, ticketHead: s.head, targetHead, at: new Date().toISOString() };
      transition(t, ['verified'], 'integrated');
    } else throw Error(`Unknown command ${command}`);
    save(); print(t);
  } finally { rmSync(lock, { recursive: true }); }
}
try { main(); } catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; }
