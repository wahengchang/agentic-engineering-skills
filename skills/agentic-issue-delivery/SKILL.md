---
name: agentic-issue-delivery
description: >-
  Deliver one GitHub Issue through a resumable, evidence-based multi-agent
  engineering workflow: plan, build, verify a fixed candidate, independent
  review, and a Draft PR by default. Use with Paseo or a compatible ADE; never
  begin polling or merge based on labels alone.
---

# Agentic Issue Delivery

Turn a **specified** GitHub Issue into an auditable candidate. This skill guides the current coordinator; it does not automatically create a background worker or grant permission.

## Completion contract

- Default (`autoMerge=off`): verified, independently reviewed **unmerged Draft PR** with the exact validated head SHA.
- Explicit authorized low-risk `autoMerge=on`: only the **same validated candidate**, merged into the approved base, with a retrieved merge receipt.
- A session finishing, an AI saying "done", a push succeeding, or a PR existing does not satisfy the contract.
- Unknown, medium or high blast radius, unresolved blockers, missing evidence or uncertain authorization means **no merge**.

## Phase order

1. **Intake:** Confirm exact Issue URL, issue text and adopted comments, repository origin, current project instructions, scope and authorized base. Do not infer the next task. Identify existing draft/workspace/PR before creating anything.
2. **Capability and permission check:** Read actual local ADE/Paseo host, workspace, agent provider/model and permission mode. Never infer access from a CLI being installed. Prefer least privilege, `auto-review` for Codex; no bypass by default. Ask only when essential authorization is missing.
3. **Stable progress:** Create or reuse one gitignored stable draft with [`references/progress.md`](references/progress.md). Write intent **before** side effects. One coordinator owns progress and publishing.
4. **Plan:** Delegate using [`actions/plan.md`](actions/plan.md). Plan owns working design/acceptance documentation; never edits product code.
5. **Build:** Delegate using [`actions/build.md`](actions/build.md). One product writer commits all tracked **and** previously untracked product changes; no push or PR from builder.
6. **Verify:** Delegate using [`actions/verify.md`](actions/verify.md) to the original build role. Verify the pinned SHA and conditions, report exact commands, exits and logs. Tests must not silently change the candidate.
7. **Independent review:** Delegate using [`actions/review.md`](actions/review.md) to a **fresh-context, different model family** if available. Reviewer reads Issue, real diff, acceptance and evidence; only writes a review report. Findings return to the original builder, then re-verify and re-review.
8. **Publish:** After acceptance and all blocking findings resolve, coordinator pushes the verified SHA and creates or reuses a **Draft PR**; read back its base/head/draft flag/SHA. Before retrying a failed network operation, reconcile remote state.
9. **Exit gate:** Re-read current instruction and issue labels, re-evaluate blast radius with [`references/risk-and-switches.md`](references/risk-and-switches.md). Deliver Draft PR by default. Only execute merge if a fresh explicit authorization, low impact, same verified SHA, and repository protections permit it. Read back merge commit; otherwise stop.

## Role contract

| Role | Allowed writes | Forbidden |
| --- | --- | --- |
| Coordinator | progress, dispatch, acceptance decisions, push/PR/conditional merge | editing product as a second builder |
| Planner | stable-draft planning docs | product changes, PR/merge |
| Builder / verifier | product files + relevant evidence | PR/merge or spawning reviewers |
| Independent reviewer | review report only | changing candidate, rubber-stamping from builder summary |

These are workflow agreements and require real credential/sandbox enforcement where available.

## Action selection

For each stage, prefer a **project-specific complete override** at `.agents/agentic-issue-delivery/actions/<stage>.md` if it exists. It must contain `## Before`, `## Instructions`, `## Deliverables`; a missing section is a **block**, not silent fallback. Otherwise use bundled `actions/<stage>.md`. Project rules cannot weaken the completion contract, bypass validation or grant wider privileges.

## Reentrancy and idempotency

- A fresh chat is *not* a fresh job. Read `progress.md` and reconcile Git, ADE sessions, and GitHub before dispatch.
- `dispatch-unknown` means **search for the original receipt** before re-sending. Do not create a second workspace/session or duplicate PR on timeout.
- Keep the original builder for fixes and reviewer for follow-up reviews. Only one coordinator can write progress.
- On changed requirements or candidate SHA, mark stale evidence explicitly and repeat the affected gates.
- Do not erase drafts, credentials, worktrees or user changes as part of cleanup.

## Paseo adapter (optional)

The standalone foreground intake tool at [`scripts/issue-intake.mjs`](scripts/issue-intake.mjs) can queue a specified set of **future**, labeled issues to a configured Paseo workspace. It is **not** a replacement for this skill's coordinator, and it cannot verify or merge on its own. Read [`scripts/README.md`](scripts/README.md) before use.

## Required coordinator handoff

Return Issue URL, repo/base, current phase, pinned SHA, validation and review evidence, PR/merge receipt or explicit blocker, and path to the stable `progress.md`. Distinguish unit/fixture validation from live production behavior. Never include secret values in reports.
