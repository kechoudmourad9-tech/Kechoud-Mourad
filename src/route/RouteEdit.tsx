// "IntelliRoute" — guided explainer (voice-over + subtitles), 1920x1080. Black vivid ground, one image per idea, travelling camera.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { Mark, Squig } from "../cx/clips";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
import TM from "./timing.json";
import SCRIPT from "./script.json";
export const ROUTE_FRAMES = fr(TM.total);
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
const soft = (z: number) => (1 + (z - 1) * 0.4) * 0.84;   // keep the drawings small: the camera only leans in
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
/* ================= IntelliRoute scenes (1920 x 1080), one image per idea ================= */
const S = (i: number) => TM.S[i], E = (i: number) => TM.E[i];
const mid = (i: number, f = 0.5) => S(i) + (E(i) - S(i)) * f;
const ORG = "#ff8a3d";
const Router: React.FC<{ x: number; y: number; label?: string; sc?: number; c?: string; r?: number; hot?: boolean }> = ({ x, y, label, sc = 1, c = BLUE, r = 46, hot }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><circle r={r} fill={c} stroke="#fff" strokeWidth={5} style={{ filter: `drop-shadow(0 0 ${hot ? 26 : 12}px ${c})` }} />
    {label ? <text fontFamily="Anton" fontSize={r * 0.9} fill="#fff" textAnchor="middle" dominantBaseline="central" y={2}>{label}</text>
      : <path d="M-24 -8 H6 M-2 -18 L8 -8 L-2 2 M24 8 H-6 M2 -2 L-8 8 L2 18" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}</g>);
const Edge: React.FC<{ a: [number, number]; b: [number, number]; p: number; c?: string; w?: number; dash?: string; glow?: boolean }> = ({ a, b, p, c = "#aab2d8", w = 8, dash, glow }) =>
  <Draw d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} p={p} c={c} w={w} dash={dash} glow={glow} />;
const Wt: React.FC<{ a: [number, number]; b: [number, number]; v: string | number; sc: number; c?: string; off?: number }> = ({ a, b, v, sc, c = "#fff", off = 34 }) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  return <g transform={`translate(${(a[0] + b[0]) / 2 - (dy / L) * off} ${(a[1] + b[1]) / 2 + (dx / L) * off}) scale(${sc})`}><circle r={26} fill="#0b0b12" stroke={c} strokeWidth={3} /><text fontFamily="KaTeX_Main" fontSize={34} fill={c} textAnchor="middle" dominantBaseline="central" y={2}>{v}</text></g>; };
const Packet: React.FC<{ x: number; y: number; car?: boolean }> = ({ x, y, car }) => car
  ? <g transform={`translate(${x} ${y})`}><rect x={-30} y={-12} width={60} height={24} rx={8} fill={YEL} /><rect x={-16} y={-26} width={32} height={18} rx={6} fill={YEL} /><circle cx={-16} cy={14} r={8} fill="#14101f" /><circle cx={16} cy={14} r={8} fill="#14101f" /></g>
  : <g transform={`translate(${x} ${y})`} style={{ filter: `drop-shadow(0 0 12px ${YEL})` }}><rect x={-24} y={-16} width={48} height={32} rx={5} fill={YEL} /><path d="M-24 -16 L0 4 L24 -16" fill="none" stroke="#14101f" strokeWidth={4} /></g>;
const Card: React.FC<{ x: number; y: number; w: number; h: number; c: string; p: number; children?: React.ReactNode }> = ({ x, y, w, h, c, p, children }) => p <= 0.001 ? null : (
  <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${p}) translate(${-w / 2} ${-h / 2})`}><rect width={w} height={h} rx={28} fill="#0b0b12" stroke={c} strokeOpacity={0.75} strokeWidth={4} style={{ filter: `drop-shadow(0 0 18px ${c}55)` }} />{children}</g>);
const along = (pts: [number, number][], u: number): [number, number] => { const n = pts.length - 1, k2 = Math.min(n - 1e-6, Math.max(0, u) * n), i = Math.floor(k2), f = sm(k2 - i); return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; };
const Robot: React.FC<{ x: number; y: number; s?: number; sc?: number; t?: number }> = ({ x, y, s = 1, sc = 1, t = 0 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y + Math.sin(t * 2.2) * 4}) scale(${s * sc})`}><line x1={0} y1={-118} x2={0} y2={-150} stroke="#fff" strokeWidth={6} /><circle cy={-156} r={10} fill={CYAN} style={{ filter: `drop-shadow(0 0 10px ${CYAN})` }} />
    <rect x={-70} y={-118} width={140} height={104} rx={26} fill="#1b2140" stroke={CYAN} strokeWidth={6} /><circle cx={-28} cy={-70} r={13} fill={CYAN} /><circle cx={28} cy={-70} r={13} fill={CYAN} /><rect x={-24} y={-42} width={48} height={8} rx={4} fill={CYAN} />
    <rect x={-52} y={-4} width={104} height={86} rx={20} fill="#1b2140" stroke={CYAN} strokeWidth={6} /><text y={42} fontFamily="Anton" fontSize={40} fill={CYAN} textAnchor="middle" dominantBaseline="central">AI</text></g>);

/* 0 — title */
const BGN: [number, number][] = [[300, 760], [620, 560], [620, 900], [1000, 660], [1320, 520], [1320, 860], [1640, 700]];
const BGE = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [1, 4]];
const Title = (t: number) => { const u = ((t * 0.35) % 1), route: [number, number][] = [BGN[0], BGN[1], BGN[3], BGN[4], BGN[6]]; const [px, py] = along(route, u);
  return <>
    <g opacity={0.55}>{BGE.map(([a, b], i) => <Edge key={i} a={BGN[a]} b={BGN[b]} p={k(t, 0.2 + i * 0.08, 0.5)} w={5} />)}{BGN.map(([x, y], i) => <Router key={i} x={x} y={y} sc={pp(t, 0.1 + i * 0.07) * 0.7} />)}<Packet x={px} y={py} /></g>
    <T x={960} y={250} s={210} c="#fff" sc={pp(t, 0.3)} glow={BLUE}>IntelliRoute</T><Squig x={960} y={372} w={900} p={k(t, 1.0, 0.5)} c={YEL} />
    <T x={960} y={452} s={50} c={DIM} f="InterX" sc={pp(t, S(0) + 1.4)}>Dynamic Network Routing · Multi-Criteria Path Optimization</T>
    {["classical algorithms", "graph theory", "mathematical optimization"].map((x, i) => <Chip key={x} x={520 + i * 440} y={1010} text={x} c={[RED, PUR, GRN][i]} sc={pp(t, S(1) + 0.6 + i * 0.55)} s={40} />)}
    {t >= S(2) - 0.2 && <g><rect x={1250} y={560} width={560} height={110} rx={30} fill="#fff" transform={`translate(1530 615) scale(${pp(t, S(2) + 1.2)}) translate(-1530 -615)`} /><T x={1530} y={617} s={46} c="#14101f" f="InterX" sc={pp(t, S(2) + 1.2)}>“Explain every line.”</T></g>}
  </>; };

