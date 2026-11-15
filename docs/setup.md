# Setup

## Requirements and compatibility

The compatibility baseline is OpenCode v2.3.0, Git and Node.js 20 or newer. OpenCode releases and schemas can change; inspect your installed version rather than mixing V1 permission syntax into these V2 prompts. No package install is required for this repository's tests or worker-alarm plugin.

Authenticate providers using OpenCode's own supported flow. Never put API keys, auth databases or service.json in this repository. The examples contain no credentials and do not authenticate an account.

## Manual installation

Back up only the existing files you will change to a private location. Merge deliberately; do not copy this repository over an entire live configuration directory.

The prompt defaults assume the global configuration root is $HOME/.config/opencode. If your root differs, replace every occurrence of $HOME/.config/opencode/workflow in architect.md and techlead.md with your real absolute forward-slash path, including both body references and permission resources. $HOME in prompt prose is a convention to resolve before using a file tool, not a claim that every tool expands variables. Verify that loaded permission paths resolve correctly. Do not put machine-specific edits back into a public commit.

Copy this exact allowlist into that configuration root:

- agents/architect.md
- agents/techlead.md
- agents/worker.md
- workflow/bootstrap.md
- extensions/worker-alarm/package.json
- extensions/worker-alarm/index.mjs

The alarm README and tests may also be copied for local reference. Merge opencode.example.json into opencode.json; for a new configuration, copy it under that name. Plugin paths are relative to the configuration source: ./extensions/worker-alarm must point to the package DIRECTORY with package.json exports, not index.mjs. Preserve unrelated configuration and existing credentials outside this export.

Optionally merge cli.example.json into cli.json. Its theme and navigation keys are preferences, not workflow requirements. Its session.permissions is autoaccept: review before enabling, as permission asks will not protect you while explicit denies still apply.

Do not create old-role aliases. Existing sessions that remember former agent IDs may need a fresh session; installing these files does not migrate them.

## Models and compaction

Edit the model field in all three Markdown frontmatters and the title, summary and compaction model fields in opencode.json. The reference preset uses openai/gpt-6.1-sol, openai/gpt-6.1-terra, openai/gpt-6-luna and openrouter/deepseek/deepseek-v4.1-flash-1017. Availability and billing depend on your provider/account. Replace or remove the reference DeepSeek provider model override if you choose another model; it includes routing preferences and a 480000 context / 32000 output limit, not universal model metadata.

Use opencode models to inspect catalog resolution. A listed model is not proof that inference succeeds. No paid smoke request is required to inspect configuration.

The example preserves buffer: 70% and keep.tokens: 15000. Buffer is the fraction kept FREE, so compaction is around 30% full, not 70%. At a 480000-token effective window this is roughly 144000 tokens; account caps and other model windows change the threshold. This setting is global, not per-role. Reassess the reference preset for your models.

## Shell and paths

No shell is pinned in the portable example. OpenCode may choose an inherited SHELL or another host default. If necessary, set shell locally to a working absolute executable path, then test cwd, Git, UTF-8 output and nonzero exit propagation with a harmless command. There is no dependency on custom Windows proxy executables.

GET /api/config/shell lists candidates; it does not prove the selected shell. The /api/shell endpoint can execute a harmless probe without model inference; consult the installed OpenAPI request schema and inspect the returned shell/output/status. Do not send unknown scripts or mutate a project just to probe selection.

Use explicit workdir for every shell call. A previous cd does not persist. File tools need absolute paths when their session location differs from the assigned worktree. On Windows prefer native forward-slash paths such as an actual drive-rooted checkout path; Bash, PowerShell and cmd syntax differ. The default worktree convention is $HOME/wt/<repo>-<ticket>; adjust both permission resources and prose consistently if changing it.

## Optional integrations

The core example loads only worker-alarm. examples/integrations.example.json is a fragment to MERGE if you deliberately install Operator Memory and Context7. Array merging is manual: retain the alarm entry rather than accidentally replacing it. External packages are not installed by this repository.

Operator Memory uses @aerovato/operator-opencode-v2. Follow its current installation, licensing and partition guidance. Context7 uses the context7-mcp executable already installed by the user. The example timeouts are milliseconds: startup/catalog 20000, execution 120000. Confirm that executable is on the actual OpenCode server PATH; do not assume it exists or silently invoke a package installer.

## Inspect loaded state

After completing your local configuration edits:

    opencode --version
    opencode reload
    opencode debug config
    opencode debug agents
    opencode plugin list
    opencode api GET /api/plugin
    opencode models

Do not share raw debug config output publicly without review. Confirm architect is default; only architect, techlead and worker are custom workflow roles; architect can spawn only techlead, techlead only worker, worker none; worker has steps 300. Compare the loaded prompt bodies with the installed files. Verify local.worker-alarm is active via API. Plugin lists can briefly be empty during reconciliation after reload, so do not interpret a single immediate empty listing as failure.

Then enter a fresh project session and request a concrete outcome. Architect must ask before bootstrap. See the [pipeline](pipeline.md) for the consent and acceptance lifecycle. Configuration inspection does not demonstrate an end-to-end model run.
