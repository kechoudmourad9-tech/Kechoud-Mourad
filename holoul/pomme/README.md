# « Comprendre la base des maths » — montage avec le skill Holoul-motion (Khaam Motion)

Vidéo verticale 1080×1920, 30 i/s, 70,5 s, sur la voix off de IMG_3488 (personnes A et B, la pomme, les applications).

- `src/render.js`, `src/main.js`, `src/index.html`, `src/lib/` : le moteur de rendu et le kit **du skill**. Ils ne sont pas dans le dépôt, car la licence du skill interdit de le republier : recopie-les depuis `templates/render/` du skill.
- `src/scenes/pomme.js` : la vidéo (5 chapitres + fin avec commentaire)
- `src/beats.json` : le timing des mots de la voix (sous-titres mot par mot)
- `src/cues.js` : la source unique des événements, qui sert à la fois à l'image et au son
- `mix.mjs` : le mix voix + bruitages (−14 LUFS), généré depuis `cues.js`
- `renders/` : la vidéo finale

Refaire la vidéo :
```bash
node mix.mjs
node src/render.js --fps 30 --scale 1 --out renders --name "Pomme v2" --audio renders/mix.wav
```
Aperçu rapide d'un moment : `node src/render.js --from 20 --to 20.04 --scale 0.4 --out cache/test --jpg`
