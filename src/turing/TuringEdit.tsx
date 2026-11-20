// "La machine de Turing" — silent guided explainer (no voice, no subtitles), 1920x1080: one image per idea, gentle camera, restrained palette.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { Mark, Squig } from "../cx/clips";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
import TM from "./timing.json";
export const TURING_FRAMES = fr(TM.total);
// restrained palette: white drawings, yellow accent, red = reject/problem, green = accept/solution, one discreet blue
const CYAN = "#e8ecff", PUR = "#8f9bd6", RED = "#ff5252", BLUE = "#5b7fe0", YEL = "#ffd23f", GRN = "#3ecf82";
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
/* ================= La machine de Turing — primitives (1920 x 1080 stage) ================= */
const S = (i: number) => TM.S[i], E = (i: number) => TM.E[i];
const mid = (i: number, f = 0.5) => S(i) + (E(i) - S(i)) * f;
const W = "#ffffff", KM = "KaTeX_Main", KI = "KaTeX_Math", PANEL = "#0d0e15", LINE = "#c9cde6", SOFT = "#1b1d2a";
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
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sc})`}><rect x={-130} y={-170} width={260} height={340} rx={10} fill="#f4f1e8" style={{ filter: "drop-shadow(0 20px 40px #000)" }} />
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
    {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-34 + c * 24} y={-54 + r * 26} width={18} height={18} rx={5} fill={c === 1 && r === 1 ? YEL : "#2a2d40"} />))}</g>);
const CpuMem: React.FC<{ x: number; y: number; s?: number; sc?: number }> = ({ x, y, s = 1, sc = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s * sc})`}><rect x={-140} y={-60} width={110} height={120} rx={12} fill={PANEL} stroke={LINE} strokeWidth={5} /><T x={-85} y={0} s={34} c={W}>UC</T>
    <path d="M-30 -20 H30 M-30 20 H30" stroke={YEL} strokeWidth={5} /><rect x={30} y={-60} width={120} height={120} rx={12} fill={PANEL} stroke={LINE} strokeWidth={5} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={46} y={-46 + i * 26} width={88} height={16} rx={4} fill={i === 1 ? YEL : "#2a2d40"} />)}</g>);
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
    <Person x={260} y={800} s={1.35} ink={W} col="#3a4256" label="" t={t} hair="#3b2414" skin="#f0c8a8" sc={turing > 0 ? pp(t, S(2) + 0.3) : 0} wave={t > S(2) + 0.6 && t < S(2) + 2.4 ? 0.6 + Math.sin(t * 8) * 0.3 : 0} />
    <Chip x={260} y={460} text="ALAN TURING · 1936" c={YEL} fg="#14101f" sc={pp(t, S(2) + 0.9)} s={34} />
    <T x={430} y={600} s={110} c={YEL} f={KM} sc={pp(t, mid(2, 0.75))} glow={YEL}>?</T>
    <T x={960} y={850} s={32} c={DIM} f="InterX" sc={pp(t, mid(2, 0.3))}>avant même l’existence des ordinateurs</T>
  </>; };
const OBJ = ["structure", "types", "calculabilité", "complexité", "exemples"], ROAD = ["Histoire", "Structure", "Types", "Calculabilité", "Complexité", "Applications", "Limites"];
const Plan = (t: number) => { const rx = (i: number) => 230 + i * 243, dot = kf(t, [[S(5) + 0.4, 0], [E(5) - 0.6, 6]]);
  return <>
    <Card x={210} y={90} w={1500} h={250} c={YEL} p={pp(t, S(3) + 0.1)} title="PROBLÉMATIQUE" tc={YEL}>
      <T x={750} y={120} s={44} c={W} f="InterX">Comment un modèle aussi simple peut-il décider</T>
      <T x={750} y={180} s={44} c={W} f="InterX">de ce qu’un ordinateur peut calculer… et en combien de temps ?</T>
      <Squig x={590} y={214} w={250} p={k(t, mid(3, 0.55), 0.4)} c={YEL} /><Squig x={1210} y={214} w={430} p={k(t, mid(3, 0.8), 0.4)} c={YEL} /></Card>
    <T x={960} y={440} s={40} c={DIM} sc={pp(t, S(4) + 0.1)}>OBJECTIFS</T>
    {OBJ.map((o, i) => <g key={o}><Chip x={330 + i * 315} y={520} text={o} c={SOFT} sc={pp(t, mid(4, 0.12 + i * 0.13))} s={36} /><T x={330 + i * 315} y={585} s={24} c={DIM} f="InterX" sc={pp(t, mid(4, 0.12 + i * 0.13))}>{i + 1}</T></g>)}
    <T x={960} y={680} s={40} c={DIM} sc={pp(t, S(5) + 0.1)}>ORGANISATION : 7 CHAPITRES</T>
    <Draw d={`M${rx(0)} 790 H${rx(6)}`} p={k(t, S(5) + 0.3, 1.2)} c={LINE} w={6} /><Draw d={`M${rx(0)} 790 H${rx(0) + dot * 243}`} p={t > S(5) + 0.4 ? 1 : 0} c={YEL} w={6} />
    {ROAD.map((r, i) => <g key={r}><St x={rx(i)} y={790} l={`${i + 1}`} r={34} sc={pp(t, S(5) + 0.4 + i * 0.22)} c={dot >= i - 0.05 ? YEL : W} hot={Math.abs(dot - i) < 0.3} lf="Anton" />
      <T x={rx(i)} y={866} s={28} c={W} f="InterX" sc={pp(t, S(5) + 0.5 + i * 0.22)}>{r}</T></g>)}
  </>; };

/* ---------- CHAPITRE 1 ---------- */
const Bio = (t: number) => { const c0 = S(6) + 1.9, tl = (y: number) => 220 + ((y - 1912) / 42) * 1460;
  return <>
    <Person x={520} y={760} s={1.75} ink={W} col="#3a4256" label="" t={t} hair="#3b2414" skin="#f0c8a8" sc={pp(t, c0)} wave={t > c0 + 0.4 && t < c0 + 2 ? 0.7 : 0} pants="#262a38" />
    <T x={520} y={250} s={74} c={W} sc={pp(t, c0 + 0.3)}>ALAN TURING</T><T x={520} y={318} s={36} c={DIM} f={KM} sc={pp(t, c0 + 0.6)}>Londres, 1912</T>
    {["mathématicien", "logicien", "un des pères de l’informatique"].map((x, i) => <Chip key={x} x={i === 2 ? 960 : 880} y={420 + i * 84} text={x} c={i === 2 ? YEL : SOFT} fg={i === 2 ? "#14101f" : W} sc={pp(t, mid(6, 0.55 + i * 0.13))} s={34} />)}
    <Draw d={`M${tl(1912)} 960 H${tl(1954)}`} p={k(t, c0 + 0.4, 1.0)} c={LINE} w={5} />
    {([[1912, "naissance"], [1936, "la machine"], [1954, "décès · 41 ans"]] as [number, string][]).map(([y, l], i) => { const at = i < 2 ? c0 + 0.6 + i * 0.3 : mid(7, 0.7);
      return <g key={y}><circle cx={tl(y)} cy={960} r={12 * pp(t, at)} fill={i === 2 && t > at ? RED : W} /><T x={tl(y)} y={915} s={32} c={W} f={KM} sc={pp(t, at)}>{y}</T><T x={tl(y)} y={1005} s={26} c={DIM} f="InterX" sc={pp(t, at)}>{l}</T></g>; })}
    {t > S(7) && <rect x={tl(1939)} y={948} width={(tl(1945) - tl(1939)) * k(t, S(7) + 0.2, 0.6)} height={24} rx={8} fill={YEL} opacity={0.85} />}
    <T x={(tl(1939) + tl(1945)) / 2} y={1005} s={26} c={YEL} f="InterX" sc={pp(t, S(7) + 0.5)}>1939 – 1945</T>
    <g transform={`translate(1520 560) scale(${pp(t, S(7) + 0.2)})`}>{t > S(7) && <>
      <rect x={-230} y={-200} width={460} height={380} rx={22} fill="#2a2016" stroke="#8a6a44" strokeWidth={6} />
      {[-110, 0, 110].map((x, i) => <g key={x}><Gear x={x} y={-120} r={34} a={t * (60 + i * 25) * (i % 2 ? -1 : 1)} c="#8a8f9e" /><rect x={x - 22} y={-82} width={44} height={36} rx={6} fill="#f4f1e8" />
        <T x={x} y={-63} s={26} c="#14101f" f={KM}>{String.fromCharCode(65 + Math.floor(t * (3 + i)) % 26)}</T></g>)}
      {Array.from({ length: 24 }).map((_, i) => <circle key={i} cx={-180 + (i % 8) * 51} cy={-6 + Math.floor(i / 8) * 46} r={15} fill={i === Math.floor(t * 4) % 24 ? YEL : "#3d3428"} stroke="#8a6a44" strokeWidth={2} />)}
      {Array.from({ length: 16 }).map((_, i) => <circle key={`k${i}`} cx={-170 + (i % 8) * 49} cy={130 + Math.floor(i / 8) * 34} r={12} fill="#14101f" stroke="#c9cbd6" strokeWidth={2} />)}</>}</g>
    <T x={1520} y={300} s={56} c={W} sc={pp(t, S(7) + 0.4)}>ENIGMA</T><T x={1520} y={800} s={30} c={DIM} f="InterX" sc={pp(t, S(7) + 0.7)}>Bletchley Park</T>
    <Chip x={1520} y={860} text="code cassé" c={GRN} fg="#0b1a10" sc={pp(t, mid(7, 0.38))} s={34} />
  </>; };
const Hilbert = (t: number) => <>
  <Person x={360} y={790} s={1.55} ink={W} col="#4a3b2a" label="" t={t} hair="#d6d6d6" skin="#f2c29b" glasses sc={pp(t, S(8) + 0.1)} pants="#2c2620" />
  <T x={360} y={400} s={50} c={W} sc={pp(t, S(8) + 0.3)}>DAVID HILBERT</T><T x={360} y={455} s={32} c={DIM} f={KM} sc={pp(t, S(8) + 0.5)}>1928</T>
  <g transform={`translate(930 270) scale(${pp(t, mid(8, 0.3))})`}><rect x={-420} y={-120} width={840} height={240} rx={40} fill={W} /><path d="M-300 110 L-380 200 L-230 118 Z" fill={W} />
    <T x={0} y={-40} s={40} c="#14101f" f="InterX">Existe-t-il une méthode mécanique</T><T x={0} y={14} s={40} c="#14101f" f="InterX">pour décider si un énoncé logique</T><T x={0} y={68} s={40} c="#14101f" f="InterX">est démontrable ?</T></g>
  <T x={930} y={440} s={32} c={DIM} f={KI} it sc={pp(t, mid(8, 0.6))}>« Entscheidungsproblem »</T>
  <Person x={1580} y={790} s={1.55} ink={W} col="#3a4256" label="" t={t} hair="#3b2414" skin="#f0c8a8" sc={pp(t, S(9) + 0.1)} look={-1} pants="#262a38" />
  <T x={1580} y={400} s={50} c={W} sc={pp(t, S(9) + 0.3)}>ALAN TURING</T>
  <Doc x={1130} y={700} rot={-6} sc={pp(t, S(9) + 0.5)} title="On Computable Numbers" by="A. M. Turing · 1936" />
  <Chip x={1130} y={500} text="méthode mécanique = ?" c={SOFT} sc={pp(t, mid(9, 0.35))} s={32} />
  <Bulb x={1380} y={470} sc={pp(t, mid(9, 0.72))} on={k(t, mid(9, 0.75), 0.3)} />
  <Chip x={1130} y={960} text="NAISSANCE DE LA MACHINE DE TURING" c={YEL} fg="#14101f" sc={pp(t, mid(9, 0.8))} s={36} />
  <Draw d="M1280 300 Q1500 260 1560 340" p={k(t, S(9) + 0.2, 0.5)} c={YEL} w={5} dash="14 12" />
