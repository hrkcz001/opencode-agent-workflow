# Testing and verification

## Reproduce local checks

From the repository root with Node.js 20 or newer:

    npm test

No package installation, credentials, service connection or inference is needed. The suite includes five real worker-alarm callback tests and static workflow tests. The callback adapter registers and invokes the plugin's actual setup hooks; it is not an inference simulator.

The five alarm tests cover progressive warning thresholds and persistence between thresholds, tool removal at and after 300 with role/session isolation, new-prompt reset isolation, storage reuse across plugin setup reload, and exact hook registration. Storage reuse is not proof of a real server restart.

Static tests check JSON parsing, role frontmatter and ordered delegation permissions, architect shell/edit restrictions, techlead question denial and direct-edit envelope, worker backstop and Git restrictions, consistent portable bootstrap paths, required seed schema fields, local Markdown links and privacy patterns. They are regression guards, not a full YAML parser, complete OpenCode schema validator or security proof.

## Compatibility inspection

The source setup was inspected with the real OpenCode v2.3.0 CLI without model calls. Loaded custom IDs were architect, techlead and worker, alongside title/summary/compaction helpers. Loaded prompt bodies and permission order were inspected; the worker had steps 300. The local.worker-alarm plugin was independently observed active through /api/plugin after plugin list reconciliation.

The exported configuration and agent frontmatter are additionally validated during publication against the installed server's OpenAPI Config.InfoEncoded and Config.AgentEncoded schemas. The CLI preferences retain the inspected live cli.json content. The hosted JSON-schema URLs rejected automated retrieval with HTTP 403; this is not presented as a hosted-schema validation pass. Publication checks do not install packages or expose credentials.

The export deliberately changes bootstrap paths to a portable home-relative convention, omits the private shell pin and makes external integrations opt-in. Those changes receive static/path checks; the exported package has not been installed over the live configuration. The live setup is not modified merely to test the export.

## Not verified by these checks

- Real model inference, provider billing/access and obedience to prompts.
- A generated contract in an actual project or a multi-agent implementation run.
- Runtime process cancellation, a real server-restart persistence cycle or every permission spelling.
- Cross-platform shell execution, dependency integration or human product acceptance.

After installation, use the read-only inspection steps in [setup](setup.md). Run a model-based trial only with authorization for the provider costs and project side effects. Keep private outputs outside commits and distinguish built, tested, runtime-verified, integrated and published states.
