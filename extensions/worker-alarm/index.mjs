export default {
  id: 'local.worker-alarm',
  async setup(ctx) {
    const counts = new Map();
    const key = sessionID => `round/${sessionID}`;
    await ctx.session.hook('prompt', async (event) => {
      counts.delete(event.sessionID);
      if (ctx.storage) await ctx.storage.remove(key(event.sessionID));
    });
    await ctx.session.hook('context', async (event) => {
      if (event.agent !== 'worker') return;
      const stored = counts.has(event.sessionID)
        ? counts.get(event.sessionID)
        : ctx.storage ? await ctx.storage.get(key(event.sessionID)) : 0;
      const step = (Number.isSafeInteger(stored) && stored >= 0 ? stored : 0) + 1;
      counts.set(event.sessionID, step);
      if (ctx.storage) await ctx.storage.set(key(event.sessionID), step);
      if (step >= 70) {
        event.tools = {};
        event.system.push({ text: `WORKER CHECKPOINT: primary request ${step}/70. Tools are disabled. Yield to techlead for progress review. Return only CHECKPOINT plus at most three short bullets: progress since last review, any repeated failure, next action. Link existing evidence only; do not run extra checks or write a full report for this boundary. Preserve all required changes. This is a review boundary, not a total task limit; techlead may continue this session after inspecting progress. Do not claim unrun checks passed.` });
        return;
      }

    });
  },
};
