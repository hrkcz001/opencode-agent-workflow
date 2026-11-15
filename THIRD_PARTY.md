# Third-party dependencies and attribution

The MIT license in this repository covers its workflow prompts, documentation, tests and worker-alarm implementation. No third-party implementation is vendored or relicensed here.

- OpenCode is the external runtime: https://github.com/anomalyco/opencode and https://opencode.ai/docs/ . Consult the exact runtime version's own license and plugin API. Compatibility baseline: v2.3.0.
- Operator Memory is an optional external plugin, @aerovato/operator-opencode-v2: https://www.npmjs.com/package/@aerovato/operator-opencode-v2 . Inspect its package metadata, license and partition guidance independently. A package name in a config fragment is not a vendored implementation or license grant.
- Context7 is an optional external MCP integration: https://github.com/upstash/context7 . Review its own license, installation and service terms.
- Git and Node.js are external tools under their respective licenses. The tests use Node's built-in runner; no npm dependency tree is included.
- Model and provider names identify configurable external services, not bundled software, endorsements, credentials or access guarantees. Their account and billing terms are independent.

The plugin README links to upstream API sources. Those upstream links may move with the development branch; inspect installed/version-matched sources when adapting to a different OpenCode release.
