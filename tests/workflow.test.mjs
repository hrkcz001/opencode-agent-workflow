import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const json = async path => JSON.parse(await read(path));

// Parse only the deliberately small frontmatter subset used by these role files.
async function agent(name) {
  const text = await read(`agents/${name}.md`);
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, `frontmatter: ${name}`);
  const fields = Object.fromEntries([...match[1].matchAll(/^(\w+): (.+)$/gm)].map(m => [m[1], m[2]]));
  const permissions = [...match[1].matchAll(/  - action: (.+)\n    resource: "(.+)"\n    effect: (.+)/g)]
    .map(m => ({ action: m[1], resource: m[2], effect: m[3] }));
  assert.equal(permissions.length, [...match[1].matchAll(/  - action:/g)].length);
  return { text, body: match[2], fields, permissions };
}

const rule = (a, action, resource, effect) =>
  a.permissions.some(p => p.action === action && p.resource === resource && p.effect === effect);

async function walk(url = root, prefix = '') {
  const files = [];
  for (const entry of await readdir(url, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await walk(new URL(`${entry.name}/`, url), `${path}/`));
    else files.push(path);
  }
  return files;
}

test('all package/config examples parse and preserve the workflow configuration', async () => {
  for (const file of (await walk()).filter(f => f.endsWith('.json'))) await json(file);
  const c = await json('opencode.example.json');
  assert.equal(c.default_agent, 'architect');
  assert.equal(c.experimental.subagent_depth, 2);
  assert.equal(c.subagent_depth, undefined);
  assert.equal(c.shell, undefined);
  assert.deepEqual(c.plugins, ['./extensions/worker-alarm']);
  assert.equal(c.mcp, undefined);
  assert.equal(c.compaction.buffer, '70%');
  assert.equal(c.compaction.keep.tokens, 15000);
  for (const name of ['build', 'plan', 'general', 'explore']) assert.equal(c.agents[name].disabled, true);
  assert.ok(c.policies.length >= 13);
  for (const p of c.policies) {
    assert.equal(p.action, 'tool.use'); assert.equal(p.effect, 'deny');
  }
  assert.equal((await json('cli.example.json')).session.permissions, 'autoaccept');
  assert.equal((await json('extensions/worker-alarm/package.json')).exports['.'], './index.mjs');
});

test('delegation permissions are deny-all followed by the sole allowed child', async () => {
  for (const [name, mode, child] of [['architect', 'primary', 'techlead'], ['techlead', 'subagent', 'worker'], ['worker', 'subagent', null]]) {
    const a = await agent(name);
    assert.equal(a.fields.mode, mode);
    assert.match(a.fields.model, /^[^/]+\/.+/);
    assert.deepEqual(a.permissions.filter(p => p.action === 'subagent'), [
      { action: 'subagent', resource: '*', effect: 'deny' },
      ...(child ? [{ action: 'subagent', resource: child, effect: 'allow' }] : []),
    ]);
    if (name !== 'worker') assert.equal(a.fields.steps, undefined);
  }
});

test('architect restrictions, techlead repair envelope and worker backstop remain intact', async () => {
  const a = await agent('architect'); const t = await agent('techlead'); const w = await agent('worker');
  assert.ok(rule(a, 'edit', '*', 'deny'));
  assert.ok(rule(a, 'shell', '*', 'deny'));
  for (const p of a.permissions.filter(p => p.action === 'shell' && p.effect === 'allow'))
    assert.match(p.resource, /^git (status|log|diff|show|rev-parse|branch|for-each-ref|ls-files|worktree list) /);
  assert.ok(rule(t, 'question', '*', 'deny'));
  assert.match(t.body, /at most 10 added\/deleted lines in one file, or 5 in each of two files/);
  assert.match(t.body, /no public signature, contract, schema, dependency, configuration or test meaning/);
  assert.equal(w.fields.steps, '300');
  for (const cmd of ['push', 'commit', 'merge', 'rebase', 'worktree', 'branch'])
    assert.ok(rule(w, 'shell', `git ${cmd} *`, 'deny'));
});

test('portable bootstrap references and worktree paths agree across both parent roles', async () => {
  for (const name of ['architect', 'techlead']) {
    const a = await agent(name);
    assert.ok(a.body.includes('$HOME/.config/opencode/workflow/bootstrap.md'));
    assert.ok(rule(a, 'external_directory', '$HOME/.config/opencode/workflow/*', 'allow'));
    assert.ok(rule(a, 'external_directory', '$HOME/wt/*', 'allow'));
  }
  assert.ok(rule(await agent('techlead'), 'edit', '$HOME/.config/opencode/workflow/*', 'deny'));
  assert.ok((await read('workflow/bootstrap.md')).startsWith('# Project workflow bootstrap'));
});

test('bootstrap seed retains consent, all five schemas and core evidence fields', async () => {
  const seed = await read('workflow/bootstrap.md');
  assert.match(seed, /waits for the human's\nagreement/);
  for (const name of ['epic', 'ticket', 'worker-report', 'techlead-report', 'verdict'])
    assert.ok(seed.includes(`templates/${name}.md`));
  for (const field of ['project.md', 'schema revision', 'STOP CONDITION', 'DELIVERY', 'SIGNATURES', 'CONTRACT', 'DIRECT EDITS', 'UNRUN CHECKS', 'ACCEPTANCE'])
    assert.ok(seed.includes(field), field);
  assert.match(seed, /not blindly resend the same request to reset its counter/);
});

test('local Markdown links resolve within the package', async () => {
  for (const path of (await walk()).filter(f => f.endsWith('.md'))) {
    const text = await read(path);
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const url = new URL(target.split('#')[0], new URL(path, root));
      assert.ok(url.href.startsWith(root.href), `${path}: link outside package`);
      // Directories are valid links too.
      await import('node:fs/promises').then(fs => fs.stat(url));
    }
  }
});

test('published files exclude machine home paths, credentials and legacy role IDs', async () => {
  for (const path of await walk()) {
    const text = await read(path);
    assert.doesNotMatch(text, /[A-Za-z]:[\\/]Users[\\/][^\s/\\]+/i, path);
    assert.doesNotMatch(text, /\/(?:home|Users)\/[a-z0-9_-]+\//i, path);
    assert.doesNotMatch(text, /(?:gh[pousr]_[a-z0-9]{20,}|sk-[a-z0-9]{24,}|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----)/i, path);
    if (/^(agents|workflow|extensions)\//.test(path)) assert.doesNotMatch(text, /\b(?:pm|subpm)\b/i, path);
  }
});