/* 1 — what is routing */
const RT: [number, number][] = [[250, 520], [600, 420], [900, 600], [1200, 420], [1480, 600], [1740, 500]];
const Routing = (t: number) => { const car = t >= S(6) + 0.8, hop = sm((t - S(4) - 0.3) / (E(4) - S(4) - 0.6)), loop = t > E(4) ? ((t - E(4)) * 0.22) % 1 : hop, [px, py] = along(RT, loop);
  return <>
    {RT.slice(0, -1).map((a, i) => <Edge key={i} a={a} b={RT[i + 1]} p={k(t, S(3) + 0.4 + i * 0.18, 0.4)} c={car ? "#5b6078" : "#aab2d8"} w={car ? 26 : 8} />)}
    {car && RT.slice(0, -1).map((a, i) => <Draw key={`d${i}`} d={`M${a[0]} ${a[1]} L${RT[i + 1][0]} ${RT[i + 1][1]}`} p={1} c="#fff" w={3} dash="18 18" />)}
    <g transform={`translate(250 520) scale(${pp(t, S(3) + 0.2)})`}><rect x={-70} y={-56} width={140} height={96} rx={12} fill="#1b2140" stroke="#fff" strokeWidth={6} /><rect x={-20} y={40} width={40} height={22} fill="#fff" /><rect x={-50} y={60} width={100} height={12} rx={6} fill="#fff" /><T x={0} y={-8} s={34} c={CYAN}>PC</T></g>
    <g transform={`translate(1740 500) scale(${pp(t, S(3) + 1.4)})`}><rect x={-56} y={-90} width={112} height={180} rx={14} fill="#1b2140" stroke="#fff" strokeWidth={6} />{[0, 1, 2].map((i) => <g key={i}><rect x={-40} y={-70 + i * 50} width={80} height={34} rx={6} fill="#2c3460" /><circle cx={-24} cy={-53 + i * 50} r={6} fill={Math.sin(t * 9 + i) > 0 ? GRN : "#14532d"} /></g>)}</g>
    <T x={250} y={640} s={38} c={DIM} f="InterX" sc={pp(t, S(3) + 0.4)}>your computer</T><T x={1740} y={640} s={38} c={DIM} f="InterX" sc={pp(t, S(3) + 1.6)}>server</T>
    {RT.slice(1, -1).map(([x, y], i) => <g key={i}><Router x={x} y={y} sc={pp(t, S(4) + 0.1 + i * 0.25)} hot={Math.hypot(px - x, py - y) < 70} />
      {car && <T x={x} y={y - 86} s={34} c={YEL} f="InterX" sc={pp(t, S(6) + 0.9 + i * 0.1)}>city</T>}</g>)}
    {t >= S(4) && <Packet x={px} y={py - (car ? 34 : 0)} car={car} />}
    {t >= S(4) + 1.2 && t < S(5) && <T x={900} y={720} s={40} c={YEL} f="InterX" sc={pp(t, S(4) + 1.4)}>“where do I forward it?”</T>}
    {([["Router", "forwards packets", BLUE], ["Link", "connects two routers", "#aab2d8"], ["Packet", "a small unit of data", YEL]] as const).map(([a, b, c], i) => { const at = mid(5, 0.18 + i * 0.27);
      return <Card key={a} x={250 + i * 490} y={800} w={440} h={170} c={c} p={pp(t, at)}><T x={220} y={58} s={56} c={c}>{a}</T><T x={220} y={120} s={36} c="#fff" f="InterX">{b}</T></Card>; })}
    {car && <><T x={1050} y={470} s={34} c={YEL} f="InterX" sc={pp(t, S(6) + 1.6)}>road</T><T x={px} y={py - 96} s={34} c={YEL} f="InterX" sc={pp(t, S(6) + 2.3)}>car</T></>}
    <T x={960} y={170} s={84} c="#fff" sc={pp(t, S(7) + 0.2)}>ROUTING = choosing the roads</T><Squig x={960} y={228} w={760} p={k(t, S(7) + 0.8, 0.4)} />
    <T x={960} y={170} s={84} c="#fff" sc={t < S(7) ? pp(t, S(3) + 0.1) : 0}>What is routing?</T>
  </>; };

/* 2 — the real problem: three paths, three different troubles */
const PA: [number, number] = [260, 540], PF: [number, number] = [1660, 540];
const PATHS: { pts: [number, number][]; c: string; tag: string; sub2: string }[] = [
  { pts: [PA, [720, 250], [1200, 250], PF], c: RED, tag: "3 links", sub2: "one is congested" },
  { pts: [PA, [600, 540], [960, 540], [1320, 540], PF], c: GRN, tag: "4 links", sub2: "all fast" },
  { pts: [PA, [960, 850], PF], c: ORG, tag: "2 links", sub2: "packet loss" }];
