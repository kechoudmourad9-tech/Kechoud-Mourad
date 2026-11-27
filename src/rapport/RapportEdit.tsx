// "Projet : la machine de Turing" — the report as a silent guided explainer (no voice, no subtitles), 1920x1080: one image per idea, gentle camera, restrained palette.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { Mark, Squig } from "../cx/clips";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
import TM from "./timing.json";
export const RAPPORT_FRAMES = fr(TM.total);
// restrained palette: white drawings, yellow accent, red = reject/problem, green = accept/solution, one discreet blue
const CYAN = "#eeeeee", PUR = "#9a9a9a", RED = "#ffd23f", BLUE = "#bdbdbd", YEL = "#ffd23f", GRN = "#f2f2f2";
const sat = (x: number) => Math.min(1, Math.max(0, x));
const eo = (x: number) => 1 - Math.pow(1 - sat(x), 3);
/** 0→1 eased progress starting at `at` (s) lasting d */
const k = (u: number, at = 0, d = 0.3) => eo((u - at) / d);
/** overshoot pop */
const pp = (u: number, at = 0, d = 0.32) => { const x = sat((u - at) / d); if (x <= 0) return 0; const c = 2.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
type Bg = "paper" | "dark" | "blue" | "red";
const INK: Record<Bg, string> = { paper: "#141414", dark: "#ffffff", blue: "#f0f0f0", red: "#ffffff" };

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
    <g transform={`translate(${x} ${y}) scale(${s * sc})`} style={{ filter: "grayscale(1)" }}>
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
const INKC = "#ffffff", DIM = "#a6a6a6";
const Chip: React.FC<{ x: number; y: number; text: string; c?: string; fg?: string; sc?: number; s?: number }> = ({ x, y, text, c = RED, fg = "#fff", sc = 1, s = 30 }) => {
  const w = text.length * s * 0.5 + s * 1.1; return sc <= 0.001 ? null : <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-w / 2} y={-s * 0.72} width={w} height={s * 1.44} rx={s * 0.42} fill={c} /><T x={0} y={1} s={s} c={/^#[def]/i.test(c) && fg === "#fff" ? "#141414" : fg}>{text}</T></g>;
};
/* ---------- scenes: one dark image per idea, everything animates inside it ---------- */
const sub = (b: string, i: string) => <>{b}<tspan dy="0.28em" fontSize="62%">{i}</tspan><tspan dy="-0.28em" fontSize="1%"> </tspan></>;
const Tick: React.FC<{ x: number; y: number; ok: boolean; sc: number; s?: number }> = ({ x, y, ok, sc, s = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc * s})`}><circle r={22} fill={ok ? GRN : RED} style={{ filter: `drop-shadow(0 0 10px ${ok ? GRN : RED})` }} />
    <path d={ok ? "M-10 1 L-3 9 L11 -8" : "M-9 -9 L9 9 M9 -9 L-9 9"} fill="none" stroke="#141414" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></g>);
const Axes: React.FC<{ ox: number; oy: number; w: number; h: number; p: number; xl?: string; yl?: React.ReactNode }> = ({ ox, oy, w, h, p, xl = "n", yl }) => <>
  <Draw d={`M${ox} ${oy} H${ox + w}`} p={p} c={INKC} w={4} /><Draw d={`M${ox} ${oy} V${oy - h}`} p={p} c={INKC} w={4} />
  <Head x={ox + w + 4} y={oy} p={p} c={INKC} s={0.45} /><Head x={ox} y={oy - h - 4} p={p} c={INKC} s={0.45} a={-90} />
  <T x={ox + w + 26} y={oy + 4} s={30} c={DIM} f="KaTeX_Math" it sc={p}>{xl}</T>{yl ? <T x={ox - 4} y={oy - h - 30} s={30} c={DIM} f="KaTeX_Math" it sc={p}>{yl}</T> : null}</>;
/* ================= La machine de Turing — primitives (1920 x 1080 stage) ================= */
const S = (i: number) => TM.S[i], E = (i: number) => TM.E[i];
const mid = (i: number, f = 0.5) => S(i) + (E(i) - S(i)) * f;
const W = "#ffffff", KM = "KaTeX_Main", KI = "KaTeX_Math", PANEL = "#0e0e0e", LINE = "#cfcfcf", SOFT = "#1d1d1d";
const sup = (b: React.ReactNode, e: string) => <>{b}<tspan dy="-0.42em" fontSize="62%">{e}</tspan><tspan dy="0.42em" fontSize="1%"> </tspan></>;
const kf = (t: number, keys: [number, number][]) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [a, va] = keys[i], [b, vb] = keys[i + 1]; if (t <= b) return va + (vb - va) * sm((t - a) / Math.max(1e-6, b - a)); } return keys[keys.length - 1][1]; };
const bounce = (t: number, per: number, lo: number, hi: number) => { const n = Math.floor(t / per), L = hi - lo, f = sm((t - n * per) / (per * 0.55));
  const at = (m: number) => { const q = m % (2 * L); return lo + (q <= L ? q : 2 * L - q); }; return at(n) + (at(n + 1) - at(n)) * f; };
const Blank: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = DIM }) => (
  <path d={`M${x - 15 * s} ${y - 10 * s} V${y + 11 * s} H${x + 15 * s} V${y - 10 * s}`} fill="none" stroke={c} strokeWidth={4 * s} strokeLinecap="round" strokeLinejoin="round" />);
const cxOf = (x: number, i: number, cw = 100) => x + i * cw + cw / 2;
/** a strip of tape: x = left edge of the first cell, y = centre line. "_" is the blank symbol */
const Tape: React.FC<{ x: number; y: number; cells: string[]; p?: number; cw?: number; hl?: Record<number, string>; ends?: boolean; s?: number; dim?: number[] }> = ({ x, y, cells, p = 1, cw = 100, hl = {}, ends = true, s = 54, dim = [] }) => {
  const n = cells.length, e = sat(p * 2 - 1);
  return <g>
    {ends && e > 0 && <g opacity={e}>{[-1, n].map((i) => <rect key={i} x={x + i * cw + 6} y={y - cw / 2 + 6} width={cw - 12} height={cw - 12} rx={12} fill="none" stroke={DIM} strokeOpacity={0.45} strokeWidth={3} strokeDasharray="8 9" />)}
      <T x={x - cw * 1.5 - 4} y={y - 4} s={cw * 0.5} c={DIM} f={KM}>⋯</T><T x={x + (n + 1.5) * cw + 4} y={y - 4} s={cw * 0.5} c={DIM} f={KM}>⋯</T></g>}
    {cells.map((c, i) => { const o = sat(p * n * 1.3 - i); if (o <= 0) return null; const cx = x + i * cw + cw / 2, h = hl[i];
      return <g key={i} opacity={o * (dim.includes(i) ? 0.35 : 1)}><rect x={x + i * cw + 3} y={y - cw / 2} width={cw - 6} height={cw} rx={cw * 0.12} fill={h ? h + "2e" : PANEL} stroke={h ?? LINE} strokeOpacity={h ? 1 : 0.65} strokeWidth={h ? 5 : 3} style={h ? { filter: `drop-shadow(0 0 12px ${h}88)` } : undefined} />
        {c === "_" ? <Blank x={cx} y={y + 3} s={cw / 100} /> : c ? <T x={cx} y={y + 2} s={s * (cw / 100)} c={W} f={KM}>{c}</T> : null}</g>; })}
  </g>;
};
/** read/write head above a cell, with the current state in a little box */
const HeadBox: React.FC<{ x: number; y: number; st?: React.ReactNode; c?: string; sc?: number; cw?: number }> = ({ x, y, st, c = YEL, sc = 1, cw = 100 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y - cw / 2 - 10}) scale(${sc * Math.max(0.7, cw / 100)})`}><path d="M-20 -32 L20 -32 L0 -4 Z" fill={c} style={{ filter: `drop-shadow(0 0 10px ${c})` }} />
    {st !== undefined && <><rect x={-62} y={-96} width={124} height={56} rx={16} fill={PANEL} stroke={c} strokeWidth={4} /><T x={0} y={-67} s={32} c={c} f={KM}>{st}</T></>}</g>);
const St: React.FC<{ x: number; y: number; l: React.ReactNode; c?: string; acc?: boolean; sc?: number; hot?: boolean; r?: number; init?: boolean; ls?: number; lf?: string }> = ({ x, y, l, c = W, acc, sc = 1, hot, r = 52, init, ls, lf = KM }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}>
    {init && <><path d={`M${-r - 74} 0 H${-r - 14}`} stroke={W} strokeWidth={4} /><path d={`M${-r - 4} 0 l-18 -11 v22 z`} fill={W} /></>}
    <circle r={r} fill={hot ? c + "30" : PANEL} stroke={c} strokeWidth={hot ? 6 : 4} style={hot ? { filter: `drop-shadow(0 0 18px ${c})` } : undefined} />
    {acc && <circle r={r - 10} fill="none" stroke={c} strokeWidth={3} />}
    <T x={0} y={2} s={ls ?? r * 0.6} c={c} f={lf}>{l}</T></g>);
/** curved arrow between two state centres, trimmed by the circle radius */
const Arr: React.FC<{ a: [number, number]; b: [number, number]; bend?: number; p: number; c?: string; label?: React.ReactNode; r?: number; ls?: number; w?: number; lo?: number }> = ({ a, b, bend = 0, p, c = W, label, r = 56, ls = 28, w = 4, lo = 34 }) => {
  if (p <= 0) return null;
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const A = [a[0] + ux * r, a[1] + uy * r], B = [b[0] - ux * (r + 8), b[1] - uy * (r + 8)], C = [(A[0] + B[0]) / 2 + nx * bend, (A[1] + B[1]) / 2 + ny * bend];
  const ang = (Math.atan2(B[1] - C[1], B[0] - C[0]) * 180) / Math.PI, M = [0.25 * A[0] + 0.5 * C[0] + 0.25 * B[0], 0.25 * A[1] + 0.5 * C[1] + 0.25 * B[1]], sg = bend >= 0 ? 1 : -1;
  return <g><Draw d={`M${A[0]} ${A[1]} Q${C[0]} ${C[1]} ${B[0]} ${B[1]}`} p={p} c={c} w={w} /><Head x={B[0]} y={B[1]} p={p} c={c} a={ang} s={0.62} />
    {label ? <T x={M[0] + nx * lo * sg} y={M[1] + ny * lo * sg} s={ls} c={c} f={KM} sc={sat((p - 0.6) / 0.4)}>{label}</T> : null}</g>;
};
const SelfLoop: React.FC<{ x: number; y: number; p: number; c?: string; label?: React.ReactNode; r?: number; up?: boolean; ls?: number }> = ({ x, y, p, c = W, label, r = 52, up = true, ls = 26 }) => {
  if (p <= 0) return null; const s = up ? -1 : 1, y0 = y + s * r * 0.82, yc = y + s * (r + 96), ang = (Math.atan2(y0 - yc, 30 - 74) * 180) / Math.PI;
  return <g><Draw d={`M${x - 30} ${y0} C${x - 74} ${yc} ${x + 74} ${yc} ${x + 30} ${y0}`} p={p} c={c} w={4} /><Head x={x + 30} y={y0} p={p} c={c} a={ang} s={0.55} />
    {label ? <T x={x} y={y + s * (r + 98)} s={ls} c={c} f={KM} sc={sat((p - 0.6) / 0.4)}>{label}</T> : null}</g>;
};
const Card: React.FC<{ x: number; y: number; w: number; h: number; c?: string; p: number; children?: React.ReactNode; title?: string; tc?: string }> = ({ x, y, w, h, c = LINE, p, children, title, tc }) => p <= 0.001 ? null : (
  <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${p}) translate(${-w / 2} ${-h / 2})`}><rect width={w} height={h} rx={26} fill={PANEL} stroke={c} strokeOpacity={0.6} strokeWidth={3} />
    {title ? <T x={w / 2} y={44} s={38} c={tc ?? c}>{title}</T> : null}{children}</g>);
const Doc: React.FC<{ x: number; y: number; s?: number; sc?: number; rot?: number; title?: string; by?: string }> = ({ x, y, s = 1, sc = 1, rot = 0, title = "", by = "" }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sc})`}><rect x={-130} y={-170} width={260} height={340} rx={10} fill="#efefef" style={{ filter: "drop-shadow(0 20px 40px #000)" }} />
    <text x={0} y={-118} fontFamily={KM} fontSize={22} fill="#14101f" textAnchor="middle">{title}</text><text x={0} y={-88} fontFamily={KM} fontSize={15} fill="#555" textAnchor="middle">{by}</text>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={-100} y={-60 + i * 26} width={i % 3 === 2 ? 150 : 200} height={7} rx={3} fill="#c9cbd6" />)}</g>);
const Bulb: React.FC<{ x: number; y: number; sc?: number; on?: number }> = ({ x, y, sc = 1, on = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}>{on > 0 && <circle r={80} fill={YEL} opacity={0.18 * on} style={{ filter: "blur(10px)" }} />}
    <path d="M-36 10 A46 46 0 1 1 36 10 Q24 26 22 44 H-22 Q-24 26 -36 10 Z" fill={on > 0.5 ? YEL : PANEL} stroke={YEL} strokeWidth={5} /><rect x={-22} y={48} width={44} height={12} rx={4} fill={LINE} /><rect x={-16} y={64} width={32} height={10} rx={4} fill={LINE} /></g>);
const Laptop: React.FC<{ x: number; y: number; s?: number; sc?: number; children?: React.ReactNode }> = ({ x, y, s = 1, sc = 1, children }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s * sc})`}><rect x={-120} y={-150} width={240} height={160} rx={12} fill={PANEL} stroke={LINE} strokeWidth={5} /><path d="M-150 22 H150 L132 40 H-132 Z" fill={LINE} />{children}</g>);
const Desktop: React.FC<{ x: number; y: number; s?: number; sc?: number }> = ({ x, y, s = 1, sc = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s * sc})`}><rect x={-100} y={-110} width={170} height={120} rx={10} fill={PANEL} stroke={LINE} strokeWidth={5} /><rect x={-26} y={10} width={22} height={30} fill={LINE} /><rect x={-60} y={38} width={90} height={10} rx={5} fill={LINE} />
    <rect x={86} y={-110} width={56} height={158} rx={8} fill={PANEL} stroke={LINE} strokeWidth={5} /><circle cx={114} cy={-80} r={6} fill={GRN} /></g>);
const Phone: React.FC<{ x: number; y: number; s?: number; sc?: number }> = ({ x, y, s = 1, sc = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s * sc})`}><rect x={-48} y={-90} width={96} height={180} rx={18} fill={PANEL} stroke={LINE} strokeWidth={5} /><rect x={-16} y={-80} width={32} height={6} rx={3} fill={LINE} />
    {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-34 + c * 24} y={-54 + r * 26} width={18} height={18} rx={5} fill={c === 1 && r === 1 ? YEL : "#2a2a2a"} />))}</g>);
const CpuMem: React.FC<{ x: number; y: number; s?: number; sc?: number }> = ({ x, y, s = 1, sc = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s * sc})`}><rect x={-140} y={-60} width={110} height={120} rx={12} fill={PANEL} stroke={LINE} strokeWidth={5} /><T x={-85} y={0} s={34} c={W}>UC</T>
    <path d="M-30 -20 H30 M-30 20 H30" stroke={YEL} strokeWidth={5} /><rect x={30} y={-60} width={120} height={120} rx={12} fill={PANEL} stroke={LINE} strokeWidth={5} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={46} y={-46 + i * 26} width={88} height={16} rx={4} fill={i === 1 ? YEL : "#2a2a2a"} />)}</g>);
const Win: React.FC<{ x: number; y: number; w: number; h: number; p: number; title: string; children?: React.ReactNode }> = ({ x, y, w, h, p, title, children }) => p <= 0.001 ? null : (
  <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${p}) translate(${-w / 2} ${-h / 2})`}><rect width={w} height={h} rx={18} fill={PANEL} stroke={LINE} strokeOpacity={0.6} strokeWidth={3} />
    <path d={`M0 18 Q0 0 18 0 H${w - 18} Q${w} 0 ${w} 18 V54 H0 Z`} fill={SOFT} />{[RED, YEL, GRN].map((c, i) => <circle key={c} cx={30 + i * 28} cy={27} r={8} fill={c} opacity={0.8} />)}
    <T x={w / 2} y={28} s={24} c={DIM} f="InterX">{title}</T>{children}</g>);
const Cursor: React.FC<{ x: number; y: number; press?: number }> = ({ x, y, press = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${1 - press * 0.15})`}>{press > 0 && <circle r={30 * press} fill="none" stroke={YEL} strokeWidth={4} opacity={press} />}
    <path d="M0 0 L0 44 L11 33 L20 52 L28 48 L19 30 L34 30 Z" fill={W} stroke="#000" strokeWidth={3} strokeLinejoin="round" /></g>);
const Ring: React.FC<{ cx: number; cy: number; rx: number; ry: number; p: number; c: string; fo?: number }> = ({ cx, cy, rx, ry, p, c, fo = 0.06 }) => p <= 0 ? null : (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={c} fillOpacity={fo * sat(p)} stroke={c} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sat(p)} />);
/** a line of text appearing letter by letter */
const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * sat(p)));
const Bracket: React.FC<{ x1: number; x2: number; y: number; p: number; label?: React.ReactNode; c?: string }> = ({ x1, x2, y, p, label, c = YEL }) => <>
  <Draw d={`M${x1} ${y - 16} Q${x1} ${y} ${x1 + 20} ${y} H${(x1 + x2) / 2 - 16} Q${(x1 + x2) / 2} ${y} ${(x1 + x2) / 2} ${y + 16} Q${(x1 + x2) / 2} ${y} ${(x1 + x2) / 2 + 16} ${y} H${x2 - 20} Q${x2} ${y} ${x2} ${y - 16}`} p={p} c={c} w={4} />
  {label ? <T x={(x1 + x2) / 2} y={y + 48} s={34} c={c} f={KM} sc={sat((p - 0.5) * 2)}>{label}</T> : null}</>;
/* ---------- INTRO ---------- */
const HOOK = ["_", "1", "0", "1", "1", "0", "_"], HX = 575;
/** a real photograph in a thin white frame (an HTML <Img> inside the SVG, so each frame waits for it) */
const Photo: React.FC<{ x: number; y: number; w: number; h: number; src: string; sc?: number; o?: number; cap?: string }> = ({ x, y, w, h, src, sc = 1, o = 1, cap }) => sc <= 0.001 || o <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={o}>
    <rect x={-w / 2 - 9} y={-h / 2 - 9} width={w + 18} height={h + 18} rx={6} fill="#f2f2f2" style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.8))" }} />
    <foreignObject x={-w / 2} y={-h / 2} width={w} height={h}><Img src={staticFile(`rapport/photos/${src}`)} style={{ width: w, height: h, objectFit: "cover", objectPosition: "50% 25%", display: "block" }} /></foreignObject>
    {cap ? <T x={0} y={h / 2 + 40} s={22} c={DIM} f="InterX">{cap}</T> : null}</g>);
const Hook = (t: number) => { const pos = bounce(Math.max(0, t - 1.2), 0.62, 1, 5), turing = k(t, S(2) + 0.3, 0.5);
  return <>
    <Tape x={HX} y={540} cells={HOOK} cw={110} p={k(t, 0.2, 1.2)} hl={{ [Math.round(pos)]: YEL }} />
    <HeadBox x={HX + pos * 110 + 55} y={540} cw={110} st={sub("q", Math.round(pos) % 2 ? "1" : "0")} sc={pp(t, 0.9)} />
    <T x={960} y={660} s={34} c={DIM} f="InterX" sc={pp(t, mid(0, 0.05))}>une bande</T><T x={HX + pos * 110 + 55} y={330} s={30} c={YEL} f="InterX" sc={pp(t, mid(0, 0.12))}>une tête</T>
    <Card x={1450} y={430} w={400} h={230} c={LINE} p={pp(t, mid(0, 0.22))} title="QUELQUES RÈGLES" tc={DIM}>
      {[["0", "1", "0"], ["1", "0", "1"], ["⊔", "⊔", "acc"]].map(([a, b, q], i) => <T key={i} x={200} y={100 + i * 46} s={30} c={W} f={KM}>{sub("q", "0")}, {a} → {b}, D</T>)}</Card>
    <g opacity={1 - turing}><Laptop x={250} y={600} s={0.9} sc={pp(t, mid(0, 0.55))}><T x={0} y={-70} s={40} c={YEL} f={KM}>f(x)</T></Laptop>
      <T x={250} y={700} s={30} c={W} f="InterX" sc={pp(t, mid(0, 0.62))}>tout ordinateur</T></g>
    <T x={960} y={180} s={130} c={W} sc={pp(t, S(1) + 0.2)} glow={BLUE}>LA MACHINE DE TURING</T><Squig x={960} y={262} w={900} p={k(t, S(1) + 0.9, 0.5)} c={YEL} />
    <Photo x={260} y={690} w={230} h={290} src="turing_1936.jpg" sc={turing > 0 ? pp(t, S(2) + 0.3) : 0} />
    <Chip x={260} y={460} text="ALAN TURING · 1936" c={YEL} fg="#14101f" sc={pp(t, S(2) + 0.9)} s={34} />
    <T x={430} y={600} s={110} c={YEL} f={KM} sc={pp(t, mid(2, 0.75))} glow={YEL}>?</T>
    <T x={960} y={850} s={32} c={DIM} f="InterX" sc={pp(t, mid(2, 0.3))}>avant même l’existence des ordinateurs</T>
  </>; };
const OBJ = ["histoire", "structure", "types", "calculabilité", "complexité", "exemples"], ROAD = ["Histoire", "Structure", "Types", "Calculabilité", "Complexité", "Applications", "Limites"];
const Plan = (t: number) => { const rx = (i: number) => 230 + i * 243, dot = kf(t, [[S(9) + 0.4, 0], [E(9) - 0.6, 6]]);
  return <>
    <Card x={210} y={90} w={1500} h={250} c={YEL} p={pp(t, S(7) + 0.1)} title="PROBLÉMATIQUE" tc={YEL}>
      <T x={750} y={120} s={44} c={W} f="InterX">Comment un modèle aussi simple peut-il décider</T>
      <T x={750} y={180} s={44} c={W} f="InterX">de ce qu’un ordinateur peut calculer… et en combien de temps ?</T>
      <Squig x={590} y={214} w={250} p={k(t, mid(7, 0.55), 0.4)} c={YEL} /><Squig x={1210} y={214} w={430} p={k(t, mid(7, 0.8), 0.4)} c={YEL} /></Card>
    <T x={960} y={440} s={40} c={DIM} sc={pp(t, S(8) + 0.1)}>OBJECTIFS</T>
    {OBJ.map((o, i) => <g key={o}><Chip x={235 + i * 290} y={520} text={o} c={SOFT} sc={pp(t, mid(8, 0.1 + i * 0.12))} s={32} /><T x={235 + i * 290} y={585} s={24} c={DIM} f="InterX" sc={pp(t, mid(8, 0.1 + i * 0.12))}>{i + 1}</T></g>)}
    <T x={960} y={680} s={40} c={DIM} sc={pp(t, S(9) + 0.1)}>ORGANISATION : 7 CHAPITRES</T>
    <Draw d={`M${rx(0)} 790 H${rx(6)}`} p={k(t, S(9) + 0.3, 1.2)} c={LINE} w={6} /><Draw d={`M${rx(0)} 790 H${rx(0) + dot * 243}`} p={t > S(9) + 0.4 ? 1 : 0} c={YEL} w={6} />
    {ROAD.map((r, i) => <g key={r}><St x={rx(i)} y={790} l={`${i + 1}`} r={34} sc={pp(t, S(9) + 0.4 + i * 0.22)} c={dot >= i - 0.05 ? YEL : W} hot={Math.abs(dot - i) < 0.3} lf="Anton" />
      <T x={rx(i)} y={866} s={28} c={W} f="InterX" sc={pp(t, S(9) + 0.5 + i * 0.22)}>{r}</T></g>)}
  </>; };

/* ---------- CHAPITRE 1 ---------- */
const Hilbert = (t: number) => <>
  <Photo x={360} y={700} w={270} h={340} src="hilbert.jpg" sc={pp(t, S(16) + 0.1)} />
  <T x={360} y={400} s={50} c={W} sc={pp(t, S(16) + 0.3)}>DAVID HILBERT</T><T x={360} y={455} s={32} c={DIM} f={KM} sc={pp(t, S(16) + 0.5)}>1928</T>
  <g transform={`translate(930 270) scale(${pp(t, mid(16, 0.3))})`}><rect x={-420} y={-120} width={840} height={240} rx={40} fill={W} /><path d="M-300 110 L-380 200 L-230 118 Z" fill={W} />
    <T x={0} y={-40} s={40} c="#14101f" f="InterX">Existe-t-il une méthode mécanique</T><T x={0} y={14} s={40} c="#14101f" f="InterX">pour décider si un énoncé logique</T><T x={0} y={68} s={40} c="#14101f" f="InterX">est démontrable ?</T></g>
  <T x={930} y={440} s={32} c={DIM} f={KI} it sc={pp(t, mid(16, 0.6))}>« Entscheidungsproblem »</T>
  <Photo x={1580} y={700} w={270} h={340} src="turing_1936.jpg" sc={pp(t, S(17) + 0.1)} />
  <T x={1580} y={400} s={50} c={W} sc={pp(t, S(17) + 0.3)}>ALAN TURING</T>
  <Doc x={1130} y={700} rot={-6} sc={pp(t, S(17) + 0.5)} title="On Computable Numbers" by="A. M. Turing · 1936" />
  <Chip x={1130} y={500} text="méthode mécanique = ?" c={SOFT} sc={pp(t, mid(17, 0.35))} s={32} />
  <Bulb x={1380} y={470} sc={pp(t, mid(17, 0.72))} on={k(t, mid(17, 0.75), 0.3)} />
  <Chip x={1130} y={960} text="NAISSANCE DE LA MACHINE DE TURING" c={YEL} fg="#14101f" sc={pp(t, mid(17, 0.8))} s={36} />
  <Draw d="M1280 300 Q1500 260 1560 340" p={k(t, S(17) + 0.2, 0.5)} c={YEL} w={5} dash="14 12" />
</>;
const DefWhy = (t: number) => { const map: [string, string][] = [["regarder un symbole", "lire"], ["écrire, effacer", "écrire"], ["se déplacer sur la feuille", "bouger la tête"], ["« état d’esprit »", "état"]];
  return <>
    <Card x={260} y={70} w={1400} h={190} c={YEL} p={pp(t, S(18) + 0.1)} title="DÉFINITION" tc={YEL}>
      <T x={700} y={104} s={46} c={W} f="InterX">un modèle mathématique de calcul</T>
      {["lit et écrit des symboles", "bande infinie", "table de règles finie"].map((x, i) => <Chip key={x} x={300 + i * 400} y={156} text={x} c={SOFT} sc={pp(t, mid(18, 0.4 + i * 0.16))} s={28} />)}</Card>
    <Tape x={1330} y={430} cells={["_", "1", "0", "1", "_"]} cw={90} p={k(t, mid(18, 0.5), 0.8)} hl={{ 2: YEL }} />
    <HeadBox x={cxOf(1330, 2, 90)} y={430} cw={90} st={sub("q", "1")} sc={pp(t, mid(18, 0.62))} />
    <Card x={1340} y={560} w={420} h={250} c={LINE} p={pp(t, mid(18, 0.85))} title="RÈGLES" tc={DIM}>{[["0", "1", "1"], ["1", "0", "1"], ["⊔", "⊔", "acc"]].map(([a, b, q], i) => <T key={i} x={210} y={110 + i * 46} s={30} c={W} f={KM}>{sub("q", "1")}, {a} → {sub("q", q)}, {b}, D</T>)}</Card>
    <Person x={190} y={820} s={1.35} ink={W} col="#5a6b8c" label="" t={t} hair="#2b1a10" skin="#c98a5e" sc={pp(t, S(20) + 0.1)} wave={0.25 + Math.sin(t * 6) * 0.06} />
    <g transform={`translate(420 560) rotate(-5) scale(${pp(t, S(20) + 0.3)})`}><rect x={-120} y={-150} width={240} height={300} rx={8} fill="#efefef" />
      {Array.from({ length: 5 }).map((_, r) => Array.from({ length: 4 }).map((_, c) => <rect key={`${r}${c}`} x={-96 + c * 50} y={-126 + r * 52} width={44} height={44} fill="none" stroke="#bdbdbd" strokeWidth={2} />))}
      {["1", "0", "1", "1"].map((x, i) => <text key={i} x={-74 + i * 50} y={-90} fontFamily={KM} fontSize={30} fill="#14101f" textAnchor="middle">{x}</text>)}
      <path d={`M${-80 + 50 * (Math.floor(t * 1.4) % 4)} -60 l40 -50`} stroke={YEL} strokeWidth={6} strokeLinecap="round" /></g>
    <T x={330} y={330} s={34} c={DIM} f="InterX" sc={pp(t, S(20) + 0.3)}>un humain qui calcule</T>
    {map.map(([a, b], i) => { const at = mid(20, 0.3 + i * 0.16), y = 470 + i * 96;
      return <g key={a} opacity={k(t, at, 0.3)}><T x={940} y={y} s={30} c={W} f="InterX" anchor="end">{a}</T><Draw d={`M960 ${y} H1050`} p={k(t, at + 0.1, 0.3)} c={YEL} w={4} /><Head x={1056} y={y} p={k(t, at + 0.1, 0.3)} c={YEL} s={0.5} />
        <T x={1080} y={y} s={30} c={YEL} f="InterX" anchor="start">{b}</T></g>; })}
    <Card x={1230} y={850} w={640} h={190} c={YEL} p={pp(t, S(19) + 0.15)} title="THÈSE DE CHURCH–TURING" tc={YEL}>
      <T x={320} y={102} s={30} c={W} f="InterX">tout problème algorithmique → une MT</T><T x={320} y={150} s={24} c={DIM} f="InterX" sc={pp(t, mid(19, 0.55))}>non démontrable · aucun contre-exemple</T></Card>
    <g opacity={k(t, S(21) + 0.1, 0.4)}><T x={640} y={890} s={30} c={DIM} f="InterX">une méthode pour chaque problème</T><Draw d="M380 890 H900" p={k(t, mid(21, 0.35), 0.4)} c={RED} w={5} />
      <Chip x={640} y={985} text="UNE machine pour tout algorithme" c={YEL} fg="#14101f" sc={pp(t, mid(21, 0.5))} s={36} /></g>
  </>; };
