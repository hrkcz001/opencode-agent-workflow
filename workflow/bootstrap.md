# Project workflow bootstrap

This is a seed, not an active project's contract. Architect owns project-specific schemas and decisions;
techlead discovers technical facts and writes the approved files. Do not copy placeholders as facts.

## Start and ownership

When `.opencode/workflow/project.md` is absent, Architect offers initialization and waits for the human's
agreement. An existing project contract is read and checked, not silently replaced. A missing template
or stale command is a targeted maintenance task, not a reason to reinitialize the project.

Architect then sends techlead a BOOTSTRAP request with the approved goal, known constraints, unknown decisions,
repository path and allowed documentation paths. This is the only dispatch that needs no project
Epic template. Bootstrap does not authorise product-code changes, dependency installation, commits,
pushes or runtime side effects. Ask separately if required. For a non-Git directory, ask whether to
initialize Git; never invent a remote or make the home directory into a repository.

Techlead inspects existing project instructions, Git/remotes, module structure, installed tools,
Operator setup and CI/build/test scripts. Return the findings, proposed verification commands,
required environment and proposed file contents to Architect before writing. Do not run unknown scripts
merely because their filename contains test. Architect resolves project/product decisions, approves exact
commands and template contents, then instructs the same techlead child to write and verify the files.
Techlead may edit these workflow documents directly; this is not product implementation.

All workflow documents are English, repository-owned and portable. Do not overwrite existing
AGENTS.md or Operator files, embed credentials or create per-user absolute paths in shared templates.
Use Operator's guidance for private/shared knowledge and refer to it instead of duplicating the brain.

## Deliverable files

Create these files in the repository's `.opencode/workflow/` directory:

- `project.md`: entrypoint, project status and the operating contract.
- `templates/epic.md`: Architect-to-techlead input.
- `templates/ticket.md`: techlead-to-worker input.
- `templates/worker-report.md`: worker-to-techlead result.
- `templates/techlead-report.md`: techlead-to-Architect result.
- `templates/verdict.md`: Architect acceptance result.

`project.md` must name: schema revision; ready or blocked status; project outcome and non-goals;
module/authority boundaries; approved remote/base and protected branch patterns; delivery authority;
worktree naming and dependency/integration strategy; exact verification commands with working-directory
rules, prerequisites, expected results and known baseline failures; manual/runtime tools, side effects
and evaluator; ignored/generated/evidence paths; memory entrypoints; relative links to all templates.
Mark unavailable checks explicitly, with reason and owner. Do not invent a working build or remote.
Record bootstrap approval and baseline revision without claiming human product acceptance.

## Template seed

Architect adapts these fields to the project. Templates may add project-specific invariants and checks;
retain identity, scope, verification, delivery and stop-condition information. A field may be none or
not run with a reason; it must not require fabricated evidence.

Epic:
- EPIC: id and title.
- GOAL: observable outcome; independently acceptable outcomes are separate epics.
- INVARIANTS: interfaces, units, authority and ordering.
- ACCEPTANCE: each method/command/tool, expected result and evaluator.
- SCOPE ALLOWED and SCOPE FORBIDDEN: paths/modules and excluded adjacent work.
- BASE: named remote ref, or explicit local SHA for an offline/local project.
- DELIVERY: keep local, push named branch, or integrate and push named remote/target.
- STOP CONDITION: when to report rather than continue, with retry policy if relevant.
- PLAN REVIEW: implementation begins with a plan-only return; Architect must approve the ticket plan
  before worktrees, registration or implementation dispatch.
- MEMORY: decisions/documents to update, or none.

Ticket:
- TICKET, WORKDIR and BASE: id, absolute assigned worktree, starting ref and exact SHA.
- PLAN: approved plan entry and the epic acceptance criterion this ticket closes.
- GOAL and FILES TOUCHED: one outcome and exact relative tracked-path allowlist.
- SIGNATURES: existing definitions with file:line; requested new definitions marked NEW.
- MUST HOLD and FORBIDDEN: inherited epic constraints plus ticket-specific restrictions.
- ACCEPTANCE: exact commands/tools, expected results and required runtime steps.
- STOP CONDITION: inherited stop condition and blockers.
- CONTRACT: schema revision and absolute project contract/worker-report paths for this checkout.

