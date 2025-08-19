import re, sys
def mmss(t): m=int(t//60); s=int(t%60); return f"{m:02d}:{s:02d}"
txt=sys.stdin.read()
blocks=[b.strip() for b in txt.split("\n\n") if "-->" in b]
out=[]
for b in blocks:
    head,*rest=b.splitlines()
    m=re.search(r'(\d+):(\d+):(\d+)\.(\d+)', head) or re.search(r'(\d+)\.(\d+)', head)
    t=0.0
    if m and len(m.groups())>=4:
        t=int(m.group(1))*3600+int(m.group(2))*60+float(m.group(3)+"."+m.group(4))
    elif m:
        t=float(m.group(0))
    out.append(f"- [{mmss(t)}] {' '.join(rest).strip()}")
print("\n".join(out))