const Legacy = (t: number) => { const ev: [number, string, string][] = [[300, "1936", "machine universelle"], [760, "1945", "architecture de von Neumann"], [1220, "1950 →", "ordinateurs"], [1640, "aujourd’hui", "partout"]];
  return <>
    <Card x={150} y={90} w={760} h={220} c={GRN} p={pp(t, S(22) + 0.3)}><Tick x={80} y={110} ok sc={pp(t, S(22) + 0.6)} s={1.5} /><T x={420} y={86} s={38} c={W} f="InterX">une définition rigoureuse</T><T x={420} y={140} s={38} c={W} f="InterX">de l’algorithme</T></Card>
    <Card x={1010} y={90} w={760} h={220} c={RED} p={pp(t, mid(22, 0.45))}><Tick x={80} y={110} ok={false} sc={pp(t, mid(22, 0.5))} s={1.5} /><T x={420} y={86} s={38} c={W} f="InterX">des problèmes sans aucune</T><T x={420} y={140} s={38} c={W} f="InterX">solution mécanique</T></Card>
    <g transform={`translate(1390 380) rotate(-6) scale(${pp(t, mid(22, 0.82))})`}><rect x={-300} y={-46} width={600} height={92} rx={12} fill="none" stroke={RED} strokeWidth={6} /><T x={0} y={2} s={48} c={RED}>RÉPONSE À HILBERT : NON</T></g>
    <Draw d="M300 700 H1640" p={k(t, S(23) + 0.2, 1.4)} c={LINE} w={5} />
    {ev.map(([x, y, l], i) => { const at = mid(23, 0.06 + i * 0.13);
      return <g key={y}><circle cx={x} cy={700} r={14 * pp(t, at)} fill={YEL} /><T x={x} y={760} s={36} c={W} f={KM} sc={pp(t, at)}>{y}</T><T x={x} y={806} s={28} c={DIM} f="InterX" sc={pp(t, at + 0.1)}>{l}</T>
        {i === 0 && <g transform={`translate(${x} 590) scale(${pp(t, at)})`}><Tape x={-150} y={0} cells={["1", "0", "1"]} cw={70} ends={false} p={1} /><HeadBox x={-115 + 70} y={0} cw={70} sc={1} /></g>}
        {i === 1 && <CpuMem x={x} y={590} s={0.7} sc={pp(t, at)} />}{i === 2 && <Desktop x={x - 20} y={610} s={0.8} sc={pp(t, at)} />}
        {i === 3 && <><Laptop x={x - 60} y={630} s={0.55} sc={pp(t, at)} /><Phone x={x + 110} y={600} s={0.6} sc={pp(t, at + 0.1)} /></>}</g>; })}
    <Chip x={960} y={920} text="TURING-COMPLET" c={YEL} fg="#14101f" sc={pp(t, mid(23, 0.7))} s={44} />
    {["Python", "C", "Java", "JavaScript"].map((x, i) => <Chip key={x} x={560 + i * 270} y={1010} text={x} c={SOFT} sc={pp(t, mid(23, 0.78 + i * 0.04))} s={28} />)}
  </>; };

/* ---------- CHAPITRE 2 ---------- */
const CX = 420, CWC = 120, CCELLS = ["_", "_", "1", "0", "1", "1", "0", "_", "_"];
const Parts = (t: number) => { const c0 = S(30) + 1.9, wr = t >= mid(32, 0.5), mv = k(t, mid(32, 0.72), 0.5), hp = 2 + mv, st = t >= mid(33, 0.55) ? "1" : "0";
  const cells = CCELLS.map((c, i) => (i === 2 && wr ? "0" : c)), read = t >= mid(32, 0.25) && t < mid(32, 0.72), dots = [S(31), S(32), S(33), S(34), S(35)].filter((x) => t >= x).length;
  return <>
    <T x={960} y={70} s={44} c={W} sc={pp(t, c0)}>5 COMPOSANTS</T>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={880 + i * 40} cy={120} r={10 * pp(t, c0 + 0.2)} fill={i < dots ? YEL : SOFT} />)}
    <Tape x={CX} y={330} cells={cells} cw={CWC} p={k(t, S(31) + 0.1, 1.0)} hl={read ? { 2: YEL } : t > S(31) + 1.5 && t < S(32) ? { 7: BLUE } : {}} />
    <T x={330} y={460} s={34} c={YEL} f="InterX" sc={pp(t, S(31) + 0.4)} anchor="start">① la bande · infinie dans les deux sens</T>
    <T x={cxOf(CX, 7, CWC)} y={200} s={30} c={BLUE} f="InterX" sc={t < S(32) ? pp(t, S(31) + 1.5) : 0}>un blanc</T>
    <HeadBox x={cxOf(CX, hp, CWC) - (CWC / 2) * 0} y={330} cw={CWC} st={t >= S(33) ? sub("q", st) : undefined} sc={pp(t, S(32) + 0.2)} />
    <T x={cxOf(CX, hp, CWC) + 250} y={175} s={32} c={YEL} f="InterX" sc={pp(t, S(32) + 0.4)}>② tête de lecture / écriture</T>
    {[["lire", 0.25], ["écrire", 0.5], ["se déplacer", 0.72]].map(([l, f], i) => <Chip key={l as string} x={980 + i * 220} y={560} text={l as string} c={t >= mid(32, f as number) ? YEL : SOFT} fg={t >= mid(32, f as number) ? "#14101f" : W} sc={t < S(33) ? pp(t, mid(32, f as number)) : 0} s={30} />)}
    <Card x={130} y={600} w={580} h={330} p={pp(t, S(33) + 0.2)} title="③ ÉTATS · ensemble fini" tc={YEL}>
      {["0", "1", "2"].map((q, i) => <St key={q} x={110 + i * 180} y={150} l={sub("q", q)} r={46} sc={pp(t, S(33) + 0.5 + i * 0.15)} hot={q === st} c={q === st ? YEL : W} />)}
      <St x={200} y={262} l="acc" r={42} ls={24} c={GRN} acc sc={pp(t, S(33) + 1.0)} /><St x={380} y={262} l="rej" r={42} ls={24} c={RED} sc={pp(t, S(33) + 1.1)} /></Card>
    <Card x={760} y={600} w={400} h={330} p={pp(t, S(34) + 0.2)} title="④ ALPHABETS" tc={YEL}>
      <T x={200} y={130} s={44} c={W} f={KM} sc={pp(t, mid(34, 0.3))}>Σ = {"{"} 0, 1 {"}"}</T><T x={200} y={170} s={22} c={DIM} f="InterX" sc={pp(t, mid(34, 0.3))}>entrée</T>
      <T x={200} y={240} s={44} c={W} f={KM} sc={pp(t, mid(34, 0.65))}>Γ = {"{"} 0, 1, ⊔ {"}"}</T><T x={200} y={284} s={22} c={DIM} f="InterX" sc={pp(t, mid(34, 0.65))}>bande (avec le blanc ⊔)</T></Card>
    <Card x={1210} y={600} w={580} h={330} p={pp(t, S(35) + 0.2)} title="⑤ TRANSITION  δ" tc={YEL}>
      {([["0", "1", "1", "0", "D"], ["0", "0", "0", "0", "D"], ["1", "⊔", "acc", "⊔", "G"]] as string[][]).map(([q, a, q2, b, d], i) => { const on = i === 0 && t > mid(35, 0.45);
        return <g key={i}>{on && <rect x={30} y={88 + i * 70} width={520} height={56} rx={12} fill={YEL} opacity={0.18} />}<T x={290} y={116 + i * 70} s={32} c={on ? YEL : W} f={KM} sc={pp(t, mid(35, 0.15 + i * 0.12))}>δ({sub("q", q)}, {a}) = ({sub("q", q2)}, {b}, {d})</T></g>; })}
      <T x={290} y={312} s={22} c={DIM} f="InterX" sc={pp(t, mid(35, 0.7))}>état + symbole lu → quoi écrire, où aller, quel état</T></Card>
  </>; };
const TUP: [React.ReactNode, string][] = [["Q", "états"], ["Σ", "alphabet d’entrée"], ["Γ", "alphabet de ruban"], ["δ", "transition"], [sub("q", "0"), "état initial"], ["B", "blanc"], ["F", "états finals"]];
const Formal = (t: number) => { const D: [number, number][] = [[560, 760], [960, 760], [1380, 760]];
  return <>
    <T x={250} y={200} s={84} c={W} f={KM} sc={pp(t, S(36) + 0.1)}>M = (</T><T x={1800} y={200} s={84} c={W} f={KM} sc={pp(t, mid(36, 0.95))}>)</T>
    {TUP.map(([s, l], i) => { const at = mid(36, 0.16 + i * 0.115), x = 470 + i * 206;
      return <g key={l}><T x={x} y={200} s={80} c={t < at + 0.6 ? YEL : W} f={KM} sc={pp(t, at)}>{s}</T>{i < 6 && <T x={x + 103} y={214} s={70} c={DIM} f={KM} sc={pp(t, at)}>,</T>}
        <T x={x} y={290} s={21} c={DIM} f="InterX" sc={pp(t, at + 0.15)}>{l}</T></g>; })}
    <Card x={360} y={380} w={1200} h={210} c={YEL} p={pp(t, S(37) + 0.1)}>
      <T x={600} y={80} s={66} c={W} f={KM}>δ : Q × Γ → Q × Γ × {"{"}G, D{"}"}</T>
      <Bracket x1={250} x2={500} y={130} p={k(t, mid(37, 0.3), 0.5)} label="état, symbole lu" /><Bracket x1={640} x2={1110} y={130} p={k(t, mid(37, 0.55), 0.5)} label="nouvel état, symbole écrit, direction" /></Card>
    <g opacity={1 - k(t, S(39) - 0.35, 0.35)}><Card x={210} y={620} w={1500} h={410} c={YEL} p={pp(t, S(38) + 0.15)} title="CONFIGURATION :  u q v" tc={YEL}>
      {(() => { const st = t > mid(38, 0.72), hp = 2 + k(t, mid(38, 0.72), 0.4);
        return <><Tape x={110} y={200} cells={["1", "0", st ? "0" : "1", "1", "_"]} cw={100} p={1} hl={{ [Math.round(hp)]: YEL }} />
          <HeadBox x={cxOf(110, hp, 100)} y={200} cw={100} st={sub("q", st ? "2" : "1")} />
          {!st && <><Bracket x1={116} x2={304} y={268} p={k(t, mid(38, 0.2), 0.4)} label="u" /><Bracket x1={316} x2={504} y={268} p={k(t, mid(38, 0.28), 0.4)} label="v" /></>}</>; })()}
      <T x={860} y={130} s={30} c={W} f="InterX" anchor="start" sc={pp(t, mid(38, 0.18))}>le ruban contient u v</T>
      <T x={860} y={180} s={30} c={W} f="InterX" anchor="start" sc={pp(t, mid(38, 0.28))}>la machine est dans l’état q</T>
      <T x={860} y={230} s={30} c={W} f="InterX" anchor="start" sc={pp(t, mid(38, 0.38))}>la tête lit le premier symbole de v</T>
      <T x={1060} y={318} s={46} c={YEL} f={KM} sc={pp(t, mid(38, 0.6))}>{"10 "}{sub("q", "1")}{" 11   ⊢   100 "}{sub("q", "2")}{" 1"}</T>
      <T x={1060} y={370} s={24} c={DIM} f="InterX" sc={pp(t, mid(38, 0.78))}>une étape de calcul</T></Card></g>
    <St x={D[0][0]} y={D[0][1]} l={sub("q", "0")} init sc={pp(t, S(39) + 0.1)} /><St x={D[1][0]} y={D[1][1]} l={sub("q", "1")} sc={pp(t, S(39) + 0.3)} />
    <St x={D[2][0]} y={D[2][1]} l={sub("q", "acc")} ls={28} acc c={GRN} sc={pp(t, S(39) + 0.5)} />
    <Arr a={D[0]} b={D[1]} p={k(t, mid(39, 0.3), 0.6)} label="1 → 0, D" bend={-40} lo={40} /><Arr a={D[1]} b={D[2]} p={k(t, mid(39, 0.45), 0.6)} label="⊔ → ⊔, G" bend={-40} lo={40} c={GRN} />
    <SelfLoop x={D[0][0]} y={D[0][1]} p={k(t, mid(39, 0.55), 0.6)} label="0 → 0, D" up={false} /><SelfLoop x={D[1][0]} y={D[1][1]} p={k(t, mid(39, 0.62), 0.6)} label="1 → 1, D" up={false} />
    <Chip x={1640} y={660} text="lu → écrit, direction" c={YEL} fg="#14101f" sc={pp(t, mid(39, 0.78))} s={32} />
    <Mark x={(D[0][0] + D[1][0]) / 2} y={D[0][1] - 80} rx={130} ry={44} p={k(t, mid(39, 0.85), 0.5)} c={YEL} w={6} seed={3} />
  </>; };
const RX = 600, RCW = 120;
const Run = (t: number) => { const taus = [0.24, 0.38, 0.52].map((f) => mid(45, f)), ex = t >= S(45);
  const cells = ["_", "1", "0", "1", "_", "_"].map((c, i) => (ex && i >= 1 && i <= 3 && t > taus[i - 1] + 0.15 ? (c === "1" ? "0" : "1") : c));
  const hp = 1 + (ex ? taus.reduce((a, x) => a + k(t, x + 0.25, 0.3), 0) : 0), acc = ex && t > mid(45, 0.8);
  const cyc = ["lire", "appliquer la règle", "écrire", "se déplacer", "changer d’état"], ci = Math.floor(((t - S(41)) / (E(41) - S(41))) * 5);
  return <>
    <g opacity={1 - k(t, S(45), 0.4)}>{cyc.map((c, i) => <g key={c}><Chip x={250 + i * 355} y={140} text={c} c={t >= S(41) && i === ci % 5 ? YEL : SOFT} fg={t >= S(41) && i === ci % 5 ? "#14101f" : W} sc={pp(t, S(41) + 0.1 + i * 0.15)} s={32} />
      {i < 4 && <Head x={430 + i * 355} y={140} p={k(t, S(41) + 0.3 + i * 0.15)} c={DIM} s={0.5} />}</g>)}
      <Draw d="M1670 175 Q1670 225 960 225 Q250 225 250 175" p={k(t, S(41) + 1.0, 0.6)} c={DIM} w={4} dash="10 10" /><T x={960} y={258} s={28} c={DIM} f="InterX" sc={pp(t, S(41) + 1.3)}>puis elle recommence ↺</T></g>
    <Card x={560} y={110} w={800} h={230} c={YEL} p={ex ? pp(t, S(45) + 0.2) : 0} title="EXEMPLE : INVERSER LES BITS" tc={YEL}>
      {[["0", "1", "0"], ["1", "0", "0"], ["⊔", "⊔", "acc"]].map(([a, b, q], i) => <T key={i} x={400} y={102 + i * 42} s={30} c={W} f={KM}>{sub("q", "0")}, {a} → {sub("q", q)}, {b}, {i < 2 ? "D" : "G"}</T>)}</Card>
    <Tape x={RX} y={480} cells={cells} cw={RCW} p={k(t, S(40) + 0.1, 0.9)} hl={acc ? { 4: GRN } : { [Math.round(hp)]: YEL }} />
    <HeadBox x={cxOf(RX, hp, RCW)} y={480} cw={RCW} st={acc ? "acc" : sub("q", "0")} c={acc ? GRN : YEL} sc={pp(t, mid(40, 0.45))} />
    <Chip x={cxOf(RX, 1, RCW)} y={590} text="état initial" c={SOFT} sc={!ex ? pp(t, mid(40, 0.75)) : 0} s={28} />
    <Chip x={960} y={600} text="ACCEPTÉ  ·  1 0 1  →  0 1 0" c={GRN} fg="#0b1a10" sc={acc ? pp(t, mid(45, 0.82)) : 0} s={38} />
    <Card x={130} y={660} w={700} h={300} p={!ex ? pp(t, S(42) + 0.2) * (1 - k(t, S(44) - 0.3, 0.35)) : 0} title="ÉTAT INITIAL · ÉTATS FINAUX" tc={YEL}>
      <St x={160} y={180} l={sub("q", "0")} init sc={pp(t, S(42) + 0.4)} /><T x={160} y={262} s={24} c={DIM} f="InterX" sc={pp(t, S(42) + 0.5)}>unique : tout commence ici</T>
      <St x={400} y={170} l="acc" ls={26} acc c={GRN} sc={pp(t, mid(42, 0.5))} /><St x={580} y={170} l="rej" ls={26} c={RED} sc={pp(t, mid(42, 0.55))} />
      <T x={490} y={262} s={26} c={YEL} sc={pp(t, mid(42, 0.75))}>→ LA MACHINE S’ARRÊTE</T></Card>
    <Card x={1000} y={660} w={790} h={300} p={!ex ? pp(t, S(43) + 0.2) * (1 - k(t, S(44) - 0.3, 0.35)) : 0} title="RÉSULTAT" tc={YEL}>
      {([[GRN, "s’arrête dans acc", "ACCEPTÉ", true], [RED, "s’arrête dans rej", "REJETÉ", false]] as [string, string, string, boolean][]).map(([c, a, b, ok], i) => <g key={b} opacity={k(t, mid(43, 0.1 + i * 0.25), 0.3)}>
        <Tick x={70} y={112 + i * 64} ok={ok} sc={1} s={0.9} /><T x={110} y={112 + i * 64} s={30} c={W} f="InterX" anchor="start">{a}</T><T x={720} y={112 + i * 64} s={34} c={c} anchor="end">{b}</T></g>)}
      <g opacity={k(t, mid(43, 0.72), 0.3)}><T x={70} y={240} s={46} c={YEL} f={KM}>∞</T><T x={110} y={240} s={30} c={W} f="InterX" anchor="start">ne s’arrête jamais</T><T x={720} y={240} s={34} c={YEL} anchor="end">BOUCLE</T></g></Card>
    <Card x={160} y={640} w={1600} h={350} c={YEL} p={pp(t, S(44) + 0.15)} title="DEUX FAMILLES DE LANGAGES" tc={YEL}>
      <line x1={800} x2={800} y1={95} y2={320} stroke={LINE} strokeOpacity={0.3} strokeWidth={2} />
      <g opacity={k(t, S(44) + 0.4, 0.4)}><T x={400} y={125} s={40} c={GRN}>RÉCURSIF (DÉCIDABLE)</T><T x={400} y={190} s={30} c={W} f="InterX">une machine s’arrête sur toute entrée</T>
        <Chip x={300} y={275} text="accepte" c={GRN} fg="#0b1a10" s={28} sc={pp(t, mid(44, 0.3))} /><Chip x={500} y={275} text="rejette" c={RED} s={28} sc={pp(t, mid(44, 0.34))} /></g>
      <g opacity={k(t, mid(44, 0.48), 0.4)}><T x={1200} y={125} s={40} c={YEL}>RÉCURSIVEMENT ÉNUMÉRABLE</T><T x={1200} y={190} s={30} c={W} f="InterX">une machine accepte exactement ses mots</T>
        <Chip x={1080} y={275} text="accepte" c={GRN} fg="#0b1a10" s={28} sc={pp(t, mid(44, 0.62))} /><Chip x={1320} y={275} text="peut boucler ∞" c={SOFT} s={28} sc={pp(t, mid(44, 0.66))} /></g></Card>
  </>; };
/* ---------- CHAPITRE 3 ---------- */
type TN = { x: number; y: number; p: number; f: number; s?: "ok" | "ko" };
const TREE: TN[] = [{ x: 1410, y: 330, p: -1, f: 0 }, { x: 1170, y: 470, p: 0, f: 0.1 }, { x: 1410, y: 470, p: 0, f: 0.12 }, { x: 1650, y: 470, p: 0, f: 0.14 },
  { x: 1090, y: 610, p: 1, f: 0.25, s: "ko" }, { x: 1250, y: 610, p: 1, f: 0.27 }, { x: 1410, y: 610, p: 2, f: 0.29, s: "ko" }, { x: 1580, y: 610, p: 3, f: 0.31 }, { x: 1720, y: 610, p: 3, f: 0.33, s: "ko" },
  { x: 1200, y: 750, p: 5, f: 0.42, s: "ko" }, { x: 1300, y: 750, p: 5, f: 0.44, s: "ko" }, { x: 1580, y: 750, p: 7, f: 0.46, s: "ok" }];
const Det = (t: number) => { const c0 = S(48) + 1.9, path = new Set([0, 3, 7, 11]), hi = t > mid(49, 0.66);
  return <>
    <T x={510} y={150} s={52} c={W} sc={pp(t, c0)}>DÉTERMINISTE</T><Chip x={510} y={225} text="(état, symbole) → au plus 1 règle" c={SOFT} sc={pp(t, mid(48, 0.4))} s={28} />
    {[0, 1, 2, 3, 4].map((i) => { const at = mid(48, 0.5 + i * 0.09), y = 330 + i * 125, last = i === 4;
      return <g key={i}>{i > 0 && <Arr a={[510, y - 125]} b={[510, y]} r={40} p={k(t, at - 0.05, 0.3)} />}<St x={510} y={y} l={last ? "acc" : <>C{sub("", `${i}`)}</>} r={40} ls={last ? 24 : 30} c={last ? GRN : W} acc={last} sc={pp(t, at)} /></g>; })}
    <T x={700} y={580} s={30} c={DIM} f="InterX" sc={pp(t, mid(48, 0.8))} anchor="start">un seul chemin</T>
    <T x={1410} y={150} s={52} c={W} sc={pp(t, S(49) + 0.1)}>NON DÉTERMINISTE</T><Chip x={1410} y={225} text="(état, symbole) → plusieurs choix" c={SOFT} sc={pp(t, S(49) + 0.4)} s={28} />
    {TREE.map((n, i) => { const at = mid(49, n.f + 0.05), on = hi && path.has(i), c = n.s === "ok" ? GRN : n.s === "ko" ? RED : on ? GRN : W;
      return <g key={i}>{n.p >= 0 && <Arr a={[TREE[n.p].x, TREE[n.p].y]} b={[n.x, n.y]} r={30} p={k(t, at - 0.05, 0.3)} c={on ? GRN : LINE} w={on ? 6 : 4} />}
        <St x={n.x} y={n.y} r={30} l={n.s === "ok" ? "✓" : n.s === "ko" ? "✗" : ""} ls={30} lf="InterX" c={c} hot={on} sc={pp(t, at)} /></g>; })}
    <Chip x={1410} y={880} text="accepté si AU MOINS UNE branche accepte" c={GRN} fg="#0b1a10" sc={pp(t, mid(49, 0.72))} s={32} />
  </>; };
const Variants = (t: number) => { const hm = (j: number) => bounce(Math.max(0, t - S(50) - 0.5 + j * 0.31), 0.5 + j * 0.13, 0, 5), h2 = [bounce(Math.max(0, t - S(51)), 0.55, 0, 3), bounce(Math.max(0, t - S(51) + 0.2), 0.7, 4, 7)];
  return <>
    <Card x={90} y={80} w={840} h={470} p={pp(t, S(50) + 0.1)} title="PLUSIEURS BANDES" tc={YEL}>
      {[0, 1, 2].map((j) => <g key={j}><Tape x={180} y={170 + j * 105} cells={["1", "0", "_", "1", "1", "0"].map((c, i) => ((i + j) % 4 === 0 ? "_" : c))} cw={80} ends={false} p={k(t, S(50) + 0.3 + j * 0.2, 0.6)} hl={{ [Math.round(hm(j))]: YEL }} />
        <path d={`M${cxOf(180, hm(j), 80) - 12} ${130 + j * 105 - 6} h24 l-12 16 z`} fill={YEL} opacity={k(t, S(50) + 0.8)} /><T x={110} y={170 + j * 105} s={26} c={DIM} f="InterX">{j + 1}</T></g>)}
      <T x={420} y={438} s={28} c={W} f="InterX" sc={pp(t, mid(50, 0.62))}>une seule bande peut la simuler : temps ≤ {sup("t", "2")}</T></Card>
    <Card x={990} y={80} w={840} h={470} p={pp(t, S(51) + 0.1)} title="PLUSIEURS TÊTES" tc={YEL}>
      <Tape x={75} y={260} cells={["1", "0", "1", "1", "_", "0", "1", "0"]} cw={86} ends={false} p={k(t, S(51) + 0.3, 0.6)} hl={{ [Math.round(h2[0])]: YEL, [Math.round(h2[1])]: W }} />
      <HeadBox x={cxOf(75, h2[0], 86)} y={260} cw={86} st="1" sc={pp(t, S(51) + 0.6)} /><HeadBox x={cxOf(75, h2[1], 86)} y={260} cw={86} st="2" c={W} sc={pp(t, S(51) + 0.8)} />
      <T x={420} y={400} s={28} c={W} f="InterX" sc={pp(t, mid(51, 0.6))}>une même bande, des positions différentes</T></Card>
    <Card x={160} y={610} w={1600} h={380} c={YEL} p={pp(t, S(52) + 0.1)} title="LA MACHINE UNIVERSELLE  U" tc={YEL}>
      <Tape x={60} y={200} cells={["1", "0", "1", "1", "0", "#", "w"]} cw={76} ends={false} p={k(t, mid(52, 0.2), 0.6)} />
      <Bracket x1={64} x2={436} y={256} p={k(t, mid(52, 0.3), 0.5)} label="description de M" /><T x={60 + 6.5 * 76} y={300} s={28} c={YEL} f={KM} sc={pp(t, mid(52, 0.35))}>mot</T>
      <Draw d="M620 200 H700" p={k(t, mid(52, 0.4), 0.3)} c={W} w={5} /><Head x={706} y={200} p={k(t, mid(52, 0.4), 0.3)} c={W} s={0.6} />
      <g transform={`translate(860 200) scale(${pp(t, mid(52, 0.42))})`}><rect x={-140} y={-110} width={280} height={220} rx={26} fill={SOFT} stroke={YEL} strokeWidth={5} /><Gear x={-40} y={0} r={40} a={t * 60} c={DIM} /><T x={55} y={0} s={90} c={YEL}>U</T></g>
      <Draw d="M1010 200 H1090" p={k(t, mid(52, 0.5), 0.3)} c={W} w={5} /><Head x={1096} y={200} p={k(t, mid(52, 0.5), 0.3)} c={W} s={0.6} />
      <T x={1330} y={180} s={34} c={W} f="InterX" sc={pp(t, mid(52, 0.55))}>ce que ferait M</T><T x={1330} y={228} s={34} c={W} f="InterX" sc={pp(t, mid(52, 0.58))}>sur le mot w</T>
      <Chip x={800} y={340} text="= le programme stocké en mémoire" c={YEL} fg="#14101f" sc={pp(t, mid(52, 0.75))} s={32} /></Card>
  </>; };
const CMP: [string, string, string][] = [["déterministe", "✓", "référence"], ["non déterministe", "✓", "exponentiel"], ["plusieurs bandes", "✓", "quadratique"], ["plusieurs têtes", "✓", "polynomial"], ["universelle", "✓", "simule toute MT"]];
const Compare = (t: number) => <>
  <Card x={110} y={110} w={1120} h={760} p={pp(t, S(57) + 0.1)} title="COMPARAISON" tc={YEL}>
    <T x={60} y={130} s={26} c={DIM} f="InterX" anchor="start">modèle</T><T x={560} y={130} s={26} c={DIM} f="InterX">puissance</T><T x={890} y={130} s={26} c={DIM} f="InterX">coût de la simulation</T>
    {CMP.map(([a, b, c], i) => { const at = mid(57, 0.12 + i * 0.1), y = 220 + i * 105, hot = i === 1 && t > S(58);
      return <g key={a} opacity={k(t, at, 0.3)}>{hot && <rect x={30} y={y - 42} width={1060} height={84} rx={14} fill={RED} opacity={0.15} />}<line x1={40} x2={1080} y1={y + 52} y2={y + 52} stroke={LINE} strokeOpacity={0.15} strokeWidth={2} />
        <T x={60} y={y} s={36} c={W} f="InterX" anchor="start">{a}</T><Tick x={560} y={y} ok sc={pp(t, mid(57, 0.6 + i * 0.04))} s={0.9} /><T x={890} y={y} s={32} c={hot ? RED : DIM} f="InterX" sc={pp(t, mid(57, 0.8))}>{c}</T></g>; })}
    <Chip x={560} y={720} text="même puissance · efficacité différente" c={YEL} fg="#14101f" sc={pp(t, mid(57, 0.65))} s={32} /></Card>
  <g opacity={k(t, S(58) + 0.2, 0.4)}>
    {[[1440, 250], [1380, 340], [1500, 340], [1340, 430], [1420, 430], [1480, 430], [1560, 430]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={14} fill={i === 6 ? GRN : W} />)}
    <path d="M1440 250 L1380 340 L1340 430 M1380 340 L1420 430 M1440 250 L1500 340 L1480 430 M1500 340 L1560 430" stroke={LINE} strokeWidth={3} fill="none" />
    <T x={1450} y={180} s={30} c={W} f="InterX">non déterministe : t étapes</T>
    <Draw d="M1450 480 V560" p={k(t, mid(58, 0.25), 0.3)} c={RED} w={6} /><Head x={1450} y={566} p={k(t, mid(58, 0.25), 0.3)} c={RED} a={90} s={0.7} />
    {Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={1300 + (i % 7) * 50} cy={620 + Math.floor(i / 7) * 50} r={12} fill={W} opacity={k(t, mid(58, 0.3 + i * 0.02), 0.2)} />)}
    <T x={1450} y={760} s={30} c={W} f="InterX" sc={pp(t, mid(58, 0.35))}>déterministe : jusqu’à</T><T x={1450} y={820} s={56} c={RED} f={KM} sc={pp(t, mid(58, 0.45))}>{sup("2", "O(t)")}{"\u00a0"}étapes</T></g>
  <T x={1450} y={940} s={74} c={YEL} sc={pp(t, mid(58, 0.8))} glow={YEL}>P vs NP ?</T>
</>;

/* ---------- CHAPITRE 4 ---------- */
const MTBox: React.FC<{ x: number; y: number; sc: number; c?: string; label?: string }> = ({ x, y, sc, c = W, label = "MT" }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-90} y={-62} width={180} height={124} rx={20} fill={SOFT} stroke={c} strokeWidth={4} /><T x={0} y={-20} s={34} c={c}>{label}</T>
    {[0, 1, 2, 3].map((i) => <rect key={i} x={-60 + i * 30} y={14} width={26} height={26} rx={4} fill="none" stroke={DIM} strokeWidth={2} />)}</g>);
