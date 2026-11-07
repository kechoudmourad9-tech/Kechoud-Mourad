# Voix clonée (XTTS-v2)

La voix off de `out/montage-ensembles.mp4` a été générée avec XTTS-v2 (coqui-tts), à partir de
22 s de la voix réelle (`public/pomme/voice.m4a`, de 2,4 s à 24,4 s).

- `script.json` : le texte, phrase par phrase
- `gen.py` : génère chaque phrase dans `lines/`
- `regen.py` + `pick.py` : 3 essais pour les phrases mal prononcées, puis choix automatique de la meilleure
  (la plus proche du texte une fois retranscrite par Whisper)

Installation (Python 3.12) :
`pip install coqui-tts "torch<2.10" "torchaudio<2.10" "torchcodec==0.8.*" six`

Le modèle XTTS-v2 est sous licence Coqui Public Model License, pour un usage non commercial uniquement.
