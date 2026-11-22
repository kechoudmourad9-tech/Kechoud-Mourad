// Face-cam montage « la probabilité du jeton pirate »: pauses and the false start cut, animations full screen, the speaker only on key moments.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { Mark, Squig } from "../cx/clips";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
import KEEP from "./keep.json";
import CAPS from "./caps.json";
// restrained palette: white drawings, gold/yellow accent (the token), red = wrong, green = right
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
/** a line of text appearing letter by letter */
const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * sat(p)));
const Bracket: React.FC<{ x1: number; x2: number; y: number; p: number; label?: React.ReactNode; c?: string }> = ({ x1, x2, y, p, label, c = YEL }) => <>
  <Draw d={`M${x1} ${y - 16} Q${x1} ${y} ${x1 + 20} ${y} H${(x1 + x2) / 2 - 16} Q${(x1 + x2) / 2} ${y} ${(x1 + x2) / 2} ${y + 16} Q${(x1 + x2) / 2} ${y} ${(x1 + x2) / 2 + 16} ${y} H${x2 - 20} Q${x2} ${y} ${x2} ${y - 16}`} p={p} c={c} w={4} />
  {label ? <T x={(x1 + x2) / 2} y={y + 48} s={34} c={c} f={KM} sc={sat((p - 0.5) * 2)}>{label}</T> : null}</>;
/* ================= scenes, keyed on the ORIGINAL take's timestamps (seconds) ================= */
const KC = "KaTeX_Caligraphic";
const PCT = (n: number) => 1 - Math.pow(1 - 1 / 137500, n);
const Jeton: React.FC<{ x: number; y: number; r?: number; sc?: number; rot?: number; glow?: number }> = ({ x, y, r = 120, sc = 1, rot = 0, glow = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${(sc * r) / 150})`}>
    {glow > 0 && <circle r={170} fill={YEL} opacity={0.22 * glow} style={{ filter: "blur(18px)" }} />}
    <image href={staticFile("mont3/jeton.jpg")} x={-292} y={-168} width={588} height={330} clipPath="url(#jclip)" /></g>);
const Chest: React.FC<{ x: number; y: number; s?: number; sc?: number; open?: number }> = ({ x, y, s = 1, sc = 1, open = 0 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s * sc})`}>
    <rect x={-62} y={-8} width={124} height={66} rx={8} fill="#8a5527" stroke="#2e1a0b" strokeWidth={5} /><rect x={-62} y={22} width={124} height={8} fill="#e2b23c" opacity={0.85} />
    <g transform={`translate(0 ${-open * 16}) rotate(${-open * 18} 62 -8)`}><path d="M-62 -8 V-30 Q-62 -54 0 -54 Q62 -54 62 -30 V-8 Z" fill="#a8672e" stroke="#2e1a0b" strokeWidth={5} /><rect x={-62} y={-22} width={124} height={9} fill="#e2b23c" /></g>
    <rect x={-9} y={-16} width={18} height={24} rx={3} fill="#e2b23c" stroke="#2e1a0b" strokeWidth={3} /></g>);
