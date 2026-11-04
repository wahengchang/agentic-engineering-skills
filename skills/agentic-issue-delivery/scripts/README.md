# Optional foreground Issue intake (Paseo adapter)

**Status: prototype / offline-tested only.** Not an exact copy of any existing team's daemon. Live Paseo and GitHub dispatch has not been validated.

Preconditions: Node.js 22+, `git`, `gh` logged into the correct GitHub account, Paseo CLI and a configured existing **workspace ID**, discovered provider/model and supported permission mode. Run from the **stable repository root**. Add `/.local/agentic-issue/` and `/draft_agentic-issue-*/` to that project's `.gitignore` or `.git/info/exclude` before starting.

```sh
# Read installed runtime capabilities; no AI task started.
gh auth status
paseo status --json
paseo workspace ls --json
paseo provider ls --json

# Opt in and set a high-water boundary at the latest existing issue.
node .agents/skills/agentic-issue-delivery/scripts/issue-intake.mjs init \
  --workspace <PASEO_WORKSPACE_ID> --provider <DISCOVERED_PROVIDER/MODEL> \
  --mode auto-review

# Verify exact scope and no active work.
node .agents/skills/agentic-issue-delivery/scripts/issue-intake.mjs status

# One poll, which MAY launch exactly one eligible agent.
node .agents/skills/agentic-issue-delivery/scripts/issue-intake.mjs tick

# Foreground loop: Ctrl+C stops new polling. Default interval 10m.
node .agents/skills/agentic-issue-delivery/scripts/issue-intake.mjs start --every 10m
```

**Watch conditions:** Only open issues created **after the initialization boundary**, authored by the configured GitHub account, and carrying the exact `paseo` label. No model is launched for an empty queue. A dispatched issue creates `.local/agentic-issue/active.json`, blocking additional dispatches until a human verifies completion and explicitly clears it. A missing receipt remains `dispatch-unknown` and must not be retried blindly.

After reading the actual Paseo session and remote PR outcome, unlock the next ticket:

```sh
# Record a successfully discovered original session ID if dispatch receipt was ambiguous.
node .agents/skills/agentic-issue-delivery/scripts/issue-intake.mjs reconcile \
  --issue <N> --confirmed --agent <EXISTING_SESSION_ID>

# ONLY AFTER manually verifying the current Issue is finished/blocked and handled:
node .agents/skills/agentic-issue-delivery/scripts/issue-intake.mjs reconcile \
  --issue <N> --confirmed --done
```

`--confirmed` is a human attestation, not automated verification. Broad modes are disallowed during initialization unless `--allow-unrestricted` is supplied explicitly. It is still safer to use a review mode and branch protections.

The CLI `start` runs in the foreground only; no cron, service, webhook or background app is installed. Closing the terminal or Ctrl+C stops polling. Already dispatched agent sessions are owned by Paseo; stopping this script does not cancel them.

**Important limitation:** The script does not itself create the Paseo workspace, verify sessions, resolve duplicate remote operations, check merge authority or complete the plan/build/verify/review cycle. The coordinator Skill governs those. `paseo run` argument and JSON response shapes may vary between versions; verify against your installed CLI before real dispatch. This prototype deliberately favors blocking a queue over ambiguous retries.

For updating: replace the complete installed skill folder, preserving only the per-project ignored runtime state. Do not commit state, hardcode author names, or use a shared workspace across unrelated GitHub repositories without an explicit security review.