const CalcBase = (t: number) => { const c0 = S(59) + 1.9;
  return <>
    <Card x={100} y={80} w={820} h={340} p={pp(t, c0)} title="CALCULABLE" tc={YEL}>
      <T x={100} y={190} s={44} c={W} f={KI} it sc={pp(t, c0 + 0.4)}>x</T><Draw d="M140 190 H270" p={k(t, c0 + 0.5, 0.3)} c={W} w={5} /><Head x={276} y={190} p={k(t, c0 + 0.5, 0.3)} c={W} s={0.6} />
      <MTBox x={410} y={190} sc={pp(t, c0 + 0.6)} /><Draw d="M510 190 H640" p={k(t, mid(59, 0.6), 0.3)} c={W} w={5} /><Head x={646} y={190} p={k(t, mid(59, 0.6), 0.3)} c={W} s={0.6} />
      <T x={730} y={190} s={44} c={GRN} f={KM} sc={pp(t, mid(59, 0.7))}>f(x)</T><Chip x={410} y={300} text="pour toute entrée : s’arrête + bon résultat" c={GRN} fg="#0b1a10" sc={pp(t, mid(59, 0.8))} s={26} /></Card>
    <Card x={100} y={470} w={820} h={440} p={pp(t, S(61) + 0.1)} title="DÉCIDABLE  /  INDÉCIDABLE" tc={YEL}>
      <MTBox x={200} y={200} sc={pp(t, S(61) + 0.4)} c={GRN} /><Chip x={420} y={160} text="OUI" c={GRN} fg="#0b1a10" sc={pp(t, mid(61, 0.3))} s={32} /><Chip x={420} y={240} text="NON" c={GRN} fg="#0b1a10" sc={pp(t, mid(61, 0.35))} s={32} />
      <T x={620} y={200} s={30} c={W} f="InterX" sc={pp(t, mid(61, 0.42))}>toujours, et s’arrête</T>
      <line x1={60} x2={760} y1={300} y2={300} stroke={LINE} strokeOpacity={0.2} strokeWidth={2} />
      <T x={200} y={370} s={40} c={RED} sc={pp(t, mid(61, 0.75))}>INDÉCIDABLE</T><T x={560} y={370} s={30} c={W} f="InterX" sc={pp(t, mid(61, 0.8))}>aucune machine ne le peut</T></Card>
    <g opacity={k(t, S(64), 0.4)}>
      <rect x={1000} y={90} width={820} height={620} rx={30} fill="none" stroke={LINE} strokeOpacity={0.3} strokeWidth={3} strokeDasharray="12 10" /><T x={1410} y={135} s={28} c={DIM} f="InterX">tous les langages</T>
      <Ring cx={1410} cy={400} rx={340} ry={250} p={k(t, S(64) + 0.3, 0.8)} c={W} /><T x={1410} y={215} s={34} c={W} sc={pp(t, S(64) + 0.6)}>RECONNAISSABLES</T>
      <Ring cx={1410} cy={440} rx={180} ry={110} p={k(t, mid(64, 0.55), 0.7)} c={GRN} fo={0.14} /><T x={1410} y={440} s={34} c={GRN} sc={pp(t, mid(64, 0.6))}>DÉCIDABLES</T>
      <Chip x={1410} y={600} text="accepte ses mots · peut boucler ∞ sur les autres" c={SOFT} sc={pp(t, mid(64, 0.35))} s={24} />
      <T x={1410} y={680} s={30} c={YEL} f="InterX" sc={pp(t, mid(64, 0.85))}>décidable ⇒ reconnaissable</T></g>
    <Card x={1000} y={770} w={820} h={200} c={YEL} p={pp(t, S(66) + 0.2)}><T x={410} y={50} s={30} c={DIM} f="InterX">thèse de Church–Turing</T>
      <T x={410} y={120} s={40} c={W} f="InterX">algorithme <tspan fill={YEL}>⇔</tspan> machine de Turing</T><T x={410} y={168} s={30} c={DIM} f="InterX">qui s’arrête toujours</T></Card>
  </>; };
const Halt = (t: number) => { const a0 = S(69), say = (f: number) => k(t, mid(69, f), 0.3), boom = t > mid(69, 0.88);
  return <>
    <g transform="translate(480 250)" opacity={1 - k(t, S(69), 0.5)}><Doc x={-170} y={0} s={0.55} sc={pp(t, S(68) + 0.1)} title="programme P" /><T x={-20} y={0} s={60} c={W} f={KM} sc={pp(t, S(68) + 0.3)}>+</T>
      <T x={60} y={0} s={60} c={W} f={KI} it sc={pp(t, S(68) + 0.4)}>w</T><Chip x={330} y={-50} text="va-t-il s’arrêter ?" c={YEL} fg="#14101f" sc={pp(t, mid(68, 0.3))} s={34} />
      <g transform={`translate(330 40) rotate(${t * 140})`} opacity={k(t, mid(68, 0.35))}><circle r={34} fill="none" stroke={DIM} strokeWidth={5} /><path d="M0 0 V-24" stroke={W} strokeWidth={5} strokeLinecap="round" /></g></g>
    <T x={960} y={110} s={44} c={RED} sc={t < S(69) + 0.3 ? pp(t, mid(68, 0.75)) * (1 - k(t, S(69), 0.3)) : 0}>AUCUNE MACHINE NE PEUT RÉPONDRE DANS TOUS LES CAS</T>
    <g opacity={k(t, a0, 0.4) * (1 - 0.8 * k(t, S(70) - 0.1, 0.5))}>
      <g transform={`translate(470 620) scale(${pp(t, a0 + 0.2)})`}><rect x={-150} y={-100} width={300} height={200} rx={26} fill={SOFT} stroke={boom ? RED : W} strokeWidth={5} /><T x={0} y={0} s={100} c={boom ? RED : W}>H</T></g>
      <T x={210} y={620} s={34} c={W} f={KM} sc={pp(t, a0 + 0.4)}>⟨P⟩, w</T>
      <Chip x={740} y={560} text="s’arrête" c={SOFT} sc={pp(t, mid(69, 0.08))} s={28} /><Chip x={740} y={680} text="boucle" c={SOFT} sc={pp(t, mid(69, 0.1))} s={28} />
      <rect x={1000} y={330} width={760} height={460} rx={30} fill="none" stroke={YEL} strokeWidth={5} opacity={k(t, mid(69, 0.15))} /><T x={1380} y={375} s={44} c={YEL} sc={pp(t, mid(69, 0.15))}>D</T>
      <g transform={`translate(1200 560) scale(${pp(t, mid(69, 0.2))})`}><rect x={-90} y={-70} width={180} height={140} rx={20} fill={SOFT} stroke={W} strokeWidth={4} /><T x={0} y={0} s={60} c={W}>H</T></g>
      <Arr a={[1200, 560]} b={[1560, 470]} r={100} p={say(0.27)} label="« s’arrête »" ls={24} lo={26} bend={-20} /><Arr a={[1200, 560]} b={[1560, 660]} r={100} p={say(0.32)} label="« boucle »" ls={24} lo={26} bend={20} />
      <g transform="translate(1640 470)" opacity={say(0.3)}><circle r={36} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="160 60" transform={`rotate(${t * 300})`} /><T x={0} y={2} s={36} c={RED} f={KM}>∞</T></g>
      <Chip x={1640} y={660} text="STOP" c={RED} sc={pp(t, mid(69, 0.35))} s={30} />
      <Draw d="M1380 790 Q1380 900 1000 900 Q900 900 900 560 L1050 560" p={say(0.4)} c={YEL} w={5} dash="14 12" /><T x={1150} y={940} s={30} c={YEL} f="InterX" sc={pp(t, mid(69, 0.42))}>D reçoit sa propre description ⟨D⟩</T>
      <T x={1380} y={250} s={36} c={W} f="InterX" sc={pp(t, mid(69, 0.55))}>D s’arrête <tspan fill={RED}>⇒</tspan> D boucle</T><T x={1380} y={300} s={36} c={W} f="InterX" sc={pp(t, mid(69, 0.68))}>D boucle <tspan fill={RED}>⇒</tspan> D s’arrête</T>
      <Mark x={1380} y={275} rx={330} ry={70} p={k(t, mid(69, 0.78), 0.5)} c={RED} w={7} seed={4} /><Chip x={960} y={180} text="CONTRADICTION" c={RED} sc={pp(t, mid(69, 0.8))} s={40} />
      {boom && <g transform={`translate(470 620) scale(${pp(t, mid(69, 0.88))})`}><path d="M-150 -110 L150 110 M150 -110 L-150 110" stroke={RED} strokeWidth={16} strokeLinecap="round" /><T x={0} y={170} s={40} c={RED}>H N’EXISTE PAS</T></g>}</g>
    <Card x={460} y={290} w={1000} h={330} c={YEL} p={t < S(71) - 0.2 ? pp(t, S(70) + 0.15) : 0} title="DIAGONALISATION" tc={YEL}>
      <g transform="translate(150 200)">{Array.from({ length: 16 }).map((_, i) => { const r = Math.floor(i / 4), c = i % 4; return <rect key={i} x={-80 + c * 40} y={-80 + r * 40} width={36} height={36} rx={5} fill={r === c ? YEL : SOFT} opacity={r === c ? k(t, mid(70, 0.15 + r * 0.06), 0.2) : 1} />; })}</g>
      <T x={620} y={130} s={32} c={W} f="InterX">inspirée de Cantor et de Gödel</T>
      <Chip x={500} y={230} text="reconnaissable ✓" c={GRN} fg="#0b1a10" sc={pp(t, mid(70, 0.55))} s={30} /><Chip x={790} y={230} text="décidable ✗" c={RED} sc={pp(t, mid(70, 0.65))} s={30} /></Card>
    <Card x={360} y={280} w={1200} h={350} c={RED} p={t < S(72) - 0.2 ? pp(t, S(71) + 0.15) : 0} title="THÉORÈME DE RICE" tc={RED}>
      <T x={600} y={125} s={34} c={W} f="InterX">toute propriété non triviale du comportement</T><T x={600} y={175} s={34} c={W} f="InterX">d’un programme est indécidable</T>
      <g transform="translate(200 270)" opacity={k(t, mid(71, 0.55))}><circle r={34} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="150 64" transform={`rotate(${t * 240})`} /><T x={0} y={2} s={36} c={RED} f={KM}>∞</T></g>
      <T x={640} y={270} s={30} c={YEL} f="InterX" sc={pp(t, mid(71, 0.55))}>aucun outil ne détectera toutes les boucles infinies</T></Card>
    <Card x={460} y={680} w={1000} h={220} c={YEL} p={pp(t, S(73) + 0.15)} title="LIMITES PRATIQUES" tc={YEL}>
      <T x={500} y={110} s={32} c={W} f="InterX">décidable, mais trop de temps ou de mémoire</T>
      <Chip x={500} y={170} text="→ chapitre 5 : la complexité" c={SOFT} sc={pp(t, mid(73, 0.6))} s={28} /></Card>
    <Card x={560} y={430} w={800} h={160} c={RED} p={pp(t, S(72) + 0.2)}><T x={400} y={52} s={40} c={RED}>LIMITE FONDAMENTALE</T><T x={400} y={110} s={30} c={W} f="InterX">temps ∞ + mémoire ∞ → toujours impossible</T></Card>
  </>; };

/* ---------- CHAPITRE 5 ---------- */
const MX = 410, MCW = 110;
const Measure = (t: number) => { const c0 = S(109) + 1.9, run = t >= S(111), tt = Math.max(0, t - S(111) - 0.2), pos = run ? bounce(tt, 0.26, 0, 7) : 0, steps = run ? Math.floor(tt / 0.26) : 0, vis = Math.min(8, run ? Math.min(7, steps) + 1 : 0);
  const hl: Record<number, string> = {}; if (t >= S(112)) for (let i = 0; i < vis; i++) hl[i] = BLUE; hl[Math.round(pos)] = YEL;
  return <>
    <T x={680} y={130} s={60} c={DIM} sc={pp(t, c0)}>résoluble ?</T><Tick x={890} y={130} ok sc={pp(t, c0 + 0.3)} /><Draw d="M960 130 H1070" p={k(t, c0 + 0.5, 0.3)} c={YEL} w={5} /><Head x={1076} y={130} p={k(t, c0 + 0.5, 0.3)} c={YEL} s={0.6} />
    <T x={1290} y={130} s={64} c={YEL} sc={pp(t, c0 + 0.7)}>à quel coût ?</T>
    <Tape x={MX} y={400} cells={["1", "0", "1", "1", "0", "1", "_", "_", "_", "_"]} cw={MCW} p={k(t, S(110) + 0.1, 0.8)} hl={run ? hl : {}} />
    <Bracket x1={MX + 6} x2={MX + 6 * MCW - 6} y={474} p={k(t, mid(110, 0.5), 0.5)} label="n = 6" />
    <HeadBox x={cxOf(MX, pos, MCW)} y={400} cw={MCW} sc={pp(t, S(111) + 0.1)} />
    <Card x={430} y={600} w={500} h={170} c={YEL} p={pp(t, S(111) + 0.3)}><T x={250} y={50} s={30} c={DIM} f="InterX">TEMPS</T><T x={250} y={115} s={56} c={YEL} f={KM}>{steps} transitions</T></Card>
    <Card x={990} y={600} w={500} h={170} c={BLUE} p={pp(t, S(112) + 0.3)}><T x={250} y={50} s={30} c={DIM} f="InterX">ESPACE</T><T x={250} y={115} s={56} c={W} f={KM}>{vis} cases</T></Card>
    <T x={960} y={830} s={28} c={DIM} f="InterX" sc={pp(t, mid(111, 0.6))}>dans le pire des cas, en fonction de n</T>
    <g opacity={k(t, S(113), 0.4)}>{[["processeur lent", "2,0 s"], ["processeur rapide", "0,1 s"]].map(([a, b], i) => <g key={a} transform={`translate(${620 + i * 680} 960)`}>
      <Desktop x={-160} y={10} s={0.55} sc={pp(t, S(113) + 0.2 + i * 0.3)} /><T x={40} y={-24} s={28} c={W} f="InterX" anchor="start">{a}</T><T x={40} y={22} s={30} c={YEL} f={KM} anchor="start">{steps} étapes · {b}</T></g>)}
      <T x={960} y={1050} s={28} c={YEL} f="InterX" sc={pp(t, mid(113, 0.6))}>même nombre d’étapes : seul l’algorithme compte</T></g>
  </>; };
const CLS: [number, number, number, number, string, string, string, number][] = [
  [620, 700, 240, 140, "P", "tri · plus court chemin", "temps polynomial · déterministe", 0],
  [770, 645, 440, 250, "NP", "sudoku · SAT", "vérifiable en temps polynomial", 1],
  [920, 600, 650, 360, "PSPACE", "QBF", "mémoire polynomiale", 2],
  [1030, 560, 830, 460, "EXPTIME", "échecs n × n", "temps exponentiel", 3]];
const Classes = (t: number) => { const at = [mid(116, 0.4), mid(117, 0.15), mid(118, 0.08), mid(118, 0.42)], lx = [620, 1075, 1395, 1700];
  return <>
    {[...CLS].reverse().map(([cx, cy, rx, ry, n, ex, d, i]) => { const on = t >= at[i], cur = on && (i === 3 ? t < mid(118, 0.7) : t < at[i + 1] + 0.4), c = i === 0 ? YEL : cur ? YEL : W;
      return <g key={n}><Ring cx={cx} cy={cy} rx={rx} ry={ry} p={k(t, at[i], 0.8)} c={c} fo={i === 0 ? 0.12 : 0.04} />
        <T x={lx[i]} y={i === 0 ? 670 : cy - 40} s={i === 0 ? 70 : 48} c={c} sc={pp(t, at[i] + 0.3)}>{n}</T><T x={lx[i]} y={i === 0 ? 730 : cy + 14} s={24} c={DIM} f="InterX" sc={pp(t, at[i] + 0.5)}>{ex}</T>
        <T x={lx[i]} y={i === 0 ? 770 : cy + 52} s={20} c={cur ? YEL : DIM} f="InterX" sc={pp(t, at[i] + 0.7)}>{d}</T></g>; })}
    <g opacity={k(t, S(117) + 0.4, 0.4) * (1 - k(t, S(118), 0.4))}><Tick x={1080} y={810} ok sc={1} /><T x={1110} y={810} s={26} c={W} f="InterX" anchor="start">vérifier : rapide</T></g>
    <T x={960} y={70} s={52} c={W} f={KM} sc={pp(t, mid(118, 0.72))}>P ⊆ NP ⊆ PSPACE ⊆ EXPTIME</T>
  </>; };
const SUD = (r: number, c: number) => ((r * 3 + Math.floor(r / 3) + c) % 9) + 1;
const PvsNP = (t: number) => { const f0 = mid(119, 0.18), f1 = mid(119, 0.48), v0 = mid(119, 0.52), v1 = mid(119, 0.68), sweep = (t - v0) / (v1 - v0);
  const curve = (g: (n: number) => number) => { let d = ""; for (let i = 0; i <= 60; i++) { const n = (i / 60) * 10, y = Math.max(-40, 820 - g(n) * 0.58); d += `${i ? "L" : "M"}${1100 + n * 64} ${y} `; } return d; };
  return <>
    <T x={500} y={110} s={52} c={W} sc={pp(t, S(119) + 0.1)}>TROUVER <tspan fill={DIM}>vs</tspan> VÉRIFIER</T>
    <g transform="translate(500 520)" opacity={k(t, S(119) + 0.2, 0.4)}>
      {Array.from({ length: 81 }).map((_, i) => { const r = Math.floor(i / 9), c = i % 9, given = (i * 7) % 5 === 0, ft = f0 + (((i * 37) % 81) / 81) * (f1 - f0), shown = given || t > ft, row = Math.floor(sweep * 9);
        return <g key={i}><rect x={-279 + c * 62} y={-279 + r * 62} width={62} height={62} fill={sweep > 0 && sweep < 1.1 && r <= row ? GRN + "33" : "transparent"} stroke={LINE} strokeOpacity={0.35} strokeWidth={1.5} />
          {shown && <text x={-248 + c * 62} y={-237 + r * 62} fontFamily={KM} fontSize={34} fill={given ? W : YEL} textAnchor="middle">{SUD(r, c)}</text>}</g>; })}
      {[0, 1, 2, 3].map((i) => <g key={i}><line x1={-279 + i * 186} x2={-279 + i * 186} y1={-279} y2={279} stroke={W} strokeWidth={4} /><line y1={-279 + i * 186} y2={-279 + i * 186} x1={-279} x2={279} stroke={W} strokeWidth={4} /></g>)}</g>
    <Chip x={340} y={870} text="trouver : très long" c={SOFT} sc={pp(t, f0)} s={30} /><Chip x={680} y={870} text="vérifier : rapide" c={GRN} fg="#0b1a10" sc={pp(t, v0)} s={30} />
    <T x={500} y={970} s={64} c={YEL} sc={pp(t, mid(119, 0.8))} glow={YEL}>P = NP ?</T>
    <g opacity={k(t, S(120), 0.4)}><Axes ox={1100} oy={820} w={680} h={660} p={k(t, S(120) + 0.1, 0.5)} xl="n" />
      <Draw d={curve((n) => n * n)} p={k(t, mid(120, 0.15), 0.8)} c={W} w={7} /><T x={1760} y={720} s={40} c={W} f={KM} sc={pp(t, mid(120, 0.3))}>{sup("n", "2")}</T>
      <Draw d={curve((n) => 2 ** n)} p={k(t, mid(120, 0.5), 0.8)} c={RED} w={7} glow /><T x={1600} y={160} s={44} c={RED} f={KM} sc={pp(t, mid(120, 0.6))}>{sup("2", "n")}</T>
      <Chip x={1440} y={960} text="+1 élément  →  temps × 2" c={RED} sc={pp(t, mid(120, 0.82))} s={32} /></g>
  </>; };
const NPC = ["sudoku", "coloriage", "sac à dos", "voyageur", "clique", "planning"];
const ReduceBase = (t: number) => <>
  {([[260, "A"], [880, "B"]] as [number, string][]).map(([x, l], i) => <g key={l} transform={`translate(${x} 230) scale(${pp(t, S(121) + 0.1 + i * 0.4)})`}><rect x={-110} y={-80} width={220} height={160} rx={24} fill={SOFT} stroke={i ? YEL : W} strokeWidth={5} /><T x={0} y={0} s={80} c={i ? YEL : W} f={KM}>{l}</T></g>)}
  <Arr a={[260, 230]} b={[880, 230]} r={120} p={k(t, mid(121, 0.12), 0.5)} label="réduction" ls={30} lo={-40} c={YEL} />
  <Arr a={[880, 230]} b={[1380, 230]} r={120} p={k(t, mid(121, 0.25), 0.5)} />
  <g transform={`translate(1450 230) scale(${pp(t, mid(121, 0.27))})`}><Gear x={0} y={0} r={52} a={t * 80} c={DIM} /><T x={0} y={110} s={28} c={W} f="InterX">résoudre B</T></g>
  <Chip x={1710} y={230} text="⇒ A résolu" c={GRN} fg="#0b1a10" sc={pp(t, mid(121, 0.35))} s={32} />
  <g opacity={k(t, mid(121, 0.48), 0.4)}><ellipse cx={600} cy={700} rx={470} ry={250} fill="#ffffff08" stroke={W} strokeWidth={4} /><T x={260} y={500} s={50} c={W}>NP</T>
    {NPC.map((n, i) => { const a = (i / NPC.length) * Math.PI * 2 + 0.3, x = 600 + Math.cos(a) * 330, y = 700 + Math.sin(a) * 170, p = k(t, mid(121, 0.55 + i * 0.04), 0.4);
      return <g key={n}><Arr a={[x, y]} b={[600, 700]} r={0} p={p} c={LINE} w={3} /><Chip x={x} y={y} text={n} c={SOFT} sc={pp(t, mid(121, 0.52 + i * 0.04))} s={24} /></g>; })}
    <g transform={`translate(600 700) scale(${pp(t, mid(121, 0.8))})`}><circle r={86} fill={YEL} style={{ filter: `drop-shadow(0 0 24px ${YEL})` }} /><T x={0} y={2} s={54} c="#14101f">SAT</T></g>
    <Chip x={600} y={1000} text="NP-complet  ·  Cook–Levin, 1971" c={YEL} fg="#14101f" sc={pp(t, mid(121, 0.86))} s={30} /></g>
  <Card x={1210} y={500} w={620} h={440} c={YEL} p={pp(t, S(122) + 0.2)} title="L’ÉTALON" tc={YEL}>
    <rect x={60} y={100} width={500} height={70} rx={10} fill={YEL} opacity={0.9} />{Array.from({ length: 21 }).map((_, i) => <line key={i} x1={70 + i * 24} x2={70 + i * 24} y1={100} y2={i % 5 ? 122 : 136} stroke="#14101f" strokeWidth={3} />)}
    <T x={310} y={240} s={32} c={W} f="InterX">temps = nombre de transitions</T><T x={310} y={300} s={32} c={W} f="InterX">espace = nombre de cases</T>
    <T x={310} y={380} s={28} c={DIM} f="InterX" sc={pp(t, mid(122, 0.6))}>indépendant de la technologie</T></Card>
</>;
/* ---------- CHAPITRE 6 ---------- */
const CODE = ["bande = list(mot) + ['⊔']", "tete, etat = 0, 'q0'", "while etat not in ('acc', 'rej'):", "    etat, s, d = delta[etat, bande[tete]]", "    bande[tete] = s", "    tete += d"];
const EVX = 660, EVCW = 120, EVSEQ = ["pair", "impair", "impair", "pair", "impair"];
const Even = (t: number) => { const c0 = S(124) + 1.9, P: [number, number] = [1140, 330], I: [number, number] = [1600, 330], A: [number, number] = [1140, 520], R: [number, number] = [1600, 520];
  const taus = [0, 1, 2, 3, 4].map((i) => mid(126, 0.06 + i * 0.12)), ix = taus.filter((x) => t >= x).length - 1, run = t >= S(126), cur = run && ix >= 0 ? EVSEQ[ix] : "", rej = run && t > mid(126, 0.72);
  return <>
    <Win x={110} y={110} w={820} h={420} p={pp(t, c0)} title="simulateur.py">
      {CODE.map((l, i) => <text key={i} x={36} y={110 + i * 50} fontFamily="InterX" fontWeight={600} fontSize={25} fill={i === 3 && t > mid(124, 0.7) ? YEL : i < 2 ? DIM : W} xmlSpace="preserve">{typed(l, (t - c0 - 0.3 - i * 0.45) / 0.8)}</text>)}</Win>
    <T x={520} y={580} s={28} c={DIM} f="InterX" sc={pp(t, mid(124, 0.75))}>la table de transitions, exécutée pas à pas</T>
    <T x={1370} y={120} s={36} c={W} sc={pp(t, S(125) + 0.1)}>NOMBRE PAIR DE 1</T>
    <St x={P[0]} y={P[1]} l="pair" ls={26} lf="InterX" init r={56} sc={pp(t, mid(125, 0.3))} hot={cur === "pair" && !rej} c={cur === "pair" && !rej ? YEL : W} />
    <St x={I[0]} y={I[1]} l="impair" ls={24} lf="InterX" r={56} sc={pp(t, mid(125, 0.35))} hot={cur === "impair"} c={cur === "impair" ? YEL : W} />
    <Arr a={P} b={I} bend={-60} p={k(t, mid(125, 0.5), 0.5)} label="1" ls={34} lo={30} /><Arr a={I} b={P} bend={-60} p={k(t, mid(125, 0.55), 0.5)} label="1" ls={34} lo={30} />
    <T x={P[0] - 140} y={P[1] - 90} s={28} c={DIM} f={KM} sc={pp(t, mid(125, 0.78))}>0 : reste</T><T x={I[0] + 140} y={I[1] - 90} s={28} c={DIM} f={KM} sc={pp(t, mid(125, 0.8))}>0 : reste</T>
    <St x={A[0]} y={A[1]} l="acc" ls={24} acc c={GRN} r={42} sc={pp(t, mid(125, 0.65))} /><St x={R[0]} y={R[1]} l="rej" ls={24} c={RED} r={42} hot={rej} sc={pp(t, mid(125, 0.68))} />
    <Arr a={P} b={A} r={50} p={k(t, mid(125, 0.7), 0.4)} label="⊔" ls={28} lo={-26} c={GRN} /><Arr a={I} b={R} r={50} p={k(t, mid(125, 0.72), 0.4)} label="⊔" ls={28} lo={-26} c={RED} />
    <Tape x={EVX} y={800} cells={["1", "0", "1", "1", "_"]} cw={EVCW} p={k(t, S(126) - 0.2, 0.6)} hl={run && ix >= 0 ? { [Math.min(4, ix)]: rej ? RED : YEL } : {}} />
    <HeadBox x={cxOf(EVX, kf(t, taus.map((x, i) => [x, i] as [number, number])), EVCW)} y={800} cw={EVCW} st={cur ? <tspan fontFamily="InterX" fontSize={22}>{cur}</tspan> : undefined} c={rej ? RED : YEL} sc={run ? pp(t, S(126)) : 0} />
    <Chip x={960} y={940} text="3 fois le 1 → impair → REJETÉ" c={RED} sc={rej ? pp(t, mid(126, 0.75)) : 0} s={36} />
  </>; };
/* ---------- CHAPITRE 7 ---------- */
const VsPCBase = (t: number) => { const hop = bounce(Math.max(0, t - S(141) - 0.5), 0.45, 0, 6), jump = k(t, mid(141, 0.75), 0.5);
  return <>
    <T x={500} y={130} s={50} c={W} sc={pp(t, S(141) + 0.1)}>MACHINE DE TURING</T><T x={1420} y={130} s={50} c={W} sc={pp(t, mid(141, 0.4))}>ORDINATEUR RÉEL</T>
    <T x={960} y={450} s={60} c={DIM} sc={pp(t, mid(141, 0.4))}>VS</T>
    <Tape x={110} y={430} cells={["1", "0", "1", "1", "0", "1", "0"]} cw={92} p={k(t, S(141) + 0.2, 0.7)} hl={{ [Math.round(hop)]: YEL }} />
    <HeadBox x={cxOf(110, hop, 92)} y={430} cw={92} sc={pp(t, S(141) + 0.5)} />
    <Chip x={440} y={600} text="bande INFINIE" c={SOFT} sc={pp(t, mid(141, 0.1))} s={34} /><Chip x={440} y={690} text="case par case" c={SOFT} sc={pp(t, mid(141, 0.62))} s={34} />
    <g transform={`translate(1420 400) scale(${pp(t, mid(141, 0.35))})`}><rect x={-300} y={-110} width={600} height={220} rx={16} fill="#1a1a1a" stroke={GRN} strokeWidth={5} />
      {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={-270 + i * 92} y={-78} width={72} height={120} rx={8} fill="#0d0e15" />)}
      {Array.from({ length: 18 }).map((_, i) => <rect key={`p${i}`} x={-284 + i * 32} y={110} width={16} height={26} fill={YEL} />)}<T x={0} y={74} s={30} c={W}>16 Go</T></g>
    <Chip x={1420} y={600} text="mémoire FINIE" c={SOFT} sc={pp(t, mid(141, 0.42))} s={34} />
    <g opacity={k(t, mid(141, 0.68), 0.3)}>{[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={1180 + i * 100} y={740} width={90} height={60} rx={8} fill={i === 4 && jump > 0.9 ? YEL + "44" : PANEL} stroke={i === 4 && jump > 0.9 ? YEL : LINE} strokeWidth={3} />
      <T x={1225 + i * 100} y={770} s={20} c={DIM} f="InterX">{["0", "1", "2", "…", "4096"][i]}</T></g>)}
      <Draw d="M1240 860 Q1420 980 1625 810" p={jump} c={YEL} w={5} /><Head x={1625} y={810} p={jump} c={YEL} a={-60} s={0.6} /><T x={1420} y={990} s={30} c={YEL} f="InterX">accès direct à n’importe quelle adresse</T></g>
  </>; };
const INF: [number, number, string, number][] = [[380, 240, "programme enregistré", 0.08], [1540, 240, "langages Turing-complets", 0.25], [380, 800, "compilateurs", 0.42], [1540, 800, "une machine peut-elle penser ?", 0.6]];
const Influence = (t: number) => <>
  <g transform={`translate(960 520) scale(${pp(t, S(143) + 0.1)})`}><circle r={170} fill={PANEL} stroke={YEL} strokeWidth={5} style={{ filter: `drop-shadow(0 0 24px ${YEL}55)` }} />
    <Tape x={-150} y={20} cells={["1", "0", "1"]} cw={100} ends={false} p={1} /><HeadBox x={-50 + 50} y={20} cw={100} sc={1} /></g>
  {INF.map(([x, y, l, f], i) => { const at = mid(143, f);
    return <g key={l} opacity={1 - 0.5 * k(t, S(144), 0.5)}><Draw d={`M${960 + (x - 960) * 0.2} ${520 + (y - 520) * 0.4} L${x + (960 - x) * 0.25} ${y + (520 - y) * 0.2}`} p={k(t, at, 0.4)} c={LINE} w={3} dash="10 10" />
      {i === 0 && <CpuMem x={x} y={y - 20} s={0.65} sc={pp(t, at)} />}{i === 1 && <T x={x} y={y - 30} s={80} c={W} f={KM} sc={pp(t, at)}>{"{ }"}</T>}{i === 2 && <Gear x={x} y={y - 30} r={44} a={t * 50} c={DIM} />}{i === 3 && <Bulb x={x} y={y - 40} sc={pp(t, at) * 0.8} on={1} />}
      <Chip x={x} y={y + 70} text={l} c={SOFT} sc={pp(t, at + 0.1)} s={30} /></g>; })}
  <T x={1540} y={940} s={24} c={DIM} f="InterX" sc={pp(t, mid(143, 0.7)) * (1 - k(t, S(144), 0.4))}>le test de Turing, 1950</T>
  {([[960, 230, "calculabilité"], [960, 330, "classes de complexité"], [960, 830, "calcul quantique"]] as [number, number, string][]).map(([x, y, l], i) => <Chip key={l} x={x} y={y} text={l} c={YEL} fg="#14101f" sc={pp(t, mid(144, 0.2 + i * 0.22))} s={34} />)}
  <T x={960} y={140} s={36} c={W} sc={pp(t, S(144) + 0.1)}>LA RÉFÉRENCE EN RECHERCHE</T>
  <g transform={`translate(960 940) scale(${pp(t, mid(144, 0.7))})`}><circle r={46} fill="none" stroke={YEL} strokeWidth={4} /><ellipse rx={46} ry={14} fill="none" stroke={YEL} strokeWidth={2} /><path d={`M0 0 L${30 * Math.cos(t * 2)} ${-30 + 6 * Math.sin(t * 2)}`} stroke={W} strokeWidth={4} /></g>
</>;

