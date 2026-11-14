// "Les séries numériques" — silent explainer (music + SFX + French subtitles). Same look as the POV montage:
// black vivid ground, one image per idea, living characters, travelling camera, hand-drawn marks.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { Mark, Squig } from "../cx/clips";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
export const SERIES_FRAMES = fr(84.5);
const CYAN = "#28e0ff", PUR = "#9b5cff", RED = "#ff2d2d", BLUE = "#2f7bff", YEL = "#ffd23f", GRN = "#27c26c";
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
const Person: React.FC<{ x: number; y: number; s?: number; ink: string; col: string; label: string; wave?: number; sc?: number; t?: number; look?: number; skin?: string; hair?: string; glasses?: boolean; pants?: string }> = ({
  x, y, s = 1, col, label, wave = 0, sc = 1, t = 0, look = 0, skin = "#f2c29b", hair = "#2b1a10", glasses, pants = "#3b4270" }) => {
  const blink = (t * 1.3 + x * 0.01) % 3.1 < 0.12 ? 0.12 : 1, bob = Math.sin(t * 2.2 + x) * 2.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sc})`}>
      <ellipse cx={0} cy={66} rx={52} ry={9} fill="#000" opacity={0.35} />
      {/* legs + shoes */}
      <rect x={-27} y={-24} width={22} height={84} rx={10} fill={pants} /><rect x={5} y={-24} width={22} height={84} rx={10} fill={pants} />
      <ellipse cx={-19} cy={60} rx={19} ry={9} fill="#f3f5ff" /><ellipse cx={19} cy={60} rx={19} ry={9} fill="#f3f5ff" />
      <g transform={`translate(0 ${bob})`}>
        {/* arms (behind / in front of the shirt) */}
        <path d={`M-30 -96 L-50 -38`} stroke={col} strokeWidth={18} strokeLinecap="round" /><circle cx={-51} cy={-32} r={10} fill={skin} />
        <rect x={-34} y={-116} width={68} height={104} rx={24} fill={col} /><path d="M-34 -40 h68" stroke="#000" strokeOpacity={0.14} strokeWidth={10} />
        <path d="M-12 -116 L0 -100 L12 -116" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" />
        <path d={`M30 -96 L${50 + wave * 6} ${-44 - wave * 74}`} stroke={col} strokeWidth={18} strokeLinecap="round" /><circle cx={51 + wave * 7} cy={-38 - wave * 80} r={10} fill={skin} />
        {/* head */}
        <rect x={-9} y={-128} width={18} height={18} fill={skin} /><circle cx={0} cy={-152} r={36} fill={skin} />
        <path d="M-37 -154 Q-38 -194 0 -192 Q40 -194 37 -152 Q26 -176 0 -174 Q-24 -176 -37 -154 Z" fill={hair} />
        <g transform={`translate(${look * 5} 0)`}>
          <ellipse cx={-13} cy={-150} rx={4.6} ry={6.2 * blink} fill="#14101f" /><ellipse cx={13} cy={-150} rx={4.6} ry={6.2 * blink} fill="#14101f" />
          <circle cx={-11.5} cy={-152.5} r={1.5} fill="#fff" opacity={blink} /><circle cx={14.5} cy={-152.5} r={1.5} fill="#fff" opacity={blink} />
          {glasses && <path d="M-25 -158 h20 v15 h-20 z M5 -158 h20 v15 h-20 z M-5 -151 h10" fill="#ffffff22" stroke="#14101f" strokeWidth={3.5} />}
          <path d="M-11 -134 Q0 -124 11 -134" fill="none" stroke="#14101f" strokeWidth={3.6} strokeLinecap="round" />
          <circle cx={-23} cy={-138} r={6} fill="#ff6b9a" opacity={0.4} /><circle cx={23} cy={-138} r={6} fill="#ff6b9a" opacity={0.4} />
        </g>
        {label && <><circle cx={0} cy={-234} r={27} fill={col} stroke="#fff" strokeWidth={4} style={{ filter: `drop-shadow(0 0 12px ${col})` }} /><text x={0} y={-232} fontFamily="Anton" fontSize={34} fill="#fff" textAnchor="middle" dominantBaseline="central">{label}</text></>}
      </g>
    </g>
  );
};
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
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} fillOpacity={p} stroke={c} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
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
const soft = (z: number) => (1 + (z - 1) * 0.34) * 0.86;   // keep the drawings small: the camera only leans in
const INKC = "#ffffff", DIM = "#a9b0d6";
const Chip: React.FC<{ x: number; y: number; text: string; c?: string; fg?: string; sc?: number; s?: number }> = ({ x, y, text, c = RED, fg = "#fff", sc = 1, s = 30 }) => {
  const w = text.length * s * 0.5 + s * 1.1; return sc <= 0.001 ? null : <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-w / 2} y={-s * 0.72} width={w} height={s * 1.44} rx={s * 0.42} fill={c} /><T x={0} y={1} s={s} c={fg}>{text}</T></g>;
};
/* ---------- scenes: one dark image per idea, everything animates inside it ---------- */
const sub = (b: string, i: string) => <>{b}<tspan dy="0.28em" fontSize="62%">{i}</tspan><tspan dy="-0.28em" fontSize="1%"> </tspan></>;
const Tick: React.FC<{ x: number; y: number; ok: boolean; sc: number; s?: number }> = ({ x, y, ok, sc, s = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc * s})`}><circle r={22} fill={ok ? GRN : RED} style={{ filter: `drop-shadow(0 0 10px ${ok ? GRN : RED})` }} />
    <path d={ok ? "M-10 1 L-3 9 L11 -8" : "M-9 -9 L9 9 M9 -9 L-9 9"} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></g>);