const Problem = (t: number) => { const hi = t < S(10) ? -1 : Math.min(2, Math.floor(((t - S(10)) / (E(10) - S(10))) * 3)), q = t >= S(11);
  return <>
    <T x={960} y={50} s={70} c="#fff" sc={pp(t, S(8) + 0.2)}>From A to F: which path?</T>
    {PATHS.map((P, pi) => <g key={pi} opacity={hi >= 0 && hi !== pi && !q ? 0.35 : 1}>
      {P.pts.slice(0, -1).map((a, i) => <Edge key={i} a={a} b={P.pts[i + 1]} p={k(t, S(8) + 1.0 + pi * 0.5 + i * 0.15, 0.4)} c={hi === pi || q ? P.c : "#aab2d8"} w={hi === pi ? 12 : 8} glow={hi === pi}
        dash={pi === 2 && (hi === 2 || q) && i === 1 ? "22 20" : undefined} />)}
      {P.pts.slice(1, -1).map(([x, y], i) => <Router key={i} x={x} y={y} sc={pp(t, S(8) + 1.2 + pi * 0.5 + i * 0.15) * 0.8} c={hi === pi || q ? P.c : BLUE} />)}
      {(hi >= pi || q) && <g><Chip x={P.pts[Math.floor(P.pts.length / 2)][0]} y={P.pts[1][1] + (pi === 2 ? 84 : -84)} text={`${P.tag} · ${P.sub2}`} c={P.c} sc={pp(t, S(10) + ((E(10) - S(10)) / 3) * pi + 0.1)} s={36} /></g>}
      {pi === 0 && (hi === 0 || q) && [0, 1, 2, 3].map((j) => <rect key={j} x={830 + j * 62 + ((t * 14) % 30)} y={236} width={44} height={28} rx={6} fill={RED} />)}
      {pi === 1 && (hi === 1 || q) && <Packet x={along(P.pts, (t * 0.5) % 1)[0]} y={540} />}
      {pi === 2 && (hi === 2 || q) && [0, 1, 2].map((j) => { const u = ((t * 0.35 + j / 3) % 1), [x, y] = along(P.pts, u); return <g key={j} opacity={u > 0.62 ? Math.max(0, 1 - (u - 0.62) * 6) : 1} transform={`translate(0 ${u > 0.62 ? (u - 0.62) * 260 : 0})`}><Packet x={x} y={y} /></g>; })}
    </g>)}
    <Router x={PA[0]} y={PA[1]} label="A" sc={pp(t, S(8) + 0.5)} c={PUR} r={60} /><Router x={PF[0]} y={PF[1]} label="F" sc={pp(t, S(8) + 0.8)} c={PUR} r={60} />
    <T x={960} y={985} s={56} c={YEL} f="InterX" sc={t < S(11) ? pp(t, S(9) + 2.2) : 0}>shortest ≠ fastest ≠ most reliable</T>
    <T x={960} y={700} s={150} c={YEL} sc={t >= S(11) && t < S(12) ? pp(t, S(11) + 0.2) : 0} glow={YEL}>?</T>
    <Card x={260} y={890} w={1400} h={150} c={YEL} p={pp(t, S(12) + 0.3)}><T x={700} y={48} s={34} c={YEL}>RESEARCH QUESTION</T><T x={700} y={102} s={38} c="#fff" f="InterX">How to pick the most efficient route dynamically, from several criteria?</T></Card>
  </>; };
const PROBLEM_CAM = (): Key[] => [[S(8), 960, 540, 1.0], [S(10), 960, 540, 1.02], [S(10) + 0.6, 960, 330, 1.35], [mid(10, 0.33), 960, 330, 1.38], [mid(10, 0.4), 960, 560, 1.3], [mid(10, 0.66), 960, 560, 1.33], [mid(10, 0.74), 960, 760, 1.3], [E(10), 960, 770, 1.33], [S(11) + 0.5, 960, 540, 1.0], [E(12), 960, 560, 1.04]];

/* 3 + 4 — Dijkstra on the example graph, then the limitation (same image) */
const GN: Record<string, [number, number]> = { A: [330, 560], B: [740, 320], C: [740, 800], D: [1180, 320], E: [1180, 800], F: [1590, 560] };
const GE: [string, string, number][] = [["A", "B", 4], ["A", "C", 2], ["B", "D", 3], ["B", "E", 8], ["C", "E", 3], ["D", "F", 4], ["E", "F", 2]];
const onPath = (p: string, a: string, b: string) => { const i = p.indexOf(a), j = p.indexOf(b); return i >= 0 && j >= 0 && Math.abs(i - j) === 1; };
const Dijk = (t: number) => { const lim = t >= S(20), newW = t >= mid(20, 0.62);
  const d16 = (E(16) - S(16)), pathNow = t >= S(16) && t < S(17) ? (t < S(16) + d16 * 0.27 ? "ABDF" : t < S(16) + d16 * 0.5 ? "ABEF" : "ACEF") : lim && t >= mid(21, 0.35) ? "ABDF" : t >= S(19) && !lim ? "ACEF" : "";
  const pathCol = pathNow === "ACEF" && !lim ? GRN : pathNow === "ABDF" && lim ? GRN : YEL;
  const st = t < S(17) ? -1 : t < mid(17, 0.6) ? 0 : t < S(18) ? 1 : Math.min(5, 2 + Math.floor(((t - S(18)) / (E(18) - S(18))) * 4));     // relaxation steps
  const DIST: Record<string, (number | null)[]> = { A: [0, 0, 0, 0, 0, 0], B: [null, 4, 4, 4, 4, 4], C: [null, 2, 2, 2, 2, 2], D: [null, null, null, 7, 7, 7], E: [null, null, 5, 5, 5, 5], F: [null, null, null, null, 7, 7] };
  const PICK = ["A", "A", "C", "B", "E", "F"];
  return <>
    <T x={960} y={60} s={74} c="#fff" sc={lim ? 0 : pp(t, S(13) + 0.2)}>Dijkstra’s algorithm</T><Chip x={1400} y={60} text="1956" c={PUR} sc={lim ? 0 : pp(t, mid(13, 0.7))} s={40} />
    <T x={960} y={60} s={74} c={RED} sc={lim ? pp(t, S(20) + 0.1) : 0}>…but here is its limitation</T>
    <T x={960} y={136} s={38} c={DIM} f="InterX" sc={lim ? 0 : pp(t, S(14) + 0.5)}>lowest total cost from a start node to a destination</T>
    {GE.map(([a, b, w], i) => { const hot = pathNow && onPath(pathNow, a, b), isAC = a === "A" && b === "C", wv = isAC && newW ? 15 : w;
      return <g key={i}><Edge a={GN[a]} b={GN[b]} p={k(t, S(15) + 0.2 + i * 0.12, 0.4)} c={hot ? pathCol : isAC && newW ? RED : "#aab2d8"} w={hot ? 14 : 8} glow={!!hot} />
        <Wt a={GN[a]} b={GN[b]} v={wv} sc={pp(t, S(15) + 1.2 + i * 0.1) * (isAC && lim && t > mid(20, 0.62) && t < mid(20, 0.62) + 0.4 ? 1.5 : 1)} c={isAC && newW ? RED : hot ? pathCol : "#fff"} off={a === "B" && b === "E" ? -40 : 38} /></g>; })}
    {Object.entries(GN).map(([n, [x, y]], i) => <g key={n}><Router x={x} y={y} label={n} sc={pp(t, S(15) + 0.1 + i * 0.1)} r={56} c={st >= 0 && !lim && PICK[st] === n ? ORG : n === "A" || n === "F" ? PUR : BLUE} hot={st >= 0 && PICK[st] === n} />
      {st >= 0 && !lim && <g transform={`translate(${x} ${y + (y > 600 ? 104 : -104)})`}><rect x={-46} y={-28} width={92} height={56} rx={14} fill={DIST[n][st] === null ? "#1b2140" : YEL} /><text fontFamily="KaTeX_Main" fontSize={40} fill={DIST[n][st] === null ? DIM : "#14101f"} textAnchor="middle" dominantBaseline="central" y={2}>{DIST[n][st] === null ? "∞" : DIST[n][st]}</text></g>}</g>)}
    {t >= S(16) && t < S(17) && <Card x={1500} y={150} w={380} h={250} c={YEL} p={pp(t, S(16) + 0.1)}>{([["A→B→D→F", 11, 0.03], ["A→B→E→F", 14, 0.3], ["A→C→E→F", 7, 0.53]] as const).map(([p, c, f], i) => <g key={p} opacity={k(t, S(16) + d16 * f, 0.25)}>
      <T x={30} y={52 + i * 72} s={38} c="#fff" f="KaTeX_Main" anchor="start">{p}</T><T x={350} y={52 + i * 72} s={46} c={c === 7 ? GRN : YEL} anchor="end">{c}</T></g>)}</Card>}
    <Chip x={960} y={1010} text="best path: A → C → E → F   (cost 7)" c={GRN} sc={t >= mid(16, 0.78) && !lim ? pp(t, mid(16, 0.78)) : 0} s={42} />
    <Chip x={960} y={560} text="relaxation" c={ORG} sc={t >= mid(18, 0.72) && t < S(19) ? pp(t, mid(18, 0.72)) : 0} s={40} />
    <Chip x={960} y={690} text="optimal when all weights ≥ 0" c={PUR} sc={t >= S(19) && !lim ? pp(t, S(19) + 0.8) : 0} s={38} />
    {lim && <><T x={400} y={810} s={40} c={RED} f="InterX" sc={pp(t, mid(20, 0.45))}>congestion: 2 → 15</T>
      <Chip x={960} y={1010} text={t >= mid(21, 0.35) ? "re-run with new weights → A → B → D → F  (cost 11)" : "old route A → C → E → F now costs 20"} c={t >= mid(21, 0.35) ? GRN : RED} sc={pp(t, S(21) + 0.2)} s={40} />
      <Card x={1420} y={130} w={460} h={230} c={RED} p={pp(t, S(22) + 0.2)}><T x={230} y={56} s={38} c={RED}>DIJKSTRA ALONE</T><T x={230} y={118} s={36} c="#fff" f="InterX">✗ does not monitor</T><T x={230} y={172} s={36} c="#fff" f="InterX">✗ does not model</T></Card>
      <T x={1650} y={430} s={44} c={YEL} f="InterX" sc={pp(t, mid(22, 0.72))}>→ our project</T></>}
  </>; };