</>;
const DefWhy = (t: number) => { const map: [string, string][] = [["regarder un symbole", "lire"], ["écrire, effacer", "écrire"], ["se déplacer sur la feuille", "bouger la tête"], ["« état d’esprit »", "état"]];
  return <>
    <Card x={260} y={70} w={1400} h={190} c={YEL} p={pp(t, S(10) + 0.1)} title="DÉFINITION" tc={YEL}>
      <T x={700} y={104} s={46} c={W} f="InterX">un modèle mathématique de calcul</T>
      {["lit et écrit des symboles", "bande infinie", "table de règles finie"].map((x, i) => <Chip key={x} x={300 + i * 400} y={156} text={x} c={SOFT} sc={pp(t, mid(10, 0.4 + i * 0.16))} s={28} />)}</Card>
    <Tape x={1330} y={430} cells={["_", "1", "0", "1", "_"]} cw={90} p={k(t, mid(10, 0.5), 0.8)} hl={{ 2: YEL }} />
    <HeadBox x={cxOf(1330, 2, 90)} y={430} cw={90} st={sub("q", "1")} sc={pp(t, mid(10, 0.62))} />
    <Card x={1340} y={560} w={420} h={250} c={LINE} p={pp(t, mid(10, 0.85))} title="RÈGLES" tc={DIM}>{[["0", "1", "1"], ["1", "0", "1"], ["⊔", "⊔", "acc"]].map(([a, b, q], i) => <T key={i} x={210} y={110 + i * 46} s={30} c={W} f={KM}>{sub("q", "1")}, {a} → {sub("q", q)}, {b}, D</T>)}</Card>
    <Person x={190} y={820} s={1.35} ink={W} col="#5a6b8c" label="" t={t} hair="#2b1a10" skin="#c98a5e" sc={pp(t, S(11) + 0.1)} wave={0.25 + Math.sin(t * 6) * 0.06} />
    <g transform={`translate(420 560) rotate(-5) scale(${pp(t, S(11) + 0.3)})`}><rect x={-120} y={-150} width={240} height={300} rx={8} fill="#f4f1e8" />
      {Array.from({ length: 5 }).map((_, r) => Array.from({ length: 4 }).map((_, c) => <rect key={`${r}${c}`} x={-96 + c * 50} y={-126 + r * 52} width={44} height={44} fill="none" stroke="#b9bccb" strokeWidth={2} />))}
      {["1", "0", "1", "1"].map((x, i) => <text key={i} x={-74 + i * 50} y={-90} fontFamily={KM} fontSize={30} fill="#14101f" textAnchor="middle">{x}</text>)}
      <path d={`M${-80 + 50 * (Math.floor(t * 1.4) % 4)} -60 l40 -50`} stroke={YEL} strokeWidth={6} strokeLinecap="round" /></g>
    <T x={330} y={330} s={34} c={DIM} f="InterX" sc={pp(t, S(11) + 0.3)}>un humain qui calcule</T>
    {map.map(([a, b], i) => { const at = mid(11, 0.3 + i * 0.16), y = 470 + i * 96;
      return <g key={a} opacity={k(t, at, 0.3)}><T x={940} y={y} s={30} c={W} f="InterX" anchor="end">{a}</T><Draw d={`M960 ${y} H1050`} p={k(t, at + 0.1, 0.3)} c={YEL} w={4} /><Head x={1056} y={y} p={k(t, at + 0.1, 0.3)} c={YEL} s={0.5} />
        <T x={1080} y={y} s={30} c={YEL} f="InterX" anchor="start">{b}</T></g>; })}
  </>; };
const Legacy = (t: number) => { const ev: [number, string, string][] = [[300, "1936", "machine universelle"], [760, "1945", "architecture de von Neumann"], [1220, "1950 →", "ordinateurs"], [1640, "aujourd’hui", "partout"]];
  return <>
    <Card x={150} y={90} w={760} h={220} c={GRN} p={pp(t, S(12) + 0.3)}><Tick x={80} y={110} ok sc={pp(t, S(12) + 0.6)} s={1.5} /><T x={420} y={86} s={38} c={W} f="InterX">une définition rigoureuse</T><T x={420} y={140} s={38} c={W} f="InterX">de l’algorithme</T></Card>
    <Card x={1010} y={90} w={760} h={220} c={RED} p={pp(t, mid(12, 0.45))}><Tick x={80} y={110} ok={false} sc={pp(t, mid(12, 0.5))} s={1.5} /><T x={420} y={86} s={38} c={W} f="InterX">des problèmes sans aucune</T><T x={420} y={140} s={38} c={W} f="InterX">solution mécanique</T></Card>
    <g transform={`translate(1390 380) rotate(-6) scale(${pp(t, mid(12, 0.82))})`}><rect x={-300} y={-46} width={600} height={92} rx={12} fill="none" stroke={RED} strokeWidth={6} /><T x={0} y={2} s={48} c={RED}>RÉPONSE À HILBERT : NON</T></g>
    <Draw d="M300 700 H1640" p={k(t, S(13) + 0.2, 1.4)} c={LINE} w={5} />
    {ev.map(([x, y, l], i) => { const at = mid(13, 0.06 + i * 0.13);
      return <g key={y}><circle cx={x} cy={700} r={14 * pp(t, at)} fill={YEL} /><T x={x} y={760} s={36} c={W} f={KM} sc={pp(t, at)}>{y}</T><T x={x} y={806} s={28} c={DIM} f="InterX" sc={pp(t, at + 0.1)}>{l}</T>
        {i === 0 && <g transform={`translate(${x} 590) scale(${pp(t, at)})`}><Tape x={-150} y={0} cells={["1", "0", "1"]} cw={70} ends={false} p={1} /><HeadBox x={-115 + 70} y={0} cw={70} sc={1} /></g>}
        {i === 1 && <CpuMem x={x} y={590} s={0.7} sc={pp(t, at)} />}{i === 2 && <Desktop x={x - 20} y={610} s={0.8} sc={pp(t, at)} />}
        {i === 3 && <><Laptop x={x - 60} y={630} s={0.55} sc={pp(t, at)} /><Phone x={x + 110} y={600} s={0.6} sc={pp(t, at + 0.1)} /></>}</g>; })}
    <Chip x={960} y={920} text="TURING-COMPLET" c={YEL} fg="#14101f" sc={pp(t, mid(13, 0.7))} s={44} />
    {["Python", "C", "Java", "JavaScript"].map((x, i) => <Chip key={x} x={560 + i * 270} y={1010} text={x} c={SOFT} sc={pp(t, mid(13, 0.78 + i * 0.04))} s={28} />)}
  </>; };

/* ---------- CHAPITRE 2 ---------- */
const CX = 420, CWC = 120, CCELLS = ["_", "_", "1", "0", "1", "1", "0", "_", "_"];
const Parts = (t: number) => { const c0 = S(14) + 1.9, wr = t >= mid(16, 0.5), mv = k(t, mid(16, 0.72), 0.5), hp = 2 + mv, st = t >= mid(17, 0.55) ? "1" : "0";
  const cells = CCELLS.map((c, i) => (i === 2 && wr ? "0" : c)), read = t >= mid(16, 0.25) && t < mid(16, 0.72), dots = [S(15), S(16), S(17), S(18), S(19)].filter((x) => t >= x).length;
  return <>
    <T x={960} y={70} s={44} c={W} sc={pp(t, c0)}>5 COMPOSANTS</T>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={880 + i * 40} cy={120} r={10 * pp(t, c0 + 0.2)} fill={i < dots ? YEL : SOFT} />)}
    <Tape x={CX} y={330} cells={cells} cw={CWC} p={k(t, S(15) + 0.1, 1.0)} hl={read ? { 2: YEL } : t > S(15) + 1.5 && t < S(16) ? { 7: BLUE } : {}} />
    <T x={330} y={460} s={34} c={YEL} f="InterX" sc={pp(t, S(15) + 0.4)} anchor="start">① la bande · infinie dans les deux sens</T>
    <T x={cxOf(CX, 7, CWC)} y={200} s={30} c={BLUE} f="InterX" sc={t < S(16) ? pp(t, S(15) + 1.5) : 0}>un blanc</T>
    <HeadBox x={cxOf(CX, hp, CWC) - (CWC / 2) * 0} y={330} cw={CWC} st={t >= S(17) ? sub("q", st) : undefined} sc={pp(t, S(16) + 0.2)} />
    <T x={cxOf(CX, hp, CWC) + 250} y={175} s={32} c={YEL} f="InterX" sc={pp(t, S(16) + 0.4)}>② tête de lecture / écriture</T>
    {[["lire", 0.25], ["écrire", 0.5], ["se déplacer", 0.72]].map(([l, f], i) => <Chip key={l as string} x={980 + i * 220} y={560} text={l as string} c={t >= mid(16, f as number) ? YEL : SOFT} fg={t >= mid(16, f as number) ? "#14101f" : W} sc={t < S(17) ? pp(t, mid(16, f as number)) : 0} s={30} />)}
    <Card x={130} y={600} w={580} h={330} p={pp(t, S(17) + 0.2)} title="③ ÉTATS · ensemble fini" tc={YEL}>
      {["0", "1", "2"].map((q, i) => <St key={q} x={110 + i * 180} y={150} l={sub("q", q)} r={46} sc={pp(t, S(17) + 0.5 + i * 0.15)} hot={q === st} c={q === st ? YEL : W} />)}
      <St x={200} y={262} l="acc" r={42} ls={24} c={GRN} acc sc={pp(t, S(17) + 1.0)} /><St x={380} y={262} l="rej" r={42} ls={24} c={RED} sc={pp(t, S(17) + 1.1)} /></Card>
    <Card x={760} y={600} w={400} h={330} p={pp(t, S(18) + 0.2)} title="④ ALPHABETS" tc={YEL}>
      <T x={200} y={130} s={44} c={W} f={KM} sc={pp(t, mid(18, 0.3))}>Σ = {"{"} 0, 1 {"}"}</T><T x={200} y={170} s={22} c={DIM} f="InterX" sc={pp(t, mid(18, 0.3))}>entrée</T>
      <T x={200} y={240} s={44} c={W} f={KM} sc={pp(t, mid(18, 0.65))}>Γ = {"{"} 0, 1, ⊔ {"}"}</T><T x={200} y={284} s={22} c={DIM} f="InterX" sc={pp(t, mid(18, 0.65))}>bande (avec le blanc ⊔)</T></Card>
    <Card x={1210} y={600} w={580} h={330} p={pp(t, S(19) + 0.2)} title="⑤ TRANSITION  δ" tc={YEL}>
      {([["0", "1", "1", "0", "D"], ["0", "0", "0", "0", "D"], ["1", "⊔", "acc", "⊔", "G"]] as string[][]).map(([q, a, q2, b, d], i) => { const on = i === 0 && t > mid(19, 0.45);
        return <g key={i}>{on && <rect x={30} y={88 + i * 70} width={520} height={56} rx={12} fill={YEL} opacity={0.18} />}<T x={290} y={116 + i * 70} s={32} c={on ? YEL : W} f={KM} sc={pp(t, mid(19, 0.15 + i * 0.12))}>δ({sub("q", q)}, {a}) = ({sub("q", q2)}, {b}, {d})</T></g>; })}
      <T x={290} y={312} s={22} c={DIM} f="InterX" sc={pp(t, mid(19, 0.7))}>état + symbole lu → quoi écrire, où aller, quel état</T></Card>
  </>; };
