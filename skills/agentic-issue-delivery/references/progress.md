# Durable progress contract

One coordinator owns this file. Place it at `draft_agentic-issue-<N>_<YYYY-MM-DD>/progress.md` under the stable checkout, **not** inside the ephemeral worktree. Ensure draft paths are gitignored.

```md
---
issue: <number>
phase: new
paseo: off
autoMerge: off
candidate: none
pr: none
---

# Issue <URL>
- Repository and origin: <owner/repo, verified>
- Requirement snapshot: <path/hash and adopted comments>
- Authorized base: <branch, base SHA>
- Coordinator: <session reference, last update>
- Workspace: <id, path, branch>
- Sessions: <plan/build/review IDs and modes>
- Source actions: <paths/versions>
- Last intent: <action, timestamp, scope>
- Last receipt: <remote ID or dispatch-unknown>
- Pinned candidate: <SHA, clean tracked/untracked check>
- Verification: <SHA, cwd, argv, version, exit, logs>
- Review: <report and findings disposition>
- Publication: <PR URL, head/base/SHA/draft readback>
- Merge: <explicit authorization source and merge commit receipt, if applicable>
- Current blocker and next step: <actionable details>
```

Phase enum: `new`, `plan`, `build`, `verify`, `review`, `publish`, `merge`, `done`, `blocked`.

## State transitions

`new → plan → build → verify → review → publish → done` (default Draft PR). Only explicit low-risk merge authorization allows `publish → merge → done`. Any phase may become `blocked` with a human-readable reason. A review finding returns to `build`; new candidate invalidates affected evidence.

For any external action, save an **intent** first; attempt the action; save the **receipt** only after readback. On timeout or crash, inspect external state; never assume failure. Store identifiers, summaries and digests, not secrets, raw tool errors or full private transcripts.