const DIJK_CAM = (): Key[] => [[S(13), 960, 420, 1.1], [S(15), 960, 560, 1.0], [S(17), 960, 560, 1.02], [S(17) + 0.8, 620, 560, 1.4], [E(17), 640, 560, 1.44], [S(18) + 0.6, 960, 560, 1.12], [E(18), 1000, 560, 1.16], [S(19) + 0.5, 960, 560, 1.0], [S(20), 960, 560, 1.0],
  [S(20) + 0.9, 560, 660, 1.5], [E(20), 570, 660, 1.55], [S(21) + 0.8, 960, 560, 1.02], [E(22), 1020, 540, 1.08]];

/* 5 — our idea: a multi-criteria link cost */
const CRIT: [string, string, string, number][] = [["latency", "ms", RED, 0.72], ["packet loss", "%", ORG, 0.35], ["bandwidth", "Mbps", GRN, 0.55], ["congestion", "%", PUR, 0.8]];
const Idea = (t: number) => { const wobble = (i: number) => (t >= S(24) ? 0.5 + 0.4 * Math.sin(t * 1.7 + i * 1.9) : 0.5);
  return <>
    <T x={960} y={100} s={76} c="#fff" sc={pp(t, S(23) + 0.2)}>Our idea: a multi-criteria cost</T>
    <Edge a={[330, 330]} b={[1590, 330]} p={k(t, S(23) + 0.4, 0.5)} c={YEL} w={12} glow /><Router x={330} y={330} label="i" sc={pp(t, S(23) + 0.3)} r={58} /><Router x={1590} y={330} label="j" sc={pp(t, S(23) + 0.5)} r={58} />
    <Packet x={330 + ((t * 300) % 1260)} y={330} />
    {CRIT.map(([n, u, c, v], i) => { const at = mid(23, 0.42 + i * 0.14), val = v * k(t, at, 0.8) * (0.85 + 0.15 * Math.sin(t * 3 + i));
      return <Card key={n} x={170 + i * 405} y={470} w={370} h={250} c={c} p={pp(t, at)}><T x={185} y={50} s={44} c={c}>{n.toUpperCase()}</T>
        <path d="M65 200 A120 120 0 0 1 305 200" fill="none" stroke="#2c3460" strokeWidth={22} strokeLinecap="round" /><path d="M65 200 A120 120 0 0 1 305 200" fill="none" stroke={c} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - val} />
        <T x={185} y={176} s={48} c="#fff" f="KaTeX_Main">{Math.round(val * (u === "Mbps" ? 1000 : 100))} {u}</T>
        {t >= S(24) && <g><rect x={50} y={224} width={270} height={10} rx={5} fill="#2c3460" /><circle cx={50 + 270 * wobble(i)} cy={229} r={14} fill="#fff" stroke={c} strokeWidth={5} /></g>}</Card>; })}
    <Card x={130} y={790} w={1660} h={150} c={YEL} p={pp(t, mid(23, 0.2))}><T x={830} y={76} s={46} c="#fff" f="KaTeX_Main">cost(i, j) = {sub("w", "1")}{" · latency + "}{sub("w", "2")}{" · loss + "}{sub("w", "3")}{" / bandwidth + "}{sub("w", "4")}{" · congestion"}</T></Card>
    <T x={960} y={990} s={38} c={DIM} f="InterX" sc={t < S(25) ? pp(t, S(24) + 0.6) : 0}>the weights say what we optimize · costs are refreshed as conditions change</T>
    <Chip x={960} y={990} text="switch route only if the gain is significant  (no flapping)" c={GRN} sc={t >= S(25) ? pp(t, S(25) + 0.6) : 0} s={40} />
  </>; };