/* ---------- CONCLUSION ---------- */
const Concl = (t: number) => { const c0 = S(146) + 1.9, fin = k(t, mid(149, 0.55), 0.8);
  return <>
    <g opacity={1 - fin}>
      {([["la bande", 0], ["la tête", 1], ["les états", 2], ["la transition δ", 3]] as [string, number][]).map(([l, i]) => { const x = 330 + i * 420, at = c0 + 0.2 + i * 0.45;
        return <g key={l}>{i === 0 && <Tape x={x - 150} y={230} cells={["1", "0", "1"]} cw={100} ends={false} p={k(t, at, 0.4)} />}{i === 1 && <HeadBox x={x} y={290} sc={pp(t, at)} st={sub("q", "1")} />}
          {i === 2 && <><St x={x - 60} y={230} l={sub("q", "0")} r={40} sc={pp(t, at)} /><St x={x + 60} y={230} l="acc" ls={20} r={40} acc c={GRN} sc={pp(t, at + 0.1)} /></>}{i === 3 && <T x={x} y={230} s={90} c={YEL} f={KM} sc={pp(t, at)}>δ</T>}
          <T x={x} y={330} s={30} c={W} f="InterX" sc={pp(t, at + 0.2)}>{l}</T></g>; })}
      <T x={960} y={430} s={44} c={W} f="InterX" sc={pp(t, mid(146, 0.7))}>même puissance <tspan fill={YEL}>≠</tspan> même efficacité</T>
      <Card x={310} y={520} w={1300} h={170} c={YEL} p={pp(t, S(147) + 0.2)}><T x={650} y={60} s={30} c={DIM} f="InterX">réponse à la problématique</T>
        <T x={650} y={118} s={42} c={W} f="InterX">Ce qu’elle ne peut pas faire, aucun ordinateur ne le peut.</T></Card>
      <T x={700} y={810} s={80} c={W} f={KM} sc={pp(t, S(148) + 0.4)}>P ⊆ NP</T><T x={1240} y={810} s={80} c={YEL} sc={pp(t, mid(148, 0.7))} glow={YEL}>P = NP ?</T>
      <Chip x={960} y={960} text="question ouverte depuis 1971 · plus de 50 ans" c={SOFT} sc={pp(t, S(149) + 0.3)} s={32} /></g>
    {fin > 0 && <g opacity={fin}><T x={960} y={330} s={120} c={W} glow={BLUE}>LA MACHINE DE TURING</T><Squig x={960} y={412} w={860} p={k(t, mid(149, 0.7), 0.5)} c={YEL} />
      <Tape x={685} y={600} cells={["1", "0", "1", "1", "0"]} cw={110} p={1} hl={{ [Math.round(bounce(t, 0.6, 0, 4))]: YEL }} /><HeadBox x={cxOf(685, bounce(t, 0.6, 0, 4), 110)} y={600} cw={110} sc={1} />
      <T x={960} y={760} s={36} c={DIM} f="InterX">une bande · une tête · quelques règles</T></g>}
  </>; };

/* ======================= RAPPORT : scènes ajoutées ou réécrites ======================= */
/** visible from a to b (fades in and out) */
const fade = (t: number, a: number, b: number, d = 0.4) => k(t, a, d) * (1 - k(t, b - d, d));
const Caption: React.FC<{ y?: number; o: number; c?: string; children: React.ReactNode }> = ({ y = 940, o, c = LINE, children }) => o <= 0.001 ? null : (
  <g opacity={o}><rect x={300} y={y - 56} width={1320} height={112} rx={26} fill={PANEL} stroke={c} strokeOpacity={0.6} strokeWidth={3} />{children}</g>);

/* ---------- INTRODUCTION : le contexte (3–6) ---------- */
const Contexte = (t: number) => { const X = [250, 700, 1090, 1570], cur = t < S(4) ? 0 : t < S(5) ? 1 : t < S(6) ? 2 : 3;
  return <>
    <T x={960} y={120} s={46} c={W} sc={pp(t, S(3) + 0.1)}>LE CONTEXTE : LES FONDEMENTS DES MATHÉMATIQUES</T>
    <Draw d="M140 760 H1820" p={k(t, S(3) + 0.2, 1.0)} c={LINE} w={5} />
    {["≈ 1900", "1928", "1931", "1936"].map((y, i) => { const at = i === 0 ? S(3) + 0.5 : S(3 + i) + 0.2;
      return <g key={y}><circle cx={X[i]} cy={760} r={14 * pp(t, at)} fill={i === cur ? YEL : W} /><T x={X[i]} y={812} s={36} c={i === cur ? YEL : W} f={KM} sc={pp(t, at)}>{y}</T></g>; })}
    {["axiomes", "règles logiques", "démonstrations"].map((l, i) => { const at = mid(3, 0.2 + i * 0.15);
      return <g key={l} transform={`translate(${X[0]} ${650 - i * 76}) scale(${pp(t, at)})`}><rect x={-140} y={-32} width={280} height={64} rx={10} fill={SOFT} stroke={i === 2 ? YEL : LINE} strokeWidth={3} /><T x={0} y={0} s={26} c={W} f="InterX">{l}</T></g>; })}
    <Tick x={X[0]} y={380} ok sc={pp(t, mid(3, 0.7))} s={1.3} />
    <Photo x={X[1]} y={545} w={170} h={215} src="hilbert.jpg" sc={pp(t, S(4) + 0.2)} />
    <T x={X[1]} y={330} s={34} c={W} sc={pp(t, S(4) + 0.4)}>DAVID HILBERT</T>
    <Photo x={X[2]} y={545} w={170} h={215} src="godel.jpg" sc={pp(t, S(5) + 0.2)} />
    <T x={X[2]} y={330} s={34} c={W} sc={pp(t, S(5) + 0.4)}>KURT GÖDEL</T>
    <g transform={`translate(${X[3] - 120} 545) scale(${pp(t, S(6) + 0.2)})`}><rect x={-94} y={-116} width={188} height={232} rx={8} fill={SOFT} stroke={LINE} strokeWidth={3} /><T x={0} y={4} s={130} c={YEL} f={KM}>λ</T></g>
    <T x={X[3] - 120} y={312} s={30} c={W} sc={pp(t, S(6) + 0.4)}>ALONZO CHURCH</T><T x={X[3] - 120} y={354} s={26} c={YEL} f={KM} sc={pp(t, mid(6, 0.22))}>λ-calcul</T>
    <Photo x={X[3] + 120} y={545} w={170} h={215} src="turing_1936.jpg" sc={pp(t, mid(6, 0.3))} />
    <T x={X[3] + 120} y={312} s={30} c={W} sc={pp(t, mid(6, 0.32))}>ALAN TURING</T><T x={X[3] + 120} y={354} s={26} c={YEL} f="InterX" sc={pp(t, mid(6, 0.4))}>sa machine</T>
    <Caption o={fade(t, S(3) + 0.6, S(4) - 0.1)}><T x={960} y={940} s={36} c={W} f="InterX">fonder les mathématiques sur des bases <tspan fill={YEL}>parfaitement sûres</tspan></T></Caption>
    <Caption o={fade(t, S(4) + 0.6, S(5) - 0.1)} c={YEL}><T x={960} y={918} s={32} c={W} f="InterX">« Existe-t-il une méthode mécanique pour décider</T><T x={960} y={962} s={32} c={W} f="InterX">si n’importe quel énoncé logique est démontrable ? »</T></Caption>
    <Chip x={X[1]} y={210} text="problème de la décision" c={SOFT} sc={t < S(6) ? pp(t, mid(4, 0.6)) : 0} s={28} />
    <Caption o={fade(t, S(5) + 0.6, S(6) - 0.1)}><T x={960} y={940} s={36} c={W} f="InterX">des énoncés <tspan fill={GRN}>vrais</tspan>… mais <tspan fill={RED}>indémontrables</tspan></T></Caption>
    <Chip x={X[2]} y={210} text="vrai ≠ démontrable" c={SOFT} sc={t < S(6) ? pp(t, mid(5, 0.45)) : 0} s={28} />
    <Caption o={k(t, mid(6, 0.55), 0.4)} c={RED}><T x={960} y={940} s={36} c={W} f="InterX">réponse : <tspan fill={RED}>NON</tspan>, il n’existe pas de méthode mécanique générale</T></Caption>
    <g transform={`translate(${X[3]} 200) rotate(-6) scale(${pp(t, mid(6, 0.62))})`}><rect x={-150} y={-44} width={300} height={88} rx={12} fill="none" stroke={RED} strokeWidth={6} /><T x={0} y={2} s={52} c={RED}>NON</T></g>
  </>; };

/* ---------- CHAPITRE 1 : biographie (10–15) ---------- */
const BIO_Y: [number, number][] = [[10, 1912], [11, 1930], [12, 1931], [13, 1939], [14, 1943], [15, 1945]];
const Bio = (t: number) => { const c0 = S(10) + 1.9, tl = (y: number) => 230 + ((y - 1912) / 42) * 1300;
  const yr = kf(t, [[c0, 1912], [S(11), 1912], [S(11) + 0.8, 1930], [S(12), 1930], [S(12) + 0.6, 1931], [mid(12, 0.35), 1931], [mid(12, 0.45), 1936], [mid(12, 0.7), 1936], [mid(12, 0.8), 1937], [S(13), 1937], [S(13) + 0.8, 1939], [S(14), 1939], [S(14) + 0.8, 1943], [S(15), 1943], [mid(15, 0.1), 1946], [mid(15, 0.32), 1946], [mid(15, 0.4), 1952], [mid(15, 0.5), 1952], [mid(15, 0.6), 1954]]);
  const on = (i: number) => fade(t, S(i) + (i === 10 ? 1.9 : 0.05), i === 15 ? 1e9 : S(i + 1) - 0.05, 0.35);
  return <>
    {([["turing_1928.jpg", c0, S(12), "vers 1928, à 16 ans"], ["turing_1930s.jpg", S(12), mid(12, 0.5), "années 1930"], ["turing_1936.jpg", mid(12, 0.5), S(13), "1936, Princeton"], ["turing_1951.jpg", S(13), 1e9, "1951"]] as [string, number, number, string][]).map(([src, a, b, cap], i) =>
      <Photo key={src} x={330} y={600} w={300} h={380} src={src} sc={i === 0 ? pp(t, c0) : 1} o={i === 0 ? 1 - k(t, b - 0.3, 0.5) : k(t, a - 0.3, 0.5) * (b > 1e8 ? 1 : 1 - k(t, b - 0.3, 0.5))} cap={cap} />)}
    <T x={330} y={230} s={64} c={W} sc={pp(t, c0 + 0.3)}>ALAN TURING</T><T x={330} y={292} s={30} c={DIM} f={KM} sc={pp(t, c0 + 0.6)}>Londres, 23 juin 1912</T>
    {/* timeline */}
    <Draw d={`M${tl(1912)} 960 H${tl(1954)}`} p={k(t, c0 + 0.4, 1.0)} c={LINE} w={5} />
    {t > S(13) && <rect x={tl(1939)} y={948} width={(tl(1945) - tl(1939)) * k(t, S(13) + 0.2, 0.6)} height={24} rx={8} fill={YEL} opacity={0.5} />}
    {([[1912, "naissance"], [1936, "la machine"], [1954, "décès"]] as [number, string][]).map(([y, l], i) => { const at = i === 0 ? c0 + 0.6 : i === 1 ? mid(12, 0.45) : mid(15, 0.6);
      return <g key={y}><circle cx={tl(y)} cy={960} r={11 * pp(t, at)} fill={i === 2 && t > at ? RED : W} /><T x={tl(y)} y={1005} s={24} c={DIM} f="InterX" sc={pp(t, at)}>{l}</T></g>; })}
    <g transform={`translate(${tl(yr)} 960)`} opacity={k(t, c0 + 0.8, 0.4)}><circle r={17} fill={YEL} style={{ filter: `drop-shadow(0 0 12px ${YEL})` }} /><T x={0} y={-46} s={36} c={YEL} f={KM}>{Math.round(yr)}</T></g>
    <g opacity={k(t, mid(15, 0.85), 0.4)}><Draw d={`M${tl(1954) + 30} 960 H${tl(1954) + 120}`} p={1} c={LINE} w={4} dash="8 10" /><circle cx={1780} cy={960} r={14} fill={GRN} /><T x={1780} y={915} s={32} c={GRN} f={KM}>2013</T><T x={1780} y={1005} s={24} c={GRN} f="InterX">réhabilité</T></g>
    {/* 10 : qui était-il */}
    <g opacity={on(10)}>{["génie des mathématiques et des sciences", "mathématicien · logicien", "un des pères de l’informatique"].map((x, i) => <Chip key={x} x={1180} y={360 + i * 120} text={x} c={i === 2 ? YEL : SOFT} fg={i === 2 ? "#14101f" : W} sc={pp(t, mid(10, 0.45 + i * 0.15))} s={38} />)}</g>
    {/* 11 : Christopher Morcom */}
    <g opacity={on(11)}><Card x={720} y={250} w={1000} h={440} c={LINE} p={pp(t, S(11) + 0.15)} title="1930 · CHRISTOPHER MORCOM" tc={W}>
      <T x={500} y={130} s={30} c={DIM} f="InterX">un élève jugé « brouillon »</T>
      <T x={200} y={250} s={30} c={W} f="InterX">Christopher</T><T x={200} y={292} s={30} c={W} f="InterX">Morcom</T><T x={200} y={334} s={24} c={DIM} f={KM}>1911 – 1930</T>
      <path d="M470 270 q30 -40 60 0 q30 -40 60 0 q0 40 -60 70 q-60 -30 -60 -70 z" fill={RED} opacity={0.85 * k(t, mid(11, 0.35), 0.4)} transform="translate(-150 0)" />
      <T x={480} y={250} s={30} c={W} f="InterX" anchor="start">la mort de son ami</T><T x={480} y={295} s={30} c={W} f="InterX" anchor="start">le marque profondément</T>
      <Chip x={500} y={385} text="→ sa détermination se renforce" c={YEL} fg="#14101f" sc={pp(t, mid(11, 0.65))} s={32} /></Card></g>
    {/* 12 : Cambridge, l'article, Princeton */}
    <g opacity={on(12)}>{([[1931, "King’s College", "Cambridge"], [1936, "article fondateur", "les nombres calculables"], [1936, "doctorat à Princeton", "avec Alonzo Church"]] as [number, string, string][]).map(([y, a, b], i) => { const at = mid(12, 0.05 + i * 0.3), x = 700 + i * 380;
      return <Card key={a} x={x} y={260} w={350} h={470} c={i === 1 ? YEL : LINE} p={pp(t, at)}>
        <T x={175} y={60} s={54} c={YEL} f={KM}>{i === 2 ? "1936–38" : y}</T>
        {i === 0 && <g transform="translate(175 210)"><path d="M-110 -40 L0 -100 L110 -40 Z" fill="none" stroke={W} strokeWidth={5} strokeLinejoin="round" />{[-80, -40, 0, 40, 80].map((cx) => <rect key={cx} x={cx - 8} y={-30} width={16} height={100} fill={W} />)}<rect x={-120} y={72} width={240} height={14} fill={W} /></g>}
        {i === 1 && <Doc x={175} y={215} s={0.5} title="On Computable Numbers" by="A. M. Turing · 1936" />}
        {i === 2 && <g transform="translate(175 210)"><path d="M-110 -30 L0 -80 L110 -30 L0 20 Z" fill={W} /><path d="M-60 0 V60 Q0 90 60 60 V0" fill="none" stroke={W} strokeWidth={8} /><path d="M100 -26 V40" stroke={YEL} strokeWidth={5} /><circle cx={100} cy={46} r={9} fill={YEL} /></g>}
        <T x={175} y={370} s={30} c={W} f="InterX">{a}</T><T x={175} y={415} s={24} c={DIM} f="InterX">{b}</T></Card>; })}</g>
    {/* 13 : Bletchley Park, la Bombe, Enigma */}
    <g opacity={on(13)}>
      <T x={1250} y={170} s={48} c={W} sc={pp(t, S(13) + 0.2)}>BLETCHLEY PARK · 1939</T>
      <g transform={`translate(900 520) scale(${0.72 * pp(t, mid(13, 0.4))})`}>{t > S(13) && <>
        <rect x={-230} y={-200} width={460} height={380} rx={22} fill="#1d1d1d" stroke="#8a8a8a" strokeWidth={6} />
        {[-110, 0, 110].map((x, i) => <g key={x}><Gear x={x} y={-120} r={34} a={t * (60 + i * 25) * (i % 2 ? -1 : 1)} c="#8f8f8f" /><rect x={x - 22} y={-82} width={44} height={36} rx={6} fill="#efefef" />
          <T x={x} y={-63} s={26} c="#14101f" f={KM}>{String.fromCharCode(65 + Math.floor(t * (3 + i)) % 26)}</T></g>)}
        {Array.from({ length: 24 }).map((_, i) => <circle key={i} cx={-180 + (i % 8) * 51} cy={-6 + Math.floor(i / 8) * 46} r={15} fill={i === Math.floor(t * 4) % 24 ? YEL : "#333333"} stroke="#8a8a8a" strokeWidth={2} />)}</>}</g>
      <T x={900} y={700} s={40} c={W} sc={pp(t, mid(13, 0.45))}>ENIGMA</T>
      <g transform={`translate(1560 500) scale(${pp(t, mid(13, 0.2))})`}><rect x={-230} y={-190} width={460} height={380} rx={18} fill="#1d1d1d" stroke={LINE} strokeWidth={5} />
        {Array.from({ length: 12 }).map((_, i) => { const cx = -150 + (i % 4) * 100, cy = -110 + Math.floor(i / 4) * 110, a = t * (120 + (i % 3) * 40) * (i % 2 ? 1 : -1);
          return <g key={i}><circle cx={cx} cy={cy} r={38} fill="#3a3a3a" stroke="#a0a0a0" strokeWidth={4} /><path d={`M${cx} ${cy} L${cx + 30 * Math.cos(a / 57)} ${cy + 30 * Math.sin(a / 57)}`} stroke={i % 5 === 0 ? RED : W} strokeWidth={5} strokeLinecap="round" /></g>; })}</g>
      <T x={1560} y={735} s={40} c={W} sc={pp(t, mid(13, 0.25))}>LA BOMBE</T><T x={1560} y={780} s={26} c={DIM} f="InterX" sc={pp(t, mid(13, 0.3))}>avec Gordon Welchman</T>
      <Arr a={[1320, 430]} b={[1080, 430]} r={0} p={k(t, mid(13, 0.55), 0.4)} c={YEL} label="déchiffre" ls={26} lo={-30} w={5} />
      <Chip x={1250} y={850} text="messages Enigma déchiffrés" c={GRN} fg="#0b1a10" sc={pp(t, mid(13, 0.7))} s={34} /></g>
    {/* 14 : Colossus, Tommy Flowers, Lorenz */}
    <g opacity={on(14)}>
      <T x={1250} y={170} s={48} c={W} sc={pp(t, S(14) + 0.2)}>COLOSSUS</T>
      <g transform={`translate(1250 480) scale(${pp(t, S(14) + 0.3)})`}><rect x={-420} y={-200} width={840} height={400} rx={14} fill="#1d1d1d" stroke={LINE} strokeWidth={5} />
        {[-280, 0, 280].map((x) => <rect key={x} x={x - 130} y={-180} width={260} height={360} rx={8} fill="#161616" stroke="#3a3a3a" strokeWidth={3} />)}
        {Array.from({ length: 54 }).map((_, i) => { const col = i % 18, row = Math.floor(i / 18), x = -390 + col * 46 + (col >= 12 ? 0 : 0), lit = Math.sin(t * 6 + i * 1.7) > 0.3;
          return <circle key={i} cx={x} cy={-120 + row * 70} r={12} fill={lit ? "#ffd23f" : "#2a2a2a"} style={lit ? { filter: "drop-shadow(0 0 8px #ffb347)" } : undefined} />; })}
        <circle cx={300} cy={110} r={60} fill="none" stroke={W} strokeWidth={6} strokeDasharray="10 8" transform={`rotate(${t * 90} 300 110)`} /><path d="M-360 110 H230" stroke={W} strokeWidth={10} strokeDasharray="4 10" /></g>
      <Chip x={1050} y={760} text="conçu par Tommy Flowers" c={SOFT} sc={pp(t, mid(14, 0.3))} s={32} /><Chip x={1520} y={760} text="contre le chiffre Lorenz" c={YEL} fg="#14101f" sc={pp(t, mid(14, 0.6))} s={32} /></g>
    {/* 15 : après la guerre */}
    <g opacity={on(15)}>{([["1946", "l’ACE, un des premiers ordinateurs", W, 0.05], ["1952", "condamné pour son homosexualité", RED, 0.34], ["1954", "meurt empoisonné au cyanure, à 41 ans", W, 0.55], ["2013", "réhabilité", GRN, 0.85]] as [string, string, string, number][]).map(([y, l, c, f], i) => { const at = mid(15, f);
      return <g key={y} transform={`translate(780 ${250 + i * 150})`} opacity={k(t, at, 0.4)}><rect x={0} y={-56} width={1000} height={112} rx={22} fill={PANEL} stroke={c} strokeOpacity={0.7} strokeWidth={3} />
        <T x={110} y={0} s={52} c={c === W ? YEL : c} f={KM}>{y}</T><T x={230} y={0} s={34} c={W} f="InterX" anchor="start">{l}</T>
        {i === 0 && <CpuMem x={900} y={0} s={0.32} sc={1} />}</g>; })}</g>
  </>; };

/* ---------- CHAPITRE 1 : héritage (24–29) ---------- */
const HER: [string, string][] = [["MÊME PUISSANCE", "qu’un ordinateur"], ["λ-CALCUL", "langages fonctionnels"], ["TEST DE TURING · 1950", "humain ou machine ?"], ["MACHINES QUI APPRENNENT", "→ apprentissage automatique"], ["LA LÉGENDE DU LOGO", "démentie par son créateur"], ["UN CONCEPT THÉORIQUE", "IA · cybersécurité"]];
const Heritage = (t: number) => <>
  {HER.map(([ti, sb], i) => { const x = 90 + (i % 3) * 590, y = 110 + Math.floor(i / 3) * 460, at = S(24 + i) + 0.15, cur = t >= S(24 + i) && (i === 5 || t < S(25 + i)), cx = 275, f = (p: number) => mid(24 + i, p);
    return <g key={ti} opacity={t >= at ? (cur ? 1 : 0.55) : 0}><Card x={x} y={y} w={550} h={420} c={cur ? YEL : LINE} p={pp(t, at)} title={ti} tc={cur ? YEL : W}>
      {i === 0 && <><Tape x={60} y={180} cells={["1", "0", "1"]} cw={60} ends={false} p={1} /><HeadBox x={cxOf(60, 1, 60)} y={180} cw={60} sc={1} /><T x={275} y={180} s={70} c={YEL} f={KM} sc={pp(t, f(0.3))}>=</T>
        <Laptop x={420} y={200} s={0.55} sc={pp(t, f(0.35))} /><T x={275} y={320} s={30} c={W} f="InterX">{sb}</T><T x={275} y={366} s={22} c={DIM} f="InterX" sc={pp(t, f(0.6))}>avec assez de mémoire et de temps</T></>}
      {i === 1 && <><T x={cx} y={170} s={64} c={W} f={KM} sc={pp(t, f(0.15))}>λx. x + 1</T><T x={cx} y={260} s={30} c={YEL} f="InterX" sc={pp(t, f(0.45))}>{sb}</T>
        {["Lisp", "Haskell", "OCaml"].map((l, j) => <Chip key={l} x={130 + j * 145} y={340} text={l} c={SOFT} sc={pp(t, f(0.55 + j * 0.08))} s={24} />)}</>}
      {i === 2 && <><Person x={120} y={290} s={0.62} ink={W} col="#5a6b8c" label="" t={t} hair="#2b1a10" skin="#c98a5e" /><Laptop x={430} y={250} s={0.42} sc={1} />
        <g transform={`translate(275 150) scale(${pp(t, f(0.3))})`}><rect x={-90} y={-34} width={180} height={68} rx={18} fill={W} /><T x={0} y={0} s={30} c="#14101f" f="InterX">Bonjour !</T></g>
        <T x={275} y={240} s={64} c={YEL} f={KM} sc={pp(t, f(0.55))}>?</T><T x={275} y={380} s={28} c={W} f="InterX" sc={pp(t, f(0.6))}>{sb}</T></>}
      {i === 3 && <>{[[0, 3], [1, 2], [2, 3]].map(([l, n]) => Array.from({ length: n }).map((_, j) => { const nx = 130 + l * 145, ny = 230 + (j - (n - 1) / 2) * 80, pulse = 0.5 + 0.5 * Math.sin(t * 4 - l * 1.2 + j);
          return <g key={`${l}${j}`}>{l < 2 && Array.from({ length: l === 0 ? 2 : 3 }).map((__, m) => { const nn = l === 0 ? 2 : 3, tx = nx + 145, ty = 230 + (m - (nn - 1) / 2) * 80; return <line key={m} x1={nx} y1={ny} x2={tx} y2={ty} stroke={LINE} strokeOpacity={0.35 + 0.4 * pulse} strokeWidth={3} />; })}
            <circle cx={nx} cy={ny} r={20} fill={pulse > 0.75 ? YEL : PANEL} stroke={W} strokeWidth={3} /></g>; }))}
        <T x={cx} y={375} s={28} c={YEL} f="InterX" sc={pp(t, f(0.5))}>{sb}</T></>}
      {i === 4 && <><g transform={`translate(200 210) scale(${1.6 * pp(t, f(0.1))})`}><Apple x={0} y={0} r={50} /><circle cx={44} cy={-10} r={22} fill={PANEL} /></g>
        <g transform={`translate(400 200) rotate(-12) scale(${pp(t, f(0.45))})`}><rect x={-110} y={-38} width={220} height={76} rx={10} fill="none" stroke={RED} strokeWidth={5} /><T x={0} y={2} s={40} c={RED}>LÉGENDE</T></g>
        <T x={cx} y={370} s={28} c={W} f="InterX" sc={pp(t, f(0.6))}>{sb}</T></>}
      {i === 5 && <><g transform="translate(150 200)" opacity={pp(t, f(0.1))}><Gear x={0} y={0} r={56} a={t * 40} c={DIM} /><path d="M-80 -80 L80 80" stroke={RED} strokeWidth={10} strokeLinecap="round" /></g>
        <T x={370} y={170} s={28} c={W} f="InterX" sc={pp(t, f(0.15))}>pas une machine</T><T x={370} y={210} s={28} c={W} f="InterX" sc={pp(t, f(0.15))}>physique</T>
        <Chip x={160} y={350} text="intelligence artificielle" c={YEL} fg="#14101f" sc={pp(t, f(0.55))} s={24} /><Chip x={420} y={350} text="cybersécurité" c={YEL} fg="#14101f" sc={pp(t, f(0.65))} s={24} /></>}
    </Card></g>; })}
</>;
/* ---------- CHAPITRE 2 : simulation de 0ⁿ1ⁿ (45–47), Tableau 1 du rapport ---------- */
const R01: [string, string, string, string, string][] = [["0", "0", "1", "X", "D"], ["0", "Y", "3", "Y", "D"], ["1", "0", "1", "0", "D"], ["1", "1", "2", "Y", "G"], ["1", "Y", "1", "Y", "D"],
  ["2", "0", "2", "0", "G"], ["2", "Y", "2", "Y", "G"], ["2", "X", "0", "X", "D"], ["3", "Y", "3", "Y", "D"], ["3", "B", "4", "B", "D"]];
type Cf = [string, number, string, number];
const T0011: Cf[] = [["0011__", 0, "0", -1], ["X011__", 1, "1", 0], ["X011__", 2, "1", 2], ["X0Y1__", 1, "2", 3], ["X0Y1__", 0, "2", 5], ["X0Y1__", 1, "0", 7], ["XXY1__", 2, "1", 0],
  ["XXY1__", 3, "1", 4], ["XXYY__", 2, "2", 3], ["XXYY__", 1, "2", 6], ["XXYY__", 2, "0", 7], ["XXYY__", 3, "3", 1], ["XXYY__", 4, "3", 8], ["XXYY__", 5, "4", 9]];
const T001: Cf[] = [["001___", 0, "0", -1], ["X01___", 1, "1", 0], ["X01___", 2, "1", 2], ["X0Y___", 1, "2", 3], ["X0Y___", 0, "2", 5], ["X0Y___", 1, "0", 7], ["XXY___", 2, "1", 0], ["XXY___", 3, "1", 4]];
const conf = (c: Cf) => { let s = c[0].replace(/_/g, "B").replace(/B+$/, "") + "B"; while (s.length <= c[1]) s += "B"; return [s.slice(0, c[1]), c[2], s.slice(c[1])] as [string, string, string]; };
const SX = 140, SCW = 120;
const Sim0011 = (t: number) => { const two = t >= S(47) + 0.2, tr = two ? T001 : T0011, t0 = two ? S(47) + 0.9 : S(46) + 0.7, dt = two ? Math.min(0.65, (E(47) - S(47) - 1.4) / 7.5) : Math.min(0.72, (E(46) - S(46) - 1.5) / 12.5);
  const n = t < S(46) + 0.7 && !two ? 0 : Math.min(tr.length - 1, Math.floor((t - t0) / dt) + 1), cf = tr[Math.max(0, n)];
  const hp = kf(t, tr.map((c, j) => [j === 0 ? t0 - 0.5 : t0 + (j - 1) * dt + 0.25, c[1]] as [number, number]));
  const acc = !two && n === tr.length - 1 && t > t0 + (tr.length - 2) * dt + 0.5, rej = two && t > t0 + (tr.length - 1) * dt + 0.2, [u, q, v] = conf(cf);
  return <>
    <T x={520} y={110} s={52} c={W} sc={pp(t, S(45) + 0.1)}>EXEMPLE : <tspan fontFamily={KM}>{sup("0", "n")}{sup("1", "n")}</tspan></T>
    {["① remplacer le premier 0 par X", "② aller chercher le premier 1 → Y", "③ revenir à gauche", "④ recommencer · que des Y → accepter"].map((l, i) => <T key={l} x={100} y={220 + i * 64} s={30} c={t > S(46) ? DIM : W} f="InterX" anchor="start" sc={pp(t, mid(45, 0.28 + i * 0.13))}>{l}</T>)}
    <Tape x={SX} y={640} cells={cf[0].split("")} cw={SCW} p={k(t, S(45) + 0.3, 0.8)} hl={acc ? { 5: GRN } : rej ? { 3: RED } : { [Math.round(hp)]: YEL }} />
    <HeadBox x={cxOf(SX, hp, SCW)} y={640} cw={SCW} st={sub("q", cf[2])} c={acc ? GRN : rej ? RED : YEL} sc={pp(t, S(45) + 0.8)} />
    <T x={500} y={790} s={36} c={W} f="InterX" sc={pp(t, S(46) + 0.4)}>étape <tspan fill={YEL}>{n}</tspan>{two ? (rej ? " · arrêt" : "") : " / 13"}</T>
    <T x={500} y={860} s={44} c={YEL} f={KM} sc={pp(t, S(46) + 0.5)}>{u}{"\u00a0"}{sub("q", q)}{"\u00a0"}{v}</T>
    <Chip x={500} y={970} text={two ? "q1 lit B : aucune transition → 001 REJETÉ" : "état final q4 → 0011 ACCEPTÉ"} c={two ? RED : GRN} fg={two ? "#fff" : "#0b1a10"} sc={acc ? pp(t, t0 + (tr.length - 2) * dt + 0.5) : rej ? pp(t, t0 + (tr.length - 1) * dt + 0.2) : 0} s={32} />
    <Card x={1130} y={90} w={700} h={900} c={LINE} p={pp(t, mid(45, 0.15))} title="TRANSITIONS  δ" tc={YEL}>
      {R01.map(([a, b, c, d, e], i) => { const on = n > 0 && cf[3] === i && !rej;
        return <g key={i} opacity={k(t, mid(45, 0.18 + i * 0.03), 0.3)}>{on && <rect x={30} y={88 + i * 78} width={640} height={64} rx={12} fill={YEL} opacity={0.2} />}
          <T x={350} y={120 + i * 78} s={34} c={on ? YEL : W} f={KM}>δ({sub("q", a)}, {b}) = ({sub("q", c)}, {d}, {e})</T></g>; })}</Card>
  </>; };

