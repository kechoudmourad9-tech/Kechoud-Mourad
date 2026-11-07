// GALATIA — story trailer (86.5 s, 1920x1080). Shots are generated stills (SD-Turbo) animated in 2.5D
// (depth-based camera moves, see scripts/galatia/parallax.py); the hero is the user's photo in a generated
// black combat suit. Voices: XTTS-v2 built-in synthetic speakers. Score: scripts/gen-galatia-story.mjs.
import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp, theme } from "../theme";

const s = (t: number) => Math.round(t * 30);
export const STORY_FRAMES = s(86.5);
const C = { gold: "#F2C46D", ice: "#DCE8FF", ember: "#FF7A2E", blood: "#E0263A", blue: "#5AA9FF" };
const ease = theme.ease;

type Shot = { clip: string; a: number; b: number; rate?: number; fx?: "embers" | "rain" | "ash" | "stars" | "lightning" | "rune" | "dust" };
const SHOTS: Shot[] = [
  { clip: "s01_stars", a: 0, b: 4.5, fx: "stars" },
  { clip: "s02_kingdom", a: 4.5, b: 9.5, fx: "dust" },
  { clip: "s03_ruins", a: 9.5, b: 13.0, fx: "dust" },
  { clip: "s04_forest", a: 15.5, b: 20.5, fx: "embers" },
  { clip: "s05_hand", a: 20.5, b: 23.0, fx: "rune" },
  { clip: "s06_city", a: 23.0, b: 30.3, rate: 0.92, fx: "lightning" },
  { clip: "s07_walk", a: 30.3, b: 31.9, fx: "ash" },
  ...["m01_army", "m02_warrior", "m03_creatures", "m04_temple", "m05_sword", "m06_bridge", "m07_silhouette"].map((c, i) => ({
    clip: c, a: 31.9 + i * 1.35, b: 31.9 + (i + 1) * 1.35, fx: (["rain", "dust", "ash", "dust", "dust", "ash", "lightning"] as const)[i],
  })),
  { clip: "s08_lookup", a: 42.8, b: 46.0, fx: "ash" },
  { clip: "s09_crack", a: 46.0, b: 49.3, fx: "lightning" },
  { clip: "s10_crack2", a: 50.4, b: 56.3, rate: 0.83, fx: "lightning" },
  ...["b01", "b02", "b03", "b04", "b05", "b06"].map((c, i) => ({ clip: c, a: 56.3 + i * 1.3, b: 56.3 + (i + 1) * 1.3, fx: "embers" as const })),
  { clip: "s11_palace", a: 64.1, b: 66.2, fx: "dust" },
  { clip: "s12_hero_palace", a: 66.2, b: 67.6, fx: "dust" },
  { clip: "s13_mask", a: 67.6, b: 69.2, fx: "dust" },
  { clip: "s14_enemy", a: 69.2, b: 72.3, fx: "embers" },
  { clip: "s15_titlebg", a: 78.2, b: 85.0, fx: "dust" },
];
const CUTS = SHOTS.map((x) => x.a).filter((t) => t > 0.1);
const VO: [string, number, string][] = [
  ["narr1", 23.3, "« Lorsque la dernière étoile s'éteindra… Galatia devra choisir son destin. »"],
  ["w1", 46.1, "« Tu n'es pas celui qui doit sauver Galatia… »"],
  ["w2", 50.4, "« Tu es celui qui doit décider si elle mérite d'être sauvée. »"],
  ["w3", 73.4, "« Le véritable ennemi… était déjà en toi. »"],
  ["tag", 80.5, "« La lumière n'est jamais éternelle. »"],
];
const VO_LEN: Record<string, number> = { narr1: 7.0, w1: 3.9, w2: 5.7, w3: 4.5, tag: 3.5 };

