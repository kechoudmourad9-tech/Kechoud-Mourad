import json, os, sys, time, torch
torch.set_num_threads(4)
from TTS.api import TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
os.makedirs("lines", exist_ok=True)
only = set(sys.argv[1:])
for key, text in json.load(open("script.json")):
    if only and key not in only: continue
    t = time.time()
    tts.tts_to_file(text=text, speaker_wav="ref.wav", language="fr", file_path=f"lines/{key}.wav",
                    temperature=0.6, repetition_penalty=5.0, speed=1.05, split_sentences=True)
    print(key, round(time.time() - t, 1), "s", flush=True)
print("done")