Worker report:
- TICKET, STATUS (DONE/PARTIAL/BLOCKED), WORKDIR, BASE, HEAD with uncommitted state.
- FILES with +/- counts and out-of-scope changes; WHAT CHANGED in up to three bullets.
- BUILD, TESTS and RUNTIME with actual commands, exit codes/counts and artifact/revision, or not run.
- ACCEPTANCE per criterion (PASS/FAIL/NOT RUN); NOT DONE; SCOPE CONCERNS; EVIDENCE paths/excerpts.

Techlead report:
- PLAN (initial implementation round): compact acceptance/module-to-ticket or named techlead-check map;
  each ticket has one independently verifiable outcome, relative file allowlist, acceptance method and
  expected result, dependencies/order. Explain genuinely inseparable work as COUPLED. Return and wait
  for Architect approval before execution; no separate plan file or full completion report is needed.
- STATUS; WORK with all workdirs/base/head SHAs and uncommitted remainder; DIFF and scope findings.
- BUILD, TESTS, RUNTIME; PRODUCT ACCEPTANCE from the human or pending/not required.
- ACCEPTANCE per epic criterion; DIRECT EDITS with paths, reasons, line counts and rerun checks.
- DELIVERY with target and verified remote SHA where pushed; MEMORY updates; UNRUN CHECKS.
- EVIDENCE; RISKS/LIMITS; OPEN QUESTIONS with decision owner and proposal.

Verdict:
- VERDICT (PASS/PARTIAL/RETURN); EVIDENCE CHECKED; CORRECTIONS tied to failed criteria or scope.
- ACCEPTED LIMITATIONS; NEXT epic or blocked owner.

## Acceptance and activation

Techlead verifies links and field coverage across all five templates, checks documented path conventions
against the selected shell, and runs only the approved baseline commands. Report exact outputs and
unavailable checks. Architect reviews the written diff and evidence, accepts or returns specific defects,
then marks the workflow ready through techlead. A blocked environment can be documented, but must not be
labelled ready for checks that cannot run. Do not dispatch ordinary implementation until Architect has
accepted a usable contract. Architect asks the human only for unresolved intent, authority, budget or
side-effect approval, not to write templates or run Git.

## Local runtime helpers

Record the installed helper path and approved invocation in project.md: `node` plus the absolute
path to `$HOME/.config/opencode/tools/workflow.mjs`, using `--repo` for the project checkout.
Read `$HOME/.config/opencode/workflow/runtime.md` for commands and ticket-spec fields. Keep runtime
state and evidence in the Git common directory, outside shared contracts and commits. Define named
exclusive resources and approved check argv/timeouts in ticket specs. Preparing worktrees and smoke
commands remains project-specific; use existing scripts rather than adding a generic installer.

A worker checkpoint is a brief review every 70 model steps, not a full report or a fixed total budget.
Techlead reviews the diff/evidence and continues the same session; final schemas apply at completion
or a real blocker. Do not add per-checkpoint paperwork to the project templates.

## Normal operation and updates

Architect reads the project contract and epic/verdict templates; techlead reads the contract and ticket/techlead
report templates; workers receive the absolute contract and worker-report paths from techlead. Child
sessions have fresh context: include the full task and relevant invariants, not only template links.
Resolve project paths against the assigned checkout/worktree. For newly created workflow documents
not committed into a ticket's base yet, techlead passes their full approved text inline or an accessible
absolute path; never pretend they exist in the new worktree.

The normal implementation lifecycle is Architect epic -> techlead baseline/ticket plan -> Architect plan
approval -> same techlead creates worktrees/registers tickets -> worker implementation and evidence
-> techlead independent verification/commit/integration -> Architect verdict and memory upkeep. Reject
whole-epic forwarding when independently verifiable outcomes exist; one lead may execute sequential
tickets, and genuinely coupled interface/consumer changes stay together. Architect alone
approves schema changes. Techlead proposes evidence-backed corrections to stale commands/templates;
record the revision and update existing files rather than forking a template per ticket. A fresh
worker round after 70 steps requires techlead to inspect progress and continue or redirect briefly,
not blindly resend the same request to reset its counter. No full report is required at checkpoints.