/* ---------- particles / fx ---------- */
const Particles: React.FC<{ kind: NonNullable<Shot["fx"]>; t: number }> = ({ kind, t }) => {
  if (kind === "rain") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {Array.from({ length: 140 }).map((_, i) => {
          const x = (i * 137) % 2000 - 40 - t * 4, y = ((i * 271 + t * 70) % 1300) - 120;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: 2, height: 46, background: "rgba(200,220,255,0.35)", transform: "rotate(12deg)" }} />;
        })}
      </AbsoluteFill>
    );
  }
  if (kind === "lightning") {
    const flash = [0.15, 0.55, 0.62, 1.4].some((k) => Math.abs((t / 30) % 2.3 - k) < 0.05) ? 1 : 0;
    return <AbsoluteFill style={{ background: "#cfe0ff", opacity: flash * 0.35, mixBlendMode: "screen" }} />;
  }
  if (kind === "rune") {
    const p = 0.6 + Math.sin(t / 4) * 0.4;
    return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, ${C.blue}${Math.round(p * 120).toString(16).padStart(2, "0")}, transparent 45%)`, mixBlendMode: "screen" }} />;
  }
  if (kind === "stars") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {Array.from({ length: 60 }).map((_, i) => {
          const dieAt = 20 + i * 2;
          const o = t < dieAt ? 0.9 : Math.max(0, 1 - (t - dieAt) / 6);
          const x = (i * 331) % 1900 + 10, y = (i * 173) % 640 + 150;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: o,
            boxShadow: `0 0 ${t >= dieAt && t < dieAt + 3 ? 22 : 8}px #fff` }} />;
        })}
      </AbsoluteFill>
    );
  }
  const n = kind === "embers" ? 90 : kind === "ash" ? 80 : 50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const depth = 0.3 + ((i * 37) % 10) / 10;
        const up = kind === "embers" ? -1 : 1;
        const x = ((i * 197) % 2000) + Math.sin(t / 25 + i) * 40 * depth - (kind === "ash" ? t * depth * 2 : 0);
        const y = (((i * 131) + up * t * (2 + depth * 4)) % 1200 + 1200) % 1200 - 60;
        const r = kind === "embers" ? 2 + depth * 4 : 1.5 + depth * 3;
        const col = kind === "embers" ? (i % 3 ? C.ember : C.gold) : kind === "ash" ? "#bdb6ad" : C.ice;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: col,
          opacity: kind === "dust" ? 0.25 + depth * 0.3 : 0.5 + depth * 0.5, boxShadow: kind === "embers" ? `0 0 ${r * 4}px ${col}` : undefined,
          filter: `blur(${(1 - depth) * 1.5}px)` }} />;
      })}
    </AbsoluteFill>
  );
};

const ShotLayer: React.FC<{ shot: Shot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const len = s(shot.b) - s(shot.a);
  const fadeIn = shot.b - shot.a > 2.5 ? interpolate(f, [0, 8], [0, 1], clamp) : 1;
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <OffthreadVideo src={staticFile(`galatia/clips/${shot.clip}.mp4`)} playbackRate={shot.rate ?? 1} muted
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.12) saturate(1.2)" }} />
      {shot.fx && <Particles kind={shot.fx} t={f} />}
      {len > 0 && null}
    </AbsoluteFill>
  );
};

/* ---------- type ---------- */
const Story: React.FC<{ a: number; b: number; lines: string[]; size?: number; y?: number }> = ({ a, b, lines, size = 52, y = 540 }) => {
  const f = useCurrentFrame();
  if (f < s(a) || f >= s(b)) return null;
  const t = f - s(a);
  const out = interpolate(f, [s(b) - 12, s(b)], [1, 0], clamp);
  return (
    <>
    <div style={{ position: "absolute", left: 0, right: 0, top: y - 190, height: 380, opacity: out * interpolate(t, [0, 15], [0, 1], clamp),
      background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(0,0,0,0.72), transparent 100%)" }} />
    <div style={{ position: "absolute", left: 160, right: 160, top: y, transform: "translateY(-50%)", textAlign: "center" }}>
      {lines.map((l, i) => {
        const p = interpolate(t - i * 18, [0, 30], [0, 1], { ...clamp, easing: ease.out });
        return <div key={i} style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: i === 0 ? size : size * 0.62, color: i === 0 ? C.ice : C.gold,
          letterSpacing: interpolate(p, [0, 1], [18, 4]), opacity: p * out, filter: `blur(${(1 - p) * 6}px)`, lineHeight: 1.35, marginTop: i ? 14 : 0,
          textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.9)" }}>{l}</div>;
      })}
    </div>
    </>
  );
};

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cur = VO.find(([k, at]) => t >= at && t < at + VO_LEN[k] + 0.3);
  if (!cur) return null;
  const [k, at, txt] = cur;
  const o = interpolate(t, [at, at + 0.3, at + VO_LEN[k], at + VO_LEN[k] + 0.3], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 52, textAlign: "center", fontFamily: "Cormorant Garamond", fontStyle: "italic",
      fontWeight: 600, fontSize: 40, color: k.startsWith("w") ? "#ffb4bc" : C.ice, opacity: o }}>{txt}</div>
  );
};

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = s(78.2), b = s(85.0);
  if (f < a || f >= b) return null;
  const t = f - a;
  const p = spring({ frame: t, fps, config: { damping: 30, stiffness: 40, mass: 1.4 } });
  const sweep = interpolate(t, [20, 110], [-20, 120], clamp);
  const out = interpolate(f, [b - 10, b], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(242,196,109,0.18), rgba(0,0,0,0.7) 65%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 500, transform: `translateY(-50%) scale(${interpolate(p, [0, 1], [1.12, 1])})`, textAlign: "center",
        fontFamily: "Cinzel", fontWeight: 900, fontSize: 200, letterSpacing: interpolate(p, [0, 1], [70, 34]), opacity: p,
        backgroundImage: `linear-gradient(100deg, #8a6a2f 0%, #f7e2a8 ${sweep - 10}%, #ffffff ${sweep}%, #f2c46d ${sweep + 10}%, #6d5226 100%)`,
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 40px rgba(242,196,109,0.55))" }}>GALATIA</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 650, textAlign: "center", fontFamily: "Cormorant Garamond", fontStyle: "italic",
        fontSize: 46, color: C.ice, opacity: interpolate(t, [s(2.3), s(3.3)], [0, 0.95], clamp) }}>La lumière n'est jamais éternelle.</div>
    </AbsoluteFill>
  );
};