const Axes: React.FC<{ ox: number; oy: number; w: number; h: number; p: number; xl?: string; yl?: React.ReactNode }> = ({ ox, oy, w, h, p, xl = "n", yl }) => <>
  <Draw d={`M${ox} ${oy} H${ox + w}`} p={p} c={INKC} w={4} /><Draw d={`M${ox} ${oy} V${oy - h}`} p={p} c={INKC} w={4} />
  <Head x={ox + w + 4} y={oy} p={p} c={INKC} s={0.45} /><Head x={ox} y={oy - h - 4} p={p} c={INKC} s={0.45} a={-90} />
  <T x={ox + w + 26} y={oy + 4} s={30} c={DIM} f="KaTeX_Math" it sc={p}>{xl}</T>{yl ? <T x={ox - 4} y={oy - h - 30} s={30} c={DIM} f="KaTeX_Math" it sc={p}>{yl}</T> : null}</>;

/* 0 — hook */
const Hook = (t: number) => <>
  <Person x={200} y={470} s={0.8} ink={INKC} col={PUR} label="" t={t} look={1} hair="#1d1420" sc={pp(t, 0.2)} wave={t > 2.2 ? Math.sin(t * 6) * 0.3 + 0.6 : 0} />
  <T x={640} y={230} s={62} c={INKC} f="KaTeX_Main" sc={pp(t, 0.9)}>1/2 + 1/4 + 1/8 + ⋯</T>
  <T x={640} y={330} s={120} c={YEL} f="KaTeX_Main" sc={pp(t, 2.3)} glow={YEL}>= ?</T>
  <T x={930} y={150} s={90} c={RED} f="KaTeX_Main" sc={pp(t, 1.5)} rot={Math.sin(t * 2) * 8}>∞</T>
  <Mark x={640} y={232} rx={330} ry={58} p={k(t, 3.2, 0.5)} c={RED} w={6} seed={2} /></>;

