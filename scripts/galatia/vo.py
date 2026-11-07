import torch; torch.set_num_threads(4)
from TTS.api import TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
lines = {
 "narr1": ("Craig Gutsy", "Lorsque la dernière étoile s'éteindra... Galatia devra choisir son destin."),
 "w1": ("Damien Black", "Tu n'es pas celui qui doit sauver Galatia..."),
 "w2": ("Damien Black", "Tu es celui qui doit décider... si elle mérite d'être sauvée."),
 "w3": ("Damien Black", "Le véritable ennemi... était déjà en toi."),
 "tag": ("Craig Gutsy", "La lumière n'est jamais éternelle."),
}
for k, (sp, txt) in lines.items():
    for v, seed in enumerate([1, 2]):
        torch.manual_seed(seed)
        tts.tts_to_file(text=txt, speaker=sp, language="fr", file_path=f"vo/{k}_{v}.wav", temperature=0.55, speed=0.92)
    print(k, flush=True)
