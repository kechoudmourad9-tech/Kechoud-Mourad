// GALATIA — 45 s cinematic teaser (1920x1080). Original score: scripts/gen-trailer.mjs (hit times = HITS).
// Shots are virtual camera moves over the station key art; the captain is the user's own photo as a hologram file.
import {
  AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { theme } from "../theme";

export const GALATIA_FRAMES = 45 * 30;
const s = (t: number) => Math.round(t * 30);
const C = { pink: "#FF3D8B", blue: "#4FA8FF", ice: "#DDEBFF", ink: "#05030A" };
const ease = theme.ease;
const HITS = [3.0, 9.0, 16.0, 21.0, 23.0, 25.0, 27.0, 28.5, 30.0, 31.0, 32.0, 34.5, 41.5];
const IMG = "galatia/station.jpg";

/* hit envelope: 1 on a hit, decaying over ~10 frames */
const useHit = () => {
  const f = useCurrentFrame();
  let v = 0;
  for (const h of HITS) { const d = f - s(h); if (d >= 0 && d < 14) v = Math.max(v, Math.exp(-d / 3.5)); }
  return v;
};

/* ---------- virtual camera over the key art ---------- */
const Shot: React.FC<{ from: number; to: number; focus: [number, number]; z: [number, number]; rot?: [number, number];
  blur?: number; dim?: number }> = ({ from, to, focus, z, rot = [0, 0], blur = 0, dim = 0 }) => {
  const f = useCurrentFrame();
  const hit = useHit();
  if (f < from || f >= to) return null;
  const p = interpolate(f, [from, to], [0, 1], { ...clamp, easing: ease.inOut });
  const zz = interpolate(p, [0, 1], z);
  const [fx, fy] = focus;
  const clampT = (t: number, a: number, size: number) => {
    const lo = size - (a + (size - a) * zz), hi = -(a * (1 - zz));
    return Math.min(hi, Math.max(lo, t));
  };
  const tx = clampT(960 - fx, fx, 1920), ty = clampT(540 - fy, fy, 1080);
  const shake = hit * 14;
  const sx = Math.sin(f * 2.3) * shake, sy = Math.cos(f * 1.9) * shake;
  const layer = (extra: React.CSSProperties, dx = 0) => (
    <Img src={staticFile(IMG)} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover",
      transformOrigin: `${fx}px ${fy}px`, transform: `translate(${tx + sx + dx}px, ${ty + sy}px) scale(${zz}) rotate(${interpolate(p, [0, 1], rot)}deg)`,
      filter: `blur(${blur}px) saturate(1.15) contrast(1.08) brightness(${1 - dim})`, ...extra }} />
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.ink }}>
      {layer({})}
      {/* chromatic split on impacts */}
      {hit > 0.05 && layer({ mixBlendMode: "screen", opacity: 0.55 * hit, filter: "sepia(1) saturate(6) hue-rotate(-50deg)" }, 10 * hit)}
      {hit > 0.05 && layer({ mixBlendMode: "screen", opacity: 0.55 * hit, filter: "sepia(1) saturate(6) hue-rotate(160deg)" }, -10 * hit)}
    </AbsoluteFill>
  );
};

/* ---------- atmosphere ---------- */
const Dust: React.FC<{ n?: number; color?: string; speed?: number }> = ({ n = 70, color = C.ice, speed = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const depth = 0.3 + ((i * 37) % 10) / 10;
        const x = ((i * 197 + f * (0.6 + depth) * speed * 1.4) % 2100) - 90;
        const y = ((i * 131) % 1080) + Math.sin(f / 40 + i) * 20 * depth;
        const r = 1 + depth * 3;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: i % 5 === 0 ? C.pink : color,
          opacity: 0.25 + depth * 0.4, filter: `blur(${(1 - depth) * 2}px)`, boxShadow: `0 0 ${r * 3}px ${i % 5 === 0 ? C.pink : color}` }} />;
      })}
    </AbsoluteFill>
  );
};

const Flare: React.FC<{ x: number; y: number; o: number; color?: string }> = ({ x, y, o, color = C.blue }) => (
  <div style={{ position: "absolute", left: x - 900, top: y - 6, width: 1800, height: 12, opacity: o, borderRadius: 6, mixBlendMode: "screen",
    background: `radial-gradient(ellipse at center, #ffffff 0%, ${color} 18%, transparent 70%)`, filter: "blur(2px)" }} />
);

const Bars: React.FC = () => {
  const f = useCurrentFrame();
  const h = interpolate(f, [0, 20], [540, 138], { ...clamp, easing: ease.out });
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: "#000" }} />
    </>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "240px",
    backgroundPosition: `${(f * 53) % 240}px ${(f * 97) % 240}px`, opacity: 0.09, mixBlendMode: "overlay" }} />;
};

