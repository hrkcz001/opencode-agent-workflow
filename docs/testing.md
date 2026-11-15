# Testing and verification

## Reproduce local checks

From the repository root with Node.js 20 or newer:

    npm test

Runtime tests use temporary Git repositories and real child commands to exercise state transitions, stale evidence, scope/modes, reservations, interruption recovery and timeouts. Checkpoint tests exercise four successive rounds without a total ceiling. No package installation, credentials, service connection or inference is needed. The suite includes five real worker-alarm callback tests and static workflow tests. The callback adapter registers and invokes the plugin's actual setup hooks; it is not an inference simulator.

The alarm tests cover absence of pre-checkpoint overhead, tool removal at and after 70 with role/session isolation, new-prompt reset isolation, storage reuse across plugin setup reload, and exact hook registration. Storage reuse is not proof of a real server restart.

Static tests check JSON parsing, role frontmatter and ordered delegation permissions, architect shell/edit restrictions, techlead question denial and direct-edit envelope, worker backstop and Git restrictions, consistent portable bootstrap paths, required seed schema fields, local Markdown links and privacy patterns. Ticket-plan tests check that both roles and bootstrap preserve the pre-dispatch return/approval boundary, acceptance/module coverage, coupled-work exception and sequential execution, and that documentation admits the semantic limit of registration. These are textual contract checks, not a semantic planner or model-obedience test. They are regression guards, not a full YAML parser, complete OpenCode schema validator or security proof.

## Compatibility inspection

The source setup was inspected with the real OpenCode v2.3.0 CLI without model calls. The original publication used a 300-step emergency cap; the current release replaces it with repeatable 70-step review rounds. Loaded custom IDs were architect, techlead and worker, alongside title/summary/compaction helpers. Loaded prompt bodies and permission order were inspected; the worker initially had steps 70. Subsequent real inference exposed its conflicting mandatory summary; native steps is now intentionally unset. The local.worker-alarm plugin was independently observed active through /api/plugin after plugin list reconciliation.

The exported configuration and agent frontmatter are additionally validated during publication against the installed server's OpenAPI Config.InfoEncoded and Config.AgentEncoded schemas. The CLI preferences retain the inspected live cli.json content. The hosted JSON-schema URLs rejected automated retrieval with HTTP 403; this is not presented as a hosted-schema validation pass. Publication checks do not install packages or expose credentials.

The export normalizes bootstrap paths to a portable home-relative convention, omits the private shell pin and makes external integrations opt-in. Those changes receive static/path checks. Runtime fixes are backed up and installed into the live configuration only after isolated validation; private config and provider credentials are never published.

## Authorized Windows inference trial

An isolated OpenCode v2.3.0 config was exercised with architect, techlead and DeepSeek worker.
The disposable Rust/egui calculator completed bootstrap, implementation, independent fmt/test/build
checks and local integration. All 19 arithmetic/UI-state tests passed; the executable opened.
Interactive GUI clicks were not verified. Production settings were not shortened for this trial.

The original native step cap forced long summaries. Removing it exposed literal DSML at the tool-free
boundary in a minimal probe. Adding a request-local control message after tool results produced a
concise CHECKPOINT; a real techlead/worker probe then continued the same child through several rounds.
A stricter probe independently verified three automatic four-request boundaries in the same worker
session, all ten individual shell outputs in order, at most three English bullets per checkpoint,
and no DSML or native maximum-step summaries. The four-request threshold was isolated test-only.
These observations are specific to the tested runtime/provider, not an obedience guarantee.

## Not verified by these checks

- Other provider/model combinations or guaranteed prompt obedience.
- Runtime process cancellation, a real server-restart persistence cycle or every permission spelling.
- Cross-platform shell execution, dependency integration or human product acceptance.

After installation, use the read-only inspection steps in [setup](setup.md). Run a model-based trial only with authorization for the provider costs and project side effects. Keep private outputs outside commits and distinguish built, tested, runtime-verified, integrated and published states.
