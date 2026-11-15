# System and authority

## Roles

Architect is the only primary role. It owns product scope, module boundaries, interfaces, invariants, acceptance and integration order. It inspects relevant code and diffs but delegates technical investigation, decomposition, builds and repository mutations. It asks the human about intent, feel, ownership, accounts, budget and unresolved authority. Edit is denied; shell is denied except listed Git inspection prefixes. Shell workdir selects the checkout, not git -C.

Techlead is subagent-only and accepts one epic. It inspects baseline, verifies existing definitions and call sites, returns a compact ticket plan for architect approval before any worktree or implementation dispatch, constructs the ticket DAG, creates worktrees, reviews returned changes, independently runs checks, stages explicit paths, commits, integrates, pushes and cleans up. It cannot question the human directly; decisions return to architect. Shell/edit access supports arbitrary project toolchains, so path and ownership rules are not a sandbox.

Worker is subagent-only. It implements one ticket at the exact base SHA in an assigned clean worktree and exact tracked-file allowlist. Existing signatures need file:line evidence; requested new symbols are marked NEW. It leaves all work uncommitted. It must not create or switch branches/worktrees, merge, push, commit or spawn children. Ignored build outputs are allowed but never committed.

Delegation is strictly architect -> techlead -> worker. Both child-spawning roles deny other subagents explicitly; worker denies all. experimental.subagent_depth is 2. Built-in build, plan, general and explore are disabled; title, summary and compaction remain helpers.

## Integration authority

Architect must name the remote and target in DELIVERY before techlead may integrate and push main, master or release branches. Techlead verifies the combined result before normal push. If the remote advances, fetch and re-integrate without force. Workers never publish. Local permission matching cannot encode this conditional instruction: it remains a textual authorization contract. The global policy blocks selected destructive Git command forms, not every equivalent spelling.

## Direct edits

Techlead may repair code only in its own idle ticket worktree after recording the pre-edit diff: at most 10 added/deleted lines in one file, or 5 in each of two files. The repair must address a named compiler/linter error or failing ticket assertion. No public signature, contract, schema, dependency, configuration or test-meaning changes. It must rerun checks and report path, reason and line count under DIRECT EDITS. Larger repairs go to a worker. Workflow metadata and authorized memory maintenance are separate duties, not a loophole for product implementation.

## Memory and trust

Operator Memory is an optional external integration, not this repository's implementation. Follow its current injected guidance for user-global, project-private and project-shared partitions. Read only task-relevant catalogs/documents, update existing entries and never treat memory as proof of current code. Do not rewrite user-global or another session's notes. Publish shared knowledge only with authorization; never commit private brains or .operator/user. The conservative ignore rule excludes all .operator content until an explicit reviewed export is designed.

Without Operator installed, do not invent its catalogs or claim memory updates. Record approved project memory entrypoints and unavailable integration in project.md. Standard repository documentation can be used when architect approves it.

## Permission caveats

V2 permissions are ordered action/resource/effect entries; the last match wins. Agents inherit a broad base allow, so deny-all rules are intentional. external_directory limits file-tool access, not every possible shell action. Shell resources match command text; quoting, alternate shells and aliases matter. Autoaccept approves asks but cannot overturn deny. Review resolved permissions and avoid describing this as a security isolation boundary.
