# Independent review

## Before

Use fresh context, ideally a different model family. Supply original requirement, accepted plan, **full** candidate diff, test evidence and risk list; do not send expected verdict.

## Instructions

Read source code, actual consumers and tests. Look for correctness, boundary/permission errors, recovery and idempotency issues, regression risk, missing coverage and contradictory documents. Only write the review report. For subsequent review, compare old findings with new SHA and necessary re-validation.

## Deliverables

Pinned SHA, verdict (`pass`, `changes-requested`, `blocked`), findings with severity and evidence, unresolved or accepted risks, test/coverage limitations, next action.