const TUP: [React.ReactNode, string][] = [["Q", "états"], ["Σ", "alphabet d’entrée"], ["Γ", "alphabet de bande"], ["δ", "transition"], [sub("q", "0"), "état initial"], [sub("q", "acc"), "acceptation"], [sub("q", "rej"), "rejet"]];
const Formal = (t: number) => { const D: [number, number][] = [[560, 760], [960, 760], [1380, 760]];
  return <>
    <T x={250} y={200} s={84} c={W} f={KM} sc={pp(t, S(20) + 0.1)}>M = (</T><T x={1800} y={200} s={84} c={W} f={KM} sc={pp(t, mid(20, 0.95))}>)</T>
    {TUP.map(([s, l], i) => { const at = mid(20, 0.16 + i * 0.115), x = 470 + i * 206;
      return <g key={l}><T x={x} y={200} s={80} c={t < at + 0.6 ? YEL : W} f={KM} sc={pp(t, at)}>{s}</T>{i < 6 && <T x={x + 103} y={214} s={70} c={DIM} f={KM} sc={pp(t, at)}>,</T>}
        <T x={x} y={290} s={21} c={DIM} f="InterX" sc={pp(t, at + 0.15)}>{l}</T></g>; })}
    <Card x={360} y={380} w={1200} h={210} c={YEL} p={pp(t, S(21) + 0.1)}>
      <T x={600} y={80} s={66} c={W} f={KM}>δ : Q × Γ → Q × Γ × {"{"}G, D{"}"}</T>
      <Bracket x1={250} x2={500} y={130} p={k(t, mid(21, 0.3), 0.5)} label="état, symbole lu" /><Bracket x1={640} x2={1110} y={130} p={k(t, mid(21, 0.55), 0.5)} label="nouvel état, symbole écrit, direction" /></Card>
    <St x={D[0][0]} y={D[0][1]} l={sub("q", "0")} init sc={pp(t, S(22) + 0.1)} /><St x={D[1][0]} y={D[1][1]} l={sub("q", "1")} sc={pp(t, S(22) + 0.3)} />
    <St x={D[2][0]} y={D[2][1]} l={sub("q", "acc")} ls={28} acc c={GRN} sc={pp(t, S(22) + 0.5)} />
    <Arr a={D[0]} b={D[1]} p={k(t, mid(22, 0.3), 0.6)} label="1 → 0, D" bend={-40} lo={40} /><Arr a={D[1]} b={D[2]} p={k(t, mid(22, 0.45), 0.6)} label="⊔ → ⊔, G" bend={-40} lo={40} c={GRN} />
    <SelfLoop x={D[0][0]} y={D[0][1]} p={k(t, mid(22, 0.55), 0.6)} label="0 → 0, D" up={false} /><SelfLoop x={D[1][0]} y={D[1][1]} p={k(t, mid(22, 0.62), 0.6)} label="1 → 1, D" up={false} />
    <Chip x={1640} y={660} text="lu → écrit, direction" c={YEL} fg="#14101f" sc={pp(t, mid(22, 0.78))} s={32} />
    <Mark x={(D[0][0] + D[1][0]) / 2} y={D[0][1] - 80} rx={130} ry={44} p={k(t, mid(22, 0.85), 0.5)} c={YEL} w={6} seed={3} />
  </>; };
const RX = 600, RCW = 120;
const Run = (t: number) => { const taus = [0.24, 0.38, 0.52].map((f) => mid(27, f)), ex = t >= S(27);
  const cells = ["_", "1", "0", "1", "_", "_"].map((c, i) => (ex && i >= 1 && i <= 3 && t > taus[i - 1] + 0.15 ? (c === "1" ? "0" : "1") : c));
  const hp = 1 + (ex ? taus.reduce((a, x) => a + k(t, x + 0.25, 0.3), 0) : 0), acc = ex && t > mid(27, 0.8);
  const cyc = ["lire", "appliquer la règle", "écrire", "se déplacer", "changer d’état"], ci = Math.floor(((t - S(24)) / (E(24) - S(24))) * 5);
  return <>
    <g opacity={1 - k(t, S(27), 0.4)}>{cyc.map((c, i) => <g key={c}><Chip x={250 + i * 355} y={140} text={c} c={t >= S(24) && i === ci % 5 ? YEL : SOFT} fg={t >= S(24) && i === ci % 5 ? "#14101f" : W} sc={pp(t, S(24) + 0.1 + i * 0.15)} s={32} />
      {i < 4 && <Head x={430 + i * 355} y={140} p={k(t, S(24) + 0.3 + i * 0.15)} c={DIM} s={0.5} />}</g>)}
      <Draw d="M1670 175 Q1670 225 960 225 Q250 225 250 175" p={k(t, S(24) + 1.0, 0.6)} c={DIM} w={4} dash="10 10" /><T x={960} y={258} s={28} c={DIM} f="InterX" sc={pp(t, S(24) + 1.3)}>puis elle recommence ↺</T></g>
    <Card x={560} y={110} w={800} h={230} c={YEL} p={ex ? pp(t, S(27) + 0.2) : 0} title="EXEMPLE : INVERSER LES BITS" tc={YEL}>
      {[["0", "1", "0"], ["1", "0", "0"], ["⊔", "⊔", "acc"]].map(([a, b, q], i) => <T key={i} x={400} y={102 + i * 42} s={30} c={W} f={KM}>{sub("q", "0")}, {a} → {sub("q", q)}, {b}, {i < 2 ? "D" : "G"}</T>)}</Card>
    <Tape x={RX} y={480} cells={cells} cw={RCW} p={k(t, S(23) + 0.1, 0.9)} hl={acc ? { 4: GRN } : { [Math.round(hp)]: YEL }} />
    <HeadBox x={cxOf(RX, hp, RCW)} y={480} cw={RCW} st={acc ? "acc" : sub("q", "0")} c={acc ? GRN : YEL} sc={pp(t, mid(23, 0.45))} />
    <Chip x={cxOf(RX, 1, RCW)} y={590} text="état initial" c={SOFT} sc={!ex ? pp(t, mid(23, 0.75)) : 0} s={28} />
    <Chip x={960} y={600} text="ACCEPTÉ  ·  1 0 1  →  0 1 0" c={GRN} fg="#0b1a10" sc={acc ? pp(t, mid(27, 0.82)) : 0} s={38} />
    <Card x={130} y={660} w={700} h={300} p={!ex ? pp(t, S(25) + 0.2) : 0} title="ÉTAT INITIAL · ÉTATS FINAUX" tc={YEL}>
      <St x={160} y={180} l={sub("q", "0")} init sc={pp(t, S(25) + 0.4)} /><T x={160} y={262} s={24} c={DIM} f="InterX" sc={pp(t, S(25) + 0.5)}>unique : tout commence ici</T>
      <St x={400} y={170} l="acc" ls={26} acc c={GRN} sc={pp(t, mid(25, 0.5))} /><St x={580} y={170} l="rej" ls={26} c={RED} sc={pp(t, mid(25, 0.55))} />
      <T x={490} y={262} s={26} c={YEL} sc={pp(t, mid(25, 0.75))}>→ LA MACHINE S’ARRÊTE</T></Card>
    <Card x={1000} y={660} w={790} h={300} p={!ex ? pp(t, S(26) + 0.2) : 0} title="RÉSULTAT" tc={YEL}>
      {([[GRN, "s’arrête dans acc", "ACCEPTÉ", true], [RED, "s’arrête dans rej", "REJETÉ", false]] as [string, string, string, boolean][]).map(([c, a, b, ok], i) => <g key={b} opacity={k(t, mid(26, 0.1 + i * 0.25), 0.3)}>
        <Tick x={70} y={112 + i * 64} ok={ok} sc={1} s={0.9} /><T x={110} y={112 + i * 64} s={30} c={W} f="InterX" anchor="start">{a}</T><T x={720} y={112 + i * 64} s={34} c={c} anchor="end">{b}</T></g>)}
      <g opacity={k(t, mid(26, 0.72), 0.3)}><T x={70} y={240} s={46} c={YEL} f={KM}>∞</T><T x={110} y={240} s={30} c={W} f="InterX" anchor="start">ne s’arrête jamais</T><T x={720} y={240} s={34} c={YEL} anchor="end">BOUCLE</T></g></Card>
  </>; };
/* ---------- CHAPITRE 3 ---------- */
type TN = { x: number; y: number; p: number; f: number; s?: "ok" | "ko" };
const TREE: TN[] = [{ x: 1410, y: 330, p: -1, f: 0 }, { x: 1170, y: 470, p: 0, f: 0.1 }, { x: 1410, y: 470, p: 0, f: 0.12 }, { x: 1650, y: 470, p: 0, f: 0.14 },
  { x: 1090, y: 610, p: 1, f: 0.25, s: "ko" }, { x: 1250, y: 610, p: 1, f: 0.27 }, { x: 1410, y: 610, p: 2, f: 0.29, s: "ko" }, { x: 1580, y: 610, p: 3, f: 0.31 }, { x: 1720, y: 610, p: 3, f: 0.33, s: "ko" },
  { x: 1200, y: 750, p: 5, f: 0.42, s: "ko" }, { x: 1300, y: 750, p: 5, f: 0.44, s: "ko" }, { x: 1580, y: 750, p: 7, f: 0.46, s: "ok" }];
const Det = (t: number) => { const c0 = S(28) + 1.9, path = new Set([0, 3, 7, 11]), hi = t > mid(29, 0.66);
  return <>
    <T x={510} y={150} s={52} c={W} sc={pp(t, c0)}>DÉTERMINISTE</T><Chip x={510} y={225} text="(état, symbole) → au plus 1 règle" c={SOFT} sc={pp(t, mid(28, 0.4))} s={28} />
    {[0, 1, 2, 3, 4].map((i) => { const at = mid(28, 0.5 + i * 0.09), y = 330 + i * 125, last = i === 4;
      return <g key={i}>{i > 0 && <Arr a={[510, y - 125]} b={[510, y]} r={40} p={k(t, at - 0.05, 0.3)} />}<St x={510} y={y} l={last ? "acc" : <>C{sub("", `${i}`)}</>} r={40} ls={last ? 24 : 30} c={last ? GRN : W} acc={last} sc={pp(t, at)} /></g>; })}
    <T x={700} y={580} s={30} c={DIM} f="InterX" sc={pp(t, mid(28, 0.8))} anchor="start">un seul chemin</T>
    <T x={1410} y={150} s={52} c={W} sc={pp(t, S(29) + 0.1)}>NON DÉTERMINISTE</T><Chip x={1410} y={225} text="(état, symbole) → plusieurs choix" c={SOFT} sc={pp(t, S(29) + 0.4)} s={28} />
    {TREE.map((n, i) => { const at = mid(29, n.f + 0.05), on = hi && path.has(i), c = n.s === "ok" ? GRN : n.s === "ko" ? RED : on ? GRN : W;
      return <g key={i}>{n.p >= 0 && <Arr a={[TREE[n.p].x, TREE[n.p].y]} b={[n.x, n.y]} r={30} p={k(t, at - 0.05, 0.3)} c={on ? GRN : LINE} w={on ? 6 : 4} />}
        <St x={n.x} y={n.y} r={30} l={n.s === "ok" ? "✓" : n.s === "ko" ? "✗" : ""} ls={30} lf="InterX" c={c} hot={on} sc={pp(t, at)} /></g>; })}
    <Chip x={1410} y={880} text="accepté si AU MOINS UNE branche accepte" c={GRN} fg="#0b1a10" sc={pp(t, mid(29, 0.72))} s={32} />
  </>; };
