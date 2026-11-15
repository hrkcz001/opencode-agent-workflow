# Local workflow runtime

Create ticket worktrees through the installed path-checking helper before registering a spec:

    node /absolute/config/tools/worktree.mjs --repo /absolute/project create --path /absolute/worktree --branch ticket-branch --base BASE_SHA

On Windows it converts MSYS drive paths to native paths and verifies the actual Git root and common
directory. Existing paths are refused; verification failures preserve the created tree for inspection.

The registry helper below requires Node 20+ with no dependencies. It has no daemon, model calls,
package install, automatic dispatch or Git mutation; the separate worktree helper above creates branches/worktrees. All commands return JSON. Use an absolute script path and explicit repository:

    node /absolute/config/tools/workflow.mjs --repo /absolute/project help

State and evidence live under `git rev-parse --git-common-dir` in `workflow-runtime/`, shared across
linked worktrees but never committed. Do not delete the repository's Git directory while work is
pending. Logs may contain application secrets: they are private, not automatically redacted.

## Ticket specification

Techlead writes an approved JSON spec outside the product worktree, then calls `add SPEC.json`.
Required fields:

    {
      "id": "T1",
      "workdir": "/absolute/assigned-worktree",
      "base": "exact-full-HEAD-SHA",
      "files": ["src/module.js"],
      "dependsOn": [],
      "resources": ["test-db"],
      "checks": [{"id": "test", "command": ["node", "--test"], "timeoutMs": 600000}]
    }

Paths and SHA above are explanatory placeholders, not runnable facts. Register prerequisites first;
this prevents cycles. Verified prerequisites are frozen while dependents run; do not reopen or edit
them under an active dependent. The helper checks recorded states, not semantic dependency freshness. Exact relative files only; no globs. Dependencies must be verified/integrated
before claim. Record dependent worktree BASE from the reviewed prerequisite commit. The helper does
not create worktrees or infer how several dependency commits should be combined.

Check commands are argv arrays, not implicit shell strings. For shell syntax explicitly name the
host shell and its flags. On Windows use `node` plus an npm CLI path or an explicit shell for .cmd
wrappers. Default timeout is 10 minutes; maximum configurable timeout is one hour. A timeout stops
the direct process, not guaranteed descendants; do not use this runner for background servers.
Use project-approved prepare-worktree/smoke scripts where needed, not arbitrary generated installers.

## Lifecycle

- `add SPEC.json`: validate a clean same-repository worktree and exact base, register ready ticket.
- `ready`: list candidates and blocking dependencies/files/resources. This is NOT a disjoint batch:
  claim sequentially so later candidates see reservations. File conflicts are conservative across
  this repository's tickets; resources are explicit project-wide exclusive names.
- `claim ID --session CHILD`: reserve worktree/files/resources before dispatch.
- `review ID`: completed worker round enters final review, not automatic success.
- `run ID CHECK --by techlead`: independently execute an approved check and retain stdout/stderr,
  exit, argv, cwd and before/after fingerprints. `--by worker` is available but cannot satisfy review.
  Failed checks preserve evidence and return a nonzero exit. Check output is streamed to disk.
- `verify ID`: reject scope violations and missing/failed/stale evidence, then mark verified.
- Stage/commit reviewed code yourself. `integrate ID --target REF` records integration only if that
  exact target is the committed verified content. It does not merge or push. A combined merge result
  requires its own integration ticket/checks in its worktree; an ancestor's tests are not sufficient.
- `status`: all durable ticket data and storage location.
- `reconcile`: inspect current worktrees, dirty state and verification freshness. Read-only report;
  does not query OpenCode, claim session death, release reservations or launch anything.
- `interrupt ID --reason TEXT` / `block ID --reason TEXT`: retain work and reservations.
- `resume ID --session CHILD --reason TEXT`: after inspecting child liveness/diff, continue the same
  task with a recorded reason. Dirty partial work is preserved. Evidence is revalidated at review.

Every 70 worker model steps, pause for a lightweight techlead review. Keep the ticket running; this
is not a lifecycle transition and needs no ledger entry, new document, commit, full report or extra
acceptance run. Worker gives at most three bullets, techlead inspects incremental progress and sends
one short continue/redirect message to the same child. Repeat as needed without a total step ceiling.
The checkpoint plugin is the sole round boundary. Leave native worker `steps` unset: its mandatory
full-summary instruction conflicts with the lightweight checkpoint protocol.

## Evidence validity and recovery

Fingerprint covers tracked and nonignored untracked file bytes, paths and modes, plus HEAD. Ignored
build outputs/environment are not fingerprinted: evidence does not prove reproducibility against a
changed SDK, external database or service. Record those separately in project acceptance. Symlinks,
submodules and an unmerged index fail closed in this first version. Checks modifying source cannot
pass verification until rerun on stable source. Git status/snapshots are not an OS filesystem freeze.

A per-repository lock serializes commands, including checks. Worker implementations may run in
parallel, but evidence commands serialize; this deliberately avoids concurrent ledger writes. If the
runner is killed, inspect `lock/owner.json` and confirm the process/children stopped before removing
ONLY that lock directory. Stale locks are never auto-broken. State writes use atomic rename, not a
transaction with Git. Malformed state errors rather than resetting. Inspect retained evidence after
an interrupted check; never infer success from a missing result.

No automatic deletion, reset, force removal, push or restart. A dirty interrupted tree is retained
in place. Resume after review or leave blocked with path/reason; cleanup follows the existing clean,
owned, integrated-only policy. Role labels are cooperative metadata, not authentication. This helper
is a local coordination tool, not a sandbox or tamper-proof audit system.

## Borrowed mechanisms

The implementation is original; these designs informed the small subset selected:
- Durable work/session/worktree mapping: https://github.com/code-yeongyu/oh-my-openagent/blob/dev/packages/boulder-state/AGENTS.md
- Explicit claims/resources and reconciliation: https://github.com/openai/symphony/blob/main/SPEC.md
- Evidence before task closure: https://github.com/code-yeongyu/oh-my-opencode/blob/dev/docs/guide/orchestration.md
- Project startup scripts and progress recovery: https://www.anthropic.com/research/effective-harnesses-for-long-running-agents