/* 1 — a sequence, its partial sums, the series */
const UH = [92, 60, 76, 42, 56, 30];
const Def = (t: number) => { let acc = 0; return <>
  <Person x={130} y={500} s={0.72} ink={INKC} col={RED} label="" t={t} look={1} hair="#1d1420" sc={pp(t, 5.2)} wave={t > 9.6 && t < 14.2 ? 1 : 0} />
  <line x1={250} y1={300} x2={690} y2={300} stroke="#fff" strokeOpacity={0.25} strokeWidth={3} /><line x1={800} y1={520} x2={960} y2={520} stroke="#fff" strokeOpacity={0.25} strokeWidth={3} />
  {UH.map((h, i) => { const at = 5.8 + i * 0.42, mv = sm((t - (9.9 + i * 0.68)) / 0.55), x0 = 290 + i * 70, y0 = 300 - h, y1 = 520 - acc - h; acc += h; const col = [RED, BLUE, YEL, GRN, PUR, CYAN][i];
    return <g key={i}><rect x={x0 - 22} y={300 - h * k(t, at, 0.3)} width={44} height={h * k(t, at, 0.3)} rx={7} fill={col} opacity={0.35 + 0.65 * (1 - mv)} />
      <T x={x0} y={328} s={30} c={INKC} f="KaTeX_Math" it sc={pp(t, at + 0.1)}>{sub("u", String(i))}</T>
      {mv > 0 && <rect x={x0 - 22 + (880 - 34 - (x0 - 22)) * mv} y={y0 + (y1 - y0) * mv} width={44 + 24 * mv} height={h} rx={7} fill={col} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />}</g>; })}
  <T x={730} y={300} s={44} c={DIM} f="KaTeX_Main" sc={pp(t, 8.4)}>⋯</T>
  {(() => { const n = Math.min(5, Math.floor((t - 10.35) / 0.68)); return n >= 0 ? <T x={990} y={300} s={56} c={YEL} f="KaTeX_Math" it sc={pp(t, 10.35 + n * 0.68, 0.2)} anchor="start">{sub("S", String(n))}</T> : null; })()}
  <T x={540} y={585} s={46} c={INKC} f="KaTeX_Math" it sc={pp(t, 11.6)}>{sub("S", "n")}{"\u00a0=\u00a0"}{sub("u", "0")}{"\u00a0+\u00a0"}{sub("u", "1")}{"\u00a0+ ⋯ +\u00a0"}{sub("u", "n")}</T>
  <T x={880} y={110} s={84} c={INKC} f="KaTeX_Main" sc={pp(t, 14.6)} glow={PUR}>Σ <tspan fontFamily="KaTeX_Math" fontStyle="italic">{sub("u", "n")}</tspan></T>
  <Chip x={880} y={185} text="la série" c={PUR} sc={pp(t, 15.3)} s={28} /><T x={640} y={110} s={34} c={DIM} f="KaTeX_Math" it sc={pp(t, 16.4)}>n → +∞</T></>; };
const DEF_CAM: Key[] = [[5, 540, 320, 1.02], [6, 470, 300, 1.5], [9.3, 480, 300, 1.55], [10.2, 780, 400, 1.5], [14.2, 800, 400, 1.55], [15, 700, 300, 1.25], [17, 600, 330, 1.05], [19, 560, 330, 1.08]];