const Variants = (t: number) => { const hm = (j: number) => bounce(Math.max(0, t - S(30) - 0.5 + j * 0.31), 0.5 + j * 0.13, 0, 5), h2 = [bounce(Math.max(0, t - S(31)), 0.55, 0, 3), bounce(Math.max(0, t - S(31) + 0.2), 0.7, 4, 7)];
  return <>
    <Card x={90} y={80} w={840} h={470} p={pp(t, S(30) + 0.1)} title="PLUSIEURS BANDES" tc={YEL}>
      {[0, 1, 2].map((j) => <g key={j}><Tape x={180} y={170 + j * 105} cells={["1", "0", "_", "1", "1", "0"].map((c, i) => ((i + j) % 4 === 0 ? "_" : c))} cw={80} ends={false} p={k(t, S(30) + 0.3 + j * 0.2, 0.6)} hl={{ [Math.round(hm(j))]: YEL }} />
        <path d={`M${cxOf(180, hm(j), 80) - 12} ${130 + j * 105 - 6} h24 l-12 16 z`} fill={YEL} opacity={k(t, S(30) + 0.8)} /><T x={110} y={170 + j * 105} s={26} c={DIM} f="InterX">{j + 1}</T></g>)}
      <T x={420} y={438} s={28} c={W} f="InterX" sc={pp(t, mid(30, 0.62))}>une seule bande peut la simuler : temps ≤ {sup("t", "2")}</T></Card>
    <Card x={990} y={80} w={840} h={470} p={pp(t, S(31) + 0.1)} title="PLUSIEURS TÊTES" tc={YEL}>
      <Tape x={75} y={260} cells={["1", "0", "1", "1", "_", "0", "1", "0"]} cw={86} ends={false} p={k(t, S(31) + 0.3, 0.6)} hl={{ [Math.round(h2[0])]: YEL, [Math.round(h2[1])]: W }} />
      <HeadBox x={cxOf(75, h2[0], 86)} y={260} cw={86} st="1" sc={pp(t, S(31) + 0.6)} /><HeadBox x={cxOf(75, h2[1], 86)} y={260} cw={86} st="2" c={W} sc={pp(t, S(31) + 0.8)} />
      <T x={420} y={400} s={28} c={W} f="InterX" sc={pp(t, mid(31, 0.6))}>une même bande, des positions différentes</T></Card>
    <Card x={160} y={610} w={1600} h={380} c={YEL} p={pp(t, S(32) + 0.1)} title="LA MACHINE UNIVERSELLE  U" tc={YEL}>
      <Tape x={60} y={200} cells={["1", "0", "1", "1", "0", "#", "w"]} cw={76} ends={false} p={k(t, mid(32, 0.2), 0.6)} />
      <Bracket x1={64} x2={436} y={256} p={k(t, mid(32, 0.3), 0.5)} label="description de M" /><T x={60 + 6.5 * 76} y={300} s={28} c={YEL} f={KM} sc={pp(t, mid(32, 0.35))}>mot</T>
      <Draw d="M620 200 H700" p={k(t, mid(32, 0.4), 0.3)} c={W} w={5} /><Head x={706} y={200} p={k(t, mid(32, 0.4), 0.3)} c={W} s={0.6} />
      <g transform={`translate(860 200) scale(${pp(t, mid(32, 0.42))})`}><rect x={-140} y={-110} width={280} height={220} rx={26} fill={SOFT} stroke={YEL} strokeWidth={5} /><Gear x={-40} y={0} r={40} a={t * 60} c={DIM} /><T x={55} y={0} s={90} c={YEL}>U</T></g>
      <Draw d="M1010 200 H1090" p={k(t, mid(32, 0.5), 0.3)} c={W} w={5} /><Head x={1096} y={200} p={k(t, mid(32, 0.5), 0.3)} c={W} s={0.6} />
      <T x={1330} y={180} s={34} c={W} f="InterX" sc={pp(t, mid(32, 0.55))}>ce que ferait M</T><T x={1330} y={228} s={34} c={W} f="InterX" sc={pp(t, mid(32, 0.58))}>sur le mot w</T>
      <Chip x={800} y={340} text="= le programme stocké en mémoire" c={YEL} fg="#14101f" sc={pp(t, mid(32, 0.75))} s={32} /></Card>
  </>; };
const CMP: [string, string, string][] = [["déterministe", "✓", "référence"], ["non déterministe", "✓", "exponentiel"], ["plusieurs bandes", "✓", "quadratique"], ["plusieurs têtes", "✓", "polynomial"], ["universelle", "✓", "simule toute MT"]];
const Compare = (t: number) => <>
  <Card x={110} y={110} w={1120} h={760} p={pp(t, S(33) + 0.1)} title="COMPARAISON" tc={YEL}>
    <T x={60} y={130} s={26} c={DIM} f="InterX" anchor="start">modèle</T><T x={560} y={130} s={26} c={DIM} f="InterX">puissance</T><T x={890} y={130} s={26} c={DIM} f="InterX">coût de la simulation</T>
    {CMP.map(([a, b, c], i) => { const at = mid(33, 0.12 + i * 0.1), y = 220 + i * 105, hot = i === 1 && t > S(34);
      return <g key={a} opacity={k(t, at, 0.3)}>{hot && <rect x={30} y={y - 42} width={1060} height={84} rx={14} fill={RED} opacity={0.15} />}<line x1={40} x2={1080} y1={y + 52} y2={y + 52} stroke={LINE} strokeOpacity={0.15} strokeWidth={2} />
        <T x={60} y={y} s={36} c={W} f="InterX" anchor="start">{a}</T><Tick x={560} y={y} ok sc={pp(t, mid(33, 0.6 + i * 0.04))} s={0.9} /><T x={890} y={y} s={32} c={hot ? RED : DIM} f="InterX" sc={pp(t, mid(33, 0.8))}>{c}</T></g>; })}
    <Chip x={560} y={720} text="même puissance · efficacité différente" c={YEL} fg="#14101f" sc={pp(t, mid(33, 0.65))} s={32} /></Card>
  <g opacity={k(t, S(34) + 0.2, 0.4)}>
    {[[1440, 250], [1380, 340], [1500, 340], [1340, 430], [1420, 430], [1480, 430], [1560, 430]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={14} fill={i === 6 ? GRN : W} />)}
    <path d="M1440 250 L1380 340 L1340 430 M1380 340 L1420 430 M1440 250 L1500 340 L1480 430 M1500 340 L1560 430" stroke={LINE} strokeWidth={3} fill="none" />
    <T x={1450} y={180} s={30} c={W} f="InterX">non déterministe : t étapes</T>
    <Draw d="M1450 480 V560" p={k(t, mid(34, 0.25), 0.3)} c={RED} w={6} /><Head x={1450} y={566} p={k(t, mid(34, 0.25), 0.3)} c={RED} a={90} s={0.7} />
    {Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={1300 + (i % 7) * 50} cy={620 + Math.floor(i / 7) * 50} r={12} fill={W} opacity={k(t, mid(34, 0.3 + i * 0.02), 0.2)} />)}
    <T x={1450} y={760} s={30} c={W} f="InterX" sc={pp(t, mid(34, 0.35))}>déterministe : jusqu’à</T><T x={1450} y={820} s={56} c={RED} f={KM} sc={pp(t, mid(34, 0.45))}>{sup("2", "O(t)")}{"\u00a0"}étapes</T></g>
  <T x={1450} y={940} s={74} c={YEL} sc={pp(t, mid(34, 0.8))} glow={YEL}>P vs NP ?</T>
</>;

/* ---------- CHAPITRE 4 ---------- */
const MTBox: React.FC<{ x: number; y: number; sc: number; c?: string; label?: string }> = ({ x, y, sc, c = W, label = "MT" }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-90} y={-62} width={180} height={124} rx={20} fill={SOFT} stroke={c} strokeWidth={4} /><T x={0} y={-20} s={34} c={c}>{label}</T>
    {[0, 1, 2, 3].map((i) => <rect key={i} x={-60 + i * 30} y={14} width={26} height={26} rx={4} fill="none" stroke={DIM} strokeWidth={2} />)}</g>);
const Calc = (t: number) => { const c0 = S(35) + 1.9;
  return <>
    <Card x={100} y={80} w={820} h={340} p={pp(t, c0)} title="CALCULABLE" tc={YEL}>
      <T x={100} y={190} s={44} c={W} f={KI} it sc={pp(t, c0 + 0.4)}>x</T><Draw d="M140 190 H270" p={k(t, c0 + 0.5, 0.3)} c={W} w={5} /><Head x={276} y={190} p={k(t, c0 + 0.5, 0.3)} c={W} s={0.6} />
      <MTBox x={410} y={190} sc={pp(t, c0 + 0.6)} /><Draw d="M510 190 H640" p={k(t, mid(35, 0.6), 0.3)} c={W} w={5} /><Head x={646} y={190} p={k(t, mid(35, 0.6), 0.3)} c={W} s={0.6} />
      <T x={730} y={190} s={44} c={GRN} f={KM} sc={pp(t, mid(35, 0.7))}>f(x)</T><Chip x={410} y={300} text="pour toute entrée : s’arrête + bon résultat" c={GRN} fg="#0b1a10" sc={pp(t, mid(35, 0.8))} s={26} /></Card>
    <Card x={100} y={470} w={820} h={440} p={pp(t, S(36) + 0.1)} title="DÉCIDABLE  /  INDÉCIDABLE" tc={YEL}>
      <MTBox x={200} y={200} sc={pp(t, S(36) + 0.4)} c={GRN} /><Chip x={420} y={160} text="OUI" c={GRN} fg="#0b1a10" sc={pp(t, mid(36, 0.3))} s={32} /><Chip x={420} y={240} text="NON" c={GRN} fg="#0b1a10" sc={pp(t, mid(36, 0.35))} s={32} />
      <T x={620} y={200} s={30} c={W} f="InterX" sc={pp(t, mid(36, 0.42))}>toujours, et s’arrête</T>
      <line x1={60} x2={760} y1={300} y2={300} stroke={LINE} strokeOpacity={0.2} strokeWidth={2} />
      <T x={200} y={370} s={40} c={RED} sc={pp(t, mid(36, 0.75))}>INDÉCIDABLE</T><T x={560} y={370} s={30} c={W} f="InterX" sc={pp(t, mid(36, 0.8))}>aucune machine ne le peut</T></Card>
    <g opacity={k(t, S(37), 0.4)}>
      <rect x={1000} y={90} width={820} height={620} rx={30} fill="none" stroke={LINE} strokeOpacity={0.3} strokeWidth={3} strokeDasharray="12 10" /><T x={1410} y={135} s={28} c={DIM} f="InterX">tous les langages</T>
      <Ring cx={1410} cy={400} rx={340} ry={250} p={k(t, S(37) + 0.3, 0.8)} c={W} /><T x={1410} y={215} s={34} c={W} sc={pp(t, S(37) + 0.6)}>RECONNAISSABLES</T>
      <Ring cx={1410} cy={440} rx={180} ry={110} p={k(t, mid(37, 0.55), 0.7)} c={GRN} fo={0.14} /><T x={1410} y={440} s={34} c={GRN} sc={pp(t, mid(37, 0.6))}>DÉCIDABLES</T>
      <Chip x={1410} y={600} text="accepte ses mots · peut boucler ∞ sur les autres" c={SOFT} sc={pp(t, mid(37, 0.35))} s={24} />
      <T x={1410} y={680} s={30} c={YEL} f="InterX" sc={pp(t, mid(37, 0.85))}>décidable ⇒ reconnaissable</T></g>
    <Card x={1000} y={770} w={820} h={200} c={YEL} p={pp(t, S(38) + 0.2)}><T x={410} y={50} s={30} c={DIM} f="InterX">thèse de Church–Turing</T>
      <T x={410} y={120} s={40} c={W} f="InterX">algorithme <tspan fill={YEL}>⇔</tspan> machine de Turing</T><T x={410} y={168} s={30} c={DIM} f="InterX">qui s’arrête toujours</T></Card>
  </>; };
