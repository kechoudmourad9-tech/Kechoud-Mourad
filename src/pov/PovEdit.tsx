// "La base des maths" — fast-cut edit on the user's voice-over (public/pov/voice.m4a).
// Layout inspired by rapid "POV" teaser edits: black vertical frame, fixed title on top, a 16:9 strip in
// the middle where a new hand-made motion-graphic clip appears every ~1–2 s (graph paper + red ink,
// neon on black, blueprint), punch-in + flash on every cut, word captions under the strip.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { Mark, Squig } from "../cx/clips";
import captions from "./captions.json";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
export const POV_FRAMES = fr(67.6);
const RED = "#ff2d2d", BLUE = "#2f7bff", YEL = "#ffd23f", GRN = "#27c26c";
const sat = (x: number) => Math.min(1, Math.max(0, x));
const eo = (x: number) => 1 - Math.pow(1 - sat(x), 3);
/** 0→1 eased progress starting at `at` (s) lasting d */
const k = (u: number, at = 0, d = 0.3) => eo((u - at) / d);
/** overshoot pop */
const pp = (u: number, at = 0, d = 0.32) => { const x = sat((u - at) / d); if (x <= 0) return 0; const c = 2.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
type Bg = "paper" | "dark" | "blue" | "red";
const INK: Record<Bg, string> = { paper: "#141414", dark: "#ffffff", blue: "#eaf2ff", red: "#ffffff" };

/* ---------- drawing primitives (SVG, 1080 x 608) ---------- */
const Draw: React.FC<{ d: string; p: number; c: string; w?: number; dash?: string; glow?: boolean }> = ({ d, p, c, w = 8, dash, glow }) => (
  dash ? <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} opacity={p} style={glow ? { filter: `drop-shadow(0 0 10px ${c})` } : undefined} />
    : <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}
      style={glow ? { filter: `drop-shadow(0 0 10px ${c})` } : undefined} />
);
const T: React.FC<{ x: number; y: number; s?: number; c?: string; f?: string; children: React.ReactNode; sc?: number; rot?: number; anchor?: "start" | "middle" | "end"; it?: boolean; glow?: string; ls?: number }> = ({
  x, y, s = 60, c = "#fff", f = "Anton", children, sc = 1, rot = 0, anchor = "middle", it, glow, ls = 0 }) => (
  sc <= 0.001 ? null : <text x={0} y={0} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} fontFamily={f} fontSize={s} fill={c} textAnchor={anchor} dominantBaseline="central"
    fontStyle={it ? "italic" : undefined} letterSpacing={ls} style={glow ? { filter: `drop-shadow(0 0 14px ${glow})` } : undefined}>{children}</text>
);
const Person: React.FC<{ x: number; y: number; s?: number; ink: string; col: string; label: string; wave?: number; sc?: number }> = ({ x, y, s = 1, ink, col, label, wave = 0, sc = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * sc})`}>
    <circle cx={0} cy={-150} r={34} fill="none" stroke={ink} strokeWidth={9} />
    <path d={`M0 -116 V-20 M0 -20 L-34 62 M0 -20 L34 62 M0 -92 L-44 ${-44} M0 -92 L44 ${-60 - wave * 50}`} fill="none" stroke={ink} strokeWidth={9} strokeLinecap="round" />
    <circle cx={0} cy={-232} r={30} fill={col} /><text x={0} y={-230} fontFamily="Anton" fontSize={38} fill="#fff" textAnchor="middle" dominantBaseline="central">{label}</text>
  </g>
);
const Basket: React.FC<{ x: number; y: number; s?: number; ink: string; fill?: string }> = ({ x, y, s = 1, ink, fill = "none" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-70 -30 Q0 -130 70 -30" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />
    <path d="M-84 -30 H84 L62 50 H-62 Z" fill={fill} stroke={ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M-72 -4 H72 M-66 22 H66 M-40 -30 L-32 50 M0 -30 V50 M40 -30 L32 50" stroke={ink} strokeWidth={4} opacity={0.6} />
  </g>
);
const Apple: React.FC<{ x: number; y: number; r?: number; rot?: number; glow?: boolean }> = ({ x, y, r = 40, rot = 0, glow }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 40})`} style={glow ? { filter: `drop-shadow(0 0 18px ${RED})` } : undefined}>
    <path d="M0 -26 C-40 -52 -58 0 -34 32 C-18 52 -8 40 0 40 C8 40 18 52 34 32 C58 0 40 -52 0 -26 Z" fill={RED} />
    <path d="M0 -28 Q4 -46 16 -52" stroke="#5a3415" strokeWidth={6} fill="none" strokeLinecap="round" /><path d="M10 -44 Q32 -62 42 -42 Q24 -30 10 -44 Z" fill={GRN} />
    <ellipse cx={-18} cy={-6} rx={7} ry={12} fill="#fff" opacity={0.45} />
  </g>
);
const Half: React.FC<{ x: number; y: number; r?: number; side: -1 | 1; rot?: number; glow?: boolean }> = ({ x, y, r = 40, side, rot = 0, glow }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${(r / 40) * side} ${r / 40})`} style={glow ? { filter: `drop-shadow(0 0 16px ${RED})` } : undefined}>
    <path d="M0 -26 C-40 -52 -58 0 -34 32 C-18 52 -8 40 0 40 Z" fill={RED} /><path d="M0 -22 C-26 -36 -40 0 -24 26 C-14 38 -6 32 0 32 Z" fill="#fff1c9" />
    <ellipse cx={-6} cy={6} rx={3} ry={6} fill="#5a3415" />
  </g>
);
const arc = (x1: number, y1: number, x2: number, y2: number, h: number) => `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - h} ${x2} ${y2}`;
const onArc = (x1: number, y1: number, x2: number, y2: number, h: number, p: number): [number, number] => {
  const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - h, q = 1 - p;
  return [q * q * x1 + 2 * q * p * cx + p * p * x2, q * q * y1 + 2 * q * p * cy + p * p * y2];
};
const Head: React.FC<{ x: number; y: number; p: number; c: string; a?: number; s?: number }> = ({ x, y, p, c, a = 0, s = 1 }) => (
  p < 0.95 ? null : <path d="M-26 -18 L8 0 L-26 18 Z" fill={c} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} />
);
const Ell: React.FC<{ cx: number; cy: number; rx: number; ry: number; p: number; c: string; fill?: string }> = ({ cx, cy, rx, ry, p, c, fill = "none" }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} stroke={c} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
);
const Gear: React.FC<{ x: number; y: number; r: number; a: number; c: string; n?: number }> = ({ x, y, r, a, c, n = 10 }) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    {Array.from({ length: n }).map((_, i) => <rect key={i} x={-r * 0.14} y={-r * 1.22} width={r * 0.28} height={r * 0.4} rx={6} fill={c} transform={`rotate(${(360 / n) * i})`} />)}
    <circle r={r} fill={c} /><circle r={r * 0.42} fill="#0b0b10" />
  </g>
);

/* ---------- the scenes: ONE dark image per idea; every animation happens inside it, the camera travels ---------- */
const sm = (x: number) => { const v = sat(x); return v * v * (3 - 2 * v); };
type Key = [number, number, number, number];                    // time, centre x, centre y, zoom
const cam = (keys: Key[], t: number): [number, number, number] => {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2], keys[0][3]];
  for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (t <= b[0]) { const p = sm((t - a[0]) / (b[0] - a[0])); return [a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p, a[3] + (b[3] - a[3]) * p]; } }
  const l = keys[keys.length - 1]; return [l[1], l[2], l[3]];
};
const soft = (z: number) => 1 + (z - 1) * 0.55;   // keep the drawings small: the camera only leans in
const INKC = "#f3f5ff", DIM = "#8f96b8";
const Chip: React.FC<{ x: number; y: number; text: string; c?: string; fg?: string; sc?: number; s?: number }> = ({ x, y, text, c = RED, fg = "#fff", sc = 1, s = 30 }) => {
  const w = text.length * s * 0.5 + s * 1.1; return sc <= 0.001 ? null : <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-w / 2} y={-s * 0.72} width={w} height={s * 1.44} rx={s * 0.42} fill={c} /><T x={0} y={1} s={s} c={fg}>{text}</T></g>;
};
const AX = 170, BX = 910, PY = 480, BAX = 320, BBX = 760, BY = 462;      // persons / baskets in the story image
const ARC: [number, number, number, number, number] = [BAX, 372, BBX, 372, 170];

/* 1 — hook */
const Hook = (t: number) => <>
  {["∑", "∫", "π", "√", "∞", "Δ", "÷", "≠"].map((s, i) => { const a = i * 0.785 + t * 0.5; return <T key={s} x={540 + Math.cos(a) * 330} y={304 + Math.sin(a) * 190} s={46} c={DIM} f="KaTeX_Main" sc={pp(t, 0.05 + i * 0.05)}>{s}</T>; })}
  <T x={540} y={250} s={150} c={RED} sc={pp(t, 0.15)} rot={Math.sin(t * 5) * 4}>?</T>
  <T x={540} y={390} s={64} c={INKC} sc={pp(t, 1.3)}>LA BASE DES MATHS</T><Squig x={540} y={432} w={420} p={k(t, 1.6, 0.35)} c={YEL} />
</>;

/* 2 — the whole apple story in one image: A, B, two baskets, one apple, the arrow, then "application" */
const Story = (t: number) => {
  const drop = k(t, 7.5, 0.4), lift = sm((t - 17.63) / 0.5), split = sm((t - 18.39) / 0.4), go = sm((t - 19.75) / 1.3);
  const [gx, gy] = onArc(...ARC, go);
  const ax = go > 0 ? gx : BAX, ay = go > 0 ? gy + (go >= 1 ? 50 : 0) : -60 + drop * 487 - lift * 55 - Math.sin(sat((t - 7.9) / 0.3) * Math.PI) * 14;
  const off = split * 20, spin = go * 360;
  const solid = k(t, 25.3, 0.6), rp = t > 27.2 && t < 31.3 ? sm((t - 27.6) / 3.2) : -1, [rx, ry] = onArc(...ARC, Math.max(0, rp));
  return <>
    <line x1={60} y1={PY + 52} x2={1020} y2={PY + 52} stroke="#2b3157" strokeWidth={4} />
    <Person x={AX} y={PY} s={0.78} ink={INKC} col={RED} label="A" sc={pp(t, 4.25)} wave={t > 17.4 && t < 21.2 ? 1 : 0} />
    <Person x={BX} y={PY} s={0.78} ink={INKC} col={BLUE} label="B" sc={pp(t, 4.97)} wave={t > 21.3 ? Math.sin(t * 10) * 0.5 + 0.5 : 0} />
    <g opacity={k(t, 6.2, 0.3)}><Basket x={BAX} y={BY} s={0.95} ink={INKC} /></g><g opacity={k(t, 10.4, 0.3)}><Basket x={BBX} y={BY} s={0.95} ink={INKC} /></g>
    {/* the gesture: dashed first ("she wants to"), solid red once it is named */}
    <Draw d={arc(...ARC)} p={k(t, 14.8, 0.8) * (1 - solid)} c={DIM} w={5} dash="14 12" />
    <Draw d={arc(...ARC)} p={solid} c={RED} w={12} glow /><Head x={BBX - 2} y={366} p={solid} c={RED} a={62} />
    {/* the apple */}
    {t >= 7.4 && (split <= 0 ? <Apple x={ax} y={ay} r={30} rot={(1 - drop) * -120} glow /> : <><Half x={ax - off} y={ay} r={30} side={1} rot={spin} glow /><Half x={ax + off} y={ay} r={30} side={-1} rot={spin} glow /></>)}
    {t > 13.3 && t < 18.4 && <Draw d={`M${BAX} ${ay - 52} V${ay + 52}`} p={k(t, 13.41, 0.3)} c="#fff" w={4} dash="9 8" />}
    {rp >= 0 && (rp < 0.45 ? <Apple x={rx} y={ry} r={20} /> : <><Half x={rx - 13} y={ry} r={20} side={1} rot={rp * 360} /><Half x={rx + 13} y={ry} r={20} side={-1} rot={rp * 360} /></>)}
    {/* small labels, each tied to a word */}
    {t < 12.3 && <Chip x={BAX} y={548} text="1 pomme" sc={pp(t, 7.9)} />}
    {t < 19.7 && <><T x={BBX} y={400} s={54} c={DIM} f="KaTeX_Main" sc={pp(t, 11.57)}>∅</T><Chip x={BBX} y={548} text="vide" c="#2b3157" sc={pp(t, 11.93)} /></>}
    {t > 13.3 && t < 16.5 && <T x={BAX + 86} y={372} s={32} c={YEL} f="KaTeX_Main" sc={pp(t, 13.5)}>÷ 2</T>}
    {t > 14.7 && t < 16.6 && <T x={540} y={176} s={56} c={DIM} sc={pp(t, 15.1)}>?</T>}
    {t >= 16.6 && t < 24.8 && [["1 prendre", 17.63], ["2 couper", 18.39], ["3 donner", 20.23]].map(([s, at], i) => <Chip key={i} x={330 + i * 210} y={585} text={s as string} c={t >= (at as number) ? RED : "#2b3157"} sc={pp(t, 16.7 + i * 0.12)} s={26} />)}
    {t >= 22.4 && t < 24.8 && <T x={BBX} y={330} s={40} c={YEL} f="KaTeX_Main" sc={pp(t, 22.45)}>½ + ½</T>}
    <T x={540} y={150} s={58} c="#fff" sc={pp(t, 26.63)}>APPLICATION</T><Squig x={540} y={186} w={330} p={k(t, 27.0, 0.3)} />
    <T x={540} y={578} s={62} c={INKC} f="KaTeX_Main" sc={pp(t, 31.7)} glow={BLUE}>f : A → B</T><Mark x={540} y={580} rx={190} ry={44} p={k(t, 32.5, 0.45)} c={YEL} w={6} seed={3} />
  </>;
};
const STORY_CAM: Key[] = [[2.5, 540, 304, 1], [3.5, 540, 320, 1.05], [5.8, 540, 320, 1.05], [6.8, 270, 380, 1.75], [9.7, 280, 380, 1.8], [10.5, 800, 380, 1.75], [12.2, 800, 380, 1.8], [12.9, 330, 380, 2.0], [14.3, 330, 380, 2.05],
  [15.2, 540, 320, 1.1], [16.6, 540, 320, 1.14], [17.5, 320, 370, 1.9], [19.3, 320, 360, 1.95], [20.1, 540, 320, 1.25], [21.3, 770, 380, 1.8], [24.6, 780, 380, 1.9], [25.4, 540, 290, 1.25], [27.0, 540, 280, 1.3], [31.4, 540, 290, 1.38], [32.0, 540, 340, 1.08], [33.4, 540, 340, 1.12]];

/* 3 — mathematicians → set theory → "how maths work", one image */
const Sets = (t: number) => <>
  {[0, 1, 2].map((i) => <g key={i} transform={`translate(${150 + i * 120} 330) scale(${pp(t, 33.7 + i * 0.15)})`}>
    <circle r={40} fill="none" stroke={INKC} strokeWidth={6} /><path d="M-26 -5 h20 v14 h-20 z M6 -5 h20 v14 h-20 z M-6 1 h12" fill="none" stroke={INKC} strokeWidth={4} /><path d="M-13 22 q13 9 26 0" fill="none" stroke={INKC} strokeWidth={4} strokeLinecap="round" />
    <g transform={`translate(0 ${-78 - Math.sin(t * 5 + i) * 5})`} opacity={k(t, 35.2 + i * 0.2)}><circle r={17} fill={YEL} style={{ filter: `drop-shadow(0 0 10px ${YEL})` }} /><rect x={-7} y={15} width={14} height={9} rx={2} fill={INKC} /></g></g>)}
  <T x={270} y={430} s={30} c={DIM} sc={pp(t, 35.15)}>les mathématiciens</T>
  <Draw d="M450 320 H560" p={k(t, 36.1, 0.4)} c={DIM} w={5} /><Head x={566} y={320} p={k(t, 36.1, 0.4)} c={DIM} s={0.6} />
  <Ell cx={720} cy={300} rx={120} ry={100} p={k(t, 36.9, 0.6)} c={RED} fill="#ff2d2d1c" /><Ell cx={850} cy={300} rx={120} ry={100} p={k(t, 37.3, 0.6)} c={BLUE} fill="#2f7bff1c" />
  {[[670, 280], [700, 340], [785, 300], [880, 270], [900, 335]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={8 * pp(t, 37.7 + i * 0.07)} fill={INKC} />)}
  <T x={785} y={440} s={34} c={INKC} sc={pp(t, 37.63)}>THÉORIE DES ENSEMBLES</T><Squig x={785} y={464} w={300} p={k(t, 38.3, 0.3)} />
  <g opacity={k(t, 38.9, 0.3)}><Gear x={500} y={545} r={34} a={t * 90} c={INKC} n={9} /><Gear x={566} y={520} r={24} a={-t * 128 + 14} c={RED} n={7} /></g>
  <T x={690} y={540} s={30} c={DIM} anchor="start" sc={pp(t, 40.1)}>comment ça fonctionne ?</T>
</>;
const SETS_CAM: Key[] = [[33.4, 540, 320, 1.05], [34.3, 280, 330, 1.7], [36.2, 290, 330, 1.78], [37.1, 780, 320, 1.6], [38.6, 785, 340, 1.68], [39.3, 640, 470, 1.6], [41.8, 650, 470, 1.7]];

/* 4 — départ → f → arrivée, x ↦ f(x): one mapping diagram that fills in as the voice goes */
const MY = [235, 320, 405];
const Mapping = (t: number) => { const go = sm((t - 59.3) / 1.6), mid = `M318 320 C450 270 630 370 762 320`;
  const q = 1 - go, px = q * q * q * 318 + 3 * q * q * go * 450 + 3 * q * go * go * 630 + go * go * go * 762, py = q * q * q * 320 + 3 * q * q * go * 270 + 3 * q * go * go * 370 + go * go * go * 320;
  const ex = Math.min(3, Math.floor((t - 61.9) / 0.85)), X = [2, 3, 5, 10][Math.max(0, ex)];
  return <>
    <Ell cx={300} cy={320} rx={130} ry={170} p={k(t, 42.2, 0.9)} c={RED} fill="#ff2d2d1a" />
    {MY.map((y, i) => <circle key={i} cx={300} cy={y} r={9 * pp(t, 44.39 + i * 0.12)} fill={i === 1 && t > 58 ? YEL : INKC} style={i === 1 && t > 58 ? { filter: `drop-shadow(0 0 10px ${YEL})` } : undefined} />)}
    <Chip x={300} y={122} text="départ" sc={pp(t, 45.29)} s={28} />
    {[["ℝ", 47.91], ["ℕ", 48.53], ["ℤ", 49.13]].map(([s, at], i) => <T key={i} x={96} y={235 + i * 85} s={62} c={t - (at as number) < 0.5 ? YEL : INKC} f="KaTeX_AMS" sc={pp(t, at as number)}>{s}</T>)}
    <Ell cx={780} cy={320} rx={130} ry={170} p={k(t, 50.4, 0.9)} c={BLUE} fill="#2f7bff1a" />
    {MY.map((y, i) => <g key={y}><Draw d={i === 1 ? mid : `M318 ${y} C450 ${y - 50} 630 ${y + 50} 762 ${y}`} p={k(t, 50.9 + i * 0.3, 0.7)} c={i === 1 && t > 58.5 ? YEL : DIM} w={i === 1 && t > 58.5 ? 6 : 4} />
      <Head x={768} y={y} p={k(t, 50.9 + i * 0.3, 0.7)} c={i === 1 && t > 58.5 ? YEL : DIM} s={0.5} a={-8} /><circle cx={780} cy={y} r={9 * pp(t, 51.6 + i * 0.3)} fill={i === 1 && t > 60.9 ? YEL : INKC} /></g>)}
    <Chip x={780} y={122} text="arrivée" c={BLUE} sc={pp(t, 52.77)} s={28} />
    {[["ℕ", 54.03], ["ℝ", 54.57]].map(([s, at], i) => <T key={i} x={984} y={278 + i * 85} s={62} c={t - (at as number) < 0.5 ? YEL : INKC} f="KaTeX_AMS" sc={pp(t, at as number)}>{s}</T>)}
    <g transform={`translate(540 250) scale(${pp(t, 56.47)})`}><circle r={34} fill={RED} style={{ filter: `drop-shadow(0 0 14px ${RED})` }} /><text fontFamily="KaTeX_Math" fontStyle="italic" fontSize={44} fill="#fff" textAnchor="middle" dominantBaseline="central">f</text></g>
    <T x={262} y={320} s={38} c={YEL} f="KaTeX_Math" it sc={pp(t, 58.05)}>x</T>
    {go > 0 && go < 1 && <circle cx={px} cy={py} r={11} fill={YEL} style={{ filter: `drop-shadow(0 0 12px ${YEL})` }} />}
    <T x={842} y={320} s={34} c={YEL} f="KaTeX_Math" it sc={pp(t, 60.95)}>f(x)</T>
    {ex >= 0 && <T x={540} y={560} s={46} c={INKC} f="KaTeX_Main" sc={pp(t, 61.9 + ex * 0.85, 0.2)}>{`x = ${X}   →   f(x) = ${X * X}`}</T>}
  </>; };
const MAP_CAM: Key[] = [[41.8, 300, 320, 1.55], [46.6, 300, 320, 1.62], [47.3, 220, 320, 1.8], [49.9, 215, 320, 1.86], [50.6, 540, 320, 1.05], [53.0, 540, 320, 1.08], [53.7, 860, 320, 1.75], [55.3, 865, 320, 1.8],
  [56.1, 540, 290, 1.4], [57.0, 540, 290, 1.44], [57.8, 330, 320, 1.85], [59.2, 335, 320, 1.9], [60.9, 740, 320, 1.8], [61.6, 745, 320, 1.84], [62.2, 540, 345, 1.08], [64.8, 540, 345, 1.14]];

const End = (t: number) => <>
  {Array.from({ length: 14 }).map((_, i) => <Draw key={i} d={`M540 304 L${540 + Math.cos(i * 0.449) * 900} ${304 + Math.sin(i * 0.449) * 900}`} p={k(t, 64.9, 0.5)} c={i % 2 ? RED : "#28324f"} w={3} />)}
  <rect x={300} y={196} width={480} height={130} rx={26} fill={RED} transform={`rotate(-3 540 260) scale(${pp(t, 65.0)})`} style={{ transformOrigin: "540px 260px" }} />
  <T x={540} y={262} s={96} c="#fff" sc={pp(t, 65.0)} rot={-3}>ABONNE-TOI</T><T x={540} y={420} s={44} c="#e9ecff" sc={pp(t, 65.5)}>pour la suite des maths ↗</T></>;

type Scene = { a: number; r: (t: number) => React.ReactNode; cam: Key[] };
const SCENES: Scene[] = [{ a: 0, r: Hook, cam: [[0, 540, 304, 1], [2.5, 540, 304, 1.12]] }, { a: 2.5, r: Story, cam: STORY_CAM }, { a: 33.4, r: Sets, cam: SETS_CAM }, { a: 41.8, r: Mapping, cam: MAP_CAM }, { a: 64.9, r: End, cam: [[64.9, 540, 304, 1], [67.6, 540, 304, 1.06]] }];
/* every moment something appears (pop) — also used for the sound design */
const BEATS = [0.15, 1.3, 4.25, 4.97, 7.9, 11.57, 11.93, 13.41, 15.1, 17.63, 18.39, 20.23, 22.45, 25.3, 26.63, 31.7, 33.7, 35.2, 36.9, 37.63, 38.9, 40.1, 44.39, 45.29, 47.91, 48.53, 49.13, 50.9, 52.77, 54.03, 54.57, 56.47, 58.05, 60.95, 61.9, 62.75, 63.6, 65.0];

const Strip: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  let i = 0; for (let j = 0; j < SCENES.length; j++) if (t >= SCENES[j].a) i = j;
  const sc = SCENES[i], u = t - sc.a, [cx, cy, zr] = cam(sc.cam, t), z0 = soft(zr);
  const beat = Math.max(0, ...BEATS.map((b) => (t >= b ? 1 - sat((t - b) / 0.18) : 0))), z = z0 * (1 + beat * 0.035);   // a tiny zoom "kick" on every beat keeps the rhythm without cutting
  const dir = i % 2 ? 1 : -1, gl = sat(1 - u / 0.14), dx = 22 * gl * dir, g = Math.floor(t * 15);
  return (
    <div style={{ position: "absolute", left: 0, top: 640, width: 1080, height: 608, overflow: "hidden", background: "#070913" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs><filter id="povrgb" x="-4%" width="108%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={dx} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-dx} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" /></filter></defs></svg>
      <div style={{ position: "absolute", inset: 0, filter: gl > 0 ? "url(#povrgb)" : undefined }}>
        {/* dark blueprint ground that moves with the camera (parallax) */}
        <div style={{ position: "absolute", inset: -200, background: "radial-gradient(circle at 50% 45%, #171a33 0%, #070913 70%)" }} />
        <div style={{ position: "absolute", inset: -200, opacity: 0.5, backgroundImage: "linear-gradient(#ffffff0d 1.5px, transparent 1.5px), linear-gradient(90deg, #ffffff0d 1.5px, transparent 1.5px)", backgroundSize: `${44 * z}px ${44 * z}px`,
          backgroundPosition: `${-cx * z * 0.6}px ${-cy * z * 0.6}px` }} />
        <svg width={1080} height={608} viewBox="0 0 1080 608" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g transform={`translate(${540 - cx * z} ${304 - cy * z}) scale(${z})`}>{sc.r(t)}</g></svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: sat(1 - u * 13) * 0.4 }} />
      {gl > 0.3 ? [0, 1].map((b) => <div key={b} style={{ position: "absolute", left: 0, right: 0, top: (g * 131 + b * 311) % 560, height: 18 + ((g * 17 + b * 29) % 40),
        background: b ? "rgba(40,224,255,0.25)" : "rgba(255,45,45,0.25)", transform: `translateX(${((g * 53 + b * 97) % 60) - 30}px)` }} />) : null}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("pov/grain.png")})`, backgroundPosition: `${(g * 173) % 512}px ${(g * 311) % 512}px`, opacity: 0.14, mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(0,0,0,0.55)" }} />
    </div>
  );
};

