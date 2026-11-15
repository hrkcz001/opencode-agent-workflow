# Pipeline and project contracts

## Consent-first bootstrap

The global workflow/bootstrap.md is a seed, not an initialized project. When .opencode/workflow/project.md is absent, architect offers initialization and waits for human agreement. Existing contracts are maintained, not regenerated. Preserve AGENTS.md and existing Operator knowledge.

1. Architect dispatches BOOTSTRAP with the approved outcome, constraints, unknowns, repository path and permitted documentation paths. This is the only request that does not need an epic template.
2. Techlead inspects instructions, Git/remotes, modules, tools, memory setup, existing CI and scripts. It proposes exact document contents and baseline commands before writing or running unknown scripts.
3. Architect resolves decisions and approves exact contents and commands. Techlead writes workflow documents directly. This does not authorize product changes, installs, commits, pushes or runtime side effects.
4. Techlead checks links, schema field coverage and approved baselines. Architect inspects the actual diff and evidence, then accepts a usable contract. Environment gaps remain explicit and must not be represented as passing checks.

No project is initialized merely by installing this package. No example of generated project files is presented as an actual model run.

## External files

All six project files live under .opencode/workflow/:

- project.md: schema revision and ready/blocked status, goal/non-goals, module authority, approved remote/base and protected branches, delivery authorization, worktree/DAG strategy, exact commands/cwd/prerequisites/expected results, baseline failures, manual/runtime checks and evaluator, side effects, generated/evidence paths, memory entrypoints and template links.
- templates/epic.md: outcome, invariants, acceptance methods/results, allowed/forbidden scope, base, delivery, stop condition and memory obligations.
- templates/ticket.md: one outcome, absolute WORKDIR, exact BASE SHA, exact relative FILES TOUCHED allowlist, verified existing SIGNATURES or NEW symbols, inherited constraints, acceptance, stop condition, schema revision and absolute contract/report paths.
- templates/worker-report.md: DONE/PARTIAL/BLOCKED, base/head and uncommitted state, files and line counts, changes, observed build/test/runtime results, acceptance PASS/FAIL/NOT RUN, not-done work, scope concerns and evidence.
- templates/techlead-report.md: worktrees/SHAs/remainder, scope review, independent verification, human acceptance status, DIRECT EDITS, delivery remote SHA, memory updates, unrun checks, evidence, limitations and questions with owners.
- templates/verdict.md: PASS/PARTIAL/RETURN, inspected evidence, corrections tied to failed criteria or scope, accepted limitations and next epic/blocking owner.

Architect owns schema changes. Record revision updates. Adapt the seed to the project instead of copying placeholders as facts. Use relative links in committed documents, resolving them in the assigned checkout. Dispatches include absolute relevant paths and the approved revision. Documents newly written outside a ticket's base must be supplied inline or at an accessible absolute path; never reference nonexistent files in a fresh worktree.

## Ordinary work

Architect implementation epic -> techlead baseline and compact ticket plan -> architect plan approval -> same techlead creates worktrees/registers tickets -> worker implementation -> techlead review and independent verification -> explicit staging and commits -> authorized integration/publication -> architect verdict and memory maintenance.

The first techlead round returns before implementation dispatch or product edits. Its PLAN maps every epic acceptance criterion and requested module to a scoped worker ticket or named techlead check. Each ticket names one independently verifiable outcome, relative allowlist, acceptance method/expected result and dependency order. Architect returns whole-epic forwarding when independent outcomes exist; a single ticket needs a concrete COUPLED rationale, not merely the ability of one worker to build everything. One lead may execute sequential tickets; no fixed ticket or directory count applies. Coupled interface/consumer changes that cannot pass separately stay together.

Keep PLAN as a short table/list in the approved techlead-report format, not a new file or checkpoint ritual. Material scope/acceptance/dependency changes return for approval before affected dispatch. Existing project templates need an architect-approved targeted revision if PLAN is missing; do not silently rewrite their schemas.

Fetch the named base remote and record its SHA, or verify the explicit local SHA for offline work. Dependent tickets branch from reviewed prerequisite results, not unrelated remote HEAD. Parallel tickets need separate worktrees, disjoint files/interfaces and no shared single-instance editor, port, database or build-output resource. Otherwise serialize.

Subagent calls are asynchronous. Retain sessionID, do independent work or end the turn until idle notification, then continue the same child for corrections. Do not poll or spawn duplicate work; new children have fresh context. Never edit a worktree while its worker is running.

Review tracked and untracked changes, secrets, test weakening and dependency changes. Techlead must rerun acceptance itself, not accept the worker's report as proof. Stage reviewed paths explicitly and inspect staged diff before committing. Clean up only clean owned worktrees after integration into a retained branch; delete local branches only with git branch -d. Preserve partial, unmerged and other-session work.

## Evidence and verdicts

Implemented, built, tested, runtime-verified, integrated and published are distinct states. Human product acceptance is separate. Evidence identifies the diff, actual command, cwd, exit, counts and artifact/revision; external logs stay outside commits. Unrun checks are NOT RUN with reason and owner. A failing baseline is not automatically a regression.

RETURN requires a failed acceptance criterion or forbidden change and a specific correction. PARTIAL within the stop condition is legitimate; do not repeat work until it looks like PASS. Accepted cosmetic limitations do not justify another round. Every 70 model steps, worker yields at most three bullets. Techlead inspects incremental progress and briefly continues or redirects the same child, without a full report, extra checks or paperwork. No total step ceiling applies. See [runtime](../workflow/runtime.md) for durable state and evidence commands.