const Grade: React.FC = () => {
  const hit = useHit();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(40,10,60,0.35), transparent 40%, rgba(10,20,60,0.4))", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: hit * 0.55, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

/* ---------- typography ---------- */
const Card: React.FC<{ from: number; to: number; text: string; size?: number; y?: number; color?: string; type?: boolean }> = ({
  from, to, text, size = 54, y = 540, color = C.ice, type = false,
}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const t = f - from;
  const p = interpolate(t, [0, 26], [0, 1], { ...clamp, easing: ease.out });
  const out = interpolate(f, [to - 10, to], [1, 0], clamp);
  const shown = type ? text.slice(0, Math.floor(interpolate(t, [0, 40], [0, text.length], clamp))) : text;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", textAlign: "center",
      fontFamily: "Rajdhani", fontWeight: 700, fontSize: size, color, textTransform: "uppercase",
      letterSpacing: interpolate(p, [0, 1], [40, 14]), opacity: (type ? 1 : p) * out, filter: `blur(${(1 - p) * 8}px)`,
      textShadow: `0 0 30px ${C.blue}88` }}>
      {shown}{type && t % 20 < 10 && shown.length < text.length ? "▌" : ""}
    </div>
  );
};

const Lower: React.FC<{ from: number; to: number; kicker: string; text: string }> = ({ from, to, kicker, text }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const p = interpolate(f - from, [0, 20], [0, 1], { ...clamp, easing: ease.out });
  const out = interpolate(f, [to - 10, to], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 160, bottom: 190, opacity: p * out, transform: `translateX(${(1 - p) * -40}px)` }}>
      <div style={{ fontFamily: "Rajdhani", fontWeight: 500, fontSize: 26, letterSpacing: 8, color: C.pink, textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ height: 2, width: 420 * p, background: `linear-gradient(90deg, ${C.pink}, transparent)`, margin: "8px 0 12px" }} />
      <div style={{ fontFamily: "Rajdhani", fontWeight: 700, fontSize: 52, letterSpacing: 10, color: C.ice, textTransform: "uppercase" }}>{text}</div>
    </div>
  );
};

const Word: React.FC<{ at: number; to: number; text: string }> = ({ at, to, text }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f >= to) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 220, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 540, transform: `translateY(-50%) scale(${interpolate(p, [0, 1], [1.4, 1])})`,
      textAlign: "center", fontFamily: "Orbitron", fontWeight: 900, fontSize: 120, letterSpacing: 24, color: "#fff",
      textShadow: `0 0 40px ${C.pink}, 0 0 90px ${C.pink}88`, opacity: Math.min(1, p * 2) }}>{text}</div>
  );
};