/* 2 — 1/2 + 1/4 + 1/8 + … : the square fills up, the curve climbs to 1, definition of convergence */
const SQ: [number, number, number, number, string][] = [[130, 180, 120, 240, "1/2"], [250, 180, 120, 120, "1/4"], [250, 300, 60, 120, "1/8"], [310, 300, 60, 60, ""], [310, 360, 30, 60, ""], [340, 360, 30, 30, ""], [340, 390, 15, 30, ""], [355, 390, 15, 15, ""]];
const GX = (n: number) => 600 + n * 44, GY = (s: number) => 440 - s * 230;
const Geo = (t: number) => { const filled = SQ.filter((_, i) => t >= 20.2 + (i < 4 ? i * 0.95 : 3.3 + (i - 3) * 0.55)).length, S = 1 - 1 / 2 ** filled, band = 60 - 46 * sm((t - 37.2) / 4), dn = 1 + Math.min(7, Math.floor(Math.max(0, t - 39) / 0.6));
  return <>
    <T x={250} y={110} s={48} c={INKC} f="KaTeX_Main" sc={pp(t, 19.3)}>1/2 + 1/4 + 1/8 + ⋯</T><T x={520} y={110} s={56} c={YEL} f="KaTeX_Main" sc={pp(t, 33.4)} glow={YEL}>= 1</T>
    <rect x={130} y={180} width={240} height={240} fill="none" stroke={INKC} strokeWidth={4} opacity={k(t, 19.6)} />
    {SQ.map(([x, y, w, h, lab], i) => { const at = 20.2 + (i < 4 ? i * 0.95 : 3.3 + (i - 3) * 0.55), p = pp(t, at, 0.3), col = [RED, BLUE, YEL, GRN, PUR, CYAN, RED, BLUE][i];
      return p > 0 ? <g key={i}><rect x={x + (w * (1 - p)) / 2} y={y + (h * (1 - p)) / 2} width={w * p} height={h * p} fill={col} opacity={0.9} stroke="#050506" strokeWidth={3} />{lab ? <T x={x + w / 2} y={y + h / 2} s={i ? 28 : 40} c="#fff" f="KaTeX_Main" sc={p}>{lab}</T> : null}</g> : null; })}
    {filled > 0 && <T x={250} y={470} s={40} c={YEL} f="KaTeX_Math" it>{sub("S", String(filled))} = {S.toFixed(Math.min(4, filled)).replace(".", ",")}</T>}
    <Person x={470} y={500} s={0.6} ink={INKC} col={BLUE} label="" t={t} look={t < 28 ? -1 : 1} skin="#c98a5e" hair="#5a3418" pants="#4a2f6b" sc={pp(t, 19.5)} wave={t > 33.2 ? Math.sin(t * 9) * 0.4 + 0.6 : t > 28 ? 0.7 : 0} />
    <Axes ox={600} oy={440} w={400} h={270} p={k(t, 27.6, 0.5)} yl={sub("S", "n")} />
    <Draw d={`M600 ${GY(1)} H1000`} p={k(t, 30.6, 0.6)} c={YEL} w={4} dash="12 10" /><T x={578} y={GY(1)} s={32} c={YEL} f="KaTeX_Main" sc={pp(t, 30.8)}>1</T>
    {t > 37 && <rect x={604} y={GY(1) - band} width={396} height={band * 2} fill={YEL} opacity={0.13} />}
    <Draw d={"M" + Array.from({ length: 8 }).map((_, i) => `${GX(i + 1)} ${GY(1 - 1 / 2 ** (i + 1))}`).join(" L")} p={k(t, 28.4, 3.0)} c={RED} w={5} glow />
    {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={GX(i + 1)} cy={GY(1 - 1 / 2 ** (i + 1))} r={8 * pp(t, 28.4 + i * 0.38)} fill="#fff" stroke={RED} strokeWidth={4} />)}
    {t >= 39 && t < 44 && <><line x1={GX(dn)} y1={GY(1 - 1 / 2 ** dn)} x2={GX(dn)} y2={GY(1)} stroke={CYAN} strokeWidth={5} /><T x={GX(dn) + 14} y={GY(1) - 26} s={24} c={CYAN} f="KaTeX_Math" it anchor="start">S − {sub("S", "n")}</T></>}
    <Chip x={800} y={500} text="CONVERGE" c={GRN} sc={pp(t, 33.6)} s={32} /><T x={1020} y={GY(1)} s={36} c={YEL} f="KaTeX_Math" it sc={pp(t, 41.2)} anchor="start">S</T>
    <T x={800} y={560} s={36} c={INKC} f="KaTeX_Math" it sc={pp(t, 37.6)}>{sub("S", "n")}{"\u00a0→ S"}</T></>; };
const GEO_CAM: Key[] = [[19, 400, 310, 1.1], [20, 270, 300, 1.6], [27.3, 280, 310, 1.65], [28.2, 790, 320, 1.55], [33, 800, 320, 1.6], [33.8, 540, 310, 1.05], [36.5, 540, 310, 1.08], [37.4, 800, 300, 1.75], [44, 810, 290, 1.85], [45.4, 540, 320, 1.05], [46, 540, 320, 1.06]];