/* 6 — what we build: the simulator and its four parts */
const Build = (t: number) => { const P = [[110, 190, BLUE, "A · Topology editor", 27], [990, 190, ORG, "B · Condition simulator", 28], [110, 630, PUR, "C · Routing engine", 29], [990, 630, GRN, "D · Results dashboard", 30]] as const;
  return <>
    <T x={560} y={96} s={74} c="#fff" sc={pp(t, S(26) + 0.2)}>What we build</T><Chip x={1160} y={96} text="a network simulator in Python" c={YEL} fg="#14101f" sc={pp(t, mid(26, 0.6))} s={40} />
    {P.map(([x, y, c, title, si], i) => <Card key={i} x={x} y={y} w={820} h={400} c={c} p={pp(t, S(si) + 0.1)}><T x={40} y={56} s={50} c={c} anchor="start">{title}</T>
      {i === 0 && <g>{([[150, 250], [330, 150], [330, 320], [540, 240], [700, 170]] as [number, number][]).map(([a, b], j, arr) => <g key={j}>{j > 0 && <Edge a={arr[j - 1]} b={[a, b]} p={k(t, S(27) + 0.8 + j * 0.3, 0.3)} w={6} />}<Router x={a} y={b} sc={pp(t, S(27) + 0.6 + j * 0.3) * 0.7} c={j === 0 || j === 4 ? PUR : BLUE} /></g>)}
        <T x={150} y={330} s={30} c={DIM} f="InterX">source</T><T x={700} y={250} s={30} c={DIM} f="InterX">destination</T></g>}
      {i === 1 && ["congestion", "latency", "packet loss", "bandwidth"].map((n, j) => <g key={n} opacity={k(t, S(28) + 0.6 + j * 0.35)}><T x={50} y={130 + j * 62} s={34} c="#fff" f="InterX" anchor="start">{n}</T><rect x={300} y={124 + j * 62} width={420} height={12} rx={6} fill="#2c3460" />
        <circle cx={300 + 420 * (0.5 + 0.4 * Math.sin(t * 1.5 + j * 2))} cy={130 + j * 62} r={16} fill="#fff" stroke={c} strokeWidth={6} /></g>)}
      {i === 1 && <Chip x={410} y={360} text="router failure  ✗" c={RED} sc={pp(t, mid(28, 0.8))} s={32} />}
      {i === 2 && ["1 · Dijkstra, static weights", "2 · Dijkstra, updated weights", "3 · Multi-criteria adaptive (ours)"].map((n, j) => <g key={n} transform={`translate(0 ${(1 - k(t, mid(29, 0.25 + j * 0.22), 0.3)) * 20})`} opacity={k(t, mid(29, 0.25 + j * 0.22), 0.3)}>
        <rect x={50} y={110 + j * 88} width={720} height={70} rx={18} fill={j === 2 ? "#9b5cff44" : "#1b2140"} stroke={j === 2 ? PUR : "#3a4270"} strokeWidth={4} /><T x={80} y={146 + j * 88} s={38} c="#fff" f="InterX" anchor="start">{n}</T></g>)}
      {i === 3 && <g>{["route", "cost", "latency", "delivery", "changes"].map((n, j) => <g key={n} opacity={k(t, mid(30, 0.3 + j * 0.12), 0.3)}><rect x={70 + j * 142} y={330 - (60 + ((j * 53) % 150)) * k(t, mid(30, 0.3 + j * 0.12), 0.6)} width={86} height={(60 + ((j * 53) % 150)) * k(t, mid(30, 0.3 + j * 0.12), 0.6)} rx={10} fill={[BLUE, YEL, RED, GRN, PUR][j]} />
        <T x={113 + j * 142} y={362} s={28} c="#fff" f="InterX">{n}</T></g>)}</g>}
    </Card>)}
  </>; };

/* 7 — proof by experiments */
const METRICS = ["average latency", "packet delivery ratio", "throughput", "route computation time", "route changes"];
const Proof = (t: number) => { const n = Math.floor(sm((t - S(32) - 0.2) / (E(32) - S(32) - 0.6)) * 100);
  return <>
    <T x={960} y={96} s={74} c="#fff" sc={pp(t, S(31) + 0.2)}>How do we prove it is better?</T><Chip x={960} y={186} text="experiments, not adjectives" c={YEL} fg="#14101f" sc={pp(t, mid(31, 0.6))} s={40} />
    <Card x={110} y={270} w={640} h={560} c={BLUE} p={pp(t, S(32) + 0.1)}><T x={320} y={54} s={44} c={BLUE}>100 SCENARIOS</T>
      {Array.from({ length: 100 }).map((_, i) => <rect key={i} x={60 + (i % 10) * 53} y={100 + Math.floor(i / 10) * 40} width={44} height={31} rx={7} fill={i < n ? [BLUE, CYAN, PUR][i % 3] : "#1b2140"} />)}<T x={320} y={520} s={30} c="#fff" f="InterX">same conditions for all · {n}/100</T></Card>
    <Card x={800} y={270} w={470} h={560} c={PUR} p={pp(t, S(32) + 0.6)}><T x={235} y={54} s={44} c={PUR}>3 ALGORITHMS</T>
      {["Dijkstra · static", "Dijkstra · updated latency", "Multi-criteria (ours)"].map((x, i) => <g key={x}><rect x={30} y={110 + i * 140} width={410} height={110} rx={20} fill={i === 1 && t >= S(34) ? "#ffd23f33" : "#1b2140"} stroke={i === 1 && t >= S(34) ? YEL : "#3a4270"} strokeWidth={4} />
        <T x={235} y={165 + i * 140} s={34} c="#fff" f="InterX">{x}</T></g>)}
      {t >= S(34) && <Mark x={235} y={305} rx={225} ry={72} p={k(t, mid(34, 0.3), 0.5)} c={YEL} w={7} seed={5} />}</Card>
    <Card x={1320} y={270} w={490} h={560} c={GRN} p={pp(t, S(33) + 0.1)}><T x={245} y={54} s={44} c={GRN}>5 METRICS</T>
      {METRICS.map((x, i) => { const at = mid(33, 0.12 + i * 0.17); return <g key={x} opacity={k(t, at, 0.25)}><Tick x={56} y={130 + i * 84} ok sc={pp(t, at)} s={0.9} /><T x={100} y={132 + i * 84} s={34} c="#fff" f="InterX" anchor="start">{x}</T></g>; })}</Card>
    <Chip x={960} y={930} text="fair baseline: does multi-criteria really add value?" c={YEL} fg="#14101f" sc={pp(t, mid(34, 0.45))} s={40} />
  </>; };