/* ---------- CHAPITRE 3 : exemples des variantes (53–56) ---------- */
const VarEx = (t: number) => { const f = (i: number, p: number) => mid(i, p);
  const dh = kf(t, [[f(53, 0.25), 0], [f(53, 0.35), 1], [f(53, 0.42), 1], [f(53, 0.52), 2]]), dacc = t > f(53, 0.58);
  const cj = Math.max(-1, Math.min(3, Math.floor((t - f(54, 0.25)) / (0.13 * (E(54) - S(54)))))), ch = kf(t, [0, 1, 2, 3].map((j) => [f(54, 0.25 + j * 0.13) + 0.2, j] as [number, number]));
  const pj = Math.max(-1, Math.min(3, Math.floor((t - f(55, 0.3)) / (0.13 * (E(55) - S(55)))))), ph = kf(t, [0, 1, 2, 3].map((j) => [f(55, 0.3 + j * 0.13) + 0.2, j] as [number, number]));
  const second = t > f(56, 0.55);
  return <>
    <Card x={90} y={110} w={860} h={430} c={t >= S(53) && t < S(54) ? YEL : LINE} p={pp(t, S(53) + 0.15)} title="DÉTERMINISTE" tc={YEL}>
      <Tape x={180} y={240} cells={["0", "0", "1", "0", "1", "_"]} cw={100} p={1} ends={false} hl={dacc ? { 2: GRN } : { [Math.round(dh)]: YEL }} />
      <HeadBox x={cxOf(180, dh, 100)} y={240} cw={100} st={dacc ? "acc" : sub("q", "0")} c={dacc ? GRN : YEL} />
      <T x={280} y={332} s={30} c={W} f={KM}>{sub("q", "0")}, 0 → {sub("q", "0")}, 0, D</T><T x={640} y={332} s={30} c={W} f={KM}>{sub("q", "0")}, 1 → acc</T>
      <Chip x={430} y={392} text="une seule règle à chaque étape" c={SOFT} sc={pp(t, f(53, 0.65))} s={28} /></Card>
    <Card x={970} y={110} w={860} h={430} c={t >= S(54) && t < S(55) ? YEL : LINE} p={pp(t, S(54) + 0.15)} title="DEUX BANDES" tc={YEL}>
      {[0, 1].map((b) => <g key={b}><T x={70} y={160 + b * 140} s={24} c={DIM} f="InterX">{b ? "écrit" : "lit"}</T>
        <Tape x={170} y={160 + b * 140} cells={["1", "0", "1", "1", "_"].map((c, i) => (b === 0 ? c : i <= cj && i < 4 ? c : "_"))} cw={100} p={1} ends={false} hl={{ [Math.max(0, Math.round(ch))]: YEL }} />
        <path d={`M${cxOf(170, Math.max(0, ch), 100) - 14} ${160 + b * 140 - 72} h28 l-14 18 z`} fill={YEL} /></g>)}
      <T x={430} y={390} s={28} c={W} f="InterX" sc={pp(t, f(54, 0.8))}>1011 copié sur la seconde bande</T></Card>
    <Card x={90} y={580} w={860} h={430} c={t >= S(55) && t < S(56) ? YEL : LINE} p={pp(t, S(55) + 0.15)} title="DEUX TÊTES" tc={YEL}>
      <Tape x={94} y={240} cells={"ABCDCBA".split("")} cw={96} p={1} ends={false} hl={{ [Math.max(0, Math.round(ph))]: YEL, [6 - Math.max(0, Math.round(ph))]: W }} />
      <HeadBox x={cxOf(94, Math.max(0, ph), 96)} y={240} cw={96} st="1" /><HeadBox x={cxOf(94, 6 - Math.max(0, ph), 96)} y={240} cw={96} st="2" c={W} />
      {[0, 1, 2].map((j) => j <= pj ? <g key={j}><T x={cxOf(94, j, 96)} y={320} s={30} c={GRN} f={KM}>=</T><T x={cxOf(94, 6 - j, 96)} y={320} s={30} c={GRN} f={KM}>=</T></g> : null)}
      <T x={430} y={392} s={28} c={W} f="InterX" sc={pp(t, f(55, 0.4))}>compare directement le premier et le dernier</T></Card>
    <Card x={970} y={580} w={860} h={430} c={t >= S(56) ? YEL : LINE} p={pp(t, S(56) + 0.15)} title="UNIVERSELLE" tc={YEL}>
      <T x={430} y={110} s={26} c={DIM} f="InterX">⟨M⟩ = « chercher un 1 »</T>
      <Tape x={60} y={220} cells={["⟨M⟩", "#", ...(second ? "0000" : "1010").split("")]} cw={70} s={44} p={1} ends={false} />
      <Draw d="M560 220 H600" p={k(t, f(56, 0.2), 0.3)} c={W} w={5} /><Head x={606} y={220} p={k(t, f(56, 0.2), 0.3)} c={W} s={0.5} />
      <g transform={`translate(700 220) scale(${pp(t, f(56, 0.15))})`}><rect x={-70} y={-60} width={140} height={120} rx={20} fill={SOFT} stroke={YEL} strokeWidth={4} /><T x={0} y={0} s={60} c={YEL}>U</T></g>
      <Chip x={430} y={340} text={second ? "0000 → REJETTE" : "1010 → ACCEPTE"} c={second ? RED : GRN} fg={second ? "#fff" : "#0b1a10"} sc={second ? pp(t, f(56, 0.7)) : pp(t, f(56, 0.35))} s={34} />
      <T x={430} y={395} s={24} c={DIM} f="InterX" sc={pp(t, f(56, 0.8))}>exactement comme M</T></Card>
  </>; };

/* ---------- CHAPITRE 4 : exemples décidables / indécidables (62–63) ---------- */
const DecEx = (t: number) => <>
  <Card x={110} y={110} w={820} h={860} c={GRN} p={pp(t, S(62) + 0.15)} title="DÉCIDABLES" tc={GRN}>
    {([["n est-il premier ?", "17 → OUI     18 → NON"], ["w est-il de la forme 0ⁿ1ⁿ ?", "0011 → OUI     001 → NON"], ["un automate fini accepte-t-il w ?", "on suit ses transitions : OUI / NON"]] as [string, string][]).map(([a, b], i) => <g key={a} opacity={k(t, mid(62, 0.25 + i * 0.2), 0.3)}>
      <Tick x={70} y={180 + i * 210} ok sc={1} /><T x={110} y={180 + i * 210} s={34} c={W} f="InterX" anchor="start">{a}</T><T x={110} y={238 + i * 210} s={30} c={GRN} f={KM} anchor="start">{b}</T></g>)}
    <Chip x={410} y={790} text="la machine s’arrête toujours" c={GRN} fg="#0b1a10" sc={pp(t, mid(62, 0.85))} s={30} /></Card>
  <Card x={990} y={110} w={820} h={860} c={RED} p={pp(t, S(63) + 0.15)} title="INDÉCIDABLES" tc={RED}>
    {([["le problème de l’arrêt", "P s’arrête-t-il sur w ?", ""], ["deux programmes calculent-ils", "la même fonction ?", ""], ["le 10ᵉ problème de Hilbert", "équations à solutions entières", "Matiiassevitch, 1970"]] as [string, string, string][]).map(([a, b, c], i) => <g key={a} opacity={k(t, mid(63, 0.12 + i * 0.22), 0.3)}>
      <Tick x={70} y={180 + i * 210} ok={false} sc={1} /><T x={110} y={180 + i * 210} s={34} c={W} f="InterX" anchor="start">{a}</T><T x={110} y={234 + i * 210} s={30} c={i ? W : DIM} f="InterX" anchor="start">{b}</T>
      {c && <Chip x={260} y={292 + i * 210} text={c} c={SOFT} s={26} sc={pp(t, mid(63, 0.75))} />}
      {i === 0 && <g transform="translate(700 200)"><circle r={34} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="150 64" transform={`rotate(${t * 240})`} /><T x={0} y={2} s={36} c={RED} f={KM}>∞</T></g>}
      {i === 1 && <T x={680} y={444} s={40} c={YEL} f={KM}>{sub("P", "1")} ≟ {sub("P", "2")}</T>}</g>)}
    <Chip x={410} y={790} text="aucune machine ne répond dans tous les cas" c={RED} sc={pp(t, mid(63, 0.88))} s={28} /></Card>
</>;

/* ---------- CHAPITRE 5 : notation asymptotique (79–80) ---------- */
const NOT: [string, string, (n: number) => number, string][] = [["O(1)", "constant", () => 70, GRN], ["O(log n)", "logarithmique", (n) => 110 * Math.log2(1 + n), W], ["O(n)", "linéaire", (n) => 60 * n, YEL], ["O(n²)", "quadratique", (n) => 7 * n * n, RED]];
const SEQ = ["7", "3", "19", "5", "11", "26", "8", "42"];
const Notation = (t: number) => { const path = (g: (n: number) => number) => { let d = ""; for (let i = 0; i <= 50; i++) { const n = (i / 50) * 10, y = Math.max(150, 900 - g(n)); d += `${i ? "L" : "M"}${150 + n * 78} ${y} `; } return d; };
  const a0 = mid(115, 0.15), stp = (mid(115, 0.6) - a0) / 7, ci = t < a0 ? -1 : Math.min(7, Math.floor((t - a0) / stp)), found = ci === 7 && t > a0 + 7 * stp + 0.2;
  return <>
    <T x={560} y={110} s={46} c={W} sc={pp(t, S(114) + 0.1)}>NOTATION ASYMPTOTIQUE</T>
    <Axes ox={150} oy={900} w={800} h={720} p={k(t, S(114) + 0.2, 0.5)} xl="n" yl="coût" />
    {NOT.map(([l, d, g, c], i) => { const at = mid(114, 0.2 + i * 0.16), y = Math.max(150, 900 - g(10));
      return <g key={l}><Draw d={path(g)} p={k(t, at, 0.8)} c={c} w={6} /><T x={990} y={y} s={34} c={c} f={KM} sc={pp(t, at + 0.6)} anchor="start">{l}</T><T x={990} y={y + 40} s={22} c={DIM} f="InterX" sc={pp(t, at + 0.7)} anchor="start">{d}</T></g>; })}
    <T x={1440} y={200} s={42} c={W} sc={pp(t, S(115) + 0.1)}>RECHERCHE SÉQUENTIELLE</T>
    <Chip x={1440} y={290} text="chercher 42" c={SOFT} sc={pp(t, S(115) + 0.3)} s={32} />
    <Tape x={1040} y={420} cells={SEQ} cw={100} s={40} ends={false} p={k(t, S(115) + 0.2, 0.6)} hl={found ? { 7: GRN } : ci >= 0 ? { [ci]: YEL } : {}} dim={ci > 0 ? Array.from({ length: ci }, (_, j) => j) : []} />
    {ci >= 0 && <path d={`M${cxOf(1040, ci, 100) - 16} 340 h32 l-16 20 z`} fill={found ? GRN : YEL} />}
    <T x={1440} y={540} s={38} c={W} f="InterX" sc={pp(t, a0)}>comparaisons : <tspan fill={YEL} fontFamily={KM}>{Math.max(0, ci + 1)}</tspan></T>
    <Chip x={1440} y={650} text="pire des cas : n comparaisons → O(n)" c={YEL} fg="#14101f" sc={pp(t, mid(115, 0.68))} s={32} />
  </>; };

/* ---------- CHAPITRE 7 : perspectives (110) ---------- */
const Persp = (t: number) => { const at = [0.1, 0.3, 0.5, 0.72].map((x) => mid(145, x)), sp: [number, number][] = [[130, 170], [990, 170], [130, 590], [990, 590]];
  return <>
    <T x={960} y={95} s={56} c={W} sc={pp(t, S(145) + 0.05)}>PERSPECTIVES</T>
    {([["EFFICACITÉ DES ALGORITHMES", "faire mieux avec moins"], ["CALCUL PARALLÈLE ET DISTRIBUÉ", "plusieurs machines ensemble"], ["INFORMATIQUE QUANTIQUE", "ne supprime pas les limites de la calculabilité"], ["FONDEMENTS DE L’IA", "intelligence artificielle"]] as [string, string][]).map(([a, b], i) => <Card key={a} x={sp[i][0]} y={sp[i][1]} w={800} h={380} c={YEL} p={pp(t, at[i])} title={a} tc={YEL}>
      {i === 0 && <g transform="translate(400 230)"><path d="M-110 0 A110 110 0 0 1 110 0" fill="none" stroke={LINE} strokeWidth={10} /><path d={`M0 0 L${-95 * Math.cos(0.3 + 0.9 * k(t, at[0] + 0.3, 1.2))} ${-95 * Math.sin(0.3 + 0.9 * k(t, at[0] + 0.3, 1.2))}`} stroke={YEL} strokeWidth={8} strokeLinecap="round" /><circle r={12} fill={YEL} /></g>}
      {i === 1 && <g transform="translate(400 220)">{[[-150, 0], [-50, -60], [-50, 60], [60, -30], [60, 60], [150, 10]].map(([x, y], j, A) => <g key={j}>{j > 0 && <line x1={A[j - 1][0]} y1={A[j - 1][1]} x2={x} y2={y} stroke={LINE} strokeWidth={3} />}<circle cx={x} cy={y} r={20} fill={Math.floor(t * 3) % 6 === j ? YEL : PANEL} stroke={W} strokeWidth={3} /></g>)}</g>}
      {i === 2 && <g transform="translate(400 200)"><circle r={70} fill="none" stroke={W} strokeWidth={4} /><ellipse rx={70} ry={22} fill="none" stroke={W} strokeWidth={2} strokeDasharray="6 6" /><path d={`M0 0 L${52 * Math.cos(t * 1.5)} ${-48 + 8 * Math.sin(t * 1.5)}`} stroke={YEL} strokeWidth={5} strokeLinecap="round" /><circle r={7} fill={YEL} /></g>}
      {i === 3 && <Bulb x={400} y={210} sc={0.9} on={1} />}
      <T x={400} y={335} s={i === 2 ? 26 : 30} c={i === 2 ? DIM : W} f="InterX">{b}</T></Card>)}
  </>; };
/* ---------- CHAPITRE 4 : calculabilité, compléments (60, 65, 67) ---------- */
const Calc = (t: number) => <>
  <g opacity={1 - 0.9 * k(t, S(67) - 0.1, 0.5)}>{CalcBase(t)}
    <g opacity={t < S(64) ? k(t, S(60) + 0.1, 0.4) : 0}>
      <Card x={1000} y={80} w={820} h={420} c={GRN} p={pp(t, S(60) + 0.1)} title="EXEMPLES CALCULABLES" tc={GRN}>
        {([["addition", "2 + 3 → 5"], ["tri d’une liste", "[3, 1, 2] → [1, 2, 3]"], ["recherche d’un chemin", "A → … → B"]] as [string, string][]).map(([a, b], i) => <g key={a} opacity={k(t, mid(60, 0.1 + i * 0.12), 0.3)}>
          <Tick x={70} y={140 + i * 90} ok sc={1} s={0.9} /><T x={110} y={140 + i * 90} s={32} c={W} f="InterX" anchor="start">{a}</T><T x={780} y={140 + i * 90} s={30} c={YEL} f={KM} anchor="end">{b}</T></g>)}</Card>
      <g opacity={k(t, mid(60, 0.5), 0.4)}><T x={1410} y={580} s={30} c={W} f="InterX">la calculabilité trace la frontière</T>
        <rect x={1000} y={630} width={400} height={220} rx={22} fill={GRN} fillOpacity={0.12} stroke={GRN} strokeOpacity={0.6} strokeWidth={3} /><rect x={1420} y={630} width={400} height={220} rx={22} fill={RED} fillOpacity={0.12} stroke={RED} strokeOpacity={0.6} strokeWidth={3} />
        <T x={1200} y={710} s={28} c={GRN} f="InterX">ce qu’un ordinateur</T><T x={1200} y={760} s={28} c={GRN} f="InterX">peut faire en principe</T>
        <T x={1620} y={710} s={28} c={RED} f="InterX">ce qu’il ne pourra</T><T x={1620} y={760} s={28} c={RED} f="InterX">jamais faire</T></g></g>
    <g opacity={k(t, S(65) + 0.2, 0.4)}>{[[1050, 160], [1090, 200], [1760, 170], [1730, 205], [1045, 660], [1775, 650], [1735, 690]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={RED} />)}
      <T x={1700} y={135} s={22} c={RED} f="InterX">non reconnaissables</T></g>
    <Card x={1000} y={770} w={820} h={200} c={YEL} p={t < S(66) - 0.2 ? pp(t, S(65) + 0.2) : 0}>
      <T x={410} y={56} s={34} c={W} f="InterX">L décidable <tspan fill={YEL}>⇔</tspan> L et son complémentaire</T><T x={410} y={102} s={34} c={W} f="InterX">sont reconnaissables</T>
      <T x={410} y={158} s={26} c={DIM} f="InterX" sc={pp(t, mid(65, 0.6))}>et il y a bien plus de langages que de machines</T></Card></g>
  <g opacity={k(t, S(67), 0.5)}>
    <T x={960} y={300} s={46} c={W}>TROIS MODÈLES, UNE MÊME PUISSANCE</T>
    {([["λ-calcul", "Alonzo Church"], ["machine de Turing", "Alan Turing"], ["fonctions récursives", "Gödel, Kleene"]] as [string, string][]).map(([a, b], i) => <g key={a} transform={`translate(${400 + i * 560} 530) scale(${pp(t, mid(67, 0.08 + i * 0.16))})`}>
      <rect x={-230} y={-90} width={460} height={180} rx={24} fill={PANEL} stroke={i === 1 ? YEL : LINE} strokeWidth={4} /><T x={0} y={-18} s={40} c={i === 1 ? YEL : W} f="InterX">{a}</T><T x={0} y={38} s={26} c={DIM} f="InterX">{b}</T></g>)}
    {[680, 1240].map((x, i) => <T key={x} x={x} y={530} s={60} c={YEL} f={KM} sc={pp(t, mid(67, 0.2 + i * 0.16))}>⇔</T>)}
    <Chip x={960} y={760} text="→ la thèse de Church–Turing en sort renforcée" c={YEL} fg="#14101f" sc={pp(t, mid(67, 0.65))} s={34} /></g>
</>;
/* ---------- CHAPITRE 5 : résumé (88) ---------- */
const Reduce = (t: number) => <>
  <g opacity={1 - 0.84 * k(t, S(123) - 0.1, 0.5)}>{ReduceBase(t)}</g>
  <Card x={300} y={330} w={1320} h={400} c={YEL} p={pp(t, S(123) + 0.15)} title="EN RÉSUMÉ" tc={YEL}>
    <Tick x={110} y={170} ok sc={pp(t, mid(123, 0.25))} s={1.2} /><T x={170} y={170} s={38} c={W} f="InterX" anchor="start" sc={pp(t, mid(123, 0.25))}>quels problèmes se résolvent efficacement</T>
    <Tick x={110} y={290} ok={false} sc={pp(t, mid(123, 0.6))} s={1.2} /><T x={170} y={290} s={38} c={W} f="InterX" anchor="start" sc={pp(t, mid(123, 0.6))}>quelles sont les limites des algorithmes</T></Card>
</>;
/* ---------- CHAPITRE 7 : mêmes calculs (107) ---------- */
const VsPC = (t: number) => <>
  <g opacity={1 - 0.84 * k(t, S(142) - 0.1, 0.5)}>{VsPCBase(t)}</g>
  <Card x={360} y={320} w={1200} h={420} c={YEL} p={pp(t, S(142) + 0.15)} title="LES MÊMES TYPES DE CALCULS" tc={YEL}>
    <T x={600} y={150} s={34} c={W} f="InterX">la différence porte sur les conditions pratiques</T>
    {["la mémoire", "la vitesse", "les ressources"].map((x, i) => <Chip key={x} x={260 + i * 340} y={280} text={x} c={SOFT} sc={pp(t, mid(142, 0.45 + i * 0.1))} s={36} />)}</Card>
</>;

/* ---------- CHAPITRE 6 : palindrome 10101 et incrémentation binaire (92–95) ---------- */
const PX = 200, PCW = 120, AX = 200, ACW = 110;
const PalAdd = (t: number) => { const f = (x: number) => mid(128, x), g = (x: number) => mid(129, x), h = (x: number) => mid(130, x);
  const php = kf(t, [[f(0.02), 1], [f(0.2), 5], [f(0.28), 5], [f(0.42), 2], [f(0.46), 2], [f(0.56), 4], [f(0.6), 4], [f(0.66), 3]]);
  const er: [number, number][] = [[1, f(0.04)], [5, f(0.26)], [2, f(0.46)], [4, f(0.6)]];
  const pcells = ["_", "1", "0", "1", "0", "1", "_"].map((c, i) => (er.some(([j, at]) => j === i && t > at) ? "_" : c));
  const pacc = t > f(0.7), pok = (t > f(0.21) && t < f(0.27)) || (t > f(0.56) && t < f(0.6));
  const pst = t < f(0.04) ? sub("q", "0") : t < f(0.21) ? "1 ?" : t < f(0.27) ? "✓" : t < f(0.44) ? "←" : t < f(0.56) ? "0 ?" : t < f(0.6) ? "✓" : t < f(0.7) ? "←" : "acc";
  const ex2 = t > h(0.45), a1 = ["_", "1", "0", "1", "1", "_"], a2 = ["_", "_", "1", "1", "1", "_"];
  const w1: [number, string, number][] = [[4, "0", g(0.74)], [3, "0", g(0.82)], [2, "1", g(0.9)]], w2: [number, string, number][] = [[4, "0", h(0.55)], [3, "0", h(0.62)], [2, "0", h(0.69)], [1, "1", h(0.76)]];
  const acells = (ex2 ? a2 : a1).map((c, i) => { const ws = (ex2 ? w2 : w1).filter(([j, , at]) => j === i && t > at); return ws.length ? ws[ws.length - 1][1] : c; });
  const ahp = ex2 ? kf(t, [[h(0.5), 4], [h(0.55), 4], [h(0.58), 3], [h(0.62), 3], [h(0.65), 2], [h(0.69), 2], [h(0.72), 1]]) : kf(t, [[g(0.55), 1], [g(0.7), 4], [g(0.74), 4], [g(0.78), 3], [g(0.82), 3], [g(0.86), 2]]);
  const done1 = !ex2 && t > g(0.9), done2 = t > h(0.76), carry = (!ex2 && t > g(0.74) && t < g(0.9)) || (ex2 && t > h(0.55) && t < h(0.76));
  return <>
    <T x={960} y={90} s={48} c={W} sc={pp(t, S(127) + 0.1)}>PALINDROME</T><T x={960} y={142} s={26} c={DIM} f="InterX" sc={pp(t, S(127) + 0.3)}>se lit pareil dans les deux sens</T>
    <Tape x={PX} y={340} cells={pcells} cw={PCW} p={k(t, S(127) + 0.2, 0.6)} hl={pacc ? { 3: GRN } : pok ? { [Math.round(php)]: GRN } : { [Math.round(php)]: YEL }} />
    <HeadBox x={cxOf(PX, php, PCW)} y={340} cw={PCW} st={pst} c={pacc ? GRN : YEL} sc={pp(t, S(127) + 0.5)} />
    {["① effacer le premier symbole", "② courir jusqu’au dernier", "③ vérifier qu’il est identique, l’effacer", "④ revenir, recommencer jusqu’au bout"].map((l, i) => <T key={l} x={1250} y={250 + i * 60} s={26} c={W} f="InterX" anchor="start" sc={pp(t, mid(127, 0.3 + i * 0.13))}>{l}</T>)}
    <Chip x={620} y={470} text="le 1 central, seul → ACCEPTÉ" c={GRN} fg="#0b1a10" sc={pacc ? pp(t, f(0.72)) : 0} s={32} />
    <T x={960} y={590} s={48} c={W} sc={pp(t, S(129) + 0.1)}>INCRÉMENTATION BINAIRE</T>
    <Tape x={AX} y={810} cells={acells} cw={ACW} p={k(t, S(129) + 0.3, 0.6)} hl={done1 ? { 1: GRN, 2: GRN, 3: GRN, 4: GRN } : done2 ? { 1: GRN, 2: GRN, 3: GRN, 4: GRN } : { [Math.round(ahp)]: YEL }} />
    <HeadBox x={cxOf(AX, ahp, ACW)} y={810} cw={ACW} st={carry ? "+1" : undefined} c={done1 || done2 ? GRN : YEL} sc={pp(t, g(0.5))} />
    <T x={1070} y={770} s={30} c={W} f="InterX" anchor="start" sc={pp(t, mid(129, 0.3))}>dernier bit = 0 → écrire 1, s’arrêter</T>
    <T x={1070} y={840} s={30} c={W} f="InterX" anchor="start" sc={pp(t, mid(129, 0.45))}>dernier bit = 1 → écrire 0, retenue ←</T>
    <Chip x={530} y={960} text="1011 (11)  →  1100 (12)" c={GRN} fg="#0b1a10" sc={done1 || (t > S(130) && !ex2) ? pp(t, g(0.92)) : 0} s={36} />
    <Chip x={530} y={960} text="111 (7)  →  1000 (8)" c={GRN} fg="#0b1a10" sc={done2 ? pp(t, h(0.8)) : 0} s={36} />
    <Chip x={1350} y={960} text="tous les bits à 1 : un nouveau bit" c={SOFT} sc={ex2 ? pp(t, h(0.5)) : 0} s={30} />
  </>; };
/* ---------- CHAPITRE 6 : simulateur et analyse (96–99) ---------- */
const ANA: [string, React.ReactNode, string][] = [["nombre pair de 1", "O(n)", "n + 1 étapes"], ["palindrome · 1 bande", <>{sup("O(n", "2")})</>, "Hennie, 1965"], ["palindrome · 2 bandes", "O(n)", ""], ["incrémentation", "O(n)", "au plus 2n + 2 étapes"]];
const Sim = (t: number) => { const clicks = [0.25, 0.4, 0.55, 0.7].map((f) => mid(131, f)), n = clicks.filter((x) => t > x).length, press = Math.max(0, ...clicks.map((x) => (t > x ? 1 - sat((t - x) / 0.3) : 0)));
  const cur: [number, number] = [kf(t, [[S(131), 900], [mid(131, 0.2), 560]]), kf(t, [[S(131), 900], [mid(131, 0.2), 812]])], at = [mid(132, 0.15), mid(133, 0.08), mid(133, 0.45), mid(133, 0.72)];
  return <>
    <Win x={110} y={100} w={940} h={800} p={pp(t, S(131) + 0.1)} title="Simulateur de machine de Turing">
      <Tape x={130} y={200} cells={["1", "0", "1", "1", "_", "_"]} cw={100} ends={false} p={1} hl={{ [n]: YEL }} />
      <HeadBox x={cxOf(130, kf(t, clicks.map((x, i) => [x + 0.1, i + 1] as [number, number]).concat([[S(131), 0]]).sort((a, b) => a[0] - b[0])), 100)} y={200} cw={100} st={n % 2 ? "impair" : "pair"} />
      <T x={130} y={330} s={28} c={DIM} f="InterX" anchor="start">état : <tspan fill={YEL}>{n % 2 ? "impair" : "pair"}</tspan>   ·   étape : <tspan fill={YEL}>{n}</tspan></T>
      <rect x={40} y={380} width={860} height={250} rx={14} fill={SOFT} /><T x={70} y={415} s={24} c={DIM} f="InterX" anchor="start">TRANSITIONS</T>
      {["pair, 1 → impair, 1, D", "pair, 0 → pair, 0, D", "impair, 1 → pair, 1, D", "impair, 0 → impair, 0, D"].map((l, i) => <T key={l} x={70} y={460 + i * 44} s={28} c={W} f={KM} anchor="start">{l}</T>)}
      {[["▶ exécuter", 150], ["⏭ pas à pas", 450], ["⟲ réinitialiser", 750]].map(([l, x], i) => <g key={l as string}><rect x={(x as number) - 130} y={680} width={260} height={64} rx={14} fill={i === 1 && press > 0 ? YEL : SOFT} stroke={LINE} strokeOpacity={0.4} strokeWidth={2} />
        <T x={x as number} y={712} s={28} c={i === 1 && press > 0 ? "#14101f" : W} f="InterX">{l as string}</T></g>)}</Win>
    {t > S(131) && t < E(131) + 0.5 && <Cursor x={cur[0]} y={cur[1]} press={press} />}
    <Card x={1110} y={150} w={740} h={640} c={YEL} p={pp(t, S(132) + 0.1)} title="ANALYSE DE LA COMPLEXITÉ" tc={YEL}>
      <T x={40} y={120} s={24} c={DIM} f="InterX" anchor="start">exemple</T><T x={500} y={120} s={24} c={DIM} f="InterX">temps</T><T x={650} y={120} s={24} c={DIM} f="InterX" sc={pp(t, S(134) + 0.1)}>espace</T>
      {ANA.map(([a, b, c], i) => <g key={a} opacity={k(t, at[i], 0.3)}><T x={40} y={190 + i * 112} s={28} c={W} f="InterX" anchor="start">{a}</T>{c ? <T x={40} y={228 + i * 112} s={21} c={DIM} f="InterX" anchor="start">{c}</T> : null}
        <T x={500} y={200 + i * 112} s={34} c={i === 1 ? RED : YEL} f={KM}>{b}</T><T x={650} y={200 + i * 112} s={30} c={W} f={KM} sc={pp(t, S(134) + 0.3 + i * 0.25)}>O(n)</T></g>)}</Card>
    <Chip x={1480} y={860} text="mémoire : l’entrée + une case pour la retenue" c={YEL} fg="#14101f" sc={pp(t, mid(134, 0.45))} s={28} />
  </>; };
/* ---------- CHAPITRE 7 : avantages et limites (100–105) ---------- */
const ADV: [string, string, number, number][] = [["simple et précis", "chaque étape : une règle bien définie", 135, 0.45], ["définit la calculabilité", "résoluble en un nombre fini d’étapes", 136, 0.25], ["machine universelle", "une machine, différents programmes", 137, 0.25], ["mesure la complexité", "en temps et en espace", 138, 0.2], ["indépendante du matériel", "un modèle abstrait", 138, 0.6]];
const LIM: [string, string, number, number][] = [["mémoire infinie", "un ordinateur a une mémoire limitée", 139, 0.2], ["problèmes sans solution", "le problème de l’arrêt", 139, 0.6], ["calculable ≠ pratique", "calculabilité et complexité", 140, 0.2], ["pas d’interaction directe", "réseaux, temps réel", 140, 0.65]];
const AdvLim = (t: number) => { const c0 = S(135) + 1.9, row = (l: [string, string, number, number][], ok: boolean) => l.map(([a, b, si, f], i) => { const at = si === 135 ? Math.max(c0 + 0.3, mid(si, f)) : mid(si, f), cur = t >= S(si) && t < S(si + 1);
    return <g key={a} opacity={k(t, at, 0.3) * (cur ? 1 : 0.75)}><Tick x={80} y={150 + i * 132} ok={ok} sc={pp(t, at)} s={1.05} /><T x={130} y={140 + i * 132} s={36} c={cur ? (ok ? GRN : RED) : W} f="InterX" anchor="start">{a}</T>
      <T x={130} y={184 + i * 132} s={25} c={DIM} f="InterX" anchor="start">{b}</T></g>; });
  return <>
    <Card x={100} y={110} w={840} h={800} c={GRN} p={pp(t, c0)} title="AVANTAGES" tc={GRN}>{row(ADV, true)}</Card>
    <Card x={980} y={110} w={840} h={800} c={RED} p={pp(t, S(139) + 0.1)} title="LIMITES" tc={RED}>{row(LIM, false)}
      <g transform="translate(700 640)" opacity={k(t, mid(140, 0.7))}><circle r={44} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="190 86" transform={`rotate(${t * 200})`} /><T x={0} y={2} s={40} c={RED} f={KM}>∞</T></g></Card>
  </>; };


