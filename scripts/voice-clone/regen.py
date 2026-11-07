import json, os, torch, subprocess, numpy as np, difflib, re
torch.set_num_threads(4)
from TTS.api import TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
# spoken text (spelled to help pronunciation) -> what must be heard
redo = {
 "hook": ("C'est quoi, un ensemble ? Et pourquoi toutes les mathématiques reposent dessus ?", None),
 "inclus1": ("Maintenant, prenons un petit panier, qu'on appelle C, avec juste la pomme et la banane.", None),
 "inclus2": ("Tous les fruits du panier C sont aussi dans A. On dit que C est inclus dans A.", None),
 "vide": ("Et un panier sans aucun fruit ? C'est l'ensemble vide. On le note avec un petit rond barré.", None),
 "nombres1": ("Avec les nombres, c'est pareil. N, ce sont les entiers naturels : zéro, un, deux, trois.", None),
 "nombres2": ("Il est inclus dans Z, qui ajoute les nombres négatifs. Lui-même est inclus dans Q, les fractions, puis dans R, l'ensemble des nombres réels.", None),
}
os.makedirs("cand", exist_ok=True)
for key, (text, _) in redo.items():
    for i, (temp, seed) in enumerate([(0.55, 1), (0.65, 2), (0.5, 3)]):
        torch.manual_seed(seed)
        tts.tts_to_file(text=text, speaker_wav="ref.wav", language="fr", file_path=f"cand/{key}_{i}.wav",
                        temperature=temp, repetition_penalty=5.0, speed=1.05, split_sentences=True)
    print(key, "ok", flush=True)
json.dump({k: v[0] for k, v in redo.items()}, open("cand/texts.json", "w"), ensure_ascii=False)
print("done")