const Halt = (t: number) => { const a0 = S(40), say = (f: number) => k(t, mid(40, f), 0.3), boom = t > mid(40, 0.88);
  return <>
    <g transform="translate(480 250)" opacity={1 - k(t, S(40), 0.5)}><Doc x={-170} y={0} s={0.55} sc={pp(t, S(39) + 0.1)} title="programme P" /><T x={-20} y={0} s={60} c={W} f={KM} sc={pp(t, S(39) + 0.3)}>+</T>
      <T x={60} y={0} s={60} c={W} f={KI} it sc={pp(t, S(39) + 0.4)}>w</T><Chip x={330} y={-50} text="va-t-il s’arrêter ?" c={YEL} fg="#14101f" sc={pp(t, mid(39, 0.3))} s={34} />
      <g transform={`translate(330 40) rotate(${t * 140})`} opacity={k(t, mid(39, 0.35))}><circle r={34} fill="none" stroke={DIM} strokeWidth={5} /><path d="M0 0 V-24" stroke={W} strokeWidth={5} strokeLinecap="round" /></g></g>
    <T x={960} y={110} s={44} c={RED} sc={t < S(40) + 0.3 ? pp(t, mid(39, 0.75)) * (1 - k(t, S(40), 0.3)) : 0}>AUCUNE MACHINE NE PEUT RÉPONDRE DANS TOUS LES CAS</T>
    <g opacity={k(t, a0, 0.4) * (1 - 0.75 * k(t, S(41), 0.5))}>
      <g transform={`translate(470 620) scale(${pp(t, a0 + 0.2)})`}><rect x={-150} y={-100} width={300} height={200} rx={26} fill={SOFT} stroke={boom ? RED : W} strokeWidth={5} /><T x={0} y={0} s={100} c={boom ? RED : W}>H</T></g>
      <T x={210} y={620} s={34} c={W} f={KM} sc={pp(t, a0 + 0.4)}>⟨P⟩, w</T>
      <Chip x={740} y={560} text="s’arrête" c={SOFT} sc={pp(t, mid(40, 0.08))} s={28} /><Chip x={740} y={680} text="boucle" c={SOFT} sc={pp(t, mid(40, 0.1))} s={28} />
      <rect x={1000} y={330} width={760} height={460} rx={30} fill="none" stroke={YEL} strokeWidth={5} opacity={k(t, mid(40, 0.15))} /><T x={1380} y={375} s={44} c={YEL} sc={pp(t, mid(40, 0.15))}>D</T>
      <g transform={`translate(1200 560) scale(${pp(t, mid(40, 0.2))})`}><rect x={-90} y={-70} width={180} height={140} rx={20} fill={SOFT} stroke={W} strokeWidth={4} /><T x={0} y={0} s={60} c={W}>H</T></g>
      <Arr a={[1200, 560]} b={[1560, 470]} r={100} p={say(0.27)} label="« s’arrête »" ls={24} lo={26} bend={-20} /><Arr a={[1200, 560]} b={[1560, 660]} r={100} p={say(0.32)} label="« boucle »" ls={24} lo={26} bend={20} />
      <g transform="translate(1640 470)" opacity={say(0.3)}><circle r={36} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="160 60" transform={`rotate(${t * 300})`} /><T x={0} y={2} s={36} c={RED} f={KM}>∞</T></g>
      <Chip x={1640} y={660} text="STOP" c={RED} sc={pp(t, mid(40, 0.35))} s={30} />
      <Draw d="M1380 790 Q1380 900 1000 900 Q900 900 900 560 L1050 560" p={say(0.4)} c={YEL} w={5} dash="14 12" /><T x={1150} y={940} s={30} c={YEL} f="InterX" sc={pp(t, mid(40, 0.42))}>D reçoit sa propre description ⟨D⟩</T>
      <T x={1380} y={250} s={36} c={W} f="InterX" sc={pp(t, mid(40, 0.55))}>D s’arrête <tspan fill={RED}>⇒</tspan> D boucle</T><T x={1380} y={300} s={36} c={W} f="InterX" sc={pp(t, mid(40, 0.68))}>D boucle <tspan fill={RED}>⇒</tspan> D s’arrête</T>
      <Mark x={1380} y={275} rx={330} ry={70} p={k(t, mid(40, 0.78), 0.5)} c={RED} w={7} seed={4} /><Chip x={960} y={180} text="CONTRADICTION" c={RED} sc={pp(t, mid(40, 0.8))} s={40} />
      {boom && <g transform={`translate(470 620) scale(${pp(t, mid(40, 0.88))})`}><path d="M-150 -110 L150 110 M150 -110 L-150 110" stroke={RED} strokeWidth={16} strokeLinecap="round" /><T x={0} y={170} s={40} c={RED}>H N’EXISTE PAS</T></g>}</g>
    <Card x={560} y={430} w={800} h={160} c={RED} p={pp(t, S(41) + 0.2)}><T x={400} y={52} s={40} c={RED}>LIMITE FONDAMENTALE</T><T x={400} y={110} s={30} c={W} f="InterX">temps ∞ + mémoire ∞ → toujours impossible</T></Card>
  </>; };

/* ---------- CHAPITRE 5 ---------- */
const MX = 410, MCW = 110;
const Measure = (t: number) => { const c0 = S(42) + 1.9, run = t >= S(44), tt = Math.max(0, t - S(44) - 0.2), pos = run ? bounce(tt, 0.26, 0, 7) : 0, steps = run ? Math.floor(tt / 0.26) : 0, vis = Math.min(8, run ? Math.min(7, steps) + 1 : 0);
  const hl: Record<number, string> = {}; if (t >= S(45)) for (let i = 0; i < vis; i++) hl[i] = BLUE; hl[Math.round(pos)] = YEL;
  return <>
    <T x={680} y={130} s={60} c={DIM} sc={pp(t, c0)}>résoluble ?</T><Tick x={890} y={130} ok sc={pp(t, c0 + 0.3)} /><Draw d="M960 130 H1070" p={k(t, c0 + 0.5, 0.3)} c={YEL} w={5} /><Head x={1076} y={130} p={k(t, c0 + 0.5, 0.3)} c={YEL} s={0.6} />
    <T x={1290} y={130} s={64} c={YEL} sc={pp(t, c0 + 0.7)}>à quel coût ?</T>
    <Tape x={MX} y={400} cells={["1", "0", "1", "1", "0", "1", "_", "_", "_", "_"]} cw={MCW} p={k(t, S(43) + 0.1, 0.8)} hl={run ? hl : {}} />
    <Bracket x1={MX + 6} x2={MX + 6 * MCW - 6} y={474} p={k(t, mid(43, 0.5), 0.5)} label="n = 6" />
    <HeadBox x={cxOf(MX, pos, MCW)} y={400} cw={MCW} sc={pp(t, S(44) + 0.1)} />
    <Card x={430} y={600} w={500} h={170} c={YEL} p={pp(t, S(44) + 0.3)}><T x={250} y={50} s={30} c={DIM} f="InterX">TEMPS</T><T x={250} y={115} s={56} c={YEL} f={KM}>{steps} transitions</T></Card>
    <Card x={990} y={600} w={500} h={170} c={BLUE} p={pp(t, S(45) + 0.3)}><T x={250} y={50} s={30} c={DIM} f="InterX">ESPACE</T><T x={250} y={115} s={56} c={W} f={KM}>{vis} cases</T></Card>
    <T x={960} y={830} s={28} c={DIM} f="InterX" sc={pp(t, mid(44, 0.6))}>dans le pire des cas, en fonction de n</T>
    <g opacity={k(t, S(46), 0.4)}>{[["processeur lent", "2,0 s"], ["processeur rapide", "0,1 s"]].map(([a, b], i) => <g key={a} transform={`translate(${620 + i * 680} 960)`}>
      <Desktop x={-160} y={10} s={0.55} sc={pp(t, S(46) + 0.2 + i * 0.3)} /><T x={40} y={-24} s={28} c={W} f="InterX" anchor="start">{a}</T><T x={40} y={22} s={30} c={YEL} f={KM} anchor="start">{steps} étapes · {b}</T></g>)}
      <T x={960} y={1050} s={28} c={YEL} f="InterX" sc={pp(t, mid(46, 0.6))}>même nombre d’étapes : seul l’algorithme compte</T></g>
  </>; };
const CLS: [number, number, number, number, string, string, string, number][] = [
  [620, 700, 240, 140, "P", "tri · plus court chemin", "temps polynomial · déterministe", 0],
  [770, 645, 440, 250, "NP", "sudoku · SAT", "vérifiable en temps polynomial", 1],
  [920, 600, 650, 360, "PSPACE", "QBF", "mémoire polynomiale", 2],
  [1030, 560, 830, 460, "EXPTIME", "échecs n × n", "temps exponentiel", 3]];
const Classes = (t: number) => { const at = [mid(47, 0.4), mid(48, 0.15), mid(49, 0.08), mid(49, 0.42)], lx = [620, 1075, 1395, 1700];
  return <>
    {[...CLS].reverse().map(([cx, cy, rx, ry, n, ex, d, i]) => { const on = t >= at[i], cur = on && (i === 3 ? t < mid(49, 0.7) : t < at[i + 1] + 0.4), c = i === 0 ? YEL : cur ? YEL : W;
      return <g key={n}><Ring cx={cx} cy={cy} rx={rx} ry={ry} p={k(t, at[i], 0.8)} c={c} fo={i === 0 ? 0.12 : 0.04} />
        <T x={lx[i]} y={i === 0 ? 670 : cy - 40} s={i === 0 ? 70 : 48} c={c} sc={pp(t, at[i] + 0.3)}>{n}</T><T x={lx[i]} y={i === 0 ? 730 : cy + 14} s={24} c={DIM} f="InterX" sc={pp(t, at[i] + 0.5)}>{ex}</T>
        <T x={lx[i]} y={i === 0 ? 770 : cy + 52} s={20} c={cur ? YEL : DIM} f="InterX" sc={pp(t, at[i] + 0.7)}>{d}</T></g>; })}
    <g opacity={k(t, S(48) + 0.4, 0.4) * (1 - k(t, S(49), 0.4))}><Tick x={1080} y={810} ok sc={1} /><T x={1110} y={810} s={26} c={W} f="InterX" anchor="start">vérifier : rapide</T></g>
    <T x={960} y={70} s={52} c={W} f={KM} sc={pp(t, mid(49, 0.72))}>P ⊆ NP ⊆ PSPACE ⊆ EXPTIME</T>
  </>; };
const SUD = (r: number, c: number) => ((r * 3 + Math.floor(r / 3) + c) % 9) + 1;
const PvsNP = (t: number) => { const f0 = mid(50, 0.18), f1 = mid(50, 0.48), v0 = mid(50, 0.52), v1 = mid(50, 0.68), sweep = (t - v0) / (v1 - v0);
  const curve = (g: (n: number) => number) => { let d = ""; for (let i = 0; i <= 60; i++) { const n = (i / 60) * 10, y = Math.max(-40, 820 - g(n) * 0.58); d += `${i ? "L" : "M"}${1100 + n * 64} ${y} `; } return d; };
  return <>
    <T x={500} y={110} s={52} c={W} sc={pp(t, S(50) + 0.1)}>TROUVER <tspan fill={DIM}>vs</tspan> VÉRIFIER</T>
    <g transform="translate(500 520)" opacity={k(t, S(50) + 0.2, 0.4)}>
      {Array.from({ length: 81 }).map((_, i) => { const r = Math.floor(i / 9), c = i % 9, given = (i * 7) % 5 === 0, ft = f0 + (((i * 37) % 81) / 81) * (f1 - f0), shown = given || t > ft, row = Math.floor(sweep * 9);
        return <g key={i}><rect x={-279 + c * 62} y={-279 + r * 62} width={62} height={62} fill={sweep > 0 && sweep < 1.1 && r <= row ? GRN + "33" : "transparent"} stroke={LINE} strokeOpacity={0.35} strokeWidth={1.5} />
          {shown && <text x={-248 + c * 62} y={-237 + r * 62} fontFamily={KM} fontSize={34} fill={given ? W : YEL} textAnchor="middle">{SUD(r, c)}</text>}</g>; })}
      {[0, 1, 2, 3].map((i) => <g key={i}><line x1={-279 + i * 186} x2={-279 + i * 186} y1={-279} y2={279} stroke={W} strokeWidth={4} /><line y1={-279 + i * 186} y2={-279 + i * 186} x1={-279} x2={279} stroke={W} strokeWidth={4} /></g>)}</g>
    <Chip x={340} y={870} text="trouver : très long" c={SOFT} sc={pp(t, f0)} s={30} /><Chip x={680} y={870} text="vérifier : rapide" c={GRN} fg="#0b1a10" sc={pp(t, v0)} s={30} />
    <T x={500} y={970} s={64} c={YEL} sc={pp(t, mid(50, 0.8))} glow={YEL}>P = NP ?</T>
    <g opacity={k(t, S(51), 0.4)}><Axes ox={1100} oy={820} w={680} h={660} p={k(t, S(51) + 0.1, 0.5)} xl="n" />
      <Draw d={curve((n) => n * n)} p={k(t, mid(51, 0.15), 0.8)} c={W} w={7} /><T x={1760} y={720} s={40} c={W} f={KM} sc={pp(t, mid(51, 0.3))}>{sup("n", "2")}</T>
      <Draw d={curve((n) => 2 ** n)} p={k(t, mid(51, 0.5), 0.8)} c={RED} w={7} glow /><T x={1600} y={160} s={44} c={RED} f={KM} sc={pp(t, mid(51, 0.6))}>{sup("2", "n")}</T>
      <Chip x={1440} y={960} text="+1 élément  →  temps × 2" c={RED} sc={pp(t, mid(51, 0.82))} s={32} /></g>
  </>; };