/* 3 — the harmonic series: terms go to 0, the sum still explodes */
const HN = (() => { const a = [0]; for (let n = 1; n <= 42; n++) a.push(a[n - 1] + 1 / n); return a; })();
const HX = (n: number) => 150 + n * 19, HY = (s: number) => 480 - s * 74;
const Harm = (t: number) => { const p = sm((t - 53.6) / 3.6), N = Math.max(1, Math.round(p * 42));
  return <>
    <T x={420} y={100} s={48} c={INKC} f="KaTeX_Main" sc={pp(t, 46.3)}>1 + 1/2 + 1/3 + 1/4 + ⋯</T><Chip x={820} y={100} text="série harmonique" c={PUR} sc={pp(t, 48.6)} s={26} />
    <Axes ox={150} oy={480} w={820} h={350} p={k(t, 46.8, 0.5)} />
    {[1, 2, 3, 4].map((v) => <g key={v} opacity={k(t, 53.2)}><line x1={150} y1={HY(v)} x2={970} y2={HY(v)} stroke={HN[N] >= v && p > 0 ? YEL : "#fff"} strokeOpacity={HN[N] >= v && p > 0 ? 0.9 : 0.18} strokeWidth={3} strokeDasharray="10 10" />
      <T x={126} y={HY(v)} s={26} c={HN[N] >= v && p > 0 ? YEL : DIM} f="KaTeX_Main">{v}</T></g>)}
    {Array.from({ length: 42 }).map((_, i) => { const n = i + 1, h = (74 / n) * k(t, 50.6 + i * 0.05, 0.25); return <rect key={n} x={HX(n) - 6} y={480 - h} width={12} height={h} rx={3} fill={BLUE} />; })}
    <Chip x={640} y={440} text="les termes → 0" c={BLUE} sc={pp(t, 52.2)} s={24} />
    {p > 0 && <Draw d={"M" + HN.slice(1, N + 1).map((s, i) => `${HX(i + 1)} ${HY(s)}`).join(" L")} p={1} c={RED} w={6} glow />}
    {p > 0 && <circle cx={HX(N)} cy={HY(HN[N])} r={9} fill="#fff" stroke={RED} strokeWidth={4} />}
    <T x={990} y={HY(HN[42]) - 34} s={40} c={RED} f="KaTeX_Main" sc={pp(t, 57.4)} glow={RED}>+∞</T><Chip x={800} y={250} text="DIVERGE" c={RED} sc={pp(t, 58)} s={32} />
    <Person x={1010} y={540} s={0.55} ink={INKC} col={YEL} label="" t={t} look={-1} hair="#c9a227" sc={pp(t, 47.2)} wave={t > 55 ? Math.sin(t * 10) * 0.4 + 0.6 : 0} />
    {/* necessary, not sufficient */}
    <g opacity={k(t, 61.2)}><rect x={250} y={150} width={470} height={150} rx={22} fill="#0b0b12" stroke="#ffffff33" strokeWidth={3} /></g>
    <T x={470} y={190} s={32} c={INKC} f="KaTeX_Main" sc={pp(t, 61.5)}>Σ{sub("u", "n")}{"\u00a0converge\u00a0⟹\u00a0"}{sub("u", "n")}{"\u00a0→ 0"}</T><Tick x={690} y={190} ok sc={pp(t, 62.3)} s={0.7} />
    <T x={470} y={258} s={32} c={INKC} f="KaTeX_Main" sc={pp(t, 63.4)}>{sub("u", "n")}{"\u00a0→ 0\u00a0⟹\u00a0Σ"}{sub("u", "n")}{"\u00a0converge"}</T><Tick x={690} y={258} ok={false} sc={pp(t, 64.3)} s={0.7} /></>; };
const HARM_CAM: Key[] = [[46, 540, 300, 1.05], [47.5, 480, 250, 1.3], [50.3, 480, 300, 1.2], [51, 380, 420, 1.7], [53.2, 420, 420, 1.6], [53.8, 540, 310, 1.08], [57.2, 600, 290, 1.2], [60.8, 620, 290, 1.25], [61.6, 480, 220, 1.75], [65.6, 490, 225, 1.85], [66, 540, 300, 1.2]];

