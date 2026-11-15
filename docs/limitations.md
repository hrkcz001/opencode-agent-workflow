# Limitations and recovery

## Boundaries

- Prompt ownership rules, exact file allowlists and conditional integration authorization are not OS isolation. Static shell patterns deny selected forms, not every equivalent command. Do not grant this setup access to secrets or destructive production operations on the assumption it is sandboxed.
- Custom Markdown bodies replace the provider base prompt; project instructions and plugins still contribute context. Review the complete resolved configuration.
- The plugin counts worker primary context preparations, not tool calls, time or semantic progress. Native steps and context-hook counts are related but not identical. Failed preparations can count; retries that reuse a prepared request may not.
- The checkpoint boundary removes future tool definitions; it does not kill running processes, cancel background jobs or guarantee an honest final report. A native step limit can stop a session before the plugin obtains a final reporting opportunity.
- Persistence relies on ctx.storage supplied by the host. Without storage, counts are in-memory only. A new prompt resets only the addressed session's round. Architect and techlead have no small strict step quotas.
- Model IDs are examples. No inference, project bootstrap, DAG integration or human product evaluation is proven by static/unit tests.
- Optional Operator and Context7 packages have their own lifecycle, trust boundaries and licenses. This export does not bundle or install them.

## Worker checkpoints and interrupted work

Preserve the child's sessionID, worktree path, base/head SHA, uncommitted diff and evidence. Inspect actual progress and any running background job before doing cleanup. At normal checkpoints techlead briefly inspects existing progress and continues or redirects; no full report or extra check suite is required. For actual interruption, reconcile durable state and confirm the child is idle before resuming. Do not blindly resend to reset the counter, spawn duplicate work, or delete partial/unmerged output.

## Recover missing contracts

Do not invent inline report schemas. If project.md is absent, architect offers bootstrap and waits for consent. If an existing contract has a missing or stale template, propose a targeted revision to architect. Newly written workflow files may not exist in older ticket bases: pass full approved contents inline or accessible absolute paths, not links that cannot resolve.

## Recover configuration issues

Use debug agents and debug config before inference. Check model catalog resolution separately from provider authentication. Check plugin package directory and exports, then API registration. A reload exit of zero alone does not prove active registration. Consult local OpenCode logs privately if necessary; never upload logs, sessions, auth files or service.json. Do not read authentication material to discover API endpoints.

Restore only the files you changed from your own private backup if required, then reload and inspect again. Do not recursively replace the global configuration or overwrite unrelated settings. Old sessions may retain removed role IDs: use a fresh session rather than adding duplicate aliases.

## Recover delivery problems

An unrun check is NOT RUN, not PASS. A failing baseline is not automatically caused by a ticket. If authority is unclear, techlead returns the decision to architect; the human is not made the Git operator. If the remote moved, fetch and re-integrate in the authorized clean integration worktree, rerun acceptance and push normally. Never force-push, delete remote branches or forcibly clean up another session's work. Report partial/unmerged paths and SHAs instead.