const NPC = ["sudoku", "coloriage", "sac à dos", "voyageur", "clique", "planning"];
const Reduce = (t: number) => <>
  {([[260, "A"], [880, "B"]] as [number, string][]).map(([x, l], i) => <g key={l} transform={`translate(${x} 230) scale(${pp(t, S(52) + 0.1 + i * 0.4)})`}><rect x={-110} y={-80} width={220} height={160} rx={24} fill={SOFT} stroke={i ? YEL : W} strokeWidth={5} /><T x={0} y={0} s={80} c={i ? YEL : W} f={KM}>{l}</T></g>)}
  <Arr a={[260, 230]} b={[880, 230]} r={120} p={k(t, mid(52, 0.12), 0.5)} label="réduction" ls={30} lo={-40} c={YEL} />
  <Arr a={[880, 230]} b={[1380, 230]} r={120} p={k(t, mid(52, 0.25), 0.5)} />
  <g transform={`translate(1450 230) scale(${pp(t, mid(52, 0.27))})`}><Gear x={0} y={0} r={52} a={t * 80} c={DIM} /><T x={0} y={110} s={28} c={W} f="InterX">résoudre B</T></g>
  <Chip x={1710} y={230} text="⇒ A résolu" c={GRN} fg="#0b1a10" sc={pp(t, mid(52, 0.35))} s={32} />
  <g opacity={k(t, mid(52, 0.48), 0.4)}><ellipse cx={600} cy={700} rx={470} ry={250} fill="#ffffff08" stroke={W} strokeWidth={4} /><T x={260} y={500} s={50} c={W}>NP</T>
    {NPC.map((n, i) => { const a = (i / NPC.length) * Math.PI * 2 + 0.3, x = 600 + Math.cos(a) * 330, y = 700 + Math.sin(a) * 170, p = k(t, mid(52, 0.55 + i * 0.04), 0.4);
      return <g key={n}><Arr a={[x, y]} b={[600, 700]} r={0} p={p} c={LINE} w={3} /><Chip x={x} y={y} text={n} c={SOFT} sc={pp(t, mid(52, 0.52 + i * 0.04))} s={24} /></g>; })}
    <g transform={`translate(600 700) scale(${pp(t, mid(52, 0.8))})`}><circle r={86} fill={YEL} style={{ filter: `drop-shadow(0 0 24px ${YEL})` }} /><T x={0} y={2} s={54} c="#14101f">SAT</T></g>
    <Chip x={600} y={1000} text="NP-complet  ·  Cook–Levin, 1971" c={YEL} fg="#14101f" sc={pp(t, mid(52, 0.86))} s={30} /></g>
  <Card x={1210} y={500} w={620} h={440} c={YEL} p={pp(t, S(53) + 0.2)} title="L’ÉTALON" tc={YEL}>
    <rect x={60} y={100} width={500} height={70} rx={10} fill={YEL} opacity={0.9} />{Array.from({ length: 21 }).map((_, i) => <line key={i} x1={70 + i * 24} x2={70 + i * 24} y1={100} y2={i % 5 ? 122 : 136} stroke="#14101f" strokeWidth={3} />)}
    <T x={310} y={240} s={32} c={W} f="InterX">temps = nombre de transitions</T><T x={310} y={300} s={32} c={W} f="InterX">espace = nombre de cases</T>
    <T x={310} y={380} s={28} c={DIM} f="InterX" sc={pp(t, mid(53, 0.6))}>indépendant de la technologie</T></Card>
</>;
/* ---------- CHAPITRE 6 ---------- */
const CODE = ["bande = list(mot) + ['⊔']", "tete, etat = 0, 'q0'", "while etat not in ('acc', 'rej'):", "    etat, s, d = delta[etat, bande[tete]]", "    bande[tete] = s", "    tete += d"];
const EVX = 660, EVCW = 120, EVSEQ = ["pair", "impair", "impair", "pair", "impair"];
const Even = (t: number) => { const c0 = S(54) + 1.9, P: [number, number] = [1140, 330], I: [number, number] = [1600, 330], A: [number, number] = [1140, 520], R: [number, number] = [1600, 520];
  const taus = [0, 1, 2, 3, 4].map((i) => mid(56, 0.06 + i * 0.12)), ix = taus.filter((x) => t >= x).length - 1, run = t >= S(56), cur = run && ix >= 0 ? EVSEQ[ix] : "", rej = run && t > mid(56, 0.72);
  return <>
    <Win x={110} y={110} w={820} h={420} p={pp(t, c0)} title="simulateur.py">
      {CODE.map((l, i) => <text key={i} x={36} y={110 + i * 50} fontFamily="InterX" fontWeight={600} fontSize={25} fill={i === 3 && t > mid(54, 0.7) ? YEL : i < 2 ? DIM : W} xmlSpace="preserve">{typed(l, (t - c0 - 0.3 - i * 0.45) / 0.8)}</text>)}</Win>
    <T x={520} y={580} s={28} c={DIM} f="InterX" sc={pp(t, mid(54, 0.75))}>la table de transitions, exécutée pas à pas</T>
    <T x={1370} y={120} s={36} c={W} sc={pp(t, S(55) + 0.1)}>NOMBRE PAIR DE 1</T>
    <St x={P[0]} y={P[1]} l="pair" ls={26} lf="InterX" init r={56} sc={pp(t, mid(55, 0.3))} hot={cur === "pair" && !rej} c={cur === "pair" && !rej ? YEL : W} />
    <St x={I[0]} y={I[1]} l="impair" ls={24} lf="InterX" r={56} sc={pp(t, mid(55, 0.35))} hot={cur === "impair"} c={cur === "impair" ? YEL : W} />
    <Arr a={P} b={I} bend={-60} p={k(t, mid(55, 0.5), 0.5)} label="1" ls={34} lo={30} /><Arr a={I} b={P} bend={-60} p={k(t, mid(55, 0.55), 0.5)} label="1" ls={34} lo={30} />
    <T x={P[0] - 140} y={P[1] - 90} s={28} c={DIM} f={KM} sc={pp(t, mid(55, 0.78))}>0 : reste</T><T x={I[0] + 140} y={I[1] - 90} s={28} c={DIM} f={KM} sc={pp(t, mid(55, 0.8))}>0 : reste</T>
    <St x={A[0]} y={A[1]} l="acc" ls={24} acc c={GRN} r={42} sc={pp(t, mid(55, 0.65))} /><St x={R[0]} y={R[1]} l="rej" ls={24} c={RED} r={42} hot={rej} sc={pp(t, mid(55, 0.68))} />
    <Arr a={P} b={A} r={50} p={k(t, mid(55, 0.7), 0.4)} label="⊔" ls={28} lo={-26} c={GRN} /><Arr a={I} b={R} r={50} p={k(t, mid(55, 0.72), 0.4)} label="⊔" ls={28} lo={-26} c={RED} />
    <Tape x={EVX} y={800} cells={["1", "0", "1", "1", "_"]} cw={EVCW} p={k(t, S(56) - 0.2, 0.6)} hl={run && ix >= 0 ? { [Math.min(4, ix)]: rej ? RED : YEL } : {}} />
    <HeadBox x={cxOf(EVX, kf(t, taus.map((x, i) => [x, i] as [number, number])), EVCW)} y={800} cw={EVCW} st={cur ? <tspan fontFamily="InterX" fontSize={22}>{cur}</tspan> : undefined} c={rej ? RED : YEL} sc={run ? pp(t, S(56)) : 0} />
    <Chip x={960} y={940} text="3 fois le 1 → impair → REJETÉ" c={RED} sc={rej ? pp(t, mid(56, 0.75)) : 0} s={36} />
  </>; };
const PAL = (t: number) => { const f = (x: number) => mid(57, x);
  const hp = kf(t, [[f(0.08), 1], [f(0.16), 1], [f(0.3), 4], [f(0.4), 4], [f(0.52), 2], [f(0.58), 2], [f(0.64), 3], [f(0.74), 3]]);
  const cells = ["_", "a", "b", "b", "a", "_"].map((c, i) => ((i === 1 && t > f(0.14)) || (i === 4 && t > f(0.4)) || (i === 2 && t > f(0.58)) || (i === 3 && t > f(0.72)) ? "_" : c));
  const st = t < f(0.14) ? sub("q", "0") : t < f(0.36) ? "a ?" : t < f(0.4) ? "✓" : t < f(0.5) ? "←" : t < f(0.6) ? "b ?" : t < f(0.7) ? "✓" : "acc";
  const ok = (t > f(0.36) && t < f(0.42)) || (t > f(0.68) && t < f(0.74)), acc = t > f(0.8);
  return { hp, cells, st, ok, acc };
};
const PX = 600, PCW = 120, AX = 575, ACW = 110;
const PalAdd = (t: number) => { const pl = PAL(t), g = (x: number) => mid(58, x), ahp = kf(t, [[g(0.3), 0], [g(0.45), 2], [g(0.55), 2], [g(0.64), 6], [g(0.7), 5]]);
  const acells = ["1", "1", "+", "1", "1", "1", "_"].map((c, i) => (i === 2 && t > g(0.5) ? "1" : i === 5 && t > g(0.74) ? "_" : c)), done = t > g(0.8);
  return <>
    <T x={960} y={100} s={48} c={W} sc={pp(t, S(57) + 0.1)}>PALINDROME</T><T x={960} y={150} s={26} c={DIM} f="InterX" sc={pp(t, S(57) + 0.3)}>se lit pareil dans les deux sens</T>
    <Tape x={PX} y={390} cells={pl.cells} cw={PCW} p={k(t, S(57) + 0.2, 0.6)} hl={pl.acc ? { 2: GRN, 3: GRN } : pl.ok ? { [Math.round(pl.hp)]: GRN } : { [Math.round(pl.hp)]: YEL }} />
    <HeadBox x={cxOf(PX, pl.hp, PCW)} y={390} cw={PCW} st={pl.st} c={pl.acc ? GRN : YEL} sc={pp(t, S(57) + 0.5)} />
    <Chip x={960} y={505} text="mot vide → ACCEPTÉ" c={GRN} fg="#0b1a10" sc={pl.acc ? pp(t, mid(57, 0.82)) : 0} s={32} />
    <T x={960} y={620} s={48} c={W} sc={pp(t, S(58) + 0.1)}>ADDITION UNAIRE</T><T x={960} y={670} s={34} c={DIM} f={KM} sc={pp(t, S(58) + 0.3)}>2 + 3  =  11 + 111</T>
    <Tape x={AX} y={850} cells={acells} cw={ACW} p={k(t, S(58) + 0.3, 0.6)} hl={done ? { 0: GRN, 1: GRN, 2: GRN, 3: GRN, 4: GRN } : { [Math.round(ahp)]: YEL }} />
    <HeadBox x={cxOf(AX, ahp, ACW)} y={850} cw={ACW} sc={pp(t, g(0.28))} c={done ? GRN : YEL} />
    <Chip x={cxOf(AX, 2, ACW)} y={965} text="+ → 1" c={SOFT} sc={t > g(0.5) && !done ? pp(t, g(0.5)) : 0} s={28} /><Chip x={cxOf(AX, 5, ACW)} y={965} text="effacer le dernier 1" c={SOFT} sc={t > g(0.74) && !done ? pp(t, g(0.74)) : 0} s={28} />
    <Chip x={960} y={970} text={"1\u00a01\u00a01\u00a01\u00a01\u00a0\u00a0=\u00a0\u00a05"} c={GRN} fg="#0b1a10" sc={done ? pp(t, g(0.82)) : 0} s={38} />
  </>; };
