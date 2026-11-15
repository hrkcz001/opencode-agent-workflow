# Worker alarm

Local OpenCode V2 Promise plugin, without package dependencies or extra model calls.

Policy:
- Only the `worker` agent's primary `context` hook increments the counter.
- Requests 100-179 ask it to check remaining acceptance and avoid expanding scope.
- Requests 180-249 ask it to wind down and finish required verification.
- Requests 250-299 ask it to finish the next safe action and report.
- Request 300 and later remove all tool definitions and require a text-only partial/blocker report.
- `worker.md` also sets native `steps: 300` as an independent native backstop.
- A new prompt to that session resets the round. Techlead must review and revise/narrow the ticket
  before continuing an exhausted child, rather than blindly resetting its allowance.
- Counts persist through plugin reloads when the host supplies ctx.storage; the unit test models
  storage reuse, not a real server restart.
- Architect and techlead have no step cap from this plugin.

A count is a primary request preparation, not a tool call, token count or elapsed-time budget.
Compaction, title and auxiliary generate hooks are not registered and do not increment it.
Failed primary preparations can count; provider retries that reuse an already prepared request do
not necessarily count again. This is an emergency boundary, not a measured productivity target.
Warnings remain in each outgoing request while their level is active; they are not appended to the
stored conversation, so they do not accumulate a growing transcript.

This does not kill running processes, cancel already launched background commands, detect semantic
lack of progress or guarantee a final report. It prevents further tool exposure at the request
boundary and uses native steps as a backstop. It is not an OS sandbox.

Run tests from this repository root:

    node --test extensions/worker-alarm/plugin.test.mjs

Compatibility baseline: OpenCode v2.3.0. The unit suite contains five callback tests.
Loaded-state inspection and test results are described in ../../docs/testing.md.
No real model request was made for validation. Tests exercise the registered callbacks through a
minimal host adapter; they do not simulate inference or prove model obedience to warnings.

API references:
https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/README.md
https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/promise/session.ts
https://opencode.ai/docs/agents/

The V2 loader expects a local package directory with package.json exports, not an index.mjs path.
After reload, registry listing can briefly be empty while plugins reconcile; confirm active status
through `opencode api GET /api/plugin`, not just the reload exit code.
