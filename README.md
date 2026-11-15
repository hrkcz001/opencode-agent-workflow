# OpenCode agent workflow

A reusable OpenCode V2 workflow with three roles, project-owned contracts, isolated ticket worktrees, independent verification and a worker checkpoint boundary.

    Human -> architect -> techlead -> worker
                          review <- uncommitted changes
             verdict  <- evidence and delivery

Author: Hermes Agent by Nous Research. Copyright: Andrej Morozov. [MIT license](LICENSE).

## What is included

- [Role prompts](agents): architect owns scope and architecture, techlead owns execution and delivery, worker implements one ticket.
- [Bootstrap seed](workflow/bootstrap.md): consent-first initialization of project-specific contracts and five external templates.
- [Worker alarm](extensions/worker-alarm/README.md): dependency-free V2 plugin; lightweight progress review every 70 model steps, without a total task ceiling.
- [Configuration example](opencode.example.json) and optional [CLI preferences](cli.example.json).
- [Optional integration fragment](examples/integrations.example.json) for Operator Memory and Context7. No third-party implementation is vendored.
- [Local runtime](workflow/runtime.md): durable ticket state, evidence runner and dependency/resource eligibility.
- Dependency-free tests. No installer, credentials, sessions, private memory or model calls are included.

## Start here

1. Read [setup](docs/setup.md), choose models available to your own account and review the permission policy.
2. Install the allowlisted files into your OpenCode configuration root, merging rather than replacing existing settings.
3. Inspect the loaded roles and plugin without invoking a model.
4. In a project, ask architect for the outcome you want. If the project contract is absent, it must offer initialization and wait for your agreement.

The supplied models are a reference preset, not a promise of universal access: Sol for architect, Terra for techlead and compaction, DeepSeek for worker, Luna for title and summary. Configure every model before use. The default human-facing prompt language is Russian; source, project documents and child reports are English. Change that sentence in architect.md if desired.

## Documentation

- [System and authority](docs/system.md)
- [Pipeline and project contracts](docs/pipeline.md)
- [Installation and configuration](docs/setup.md)
- [Limitations and recovery](docs/limitations.md)
- [Tests and verification boundaries](docs/testing.md)
- [Third-party dependencies](THIRD_PARTY.md)

This is an autonomous workflow, not an OS sandbox. File ownership and conditional integration authority are partly prompt-enforced. Optional CLI preferences use autoaccept; explicit denies still apply. Review before enabling.

## Test

From the repository root with Node.js 20 or newer:

    npm test

No npm install is required. The plugin uses Node's built-in test runner and no packages. Compatibility baseline: OpenCode v2.3.0. Tests exercise callbacks and static contracts, not real inference or human product acceptance.
