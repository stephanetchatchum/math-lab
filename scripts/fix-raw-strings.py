"""Authoring helper: turn String.raw literals that contain escaped backticks into
plain JSON strings (String.raw keeps the backslash), and fix R"..." typos.
Usage: python3 scripts/fix-raw-strings.py src/content/topics/*/*.ts"""
import re, json, sys
for p in sys.argv[1:]:
    s = open(p).read(); n0 = s
    s = s.replace('prompt: R"', 'prompt: "')
    def fix(m):
        body = m.group(1)
        if '\\`' not in body:
            return m.group(0)
        return json.dumps(body.replace('\\`', '`'), ensure_ascii=False)
    s = re.sub(r"R`((?:[^`\\]|\\.)*)`", fix, s)
    if s != n0:
        open(p, 'w').write(s)
        print('fixed', p)
