# Montage vidéo — Remotion

Montage 9:16 (1080×1920, 24 s) fait avec Remotion et le skill [claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill).

- `out/montage.mp4` : la vidéo finale
- `public/clip.mp4` : la vidéo source, transcodée en H.264
- `src/faceTrack.json` : la position de la tête image par image (OpenCV). Les cartes animées s'en servent pour cacher la tête.
- `scripts/` : génèrent les bruitages et la musique (`public/sfx/`), sans aucun fichier téléchargé

Pour modifier les textes ou les timings, voir `src/Edit.tsx` (`BEATS`). Pour les couleurs, voir `src/theme.ts`.

```bash
npm install
npm run sfx && node scripts/gen-track.mjs
npm run studio      # prévisualiser
npm run render      # out/montage.mp4
```

## Montage 2 — darija (`Darija`)

- `out/montage-darija.mp4` : 56 s, coupé à partir de 2 min de rush, textes en arabe
- La méthode vient du skill `capcut-talking-head-edit`, rendue ici avec Remotion (pas besoin de CapCut) :
  - pauses, doubles prises et faux départs coupés
  - un zoom à chaque coupe, et des zooms lents sur les phrases fortes
  - étalonnage chaud, musique de fond environ 15 dB sous la voix, sons discrets (swipe, ding, check)
- `src/darija/cuts.json` : la liste des coupes. `src/darija/DarijaEdit.tsx` : les sous-titres (`CAPS`) et les cartes (`G`).

```bash
node scripts/gen-bed.mjs 57
npx remotion render src/index.ts Darija out/montage-darija.mp4 --codec h264 --crf 17
```