const ANA: [string, React.ReactNode, string, number][] = [["nombre pair de 1", "O(n)", "O(1) en plus", 60], ["palindrome · 1 bande", <>{sup("O(n", "2")})</>, "O(n)", 61], ["palindrome · 2 bandes", "O(n)", "O(n)", 61], ["addition unaire", "O(n)", "O(n)", 61]];
const Sim = (t: number) => { const clicks = [0.25, 0.4, 0.55, 0.7].map((f) => mid(59, f)), n = clicks.filter((x) => t > x).length, press = Math.max(0, ...clicks.map((x) => (t > x ? 1 - sat((t - x) / 0.3) : 0)));
  const cur: [number, number] = [kf(t, [[S(59), 900], [mid(59, 0.2), 560]]), kf(t, [[S(59), 900], [mid(59, 0.2), 812]])];
  return <>
    <Win x={110} y={100} w={940} h={800} p={pp(t, S(59) + 0.1)} title="Simulateur de machine de Turing">
      <Tape x={130} y={200} cells={["1", "0", "1", "1", "_", "_"]} cw={100} ends={false} p={1} hl={{ [n]: YEL }} />
      <HeadBox x={cxOf(130, kf(t, clicks.map((x, i) => [x + 0.1, i + 1] as [number, number]).concat([[S(59), 0]]).sort((a, b) => a[0] - b[0])), 100)} y={200} cw={100} st={n % 2 ? "impair" : "pair"} />
      <T x={130} y={330} s={28} c={DIM} f="InterX" anchor="start">état : <tspan fill={YEL}>{n % 2 ? "impair" : "pair"}</tspan>   ·   étape : <tspan fill={YEL}>{n}</tspan></T>
      <rect x={40} y={380} width={860} height={250} rx={14} fill={SOFT} /><T x={70} y={415} s={24} c={DIM} f="InterX" anchor="start">TRANSITIONS</T>
      {["pair, 1 → impair, 1, D", "pair, 0 → pair, 0, D", "impair, 1 → pair, 1, D", "impair, 0 → impair, 0, D"].map((l, i) => <T key={l} x={70} y={460 + i * 44} s={28} c={W} f={KM} anchor="start">{l}</T>)}
      {[["▶ exécuter", 150], ["⏭ pas à pas", 450], ["⟲ réinitialiser", 750]].map(([l, x], i) => <g key={l as string}><rect x={(x as number) - 130} y={680} width={260} height={64} rx={14} fill={i === 1 && press > 0 ? YEL : SOFT} stroke={LINE} strokeOpacity={0.4} strokeWidth={2} />
        <T x={x as number} y={712} s={28} c={i === 1 && press > 0 ? "#14101f" : W} f="InterX">{l as string}</T></g>)}</Win>
    {t > S(59) && t < E(59) + 0.5 && <Cursor x={cur[0]} y={cur[1]} press={press} />}
    <Card x={1110} y={170} w={720} h={600} c={YEL} p={pp(t, S(60) + 0.1)} title="ANALYSE DE LA COMPLEXITÉ" tc={YEL}>
      <T x={40} y={120} s={24} c={DIM} f="InterX" anchor="start">exemple</T><T x={480} y={120} s={24} c={DIM} f="InterX">temps</T><T x={630} y={120} s={24} c={DIM} f="InterX">espace</T>
      {ANA.map(([a, b, c, si], i) => <g key={a} opacity={k(t, S(si) + 0.3 + (i ? (i - 1) * 0.9 : 0), 0.3)}><T x={40} y={200 + i * 100} s={28} c={W} f="InterX" anchor="start">{a}</T>
        <T x={480} y={200 + i * 100} s={34} c={i === 1 ? RED : YEL} f={KM}>{b}</T><T x={630} y={200 + i * 100} s={28} c={W} f={KM}>{c}</T></g>)}</Card>
  </>; };

/* ---------- CHAPITRE 7 ---------- */
const AdvLim = (t: number) => { const c0 = S(62) + 1.9;
  return <>
    <Card x={130} y={110} w={790} h={780} c={GRN} p={pp(t, c0)} title="AVANTAGES" tc={GRN}>
      <Tape x={200} y={210} cells={["1", "0", "1"]} cw={110} ends={false} p={k(t, c0 + 0.3, 0.5)} /><HeadBox x={cxOf(200, 1, 110)} y={210} cw={110} sc={pp(t, c0 + 0.5)} />
      {["simple : quelques règles", "représente tout algorithme", "raisonnement rigoureux"].map((x, i) => { const at = mid(62, 0.35 + i * 0.18);
        return <g key={x}><Tick x={90} y={410 + i * 110} ok sc={pp(t, at)} s={1.1} /><T x={140} y={410 + i * 110} s={38} c={W} f="InterX" anchor="start" sc={pp(t, at)}>{x}</T></g>; })}</Card>
    <Card x={1000} y={110} w={790} h={780} c={RED} p={pp(t, S(63) + 0.1)} title="LIMITES THÉORIQUES" tc={RED}>
      <g transform="translate(395 250)" opacity={k(t, mid(63, 0.2))}><circle r={56} fill="none" stroke={RED} strokeWidth={6} strokeDasharray="250 90" transform={`rotate(${t * 200})`} /><T x={0} y={2} s={54} c={RED} f={KM}>∞</T></g>
      <Tick x={90} y={400} ok={false} sc={pp(t, mid(63, 0.25))} s={1.1} /><T x={140} y={400} s={36} c={W} f="InterX" anchor="start" sc={pp(t, mid(63, 0.25))}>problèmes indécidables</T>
      <Draw d="M120 690 Q380 680 450 560 T560 480" p={k(t, mid(63, 0.6), 0.6)} c={RED} w={6} /><T x={600} y={480} s={34} c={RED} f={KM} sc={pp(t, mid(63, 0.7))}>{sup("2", "n")}</T>
      <Tick x={90} y={540} ok={false} sc={pp(t, mid(63, 0.55))} s={1.1} /><T x={140} y={540} s={34} c={W} f="InterX" anchor="start" sc={pp(t, mid(63, 0.55))}>le difficile reste difficile</T></Card>
  </>; };
const VsPC = (t: number) => { const hop = bounce(Math.max(0, t - S(64) - 0.5), 0.45, 0, 6), jump = k(t, mid(64, 0.75), 0.5);
  return <>
    <T x={500} y={130} s={50} c={W} sc={pp(t, S(64) + 0.1)}>MACHINE DE TURING</T><T x={1420} y={130} s={50} c={W} sc={pp(t, mid(64, 0.4))}>ORDINATEUR RÉEL</T>
    <T x={960} y={450} s={60} c={DIM} sc={pp(t, mid(64, 0.4))}>VS</T>
    <Tape x={110} y={430} cells={["1", "0", "1", "1", "0", "1", "0"]} cw={92} p={k(t, S(64) + 0.2, 0.7)} hl={{ [Math.round(hop)]: YEL }} />
    <HeadBox x={cxOf(110, hop, 92)} y={430} cw={92} sc={pp(t, S(64) + 0.5)} />
    <Chip x={440} y={600} text="bande INFINIE" c={SOFT} sc={pp(t, mid(64, 0.1))} s={34} /><Chip x={440} y={690} text="case par case" c={SOFT} sc={pp(t, mid(64, 0.62))} s={34} />
    <g transform={`translate(1420 400) scale(${pp(t, mid(64, 0.35))})`}><rect x={-300} y={-110} width={600} height={220} rx={16} fill="#163a24" stroke={GRN} strokeWidth={5} />
      {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={-270 + i * 92} y={-78} width={72} height={120} rx={8} fill="#0d0e15" />)}
      {Array.from({ length: 18 }).map((_, i) => <rect key={`p${i}`} x={-284 + i * 32} y={110} width={16} height={26} fill={YEL} />)}<T x={0} y={74} s={30} c={W}>16 Go</T></g>
    <Chip x={1420} y={600} text="mémoire FINIE" c={SOFT} sc={pp(t, mid(64, 0.42))} s={34} />
    <g opacity={k(t, mid(64, 0.68), 0.3)}>{[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={1180 + i * 100} y={740} width={90} height={60} rx={8} fill={i === 4 && jump > 0.9 ? YEL + "44" : PANEL} stroke={i === 4 && jump > 0.9 ? YEL : LINE} strokeWidth={3} />
      <T x={1225 + i * 100} y={770} s={20} c={DIM} f="InterX">{["0", "1", "2", "…", "4096"][i]}</T></g>)}
      <Draw d="M1240 860 Q1420 980 1625 810" p={jump} c={YEL} w={5} /><Head x={1625} y={810} p={jump} c={YEL} a={-60} s={0.6} /><T x={1420} y={990} s={30} c={YEL} f="InterX">accès direct à n’importe quelle adresse</T></g>
  </>; };
const INF: [number, number, string, number][] = [[380, 240, "programme enregistré", 0.08], [1540, 240, "langages Turing-complets", 0.25], [380, 800, "compilateurs", 0.42], [1540, 800, "une machine peut-elle penser ?", 0.6]];
const Influence = (t: number) => <>
  <g transform={`translate(960 520) scale(${pp(t, S(65) + 0.1)})`}><circle r={170} fill={PANEL} stroke={YEL} strokeWidth={5} style={{ filter: `drop-shadow(0 0 24px ${YEL}55)` }} />
    <Tape x={-150} y={20} cells={["1", "0", "1"]} cw={100} ends={false} p={1} /><HeadBox x={-50 + 50} y={20} cw={100} sc={1} /></g>
  {INF.map(([x, y, l, f], i) => { const at = mid(65, f);
    return <g key={l} opacity={1 - 0.5 * k(t, S(66), 0.5)}><Draw d={`M${960 + (x - 960) * 0.2} ${520 + (y - 520) * 0.4} L${x + (960 - x) * 0.25} ${y + (520 - y) * 0.2}`} p={k(t, at, 0.4)} c={LINE} w={3} dash="10 10" />
      {i === 0 && <CpuMem x={x} y={y - 20} s={0.65} sc={pp(t, at)} />}{i === 1 && <T x={x} y={y - 30} s={80} c={W} f={KM} sc={pp(t, at)}>{"{ }"}</T>}{i === 2 && <Gear x={x} y={y - 30} r={44} a={t * 50} c={DIM} />}{i === 3 && <Bulb x={x} y={y - 40} sc={pp(t, at) * 0.8} on={1} />}
      <Chip x={x} y={y + 70} text={l} c={SOFT} sc={pp(t, at + 0.1)} s={30} /></g>; })}
  <T x={1540} y={940} s={24} c={DIM} f="InterX" sc={pp(t, mid(65, 0.7)) * (1 - k(t, S(66), 0.4))}>le test de Turing, 1950</T>
  {([[960, 230, "calculabilité"], [960, 330, "classes de complexité"], [960, 830, "calcul quantique"]] as [number, number, string][]).map(([x, y, l], i) => <Chip key={l} x={x} y={y} text={l} c={YEL} fg="#14101f" sc={pp(t, mid(66, 0.2 + i * 0.22))} s={34} />)}
  <T x={960} y={140} s={36} c={W} sc={pp(t, S(66) + 0.1)}>LA RÉFÉRENCE EN RECHERCHE</T>
  <g transform={`translate(960 940) scale(${pp(t, mid(66, 0.7))})`}><circle r={46} fill="none" stroke={YEL} strokeWidth={4} /><ellipse rx={46} ry={14} fill="none" stroke={YEL} strokeWidth={2} /><path d={`M0 0 L${30 * Math.cos(t * 2)} ${-30 + 6 * Math.sin(t * 2)}`} stroke={W} strokeWidth={4} /></g>
</>;