/* ======================= CHAPITRE 4 (59–108) : réécrit d'après le chapitre « Machine de Turing et calculabilité » ======================= */
/** sub/superscripts whose offset is undone at the same font size, so the text that follows stays on the baseline */
const sub4 = (b: React.ReactNode, i: string) => <>{b}<tspan dy="0.28em" fontSize="62%">{i}</tspan><tspan dy="-0.28em" fontSize="62%">{"\u200b"}</tspan></>;
const sup4 = (b: React.ReactNode, e: string) => <>{b}<tspan dy="-0.42em" fontSize="62%">{e}</tspan><tspan dy="0.42em" fontSize="62%">{"\u200b"}</tspan></>;
const C4Num: React.FC<{ x: number; y: number; n: number; sc: number; c?: string }> = ({ x, y, n, sc, c = YEL }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><circle r={22} fill={PANEL} stroke={c} strokeWidth={3} /><T x={0} y={1} s={26} c={c} f="InterX">{n}</T></g>);
const C4Loop: React.FC<{ x: number; y: number; t: number; o?: number; r?: number; c?: string }> = ({ x, y, t, o = 1, r = 34, c = RED }) => o <= 0.001 ? null : (
  <g transform={`translate(${x} ${y})`} opacity={o}><circle r={r} fill="none" stroke={c} strokeWidth={5} strokeDasharray={`${r * 4.4} ${r * 1.9}`} transform={`rotate(${t * 240})`} /><T x={0} y={2} s={r * 1.05} c={c} f={KM}>∞</T></g>);
const C4Line: React.FC<{ x: number; y: number; s?: number; c?: string; sc?: number; f?: string; children: React.ReactNode }> = ({ x, y, s = 30, c = W, sc = 1, f = "InterX", children }) => (
  <T x={x} y={y} s={s} c={c} f={f} anchor="start" sc={sc}>{children}</T>);
const OVL = (l: string) => <tspan style={{ textDecoration: "overline" }}>{l}</tspan>;
const CHI = <>χ<tspan dy="0.28em" fontSize="62%">L</tspan><tspan dy="0.16em" fontSize="44%">P</tspan><tspan dy="-0.16em" fontSize="44%">{"\u200b"}</tspan><tspan dy="-0.28em" fontSize="62%">{"\u200b"}</tspan></>;
const chipW = (s: string, sz = 30) => s.length * sz * 0.5 + sz * 1.1;

/* ---------- 59–60 : un ordinateur peut-il tout résoudre ? trois questions ---------- */
const Q4P: [number, number, string][] = [[470, 380, "trier une liste"], [1450, 380, "chercher un chemin"], [470, 700, "n est-il premier ?"], [1450, 700, "ce programme s’arrête-t-il ?"]];
const Q4Q: [string[], string][] = [[["Que signifient", "« calcul » et", "« algorithme » ?"], "IV.1 · IV.4"], [["Quels problèmes", "peut-on résoudre", "par un algorithme ?"], "IV.2 · IV.3"], [["Existe-t-il des problèmes", "qu’aucun algorithme", "ne pourra jamais résoudre ?"], "IV.5 · IV.6"]];
const Questions4 = (t: number) => { const c0 = S(59) + 1.9;
  return <>
    <g opacity={1 - k(t, S(60) - 0.25, 0.45)}>
      <T x={960} y={150} s={52} c={W} sc={pp(t, c0)}>UN ORDINATEUR PEUT-IL TOUT RÉSOUDRE ?</T>
      <Laptop x={960} y={590} s={1.25} sc={pp(t, c0 + 0.3)}><T x={0} y={-70} s={110} c={YEL} sc={pp(t, c0 + 0.6)}>?</T></Laptop>
      {Q4P.map(([x, y, s], i) => { const hw = chipW(s, 32) / 2, at = mid(59, 0.18 + i * 0.08);
        return <g key={s}><Draw d={`M${x < 960 ? x + hw + 14 : x - hw - 14} ${y} L${x < 960 ? 790 : 1130} ${y < 540 ? 470 : 600}`} p={k(t, at + 0.1, 0.4)} c={LINE} w={3} dash="10 10" />
          <Chip x={x} y={y} text={s} c={i === 3 ? RED : SOFT} sc={pp(t, at)} s={32} /></g>; })}
      <Chip x={960} y={900} text="d’abord : dire précisément ce qu’est un algorithme" c={YEL} fg="#14101f" sc={pp(t, mid(59, 0.72))} s={34} />
    </g>
    <g opacity={k(t, S(60), 0.4)}>
      <T x={960} y={150} s={52} c={W}>TROIS QUESTIONS</T>
      {Q4Q.map(([ls, sec], i) => { const c = i === 2 ? RED : YEL;
        return <Card key={sec} x={110 + i * 590} y={250} w={520} h={580} c={c} p={pp(t, mid(60, 0.1 + i * 0.27))}>
          <circle cx={260} cy={140} r={70} fill={SOFT} stroke={c} strokeWidth={5} /><T x={260} y={144} s={84} c={c}>{i + 1}</T>
          {ls.map((l, j) => <T key={j} x={260} y={290 + j * 50} s={31} c={W} f="InterX">{l}</T>)}
          <Chip x={260} y={490} text={`sections ${sec}`} c={SOFT} s={28} /></Card>; })}
    </g>
  </>; };

/* ---------- 61–65 : la calculabilité, la machine en bref, le 7-uplet, trois issues ---------- */
const BX = 610, BCW = 100;
const TUP4: [React.ReactNode, string, string][] = [["Q", "états", YEL], ["Σ", "alphabet d’entrée", YEL], ["Γ", "alphabet du ruban", YEL], ["δ", "transition", YEL], [sub4("q", "0"), "état initial", YEL], [sub4("q", "acc"), "acceptation", GRN], [sub4("q", "rej"), "rejet", RED]];
const STEPS4: [string, number][] = [["lit a = 0", 0.1], ["écrit b = 1", 0.24], ["déplace → D", 0.4], ["passe en q′", 0.56]];
const Brief4 = (t: number) => { const wr = t > mid(63, 0.24), hp = 2 + k(t, mid(63, 0.4), 0.45), st = t > mid(63, 0.56), row = t > S(63) - 0.1;
  return <>
    <g opacity={fade(t, S(61), S(62) - 0.05)}>
      <T x={960} y={140} s={52} c={W} sc={pp(t, S(61) + 0.1)}>LA CALCULABILITÉ</T>
      <T x={960} y={215} s={30} c={DIM} f="InterX" sc={pp(t, S(61) + 0.3)}>étudie les problèmes que l’on peut résoudre par un algorithme</T>
      <Doc x={380} y={560} s={0.75} sc={pp(t, S(61) + 0.4)} title="un problème" />
      <Arr a={[380, 560]} b={[960, 560]} r={130} p={k(t, mid(61, 0.3), 0.4)} />
      <MTBox x={960} y={560} sc={pp(t, mid(61, 0.34))} label="?" c={YEL} /><T x={960} y={670} s={30} c={YEL} f="InterX" sc={pp(t, mid(61, 0.4))}>une méthode ?</T>
      {[0, 1, 2, 3, 4].map((j) => { const y = 340 + j * 110, at = mid(61, 0.5 + j * 0.07);
        return <g key={j} opacity={k(t, at, 0.3)}><Draw d={`M1060 560 L1290 ${y}`} p={k(t, at, 0.3)} c={LINE} w={3} />
          <C4Line x={1320} y={y} s={32} f={KM}>{j === 4 ? "entrée  …" : `entrée  ${j + 1}`}</C4Line><Tick x={1560} y={y} ok sc={pp(t, at + 0.15)} s={0.9} /></g>; })}
      <Chip x={960} y={930} text="la bonne réponse pour TOUTES les entrées possibles ?" c={YEL} fg="#14101f" sc={pp(t, mid(61, 0.86))} s={32} />
    </g>
    <g opacity={fade(t, S(62), S(64) - 0.05)}>
      <T x={960} y={110} s={46} c={W}>LA MACHINE DE TURING EN BREF</T>
      <Tape x={BX} y={340} cells={["_", "1", wr ? "1" : "0", "1", "1", "_", "_"]} cw={BCW} p={k(t, S(62) + 0.2, 0.8)} hl={t > S(63) ? { [Math.round(hp)]: YEL } : {}} />
      <C4Num x={720} y={448} n={1} sc={pp(t, mid(62, 0.12))} /><C4Line x={752} y={448} s={30} sc={pp(t, mid(62, 0.12))}>un ruban infini, découpé en cases</C4Line>
      <HeadBox x={cxOf(BX, hp, BCW)} y={340} st={st ? "q′" : "q"} sc={pp(t, mid(62, 0.3))} />
      <C4Num x={175} y={212} n={2} sc={pp(t, mid(62, 0.32))} /><T x={700} y={212} s={30} c={W} f="InterX" anchor="end" sc={pp(t, mid(62, 0.32))}>une tête de lecture / écriture</T>
      <Card x={230} y={520} w={680} h={310} p={pp(t, mid(62, 0.52))} title="ÉTATS · la mémoire" tc={YEL}>
        <C4Num x={40} y={44} n={3} sc={1} />
        {[[sub4("q", "0"), 0], ["q", 1], ["q′", 2]].map(([l, j]) => <St key={j as number} x={170 + (j as number) * 170} y={175} l={l as React.ReactNode} r={48} ls={30} c={(j === 1 && row && !st) || (j === 2 && st) ? YEL : W} hot={(j === 1 && row && !st) || (j === 2 && st)} />)}
        <T x={340} y={270} s={26} c={DIM} f="InterX">un nombre fini d’états</T></Card>
      <Card x={1010} y={520} w={680} h={310} p={pp(t, mid(62, 0.76))} title="TRANSITIONS · le programme" tc={YEL}>
        <C4Num x={40} y={44} n={4} sc={1} />
        {["δ(q, 0) = (q′, 1, D)", "δ(q′, 1) = (q′, 1, D)", "δ(q′, ⊔) = (q, ⊔, G)"].map((l, j) => <g key={l}>{j === 0 && row && <rect x={90} y={88} width={500} height={60} rx={14} fill={YEL} fillOpacity={0.14} stroke={YEL} strokeWidth={3} />}
          <T x={340} y={118 + j * 62} s={34} c={j === 0 && row ? YEL : W} f={KM}>{l}</T></g>)}
      </Card>
      {STEPS4.map(([l, f], j) => <Chip key={l} x={390 + j * 380} y={900} text={l} c={t > mid(63, f) + 0.5 ? SOFT : YEL} fg={t > mid(63, f) + 0.5 ? W : "#14101f"} sc={pp(t, mid(63, f))} s={30} />)}
      <T x={960} y={985} s={40} c={W} f={KM} sc={pp(t, mid(63, 0.75))}>δ(q, a) = (q′, b, D)</T>
    </g>
    <g opacity={k(t, S(64), 0.4)}>
      <T x={960} y={130} s={46} c={W}>DÉFINITION : UN 7-UPLET</T>
      <T x={195} y={300} s={64} c={W} f={KM} sc={pp(t, S(64) + 0.2)}>M = (</T>
      {TUP4.map(([s, l, c], i) => { const x = 360 + i * 215, at = mid(64, 0.14 + i * 0.1);
        return <g key={i}><T x={x} y={300} s={64} c={c} f={KM} sc={pp(t, at)}>{s}</T>{i < 6 && <T x={x + 107} y={316} s={60} c={W} f={KM} sc={pp(t, at)}>,</T>}
          <T x={x} y={385} s={22} c={DIM} f="InterX" sc={pp(t, at + 0.1)}>{l}</T></g>; })}
      <T x={1740} y={300} s={64} c={W} f={KM} sc={pp(t, mid(64, 0.86))}>)</T>
      {([["ACCEPTE", GRN, "acc"], ["REJETTE", RED, "rej"], ["BOUCLE", YEL, ""]] as [string, string, string][]).map(([n, c, q], i) =>
        <Card key={n} x={140 + i * 570} y={480} w={500} h={330} c={c} p={pp(t, mid(65, 0.06 + i * 0.2))} title={n} tc={c}>
          {q ? <St x={250} y={170} l={sub4("q", q)} c={c} acc={i === 0} r={58} ls={34} hot /> : <C4Loop x={250} y={170} t={t} r={52} c={YEL} />}
          <T x={250} y={280} s={28} c={W} f="InterX">{q ? <>elle atteint {sub4("q", q)}</> : "elle ne s’arrête jamais"}</T></Card>)}
      <Chip x={960} y={900} text="c’est la troisième issue qui rend la calculabilité subtile" c={YEL} fg="#14101f" sc={pp(t, mid(65, 0.72))} s={34} />
    </g>
  </>; };

/* ---------- 66–71 : fonction calculable, Church–Turing, la machine « successeur » ---------- */
const SUX = 500, SUCW = 110;
const SUTR: [string, React.ReactNode, string, number][] = [["0", sub4("q", "0"), "111", 0], ["1", sub4("q", "0"), "111", 1], ["2", sub4("q", "0"), "111", 2], ["3", sub4("q", "0"), "111⊔", 3], ["4", sub4("q", "acc"), "1111⊔", 4]];
const Succ = (t: number) => { const ts = [0, 1, 2, 3].map((j) => mid(70, 0.12 + j * 0.17)), n = ts.filter((x) => t > x).length, hp = ts.reduce((a, x) => a + k(t, x, 0.35), 0), done = n >= 4;
  return <>
    <g opacity={1 - k(t, S(68) - 0.25, 0.45)}>
      <Card x={110} y={150} w={840} h={430} c={YEL} p={pp(t, S(66) + 0.15)} title="FONCTION CALCULABLE" tc={YEL}>
        <T x={110} y={190} s={46} c={W} f={KI} it sc={pp(t, S(66) + 0.5)}>x</T><Draw d="M150 190 H290" p={k(t, S(66) + 0.6, 0.3)} c={W} w={5} /><Head x={296} y={190} p={k(t, S(66) + 0.6, 0.3)} c={W} s={0.6} />
        <MTBox x={420} y={190} sc={pp(t, S(66) + 0.7)} /><Draw d="M520 190 H660" p={k(t, mid(66, 0.45), 0.3)} c={W} w={5} /><Head x={666} y={190} p={k(t, mid(66, 0.45), 0.3)} c={W} s={0.6} />
        <T x={745} y={190} s={46} c={GRN} f={KM} sc={pp(t, mid(66, 0.5))}>f(x)</T>
        <Chip x={420} y={315} text="pour toute entrée x : elle s’arrête, f(x) sur le ruban" c={GRN} fg="#0b1a10" sc={pp(t, mid(66, 0.62))} s={26} />
        <T x={420} y={380} s={28} c={DIM} f="InterX" sc={pp(t, mid(66, 0.8))}>en un nombre fini d’étapes</T></Card>
      <Card x={990} y={150} w={820} h={430} p={pp(t, S(67) + 0.15)} title="THÈSE DE CHURCH–TURING" tc={W}>
        <T x={410} y={140} s={34} c={W} f="InterX" sc={pp(t, S(67) + 0.4)}>tout ce qu’une procédure mécanique calcule</T><T x={410} y={205} s={50} c={YEL} f={KM} sc={pp(t, mid(67, 0.25))}>⇓</T>
        <T x={410} y={270} s={34} c={W} f="InterX" sc={pp(t, mid(67, 0.3))}>une machine de Turing le calcule</T>
        <Chip x={410} y={365} text="une thèse, pas un théorème : notion intuitive" c={SOFT} sc={pp(t, mid(67, 0.62))} s={26} /></Card>
      <T x={960} y={720} s={34} c={DIM} f="InterX" sc={pp(t, mid(67, 0.8))}>un fondement de l’informatique théorique</T>
    </g>
    <g opacity={k(t, S(68), 0.4)}>
      <T x={960} y={110} s={50} c={W}>EXEMPLE : f(n) = n + 1</T>
      <Card x={110} y={180} w={560} h={300} p={pp(t, S(68) + 0.2)} title="NOTATION UNAIRE" tc={YEL}>
        {([["0", "mot vide"], ["1", "1"], ["2", "11"], ["3", "111"]] as [string, string][]).map(([a, b], i) => <g key={a} opacity={k(t, mid(68, 0.4 + i * 0.1), 0.3)}>
          <T x={150} y={105 + i * 50} s={32} c={W} f={KM}>{a}</T><T x={230} y={105 + i * 50} s={30} c={DIM} f={KM}>→</T>
          <C4Line x={300} y={105 + i * 50} s={i ? 34 : 28} c={i === 3 ? YEL : i ? W : DIM} f={i ? KM : "InterX"}>{b}</C4Line></g>)}</Card>
      <St x={950} y={350} l={sub4("q", "0")} init sc={pp(t, S(69) + 0.15)} c={done ? W : t > S(70) ? YEL : W} hot={t > S(70) && !done} />
      <St x={1580} y={350} l={sub4("q", "acc")} acc sc={pp(t, S(69) + 0.3)} c={GRN} hot={done} ls={28} />
      <SelfLoop x={950} y={350} p={k(t, mid(69, 0.2), 0.5)} label="1 → 1, D" />
      <Arr a={[950, 350]} b={[1580, 350]} p={k(t, mid(69, 0.55), 0.5)} label="⊔ → 1, D" c={GRN} lo={-34} />
      <T x={1265} y={455} s={26} c={DIM} f="InterX" sc={pp(t, mid(69, 0.7))}>lire, écrire, déplacer</T>
      <g opacity={k(t, mid(68, 0.78), 0.4)}>
        <Tape x={SUX} y={665} cells={["1", "1", "1", done ? "1" : "_", "_"]} cw={SUCW} p={1} hl={t > S(70) ? { [Math.round(hp)]: done ? GRN : YEL } : {}} />
        <HeadBox x={cxOf(SUX, hp, SUCW)} y={665} cw={SUCW} st={done ? sub4("q", "acc") : sub4("q", "0")} c={done ? GRN : YEL} sc={1} />
        <T x={SUX + 165} y={760} s={26} c={DIM} f="InterX">n = 3</T></g>
      <Card x={1300} y={520} w={520} h={420} p={pp(t, S(70) + 0.1)} title="EXÉCUTION" tc={YEL}>
        {["étape", "état", "ruban"].map((h, j) => <T key={h} x={90 + j * 170} y={100} s={24} c={DIM} f="InterX">{h}</T>)}
        {SUTR.map(([e, s, r, u], j) => <g key={e} opacity={t > (j ? ts[j - 1] : S(70) + 0.3) ? 1 : 0}>
          <T x={90} y={150 + j * 55} s={30} c={W} f={KM}>{e}</T><T x={260} y={150 + j * 55} s={30} c={j === 4 ? GRN : W} f={KM}>{s}</T>
          <T x={430} y={150 + j * 55} s={30} c={W} f={KM}>{r.split("").map((ch, ci) => <tspan key={ci} fill={ci === u ? YEL : W} style={ci === u ? { textDecoration: "underline" } : undefined}>{ch}</tspan>)}</T></g>)}</Card>
      <T x={780} y={850} s={44} c={W} f={KM} sc={pp(t, S(71) + 0.2)}>{sup4("1", "n")}{"  ↦  "}{sup4("1", "n+1")}</T>
      <T x={780} y={915} s={28} c={DIM} f="InterX" sc={pp(t, mid(71, 0.3))}>n + 1 étapes, pour tout n (même n = 0)</T>
      <Chip x={960} y={995} text="la fonction successeur est calculable" c={GRN} fg="#0b1a10" sc={pp(t, mid(71, 0.62))} s={32} />
    </g>
  </>; };

/* ---------- 72–77 : problèmes de décision, décidable / semi-décidable / indécidable, coder en mots ---------- */
const DCARDS: [string, string, number, string[]][] = [["DÉCIDABLE", GRN, 73, ["toujours une réponse,", "en temps fini"]], ["SEMI-DÉCIDABLE", YEL, 74, ["« oui » : on finit par le savoir", "« non » : attente peut-être infinie"]], ["INDÉCIDABLE", RED, 73.6, ["aucune méthode", "ne répond toujours"]]];
const at4 = (x: number) => (Number.isInteger(x) ? S(x) + 0.15 : mid(Math.floor(x), x - Math.floor(x)));
const Decide = (t: number) => <>
  <g opacity={1 - k(t, S(76) - 0.25, 0.45)}>
    <T x={960} y={120} s={50} c={W} sc={pp(t, S(72) + 0.1)}>PROBLÈMES DE DÉCISION</T>
    <T x={960} y={205} s={38} c={W} f="InterX" sc={pp(t, S(72) + 0.4)}>« cet entier est-il premier ? »  →  OUI / NON</T>
    <Chip x={640} y={292} text="29 → OUI · instance positive" c={GRN} fg="#0b1a10" sc={pp(t, mid(72, 0.62))} s={30} />
    <Chip x={1280} y={292} text="91 → NON · instance négative" c={RED} sc={pp(t, mid(72, 0.75))} s={30} />
    {DCARDS.map(([n, c, a, intu], i) => { const x = [105, 690, 1275][i];
      return <Card key={n} x={x} y={370} w={540} h={520} c={c} p={pp(t, at4(a))} title={n} tc={c}>
        {i === 0 && <><MTBox x={170} y={160} sc={1} c={GRN} /><Chip x={400} y={125} text="OUI" c={GRN} fg="#0b1a10" s={28} /><Chip x={400} y={195} text="NON" c={GRN} fg="#0b1a10" s={28} />
          <T x={270} y={270} s={26} c={W} f="InterX">s’arrête sur toute instance</T><T x={270} y={310} s={26} c={W} f="InterX">avec la bonne réponse</T></>}
        {i === 1 && <><C4Line x={40} y={135} s={26}>instance positive</C4Line><Chip x={390} y={135} text="OUI" c={GRN} fg="#0b1a10" s={26} sc={pp(t, mid(74, 0.35))} /><Tick x={470} y={135} ok sc={pp(t, mid(74, 0.4))} s={0.8} />
          <C4Line x={40} y={225} s={26}>instance négative</C4Line><Chip x={390} y={225} text="NON ?" c={SOFT} s={26} sc={pp(t, mid(74, 0.6))} /><C4Loop x={480} y={225} t={t} r={26} c={YEL} o={k(t, mid(74, 0.66))} />
          <T x={270} y={310} s={26} c={DIM} f="InterX" sc={pp(t, mid(74, 0.75))}>peut ne jamais s’arrêter</T></>}
        {i === 2 && <><path d="M190 100 L350 240 M350 100 L190 240" stroke={RED} strokeWidth={14} strokeLinecap="round" opacity={0.9} />
          <T x={270} y={290} s={26} c={W} f="InterX">aucun algorithme ne s’arrête</T><T x={270} y={328} s={26} c={W} f="InterX">avec la bonne réponse partout</T></>}
        <g opacity={k(t, S(75) + 0.2 + i * 0.6, 0.4)}><line x1={40} x2={500} y1={378} y2={378} stroke={c} strokeOpacity={0.35} strokeWidth={2} />
          <T x={270} y={405} s={20} c={c} f="InterX" ls={3}>EN INTUITION</T>
          {intu.map((l, j) => <T key={j} x={270} y={445 + j * 36} s={25} c={W} f="InterX">{l}</T>)}</g></Card>; })}
    <Chip x={960} y={965} text="le problème de l’arrêt : semi-décidable, mais indécidable" c={YEL} fg="#14101f" sc={pp(t, mid(75, 0.72))} s={32} />
  </g>
  <g opacity={k(t, S(76), 0.4)}>
    <T x={960} y={120} s={50} c={W}>CHAQUE INSTANCE DEVIENT UN MOT</T>
    <g opacity={k(t, mid(76, 0.12), 0.4)}><T x={380} y={290} s={90} c={W} f={KM}>13</T>
      <Draw d="M380 360 V420" p={k(t, mid(76, 0.18), 0.3)} c={LINE} w={4} /><Chip x={380} y={470} text="1101" c={YEL} fg="#14101f" s={34} sc={pp(t, mid(76, 0.2))} />
      <T x={380} y={545} s={26} c={DIM} f="InterX">un entier → écriture binaire</T></g>
    <g opacity={k(t, mid(76, 0.35), 0.4)}>{([[900, 240], [1020, 240], [960, 335]] as [number, number][]).map(([x, y], j, A) => <g key={j}><line x1={x} y1={y} x2={A[(j + 1) % 3][0]} y2={A[(j + 1) % 3][1]} stroke={W} strokeWidth={4} /></g>)}
      {([[900, 240], [1020, 240], [960, 335]] as [number, number][]).map(([x, y], j) => <circle key={j} cx={x} cy={y} r={20} fill={PANEL} stroke={YEL} strokeWidth={4} />)}
      <Draw d="M960 370 V420" p={k(t, mid(76, 0.42), 0.3)} c={LINE} w={4} /><Chip x={960} y={470} text="011 101 110" c={YEL} fg="#14101f" s={34} sc={pp(t, mid(76, 0.45))} />
      <T x={960} y={545} s={26} c={DIM} f="InterX">un graphe → matrice d’adjacence</T></g>
    <g opacity={k(t, mid(76, 0.6), 0.4)}><MTBox x={1540} y={290} sc={1} /><Draw d="M1540 360 V420" p={k(t, mid(76, 0.66), 0.3)} c={LINE} w={4} />
      <Chip x={1540} y={470} text="⟨M⟩ = 0110 0101 …" c={YEL} fg="#14101f" s={32} sc={pp(t, mid(76, 0.7))} />
      <T x={1540} y={545} s={26} c={DIM} f="InterX">une machine → sa table de transitions</T></g>
    <g opacity={k(t, S(77), 0.4)}>
      <Ring cx={560} cy={810} rx={430} ry={170} p={k(t, S(77) + 0.2, 0.7)} c={LINE} /><T x={190} y={680} s={40} c={W} f={KM}>{sup4("Σ", "*")}</T>
      <Ring cx={650} cy={820} rx={220} ry={100} p={k(t, mid(77, 0.2), 0.6)} c={GRN} fo={0.14} /><T x={650} y={745} s={34} c={GRN} f={KM} sc={pp(t, mid(77, 0.25))}>{sub4("L", "P")}</T>
      {([[580, 830, "29", 1], [690, 800, "13", 1], [740, 860, "7", 1], [280, 810, "91", 0], [360, 900, "8", 0], [960, 820, "15", 0], [900, 735, "1", 0]] as [number, number, string, number][]).map(([x, y, s, ok], j) =>
        <T key={j} x={x} y={y} s={30} c={ok ? GRN : DIM} f={KM} sc={pp(t, mid(77, 0.3 + j * 0.03))}>{s}</T>)}
      <Card x={1120} y={630} w={700} h={330} c={YEL} p={pp(t, mid(77, 0.45))} title="FONCTION CARACTÉRISTIQUE" tc={YEL}>
        <C4Line x={60} y={130} s={36} f={KM}>{CHI}(w) = 1   si  w ∈ {sub4("L", "P")}</C4Line><C4Line x={60} y={190} s={36} f={KM}>{CHI}(w) = 0   sinon</C4Line>
        <Chip x={350} y={275} text="P décidable ⇔ χ calculable" c={GRN} fg="#0b1a10" s={30} sc={pp(t, mid(77, 0.75))} /></Card>
    </g>
  </g>
</>;

/* ---------- 78–81 : la primalité est décidable ; l'arrêt, lui, n'a pas de borne ---------- */
const Prime = (t: number) => { const runAt = (r: number, j: number) => mid(79, (r ? 0.5 : 0.08) + j * 0.06), steps = Math.floor(Math.pow(10, 1 + Math.max(0, t - S(81) - 0.6) * 0.55));
  return <>
    <T x={960} y={105} s={50} c={W} sc={pp(t, S(78) + 0.1)}>EXEMPLE : LA PRIMALITÉ</T>
    <Win x={110} y={170} w={780} h={340} p={pp(t, S(78) + 0.3)} title="algorithme">
      {([["pour d de 2 à ⌊√n⌋ :", 60, YEL], ["si d divise n : répondre NON, s’arrêter", 110, W], ["répondre OUI", 60, YEL]] as [string, number, string][]).map(([l, x, c], i) =>
        <C4Line key={i} x={x} y={125 + i * 70} s={32} c={c} sc={pp(t, mid(78, 0.15 + i * 0.22))}>{l}</C4Line>)}</Win>
    {[0, 1].map((r) => { const n = r ? 91 : 29, ds = r ? [2, 3, 4, 5, 6, 7] : [2, 3, 4, 5], y = r ? 420 : 230;
      return <g key={n} opacity={k(t, runAt(r, 0) - 0.3, 0.3)}><C4Line x={970} y={y} s={40} f={KM}>n = {n}</C4Line>
        {ds.map((d, j) => { const hit = r === 1 && d === 7; return <Chip key={d} x={1220 + j * 105} y={y} text={`d=${d}`} c={hit ? YEL : SOFT} fg={hit ? "#14101f" : W} s={26} sc={pp(t, runAt(r, j))} />; })}
        {r === 0 ? <Chip x={1400} y={312} text="aucun d ne divise 29 → OUI" c={GRN} fg="#0b1a10" s={28} sc={pp(t, runAt(0, 4) + 0.2)} />
          : <><T x={1250} y={505} s={34} c={YEL} f={KM} sc={pp(t, runAt(1, 6))}>91 = 7 × 13</T><Chip x={1610} y={505} text="→ NON" c={RED} s={30} sc={pp(t, runAt(1, 6) + 0.25)} /></>}</g>; })}
    <Card x={110} y={580} w={840} h={390} c={GRN} p={pp(t, S(80) + 0.15)} title="POURQUOI ÇA MARCHE" tc={GRN}>
      <C4Line x={50} y={120} s={28} c={YEL} sc={pp(t, S(80) + 0.4)}>terminaison</C4Line><C4Line x={240} y={120} s={28} sc={pp(t, S(80) + 0.4)}>au plus ⌊√n⌋ − 1 itérations</C4Line>
      <C4Line x={240} y={165} s={24} c={DIM} sc={pp(t, mid(80, 0.2))}>un nombre fini, connu à l’avance</C4Line>
      <C4Line x={50} y={225} s={28} c={YEL} sc={pp(t, mid(80, 0.4))}>correction</C4Line><C4Line x={240} y={225} s={28} sc={pp(t, mid(80, 0.4))}>n = a · b, a ≤ b  ⇒  a ≤ √n</C4Line>
      <C4Line x={240} y={270} s={24} c={DIM} sc={pp(t, mid(80, 0.5))}>s’il existe un diviseur, on le trouve</C4Line>
      <Chip x={420} y={335} text="la primalité est décidable" c={GRN} fg="#0b1a10" s={30} sc={pp(t, mid(80, 0.72))} /></Card>
    <Card x={990} y={580} w={820} h={390} c={RED} p={pp(t, S(81) + 0.15)} title="LE PROBLÈME DE L’ARRÊT" tc={RED}>
      <T x={410} y={115} s={30} c={W} f="InterX">aucune borne connue sur le nombre d’étapes</T>
      <rect x={60} y={170} width={620} height={34} rx={17} fill={SOFT} stroke={LINE} strokeOpacity={0.4} strokeWidth={2} />
      <rect x={60} y={170} width={620 * (0.15 + 0.8 * (((t - S(81)) * 0.35) % 1))} height={34} rx={17} fill={RED} opacity={0.75} />
      <C4Loop x={740} y={187} t={t} r={28} c={RED} o={k(t, S(81) + 0.4)} />
      <T x={410} y={250} s={30} c={DIM} f={KM}>étapes : {steps.toLocaleString("fr-FR")} …</T>
      <T x={410} y={320} s={32} c={YEL} f="InterX" sc={pp(t, mid(81, 0.6))}>finira-t-il un jour ? on ne peut pas savoir</T></Card>
  </>; };

