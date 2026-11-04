# Repository and release checks

Public repository: https://github.com/wahengchang/agentic-engineering-skills

Install:

```bash
npx skills add wahengchang/agentic-engineering-skills --skill agentic-issue-delivery
```

Before publishing future changes, review the complete diff and run:

```bash
python3 tools/sanitize_check.py
node --test skills/agentic-issue-delivery/tests/*.test.mjs
```

Do not commit credentials, local runtime state or execution logs. Review commit history as well as the current tree; gitignore cannot remove committed secrets.

Installation paths vary by agent. Locate the installed `SKILL.md` and adapt the script path for your environment. Installation does not start issue polling. The optional Paseo intake remains an offline-tested prototype; live end-to-end acceptance is a separate step.
