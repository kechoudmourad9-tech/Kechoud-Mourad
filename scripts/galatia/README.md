# GALATIA — trailer « histoire » (out/galatia-story.mp4)

Tout est généré dans la session, sans GPU :

1. `gen.py` + `shots.json` (+ `walkgen.py`) : images des plans avec SD-Turbo (stabilityai/sd-turbo), 2 étapes, 1024×576.
2. `seg.py` : découpe de la photo (visage, cheveux, vêtements) avec `mattmdjaga/segformer_b2_clothes`.
3. `suit.py` : combinaison générée en img2img sur le corps, avec le vrai visage et les vrais cheveux gardés.
4. `composite.py` : combinaison teintée en noir mat, puis intégration dans les décors (forêt, fissure, palais) avec la lumière de la scène.
5. `parallax.py` + `plan.json` : profondeur estimée avec Depth-Anything-V2-Small, puis mouvements de caméra 2,5D (clips 1920×1080 dans `public/galatia/clips/`).
6. `vo.py` : voix XTTS-v2 (voix synthétiques intégrées « Craig Gutsy » pour le narrateur et « Damien Black » pour la voix mystérieuse), puis traitement ffmpeg.
7. `../gen-galatia-story.mjs` : musique originale calée sur le montage (`src/galatia/GalatiaStory.tsx`).

Licences : SD-Turbo et XTTS-v2 ne sont autorisés que pour un usage non commercial.