/* 4 — two families to know by heart */
const Rules = (t: number) => { const p2 = k(t, 68.4, 2.2), p1 = k(t, 69.2, 2.2), R = (a: number, n: number) => { let s = 0; for (let i = 1; i <= n; i++) s += 1 / i ** a; return s; };
  const path = (a: number, sc: number) => "M" + Array.from({ length: 16 }).map((_, i) => `${150 + (i + 1) * 20} ${470 - R(a, i + 1) * sc}`).join(" L");
  return <>
    <rect x={80} y={90} width={440} height={440} rx={26} fill="#0b0b12" stroke={GRN} strokeOpacity={0.6} strokeWidth={3} opacity={k(t, 66.2)} />
    <Chip x={300} y={90} text="RIEMANN" c={GRN} sc={pp(t, 66.4)} s={30} /><T x={300} y={170} s={60} c={INKC} f="KaTeX_Main" sc={pp(t, 66.9)}>Σ 1/n<tspan dy="-0.45em" fontSize="62%" fontFamily="KaTeX_Math" fontStyle="italic">α</tspan></T>
    <Axes ox={150} oy={470} w={330} h={220} p={k(t, 67.8, 0.4)} />
    <Draw d={`M150 ${470 - 1.645 * 80} H480`} p={k(t, 68.6, 0.5)} c={YEL} w={3} dash="8 8" /><Draw d={path(2, 80)} p={p2} c={GRN} w={5} glow /><Draw d={path(1, 55)} p={p1} c={RED} w={5} glow />
    <T x={404} y={372} s={24} c={GRN} f="KaTeX_Main" sc={pp(t, 70.2)}>α = 2</T><T x={404} y={262} s={24} c={RED} f="KaTeX_Main" sc={pp(t, 70.6)}>α = 1</T>
    <T x={300} y={505} s={32} c={YEL} f="KaTeX_Main" sc={pp(t, 71)}>converge ⟺ α &gt; 1</T>
    <rect x={560} y={90} width={440} height={440} rx={26} fill="#0b0b12" stroke={BLUE} strokeOpacity={0.6} strokeWidth={3} opacity={k(t, 72.2)} />
    <Chip x={780} y={90} text="GÉOMÉTRIQUE" c={BLUE} sc={pp(t, 72.4)} s={30} /><T x={780} y={175} s={52} c={INKC} f="KaTeX_Main" sc={pp(t, 72.9)}>Σ q<tspan dy="-0.45em" fontSize="62%" fontFamily="KaTeX_Math" fontStyle="italic">n</tspan><tspan dy="0.45em"> = 1 / (1 − q)</tspan></T>
    {Array.from({ length: 9 }).map((_, i) => { const h = 150 * 0.62 ** i * k(t, 74 + i * 0.14, 0.25); return <rect key={i} x={625 + i * 36} y={440 - h} width={26} height={h} rx={5} fill={[BLUE, CYAN][i % 2]} />; })}
    <line x1={610} y1={440} x2={960} y2={440} stroke="#fff" strokeOpacity={0.3} strokeWidth={3} /><T x={780} y={248} s={30} c={DIM} f="KaTeX_Main" sc={pp(t, 74.2)}>q = 0,6 : les termes fondent</T>
    <T x={780} y={505} s={32} c={YEL} f="KaTeX_Main" sc={pp(t, 76)}>converge ⟺ |q| &lt; 1</T>
    <Person x={540} y={590} s={0.42} ink={INKC} col={PUR} label="" t={t} glasses hair="#8f96b8" sc={pp(t, 66.3)} wave={Math.sin(t * 3) > 0 ? 0.8 : 0.2} /></>; };
const RULES_CAM: Key[] = [[66, 540, 310, 1.05], [66.8, 300, 300, 1.55], [71.8, 300, 320, 1.6], [72.6, 780, 300, 1.55], [77.4, 780, 320, 1.6], [78, 540, 320, 1.1]];

const End = (t: number) => <>
  <Chip x={540} y={130} text="CONVERGE  →  somme finie" c={GRN} sc={pp(t, 78.3)} s={34} /><Chip x={540} y={205} text="DIVERGE  →  pas de somme" c={RED} sc={pp(t, 79.1)} s={34} />
  <Person x={250} y={520} s={0.62} ink={INKC} col={RED} label="" t={t} look={1} hair="#1d1420" sc={pp(t, 78.5)} wave={Math.sin(t * 9) * 0.4 + 0.6} /><Person x={830} y={520} s={0.62} ink={INKC} col={BLUE} label="" t={t} look={-1} skin="#c98a5e" hair="#5a3418" sc={pp(t, 78.7)} wave={Math.cos(t * 9) * 0.4 + 0.6} />
  <rect x={340} y={300} width={400} height={110} rx={24} fill={RED} transform={`rotate(-3 540 355) scale(${pp(t, 80.4)})`} style={{ transformOrigin: "540px 355px" }} />
  <T x={540} y={357} s={78} c="#fff" sc={pp(t, 80.4)} rot={-3}>ABONNE-TOI</T><T x={540} y={470} s={36} c="#e9ecff" sc={pp(t, 81.2)}>pour la suite de l'analyse ↗</T></>;