/* ---------- captain hologram (the user's photo) ---------- */
const Captain: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const t = f - from;
  const p = interpolate(t, [0, 30], [0, 1], { ...clamp, easing: ease.out });
  const flick = t < 18 ? (Math.sin(t * 7) > 0 ? 1 : 0.25) : 0.92 + Math.sin(t * 1.7) * 0.05;
  const out = interpolate(f, [to - 10, to], [1, 0], clamp);
  const lines: [number, string, string][] = [
    [10, "DOSSIER", "CAPITAINE // ACCÈS RESTREINT"], [26, "NOM", "████████"], [42, "STATUT", "DERNIER PILOTE EN VIE"],
    [58, "VAISSEAU", "AURORA-7"], [74, "MISSION", "SECTEUR GALATIA"],
  ];
  const slices = t < 20 ? [0, 1, 2, 3].map((i) => ({ y: ((i * 211 + t * 53) % 900), h: 20 + (i * 17) % 40, dx: (i % 2 ? 1 : -1) * (20 - t) * 3 })) : [];
  const portrait = (extra: React.CSSProperties = {}) => (
    <Img src={staticFile("galatia/captain.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
      filter: "grayscale(1) contrast(1.35) brightness(1.05)", ...extra }} />
  );
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Img src={staticFile(IMG)} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, objectFit: "cover", filter: "blur(18px) brightness(0.35) saturate(1.3)",
        transform: `scale(${1.1 + t / 3000})` }} />
      <Dust n={40} speed={0.4} />
      {/* portrait as hologram */}
      <div style={{ position: "absolute", left: 1080, top: 150, width: 520, height: 780, opacity: p * flick,
        WebkitMaskImage: "radial-gradient(ellipse 60% 58% at 50% 42%, #000 60%, transparent 100%)", maskImage: "radial-gradient(ellipse 60% 58% at 50% 42%, #000 60%, transparent 100%)" }}>
        {portrait()}
        <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.blue}, ${C.pink})`, mixBlendMode: "color" }} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.blue}33, ${C.pink}22)`, mixBlendMode: "screen" }} />
        <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 5px)", backgroundPosition: `0 ${t * 2}px` }} />
        {slices.map((sl, i) => (
          <div key={i} style={{ position: "absolute", left: sl.dx, top: sl.y, width: "100%", height: sl.h, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -sl.y, left: 0, width: 520, height: 780 }}>{portrait({ filter: "grayscale(1) contrast(1.6) brightness(1.4)" })}</div>
          </div>
        ))}
      </div>
      {/* scan line sweeping the portrait */}
      <div style={{ position: "absolute", left: 1080, width: 520, top: 150 + ((t * 9) % 780), height: 3, background: C.blue, boxShadow: `0 0 20px ${C.blue}`, opacity: 0.8 * p }} />
      {/* frame corners */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: p }}>
        {[[1060, 140, 1, 1], [1620, 140, -1, 1], [1060, 940, 1, -1], [1620, 940, -1, -1]].map(([x, y, dx, dy], i) => (
          <path key={i} d={`M ${x} ${y + dy * 60} V ${y} H ${x + dx * 60}`} stroke={C.ice} strokeWidth={3} fill="none" />
        ))}
      </svg>
      {/* data readout */}
      <div style={{ position: "absolute", left: 220, top: 330, fontFamily: "Rajdhani", color: C.ice }}>
        {lines.map(([at, k, v]) => {
          const tt = t - at;
          if (tt < 0) return null;
          const shown = v.slice(0, Math.floor(interpolate(tt, [0, 14], [0, v.length], clamp)));
          return (
            <div key={k} style={{ display: "flex", gap: 24, alignItems: "baseline", marginBottom: 22 }}>
              <span style={{ width: 170, fontSize: 24, letterSpacing: 6, color: C.pink, fontWeight: 500 }}>{k}</span>
              <span style={{ fontSize: k === "STATUT" ? 46 : 38, letterSpacing: 5, fontWeight: 700, textShadow: `0 0 18px ${C.blue}` }}>{shown}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- title ---------- */
const Title: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < from || f >= to) return null;
  const t = f - from;
  const p = spring({ frame: t, fps, config: { damping: 22, stiffness: 120, mass: 1 } });
  const sweep = interpolate(t, [10, 70], [-30, 130], clamp);
  const out = interpolate(f, [to - 12, to], [1, 0], clamp);
  const glitch = t < 8 ? (8 - t) * 4 : 0;
  const letters = "GALATIA".split("");
  const word = (color: string, dx: number, blend?: React.CSSProperties["mixBlendMode"], op = 1) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 540, transform: `translate(${dx}px, -50%) scale(${interpolate(p, [0, 1], [1.25, 1])})`,
      textAlign: "center", fontFamily: "Orbitron", fontWeight: 900, fontSize: 210, letterSpacing: interpolate(p, [0, 1], [90, 46]),
      color, mixBlendMode: blend, opacity: op }}>
      {letters.map((l, i) => <span key={i} style={{ opacity: interpolate(t, [i * 2, i * 2 + 6], [0, 1], clamp) }}>{l}</span>)}
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${C.pink}33, transparent 60%)`, opacity: p }} />
      {word(C.pink, -glitch - 4, "screen", 0.8)}
      {word(C.blue, glitch + 4, "screen", 0.8)}
      <div style={{ position: "absolute", left: 0, right: 0, top: 540, transform: `translateY(-50%) scale(${interpolate(p, [0, 1], [1.25, 1])})`, textAlign: "center",
        fontFamily: "Orbitron", fontWeight: 900, fontSize: 210, letterSpacing: interpolate(p, [0, 1], [90, 46]),
        backgroundImage: `linear-gradient(100deg, #9aa7c7 0%, #ffffff ${sweep - 8}%, #ffffff ${sweep}%, #c7d3f0 ${sweep + 8}%, #5d6a8f 100%)`,
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: `drop-shadow(0 0 30px ${C.blue}aa)` }}>
        {letters.map((l, i) => <span key={i} style={{ opacity: interpolate(t, [i * 2, i * 2 + 6], [0, 1], clamp) }}>{l}</span>)}
      </div>
      <Flare x={960} y={540} o={interpolate(t, [0, 6, 40], [0, 1, 0.35], clamp)} color={C.blue} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: "Rajdhani", fontWeight: 500, fontSize: 30,
        letterSpacing: 18, color: C.ice, opacity: interpolate(t, [70, 100], [0, 0.9], clamp), textTransform: "uppercase" }}>
        Bientôt disponible
      </div>
    </AbsoluteFill>
  );
};

