# Verify

## Before

Pin candidate commit, compare tracked and untracked changes, select required checks from project policy. Reuse matching evidence only when SHA and conditions are unchanged.

## Instructions

Original builder runs requested check/build/tests/E2E against the fixed SHA and reports exact commands, cwd, versions, exit codes, logs and SHA. Never let ignored/uncommitted files make a non-reproducible candidate pass. No unauthorized deployment or live integration.

## Deliverables

Verification matrix by acceptance criterion with pass/fail/skip, evidence paths, unchanged SHA/worktree readback, and boundaries of mock versus live tests.
