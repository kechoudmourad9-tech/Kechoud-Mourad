// "La base des maths" — fast-cut edit on the user's voice-over (public/pov/voice.m4a).
// Layout inspired by rapid "POV" teaser edits: black vertical frame, fixed title on top, a 16:9 strip in
// the middle where a new hand-made motion-graphic clip appears every ~1–2 s (graph paper + red ink,
// neon on black, blueprint), punch-in + flash on every cut, word captions under the strip.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
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
const Head: React.FC<{ x: number; y: number; p: number; c: string; a?: number }> = ({ x, y, p, c, a = 0 }) => (
  p < 0.95 ? null : <path d="M-26 -18 L8 0 L-26 18 Z" fill={c} transform={`translate(${x} ${y}) rotate(${a})`} />
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

/* ---------- the clips ---------- */
type Clip = { a: number; bg: Bg; r: (u: number, ink: string) => React.ReactNode };
const AX = 250, BX = 830, PY = 470;                           // person A / B positions in wide shots
const two = (ink: string, sc = 1) => <><Person x={AX} y={PY} ink={ink} col={RED} label="A" sc={sc} /><Person x={BX} y={PY} ink={ink} col={BLUE} label="B" sc={sc} /></>;
const CLIPS: Clip[] = [
  { a: 0, bg: "paper", r: (u, ink) => <>
    {["∑", "∫", "π", "√", "∞", "Δ", "÷", "≠"].map((s, i) => <T key={s} x={110 + (i % 4) * 290 + (i > 3 ? -40 : 0)} y={i > 3 ? 500 : 110} s={90} c={ink} f="KaTeX_Main" sc={pp(u, 0.05 + i * 0.05)} rot={(i - 3) * 6}>{s}</T>)}
    <T x={540} y={310} s={380} c={RED} sc={pp(u, 0.15)} rot={-6 + Math.sin(u * 5) * 4}>?</T></> },
  { a: 1.3, bg: "dark", r: (u) => <>
    <T x={540} y={190} s={70} c="#9aa0b5" ls={10} sc={k(u, 0, 0.2)}>LA BASE DES</T>
    <T x={546 + (u < 0.4 ? 10 : 2)} y={360} s={210} c={RED} sc={pp(u, 0.1)}>MATHS</T><T x={534 - (u < 0.4 ? 10 : 2)} y={360} s={210} c="#28e0ff" sc={pp(u, 0.1)}>MATHS</T>
    <T x={540} y={360} s={210} c="#fff" sc={pp(u, 0.1)}>MATHS</T></> },
  { a: 2.5, bg: "paper", r: (u, ink) => <>
    <Draw d="M300 250 C240 120 420 60 500 130 C560 50 760 70 760 190 C860 200 860 340 760 350 C700 420 500 430 440 360 C340 400 250 340 300 250 Z" p={k(u, 0, 0.7)} c={ink} w={9} />
    {[0, 1, 2].map((i) => <circle key={i} cx={300 - i * 50} cy={440 + i * 40} r={(22 - i * 6) * pp(u, 0.3 + i * 0.1)} fill="none" stroke={ink} strokeWidth={8} />)}
    <T x={540} y={240} s={110} c={RED} sc={pp(u, 0.35)}>IMAGINE…</T></> },
  { a: 3.6, bg: "paper", r: (u, ink) => <>{two(ink, pp(u, 0))}<T x={540} y={110} s={70} c={ink} sc={pp(u, 0.1)}>2 PERSONNES</T></> },
  { a: 4.25, bg: "dark", r: (u, ink) => <><circle cx={540} cy={330} r={260 * k(u, 0, 0.25)} fill={RED} opacity={0.22} /><Person x={540} y={520} s={1.5} ink={ink} col={RED} label="A" wave={Math.sin(u * 12) * 0.5 + 0.5} sc={pp(u, 0)} /></> },
  { a: 4.97, bg: "blue", r: (u, ink) => <><circle cx={540} cy={330} r={260 * k(u, 0, 0.25)} fill="#fff" opacity={0.12} /><Person x={540} y={520} s={1.5} ink={ink} col={BLUE} label="B" wave={Math.sin(u * 12) * 0.5 + 0.5} sc={pp(u, 0)} /></> },
  { a: 5.79, bg: "paper", r: (u, ink) => { const d = k(u, 1.9, 0.35); return <>
    <Person x={330} y={PY} ink={ink} col={RED} label="A" /><Basket x={620} y={470} s={1.5} ink={ink} fill="#f1d9a8" />
    <Apple x={620} y={-60 + d * 490 - Math.sin(sat((u - 2.25) / 0.3) * Math.PI) * 26} r={52} rot={(1 - d) * -120} />
    <T x={850} y={170} s={64} c={RED} sc={pp(u, 2.2)} rot={-6}>1 POMME</T></>; } },
  { a: 8.35, bg: "dark", r: (u, ink) => <>
    <Basket x={540} y={390} s={2.3} ink={ink} /><Apple x={540} y={330 + Math.sin(u * 4) * 6} r={86} glow />
    <T x={200} y={130} s={54} c="#9aa0b5" sc={k(u, 0.1)}>dans son panier</T></> },
  { a: 10.01, bg: "paper", r: (u, ink) => <>
    <Person x={330} y={PY} ink={ink} col={BLUE} label="B" sc={pp(u, 0)} /><Basket x={640} y={470} s={1.5} ink={ink} fill="#f1d9a8" />
    <T x={640} y={250} s={150} c={ink} f="KaTeX_Main" sc={pp(u, 1.3)}>∅</T></> },
  { a: 11.55, bg: "dark", r: (u, ink) => <>
    <Basket x={540} y={400} s={2.3} ink={ink} /><T x={540} y={150} s={130} c={RED} sc={pp(u, 0.05)} rot={-4}>VIDE</T>
    <T x={540} y={400} s={90} c="#9aa0b5" f="KaTeX_Main" sc={pp(u, 0.2)}>0</T></> },
  { a: 12.33, bg: "dark", r: (u) => { const c = k(u, 1.05, 0.3); return <>
    <Apple x={540} y={320} r={150} glow rot={Math.sin(u * 3) * 4} />
    <Draw d="M540 90 V550" p={c} c="#fff" w={10} dash="22 18" /><path d={`M${520} ${90 + c * 430} l40 0 l-20 46 z`} fill="#fff" opacity={c > 0 && c < 1 ? 1 : 0} />
    <T x={220} y={150} s={60} c="#fff" sc={pp(u, 1.05)} rot={-6}>couper</T><T x={860} y={480} s={70} c={YEL} f="KaTeX_Main" sc={pp(u, 1.7)}>÷ 2</T></>; } },
  { a: 14.41, bg: "paper", r: (u, ink) => <>{two(ink)}<Apple x={AX + 120} y={420} r={34} />
    <Draw d={arc(AX + 150, 330, BX - 150, 330, 190)} p={k(u, 0.3, 0.9)} c={RED} w={10} dash="26 20" />
    <T x={540} y={110} s={110} c={RED} sc={pp(u, 0.5)}>→ B ?</T></> },
  { a: 16.59, bg: "red", r: (u) => <><T x={540} y={250} s={200} c="#fff" sc={pp(u, 0)} rot={-4}>ACTION</T><T x={540} y={450} s={60} c="#ffd9d9" sc={k(u, 0.2)}>c'est ce qu'elle va faire</T></> },
  { a: 17.45, bg: "paper", r: (u, ink) => { const l = k(u, 0.15, 0.45); return <>
    <Basket x={540} y={470} s={1.6} ink={ink} fill="#f1d9a8" /><Apple x={540} y={430 - l * 230} r={62} rot={l * 20} />
    <Draw d="M440 150 q100 -70 200 0" p={l} c={ink} w={8} /><T x={170} y={110} s={70} c={RED}>1.</T><T x={320} y={110} s={70} c={ink} sc={pp(u, 0.1)}>PRENDRE</T></>; } },
  { a: 18.29, bg: "dark", r: (u) => { const s = k(u, 0.12, 0.3); return <>
    <rect x={0} y={0} width={1080} height={608} fill="#fff" opacity={sat(1 - Math.abs(u - 0.15) * 9) * 0.7} />
    <Half x={540 - 14 - s * 120} y={320} r={130} side={1} rot={-s * 14} glow /><Half x={540 + 14 + s * 120} y={320} r={130} side={-1} rot={s * 14} glow />
    <T x={150} y={110} s={70} c={RED}>2.</T><T x={290} y={110} s={70} c="#fff" sc={pp(u, 0.1)}>COUPER</T></>; } },
  { a: 19.3, bg: "paper", r: (u, ink) => { const p = k(u, 0.75, 1.0), [x, y] = onArc(AX + 130, 400, BX - 130, 400, 260, p); return <>
    {two(ink)}<Draw d={arc(AX + 130, 400, BX - 130, 400, 260)} p={k(u, 0.2, 0.6)} c={RED} w={8} dash="22 18" />
    <Half x={x - 22} y={y} r={44} side={1} rot={p * 360} /><Half x={x + 22} y={y} r={44} side={-1} rot={p * 360} />
    <T x={410} y={560} s={64} c={RED}>3.</T><T x={570} y={560} s={64} c={ink} sc={pp(u, 0.1)}>DONNER</T></>; } },
  { a: 21.39, bg: "paper", r: (u, ink) => <>
    <Person x={330} y={PY} ink={ink} col={BLUE} label="B" wave={1} /><Basket x={640} y={470} s={1.5} ink={ink} fill="#f1d9a8" />
    <Half x={604} y={404} r={46} side={1} rot={-12} /><Half x={676} y={404} r={46} side={-1} rot={12} />
    <T x={860} y={170} s={64} c={BLUE} sc={pp(u, 1.3)} rot={6}>POUR B !</T></> },
  { a: 23.2, bg: "dark", r: (u) => <>
    <Half x={300} y={300} r={110} side={1} glow /><T x={470} y={300} s={130} c="#fff" f="KaTeX_Main" sc={pp(u, 0.1)}>+</T><Half x={640} y={300} r={110} side={-1} glow />
    <T x={850} y={300} s={130} c={YEL} f="KaTeX_Main" sc={pp(u, 0.75)}>= 1</T><T x={540} y={520} s={56} c="#9aa0b5" sc={k(u, 0.4)}>une pomme coupée en deux</T></> },
  { a: 24.83, bg: "paper", r: (u, ink) => { const p = k(u, 0.3, 0.55); return <>
    {two(ink)}<Draw d={arc(AX + 110, 300, BX - 130, 300, 150)} p={p} c={RED} w={22} /><Head x={BX - 122} y={296} p={p} c={RED} a={52} />
    <T x={540} y={110} s={70} c={RED} sc={pp(u, 0.5)} rot={-3}>CETTE FLÈCHE</T></>; } },
  { a: 26.3, bg: "dark", r: (u) => <>
    {"APPLICATION".split("").map((ch, i) => <T key={i} x={128 + i * 82.5} y={300} s={150} c={i % 2 ? "#fff" : "#fff"} sc={pp(u, 0.2 + i * 0.03)}>{ch}</T>)}
    <Draw d="M90 410 H990" p={k(u, 0.6, 0.35)} c={RED} w={16} glow /></> },
  { a: 27.39, bg: "blue", r: (u, ink) => { const s1 = u > 1.2, s2 = u > 3.2; return <>
    <g opacity={s1 || s2 ? 0.45 : 1}><Apple x={180} y={300} r={74} /></g><Draw d="M290 300 H420" p={k(u, 0.5)} c={ink} w={10} /><Head x={430} y={300} p={k(u, 0.5)} c={ink} />
    <g opacity={s2 ? 0.45 : 1} transform={`translate(540 300) scale(${s1 ? 1.15 : 1})`}><Half x={-44} y={0} r={66} side={1} /><Half x={44} y={0} r={66} side={-1} /></g>
    <Draw d="M650 300 H780" p={k(u, 2.6)} c={ink} w={10} /><Head x={790} y={300} p={k(u, 2.6)} c={ink} />
    <g transform={`translate(900 310) scale(${s2 ? 1.2 : 1})`}><Basket x={0} y={0} s={1.2} ink={ink} /><circle cx={56} cy={-110} r={28} fill={BLUE} stroke="#fff" strokeWidth={4} /><text x={56} y={-108} fontFamily="Anton" fontSize={34} fill="#fff" textAnchor="middle" dominantBaseline="central">B</text></g>
    <T x={540} y={540} s={60} c={YEL} sc={pp(u, 0.1)}>{s2 ? "…PUIS DONNER" : s1 ? "COUPER…" : "LE GESTE"}</T></>; } },
  { a: 31.59, bg: "dark", r: (u) => <>
    <T x={540} y={270} s={230} c="#fff" f="KaTeX_Main" sc={pp(u, 0.1)} glow={BLUE}>f : A → B</T>
    <rect x={250} y={440} width={580 * k(u, 0.8, 0.3)} height={86} rx={16} fill={RED} /><T x={540} y={484} s={60} c="#fff" sc={k(u, 0.9, 0.2)}>une application</T></> },
  { a: 33.49, bg: "paper", r: (u, ink) => <>
    {[0, 1, 2].map((i) => <g key={i} transform={`translate(${250 + i * 290} ${360}) scale(${pp(u, 0.1 + i * 0.15)})`}>
      <circle cx={0} cy={0} r={70} fill="none" stroke={ink} strokeWidth={9} /><path d="M-46 -8 h34 v24 h-34 z M12 -8 h34 v24 h-34 z M-12 2 h24" fill="none" stroke={ink} strokeWidth={7} />
      <path d="M-22 38 q22 14 44 0" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
      <g transform={`translate(0 ${-150 - Math.sin(u * 5 + i) * 8})`} opacity={k(u, 1.5 + i * 0.2)}><circle r={34} fill={YEL} /><rect x={-14} y={30} width={28} height={18} rx={4} fill={ink} /></g></g>)}
    <T x={540} y={540} s={64} c={RED} sc={pp(u, 1.5)}>LES MATHÉMATICIENS</T></> },
  { a: 36.2, bg: "dark", r: (u) => <>
    {["x ∈ E", "A ∪ B", "A ∩ B", "∀x ∃y", "E × F", "∅ ⊂ E", "f(x) = y", "A ⊆ B"].map((s, i) => <T key={s} x={180 + (i % 3) * 360} y={640 - ((u * 190 + i * 150) % 760)} s={78} c={i % 3 === 1 ? YEL : "#e9ecff"} f="KaTeX_Main">{s}</T>)}</> },
  { a: 37.3, bg: "paper", r: (u, ink) => <>
    <Ell cx={420} cy={320} rx={250} ry={190} p={k(u, 0, 0.5)} c={RED} fill="#ff2d2d22" /><Ell cx={660} cy={320} rx={250} ry={190} p={k(u, 0.2, 0.5)} c={BLUE} fill="#2f7bff22" />
    {[[300, 280], [360, 400], [540, 320], [720, 260], [770, 390]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={15 * pp(u, 0.5 + i * 0.07)} fill={ink} />)}
    <T x={540} y={70} s={64} c={ink} sc={pp(u, 0.4)}>THÉORIE DES ENSEMBLES</T></> },
  { a: 38.73, bg: "dark", r: (u) => <>
    <Gear x={390} y={320} r={150} a={u * 90} c="#e9ecff" n={12} /><Gear x={705} y={250} r={105} a={-u * 128 + 14} c={RED} n={9} /><Gear x={760} y={470} r={70} a={u * 190} c={YEL} n={7} />
    <T x={390} y={320} s={90} c="#fff" f="KaTeX_Main">π</T></> },
  { a: 40.3, bg: "paper", r: (u, ink) => <>
    {["+", "−", "×", "÷"].map((s, i) => { const on = Math.floor(u * 6) % 4 === i; return <g key={s}><rect x={110 + i * 225} y={190} width={190} height={190} rx={34} fill={on ? RED : "none"} stroke={ink} strokeWidth={9} />
      <T x={205 + i * 225} y={285} s={150} c={on ? "#fff" : ink} f="KaTeX_Main">{s}</T></g>; })}
    <T x={540} y={500} s={60} c={ink} sc={pp(u, 0.1)}>COMMENT ÇA MARCHE ?</T></> },
  { a: 41.93, bg: "paper", r: (u, ink) => <>
    <Ell cx={540} cy={330} rx={300} ry={215} p={k(u, 0.3, 0.9)} c={RED} fill="#ff2d2d18" />
    {[[420, 260], [600, 230], [690, 350], [520, 400], [400, 380]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={17 * pp(u, 2.3 + i * 0.12)} fill={ink} />)}
    <T x={540} y={62} s={62} c={ink} sc={pp(u, 3.2)}>ENSEMBLE DE DÉPART</T><T x={880} y={170} s={120} c={RED} f="KaTeX_Math" it sc={pp(u, 1.2)}>E</T></> },
  { a: 45.75, bg: "dark", r: (u) => <>
    {[["x₁", 250, 230], ["x₂", 540, 380], ["x₃", 820, 220]].map(([s, x, y], i) => <g key={i} transform={`translate(${x} ${y}) scale(${pp(u, 0.05 + i * 0.12)})`}>
      <circle r={62} fill="none" stroke={YEL} strokeWidth={8} style={{ filter: `drop-shadow(0 0 14px ${YEL})` }} /><text fontFamily="KaTeX_Math" fontStyle="italic" fontSize={70} fill="#fff" textAnchor="middle" dominantBaseline="central">{s}</text></g>)}
    <T x={540} y={540} s={56} c="#9aa0b5" sc={k(u, 0.3)}>des éléments</T></> },
  { a: 46.69, bg: "dark", r: (u) => <><T x={540} y={290} s={460} c="#fff" f="KaTeX_AMS" sc={pp(u, 0.9)} glow={RED}>ℝ</T><T x={540} y={545} s={58} c={RED} sc={pp(u, 1.1)}>LES RÉELS</T>
    {u < 0.9 && <T x={540} y={300} s={90} c="#9aa0b5" sc={k(u, 0.05)}>par exemple…</T>}</> },
  { a: 48.53, bg: "paper", r: (u, ink) => <><T x={540} y={290} s={460} c={ink} f="KaTeX_AMS" sc={pp(u, 0)}>ℕ</T><T x={540} y={545} s={58} c={RED} sc={pp(u, 0.1)}>LES ENTIERS</T></> },
  { a: 49.13, bg: "blue", r: (u, ink) => <><T x={540} y={290} s={460} c={ink} f="KaTeX_AMS" sc={pp(u, 0)}>ℤ</T>
    {u > 0.45 && ["ℚ", "ℂ", "…"].map((s, i) => <T key={s} x={170 + i * 370} y={i === 1 ? 110 : 500} s={120} c={YEL} f="KaTeX_AMS" sc={pp(u, 0.45 + i * 0.1)}>{s}</T>)}</> },
  { a: 50.29, bg: "paper", r: (u, ink) => { const p = k(u, 0.6, 0.7); return <>
    <Ell cx={260} cy={320} rx={190} ry={215} p={1} c={RED} fill="#ff2d2d18" /><Ell cx={820} cy={320} rx={190} ry={215} p={k(u, 1.3, 0.7)} c={BLUE} fill="#2f7bff18" />
    {[230, 320, 410].map((y, i) => <g key={y}><circle cx={270} cy={y} r={15} fill={ink} /><Draw d={`M300 ${y} C460 ${y - 70} 620 ${y + 40 - i * 40} 770 ${y + (i - 1) * -20}`} p={k(u, 0.5 + i * 0.25, 0.6)} c={ink} w={7} />
      <circle cx={800} cy={y + (i - 1) * -20} r={15 * pp(u, 1.1 + i * 0.25)} fill={ink} /></g>)}
    <T x={260} y={62} s={54} c={RED}>DÉPART</T><T x={820} y={62} s={54} c={BLUE} sc={pp(u, 2.2)}>ARRIVÉE</T><g opacity={p * 0}></g></>; } },
  { a: 53.21, bg: "dark", r: (u) => <>
    <T x={300} y={300} s={330} c="#fff" f="KaTeX_AMS" sc={pp(u, 0.8)} glow={BLUE}>ℕ</T><T x={780} y={300} s={330} c="#fff" f="KaTeX_AMS" sc={pp(u, 1.35)} glow={RED}>ℝ</T>
    <T x={540} y={550} s={52} c="#9aa0b5" sc={k(u, 0.1)}>l'ensemble d'arrivée</T></> },
  { a: 55.5, bg: "red", r: (u) => <><T x={540} y={270} s={420} c="#fff" f="KaTeX_Math" it sc={pp(u, 0.15)} rot={-4}>f</T><T x={540} y={530} s={64} c="#ffd9d9" sc={pp(u, 0.9)}>UNE FONCTION</T></> },
  { a: 57.01, bg: "paper", r: (u, ink) => { const p = k(u, 1.0, 0.7); return <>
    <rect x={400} y={190} width={280} height={240} rx={30} fill={ink} /><T x={540} y={305} s={170} c="#fff" f="KaTeX_Math" it>f</T>
    <Draw d="M90 310 H380" p={k(u, 0.2, 0.5)} c={ink} w={9} /><Head x={392} y={310} p={k(u, 0.2, 0.5)} c={ink} /><Draw d="M700 310 H960" p={1} c={ink} w={9} dash="16 16" />
    <g transform={`translate(${120 + p * 240} 250)`} opacity={p < 1 ? 1 : 0}><circle r={48} fill={RED} /><text fontFamily="KaTeX_Math" fontStyle="italic" fontSize={70} fill="#fff" textAnchor="middle" dominantBaseline="central">x</text></g>
    <T x={220} y={520} s={56} c={RED} sc={pp(u, 0.9)}>une variable x</T></>; } },
  { a: 59.29, bg: "dark", r: (u) => { const p = k(u, 1.5, 0.6); return <>
    <rect x={150} y={180} width={300} height={250} rx={30} fill="none" stroke="#fff" strokeWidth={9} /><T x={300} y={302} s={180} c="#fff" f="KaTeX_Math" it>f</T>
    {[0, 1, 2].map((i) => <circle key={i} cx={300 + Math.cos(u * 9 + i * 2.1) * 190} cy={305 + Math.sin(u * 9 + i * 2.1) * 160} r={9} fill={YEL} />)}
    <Draw d="M470 305 H640" p={p} c={YEL} w={10} glow /><Head x={652} y={305} p={p} c={YEL} />
    <T x={850} y={300} s={150} c={YEL} f="KaTeX_Math" it sc={pp(u, 1.7)} glow={YEL}>f(x)</T></>; } },
  { a: 61.69, bg: "paper", r: (u, ink) => { const p = k(u, 0.25, 1.1), xs = 620, ys = 213; return <>
    <Draw d="M160 520 H960 M220 570 V60" p={k(u, 0, 0.35)} c={ink} w={8} />
    <Draw d="M220 500 C420 490 540 380 660 180 C690 130 720 100 760 70" p={p} c={RED} w={12} />
    <Draw d={`M${xs} 520 V${ys}`} p={k(u, 1.3, 0.3)} c={BLUE} w={6} dash="12 12" /><Draw d={`M${xs} ${ys} H220`} p={k(u, 1.55, 0.3)} c={BLUE} w={6} dash="12 12" />
    <circle cx={xs} cy={ys} r={16 * pp(u, 1.35)} fill={BLUE} /><T x={xs} y={565} s={64} c={ink} f="KaTeX_Math" it sc={pp(u, 1.3)}>x</T><T x={130} y={ys} s={58} c={ink} f="KaTeX_Math" it sc={pp(u, 1.6)}>f(x)</T></>; } },
  { a: 63.3, bg: "dark", r: (u) => { const n = Math.min(4, 1 + Math.floor(u * 3)); return <>
    <T x={270} y={290} s={230} c="#fff" f="KaTeX_Main" sc={pp(u, 0)}>{n}</T><Draw d="M420 300 H640" p={1} c={RED} w={14} glow /><Head x={654} y={300} p={1} c={RED} />
    <T x={850} y={290} s={230} c={YEL} f="KaTeX_Main" glow={YEL}>{n * n}</T><T x={530} y={235} s={64} c={RED} f="KaTeX_Math" it>f</T>
    <T x={540} y={540} s={54} c="#9aa0b5">elle change la variable</T></>; } },
  { a: 64.9, bg: "dark", r: (u) => <>
    {Array.from({ length: 14 }).map((_, i) => <Draw key={i} d={`M540 304 L${540 + Math.cos(i * 0.449) * 900} ${304 + Math.sin(i * 0.449) * 900}`} p={k(u, 0, 0.5)} c={i % 2 ? RED : "#28324f"} w={3} />)}
    <rect x={250} y={170} width={580} height={180} rx={30} fill={RED} transform={`rotate(-3 540 260) scale(${pp(u, 0.1)})`} style={{ transformOrigin: "540px 260px" }} />
    <T x={540} y={262} s={130} c="#fff" sc={pp(u, 0.1)} rot={-3}>ABONNE-TOI</T><T x={540} y={450} s={58} c="#e9ecff" sc={pp(u, 0.6)}>pour la suite des maths ↗</T></> },
];

const Paper: React.FC = () => (
  <svg width={1080} height={608} style={{ position: "absolute", inset: 0 }}>
    <rect width={1080} height={608} fill="#f3f1ea" />
    {Array.from({ length: 28 }).map((_, i) => <line key={`v${i}`} x1={i * 40} x2={i * 40} y1={0} y2={608} stroke="#9bb4d6" strokeWidth={i % 5 ? 1 : 2.4} opacity={0.5} />)}
    {Array.from({ length: 16 }).map((_, i) => <line key={`h${i}`} y1={i * 40 + 4} y2={i * 40 + 4} x1={0} x2={1080} stroke="#9bb4d6" strokeWidth={i % 5 ? 1 : 2.4} opacity={0.5} />)}
  </svg>
);
const BG: Record<Bg, React.ReactNode> = {
  paper: <Paper />,
  dark: <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, #1b1d2e 0%, #07070c 75%)" }} />,
  blue: <div style={{ position: "absolute", inset: 0, background: "#0f3fa8", backgroundImage: "linear-gradient(#ffffff22 2px, transparent 2px), linear-gradient(90deg, #ffffff22 2px, transparent 2px)", backgroundSize: "54px 54px" }} />,
  red: <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 45%, #ff4a4a 0%, #c70f0f 80%)` }} />,
};

const Strip: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  let i = 0; for (let j = 0; j < CLIPS.length; j++) if (t >= CLIPS[j].a) i = j;
  const c = CLIPS[i], u = t - c.a, dur = (CLIPS[i + 1]?.a ?? 67.6) - c.a;
  const punch = 1.14 - 0.14 * eo(u / 0.22) + 0.045 * (u / dur);
  const dir = i % 2 ? 1 : -1, sx = (1 - eo(u / 0.18)) * 26 * dir;
  return (
    <div style={{ position: "absolute", left: 0, top: 640, width: 1080, height: 608, overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${sx}px) scale(${punch}) rotate(${(1 - eo(u / 0.2)) * 1.2 * dir}deg)` }}>
        {BG[c.bg]}
        <svg width={1080} height={608} viewBox="0 0 1080 608" style={{ position: "absolute", inset: 0 }}>{c.r(u, INK[c.bg])}</svg>
      </div>
      {/* cut flash + scanline + vignette */}
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: sat(1 - u * 11) * 0.75 }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(0,0,0,0.45)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: ((f * 9) % 700) - 60, height: 60, background: "linear-gradient(transparent, rgba(255,255,255,0.05), transparent)" }} />
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
      {CLIPS.slice(1).map((c, i) => <Sfx key={i} at={c.a - 0.03} src={i % 3 === 0 ? "whoosh" : i % 3 === 1 ? "swipe" : "tick"} v={i % 3 === 2 ? 0.28 : 0.2} />)}
      {[7.75, 18.4, 26.5, 32.4, 55.65, 60.99, 65.0].map((x) => <Sfx key={`b${x}`} at={x} src="bass" v={0.35} />)}
      {[4.3, 5.0, 11.3, 20.9, 25.4, 47.6, 54.0, 54.6, 63.0].map((x) => <Sfx key={`p${x}`} at={x} src="pop" v={0.25} />)}
    </AbsoluteFill>
  );
};