/* ---------- edit ---------- */
export const GalatiaTrailer: React.FC = () => {
  useFontFaces([
    ["Orbitron", "fonts/orbitron-latin-900-normal.woff2", "900"],
    ["Orbitron", "fonts/orbitron-latin-700-normal.woff2", "700"],
    ["Rajdhani", "fonts/rajdhani-latin-500-normal.woff2", "500"],
    ["Rajdhani", "fonts/rajdhani-latin-700-normal.woff2", "700"],
  ]);
  const f = useCurrentFrame();
  const SHIP: [number, number] = [1103, 451], STATION: [number, number] = [470, 600], BEAST: [number, number] = [1730, 420],
    FLESH: [number, number] = [1060, 170], DEBRIS: [number, number] = [1640, 880], CORE: [number, number] = [760, 760];
  const flickerCuts = [CORE, BEAST, SHIP, FLESH, STATION, DEBRIS];
  const fc = Math.floor((f - s(32.6)) / 3);
  const thrust = 0.6 + Math.sin(f / 3) * 0.2;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* 0–3 cold open */}
      <Card from={s(0.6)} to={s(3.0)} text="Dans les confins de la nébuleuse" size={44} type />
      {/* 3–9 establishing */}
      <Shot from={s(3.0)} to={s(9.0)} focus={[960, 560]} z={[1.04, 1.22]} rot={[-1.2, 0.6]} />
      {f >= s(3) && f < s(9) && <Dust />}
      <Lower from={s(4.6)} to={s(9.0)} kicker="Secteur 07 — Galatia" text="Une station oubliée" />
      {/* 9–11 */}
      <Card from={s(9.0)} to={s(11.0)} text="Quelque chose s'est réveillé" size={58} />
      {/* 11–16 ship close-up */}
      <Shot from={s(11.0)} to={s(16.0)} focus={SHIP} z={[2.4, 3.1]} rot={[2, -1]} />
      {f >= s(11) && f < s(16) && <><Dust n={90} speed={2.2} /><Flare x={960} y={540} o={thrust} /></>}
      <Lower from={s(12.4)} to={s(16.0)} kicker="Aurora-7" text="Un seul pilote" />
      {/* 16–21 captain */}
      <Captain from={s(16.0)} to={s(21.0)} />
      {/* 21–23 */}
      <Card from={s(21.0)} to={s(23.0)} text="Une dernière mission" size={64} />
      {/* 23–33.2 build */}
      <Shot from={s(23.0)} to={s(25.0)} focus={FLESH} z={[1.9, 2.3]} rot={[-2, 2]} />
      <Shot from={s(25.0)} to={s(27.0)} focus={BEAST} z={[2.2, 2.6]} rot={[1, -2]} />
      <Shot from={s(27.0)} to={s(28.5)} focus={STATION} z={[1.8, 2.3]} rot={[0, 3]} />
      <Shot from={s(28.5)} to={s(30.0)} focus={SHIP} z={[3.4, 2.6]} rot={[-3, 1]} />
      <Shot from={s(30.0)} to={s(31.0)} focus={DEBRIS} z={[2.4, 2.9]} />
      <Shot from={s(31.0)} to={s(32.0)} focus={CORE} z={[2.6, 3.0]} rot={[2, -2]} />
      <Shot from={s(32.0)} to={s(32.6)} focus={[960, 540]} z={[1.6, 1.3]} />
      {f >= s(32.6) && f < s(33.2) && fc % 2 === 0 && <Shot from={s(32.6)} to={s(33.2)} focus={flickerCuts[fc % 6]} z={[2.8, 2.8]} />}
      {f >= s(23) && f < s(33.2) && <Dust n={80} speed={3} />}
      <Word at={s(23.05)} to={s(24.6)} text="EXPLORER" />
      <Word at={s(25.05)} to={s(26.6)} text="SURVIVRE" />
      <Word at={s(27.05)} to={s(28.4)} text="RÉSISTER" />
      {/* 33.2–34.5 silence: black. 34.5 title */}
      {f >= s(34.5) && f < s(41.5) && <Shot from={s(34.5)} to={s(41.5)} focus={[960, 540]} z={[1.25, 1.1]} blur={6} dim={0.55} />}
      {f >= s(34.5) && f < s(41.5) && <Dust n={60} speed={0.5} />}
      <Title from={s(34.5)} to={s(41.5)} />
      {/* 41.5–45 end card */}
      <Card from={s(41.6)} to={s(45.0)} text="Prépare-toi." size={70} y={500} />
      <Card from={s(42.6)} to={s(45.0)} text="Galatia" size={30} y={600} color={C.pink} />
      <Grade />
      <Grain />
      <Bars />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [GALATIA_FRAMES - 20, GALATIA_FRAMES - 1], [0, 1], clamp) }} />
      <Audio src={staticFile("galatia/score.wav")} volume={(fr) => interpolate(fr, [0, 10, GALATIA_FRAMES - 30, GALATIA_FRAMES - 1], [0, 1, 1, 0], clamp)} />
    </AbsoluteFill>
  );
};
