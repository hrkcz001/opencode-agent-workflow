# Worker checkpoint

Dependency-free OpenCode V2 Promise plugin, retaining the `local.worker-alarm` ID for compatibility.

Every 70 worker primary request preparations, tools are removed for that round so the worker yields
to techlead. Native `steps: 70` is an independent boundary and may be reached before the plugin's
message; worker.md therefore defines the same concise checkpoint protocol. There is NO total ticket
step ceiling. Techlead can continue the same child through any number of reviewed rounds.

A checkpoint is CHECKPOINT plus at most three short bullets: progress, repeated failure, next action.
Reuse existing evidence links. No full report, new file, special commit or extra acceptance run just
for a checkpoint. Techlead inspects the incremental diff and evidence; continue if productive, redirect
if the same approach repeats the same failure without a new hypothesis. Full reports are only for
completion or an actual blocker. No warning messages are injected before the boundary.

Only worker context hooks count; title, compaction and auxiliary generation do not. A new prompt resets
that session's round. Counts survive plugin reload when ctx.storage is supplied; tests model storage
reuse, not a real restart. Failed preparations can count, retries reusing a preparation may not.
These are model-step preparations, NOT tool-call counts, wall time or semantic progress measurements.

The plugin does not launch techlead itself: the normal child-idle notification and parent prompt
protocol drive review/continuation. It does not kill processes or cancel background tasks. The plugin
is not an OS sandbox or a guarantee of model obedience. Architect/techlead have no step cap here.

Run from repository root:

    node --test extensions/worker-alarm/plugin.test.mjs tests/checkpoint.test.mjs

Callback tests cover yield/reset, persistence, isolation and repeated rounds beyond 210 steps.
No inference is used. See ../../docs/testing.md for verification boundaries.

V2 loading requires the package directory with package.json exports, not a direct index.mjs path.
Confirm active registration via `opencode api GET /api/plugin` after reload reconciliation.

References:
https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/promise/session.ts
https://opencode.ai/docs/agents/
