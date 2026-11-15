import test from 'node:test';
import assert from 'node:assert/strict';
import plugin from '../extensions/worker-alarm/index.mjs';

test('each 70-step round yields to techlead and only a new reviewed prompt starts another round', async () => {
  const hooks = new Map();
  await plugin.setup({session:{hook:async(k,v)=>hooks.set(k,v)}});
  for (let round=0; round<4; round++) {
    for (let step=1; step<=72; step++) {
      const prior = [{role:'assistant',content:[{type:'text',text:'Existing tool trajectory'}]}];
      const before = structuredClone(prior);
      const event={sessionID:'child',agent:'worker',tools:{read:{}},system:[],messages:prior};
      await hooks.get('context')(event);
      assert.equal(Object.keys(event.tools).length,step>=70?0:1);
      assert.deepEqual(event.messages.slice(0, 1), before);
      assert.equal(event.messages.length, step>=70 ? 2 : 1);
      if(step>=70) {
        assert.match(event.system[0].text,/CHECKPOINT.*70|70.*CHECKPOINT/);
        assert.equal(event.messages.at(-1).role, 'user');
        assert.match(event.messages.at(-1).content[0].text, /CHECKPOINT/);
      }
    }
    await hooks.get('prompt')({sessionID:'child'});
  }
});