/* 8 — roadmap in six stages + honest limits (same image) */
const STG: [string, string, string, number][] = [["Networking fundamentals", "routers · packets · topology", "routing tables · graphs", S(36) + 0.2], ["Classical algorithms", "implement Dijkstra", "complexity · limitations", mid(36, 0.45)],
  ["Network cost model", "normalize latency, congestion,", "bandwidth, packet loss", S(37) + 0.2], ["Dynamic routing", "cost updates · recalculation", "hysteresis", S(38) + 0.2],
  ["Simulation & interface", "topology · changing conditions", "visualize packet routes", S(39) + 0.2], ["Experiments", "compare · analyze", "identify improvements", mid(39, 0.42)]];
const SX = (i: number) => 210 + i * 300;
const Road = (t: number) => { const cur = STG.filter((x) => t >= x[3]).length - 1, px = cur < 0 ? SX(0) - 120 : SX(cur) - 300 * (1 - sm((t - STG[cur][3]) / 0.5)) * (cur > 0 ? 1 : 0.4);
  const w = [0.5 + 0.3 * Math.sin(t * 1.3), 0.5 + 0.3 * Math.sin(t * 1.1 + 2)];
  return <>
    <T x={960} y={70} s={74} c="#fff" sc={pp(t, S(35) + 0.2)}>Our roadmap: six stages</T>
    <Edge a={[SX(0), 300]} b={[SX(5), 300]} p={k(t, S(35) + 0.6, 1.2)} c="#5b6078" w={10} /><Edge a={[SX(0), 300]} b={[Math.max(SX(0), px), 300]} p={cur >= 0 ? 1 : 0} c={GRN} w={10} glow />
    {STG.map(([title, l1, l2, at], i) => { const on = t >= at, c = [BLUE, PUR, ORG, RED, CYAN, GRN][i];
      return <g key={i}><Router x={SX(i)} y={300} label={`${i + 1}`} sc={pp(t, S(35) + 0.8 + i * 0.15) * (i === cur ? 1.15 : 0.9)} c={on ? c : "#2c3460"} r={50} hot={i === cur} />
        <T x={SX(i)} y={i % 2 ? 150 : 205} s={30} c={on ? c : DIM} sc={pp(t, at)}>{title.toUpperCase()}</T>
        <T x={SX(i)} y={i % 2 ? 458 : 392} s={24} c="#fff" f="InterX" sc={pp(t, at + 0.25)}>{l1}</T><T x={SX(i)} y={i % 2 ? 490 : 424} s={24} c="#fff" f="InterX" sc={pp(t, at + 0.35)}>{l2}</T></g>; })}
    {cur >= 0 && t < S(40) && <Packet x={px} y={236} />}
    <Card x={150} y={540} w={780} h={440} c={YEL} p={pp(t, S(40) + 0.4)}><T x={390} y={44} s={38} c={YEL}>A COMPROMISE</T>
      <path d="M390 120 L160 370 L620 370 Z" fill="#ffd23f14" stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
      <T x={390} y={98} s={28} c={RED} f="InterX">fastest</T><T x={150} y={402} s={28} c={GRN} f="InterX">most reliable</T><T x={630} y={402} s={28} c={CYAN} f="InterX">highest bandwidth</T>
      <circle cx={390 + (w[0] - 0.5) * 300} cy={290 - (w[1] - 0.5) * 160} r={18} fill={YEL} style={{ filter: `drop-shadow(0 0 14px ${YEL})` }} />
      <T x={390} y={318} s={26} c={DIM} f="InterX" sc={pp(t, mid(40, 0.75))}>we choose the trade-off</T></Card>
    <Card x={990} y={540} w={780} h={440} c={RED} p={pp(t, S(41) + 0.3)}><T x={390} y={56} s={44} c={RED}>A SIMULATOR, NOT THE INTERNET</T>
      <Router x={230} y={230} sc={1} c={GRN} r={54} /><T x={230} y={320} s={28} c="#fff" f="InterX">our simulator</T><Tick x={230} y={372} ok sc={pp(t, S(41) + 0.9)} />
      <Router x={550} y={230} sc={1} c="#5b6078" r={54} /><T x={550} y={320} s={28} c="#fff" f="InterX">real ISP routing tables</T><Tick x={550} y={372} ok={false} sc={pp(t, mid(41, 0.55))} />
      <Mark x={550} y={230} rx={84} ry={76} p={k(t, mid(41, 0.55), 0.5)} c={RED} w={7} seed={3} /></Card>
  </>; };

/* 9 — delegation: three teammates + the AI */
const TEAM: [string, string, string, string[], number, string, string][] = [
  ["MEMBER 1", "Algorithms lead", RED, ["graph model", "2 Dijkstra baselines", "multi-criteria cost"], 43, "#1d1420", "#f2c29b"],
  ["MEMBER 2", "Simulator lead", BLUE, ["topology editor", "network conditions", "dashboard"], 44, "#5a3418", "#c98a5e"],
  ["MEMBER 3", "Experiments & report", GRN, ["scenarios & metrics", "plots & statistics", "LaTeX document"], 45, "#c9a227", "#f2c29b"]];
const Team = (t: number) => <>
  <T x={960} y={90} s={74} c="#fff" sc={pp(t, S(42) + 0.2)}>Who does what?</T>
  {TEAM.map(([name, role, c, tasks, si, hair, skin], i) => { const x = 250 + i * 430, on = t >= S(si);
    return <g key={name}><Person x={x} y={520} s={0.95} ink="#fff" col={c} label="" t={t + i} hair={hair} skin={skin} sc={pp(t, S(42) + 0.5 + i * 0.3)} wave={on && t < E(si) ? Math.sin(t * 8) * 0.3 + 0.6 : 0} glasses={i === 0} />
      <T x={x} y={620} s={46} c={c} sc={pp(t, S(42) + 0.7 + i * 0.3)}>{name}</T><T x={x} y={672} s={32} c="#fff" f="InterX" sc={pp(t, S(si) + 0.2)}>{role}</T>
      {tasks.map((k2, j) => <Chip key={k2} x={x} y={740 + j * 66} text={k2} c="#1b2140" sc={pp(t, mid(si, 0.3 + j * 0.2))} s={30} />)}
      {t >= S(47) && <Draw d={`M1500 ${330 + i * 14} Q${(1500 + x) / 2} ${150 - i * 30} ${x + 30} 215`} p={k(t, S(47) + 0.4 + i * 0.25, 0.5)} c={YEL} w={5} dash="14 12" />}</g>; })}
  <Robot x={1580} y={440} s={1.25} sc={pp(t, S(42) + 1.6)} t={t} /><T x={1580} y={620} s={46} c={CYAN} sc={pp(t, S(42) + 1.8)}>AI ASSISTANT</T>
  {["drafts code & tests", "LaTeX & diagrams", "explains concepts"].map((x, j) => <Chip key={x} x={1580} y={690 + j * 62} text={x} c="#1b2140" sc={pp(t, mid(46, 0.1 + j * 0.12))} s={30} />)}
  <Chip x={1580} y={890} text="⚠ can be confidently wrong" c={RED} sc={pp(t, mid(46, 0.6))} s={30} /><Chip x={1580} y={952} text="✗ cannot see our real results" c={RED} sc={pp(t, mid(46, 0.8))} s={30} />
  <Chip x={870} y={175} text="every AI output has a human owner who checks it and can explain it" c={YEL} fg="#14101f" sc={t >= S(47) && t < S(48) ? pp(t, S(47) + 0.9) : 0} s={34} />
  <Chip x={690} y={985} text="humans own: research question · experiments · final claims" c={GRN} sc={pp(t, S(48) + 0.4)} s={36} />
