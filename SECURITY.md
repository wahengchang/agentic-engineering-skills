# Security policy and release gate

This skill is designed for public redistribution. Never check in or publish authentication tokens, environment files, local session/workspace IDs, remote host endpoints, issue/pull-request payloads containing customer information, runtime logs, user directories, home paths, or private source code. All sample IDs and paths must be placeholders.

Runtime state lives in `.local/agentic-issue/` and is gitignored. Coordinator drafts live under `draft_agentic-issue-*` and are gitignored. Before public push, run `python3 tools/sanitize_check.py` and manually review the complete `git diff --cached` as well as Git history. This check is intentionally conservative and cannot prove absence of secrets.

Installing a Skill does not make it sandboxed. Default to human-reviewed permission mode and Draft PR. Any broad filesystem/network privileges, remote execution, external notification or merge require separately verified authorization.

No actual GitHub account credentials, secrets or authenticated configuration are bundled. Third-party Paseo/GitHub CLIs are prerequisites, not dependencies installed or run automatically.