/* ---------- finishing ---------- */
const CutFlash: React.FC = () => {
  const f = useCurrentFrame();
  let v = 0;
  for (const c of CUTS) { const d = f - s(c); if (d >= 0 && d < 6) v = Math.max(v, 1 - d / 6); }
  const big = [56.3, 69.2, 78.2].some((c) => { const d = f - s(c); return d >= 0 && d < 10; }) ? 0.6 : 0.22;
  return <AbsoluteFill style={{ background: "#fff", opacity: v * big, mixBlendMode: "screen", pointerEvents: "none" }} />;
};
const Bars: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 132, background: "#000" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 132, background: "#000" }} />
  </>
);
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "240px", backgroundPosition: `${(f * 53) % 240}px ${(f * 97) % 240}px`, opacity: 0.1, mixBlendMode: "overlay" }} />;
};
const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,30,60,0.35), transparent 45%, rgba(60,25,5,0.3))", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)" }} />
  </AbsoluteFill>
);

export const GalatiaStory: React.FC = () => {
  useFontFaces([
    ["Cinzel", "fonts/cinzel-latin-700-normal.woff2", "700"],
    ["Cinzel", "fonts/cinzel-latin-900-normal.woff2", "900"],
    ["Cormorant Garamond", "fonts/cormorant-garamond-latin-600-italic.woff2", "600"],
  ]);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((sh) => (
        <Sequence key={sh.clip + sh.a} from={s(sh.a)} durationInFrames={s(sh.b) - s(sh.a)}><ShotLayer shot={sh} /></Sequence>
      ))}
      <Story a={0.6} b={4.5} lines={["Dans un monde où les étoiles", "ont commencé à disparaître une à une…"]} y={560} />
      <Story a={4.9} b={9.4} lines={["le royaume de Galatia", "vit ses dernières heures."]} y={560} />
      <Story a={9.8} b={13.0} lines={["L'Éclat d'Astra", "une relique capable de contrôler la lumière elle-même"]} size={66} y={560} />
      <Story a={13.1} b={14.5} lines={["Personne ne l'avait jamais retrouvée…"]} size={46} />
      <Story a={14.5} b={15.5} lines={["…jusqu'à cette nuit."]} size={58} />
      <CutFlash />
      <Grade />
      <Title />
      <Grain />
      <Bars />
      <Subtitle />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [STORY_FRAMES - 30, STORY_FRAMES - 10], [0, 1], clamp) }} />
      <Audio src={staticFile("galatia/story-score.wav")} volume={(fr) => {
        // duck the score under each voice line
        const t = fr / 30;
        const under = VO.some(([k, at]) => t > at - 0.2 && t < at + VO_LEN[k]);
        return interpolate(fr, [0, 10, STORY_FRAMES - 30, STORY_FRAMES - 1], [0, 1, 1, 0], clamp) * (under ? 0.55 : 1);
      }} />
      {VO.map(([k, at]) => (
        <Sequence key={k} from={s(at)} durationInFrames={s(VO_LEN[k] + 1)}><Audio src={staticFile(`galatia/vo/${k}.wav`)} volume={1.4} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