/* ---------- 82–84 : complémentaire, union, intersection ; les réductions ---------- */
const Props4 = (t: number) => { const sw = k(t, mid(82, 0.25), 0.6);
  return <>
    <T x={960} y={105} s={50} c={W} sc={pp(t, S(82) + 0.1)}>PROPRIÉTÉS UTILES</T>
    <Card x={110} y={170} w={820} h={330} c={GRN} p={pp(t, S(82) + 0.25)} title="COMPLÉMENTAIRE" tc={GRN}>
      <MTBox x={190} y={190} sc={1} c={GRN} /><Arr a={[280, 190]} b={[440, 150]} r={0} p={1} c={LINE} w={3} /><Arr a={[280, 190]} b={[440, 240]} r={0} p={1} c={LINE} w={3} />
      <Chip x={520} y={150 + 90 * sw} text="OUI" c={GRN} fg="#0b1a10" s={30} /><Chip x={520} y={240 - 90 * sw} text="NON" c={RED} s={30} />
      <C4Line x={600} y={195} s={24} c={DIM}>on échange</C4Line><C4Line x={600} y={230} s={24} c={DIM}>les réponses</C4Line></Card>
    <Card x={990} y={170} w={820} h={330} c={GRN} p={pp(t, mid(82, 0.5))} title="UNION · INTERSECTION" tc={GRN}>
      <MTBox x={160} y={150} sc={0.62} label="P" /><MTBox x={160} y={255} sc={0.62} label="Q" />
      <Arr a={[220, 150]} b={[420, 200]} r={0} p={k(t, mid(82, 0.62), 0.4)} c={LINE} w={3} /><Arr a={[220, 255]} b={[420, 210]} r={0} p={k(t, mid(82, 0.62), 0.4)} c={LINE} w={3} />
      <circle cx={470} cy={205} r={44} fill={SOFT} stroke={W} strokeWidth={4} /><T x={470} y={207} s={40} c={W} f={KM}>∪ ∩</T>
      <Chip x={660} y={205} text="décidable" c={GRN} fg="#0b1a10" s={28} sc={pp(t, mid(82, 0.75))} /></Card>
    <g opacity={k(t, S(83), 0.4)}>
      <T x={960} y={575} s={44} c={YEL}>RÉDUCTION</T><T x={1150} y={575} s={44} c={YEL} f={KM} anchor="start">A {sub4("≤", "m")} B</T>
      <Chip x={230} y={720} text="w" c={SOFT} s={40} sc={pp(t, S(83) + 0.3)} />
      <Arr a={[230, 720]} b={[520, 720]} r={50} p={k(t, mid(83, 0.2), 0.4)} />
      <Gear x={580} y={720} r={46} a={t * 60} c={YEL} /><T x={580} y={810} s={26} c={YEL} f="InterX">h calculable</T>
      <Arr a={[580, 720]} b={[860, 720]} r={70} p={k(t, mid(83, 0.35), 0.4)} />
      <Chip x={930} y={720} text="h(w)" c={SOFT} s={40} sc={pp(t, mid(83, 0.4))} />
      <T x={600} y={895} s={42} c={W} f={KM} sc={pp(t, mid(83, 0.62))}>w ∈ A  ⇔  h(w) ∈ B</T>
      <g opacity={k(t, S(84) + 0.1, 0.4)}><Arr a={[930, 720]} b={[1200, 720]} r={80} p={k(t, S(84) + 0.2, 0.4)} />
        <MTBox x={1290} y={720} sc={1} c={GRN} label="B" /><T x={1290} y={815} s={24} c={DIM} f="InterX">décideur de B</T>
        <Arr a={[1380, 720]} b={[1560, 670]} r={0} p={k(t, mid(84, 0.25), 0.4)} c={LINE} w={3} /><Arr a={[1380, 720]} b={[1560, 770]} r={0} p={k(t, mid(84, 0.25), 0.4)} c={LINE} w={3} />
        <Chip x={1640} y={670} text="OUI" c={GRN} fg="#0b1a10" s={28} /><Chip x={1640} y={770} text="NON" c={RED} s={28} /></g>
      <Chip x={1380} y={890} text="B décidable ⇒ A décidable" c={GRN} fg="#0b1a10" s={30} sc={pp(t, mid(84, 0.35))} />
      <Chip x={960} y={985} text="contraposée : A indécidable ⇒ B indécidable · la méthode standard" c={RED} s={30} sc={pp(t, mid(84, 0.62))} />
    </g>
  </>; };

/* ---------- 85–89 : reconnaissable / décidable, le théorème, les exemples, la clôture ---------- */
const EXL: [React.ReactNode, number, number][] = [
  [<>{"{ "}{sup4("a", "n")}{sup4("b", "n")}{" | n ≥ 0 }"}</>, 1, 1], [<>{"{ "}{sup4("a", "n")}{sup4("b", "n")}{sup4("c", "n")}{" | n ≥ 0 }"}</>, 1, 1], ["mots de longueur paire", 1, 1],
  [<>{sub4("A", "TM")}{" = { ⟨M, w⟩ | M accepte w }"}</>, 0, 1], ["HALT = { ⟨M, w⟩ | M s’arrête sur w }", 0, 1], [<>{"complémentaire de "}{sub4("A", "TM")}</>, 0, 0]];
const CLO = ["union", "intersection", "complémentaire", "concaténation", "étoile"];
const RecDec = (t: number) => { const lane = (j: number, d: number) => mid(87, 0.32 + j * 0.06 + d), acc = t > mid(87, 0.32 + 5 * 0.06 + 0.03) + 0.2;
  return <>
    <g opacity={1 - k(t, S(88) - 0.25, 0.45)}>
      <Card x={110} y={110} w={840} h={330} c={YEL} p={pp(t, S(85) + 0.15)} title="RECONNAISSABLE" tc={YEL}>
        <C4Line x={50} y={140} s={30} f={KM}>w ∈ L</C4Line><C4Line x={200} y={140} s={30}>→ s’arrête et accepte</C4Line><Tick x={720} y={140} ok sc={pp(t, mid(85, 0.15))} s={0.9} />
        <C4Line x={50} y={230} s={30} f={KM}>w ∉ L</C4Line><C4Line x={200} y={230} s={30}>→ rejette, ou boucle</C4Line><C4Loop x={720} y={230} t={t} r={28} c={YEL} o={k(t, mid(85, 0.25))} /></Card>
      <Card x={990} y={110} w={820} h={330} c={GRN} p={pp(t, mid(85, 0.45))} title="DÉCIDABLE" tc={GRN}>
        <C4Line x={50} y={140} s={30} f={KM}>w ∈ L</C4Line><C4Line x={200} y={140} s={30}>→ accepte</C4Line><Tick x={700} y={140} ok sc={pp(t, mid(85, 0.55))} s={0.9} />
        <C4Line x={50} y={230} s={30} f={KM}>w ∉ L</C4Line><C4Line x={200} y={230} s={30}>→ rejette</C4Line><Tick x={700} y={230} ok={false} sc={pp(t, mid(85, 0.6))} s={0.9} />
        <Chip x={410} y={295} text="elle s’arrête toujours" c={GRN} fg="#0b1a10" s={26} sc={pp(t, mid(85, 0.72))} /></Card>
      <g opacity={k(t, S(86), 0.4)}>
        <Ring cx={480} cy={740} rx={370} ry={215} p={k(t, S(86) + 0.2, 0.7)} c={YEL} /><T x={480} y={578} s={32} c={YEL}>RECONNAISSABLES</T>
        <Ring cx={430} cy={780} rx={190} ry={110} p={k(t, mid(86, 0.25), 0.6)} c={GRN} fo={0.14} /><T x={430} y={780} s={32} c={GRN}>DÉCIDABLES</T>
        <circle cx={720} cy={760} r={12} fill={RED} opacity={k(t, mid(86, 0.6))} /><T x={720} y={720} s={28} c={RED} f="InterX" sc={pp(t, mid(86, 0.6))}>HALT</T>
        <Chip x={480} y={995} text="décidable ⇒ reconnaissable · la réciproque est fausse" c={SOFT} s={26} sc={pp(t, mid(86, 0.5))} /></g>
      <Card x={920} y={490} w={900} h={500} c={YEL} p={pp(t, S(87) + 0.15)} title="THÉORÈME" tc={YEL}>
        <T x={450} y={110} s={32} c={W} f="InterX">L décidable  ⇔  L et {OVL("L")} reconnaissables</T>
        {[0, 1].map((r) => <g key={r}><T x={110} y={210 + r * 100} s={30} c={W} f={KM}>{sub4("M", r ? "2" : "1")}</T><T x={110} y={244 + r * 100} s={18} c={DIM} f="InterX">reconnaît {r ? OVL("L") : "L"}</T>
          {[0, 1, 2, 3, 4, 5, 6].map((j) => { const show = t > lane(j, r * 0.03) && (!acc || j <= 5), win = acc && r === 1 && j === 5;
            return show ? <rect key={j} x={190 + j * 62} y={190 + r * 100} width={48} height={40} rx={8} fill={win ? GRN : YEL} opacity={!acc ? 0.85 : win ? 1 : r === 1 ? 0.5 : 0.25} /> : null; })}
          {r === 1 && acc && <Chip x={720} y={310} text="ACCEPTE" c={GRN} fg="#0b1a10" s={26} />}</g>)}
        <C4Line x={190} y={385} s={22} c={DIM} sc={pp(t, mid(87, 0.3))}>en parallèle, une étape chacune à tour de rôle</C4Line>
        <Chip x={450} y={445} text={acc ? "M₂ accepte : w ∉ L, on rejette → un décideur pour L" : "l’une des deux finit par accepter"} c={acc ? GRN : SOFT} fg={acc ? "#0b1a10" : W} s={26} sc={pp(t, mid(87, 0.45))} /></Card>
    </g>
    <g opacity={k(t, S(88), 0.4)}>
      <Card x={260} y={100} w={1400} h={560} p={pp(t, S(88) + 0.15)} title="EXEMPLES" tc={YEL}>
        {["langage", "décidable ?", "reconnaissable ?"].map((h, j) => <T key={h} x={[360, 900, 1180][j]} y={110} s={24} c={DIM} f="InterX">{h}</T>)}
        <line x1={50} x2={1350} y1={138} y2={138} stroke={LINE} strokeOpacity={0.3} strokeWidth={2} />
        {EXL.map(([l, d, r], j) => <g key={j} opacity={k(t, mid(88, 0.08 + j * 0.13), 0.3)}>
          <T x={360} y={185 + j * 62} s={30} c={W} f={KM}>{l}</T>
          <T x={900} y={185 + j * 62} s={30} c={d ? GRN : RED} f="InterX">{d ? "oui" : "NON"}</T><T x={1180} y={185 + j * 62} s={30} c={r ? GRN : RED} f="InterX">{r ? "oui" : "NON"}</T></g>)}</Card>
      <Card x={260} y={700} w={1400} h={290} c={LINE} p={pp(t, S(89) + 0.15)} title="STABILITÉ" tc={W}>
        {[0, 1].map((r) => <g key={r} opacity={k(t, mid(89, r ? 0.4 : 0.1), 0.4)}><T x={200} y={130 + r * 90} s={28} c={r ? YEL : GRN}>{r ? "RECONNAISSABLES" : "DÉCIDABLES"}</T>
          {CLO.map((c, j) => { const bad = r === 1 && j === 2; return <g key={c}><Chip x={490 + j * 205} y={130 + r * 90} text={c} c={bad ? RED : SOFT} s={24} />
            {bad && <path d={`M${490 + j * 205 - 95} ${130 + r * 90} H${490 + j * 205 + 95}`} stroke="#fff" strokeWidth={4} />}</g>; })}</g>)}
        <C4Line x={1060} y={268} s={22} c={DIM} sc={pp(t, mid(89, 0.75))}>sinon, HALT serait décidable</C4Line></Card>
    </g>
  </>; };

/* ---------- 90–93 : l'algorithme selon Turing, la thèse de Church–Turing, modèles équivalents, variantes, machine universelle ---------- */
const MODELS: [string, string, string][] = [["machine de Turing", "", "Turing, 1936"], ["λ-calcul", "", "Church, 1936"], ["fonctions", "récursives", "Gödel, Kleene"], ["machines à registres,", "langages usuels", "époque moderne"]];
const Algo4 = (t: number) => <>
  <g opacity={1 - k(t, S(92) - 0.25, 0.45)}>
    <T x={960} y={100} s={50} c={W} sc={pp(t, S(90) + 0.1)}>QU’EST-CE QU’UN ALGORITHME ?</T>
    <Card x={110} y={170} w={760} h={380} p={pp(t, S(90) + 0.3)} title="INTUITIVEMENT : UNE RECETTE" tc={W}>
      {["1.  casser trois œufs", "2.  battre une minute", "3.  cuire jusqu’à ce que ce soit pris"].map((l, j) => <C4Line key={l} x={70} y={130 + j * 62} s={30} sc={pp(t, mid(90, 0.15 + j * 0.08))}>{l}</C4Line>)}
      <T x={380} y={330} s={26} c={DIM} f="InterX" sc={pp(t, mid(90, 0.42))}>assez détaillée pour être suivie sans réfléchir</T></Card>
    <Arr a={[880, 360]} b={[1060, 360]} r={0} p={k(t, mid(90, 0.55), 0.4)} c={YEL} />
    <Card x={1060} y={170} w={750} h={380} c={YEL} p={pp(t, mid(90, 0.58))} title="SELON TURING" tc={YEL}>
      <MTBox x={160} y={180} sc={1} c={YEL} /><C4Line x={300} y={160} s={30}>une machine qui s’arrête</C4Line><C4Line x={300} y={205} s={30} c={YEL}>sur toutes ses entrées</C4Line>
      <C4Line x={60} y={300} s={22} c={DIM} sc={pp(t, mid(90, 0.8))}>si elle peut boucler : un reconnaisseur, pas un décideur</C4Line></Card>
    <Card x={160} y={610} w={1600} h={360} c={YEL} p={pp(t, S(91) + 0.15)} title="LA THÈSE DE CHURCH–TURING" tc={YEL}>
      <rect x={70} y={95} width={8} height={120} rx={4} fill={YEL} />
      <C4Line x={110} y={125} s={34} c={W}>« Tout ce qui est calculable par une procédure effective</C4Line><C4Line x={110} y={180} s={34} c={W}>est calculable par une machine de Turing. »</C4Line>
      <Chip x={480} y={285} text="intuitif  ⟷  formel" c={SOFT} s={30} sc={pp(t, mid(91, 0.55))} /><Chip x={1110} y={285} text="une thèse, pas un théorème : indémontrable" c={RED} s={30} sc={pp(t, mid(91, 0.72))} /></Card>
  </g>
  <g opacity={k(t, S(92), 0.4)}>
    <T x={960} y={110} s={46} c={W}>DES MODÈLES ÉQUIVALENTS</T>
    {MODELS.map(([a, b, c], i) => <g key={a} transform={`translate(${300 + i * 440} 300) scale(${pp(t, mid(92, 0.1 + i * 0.13))})`}>
      <rect x={-190} y={-105} width={380} height={210} rx={24} fill={PANEL} stroke={i === 0 ? YEL : LINE} strokeWidth={4} />
      <T x={0} y={b ? -35 : -15} s={30} c={i === 0 ? YEL : W} f="InterX">{a}</T>{b && <T x={0} y={8} s={30} c={W} f="InterX">{b}</T>}<T x={0} y={60} s={24} c={DIM} f="InterX">{c}</T></g>)}
    {[0, 1, 2].map((i) => <T key={i} x={520 + i * 440} y={300} s={46} c={YEL} f={KM} sc={pp(t, mid(92, 0.2 + i * 0.13))}>⇔</T>)}
    <Chip x={960} y={480} text="les mêmes fonctions calculables : le meilleur argument pour la thèse" c={YEL} fg="#14101f" s={30} sc={pp(t, mid(92, 0.72))} />
    <Card x={110} y={570} w={800} h={420} c={LINE} p={pp(t, S(93) + 0.15)} title="VARIANTES" tc={W}>
      {["plusieurs rubans", "ruban infini dans les deux sens", "non déterministe (plus lente à simuler)"].map((l, j) => <g key={l} opacity={k(t, S(93) + 0.3 + j * 0.5, 0.3)}><Tick x={70} y={130 + j * 70} ok sc={1} s={0.8} /><C4Line x={110} y={130 + j * 70} s={28}>{l}</C4Line></g>)}
      <Chip x={400} y={355} text="même pouvoir de calcul" c={GRN} fg="#0b1a10" s={30} sc={pp(t, mid(93, 0.35))} /></Card>
    <Card x={960} y={570} w={850} h={420} c={YEL} p={pp(t, mid(93, 0.45))} title="MACHINE UNIVERSELLE" tc={YEL}>
      <T x={150} y={190} s={36} c={W} f={KM}>⟨M⟩, w</T><Arr a={[230, 190]} b={[380, 190]} r={0} p={k(t, mid(93, 0.55), 0.4)} />
      <MTBox x={470} y={190} sc={1} c={YEL} label="U" /><Arr a={[560, 190]} b={[690, 190]} r={0} p={k(t, mid(93, 0.62), 0.4)} />
      <T x={750} y={175} s={26} c={W} f="InterX">fait</T><T x={750} y={210} s={26} c={W} f="InterX">comme M</T>
      <Chip x={425} y={340} text="le programme enregistré" c={YEL} fg="#14101f" s={30} sc={pp(t, mid(93, 0.78))} /></Card>
  </g>
</>;

/* ---------- 94–98 : le problème de l'arrêt, reconnaissable, preuve par l'absurde ---------- */
const HaltP = (t: number) => { const say = (f: number) => k(t, mid(97, f), 0.3), boom = t > mid(97, 0.82);
  return <>
    <g opacity={1 - k(t, S(96) - 0.25, 0.45)}>
      <T x={960} y={105} s={50} c={W} sc={pp(t, S(94) + 0.1)}>LE PROBLÈME DE L’ARRÊT</T>
      <MTBox x={330} y={290} sc={pp(t, S(94) + 0.3)} label="M" /><T x={470} y={290} s={50} c={W} f={KM} sc={pp(t, S(94) + 0.4)}>+</T><Chip x={560} y={290} text="w" c={SOFT} s={40} sc={pp(t, S(94) + 0.5)} />
      <Arr a={[560, 290]} b={[880, 290]} r={60} p={k(t, mid(94, 0.2), 0.4)} /><Chip x={1020} y={290} text="s’arrête ?" c={YEL} fg="#14101f" s={34} sc={pp(t, mid(94, 0.25))} />
      <g transform={`translate(1560 270) scale(${pp(t, mid(94, 0.6))})`}><circle cx={-10} cy={-10} r={62} fill={SOFT} stroke={W} strokeWidth={8} /><path d="M34 34 L96 96" stroke={W} strokeWidth={18} strokeLinecap="round" />
        <T x={-10} y={-8} s={70} c={YEL}>?</T><T x={20} y={150} s={28} c={YEL} f="InterX">un « super-débogueur » ?</T></g>
      <T x={960} y={470} s={44} c={W} f={KM} sc={pp(t, mid(94, 0.4))}>HALT = {"{"} ⟨M, w⟩ | M s’arrête sur w {"}"}</T>
      <Card x={210} y={560} w={1500} h={420} c={GRN} p={pp(t, S(95) + 0.15)} title="HALT EST RECONNAISSABLE" tc={GRN}>
        <T x={140} y={210} s={34} c={W} f={KM}>⟨M, w⟩</T><Arr a={[220, 210]} b={[350, 210]} r={0} p={k(t, S(95) + 0.4, 0.4)} />
        <MTBox x={440} y={210} sc={1} c={W} label="U" /><T x={440} y={300} s={24} c={DIM} f="InterX">simule M sur w</T>
        <Arr a={[530, 210]} b={[800, 140]} r={0} p={k(t, mid(95, 0.3), 0.4)} c={LINE} w={3} /><Arr a={[530, 210]} b={[800, 280]} r={0} p={k(t, mid(95, 0.55), 0.4)} c={LINE} w={3} />
        <C4Line x={820} y={140} s={28} sc={pp(t, mid(95, 0.32))}>M s’arrête → U accepte</C4Line><Tick x={1240} y={140} ok sc={pp(t, mid(95, 0.38))} s={0.9} />
        <C4Line x={820} y={280} s={28} sc={pp(t, mid(95, 0.57))}>M boucle → U boucle aussi</C4Line><C4Loop x={1270} y={280} t={t} r={28} c={RED} o={k(t, mid(95, 0.62))} />
        <Chip x={750} y={365} text="un reconnaisseur, pas un décideur" c={SOFT} s={28} sc={pp(t, mid(95, 0.78))} /></Card>
    </g>
    <g opacity={k(t, S(96), 0.4)}>
      <T x={960} y={105} s={46} c={W}>PREUVE PAR L’ABSURDE</T>
      <g transform={`translate(430 430) scale(${pp(t, S(96) + 0.25)})`}><rect x={-150} y={-100} width={300} height={200} rx={26} fill={SOFT} stroke={boom ? RED : W} strokeWidth={5} /><T x={0} y={0} s={100} c={boom ? RED : W}>H</T></g>
      <T x={430} y={575} s={26} c={DIM} f="InterX" sc={pp(t, S(96) + 0.4)}>supposons : H décide HALT</T>
      <rect x={960} y={200} width={820} height={470} rx={30} fill="none" stroke={YEL} strokeWidth={5} opacity={k(t, mid(96, 0.25))} /><T x={1370} y={245} s={44} c={YEL} sc={pp(t, mid(96, 0.25))}>D</T>
      <T x={1055} y={440} s={30} c={W} f={KM} sc={pp(t, mid(96, 0.3))}>⟨M⟩</T>
      <g transform={`translate(1230 440) scale(${pp(t, mid(96, 0.35))})`}><rect x={-90} y={-70} width={180} height={140} rx={20} fill={SOFT} stroke={W} strokeWidth={4} /><T x={0} y={-12} s={56} c={W}>H</T><T x={0} y={40} s={18} c={DIM} f={KM}>⟨M, ⟨M⟩⟩</T></g>
      <Arr a={[1230, 440]} b={[1600, 340]} r={100} p={k(t, mid(96, 0.6), 0.4)} label="« s’arrête »" ls={24} lo={26} bend={-20} />
      <Arr a={[1230, 440]} b={[1600, 560]} r={100} p={k(t, mid(96, 0.7), 0.4)} label="« boucle »" ls={24} lo={26} bend={20} />
      <C4Loop x={1680} y={340} t={t} r={36} c={RED} o={k(t, mid(96, 0.66))} /><Chip x={1680} y={560} text="STOP" c={RED} s={30} sc={pp(t, mid(96, 0.76))} />
      <Chip x={1370} y={630} text="D fait le contraire de ce que H prédit" c={YEL} fg="#14101f" s={26} sc={pp(t, mid(96, 0.85))} />
      <g opacity={k(t, S(97), 0.4)}>
        <Draw d="M1370 670 Q1370 760 1020 760 Q920 760 920 560 Q920 440 1010 440" p={say(0.08)} c={YEL} w={5} dash="14 12" />
        <T x={1180} y={800} s={28} c={YEL} f="InterX" sc={pp(t, mid(97, 0.1))}>D reçoit son propre code ⟨D⟩</T>
        <T x={960} y={870} s={34} c={W} f="InterX" sc={pp(t, mid(97, 0.28))}>D s’arrête  <tspan fill={RED}>⇒</tspan>  H prédit « s’arrête »  <tspan fill={RED}>⇒</tspan>  D boucle</T>
        <T x={960} y={925} s={34} c={W} f="InterX" sc={pp(t, mid(97, 0.5))}>D boucle  <tspan fill={RED}>⇒</tspan>  H prédit « boucle »  <tspan fill={RED}>⇒</tspan>  D s’arrête</T>
        <Mark x={960} y={897} rx={640} ry={70} p={k(t, mid(97, 0.66), 0.5)} c={RED} w={7} seed={4} /><Chip x={430} y={680} text="CONTRADICTION" c={RED} s={36} sc={pp(t, mid(97, 0.7))} />
        {boom && <g transform={`translate(430 430) scale(${pp(t, mid(97, 0.82))})`}><path d="M-150 -110 L150 110 M150 -110 L-150 110" stroke={RED} strokeWidth={16} strokeLinecap="round" /></g>}
        <Chip x={960} y={1000} text="H n’existe pas : HALT est indécidable" c={RED} s={32} sc={pp(t, mid(97, 0.88)) * (1 - k(t, S(98) - 0.1, 0.3))} /></g>
      <Chip x={960} y={1000} text="≈ le paradoxe du menteur : D contredit ce que H affirme d’elle" c={YEL} fg="#14101f" s={30} sc={pp(t, S(98) + 0.2)} />
    </g>
  </>; };

/* ---------- 99–101 : réduire HALT à d'autres problèmes ; portée du résultat ---------- */
const Reduc2 = (t: number) => <>
  <g opacity={1 - 0.85 * k(t, S(101) - 0.1, 0.45)}>
    <T x={960} y={105} s={50} c={W} sc={pp(t, S(99) + 0.1)}>D’AUTRES PROBLÈMES INDÉCIDABLES</T>
    <Chip x={240} y={340} text="⟨M, w⟩" c={SOFT} s={38} sc={pp(t, S(99) + 0.3)} /><Arr a={[240, 340]} b={[520, 340]} r={90} p={k(t, mid(99, 0.12), 0.4)} />
    <Card x={520} y={190} w={820} h={300} c={YEL} p={pp(t, mid(99, 0.14))} title="LA MACHINE M′" tc={YEL}>
      {["ignore son entrée", "simule M sur w", "puis accepte"].map((l, j) => <g key={l} opacity={k(t, mid(99, 0.2 + j * 0.08), 0.3)}><C4Num x={90} y={120 + j * 55} n={j + 1} sc={1} /><C4Line x={130} y={120 + j * 55} s={30}>{l}</C4Line></g>)}</Card>
    <Arr a={[1340, 340]} b={[1500, 340]} r={0} p={k(t, mid(99, 0.45), 0.4)} /><Chip x={1650} y={340} text="accepte ε ?" c={YEL} fg="#14101f" s={32} sc={pp(t, mid(99, 0.48))} />
    <T x={960} y={570} s={40} c={W} f="InterX" sc={pp(t, mid(99, 0.62))}>M s’arrête sur w  <tspan fill={YEL}>⇔</tspan>  M′ accepte le mot vide</T>
    <Chip x={960} y={645} text="un décideur ici déciderait HALT : impossible" c={RED} s={30} sc={pp(t, mid(99, 0.8))} />
    <T x={960} y={745} s={30} c={DIM} f="InterX" sc={pp(t, S(100) + 0.1)}>indécidables, eux aussi :</T>
    {["deux machines, même langage ?", "le langage reconnu est-il vide ?", "termine sur toutes les entrées ?"].map((l, j) => <g key={l} opacity={k(t, mid(100, 0.15 + j * 0.22), 0.3)}>
      <Chip x={370 + j * 590} y={830} text={l} c={SOFT} s={28} /><Tick x={370 + j * 590} y={895} ok={false} sc={1} s={0.8} /></g>)}
  </g>
  <Card x={360} y={300} w={1200} h={440} c={YEL} p={pp(t, S(101) + 0.15)} title="PORTÉE DU RÉSULTAT" tc={YEL}>
    <Tick x={110} y={150} ok={false} sc={pp(t, S(101) + 0.4)} s={1.1} /><C4Line x={160} y={150} s={32} sc={pp(t, S(101) + 0.4)}>aucun vérificateur universel de terminaison</C4Line>
    <Tick x={110} y={250} ok sc={pp(t, mid(101, 0.45))} s={1.1} /><C4Line x={160} y={250} s={32} sc={pp(t, mid(101, 0.45))}>un programme précis : on peut prouver qu’il s’arrête</C4Line>
    <Chip x={600} y={355} text="l’indécidabilité concerne le cas général" c={YEL} fg="#14101f" s={30} sc={pp(t, mid(101, 0.72))} /></Card>
</>;

/* ---------- 102–103 : cardinalité ; théorème de Rice ---------- */
const DOTS = Array.from({ length: 140 }, (_, i) => [760 + ((i * 137) % 1000), 200 + ((i * 89) % 460), (i * 53) % 100] as [number, number, number]);
const LimA = (t: number) => <>
  <g opacity={1 - k(t, S(103) - 0.25, 0.45)}>
    <T x={960} y={105} s={50} c={W} sc={pp(t, S(102) + 0.1)}>LES LIMITES DE LA CALCULABILITÉ</T>
    <T x={330} y={190} s={30} c={YEL} sc={pp(t, S(102) + 0.3)}>MACHINES</T>
    {[1, 2, 3, 4, 5].map((i) => <g key={i} opacity={k(t, S(102) + 0.4 + i * 0.18, 0.3)}><Chip x={330} y={190 + i * 85} text={i < 5 ? `M${"₁₂₃₄"[i - 1]}` : "…"} c={SOFT} s={34} />
      {i < 5 && <Draw d={`M380 ${190 + i * 85} L${DOTS[i * 7][0]} ${DOTS[i * 7][1]}`} p={k(t, mid(102, 0.55 + i * 0.04), 0.4)} c={GRN} w={3} />}</g>)}
    <T x={330} y={720} s={24} c={DIM} f="InterX" sc={pp(t, mid(102, 0.15))}>dénombrables :</T><T x={330} y={755} s={24} c={DIM} f="InterX" sc={pp(t, mid(102, 0.15))}>chacune est un mot fini</T>
    {DOTS.map(([x, y, d], i) => <circle key={i} cx={x} cy={y} r={7} fill={[7, 14, 21, 28].includes(i) ? GRN : LINE} opacity={0.75 * k(t, mid(102, 0.25 + d * 0.003), 0.3)} />)}
    <T x={1260} y={720} s={28} c={W} f="InterX" sc={pp(t, mid(102, 0.4))}>LANGAGES : non dénombrables (Cantor)</T>
    <Chip x={1260} y={800} text="la plupart des langages : aucune machine" c={RED} s={30} sc={pp(t, mid(102, 0.8))} />
    <C4Line x={760} y={890} s={24} c={DIM} sc={pp(t, mid(102, 0.85))}>argument non constructif · exemple concret : le complémentaire de HALT</C4Line>
  </g>
  <g opacity={k(t, S(103), 0.4)}>
    <Card x={210} y={120} w={1500} h={300} c={RED} p={pp(t, S(103) + 0.15)} title="THÉORÈME DE RICE" tc={RED}>
      <T x={750} y={140} s={34} c={W} f="InterX">toute propriété non triviale du langage reconnu</T><T x={750} y={195} s={34} c={W} f="InterX">par une machine de Turing est indécidable</T></Card>
    <Card x={210} y={480} w={730} h={450} c={RED} p={pp(t, mid(103, 0.3))} title="SÉMANTIQUE : INDÉCIDABLE" tc={RED}>
      {["« L(M) est vide »", "« L(M) est fini »", "« M accepte le mot vide »"].map((l, j) => <g key={l}><Tick x={80} y={140 + j * 80} ok={false} sc={1} s={0.8} /><C4Line x={120} y={140 + j * 80} s={30}>{l}</C4Line></g>)}
      <T x={365} y={395} s={24} c={DIM} f="InterX">ce que fait la machine</T></Card>
    <Card x={980} y={480} w={730} h={450} c={GRN} p={pp(t, mid(103, 0.62))} title="SYNTAXIQUE : NON CONCERNÉE" tc={GRN}>
      <C4Line x={80} y={150} s={30}>« M a plus de 10 états »</C4Line><Tick x={80} y={240} ok sc={1} s={0.8} /><C4Line x={120} y={240} s={30}>décidable : il suffit de compter</C4Line>
      <T x={365} y={395} s={24} c={DIM} f="InterX">la forme de son code</T></Card>
  </g>