</>;

/* 10 — LaTeX report + closing line */
const Outro = (t: number) => <>
  <g transform={`translate(430 560) rotate(-4) scale(${pp(t, S(49) + 0.2)})`}><rect x={-250} y={-340} width={500} height={680} rx={14} fill="#fbfaf5" style={{ filter: "drop-shadow(0 30px 60px #000)" }} />
    <text x={0} y={-270} fontFamily="KaTeX_Main" fontSize={40} fill="#14101f" textAnchor="middle">IntelliRoute</text><text x={0} y={-232} fontFamily="KaTeX_Main" fontSize={20} fill="#555" textAnchor="middle">Dynamic Network Routing</text>
    {["1  Introduction", "2  Dijkstra’s algorithm", "3  Multi-criteria model", "4  Simulator", "5  Experiments", "6  Delegation plan"].map((x, i) => <g key={x} opacity={k(t, mid(49, 0.25 + i * 0.1), 0.25)}><text x={-200} y={-170 + i * 78} fontFamily="KaTeX_Main" fontSize={26} fill="#14101f">{x}</text>
      <rect x={-200} y={-152 + i * 78} width={380 - (i % 3) * 60} height={7} rx={3} fill="#c9cbd6" /><rect x={-200} y={-136 + i * 78} width={300 - (i % 2) * 70} height={7} rx={3} fill="#c9cbd6" /></g>)}</g>
  <T x={430} y={960} s={64} c="#fff" f="KaTeX_Main" sc={pp(t, S(49) + 0.8)}>L<tspan dy="-0.18em" fontSize="74%">A</tspan><tspan dy="0.18em">T</tspan><tspan dy="0.2em">E</tspan><tspan dy="-0.2em">X</tspan> report</T>
  <T x={1260} y={360} s={150} c="#fff" sc={pp(t, S(50) + 0.1)} glow={BLUE}>IntelliRoute</T><Squig x={1260} y={452} w={640} p={k(t, S(50) + 0.7, 0.4)} c={YEL} />
  <T x={1260} y={560} s={52} c={DIM} f="InterX" sc={pp(t, mid(50, 0.3))}>not just the shortest path</T><T x={1260} y={650} s={64} c={YEL} f="InterX" sc={pp(t, mid(50, 0.55))}>the best one, right now</T>
</>;

type Scene = { a: number; r: (t: number) => React.ReactNode; cam: Key[] };
const st0 = (i: number) => (i === 0 ? 0 : S(i) - 0.35);
const SCENES: Scene[] = [
  { a: st0(0), r: Title, cam: [[0, 960, 540, 1.0], [E(2), 960, 540, 1.08]] },
  { a: st0(3), r: Routing, cam: [[S(3), 960, 540, 1.0], [S(4), 900, 520, 1.12], [E(4), 1000, 520, 1.16], [S(5) + 0.6, 960, 640, 1.08], [E(5), 960, 650, 1.1], [S(6) + 0.6, 960, 520, 1.15], [E(6), 980, 520, 1.2], [S(7) + 0.6, 960, 500, 1.02], [E(7), 960, 500, 1.06]] },
  { a: st0(8), r: Problem, cam: PROBLEM_CAM() }, { a: st0(13), r: Dijk, cam: DIJK_CAM() },
  { a: st0(23), r: Idea, cam: [[S(23), 960, 420, 1.1], [mid(23, 0.35), 960, 560, 1.0], [E(24), 960, 600, 1.05], [S(25) + 0.6, 960, 760, 1.2], [E(25), 960, 770, 1.24]] },
  { a: st0(26), r: Build, cam: [[S(26), 960, 540, 1.0], [S(27) + 0.5, 520, 400, 1.5], [E(27), 520, 400, 1.55], [S(28) + 0.5, 1400, 400, 1.5], [E(28), 1400, 400, 1.55], [S(29) + 0.5, 520, 820, 1.5], [E(29), 520, 820, 1.55], [S(30) + 0.5, 1400, 820, 1.5], [E(30) - 0.8, 1400, 820, 1.55], [E(30), 960, 560, 1.0]] },
  { a: st0(31), r: Proof, cam: [[S(31), 960, 420, 1.12], [S(32), 960, 560, 1.0], [S(32) + 0.7, 520, 560, 1.4], [E(32), 540, 560, 1.44], [S(33) + 0.6, 1500, 560, 1.4], [E(33), 1500, 560, 1.44], [S(34) + 0.6, 1030, 600, 1.3], [E(34), 1030, 620, 1.34]] },
  { a: st0(35), r: Road, cam: [[S(35), 960, 420, 1.05], [S(36), 400, 320, 1.6], [E(36), 560, 320, 1.6], [E(37), 840, 320, 1.6], [E(38), 1110, 320, 1.6], [E(39), 1500, 320, 1.6], [S(40) + 0.7, 700, 700, 1.35], [E(40), 720, 720, 1.4], [S(41) + 0.6, 1300, 720, 1.35], [E(41), 960, 560, 1.0]] },
  { a: st0(42), r: Team, cam: [[S(42), 960, 540, 1.0], [S(43) + 0.5, 300, 620, 1.5], [E(43), 300, 630, 1.55], [S(44) + 0.5, 700, 620, 1.5], [E(44), 700, 630, 1.55], [S(45) + 0.5, 1110, 620, 1.5], [E(45), 1110, 630, 1.55], [S(46) + 0.6, 1540, 660, 1.5], [E(46), 1540, 680, 1.55], [S(47) + 0.6, 960, 480, 1.0], [E(48), 960, 560, 1.05]] },
  { a: st0(49), r: Outro, cam: [[S(49), 700, 560, 1.15], [E(49), 760, 560, 1.2], [S(50) + 0.6, 1100, 520, 1.1], [TM.total, 1130, 520, 1.16]] },
];