const TOTAL = 84.5;
type Scene = { a: number; r: (t: number) => React.ReactNode; cam: Key[] };
const SCENES: Scene[] = [{ a: 0, r: Hook, cam: [[0, 540, 304, 1.05], [5, 560, 300, 1.2]] }, { a: 5, r: Def, cam: DEF_CAM }, { a: 19, r: Geo, cam: GEO_CAM }, { a: 46, r: Harm, cam: HARM_CAM }, { a: 66, r: Rules, cam: RULES_CAM }, { a: 78, r: End, cam: [[78, 540, 320, 1.05], [84.5, 540, 320, 1.12]] }];
const BEATS = [0.2, 0.9, 1.5, 2.3, 5.2, 5.8, 6.22, 6.64, 7.06, 7.48, 7.9, 9.9, 10.58, 11.26, 11.94, 12.62, 13.3, 14.6, 15.3, 19.3, 20.2, 21.15, 22.1, 23.05, 24.05, 24.6, 25.15, 25.7, 28.4, 28.78, 29.16, 29.54, 29.92, 30.3, 30.8, 33.4, 33.6, 37.6, 41.2,
  46.3, 48.6, 52.2, 57.4, 58, 61.5, 62.3, 63.4, 64.3, 66.4, 66.9, 70.2, 70.6, 71, 72.4, 72.9, 76, 78.3, 79.1, 80.4, 81.2];
/* French subtitles (no voice-over): [start, end, text]; *words* between stars are highlighted */
const SUBS: [number, number, string][] = [
  [0.4, 4.9, "Peut-on additionner une *infinité* de nombres… et trouver un résultat *fini* ?"],
  [5.3, 9.4, "On part d'une *suite* de nombres : u₀, u₁, u₂, u₃…"],
  [9.7, 14.3, "On les additionne un par un : ce sont les *sommes partielles* Sₙ."],
  [14.6, 18.8, "La *série* Σuₙ, c'est ce que devient Sₙ quand n tend vers l'*infini*."],
  [19.3, 23.4, "Exemple : *1/2 + 1/4 + 1/8 + 1/16 + …*"],
  [23.7, 27.4, "Chaque terme remplit la *moitié* de ce qui reste du carré."],
  [28.0, 33.0, "Sur la courbe, les sommes Sₙ montent… sans jamais dépasser *1*."],
  [33.3, 36.4, "La série *converge* : sa somme vaut *1*."],
  [37.0, 41.0, "*Converger*, c'est ça : Sₙ s'approche d'une valeur finie *S*."],
  [41.3, 45.7, "Cette limite S s'appelle la *somme de la série*."],
  [46.3, 50.3, "Autre exemple : *1 + 1/2 + 1/3 + 1/4 + …* la série harmonique."],
  [50.6, 53.3, "Ses termes deviennent de plus en plus petits : ils *tendent vers 0*."],
  [53.6, 57.3, "Pourtant, la courbe des sommes monte… *sans jamais s'arrêter*."],
  [57.6, 61.0, "La série *diverge* : sa somme est infinie."],
  [61.4, 65.8, "Attention : uₙ → 0 est *nécessaire* pour converger, mais *pas suffisant* !"],
  [66.3, 71.9, "Séries de *Riemann* : Σ 1/nᵅ converge si et seulement si *α > 1*."],
  [72.3, 77.6, "Séries *géométriques* : Σ qⁿ = 1/(1 − q), à condition que *|q| < 1*."],
  [78.2, 80.2, "À retenir : *converge* ou *diverge*, tout se lit sur la courbe des Sₙ."],
  [80.5, 84.0, "*Abonne-toi* pour la suite !"],
];

