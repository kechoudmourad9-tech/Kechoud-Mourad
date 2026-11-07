import json, subprocess, numpy as np, difflib, re, shutil
from faster_whisper import WhisperModel
m = WhisperModel("large-v3", device="cpu", compute_type="int8", cpu_threads=4)
texts = json.load(open("cand/texts.json"))
norm = lambda s: re.sub(r"[^a-zàâçéèêëîïôûùüÿœ0-9 ]", " ", s.lower()).split()
def load(f):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-af","silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse","-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768
for k, t in texts.items():
    best=None
    for i in range(3):
        f=f"cand/{k}_{i}.wav"; a=load(f)
        heard=" ".join(s.text for s in m.transcribe(a, language="fr", beam_size=5)[0])
        sc=difflib.SequenceMatcher(None, norm(t), norm(heard)).ratio()
        dur=len(a)/16000
        score=sc - max(0, dur - len(t.split())*0.42)*0.03   # penalise long pauses a little
        print(k,i,round(sc,3),round(dur,1),"|",heard.strip())
        if best is None or score>best[0]: best=(score,f)
    shutil.copy(best[1], f"lines/{k}.wav"); print("->",k,best[1])
