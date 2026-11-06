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
