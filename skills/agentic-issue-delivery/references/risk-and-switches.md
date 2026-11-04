# Risk, switches, and authority

Two independent intents: `paseo` (issue intake) and `autoMerge` (post-validation merge). An issue label cannot by itself grant credentials, start a daemon, authorize a model to run unrestricted, or permit merging. The current explicit user instruction has priority over labels and earlier notes.

| Impact | Examples | Default exit |
| --- | --- | --- |
| Low | isolated documentation, reversible visual-only change without contract change | Draft PR; merge *may* be authorized expressly |
| Medium/high | runtime/channel behavior, API/schema, persistence/recovery, external effects, security/permissions, deployment, automation, merge rules | Draft PR, human review |
| Unknown | unverified blast radius | Draft PR; block if evidence insufficient |

At handoff and **again before merge**, read current labels and relevant code consumers; reassess actual impact, not line count. Never upgrade a removed `autoMerge` label just because the risk decreased later. A repo branch rule takes precedence. A user-requested `autoMerge=off` always stays off until explicitly changed.

## Permission mode

Choose an ADE-supported least-privileged execution mode. An unrestricted mode (`full-access`, `bypassPermissions`, etc.) can run commands, edit files and access the network and should be a **conscious explicit opt-in**, not a default. Prompt-level scope does not technically constrain OS permissions.

If model/provider auth fails, first distinguish *authentication error* from pending approval, timeout or unknown dispatch receipt. Do not rerun a failed or apparently stuck task with a different model without examining its existing session and outputs.
