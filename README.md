# Agentic Engineering Skills

Reusable, security-conscious AI engineering workflow for GitHub Issues. The package extracts **general engineering patterns** from a real Paseo/ADE workflow without copying any original repository's credentials, issues, local state, user identifiers or private settings.

**Core:** one Issue → one accountable coordinator → plan → implement → verify a fixed commit → independent review → Draft PR (default). Optional merge requires explicit authorization plus a fresh risk assessment.

## Install

Install from the public GitHub repository:

```bash
npx skills add wahengchang/agentic-engineering-skills --skill agentic-issue-delivery
```

Or download/clone this repository and install from its local path:

```bash
npx skills add ./agentic-engineering-skills --skill agentic-issue-delivery
```

`npx skills add` installs a skill; it does **not** automatically start a background poller.

[Read the Substack article](https://ppchang.substack.com/p/paseo-ai-github-issue-pr-skill) · 繁體中文介紹與使用指南：[從 ADE 到 Issue → PR：Paseo 工程工作流程的架構與實作](docs/paseo-issue-workflow.zh-TW.md)。

## Compatibility

- Agent Skills-compatible agents via `npx skills add` (discovery of `skills/agentic-issue-delivery/SKILL.md`).
- Workflow guidance works with any ADE that offers workspaces/sessions.
- Optional **Paseo + GitHub CLI** foreground issue intake: `skills/agentic-issue-delivery/scripts/issue-intake.mjs` (Node 22+ recommended). This optional tool is not started by skill installation.

## Quick start: manual (recommended)

1. Install the skill.
2. In a Git repository, ask your agent to use **agentic-issue-delivery** for a specific Issue URL.
3. Keep `autoMerge=off` unless you expressly authorize an eligible low-risk merge.
4. Follow the skill's acceptance, evidence, and recovery gates. The default published result is a **Draft PR**.

## Optional intake setup

See [`skills/agentic-issue-delivery/scripts/README.md`](skills/agentic-issue-delivery/scripts/README.md). Setup is explicit, per-repository and not required for manual work. First run records a boundary so it doesn't grab old issues. Dispatch requires a target Paseo workspace and selected provider, and is disabled until configured.

## Security profile

- **No secrets**, tokens, absolute personal filesystem paths, account IDs, author handles, real host endpoints, or copied execution logs.
- **No default permission bypass**: default runner mode is `auto-review`. Other modes require explicit user selection and can be dangerous.
- **No default auto-merge**: merge is never a side effect of installing the package or adding a label.
- Local runtime state is gitignored. The repository contains only documentation, generic scripts, examples, and tests.
- A skill's role boundaries are procedural agreements, **not** an operating-system sandbox. Enforce permissions with the underlying tool, branch protections and credentials.

See `SECURITY.md`, `PUBLISH_TO_GITHUB.md`, `LICENSE` and `CHANGELOG.md`.

## Origin and claim limits

This is a new, clean-room public edition of transferable practices. It is **not** a byte-for-byte repack of the original internal workflow and has **not** been validated end-to-end with a live Paseo installation or production GitHub repository. Pure decision logic and CLI offline tests are provided; live integration remains a separate acceptance gate.
