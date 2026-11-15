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
      if (step >= 300) {
        event.tools = {};
        event.system.push({ text: `WORKER CIRCUIT BREAKER: primary request ${step}/300. Tools are disabled. Return a text-only PARTIAL or BLOCKED report with completed work, workdir, remaining changes, evidence and the decision needed from techlead. Do not claim unrun checks passed.` });
        return;
      }
      const level = step >= 250 ? 3 : step >= 180 ? 2 : step >= 100 ? 1 : 0;
      if (!level) return;
      const instruction = level === 1
        ? 'Check remaining acceptance criteria. Finish the current ticket; do not expand scope. Return PARTIAL or BLOCKED if there is no evidence-backed next action.'
        : level === 2
          ? 'Wind down now. Stop exploratory work and repeated failed approaches. Run only remaining required checks, preserve your changes and prepare the report.'
          : 'Finish the next safe action and return your report. Do not start another repair cycle. Report remaining work and blockers to techlead before tools are disabled.';
      event.system.push({ text: `WORKER ALARM LEVEL ${level}: primary request ${step}/300. ${instruction}` });
    });
  },
};
