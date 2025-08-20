import json, re, sys
viddir = sys.argv[1]; lookback = int(sys.argv[2])
frames = json.load(open(f"{viddir}/kf_index.json"))
lines  = open(f"{viddir}/transcript_clean.md").read().splitlines()

def parse_line(line):
    m = re.match(r"- \[(\d\d):(\d\d)\] (.*)", line.strip())
    if not m: return None
    t = int(m.group(1))*60 + int(m.group(2))
    return (t, m.group(3))

cues=list(filter(None, (parse_line(l) for l in lines)))
if not frames or not cues:
    print("[]"); sys.exit(0)

fts=[f["t"] for f in frames]
out=[]

for i,f in enumerate(frames):
    bucket=[]
    for t,text in cues:
        # Find nearest keyframe to this transcript timestamp
        nearest_idx = 0
        min_distance = abs(fts[0] - t)
        
        for k, ft in enumerate(fts):
            distance = abs(ft - t)
            if distance < min_distance:
                min_distance = distance
                nearest_idx = k
        
        # Only assign to this frame if it's the nearest AND within lookback window
        if nearest_idx == i and min_distance <= lookback:
            bucket.append((t,text))
    
    if bucket:
        start=bucket[0][0]
        end=bucket[-1][0]
        out.append({
            "start": start,
            "end": end,
            "text": " ".join([b[1] for b in bucket]),
            "keyframes": [frames[i]["file"].split("/")[-1]]
        })

print(json.dumps(out, indent=2))