</>;

/* ---------- 104–105 : autres problèmes indécidables ; le lien avec Gödel ---------- */
const PCP: [string, string][] = [["a", "baa"], ["ab", "aa"], ["bba", "bb"]];
const LimB = (t: number) => <>
  <T x={960} y={105} s={50} c={W} sc={pp(t, S(104) + 0.1)}>AUTRES PROBLÈMES INDÉCIDABLES</T>
  <Card x={110} y={170} w={820} h={270} c={RED} p={pp(t, S(104) + 0.3)} title="CORRESPONDANCE DE POST" tc={RED}>
    {PCP.map(([a, b], j) => <g key={j} transform={`translate(${170 + j * 150} 150)`}><rect x={-55} y={-55} width={110} height={110} rx={10} fill={SOFT} stroke={LINE} strokeWidth={3} /><line x1={-55} x2={55} y1={0} y2={0} stroke={LINE} strokeWidth={2} />
      <T x={0} y={-26} s={26} c={W} f={KM}>{a}</T><T x={0} y={28} s={26} c={W} f={KM}>{b}</T></g>)}
    <C4Line x={570} y={130} s={24} c={DIM}>même mot</C4Line><C4Line x={570} y={165} s={24} c={DIM}>en haut et en bas ?</C4Line>
    <T x={410} y={240} s={22} c={DIM} f="InterX">utile pour d’autres réductions</T></Card>
  <Card x={990} y={170} w={820} h={270} c={RED} p={pp(t, mid(104, 0.25))} title="DIXIÈME PROBLÈME DE HILBERT" tc={RED}>
    <T x={410} y={130} s={40} c={W} f={KM}>P(x, y, z) = 0  ?</T>
    <T x={410} y={185} s={24} c={DIM} f="InterX">une solution en nombres entiers ?</T><Chip x={410} y={235} text="Matiyasevich, 1970" c={SOFT} s={24} /></Card>
  <Card x={110} y={470} w={820} h={270} c={RED} p={pp(t, mid(104, 0.5))} title="ÉQUIVALENCE DE GRAMMAIRES" tc={RED}>
    <T x={410} y={135} s={46} c={W} f={KM}>{sub4("G", "1")}  ≟  {sub4("G", "2")}</T>
    <T x={410} y={205} s={24} c={DIM} f="InterX">deux grammaires non contextuelles, même langage ?</T></Card>
  <Card x={990} y={470} w={820} h={270} c={RED} p={pp(t, mid(104, 0.72))} title="CASTOR AFFAIRÉ" tc={RED}>
    <T x={410} y={130} s={30} c={W} f={KM}>1, 6, 21, 107, 47 176 870, …</T>
    <T x={410} y={185} s={22} c={DIM} f="InterX">étapes max. d’une machine à n états qui s’arrête</T><Chip x={410} y={235} text="fonction non calculable" c={RED} s={24} /></Card>
  <Card x={310} y={780} w={1300} h={220} c={YEL} p={pp(t, S(105) + 0.15)} title="LIEN AVEC GÖDEL (1931)" tc={YEL}>
    <C4Line x={70} y={115} s={28}>incomplétude : des énoncés vrais mais indémontrables</C4Line>
    <C4Line x={70} y={165} s={28} c={YEL} sc={pp(t, mid(105, 0.45))}>même idée : l’auto-référence</C4Line>
    <g transform="translate(1140 140)" opacity={k(t, mid(105, 0.5))}><MTBox x={0} y={0} sc={0.6} c={YEL} /><Draw d="M-34 -40 C-64 -104 64 -104 34 -40" p={k(t, mid(105, 0.55), 0.5)} c={YEL} w={5} /><Head x={34} y={-40} p={k(t, mid(105, 0.55), 0.5)} c={YEL} a={113} s={0.55} /></g></Card>
</>;

/* ---------- 106–107 : limites pratiques (complexité) ; limites du modèle ---------- */
const LimC = (t: number) => { const curve = (g: (n: number) => number) => { let d = ""; for (let i = 0; i <= 40; i++) { const n = (i / 40) * 8, y = Math.max(-120, 300 - g(n)); d += `${i ? "L" : "M"}${100 + n * 70} ${y} `; } return d; };
  return <>
    <T x={960} y={105} s={50} c={W} sc={pp(t, S(106) + 0.1)}>LIMITES PRATIQUES ET LIMITES DU MODÈLE</T>
    <Card x={110} y={170} w={840} h={800} c={YEL} p={pp(t, S(106) + 0.25)} title="DÉCIDABLE ≠ FAISABLE" tc={YEL}>
      <g transform="translate(40 40)"><Axes ox={100} oy={300} w={600} h={200} p={k(t, S(106) + 0.4, 0.5)} />
        <Draw d={curve((n) => n * n * 1.2)} p={k(t, mid(106, 0.12), 0.6)} c={W} w={6} /><T x={705} y={225} s={30} c={W} f={KM} sc={pp(t, mid(106, 0.2))}>{sup4("n", "2")}</T>
        <Draw d={curve((n) => Math.pow(2, n))} p={k(t, mid(106, 0.22), 0.6)} c={RED} w={6} glow /><T x={705} y={55} s={30} c={RED} f={KM} sc={pp(t, mid(106, 0.3))}>{sup4("2", "n")}</T></g>
      <C4Line x={60} y={440} s={28} sc={pp(t, mid(106, 0.4))}><tspan fill={YEL}>P</tspan> : résoudre en temps polynomial</C4Line>
      <C4Line x={60} y={500} s={28} sc={pp(t, mid(106, 0.5))}><tspan fill={YEL}>NP</tspan> : vérifier une solution en temps polynomial</C4Line>
      <C4Line x={60} y={560} s={28} sc={pp(t, mid(106, 0.58))}>certains : temps exponentiel, voire plus</C4Line>
      <T x={420} y={670} s={64} c={YEL} sc={pp(t, mid(106, 0.75))} glow={YEL}>P = NP ?</T>
      <T x={420} y={740} s={24} c={DIM} f="InterX" sc={pp(t, mid(106, 0.8))}>question ouverte · voir chapitre 5</T></Card>
    <Card x={990} y={170} w={820} h={800} c={LINE} p={pp(t, S(107) + 0.15)} title="LIMITES DU MODÈLE" tc={W}>
      <g opacity={k(t, S(107) + 0.4, 0.4)}><Tape x={150} y={160} cells={["1", "0", "1", "_"]} cw={80} p={1} /><C4Line x={80} y={250} s={28}>théorique : ruban infini, temps non compté</C4Line></g>
      <g opacity={k(t, mid(107, 0.3), 0.4)}><CpuMem x={260} y={380} s={0.8} /><C4Line x={430} y={370} s={26}>ni énergie, ni matériel,</C4Line><C4Line x={430} y={410} s={26}>ni interaction directe</C4Line></g>
      <g opacity={k(t, mid(107, 0.55), 0.4)} transform="translate(150 600)"><circle r={60} fill="none" stroke={W} strokeWidth={4} /><ellipse rx={60} ry={20} fill="none" stroke={W} strokeWidth={2} strokeDasharray="6 6" transform={`rotate(${t * 30})`} />
        <ellipse rx={60} ry={20} fill="none" stroke={YEL} strokeWidth={2} transform={`rotate(${60 + t * 30})`} /><circle r={9} fill={YEL} />
        <C4Line x={100} y={-25} s={28}>ordinateur quantique :</C4Line><C4Line x={100} y={20} s={26} c={RED}>ne résout aucun problème indécidable</C4Line><C4Line x={100} y={60} s={26} c={GRN}>parfois plus rapide</C4Line></g></Card>
  </>; };

/* ---------- 108 : à retenir ---------- */
const REC4 = ["la machine de Turing définit la notion d’algorithme", "décidable : un algorithme répond toujours", "semi-décidable : un algorithme confirme les « oui »", "le problème de l’arrêt est indécidable",
  "réductions et théorème de Rice : bien d’autres le sont", "décidable ne veut pas dire faisable : la complexité"];
const Recap4 = (t: number) => <Card x={260} y={140} w={1400} h={800} c={YEL} p={pp(t, S(108) + 0.1)} title="À RETENIR" tc={YEL}>
  {REC4.map((l, j) => <g key={l} opacity={k(t, mid(108, 0.06 + j * 0.14), 0.3)}><Tick x={100} y={150 + j * 105} ok={j !== 3} sc={1} s={0.9} /><C4Line x={150} y={150 + j * 105} s={34}>{l}</C4Line></g>)}
</Card>;

type Scene = { a: number; r: (t: number) => React.ReactNode; cam: Key[] };
const st0 = (i: number) => (i === 0 ? 0 : S(i) - 0.35);
const SCENES: Scene[] = [
  { a: 0, r: Hook, cam: [[0, 960, 540, 1.15], [S(1), 960, 440, 1.0], [S(2) + 0.5, 760, 560, 1.1], [E(2), 760, 560, 1.12]] },
  { a: st0(3), r: Contexte, cam: [[S(3), 400, 560, 1.15], [E(3), 420, 580, 1.15], [S(4) + 0.3, 720, 580, 1.15], [E(4), 740, 600, 1.12], [S(5) + 0.3, 1090, 580, 1.15], [E(5), 1090, 600, 1.12], [S(6) + 0.3, 1520, 560, 1.15], [mid(6, 0.6), 1400, 600, 1.05], [E(6), 960, 560, 1.0]] },
  { a: st0(7), r: Plan, cam: [[S(7), 960, 230, 1.25], [E(7), 960, 260, 1.2], [S(8) + 0.4, 960, 520, 1.15], [E(8), 960, 540, 1.1], [S(9) + 0.4, 960, 780, 1.12], [E(9), 960, 560, 1.0]] },
  { a: st0(10), r: Bio, cam: [[S(10), 700, 560, 1.0], [S(10) + 1.9, 640, 540, 1.1], [E(10), 900, 540, 1.05], [S(11) + 0.3, 1150, 500, 1.1], [E(11), 1150, 520, 1.08], [S(12) + 0.3, 1200, 500, 1.06], [E(12), 1200, 520, 1.05], [S(13) + 0.3, 1250, 540, 1.08], [E(13), 1250, 560, 1.06], [S(14) + 0.3, 1250, 520, 1.08], [E(14), 1250, 540, 1.06], [S(15) + 0.3, 1200, 520, 1.05], [E(15), 1100, 600, 1.0]] },
  { a: st0(16), r: Hilbert, cam: [[S(16), 600, 520, 1.15], [mid(16, 0.4), 700, 400, 1.15], [E(16), 760, 420, 1.12], [S(17) + 0.4, 1250, 560, 1.12], [E(17), 1150, 600, 1.05]] },
  { a: st0(18), r: DefWhy, cam: [[S(18), 960, 220, 1.2], [mid(18, 0.5), 1350, 520, 1.15], [E(18), 1350, 560, 1.15], [S(19) + 0.3, 1300, 640, 1.08], [E(19), 1300, 640, 1.08], [S(20) + 0.4, 600, 600, 1.12], [E(20), 900, 580, 1.0], [S(21) + 0.3, 800, 760, 1.08], [E(21), 900, 700, 1.0]] },
  { a: st0(22), r: Legacy, cam: [[S(22), 960, 230, 1.15], [E(22), 1100, 300, 1.12], [S(23) + 0.3, 960, 700, 1.1], [E(23), 960, 760, 1.08]] },
  { a: st0(24), r: Heritage, cam: [[S(24), 960, 540, 1.0], [S(24) + 0.2, 850, 480, 1.05], [E(24), 850, 480, 1.05], [S(25) + 0.2, 960, 480, 1.05], [E(25), 960, 480, 1.05], [S(26) + 0.2, 1070, 480, 1.05], [E(26), 1070, 480, 1.05], [S(27) + 0.2, 850, 600, 1.05], [E(27), 850, 600, 1.05], [S(28) + 0.2, 960, 600, 1.05], [E(28), 960, 600, 1.05], [S(29) + 0.2, 1070, 600, 1.05], [E(29), 1070, 600, 1.05], [E(29) + 0.5, 960, 540, 1.0]] },
  { a: st0(30), r: Parts, cam: [[S(30), 960, 540, 1.0], [S(31) + 0.3, 960, 330, 1.25], [E(31), 960, 330, 1.25], [S(32) + 0.3, 760, 300, 1.3], [E(32), 800, 330, 1.3], [S(33) + 0.4, 420, 720, 1.3], [E(33), 440, 720, 1.3], [S(34) + 0.4, 960, 740, 1.35], [E(34), 960, 740, 1.35], [S(35) + 0.4, 1500, 740, 1.3], [E(35) - 0.5, 1450, 720, 1.25], [E(35), 960, 540, 1.0]] },
  { a: st0(36), r: Formal, cam: [[S(36), 960, 220, 1.3], [E(36), 1000, 240, 1.3], [S(37) + 0.3, 960, 480, 1.25], [E(37), 960, 490, 1.25], [S(38) + 0.3, 960, 700, 1.1], [E(38), 960, 700, 1.1], [S(39) + 0.3, 960, 760, 1.25], [E(39), 960, 620, 1.0]] },
  { a: st0(40), r: Run, cam: [[S(40), 960, 460, 1.25], [E(40), 960, 470, 1.25], [S(41) + 0.3, 960, 260, 1.2], [E(41), 960, 280, 1.2], [S(42) + 0.3, 480, 780, 1.3], [E(42), 480, 780, 1.3], [S(43) + 0.3, 1390, 780, 1.3], [E(43), 1390, 780, 1.3], [S(44) + 0.3, 960, 680, 1.08], [E(44), 960, 660, 1.05]] },
  { a: st0(45), r: Sim0011, cam: [[S(45), 900, 520, 1.05], [E(45), 900, 520, 1.05], [S(46) + 0.3, 860, 560, 1.06], [E(46), 860, 560, 1.06], [S(47) + 0.3, 860, 580, 1.06], [E(47), 960, 540, 1.0]] },
  { a: st0(48), r: Det, cam: [[S(48), 960, 540, 1.0], [S(48) + 1.9, 510, 520, 1.25], [E(48), 510, 560, 1.25], [S(49) + 0.3, 1410, 520, 1.2], [E(49), 1300, 540, 1.05]] },
  { a: st0(50), r: Variants, cam: [[S(50), 510, 320, 1.3], [E(50), 520, 320, 1.3], [S(51) + 0.3, 1410, 320, 1.3], [E(51), 1400, 320, 1.3], [S(52) + 0.3, 960, 790, 1.25], [E(52), 960, 600, 1.0]] },
  { a: st0(53), r: VarEx, cam: [[S(53), 860, 460, 1.06], [E(53), 860, 460, 1.06], [S(54) + 0.3, 1060, 460, 1.06], [E(54), 1060, 460, 1.06], [S(55) + 0.3, 860, 620, 1.06], [E(55), 860, 620, 1.06], [S(56) + 0.3, 1060, 620, 1.06], [E(56), 960, 540, 1.0]] },
  { a: st0(57), r: Compare, cam: [[S(57), 680, 490, 1.15], [E(57), 700, 490, 1.15], [S(58) + 0.3, 1450, 540, 1.2], [E(58), 1300, 540, 1.05]] },
  { a: st0(59), r: Questions4, cam: [[S(59), 960, 540, 1.0], [S(59) + 1.9, 960, 520, 1.04], [E(59), 960, 540, 1.03], [S(60) + 0.2, 960, 540, 1.0], [E(60), 960, 530, 1.03]] },
  { a: st0(61), r: Brief4, cam: [[S(61), 960, 540, 1.0], [E(61), 960, 540, 1.03], [S(62) + 0.2, 960, 500, 1.02], [E(62), 960, 520, 1.03], [S(63) + 0.2, 960, 580, 1.04], [E(63), 960, 580, 1.04], [S(64) + 0.2, 960, 380, 1.06], [E(64), 960, 400, 1.05], [S(65) + 0.2, 960, 620, 1.04], [E(65), 960, 560, 1.0]] },
  { a: st0(66), r: Succ, cam: [[S(66), 960, 400, 1.04], [E(67), 960, 410, 1.04], [S(68) + 0.2, 960, 540, 1.0], [E(68), 940, 480, 1.03], [S(69) + 0.2, 1160, 360, 1.05], [E(69), 1160, 380, 1.05], [S(70) + 0.2, 1060, 640, 1.04], [E(70), 1060, 640, 1.04], [S(71) + 0.2, 900, 780, 1.04], [E(71), 960, 560, 1.0]] },
  { a: st0(72), r: Decide, cam: [[S(72), 960, 380, 1.04], [E(72), 960, 400, 1.04], [S(73) + 0.2, 960, 600, 1.02], [E(75), 960, 620, 1.02], [S(76) + 0.2, 960, 380, 1.05], [E(76), 960, 380, 1.05], [S(77) + 0.2, 960, 760, 1.05], [E(77), 960, 600, 1.0]] },
  { a: st0(78), r: Prime, cam: [[S(78), 760, 380, 1.05], [E(78), 760, 380, 1.05], [S(79) + 0.2, 1240, 380, 1.05], [E(79), 1240, 380, 1.05], [S(80) + 0.2, 640, 760, 1.05], [E(80), 640, 760, 1.05], [S(81) + 0.2, 1280, 760, 1.05], [E(81), 960, 560, 1.0]] },
  { a: st0(82), r: Props4, cam: [[S(82), 960, 340, 1.05], [E(82), 960, 340, 1.05], [S(83) + 0.2, 760, 760, 1.05], [E(83), 760, 760, 1.05], [S(84) + 0.2, 1100, 800, 1.04], [E(84), 960, 600, 1.0]] },
  { a: st0(85), r: RecDec, cam: [[S(85), 960, 420, 1.05], [E(85), 960, 420, 1.05], [S(86) + 0.2, 600, 700, 1.04], [E(86), 600, 700, 1.04], [S(87) + 0.2, 1280, 700, 1.04], [E(87), 1280, 700, 1.04], [S(88) + 0.2, 960, 400, 1.04], [E(88), 960, 400, 1.04], [S(89) + 0.2, 960, 820, 1.05], [E(89), 960, 560, 1.0]] },
  { a: st0(90), r: Algo4, cam: [[S(90), 960, 340, 1.04], [E(90), 960, 340, 1.04], [S(91) + 0.2, 960, 780, 1.05], [E(91), 960, 780, 1.05], [S(92) + 0.2, 960, 320, 1.05], [E(92), 960, 320, 1.05], [S(93) + 0.2, 960, 780, 1.04], [E(93), 960, 560, 1.0]] },
  { a: st0(94), r: HaltP, cam: [[S(94), 960, 340, 1.05], [E(94), 960, 340, 1.05], [S(95) + 0.2, 960, 700, 1.05], [E(95), 960, 700, 1.05], [S(96) + 0.2, 1060, 460, 1.04], [E(96), 1060, 480, 1.04], [S(97) + 0.2, 960, 640, 1.03], [E(97), 960, 660, 1.03], [S(98) + 0.2, 960, 760, 1.03], [E(98), 960, 560, 1.0]] },
  { a: st0(99), r: Reduc2, cam: [[S(99), 960, 400, 1.04], [E(99), 960, 420, 1.04], [S(100) + 0.2, 960, 760, 1.04], [E(100), 960, 760, 1.04], [S(101) + 0.2, 960, 520, 1.05], [E(101), 960, 540, 1.0]] },
  { a: st0(102), r: LimA, cam: [[S(102), 960, 440, 1.04], [E(102), 1000, 460, 1.04], [S(103) + 0.2, 960, 320, 1.05], [mid(103, 0.4), 760, 680, 1.05], [mid(103, 0.7), 1160, 680, 1.05], [E(103), 960, 560, 1.0]] },
  { a: st0(104), r: LimB, cam: [[S(104), 760, 320, 1.05], [mid(104, 0.3), 1160, 320, 1.05], [mid(104, 0.55), 760, 600, 1.05], [mid(104, 0.78), 1160, 600, 1.05], [E(104), 960, 560, 1.02], [S(105) + 0.2, 960, 860, 1.05], [E(105), 960, 560, 1.0]] },
  { a: st0(106), r: LimC, cam: [[S(106), 640, 540, 1.05], [E(106), 640, 560, 1.05], [S(107) + 0.2, 1280, 540, 1.05], [E(107), 960, 540, 1.0]] },
  { a: st0(108), r: Recap4, cam: [[S(108), 960, 540, 1.0], [mid(108, 0.4), 960, 500, 1.04], [E(108), 960, 560, 1.02]] },
  { a: st0(109), r: Measure, cam: [[S(109), 960, 300, 1.0], [S(109) + 1.9, 960, 140, 1.25], [E(109), 960, 160, 1.2], [S(110) + 0.3, 760, 420, 1.3], [E(110), 760, 430, 1.3], [S(111) + 0.3, 760, 520, 1.2], [E(111), 800, 520, 1.2], [S(112) + 0.3, 1100, 520, 1.2], [E(112), 1100, 520, 1.2], [S(113) + 0.3, 960, 900, 1.2], [E(113), 960, 640, 1.0]] },
  { a: st0(114), r: Notation, cam: [[S(114), 760, 520, 1.05], [E(114), 760, 520, 1.05], [S(115) + 0.3, 1160, 480, 1.06], [E(115), 1060, 520, 1.03]] },
  { a: st0(116), r: Classes, cam: [[S(116), 640, 700, 1.4], [E(116), 660, 700, 1.4], [S(117) + 0.3, 800, 650, 1.2], [E(117), 820, 650, 1.2], [S(118) + 0.3, 960, 600, 1.05], [E(118), 960, 540, 1.0]] },
  { a: st0(119), r: PvsNP, cam: [[S(119), 500, 520, 1.2], [mid(119, 0.75), 500, 600, 1.2], [S(120) + 0.2, 1420, 520, 1.2], [E(120), 1300, 560, 1.05]] },
  { a: st0(121), r: Reduce, cam: [[S(121), 900, 260, 1.15], [mid(121, 0.45), 960, 280, 1.1], [mid(121, 0.55), 620, 720, 1.2], [E(121), 640, 720, 1.2], [S(122) + 0.3, 1500, 720, 1.25], [E(122), 1200, 560, 1.0], [S(123) + 0.3, 960, 530, 1.05], [E(123), 960, 540, 1.0]] },
  { a: st0(124), r: Even, cam: [[S(124), 960, 540, 1.0], [S(124) + 1.9, 520, 330, 1.3], [E(124), 520, 340, 1.3], [S(125) + 0.3, 1370, 360, 1.3], [E(125), 1370, 380, 1.3], [S(126) + 0.3, 1000, 680, 1.1], [E(126), 1000, 680, 1.1]] },
  { a: st0(127), r: PalAdd, cam: [[S(127), 960, 330, 1.08], [E(127), 960, 340, 1.06], [S(128) + 0.2, 860, 380, 1.08], [E(128), 860, 400, 1.08], [S(129) + 0.3, 860, 720, 1.08], [E(129), 860, 720, 1.08], [S(130) + 0.3, 860, 760, 1.08], [E(130), 960, 600, 1.03]] },
  { a: st0(131), r: Sim, cam: [[S(131), 580, 500, 1.15], [E(131), 600, 500, 1.15], [S(132) + 0.3, 1470, 440, 1.25], [E(133), 1450, 480, 1.2], [S(134) + 0.3, 1470, 560, 1.2], [E(134), 1300, 540, 1.05]] },
  { a: st0(135), r: AdvLim, cam: [[S(135), 960, 540, 1.0], [S(135) + 1.9, 760, 520, 1.05], [E(138), 760, 520, 1.05], [S(139) + 0.3, 1160, 520, 1.05], [E(140), 960, 540, 1.0]] },
  { a: st0(141), r: VsPC, cam: [[S(141), 500, 480, 1.2], [mid(141, 0.4), 520, 480, 1.2], [mid(141, 0.5), 1420, 520, 1.2], [E(141), 1300, 560, 1.05], [S(142) + 0.3, 960, 530, 1.05], [E(142), 960, 540, 1.0]] },
  { a: st0(143), r: Influence, cam: [[S(143), 960, 520, 1.0], [E(143), 960, 520, 1.03], [S(144) + 0.3, 960, 560, 1.1], [E(144), 960, 560, 1.05]] },
  { a: st0(145), r: Persp, cam: [[S(145), 960, 540, 1.0], [mid(145, 0.12), 860, 470, 1.04], [mid(145, 0.3), 1060, 470, 1.04], [mid(145, 0.5), 860, 620, 1.04], [mid(145, 0.72), 1060, 620, 1.04], [E(145), 960, 540, 1.0]] },
  { a: st0(146), r: Concl, cam: [[S(146), 960, 540, 1.0], [S(146) + 1.9, 960, 300, 1.2], [E(146), 960, 320, 1.2], [S(147) + 0.3, 960, 600, 1.2], [E(147), 960, 600, 1.2], [S(148) + 0.3, 960, 800, 1.2], [E(148), 960, 820, 1.2], [S(149) + 0.3, 960, 900, 1.15], [mid(149, 0.55), 960, 540, 1.0], [TM.total, 960, 540, 1.04]] },
];
const CHAPS: [number, string, string][] = [[0, "INTRODUCTION", ""], [10, "CHAPITRE 1", "Généralités et historique"], [30, "CHAPITRE 2", "Structure et fonctionnement"], [48, "CHAPITRE 3", "Les différents types de machines"],
  [59, "CHAPITRE 4", "Machine de Turing et calculabilité"], [109, "CHAPITRE 5", "Machine de Turing et complexité"], [124, "CHAPITRE 6", "Applications et exemples pratiques"], [135, "CHAPITRE 7", "Avantages, limites et perspectives"], [146, "CONCLUSION", "Conclusion générale"]];

/* ---------- stage: black ground, one discreet blue glow, gentle camera, light glitch at scene changes ---------- */
const VW = 1920, VH = 1080, CY = 540;
const Stage: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  let i = 0; for (let j = 0; j < SCENES.length; j++) if (t >= SCENES[j].a) i = j;
  const sc = SCENES[i], u = t - sc.a, [cx0, cy0, zr] = cam(sc.cam, t), z = (1 + (zr - 1) * 0.42) * 0.9, cx = 960 + (cx0 - 960) * 0.5, cy = 540 + (cy0 - 540) * 0.5;
  const dir = i % 2 ? 1 : -1, gl = i === 0 ? 0 : sat(1 - u / 0.16), dx = 12 * gl * dir, g = Math.floor(t * 15);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#050506" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs><filter id="tmrgb" x="-4%" width="108%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={dx} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-dx} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" /></filter></defs></svg>
      <div style={{ position: "absolute", inset: 0, filter: gl > 0 ? "url(#tmrgb)" : undefined }}>
        <div style={{ position: "absolute", width: 1400, height: 1400, left: -520 + Math.sin(t * 0.3) * 80 - (cx - 960) * 0.12, top: -800, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.045), transparent 62%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 1300, height: 1300, right: -560 + Math.cos(t * 0.25) * 80 + (cx - 960) * 0.12, bottom: -820, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.03), transparent 62%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", inset: -300, opacity: 0.3, backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1.6px, transparent 1.6px)", backgroundSize: `${64 * z}px ${64 * z}px`, backgroundPosition: `${-cx * z * 0.6}px ${-cy * z * 0.6}px` }} />
        <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g transform={`translate(${VW / 2 - cx * z} ${CY - cy * z}) scale(${z})`}>{sc.r(t)}</g></svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: i === 0 ? 0 : sat(1 - u * 13) * 0.22 }} />
      {gl > 0.3 ? [0, 1].map((b) => <div key={b} style={{ position: "absolute", left: 0, right: 0, top: (g * 131 + b * 311) % 1000, height: 20 + ((g * 17 + b * 29) % 50), background: "rgba(255,255,255,0.1)", transform: `translateX(${((g * 53 + b * 97) % 60) - 30}px)` }} />) : null}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("series/grain.png")})`, backgroundPosition: `${(g * 173) % 512}px ${(g * 311) % 512}px`, opacity: 0.1, mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 220px rgba(0,0,0,0.6)" }} />
    </AbsoluteFill>
  );
};
/** chapter title card at the start of each chapter */
const ChapCard: React.FC = () => {
  const t = useCurrentFrame() / FPS, c = CHAPS.slice(1).find(([i]) => t >= S(i) - 0.35 && t < S(i) + 2.1); if (!c) return null;
  const u = t - (S(c[0]) - 0.35), o = sat(u / 0.25) * sat((2.45 - u) / 0.35);
  return (
    <AbsoluteFill style={{ background: `rgba(5,5,6,${0.9 * o})`, alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: o }}>
      <div style={{ fontFamily: "InterX", fontWeight: 800, fontSize: 34, letterSpacing: 10, color: YEL, transform: `translateY(${(1 - eo(u / 0.4)) * 20}px)` }}>{c[1]}</div>
      <div style={{ fontFamily: "Anton", fontSize: 110, color: "#fff", marginTop: 14, transform: `scale(${0.94 + 0.06 * eo(u / 0.5)})` }}>{c[2].toUpperCase()}</div>
      <div style={{ height: 6, width: 520 * eo((u - 0.2) / 0.6), background: YEL, borderRadius: 3, marginTop: 22 }} />
    </AbsoluteFill>
  );
};
export const RapportEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame(), t = f / FPS;
  const [h] = useState(() => delayRender("katex + display fonts"));
  useEffect(() => {
    Promise.all(["400 40px KaTeX_Main", "italic 40px KaTeX_Math", "40px Anton"].map((x) => document.fonts.load(x, "QΣΓδ⊔⊆⇔→∞")))
      .catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  const chap = [...CHAPS].reverse().find((c) => t >= S(c[0]) - 0.35) ?? CHAPS[0];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Stage />
      <div style={{ position: "absolute", left: 44, top: 34, fontFamily: "InterX", fontWeight: 800, fontSize: 24, letterSpacing: 4, color: "rgba(255,255,255,0.72)", background: "rgba(0,0,0,0.45)", padding: "9px 18px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.16)" }}>{chap[1]}</div>
      <ChapCard />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: VW * sat(t / TM.total), background: YEL, opacity: 0.85 }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [RAPPORT_FRAMES - 20, RAPPORT_FRAMES - 1], [0, 1], clamp) }} />
      {AUDIO ? <Audio src={staticFile("rapport/mix.m4a")} /> : null}
    </AbsoluteFill>
  );
};
const AUDIO = true;