const Strip: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  let i = 0; for (let j = 0; j < SCENES.length; j++) if (t >= SCENES[j].a) i = j;
  const sc = SCENES[i], u = t - sc.a, [cx, cy, zr] = cam(sc.cam, t), z0 = soft(zr);
  const beat = Math.max(0, ...BEATS.map((b) => (t >= b ? 1 - sat((t - b) / 0.18) : 0))), z = z0 * (1 + beat * 0.035);   // a tiny zoom "kick" on every beat keeps the rhythm without cutting
  const dir = i % 2 ? 1 : -1, gl = sat(1 - u / 0.14), dx = 22 * gl * dir, g = Math.floor(t * 15);
  return (
    <div style={{ position: "absolute", left: 0, top: 640, width: 1080, height: 608, overflow: "hidden", background: "#050506" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs><filter id="serrgb" x="-4%" width="108%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={dx} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-dx} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" /></filter></defs></svg>
      <div style={{ position: "absolute", inset: 0, filter: gl > 0 ? "url(#serrgb)" : undefined }}>
        {/* dark blueprint ground that moves with the camera (parallax) */}
        <div style={{ position: "absolute", inset: 0, background: "#050506" }} />
        <div style={{ position: "absolute", width: 760, height: 760, left: -260 + Math.sin(t * 0.5) * 60 - (cx - 540) * 0.15, top: -420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.55), transparent 62%)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", width: 820, height: 820, right: -300 + Math.cos(t * 0.4) * 60 + (cx - 540) * 0.15, bottom: -480, borderRadius: "50%", background: "radial-gradient(circle, rgba(40,224,255,0.5), transparent 62%)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", width: 600, height: 600, left: 320 + Math.sin(t * 0.3) * 120, top: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,92,255,0.28), transparent 60%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", inset: -200, opacity: 0.55, backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1.4px, transparent 1.4px)", backgroundSize: `${46 * z}px ${46 * z}px`, backgroundPosition: `${-cx * z * 0.6}px ${-cy * z * 0.6}px` }} />
        <svg width={1080} height={608} viewBox="0 0 1080 608" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g transform={`translate(${540 - cx * z} ${304 - cy * z}) scale(${z})`}>{sc.r(t)}</g></svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: sat(1 - u * 13) * 0.4 }} />
      {gl > 0.3 ? [0, 1].map((b) => <div key={b} style={{ position: "absolute", left: 0, right: 0, top: (g * 131 + b * 311) % 560, height: 18 + ((g * 17 + b * 29) % 40),
        background: b ? "rgba(40,224,255,0.25)" : "rgba(255,45,45,0.25)", transform: `translateX(${((g * 53 + b * 97) % 60) - 30}px)` }} />) : null}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("series/grain.png")})`, backgroundPosition: `${(g * 173) % 512}px ${(g * 311) % 512}px`, opacity: 0.14, mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(0,0,0,0.55)" }} />
    </div>
  );
};

const Subs: React.FC = () => {
  const t = useCurrentFrame() / FPS, s = SUBS.find((x) => t >= x[0] && t < x[1]); if (!s) return null;
  const p = eo((t - s[0]) / 0.25) * (1 - sat((t - s[1] + 0.2) / 0.2));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1310, textAlign: "center", fontFamily: "InterX", fontWeight: 800, fontSize: 58, lineHeight: 1.32, color: "#fff", opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      {s[2].split("*").map((part, i) => (i % 2 ? <span key={i} style={{ color: YEL }}>{part}</span> : <span key={i}>{part}</span>))}
    </div>
  );
};
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, fr(at))} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);

export const SeriesEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame(), t = f / FPS;
  const [h] = useState(() => delayRender("katex + display fonts"));
  useEffect(() => {
    Promise.all(["400 40px KaTeX_Main", "italic 40px KaTeX_Math", "40px KaTeX_AMS", "40px Anton"].map((x) => document.fonts.load(x, "fSnuΣα∞⟹⟺")))
      .catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: "InterX", fontWeight: 600, fontSize: 60, lineHeight: 1.22, color: "#fff", opacity: interpolate(f, [0, 8], [0, 1], clamp) }}>
        Les séries numériques<br /><span style={{ color: YEL }}>en 1 minute 20</span></div>
      <Strip />
      <div style={{ position: "absolute", left: 0, top: 1248, height: 6, width: 1080 * sat(t / TOTAL), background: RED }} />
      <Subs />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1700, textAlign: "center", fontFamily: "InterX", fontWeight: 600, fontSize: 34, color: "rgba(255,255,255,0.4)", letterSpacing: 6 }}>ANALYSE · SÉRIES NUMÉRIQUES</div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [SERIES_FRAMES - 12, SERIES_FRAMES - 1], [0, 1], clamp) }} />
      <Audio src={staticFile("series/bed.wav")} volume={(x) => interpolate(x, [0, 20, SERIES_FRAMES - 45, SERIES_FRAMES - 3], [0, 0.42, 0.42, 0], clamp)} />
      {SCENES.slice(1).map((x, i) => <Sfx key={`c${i}`} at={x.a - 0.03} src="whoosh" v={0.34} />)}
      {BEATS.map((x, i) => <Sfx key={`b${i}`} at={x - 0.02} src={i % 3 === 0 ? "pop" : i % 3 === 1 ? "tick" : "swipe"} v={0.26} />)}
      {[33.4, 58, 64.3, 71, 76, 80.4].map((x) => <Sfx key={`d${x}`} at={x} src={x === 58 || x === 64.3 ? "bass" : "ding"} v={0.34} />)}
    </AbsoluteFill>
  );
};