/* ---------- CONCLUSION ---------- */
const Concl = (t: number) => { const c0 = S(67) + 1.9, fin = k(t, mid(70, 0.55), 0.8);
  return <>
    <g opacity={1 - fin}>
      {([["la bande", 0], ["la tête", 1], ["les états", 2], ["la transition δ", 3]] as [string, number][]).map(([l, i]) => { const x = 330 + i * 420, at = c0 + 0.2 + i * 0.45;
        return <g key={l}>{i === 0 && <Tape x={x - 150} y={230} cells={["1", "0", "1"]} cw={100} ends={false} p={k(t, at, 0.4)} />}{i === 1 && <HeadBox x={x} y={290} sc={pp(t, at)} st={sub("q", "1")} />}
          {i === 2 && <><St x={x - 60} y={230} l={sub("q", "0")} r={40} sc={pp(t, at)} /><St x={x + 60} y={230} l="acc" ls={20} r={40} acc c={GRN} sc={pp(t, at + 0.1)} /></>}{i === 3 && <T x={x} y={230} s={90} c={YEL} f={KM} sc={pp(t, at)}>δ</T>}
          <T x={x} y={330} s={30} c={W} f="InterX" sc={pp(t, at + 0.2)}>{l}</T></g>; })}
      <T x={960} y={430} s={44} c={W} f="InterX" sc={pp(t, mid(67, 0.7))}>même puissance <tspan fill={YEL}>≠</tspan> même efficacité</T>
      <Card x={310} y={520} w={1300} h={170} c={YEL} p={pp(t, S(68) + 0.2)}><T x={650} y={60} s={30} c={DIM} f="InterX">réponse à la problématique</T>
        <T x={650} y={118} s={42} c={W} f="InterX">Ce qu’elle ne peut pas faire, aucun ordinateur ne le peut.</T></Card>
      <T x={700} y={810} s={80} c={W} f={KM} sc={pp(t, S(69) + 0.4)}>P ⊆ NP</T><T x={1240} y={810} s={80} c={YEL} sc={pp(t, mid(69, 0.7))} glow={YEL}>P = NP ?</T>
      <Chip x={960} y={960} text="question ouverte depuis 1971 · plus de 50 ans" c={SOFT} sc={pp(t, S(70) + 0.3)} s={32} /></g>
    {fin > 0 && <g opacity={fin}><T x={960} y={330} s={120} c={W} glow={BLUE}>LA MACHINE DE TURING</T><Squig x={960} y={412} w={860} p={k(t, mid(70, 0.7), 0.5)} c={YEL} />
      <Tape x={685} y={600} cells={["1", "0", "1", "1", "0"]} cw={110} p={1} hl={{ [Math.round(bounce(t, 0.6, 0, 4))]: YEL }} /><HeadBox x={cxOf(685, bounce(t, 0.6, 0, 4), 110)} y={600} cw={110} sc={1} />
      <T x={960} y={760} s={36} c={DIM} f="InterX">une bande · une tête · quelques règles</T></g>}
  </>; };

type Scene = { a: number; r: (t: number) => React.ReactNode; cam: Key[] };
const st0 = (i: number) => (i === 0 ? 0 : S(i) - 0.35);
const SCENES: Scene[] = [
  { a: 0, r: Hook, cam: [[0, 960, 540, 1.15], [S(1), 960, 440, 1.0], [S(2) + 0.5, 760, 560, 1.1], [E(2), 760, 560, 1.12]] },
  { a: st0(3), r: Plan, cam: [[S(3), 960, 230, 1.25], [E(3), 960, 260, 1.2], [S(4) + 0.4, 960, 520, 1.15], [E(4), 960, 540, 1.1], [S(5) + 0.4, 960, 780, 1.12], [E(5), 960, 560, 1.0]] },
  { a: st0(6), r: Bio, cam: [[S(6), 700, 560, 1.0], [S(6) + 1.9, 640, 540, 1.1], [E(6), 660, 540, 1.12], [S(7) + 0.5, 1200, 560, 1.1], [mid(7, 0.7), 1250, 700, 1.1], [E(7), 1100, 760, 1.05]] },
  { a: st0(8), r: Hilbert, cam: [[S(8), 600, 520, 1.15], [mid(8, 0.4), 700, 400, 1.15], [E(8), 760, 420, 1.12], [S(9) + 0.4, 1250, 560, 1.12], [E(9), 1150, 600, 1.05]] },
  { a: st0(10), r: DefWhy, cam: [[S(10), 960, 220, 1.2], [mid(10, 0.5), 1350, 520, 1.15], [E(10), 1350, 560, 1.15], [S(11) + 0.4, 600, 600, 1.12], [E(11), 900, 580, 1.0]] },
  { a: st0(12), r: Legacy, cam: [[S(12), 960, 230, 1.15], [E(12), 1100, 300, 1.12], [S(13) + 0.3, 960, 700, 1.1], [E(13), 960, 760, 1.08]] },
  { a: st0(14), r: Parts, cam: [[S(14), 960, 540, 1.0], [S(15) + 0.3, 960, 330, 1.25], [E(15), 960, 330, 1.25], [S(16) + 0.3, 760, 300, 1.3], [E(16), 800, 330, 1.3], [S(17) + 0.4, 420, 720, 1.3], [E(17), 440, 720, 1.3], [S(18) + 0.4, 960, 740, 1.35], [E(18), 960, 740, 1.35], [S(19) + 0.4, 1500, 740, 1.3], [E(19) - 0.5, 1450, 720, 1.25], [E(19), 960, 540, 1.0]] },
  { a: st0(20), r: Formal, cam: [[S(20), 960, 220, 1.3], [E(20), 1000, 240, 1.3], [S(21) + 0.3, 960, 480, 1.25], [E(21), 960, 490, 1.25], [S(22) + 0.3, 960, 760, 1.25], [E(22), 960, 620, 1.0]] },
  { a: st0(23), r: Run, cam: [[S(23), 960, 460, 1.25], [E(23), 960, 470, 1.25], [S(24) + 0.3, 960, 260, 1.2], [E(24), 960, 280, 1.2], [S(25) + 0.3, 480, 780, 1.3], [E(25), 480, 780, 1.3], [S(26) + 0.3, 1390, 780, 1.3], [E(26), 1390, 780, 1.3], [S(27) + 0.3, 960, 400, 1.15], [E(27), 960, 440, 1.15]] },
  { a: st0(28), r: Det, cam: [[S(28), 960, 540, 1.0], [S(28) + 1.9, 510, 520, 1.25], [E(28), 510, 560, 1.25], [S(29) + 0.3, 1410, 520, 1.2], [E(29), 1300, 540, 1.05]] },
  { a: st0(30), r: Variants, cam: [[S(30), 510, 320, 1.3], [E(30), 520, 320, 1.3], [S(31) + 0.3, 1410, 320, 1.3], [E(31), 1400, 320, 1.3], [S(32) + 0.3, 960, 790, 1.25], [E(32), 960, 600, 1.0]] },
  { a: st0(33), r: Compare, cam: [[S(33), 680, 490, 1.15], [E(33), 700, 490, 1.15], [S(34) + 0.3, 1450, 540, 1.2], [E(34), 1300, 540, 1.05]] },
  { a: st0(35), r: Calc, cam: [[S(35), 960, 540, 1.0], [S(35) + 1.9, 510, 260, 1.3], [E(35), 510, 270, 1.3], [S(36) + 0.3, 510, 690, 1.3], [E(36), 510, 690, 1.3], [S(37) + 0.3, 1400, 400, 1.25], [E(37), 1400, 420, 1.25], [S(38) + 0.3, 1400, 860, 1.3], [E(38), 1100, 640, 1.0]] },
  { a: st0(39), r: Halt, cam: [[S(39), 620, 260, 1.25], [E(39), 700, 260, 1.15], [S(40) + 0.2, 760, 600, 1.05], [mid(40, 0.4), 1380, 560, 1.15], [mid(40, 0.85), 1200, 400, 1.05], [mid(40, 0.95), 640, 620, 1.15], [S(41) + 0.3, 960, 500, 1.05], [E(41), 960, 520, 1.0]] },
  { a: st0(42), r: Measure, cam: [[S(42), 960, 300, 1.0], [S(42) + 1.9, 960, 140, 1.25], [E(42), 960, 160, 1.2], [S(43) + 0.3, 760, 420, 1.3], [E(43), 760, 430, 1.3], [S(44) + 0.3, 760, 520, 1.2], [E(44), 800, 520, 1.2], [S(45) + 0.3, 1100, 520, 1.2], [E(45), 1100, 520, 1.2], [S(46) + 0.3, 960, 900, 1.2], [E(46), 960, 640, 1.0]] },
  { a: st0(47), r: Classes, cam: [[S(47), 640, 700, 1.4], [E(47), 660, 700, 1.4], [S(48) + 0.3, 800, 650, 1.2], [E(48), 820, 650, 1.2], [S(49) + 0.3, 960, 600, 1.05], [E(49), 960, 540, 1.0]] },
  { a: st0(50), r: PvsNP, cam: [[S(50), 500, 520, 1.2], [mid(50, 0.75), 500, 600, 1.2], [S(51) + 0.2, 1420, 520, 1.2], [E(51), 1300, 560, 1.05]] },
  { a: st0(52), r: Reduce, cam: [[S(52), 900, 260, 1.15], [mid(52, 0.45), 960, 280, 1.1], [mid(52, 0.55), 620, 720, 1.2], [E(52), 640, 720, 1.2], [S(53) + 0.3, 1500, 720, 1.25], [E(53), 1200, 560, 1.0]] },
  { a: st0(54), r: Even, cam: [[S(54), 960, 540, 1.0], [S(54) + 1.9, 520, 330, 1.3], [E(54), 520, 340, 1.3], [S(55) + 0.3, 1370, 360, 1.3], [E(55), 1370, 380, 1.3], [S(56) + 0.3, 1000, 680, 1.1], [E(56), 1000, 680, 1.1]] },
  { a: st0(57), r: PalAdd, cam: [[S(57), 960, 300, 1.25], [E(57), 960, 330, 1.25], [S(58) + 0.3, 960, 780, 1.25], [E(58), 960, 760, 1.2]] },
  { a: st0(59), r: Sim, cam: [[S(59), 580, 500, 1.15], [E(59), 600, 500, 1.15], [S(60) + 0.3, 1470, 440, 1.25], [E(61), 1400, 500, 1.15]] },
  { a: st0(62), r: AdvLim, cam: [[S(62), 960, 540, 1.0], [S(62) + 1.9, 520, 500, 1.15], [E(62), 520, 520, 1.15], [S(63) + 0.3, 1400, 500, 1.15], [E(63), 1300, 520, 1.05]] },
  { a: st0(64), r: VsPC, cam: [[S(64), 500, 480, 1.2], [mid(64, 0.4), 520, 480, 1.2], [mid(64, 0.5), 1420, 520, 1.2], [E(64), 1300, 560, 1.05]] },
  { a: st0(65), r: Influence, cam: [[S(65), 960, 520, 1.0], [E(65), 960, 520, 1.03], [S(66) + 0.3, 960, 560, 1.1], [E(66), 960, 560, 1.05]] },
  { a: st0(67), r: Concl, cam: [[S(67), 960, 540, 1.0], [S(67) + 1.9, 960, 300, 1.2], [E(67), 960, 320, 1.2], [S(68) + 0.3, 960, 600, 1.2], [E(68), 960, 600, 1.2], [S(69) + 0.3, 960, 800, 1.2], [E(69), 960, 820, 1.2], [S(70) + 0.3, 960, 900, 1.15], [mid(70, 0.55), 960, 540, 1.0], [TM.total, 960, 540, 1.04]] },
];
const CHAPS: [number, string, string][] = [[0, "INTRODUCTION", ""], [6, "CHAPITRE 1", "Généralités et historique"], [14, "CHAPITRE 2", "Structure et fonctionnement"], [28, "CHAPITRE 3", "Les différents types de machines"],
  [35, "CHAPITRE 4", "Machine de Turing et calculabilité"], [42, "CHAPITRE 5", "Machine de Turing et complexité"], [54, "CHAPITRE 6", "Applications et exemples pratiques"], [62, "CHAPITRE 7", "Avantages, limites et perspectives"], [67, "CONCLUSION", "Conclusion générale"]];

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
        <div style={{ position: "absolute", width: 1400, height: 1400, left: -520 + Math.sin(t * 0.3) * 80 - (cx - 960) * 0.12, top: -800, borderRadius: "50%", background: "radial-gradient(circle, rgba(70,110,255,0.24), transparent 62%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 1300, height: 1300, right: -560 + Math.cos(t * 0.25) * 80 + (cx - 960) * 0.12, bottom: -820, borderRadius: "50%", background: "radial-gradient(circle, rgba(70,110,255,0.16), transparent 62%)", filter: "blur(40px)" }} />
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
export const TuringEdit: React.FC = () => {
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
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [TURING_FRAMES - 20, TURING_FRAMES - 1], [0, 1], clamp) }} />
      {AUDIO ? <Audio src={staticFile("turing/mix.m4a")} /> : null}
    </AbsoluteFill>
  );
};
const AUDIO = true;
