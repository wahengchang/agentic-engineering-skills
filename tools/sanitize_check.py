#!/usr/bin/env python3
"""Conservative public-release guard. Supplement, never replace, a manual review."""
from pathlib import Path
import re, sys
root = Path(__file__).resolve().parents[1]
patterns = {
    'private-key': r'-----BEGIN (?:OPENSSH|RSA|EC|DSA|PRIVATE) (?:PRIVATE )?KEY-----',
    'github-pat': r'gh[pousr]_[A-Za-z0-9_]{18,}',
    'credential-assignment': r'(?i)(?:api[_-]?key|bot[_-]?token|secret|password)\s*[:=]\s*["\']?[^\s"\'<>]{12,}',
    'local-username-path': r'/(?:Users|home)/[A-Za-z0-9_.-]+/',
    'internal-domain': r'(?i)\b(?:internal|intranet)\.[A-Za-z0-9_.-]+',
}
allow_ext = {'.md','.mjs','.js','.json','.yaml','.yml','.py','.txt','.sh'}
skip = {'.git','.local','node_modules','__pycache__'}
findings=[]
for p in root.rglob('*'):
    if not p.is_file() or p.suffix not in allow_ext or any(s in p.parts for s in skip): continue
    data=p.read_text(encoding='utf8',errors='replace')
    for name, pattern in patterns.items():
        for m in re.finditer(pattern,data):
            # Named examples in the checker are definitions of patterns, not exposed data.
            if p.name=='sanitize_check.py':continue
            line=data.count('\n',0,m.start())+1
            findings.append((p.relative_to(root),line,name))
if findings:
    for f in findings: print('%s:%s: possible %s' % f,file=sys.stderr)
    sys.exit(1)
print('Public-release heuristic scan: PASS (manual diff and history review still required)')
