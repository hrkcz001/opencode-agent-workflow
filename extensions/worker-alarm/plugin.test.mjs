import test from 'node:test';
import assert from 'node:assert/strict';

const pluginURL = new URL('./index.mjs', import.meta.url);

async function harness(storage) {
  const plugin = (await import(pluginURL)).default;
  const hooks = new Map();
  await plugin.setup({ session: { hook: async (name, fn) => hooks.set(name, fn) }, storage });
  return hooks;
}

function event(sessionID = 'worker-1', agent = 'worker') {
  return { sessionID, agent, system: [], messages: [], tools: { shell: {}, read: {} }, options: {} };
}

test('no warnings or report overhead before the checkpoint', async () => {
  const hooks = await harness();
  for (let step = 1; step <= 69; step++) {
    const request = event();
    await hooks.get('context')(request);
    assert.equal(request.system.length, 0, `step ${step}`);
    assert.deepEqual(Object.keys(request.tools), ['shell', 'read']);
  }
});

test('request 70 and later expose no tools, while other roles and sessions remain independent', async () => {
  const hooks = await harness();
  for (let i = 1; i <= 72; i++) {
    const request = event();
    await hooks.get('context')(request);
    if (i >= 70) {
      assert.deepEqual(request.tools, {});
      assert.match(request.system.at(-1).text, /CHECKPOINT/);
    }
  }
  for (const request of [event('architect-1', 'architect'), event('techlead-1', 'techlead'), event('worker-2')]) {
    await hooks.get('context')(request);
    assert.equal(request.system.length, 0);
    assert.equal(Object.keys(request.tools).length, 2);
  }
});

test('a new prompt resets only that child round, not other workers', async () => {
  const hooks = await harness();
  for (let i = 0; i < 70; i++) {
    await hooks.get('context')(event('a'));
    await hooks.get('context')(event('b'));
  }
  await hooks.get('prompt')({ sessionID: 'a' });
  const a = event('a'); const b = event('b');
  await hooks.get('context')(a); await hooks.get('context')(b);
  assert.equal(a.system.length, 0);
  assert.match(b.system[0].text, /CHECKPOINT/);
});

test('counts survive plugin reload and reset only after a new prompt', async () => {
  const data = new Map();
  const storage = {
    get: async key => data.get(key),
    set: async (key, value) => { data.set(key, value); },
    remove: async key => { data.delete(key); },
  };
  let hooks = await harness(storage);
  for (let i = 0; i < 69; i++) await hooks.get('context')(event());
  hooks = await harness(storage);
  const request = event(); await hooks.get('context')(request);
  assert.match(request.system[0]?.text ?? '', /CHECKPOINT/);
  await hooks.get('prompt')({ sessionID: 'worker-1' });
  hooks = await harness(storage);
  const next = event(); await hooks.get('context')(next);
  assert.equal(next.system.length, 0);
});

test('the alarm registers only primary-context and prompt hooks', async () => {
  const storage = undefined;
  let plugin;
  try { plugin = (await import(pluginURL)).default; }
  catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
  assert.ok(plugin, 'worker alarm plugin must exist');
  const hooks = new Map();
  await plugin.setup({ session: { hook: async (name, fn) => hooks.set(name, fn) }, storage });
  assert.deepEqual([...hooks.keys()].sort(), ['context', 'prompt']);
});
