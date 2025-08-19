import sys, json, re, hashlib
from PIL import Image
import imagehash

PHASH = int(sys.argv[2]) if len(sys.argv)>2 else 6
RUN_JOIN= int(sys.argv[3]) if len(sys.argv)>3 else 60
JACC   = float(sys.argv[4]) if len(sys.argv)>4 else 0.90
SIMH   = int(sys.argv[5]) if len(sys.argv)>5 else 3

STOP=set("a an the and or of in on to for with from by is are was were be been being this that these those it its as at".split())

def norm(s):
    s=s.lower(); s=re.sub(r"[^a-z0-9\s]"," ",s)
    return " ".join([t for t in s.split() if t not in STOP and len(t)>=3])

def sha1(s): return hashlib.sha1(s.encode()).hexdigest()

def jacc(a,b):
    A=set(a.split()); B=set(b.split())
    return len(A&B)/max(1,len(A|B))

def simhash_bits(s,n=64):
    v=[0]*n
    for w in s.split():
        h=int(hashlib.md5(w.encode()).hexdigest(),16)
        for i in range(n):
            v[i]+= 1 if (h>>i)&1 else -1
    x=0
    for i in range(n):
        if v[i]>=0: x|=(1<<i)
    return x

def ham(a,b): return bin(a^b).count("1")

# input: JSON array of raw frames {file,t,ocr_text}
raw=json.load(open(sys.argv[1]))

# compute phash
for r in raw:
    r["phash"]=str(imagehash.phash(Image.open(r["file"])))

groups=[]
for r in raw:
    n=norm(r.get("ocr_text",""))
    s=sha1(n) if n else None
    sh=simhash_bits(n) if n else 0
    placed=False
    for g in groups:
        if g["norm"] and n and (s==g["sig"] or jacc(n,g["norm"])>=JACC or ham(sh,g["sim"])<=SIMH):
            g["members"].append(r); placed=True; break
    if not placed:
        groups.append({"norm": n, "sig": s, "sim": sh, "members":[r]})

final=[]
for g in groups:
    clusters=[]
    for m in sorted(g["members"], key=lambda x: x["t"]):
        h=imagehash.hex_to_hash(m["phash"]); placed=False
        for c in clusters:
            if h - c["repr_hash"] <= PHASH:
                c["members"].append(m); placed=True; break
        if not placed:
            clusters.append({"repr_hash": h, "members":[m]})
    for c in clusters:
        c["members"].sort(key=lambda x:x["t"])
        run=[]; last=None
        for m in c["members"]:
            if last is None or m["t"]-last <= RUN_JOIN:
                run.append(m); last=m["t"]
            else:
                final.append(run[0]); run=[m]; last=m["t"]
        if run: final.append(run[0])

final.sort(key=lambda x:x["t"])
json.dump(final, sys.stdout, indent=2)