type W = [string, number, number];
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS, pages = captions as W[][];
  const page = pages.find((p, i) => t >= p[0][1] - 0.05 && t < (pages[i + 1]?.[0][1] ?? p[p.length - 1][2] + 0.4));
  if (!page || t > page[page.length - 1][2] + 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1330, display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
      {page.map((x, i) => { const on = t >= x[1] && t < x[2] + 0.08;
        return <span key={i} style={{ fontFamily: "InterX", fontWeight: 800, fontSize: 62, lineHeight: 1.3, color: on ? YEL : t >= x[1] ? "#fff" : "rgba(255,255,255,0.35)",
          transform: `scale(${on ? 1.08 : 1})`, display: "inline-block", margin: "0 11px", whiteSpace: "nowrap" }}>{x[0]}</span>; })}
    </div>
  );
};

const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, fr(at))} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);

export const PovEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame(), t = f / FPS;
  const [h] = useState(() => delayRender("katex + display fonts"));
  useEffect(() => {
    Promise.all(["400 40px KaTeX_Main", "italic 40px KaTeX_Math", "40px KaTeX_AMS", "40px Anton"].map((x) => document.fonts.load(x, "fℝℕℤx∅")))
      .catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  const prog = sat(t / 64.9);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: "InterX", fontWeight: 600, fontSize: 60, lineHeight: 1.22, color: "#fff",
        opacity: interpolate(f, [0, 8], [0, 1], clamp) }}>POV : tu comprends enfin<br />la base des maths</div>
      <Strip />
      <div style={{ position: "absolute", left: 0, top: 1248, height: 6, width: 1080 * prog, background: RED }} />
      <Captions />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1700, textAlign: "center", fontFamily: "InterX", fontWeight: 600, fontSize: 34, color: "rgba(255,255,255,0.4)", letterSpacing: 6 }}>
        ALGÈBRE · LES APPLICATIONS</div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [POV_FRAMES - 10, POV_FRAMES - 1], [0, 1], clamp) }} />
      <Audio src={staticFile("pov/voice.m4a")} />
      <Audio src={staticFile("pov/bed.wav")} volume={(x) => interpolate(x, [0, 15, fr(64.9), fr(65.2), POV_FRAMES - 3], [0, 0.07, 0.07, 0.22, 0], clamp)} />
      {SCENES.slice(1).map((x, i) => <Sfx key={`c${i}`} at={x.a - 0.03} src="whoosh" v={0.3} />)}
      {BEATS.map((x, i) => <Sfx key={`b${i}`} at={x - 0.02} src={i % 3 === 0 ? "pop" : i % 3 === 1 ? "tick" : "swipe"} v={0.2} />)}
    </AbsoluteFill>
  );
};
