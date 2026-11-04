# Multi-agent handoff record

Every handoff identifies: Issue URL and accepted comments; role and explicit write boundaries; authorized repo/base; workspace ID and path; stable draft; source action file; original requirements; candidate SHA where relevant; evidence summary; expected report path; provider/model/mode selected via local discovery; whether any prior external side effect has an unresolved receipt.

Do not assume the agent can read files just because a path appears in a prompt. Verify workspace visibility. Worker output is a *proposal* until the coordinator checks Git diffs, exit codes and source records.

A reviewer must not use a builder's self-assessment as sole evidence. The review report records verdict, severity, concrete file/line or reproduction, confidence, accepted risk or resolution, and any limitations. Review reports are not substitutes for tests.