const Bar: React.FC<{ x: number; y: number; w: number; c?: string }> = ({ x, y, w, c = W }) => <line x1={x - w / 2} x2={x + w / 2} y1={y} y2={y} stroke={c} strokeWidth={4} strokeLinecap="round" />;
/** J with an overline (the complement) */
const Jb: React.FC<{ x: number; y: number; s: number; c?: string; sc?: number }> = ({ x, y, s, c = W, sc = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><T x={0} y={0} s={s} c={c} f={KI} it>J</T><Bar x={s * 0.05} y={-s * 0.55} w={s * 0.62} c={c} /></g>);
const Frac: React.FC<{ x: number; y: number; n: string; d: string; s: number; c?: string; sc?: number }> = ({ x, y, n, d, s, c = W, sc = 1 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><T x={0} y={-s * 0.55} s={s} c={c} f={KM}>{n}</T><Bar x={0} y={0} w={Math.max(n.length, d.length) * s * 0.55} c={c} /><T x={0} y={s * 0.6} s={s} c={c} f={KM}>{d}</T></g>);
const Stamp: React.FC<{ x: number; y: number; text: string; sc: number; c?: string; rot?: number; s?: number }> = ({ x, y, text, sc, c = RED, rot = -8, s = 90 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}><rect x={-text.length * s * 0.3 - 30} y={-s * 0.7} width={text.length * s * 0.6 + 60} height={s * 1.4} rx={16} fill="none" stroke={c} strokeWidth={9} /><T x={0} y={3} s={s} c={c}>{text}</T></g>);
const PlayIcon: React.FC<{ x: number; y: number; sc: number }> = ({ x, y, sc }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-90} y={-62} width={180} height={124} rx={34} fill={SOFT} stroke={W} strokeWidth={5} /><path d="M-24 -34 L40 0 L-24 34 Z" fill={W} /></g>);

/* 1 — « la proba augmente ? » */
const Aug = (t: number) => <>
  {[0, 1, 2].map((i) => <Person key={i} x={260 + i * 280} y={840} s={1.1} ink={W} col={[BLUE, "#5a6b8c", "#3a4256"][i]} label="" t={t + i} skin={["#f2c29b", "#c98a5e", "#8d5a3b"][i]} hair={["#2b1a10", "#1d1420", "#c9a227"][i]} sc={pp(t, 15.9 + i * 0.15)} wave={t > 16.4 && t < 18 ? 0.5 + Math.sin(t * 9 + i) * 0.3 : 0} />)}
  {[0, 1, 2].map((i) => <g key={`b${i}`} transform={`translate(${260 + i * 280} 470) scale(${pp(t, 16.5 + i * 0.2)})`}><rect x={-120} y={-44} width={240} height={88} rx={30} fill={W} /><path d="M-20 40 L0 76 L24 40 Z" fill={W} /><T x={0} y={2} s={30} c="#14101f" f="InterX">ça augmente !</T></g>)}
  <T x={540} y={150} s={84} c={W} sc={pp(t, 14.3)}>POURQUOI ON DIT</T><T x={540} y={250} s={84} c={YEL} sc={pp(t, 17.2)}>« ÇA AUGMENTE » ?</T>
  <Stamp x={540} y={1060} text="MAL EXPLIQUÉ" sc={pp(t, 18.8)} />
</>;
/* 2 — 2, 100, 1000 chests: always 1 / 137 500 */
const Same = (t: number) => { const n = t < 23.8 ? 2 : t < 24.8 ? 100 : 1000, grid = n === 2 ? 2 : n === 100 ? 100 : 400, cols = n === 2 ? 2 : n === 100 ? 10 : 20, cs = n === 2 ? 1.6 : n === 100 ? 0.5 : 0.26, gap = n === 2 ? 300 : n === 100 ? 72 : 37;
  return <>
    <T x={540} y={120} s={44} c={DIM} f="InterX" sc={pp(t, 21.2)}>tu peux ouvrir…</T>
    <T x={540} y={220} s={110} c={W} sc={t >= 23.2 ? pp(t, n === 2 ? 23.2 : n === 100 ? 23.8 : 24.8) : 0}>{n === 1000 ? "1 000" : n} COFFRES</T>
    <g opacity={t >= 23.2 ? 1 : 0} key={n}>{Array.from({ length: grid }).map((_, i) => { const c = i % cols, r = Math.floor(i / cols), x = 540 + (c - (cols - 1) / 2) * gap, y = (n === 2 ? 520 : 330) + r * gap * 0.82;
      return <Chest key={i} x={x} y={y} s={cs} sc={pp(t, (n === 2 ? 23.2 : n === 100 ? 23.8 : 24.8) + (i % 37) * 0.006)} />; })}</g>
    <Chip x={540} y={830} text="chaque coffre : la même chance" c={SOFT} sc={pp(t, 26.3)} s={40} />
    <g transform={`translate(540 1030) scale(${pp(t, 28.6)})`}><rect x={-330} y={-120} width={660} height={240} rx={34} fill={PANEL} stroke={YEL} strokeWidth={5} style={{ filter: `drop-shadow(0 0 22px ${YEL}55)` }} />
      <Jeton x={-210} y={0} r={88} sc={1} rot={Math.sin(t * 2) * 6} glow={0.6} /><Frac x={90} y={0} n="1" d="137 500" s={74} c={YEL} /></g>
    <Mark x={630} y={1030} rx={230} ry={140} p={k(t, 29.7, 0.5)} c={YEL} w={7} seed={2} />
  </>; };
/* 3 — the probability space */
const Space = (t: number) => <>
  <T x={540} y={240} s={74} c={W} sc={pp(t, 32.4)}>POUR DÉFINIR UNE PROBA</T><T x={540} y={340} s={44} c={DIM} f="InterX" sc={pp(t, 34.2)}>il faut un espace de probabilité</T>
  <g transform="translate(540 640)">
    <T x={-390} y={0} s={150} c={DIM} f={KM} sc={pp(t, 35.1)}>(</T><T x={390} y={0} s={150} c={DIM} f={KM} sc={pp(t, 35.1)}>)</T>
    <T x={-250} y={0} s={130} c={YEL} f={KM} sc={pp(t, 36.4)}>Ω</T><T x={-125} y={20} s={110} c={DIM} f={KM} sc={pp(t, 36.4)}>,</T>
    <T x={0} y={0} s={130} c={YEL} f={KC} sc={pp(t, 36.9)}>A</T><T x={125} y={20} s={110} c={DIM} f={KM} sc={pp(t, 36.9)}>,</T>
    <T x={250} y={0} s={130} c={YEL} f={KI} it sc={pp(t, 37.3)}>P</T>
    {[["l’univers", -260], ["les événements", 0], ["la probabilité", 260]].map(([l, x], i) => <T key={l as string} x={x as number} y={140} s={27} c={W} f="InterX" sc={pp(t, 37.6 + i * 0.4)}>{l as string}</T>)}</g>
</>;
/* 4 — Ω, J and J bar */
const Univ = (t: number) => { const jb = k(t, 55.4, 0.6);
  return <>
    <rect x={140} y={200} width={800} height={680} rx={30} fill={W} fillOpacity={0.04 + 0.08 * jb} stroke={W} strokeWidth={5} opacity={k(t, 46.3, 0.5)} />
    <T x={240} y={260} s={70} c={W} f={KM} sc={pp(t, 46.5)}>Ω</T><T x={540} y={950} s={40} c={W} f="InterX" sc={pp(t, 47.8)}>Ω : l’univers, tout ce qui peut arriver</T>
    <circle cx={820} cy={300} r={9} fill={YEL} opacity={k(t, 48.9)} style={{ filter: `drop-shadow(0 0 10px ${YEL})` }} />
    <g opacity={k(t, 49.4, 0.4)}><circle cx={820} cy={300} r={30} fill="none" stroke={YEL} strokeWidth={4} /><line x1={800} y1={322} x2={700} y2={420} stroke={YEL} strokeWidth={4} />
      <circle cx={600} cy={520} r={150} fill={PANEL} stroke={YEL} strokeWidth={5} /><Jeton x={600} y={500} r={80} sc={pp(t, 50.9)} glow={0.4} />
      <T x={600} y={610} s={40} c={YEL} f={KI} it sc={pp(t, 48.9)}>J</T></g>
    <T x={540} y={1030} s={36} c={YEL} f="InterX" sc={pp(t, 50.0)}>J : avoir le jeton</T>
    <g transform={`translate(330 780) scale(${pp(t, 52.0)})`}><T x={0} y={0} s={52} c={YEL} f={KI} it>P(J)</T></g>
    <g opacity={jb}><Jb x={300} y={460} s={70} /><T x={540} y={1100} s={36} c={W} f="InterX">J̄ : ne pas avoir le jeton</T></g>
  </>; };
/* 5 — the complement */
const Comp = (t: number) => <>
  <g transform="translate(140 220)"><T x={0} y={0} s={64} c={YEL} f={KI} it anchor="start" sc={pp(t, 60.2)}>P(J)</T><T x={180} y={0} s={64} c={W} f={KM} anchor="start" sc={pp(t, 61.4)}>=</T><Frac x={340} y={0} n="1" d="137 500" s={56} c={YEL} sc={pp(t, 61.6)} /></g>
  <g transform="translate(140 460)"><T x={0} y={0} s={64} c={W} f={KM} anchor="start" sc={pp(t, 63.4)}>P(</T><Jb x={96} y={0} s={64} sc={pp(t, 63.4)} /><T x={124} y={0} s={64} c={W} f={KM} anchor="start" sc={pp(t, 63.4)}>)</T>
    <T x={180} y={0} s={64} c={W} f={KM} anchor="start" sc={pp(t, 65.6)}>=  1  −</T><Frac x={500} y={0} n="1" d="137 500" s={56} sc={pp(t, 66.6)} /></g>
  <g transform="translate(140 720)"><T x={180} y={0} s={64} c={W} f={KM} anchor="start" sc={pp(t, 68.8)}>=</T><Frac x={420} y={0} n="137 499" d="137 500" s={62} c={GRN} sc={pp(t, 69.1)} /></g>
  <Chip x={540} y={920} text="≈ 99,9993 %" c={SOFT} sc={pp(t, 72.3)} s={44} />
  <g opacity={k(t, 73.3, 0.3)}><Tick x={330} y={1070} ok sc={pp(t, 73.3)} s={1.4} /><T x={380} y={1070} s={40} c={W} f="InterX" anchor="start">jusque-là, on est d’accord</T></g>
</>;
/* 6 — the σ-algebra 𝒜 = { J, J̄, Ω, ∅ } */
const TRB: [number, React.ReactNode, string, number][] = [[-330, "J", "avoir le jeton", 83.4], [-110, "Jb", "ne pas l’avoir", 86.2], [110, "Ω", "l’univers", 95.6], [330, "∅", "rien du tout", 99.9]];
const Tribu = (t: number) => { const out = k(t, 103.3, 0.5);
  return <>
    <T x={540} y={150} s={84} c={W} sc={pp(t, 76.4)}>LA TRIBU <tspan fontFamily={KC} fill={YEL}>A</tspan></T><T x={540} y={240} s={36} c={DIM} f="InterX" sc={pp(t, 78.3)}>tous les événements possibles</T>
    <g transform="translate(540 560)"><T x={-50} y={-190} s={110} c={YEL} f={KC} sc={pp(t, 81.9)}>A</T><T x={50} y={-190} s={90} c={W} f={KM} sc={pp(t, 81.9)}>=</T>
      <T x={-480} y={0} s={150} c={DIM} f={KM} sc={pp(t, 82.6)}>{"{"}</T><T x={480} y={0} s={150} c={DIM} f={KM} sc={pp(t, 82.6)}>{"}"}</T>
      {TRB.map(([x, s, l, at], i) => { const gone = i >= 2 ? out : 0;
        return <g key={i} opacity={1 - 0.6 * gone}>{s === "Jb" ? <Jb x={x} y={0} s={100} sc={pp(t, at)} /> : <T x={x} y={0} s={100} c={W} f={s === "J" ? KI : KM} it={s === "J"} sc={pp(t, at)}>{s}</T>}
          {i < 3 && <T x={x + 110} y={20} s={80} c={DIM} f={KM} sc={pp(t, at)}>,</T>}<T x={x} y={120} s={26} c={DIM} f="InterX" sc={pp(t, at + 0.3)}>{l}</T>
          {gone > 0 && <Draw d={`M${x - 70} 60 L${x + 70} -60`} p={gone} c={RED} w={9} />}</g>; })}</g>
    <Chip x={540} y={820} text="ce sont des événements, pas vraiment des probabilités" c={SOFT} sc={t > 89.6 && t < 102.4 ? pp(t, 89.8) : 0} s={30} />
    <Chip x={540} y={820} text="on les met de côté" c={RED} sc={pp(t, 103.4)} s={36} />
  </>; };
/* 7 — P : 𝒜 → [0 ; 1] */
const Map01 = (t: number) => { const x0 = 160, x1 = 920;
  return <>
    <g transform="translate(540 260)"><T x={-260} y={0} s={100} c={YEL} f={KI} it sc={pp(t, 108.8)}>P</T><T x={-180} y={0} s={90} c={W} f={KM} sc={pp(t, 109.4)}>:</T>
      <T x={-90} y={0} s={100} c={YEL} f={KC} sc={pp(t, 112.3)}>A</T><T x={40} y={0} s={90} c={W} f={KM} sc={pp(t, 112.6)}>→</T><T x={230} y={0} s={90} c={W} f={KM} sc={pp(t, 113.3)}>[0 ; 1]</T></g>
    <T x={540} y={400} s={36} c={DIM} f="InterX" sc={pp(t, 115.0)}>une probabilité est toujours entre 0 et 1</T>
    <Draw d={`M${x0} 660 H${x1}`} p={k(t, 115.7, 0.8)} c={W} w={6} />
    {[[x0, "0", 116.4], [x1, "1", 117.4]].map(([x, l, at]) => <g key={l as string}><line x1={x as number} x2={x as number} y1={640} y2={680} stroke={W} strokeWidth={5} opacity={k(t, at as number)} /><T x={x as number} y={730} s={48} c={W} f={KM} sc={pp(t, at as number)}>{l as string}</T></g>)}
    <circle cx={x0 + 2} cy={660} r={14 * pp(t, 118.9)} fill={YEL} /><Draw d={`M${x0 + 2} 640 Q${x0 + 40} 520 ${x0 + 140} 500`} p={k(t, 119.1, 0.4)} c={YEL} w={4} />
    <g opacity={k(t, 119.2)}><T x={x0 + 150} y={460} s={36} c={YEL} f={KI} it anchor="start">P(J)</T><T x={x0 + 150} y={510} s={30} c={YEL} f="InterX" anchor="start">≈ 0,0007 %</T></g>
    <circle cx={x1 - 2} cy={660} r={14 * pp(t, 118.9)} fill={GRN} /><g opacity={k(t, 119.2)}><T x={x1 - 120} y={810} s={30} c={GRN} f="InterX">≈ 99,9993 %</T></g>
  </>; };
/* 9 — two players */
const Players = (t: number) => { const nn = t < 130.1 ? "2" : t < 130.9 ? "10" : t < 131.7 ? "10 000" : "100 000", cards = k(t, 144.3, 0.5);
  return <>
    <g opacity={1 - 0.7 * cards}>
      <Person x={270} y={700} s={1.25} ink={W} col={BLUE} label="" t={t} skin="#c98a5e" hair="#1d1420" sc={pp(t, 128.6)} />
      <T x={270} y={300} s={30} c={DIM} f="InterX" sc={pp(t, 128.8)}>toi</T><T x={270} y={370} s={64} c={W} sc={t >= 129.5 ? pp(t, t < 130.1 ? 129.5 : t < 130.9 ? 130.1 : t < 131.7 ? 130.9 : 131.7) : 0}>{nn}</T><T x={270} y={425} s={28} c={DIM} f="InterX" sc={pp(t, 129.8)}>coffres</T>
      {Array.from({ length: 6 }).map((_, i) => <Chest key={i} x={150 + (i % 3) * 120} y={820 + Math.floor(i / 3) * 80} s={0.5} sc={pp(t, 129.6 + i * 0.25)} />)}
      <Chip x={270} y={1020} text="pas de jeton" c={RED} sc={pp(t, 133.2)} s={34} />
      <Person x={810} y={700} s={1.25} ink={W} col="#5a6b8c" label="" t={t + 1} skin="#f2c29b" hair="#c9a227" sc={pp(t, 134.0)} wave={t > 136.6 && t < 138.5 ? 0.6 + Math.sin(t * 9) * 0.3 : 0} />
      <T x={810} y={300} s={30} c={DIM} f="InterX" sc={pp(t, 134.2)}>un autre joueur</T><T x={810} y={370} s={64} c={W} sc={pp(t, 135.8)}>2</T><T x={810} y={425} s={28} c={DIM} f="InterX" sc={pp(t, 135.9)}>coffres</T>
      {[0, 1].map((i) => <Chest key={i} x={750 + i * 120} y={860} s={0.5} sc={pp(t, 135.9 + i * 0.2)} open={i === 1 ? k(t, 136.4, 0.3) : 0} />)}
      <Jeton x={870} y={760} r={60} sc={pp(t, 136.6)} rot={Math.sin(t * 3) * 10} />
      <Chip x={540} y={170} text="c’est le hasard, la chance" c={YEL} fg="#14101f" sc={pp(t, 138.8)} s={40} /></g>
    {cards > 0 && <>
      <Card x={80} y={330} w={920} h={260} c={GRN} p={pp(t, 144.3)}><T x={460} y={70} s={34} c={DIM} f="InterX">sur tous les coffres déjà ouverts</T><T x={460} y={150} s={52} c={GRN}>L’AVOIR DÉJÀ OBTENU</T><T x={460} y={215} s={32} c={W} f="InterX">augmente avec n</T></Card>
      <Card x={80} y={680} w={920} h={260} c={RED} p={pp(t, 146.3)}><T x={460} y={70} s={34} c={DIM} f="InterX">au prochain coffre</T><T x={460} y={150} s={52} c={RED}>L’OBTENIR</T><T x={460} y={215} s={32} c={W} f="InterX">toujours 1 / 137 500</T></Card>
      <T x={540} y={640} s={64} c={YEL} f={KM} sc={pp(t, 146.3)}>≠</T></>}
  </>; };
/* 10 — binomial law */
const Binom = (t: number) => <>
  <T x={540} y={140} s={84} c={W} sc={pp(t, 150.2)}>LOI BINOMIALE</T><Squig x={540} y={200} w={480} p={k(t, 150.8, 0.4)} c={YEL} />
  <T x={540} y={300} s={34} c={DIM} f="InterX" sc={pp(t, 153.4)}>ne pas avoir le jeton, sur 1 coffre :</T><Frac x={540} y={420} n="137 499" d="137 500" s={60} sc={pp(t, 156.1)} />
  <T x={540} y={590} s={34} c={DIM} f="InterX" sc={pp(t, 159.3)}>sur n coffres :</T>
  <g transform={`translate(540 700) scale(${pp(t, 161.5)})`}><T x={-250} y={0} s={110} c={W} f={KM}>(</T><Frac x={0} y={0} n="137 499" d="137 500" s={56} /><T x={250} y={0} s={110} c={W} f={KM}>)</T><T x={300} y={-60} s={56} c={YEL} f={KI} it>n</T></g>
  <T x={540} y={830} s={30} c={RED} f="InterX" sc={pp(t, 163.6)}>→ ne PAS avoir obtenu le jeton</T>
  <g transform={`translate(540 990) scale(${pp(t, 171.0)})`}><rect x={-420} y={-110} width={840} height={220} rx={30} fill={PANEL} stroke={GRN} strokeWidth={5} />
    <T x={-320} y={0} s={80} c={GRN} f={KM}>1 −</T><T x={-190} y={0} s={100} c={W} f={KM}>(</T><Frac x={40} y={0} n="137 499" d="137 500" s={50} /><T x={270} y={0} s={100} c={W} f={KM}>)</T><T x={318} y={-54} s={50} c={YEL} f={KI} it>n</T></g>
  <T x={540} y={1150} s={30} c={GRN} f="InterX" sc={pp(t, 166.7)}>→ l’AVOIR obtenu (au moins une fois)</T>
</>;
/* 11 — the curve */
const GX = (n: number) => 160 + (n / 150000) * 800, GY = (p: number) => 900 - p * 640;
const Curve = (t: number) => { let d = ""; for (let i = 0; i <= 80; i++) { const n = (i / 80) * 150000; d += `${i ? "L" : "M"}${GX(n)} ${GY(PCT(n))} `; }
  const m1 = k(t, 183.0, 0.4), m2 = k(t, 198.3, 0.4), bars = k(t, 199.6, 0.6);
  return <>
    <T x={540} y={120} s={44} c={W} sc={pp(t, 175.5)}>PLUS TU OUVRES DE COFFRES…</T><T x={540} y={190} s={36} c={YEL} f="InterX" sc={pp(t, 177.2)}>…plus ça augmente, un tout petit peu</T>
    <Axes ox={160} oy={900} w={820} h={660} p={k(t, 175.6, 0.6)} xl="n" />
    <T x={130} y={GY(1)} s={26} c={DIM} f={KM} anchor="end" sc={k(t, 175.8)}>100 %</T><T x={130} y={GY(0.5)} s={26} c={DIM} f={KM} anchor="end" sc={k(t, 175.8)}>50 %</T>
    {[50000, 100000, 150000].map((n) => <T key={n} x={GX(n)} y={945} s={24} c={DIM} f={KM} sc={k(t, 175.8)}>{n.toLocaleString("fr-FR")}</T>)}
    <Draw d={d} p={k(t, 176.4, 1.6)} c={GRN} w={7} glow />
    <g opacity={m1 * (1 - m2)}><circle cx={GX(2500)} cy={GY(PCT(2500))} r={12} fill={YEL} /><Draw d={`M${GX(2500)} ${GY(PCT(2500)) - 14} L${GX(2500) + 90} 560`} p={m1} c={YEL} w={4} />
      <T x={GX(2500) + 100} y={520} s={34} c={YEL} f="InterX" anchor="start">2 500 coffres</T><T x={GX(2500) + 100} y={570} s={44} c={YEL} f={KM} anchor="start">≈ 1,8 % de l’avoir eu</T></g>
    <Chip x={540} y={1060} text="le prochain coffre : toujours 1 / 137 500" c={RED} sc={t > 188.2 && t < 198 ? pp(t, 188.4) : 0} s={34} />
    <g opacity={m2}><circle cx={GX(50000)} cy={GY(PCT(50000))} r={14} fill={W} /><Draw d={`M${GX(50000)} ${GY(PCT(50000))} V900`} p={m2} c={W} w={3} dash="10 10" /><T x={GX(50000)} y={GY(PCT(50000)) - 40} s={34} c={W} f="InterX">50 000 coffres</T></g>
    <g opacity={bars} transform="translate(-370 -40)"><rect x={560} y={330} width={380} height={300} rx={20} fill={PANEL} stroke={LINE} strokeOpacity={0.4} strokeWidth={3} />
      <rect x={600} y={400} width={300 * 0.695 * bars} height={50} rx={10} fill={RED} /><T x={600} y={380} s={26} c={W} f="InterX" anchor="start">pas eu : 69,5 %</T>
      <rect x={600} y={520} width={300 * 0.305 * k(t, 202.4, 0.6)} height={50} rx={10} fill={GRN} /><T x={600} y={500} s={26} c={W} f="InterX" anchor="start" sc={k(t, 202.4)}>eu : 30,5 %</T>
      <Mark x={704} y={425} rx={150} ry={46} p={k(t, 206.2, 0.5)} c={YEL} w={6} seed={7} /></g>
  </>; };

/* overlays on the speaker (screen coordinates 1080 x 1920) */
const FaceOver = (t: number) => <>
  {t < 7.2 && <><Jeton x={540} y={1180} r={170} sc={pp(t, 4.2)} rot={Math.sin(t * 2.4) * 8} /><Chip x={540} y={1400} text="LE JETON PIRATE" c={YEL} fg="#14101f" sc={pp(t, 5.6)} s={52} /></>}
  {t >= 7.2 && t < 14.1 && <><Chip x={540} y={1220} text="LA VRAIE PROBABILITÉ" c={YEL} fg="#14101f" sc={pp(t, 9.9)} s={56} /><Chip x={540} y={1320} text="comment marche le système" c={SOFT} sc={pp(t, 12.9)} s={40} /></>}
  {t >= 119 && t < 128.5 && <><g transform={`translate(540 1200) scale(${pp(t, 123.2) * (1 - k(t, 127.6, 0.2))})`}><rect x={-330} y={-60} width={660} height={120} rx={40} fill={W} /><T x={0} y={2} s={44} c="#14101f" f="InterX">« plus de coffres = plus de chances »</T></g>
    <Stamp x={540} y={1200} text="FAUX" sc={pp(t, 127.8)} s={130} /></>}
  {t >= 208.4 && t < 216.5 && <><Stamp x={540} y={1180} text="PIÈGE" sc={t < 215.3 ? pp(t, 214.0) : 0} s={110} c={YEL} rot={6} /><Stamp x={540} y={1180} text="FAKE" sc={pp(t, 215.3)} s={130} /></>}
  {t >= 216 && t < 220.1 && <><PlayIcon x={540} y={1150} sc={pp(t, 216.2)} /><Chip x={540} y={1310} text="expliquez mieux !" c={YEL} fg="#14101f" sc={pp(t, 218.6)} s={46} /></>}
  {t >= 220.1 && t < 226.8 && <>{[0, 1, 2].map((i) => <g key={i} transform={`translate(${300 + i * 240} 1180) rotate(${(i - 1) * 6})`}><PlayIcon x={0} y={0} sc={pp(t, 220.8 + i * 0.4) * 0.8} /></g>)}<Chip x={540} y={1330} text="youtubeurs très connus" c={SOFT} sc={pp(t, 223.6)} s={40} /></>}
  {t >= 226.8 && t < 236.4 && <Stamp x={540} y={1200} text="TROMPÉS" sc={pp(t, 233.3)} s={110} />}
  {t >= 236.4 && t < 240.6 && <Chip x={540} y={1220} text="FIN DU DÉBAT" c={YEL} fg="#14101f" sc={pp(t, 237.7)} s={60} />}
  {t >= 240.6 && <Jeton x={540} y={1180} r={180} sc={pp(t, 240.7)} rot={(t - 240.7) * 200} />}
</>;

type Scene = { a: number; r: (t: number) => React.ReactNode; cam: Key[] };
const SCENES: Scene[] = [
  { a: 14.05, r: Aug, cam: [[14, 540, 560, 1.0], [17.2, 540, 500, 1.06], [20.4, 540, 600, 1.08]] },
  { a: 20.5, r: Same, cam: [[20.5, 540, 400, 1.08], [23.2, 540, 520, 1.0], [28.4, 540, 640, 1.0], [30.5, 540, 760, 1.1]] },
  { a: 31.9, r: Space, cam: [[31.9, 540, 380, 1.1], [36.2, 540, 600, 1.05], [40, 540, 620, 1.08]] },
  { a: 45.4, r: Univ, cam: [[45.4, 540, 560, 1.0], [49.4, 640, 480, 1.1], [52.5, 560, 560, 1.04], [58.3, 540, 640, 1.0]] },
  { a: 58.45, r: Comp, cam: [[58.4, 540, 300, 1.1], [63.3, 540, 460, 1.06], [68.8, 540, 700, 1.06], [74.4, 540, 820, 1.04]] },
  { a: 76.1, r: Tribu, cam: [[76.1, 540, 300, 1.1], [82, 540, 520, 1.04], [103, 540, 560, 1.05], [106.8, 540, 600, 1.0]] },
  { a: 106.85, r: Map01, cam: [[106.8, 540, 300, 1.1], [115.6, 540, 560, 1.04], [119, 540, 620, 1.06]] },
  { a: 128.35, r: Players, cam: [[128.3, 400, 600, 1.08], [133.5, 540, 600, 1.0], [136, 700, 640, 1.06], [144, 540, 620, 1.0], [149, 540, 640, 1.02]] },
  { a: 149.15, r: Binom, cam: [[149.1, 540, 300, 1.1], [156, 540, 420, 1.04], [161.5, 540, 700, 1.04], [171, 540, 980, 1.06], [175, 540, 900, 1.04]] },
  { a: 175.1, r: Curve, cam: [[175.1, 540, 500, 1.0], [183, 360, 560, 1.08], [190, 540, 560, 1.0], [198.3, 660, 560, 1.06], [208.4, 700, 500, 1.08]] },
];
const FACE: [number, number][] = [[0, 14.05], [119.05, 128.35], [208.45, 999]];

/* ---------- timeline: pauses and the false start are cut out ---------- */
const SEG = (KEEP as number[][]).reduce<{ a: number; b: number; o: number }[]>((acc, [a, b]) => { const l = acc[acc.length - 1]; return [...acc, { a, b, o: l ? l.o + l.b - l.a : 0 }]; }, []);
export const MONT3_FRAMES = SEG[SEG.length - 1].o + SEG[SEG.length - 1].b - SEG[SEG.length - 1].a;
const segAt = (f: number) => { let g = SEG[0], gi = 0; SEG.forEach((x, i) => { if (f >= x.o) { g = x; gi = i; } }); return { g, gi }; };
/** output frame -> time (s) in the original take */
const orig = (f: number) => { const { g } = segAt(f); return (g.a + Math.min(f - g.o, g.b - g.a - 1)) / 30; };
const faceOn = (t: number) => FACE.some(([a, b]) => t >= a && t < b);

const TOP = 150, SH = 1240;
const Stage: React.FC = () => {
  const f = useCurrentFrame(), t = orig(f);
  let i = 0; for (let j = 0; j < SCENES.length; j++) if (t >= SCENES[j].a) i = j;
  const sc = SCENES[i], u = t - sc.a, [cx0, cy0, zr] = cam(sc.cam, t), z = (1 + (zr - 1) * 0.5) * 0.96, cx = 540 + (cx0 - 540) * 0.5, cy = 620 + (cy0 - 620) * 0.5;
  const gl = sat(1 - u / 0.14), dx = 10 * gl * (i % 2 ? 1 : -1), g = Math.floor(f / 2);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#050506" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs><filter id="m3rgb" x="-4%" width="108%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={dx} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-dx} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" /></filter></defs></svg>
      <div style={{ position: "absolute", inset: 0, filter: gl > 0 ? "url(#m3rgb)" : undefined }}>
        <div style={{ position: "absolute", width: 1200, height: 1200, left: -480 + Math.sin(t * 0.3) * 60, top: -560, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,200,60,0.16), transparent 62%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 1200, height: 1200, right: -520 + Math.cos(t * 0.25) * 60, bottom: -520, borderRadius: "50%", background: "radial-gradient(circle, rgba(70,110,255,0.16), transparent 62%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", inset: -200, opacity: 0.3, backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1.5px, transparent 1.5px)", backgroundSize: `${54 * z}px ${54 * z}px`, backgroundPosition: `${-cx * z * 0.6}px ${-cy * z * 0.6}px` }} />
        <svg width={1080} height={SH} viewBox={`0 0 1080 ${SH}`} style={{ position: "absolute", left: 0, top: TOP, overflow: "visible" }}>
          <g transform={`translate(${540 - cx * z} ${SH / 2 - cy * z}) scale(${z})`}>{sc.r(t)}</g></svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: sat(1 - u * 12) * 0.25 }} />
      {gl > 0.3 ? [0, 1].map((b) => <div key={b} style={{ position: "absolute", left: 0, right: 0, top: (g * 131 + b * 311) % 1800, height: 20 + ((g * 17 + b * 29) % 50), background: "rgba(255,255,255,0.1)" }} />) : null}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("series/grain.png")})`, backgroundPosition: `${(g * 173) % 512}px ${(g * 311) % 512}px`, opacity: 0.1, mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 180px rgba(0,0,0,0.6)" }} />
    </AbsoluteFill>
  );
};
/** the speaker: every kept piece of the take, with a slightly different framing on each jump cut */
const Face: React.FC = () => {
  const f = useCurrentFrame(), t = orig(f), { g, gi } = segAt(f), u = (f - g.o) / 30, fw = FACE.find(([a, b]) => t >= a && t < b), fu = fw ? t - fw[0] : 0, flash = sat(1 - fu / 0.12);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Sequence from={g.o} durationInFrames={g.b - g.a} layout="none">
        <OffthreadVideo src={staticFile("mont3/src.mp4")} muted startFrom={g.a} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${(gi % 2 ? 1.13 : 1.05) + 0.012 * u})`, transformOrigin: "50% 32%", filter: "contrast(1.05) saturate(1.08)" }} />
      </Sequence>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(0,0,0,0.35), transparent 18%, transparent 52%, rgba(0,0,0,0.75))" }} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible" }}>{FaceOver(t)}</svg>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.4 }} />
    </AbsoluteFill>
  );
};
type CW = [number, number, string];
const Caps: React.FC = () => {
  const t = orig(useCurrentFrame()), G = CAPS as CW[][];
  let gi = -1; for (let i = 0; i < G.length; i++) if (t >= G[i][0][0] - 0.05) gi = i;
  if (gi < 0) return null; const g = G[gi], end = g[g.length - 1][1]; if (t > end + 0.6 && (gi === G.length - 1 || t < G[gi + 1][0][0])) return null;
  const p = eo((t - g[0][0] + 0.05) / 0.14);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1455, textAlign: "center", fontFamily: "InterX", fontWeight: 800, fontSize: 66, lineHeight: 1.2, color: "#fff", transform: `scale(${0.9 + 0.1 * p})`, opacity: p,
      textShadow: "0 0 18px #000, 0 4px 10px #000, 0 0 4px #000" }}>
      {g.map(([s, e, w], i) => <span key={i} style={{ color: t >= s - 0.02 && (t < e + 0.08 || i === g.length - 1) && t >= s - 0.02 && (i === g.length - 1 || t < g[i + 1][0]) ? YEL : "#fff" }}>{w} </span>)}
    </div>
  );
};
export const Mont3: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame(), t = orig(f);
  const [h] = useState(() => delayRender("katex + display fonts"));
  useEffect(() => {
    Promise.all(["400 40px KaTeX_Main", "italic 40px KaTeX_Math", "40px KaTeX_Caligraphic", "40px Anton"].map((x) => document.fonts.load(x, "PJΩA∅→≈≠−")))
      .catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs><clipPath id="jclip"><circle cx={0} cy={0} r={150} /></clipPath></defs></svg>
      {faceOn(t) ? <Face /> : <Stage />}
      <Caps />
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: 1080 * sat(f / MONT3_FRAMES), background: YEL, opacity: 0.9 }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [MONT3_FRAMES - 10, MONT3_FRAMES - 1], [0, 1], clamp) }} />
      {AUDIO ? <Audio src={staticFile("mont3/mix.m4a")} /> : null}
    </AbsoluteFill>
  );
};
const AUDIO = true;