/* ---------- stage: black vivid ground, travelling camera, glitch only at scene changes ---------- */
const W = 1920, H = 1080, CY = 492;
const Stage: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  let i = 0; for (let j = 0; j < SCENES.length; j++) if (t >= SCENES[j].a) i = j;
  const sc = SCENES[i], u = t - sc.a, [cx0, cy0, zr] = cam(sc.cam, t), z = soft(zr), cx = 960 + (cx0 - 960) * 0.3, cy = 540 + (cy0 - 540) * 0.3;   // the camera only leans towards its target
  const dir = i % 2 ? 1 : -1, gl = i === 0 ? 0 : sat(1 - u / 0.16), dx = 30 * gl * dir, g = Math.floor(t * 15);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#050506" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs><filter id="rtrgb" x="-4%" width="108%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={dx} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-dx} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" /></filter></defs></svg>
      <div style={{ position: "absolute", inset: 0, filter: gl > 0 ? "url(#rtrgb)" : undefined }}>
        <div style={{ position: "absolute", width: 1300, height: 1300, left: -480 + Math.sin(t * 0.5) * 90 - (cx - 960) * 0.15, top: -760, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.5), transparent 62%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 1400, height: 1400, right: -520 + Math.cos(t * 0.4) * 90 + (cx - 960) * 0.15, bottom: -860, borderRadius: "50%", background: "radial-gradient(circle, rgba(40,224,255,0.45), transparent 62%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 1000, height: 1000, left: 560 + Math.sin(t * 0.3) * 200, top: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,92,255,0.22), transparent 60%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", inset: -300, opacity: 0.4, backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1.6px, transparent 1.6px)", backgroundSize: `${64 * z}px ${64 * z}px`, backgroundPosition: `${-cx * z * 0.6}px ${-cy * z * 0.6}px` }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g transform={`translate(${W / 2 - cx * z} ${CY - cy * z}) scale(${z})`}>{sc.r(t)}</g></svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: i === 0 ? 0 : sat(1 - u * 13) * 0.35 }} />
      {gl > 0.3 ? [0, 1].map((b) => <div key={b} style={{ position: "absolute", left: 0, right: 0, top: (g * 131 + b * 311) % 1000, height: 26 + ((g * 17 + b * 29) % 60),
        background: b ? "rgba(40,224,255,0.25)" : "rgba(255,45,45,0.25)", transform: `translateX(${((g * 53 + b * 97) % 80) - 40}px)` }} />) : null}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("series/grain.png")})`, backgroundPosition: `${(g * 173) % 512}px ${(g * 311) % 512}px`, opacity: 0.12, mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 220px rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 190, background: "linear-gradient(transparent, rgba(0,0,0,0.85) 55%)" }} />
    </AbsoluteFill>
  );
};

/* subtitles: each sentence is cut into short lines, timed in proportion to their length */
const SUBS: [number, number, string][] = (SCRIPT as string[]).flatMap((s, i) => { const w = s.split(" "), n = Math.ceil(w.length / 11), per = Math.ceil(w.length / n), parts: string[] = [];
  for (let j = 0; j < w.length; j += per) parts.push(w.slice(j, j + per).join(" "));
  const L = parts.reduce((a, p) => a + p.length, 0); let tt = TM.S[i]; return parts.map((p) => { const d = ((TM.E[i] - TM.S[i]) * p.length) / L, r: [number, number, string] = [tt, tt + d + 0.12, p]; tt += d; return r; }); });
const KEY = /^(routing|routers?|packets?|dijkstra’?s?|dijkstra|cost|latency|congestion|bandwidth|loss|shortest|fastest|reliable|multi-criteria|simulator|experiments?|metrics?|relaxation|latex|intelliroute|dynamically|graph|weights?|baseline|member|humans?|a\.?i\.?)[.,:;!?]*$/i;
const Subs: React.FC = () => {
  const t = useCurrentFrame() / FPS, s = SUBS.find((x) => t >= x[0] && t < x[1]); if (!s) return null;
  const p = eo((t - s[0]) / 0.18);
  return (
    <div style={{ position: "absolute", left: 120, right: 120, bottom: 44, textAlign: "center", fontFamily: "InterX", fontWeight: 800, fontSize: 46, lineHeight: 1.25, color: "#fff", opacity: p, textShadow: "0 3px 14px #000" }}>
      {s[2].split(" ").map((w, i) => <span key={i} style={{ color: KEY.test(w) ? YEL : "#fff" }}>{w} </span>)}
    </div>
  );
};
const CHAPS: [number, string][] = [[0, "INTRO"], [3, "1 · WHAT IS ROUTING"], [8, "2 · THE PROBLEM"], [13, "3 · DIJKSTRA"], [20, "4 · THE LIMITATION"], [23, "5 · OUR IDEA"], [26, "6 · WHAT WE BUILD"], [31, "7 · THE PROOF"], [35, "8 · ROADMAP & LIMITS"], [42, "9 · DELEGATION PLAN"], [49, "10 · REPORT"]];

export const RouteEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame(), t = f / FPS;
  const [h] = useState(() => delayRender("katex + display fonts"));
  useEffect(() => {
    Promise.all(["400 40px KaTeX_Main", "italic 40px KaTeX_Math", "40px Anton"].map((x) => document.fonts.load(x, "fSnu∞→")))
      .catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  const chap = [...CHAPS].reverse().find((c) => t >= TM.S[c[0]] - 0.35) ?? CHAPS[0];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Stage />
      <div style={{ position: "absolute", left: 48, top: 36, fontFamily: "InterX", fontWeight: 800, fontSize: 26, letterSpacing: 4, color: "rgba(255,255,255,0.75)", background: "rgba(0,0,0,0.45)", padding: "10px 20px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.18)" }}>{chap[1]}</div>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: W * sat(t / TM.total), background: RED }} />
      <Subs />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [ROUTE_FRAMES - 14, ROUTE_FRAMES - 1], [0, 1], clamp) }} />
      {AUDIO ? <Audio src={staticFile("route/mix.m4a")} /> : null}
    </AbsoluteFill>
  );
};
const AUDIO = false;
