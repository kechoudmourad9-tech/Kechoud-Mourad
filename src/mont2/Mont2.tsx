// Face-cam montage "la droite réelle achevée": animations above the speaker, same look as the POV/Series videos.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { Mark, Squig } from "../cx/clips";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
import KEEP from "./keep.json";
// pauses are cut out: KEEP lists the kept [from, to[ frame ranges of the original take
const SEG = (KEEP as number[][]).reduce<{ a: number; b: number; o: number }[]>((acc, [a, b]) => { const o = acc.length ? acc[acc.length - 1].o + acc[acc.length - 1].b - acc[acc.length - 1].a : 0; return [...acc, { a, b, o }]; }, []);
export const MONT2_FRAMES = SEG[SEG.length - 1].o + SEG[SEG.length - 1].b - SEG[SEG.length - 1].a;
/** output frame -> time (s) in the original take */
const orig = (f: number) => { const g = [...SEG].reverse().find((x) => f >= x.o) ?? SEG[0]; return (g.a + Math.min(f - g.o, g.b - g.a - 1)) / 30; };
/** original time (s) -> output time (s) */
const outT = (t: number) => { const fo = t * 30; for (const g of SEG) { if (fo < g.a) return g.o / 30; if (fo < g.b) return (g.o + fo - g.a) / 30; } return MONT2_FRAMES / 30; };
// the speaker is only shown on a few key moments (original times); everything else is full-screen animation
const FACE: [number, number][] = [[0, 2.45], [15.8, 17.2], [22.0, 24.4], [43.75, 44.9]];
const faceOn = (t: number) => FACE.some(([a, b]) => t >= a && t < b);
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
const soft = (z: number) => (1 + (z - 1) * 0.34) * 0.9;   // keep the drawings small: the camera only leans in
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
/* ================= scenes (1080 x 900 stage above the speaker) ================= */
const AMS = "KaTeX_AMS", KM = "KaTeX_Main", KI = "KaTeX_Math";
const Rbar: React.FC<{ x: number; y: number; s: number; sc?: number; c?: string; bar?: number }> = ({ x, y, s, sc = 1, c = "#fff", bar = 0 }) => sc <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${sc})`}><T x={0} y={0} s={s} c={c} f={AMS}>R</T>{bar > 0 && <Draw d={`M${-s * 0.34} ${-s * 0.5} H${s * 0.34}`} p={bar} c={c} w={s * 0.07} />}</g>);
/* 0 — hook */
const Hook = (t: number) => <>
  <T x={540} y={250} s={150} c="#fff" sc={pp(t, 0.15)} glow={RED}>SUIS-MOI</T><T x={540} y={410} s={150} c={YEL} sc={pp(t, 0.7)} glow={YEL}>BIEN</T><Squig x={540} y={500} w={420} p={k(t, 1.1, 0.4)} />
  <Person x={200} y={740} s={1.15} ink="#fff" col={BLUE} label="" t={t} sc={pp(t, 0.4)} wave={0.6 + Math.sin(t * 9) * 0.3} skin="#c98a5e" hair="#1d1420" />
  <T x={700} y={720} s={90} c={DIM} f={KM} sc={pp(t, 1.5)}>lim  = ?</T>
</>;
/* 1 — the limit of 1/x at 0+ */
const OX = 170, OY = 760, UX = 185, UY = 78;
const curve = (() => { let d = ""; for (let i = 0; i <= 80; i++) { const x = 3.9 - (3.9 - 0.125) * (i / 80); d += `${i ? "L" : "M"}${OX + x * UX} ${OY - UY / x} `; } return d; })();
const Limit = (t: number) => { const p = sm((t - 3.6) / 3.4), x = 3.9 - (3.9 - 0.125) * p, px = OX + x * UX, py = OY - UY / x;
  return <>
    <Axes ox={OX} oy={OY} w={800} h={660} p={k(t, 2.6, 0.5)} xl="x" />
    <Draw d={curve} p={p} c={CYAN} w={9} glow />
    <T x={640} y={640} s={54} c={CYAN} f={KI} it sc={pp(t, 3.3)}>y = 1/x</T>
    {t >= 3.6 && <><Draw d={`M${px} ${OY} V${py}`} p={1} c={YEL} w={3} dash="8 8" /><circle cx={px} cy={py} r={15} fill={YEL} style={{ filter: `drop-shadow(0 0 14px ${YEL})` }} /><circle cx={px} cy={OY} r={10} fill={YEL} />
      {x > 0.6 && <T x={px + 10} y={OY + 44} s={34} c={YEL} f={KM}>{x.toFixed(2).replace(".", ",")}</T>}</>}
    <T x={OX - 6} y={OY + 44} s={36} c="#fff" f={KM} sc={k(t, 2.8)}>0</T>
    <Draw d={`M${OX + 330} ${OY + 86} H${OX + 60}`} p={k(t, 4.2, 0.6)} c={RED} w={7} /><Head x={OX + 52} y={OY + 86} p={k(t, 4.2, 0.6)} c={RED} a={180} s={0.7} /><T x={OX + 210} y={OY + 124} s={30} c={RED} f="InterX" sc={pp(t, 4.4)}>x → 0⁺</T>
    <g transform={`translate(700 250) scale(${pp(t, 4.9)})`}><rect x={-270} y={-92} width={600} height={184} rx={30} fill="#0b0b12" stroke={YEL} strokeOpacity={0.7} strokeWidth={4} />
      <T x={-170} y={-14} s={70} c="#fff" f={KM}>lim</T><T x={-170} y={46} s={32} c={DIM} f={KM}>x → 0⁺</T><T x={-30} y={0} s={70} c="#fff" f={KM}>1/x</T>
      <T x={190} y={0} s={74} c={YEL} f={KM} sc={pp(t, 7.4)}>= +∞</T></g>
    <Mark x={890} y={250} rx={124} ry={66} p={k(t, 8.2, 0.5)} c={RED} w={8} seed={4} />
    {t >= 6.2 && <><Draw d={`M${OX + 26} 330 V110`} p={k(t, 6.4, 0.6)} c={YEL} w={7} /><Head x={OX + 26} y={102} p={k(t, 6.4, 0.6)} c={YEL} a={-90} s={0.7} /><T x={OX + 96} y={130} s={64} c={YEL} f={KM} sc={pp(t, 7.0)} glow={YEL}>+∞</T></>}
  </>; };
/* 2 — we work in R, and R is open at both ends */
const LY = 520, LA = 140, LB = 940;
const Reals = (t: number) => { const prob = t >= 15.8, open = t >= 17.2, ask = t >= 22, bx = ask ? 800 - 0 * sm((t - 24.4) / 0.6) + 60 * sm((t - 25.4) / 0.5) : 800, shake = t > 25.3 && t < 25.8 ? Math.sin(t * 90) * 8 : 0;
  return <>
    <Rbar x={540} y={210} s={230} sc={pp(t, 12.6)} c={CYAN} /><T x={540} y={70} s={40} c={DIM} f="InterX" sc={pp(t, 10.3)}>notre terrain de jeu :</T>
    <T x={540} y={350} s={38} c="#fff" f="InterX" sc={ask ? 0 : pp(t, 13.4)}>l’ensemble des nombres réels</T>
    <Draw d={`M${LA} ${LY} H${LB}`} p={k(t, 10.6, 0.9)} c="#fff" w={8} />
    {[-3, -2, -1, 0, 1, 2, 3].map((n, i) => <g key={n} opacity={k(t, 11.2 + i * 0.1)}><line x1={540 + n * 100} y1={LY - 14} x2={540 + n * 100} y2={LY + 14} stroke="#fff" strokeWidth={4} /><T x={540 + n * 100} y={LY + 46} s={30} c={DIM} f={KM}>{n < 0 ? `−${-n}` : n}</T></g>)}
    {/* open ends: hollow circles + outward brackets */}
    {open && <><circle cx={LA} cy={LY} r={16 * pp(t, 18.2)} fill="#050506" stroke={RED} strokeWidth={6} /><circle cx={LB} cy={LY} r={16 * pp(t, 20.2)} fill="#050506" stroke={RED} strokeWidth={6} />
      <T x={LA - 4} y={LY - 70} s={54} c={RED} f={KM} sc={pp(t, 18.2)}>−∞</T><T x={LB + 4 + shake} y={LY - 70} s={54} c={RED} f={KM} sc={pp(t, 20.2)}>+∞</T>
      <g transform={`translate(540 700) scale(${pp(t, 17.4)})`}><rect x={-300} y={-70} width={600} height={140} rx={28} fill="#0b0b12" stroke={RED} strokeOpacity={0.7} strokeWidth={4} />
        <T x={-215} y={0} s={84} c={CYAN} f={AMS}>R</T><T x={-130} y={0} s={70} c="#fff" f={KM}>=</T><T x={95} y={0} s={76} c="#fff" f={KM}><tspan fill={RED}>]</tspan>−∞ , +∞<tspan fill={RED}>[</tspan></T></g>
      <T x={540} y={810} s={34} c={RED} f="InterX" sc={pp(t, 19.0)}>ouvert des deux côtés : les infinis sont exclus</T></>}
    <Chip x={540} y={420} text="MAIS IL Y A UN PROBLÈME" c={RED} sc={prob && !ask ? pp(t, 15.9) : 0} s={46} />
    {ask && <><g transform={`translate(${bx + shake} 300) scale(${pp(t, 22.1)})`}><rect x={-150} y={-50} width={300} height={100} rx={24} fill={YEL} /><T x={0} y={2} s={54} c="#14101f" f={KM}>lim = +∞</T></g>
      <T x={300} y={250} s={110} c={YEL} sc={pp(t, 22.8)} glow={YEL}>?</T>
      <T x={540} y={410} s={56} c={RED} f={KM} sc={pp(t, 25.6)}>+∞ ∉ <tspan fontFamily={AMS}>R</tspan></T><Mark x={540} y={410} rx={170} ry={56} p={k(t, 26.4, 0.5)} c={RED} w={7} seed={6} /></>}
  </>; };
/* 3 — the fix: R bar */
const Bar = (t: number) => { const closed = t >= 38.3, br = t >= 40.4;
  return <>
    <T x={540} y={70} s={40} c={DIM} f="InterX" sc={pp(t, 30.8)}>les mathématiciens ont créé…</T>
    <Rbar x={250} y={230} s={230} sc={pp(t, 32.2)} c={GRN} bar={k(t, 32.7, 0.4)} />
    <T x={690} y={236} s={78} c="#fff" f={KM} sc={pp(t, 34.0)}>= <tspan fontFamily={AMS} fill={CYAN}>R</tspan> ∪ {"{"}<tspan fill={YEL}>−∞</tspan>, <tspan fill={YEL}>+∞</tspan>{"}"}</T>
    <Squig x={690} y={300} w={560} p={k(t, 36.4, 0.5)} c={GRN} />
    <Draw d={`M${LA} ${LY} H${LB}`} p={k(t, 31.2, 0.8)} c="#fff" w={8} />
    {[-3, -2, -1, 0, 1, 2, 3].map((n) => <line key={n} x1={540 + n * 100} y1={LY - 14} x2={540 + n * 100} y2={LY + 14} stroke="#fff" strokeWidth={4} opacity={k(t, 31.6)} />)}
    {[LA, LB].map((x, i) => { const at = 38.5 + i * 0.7, on = t >= at; return <g key={i}><circle cx={x} cy={LY} r={16 + 6 * (on ? pp(t, at) : 0)} fill={on ? GRN : "#050506"} stroke={on ? GRN : RED} strokeWidth={6} style={on ? { filter: `drop-shadow(0 0 14px ${GRN})` } : undefined} opacity={k(t, 31.4)} />
      <T x={x + (i ? 4 : -4)} y={LY - 70} s={54} c={on ? GRN : RED} f={KM} sc={k(t, 31.4) * (1 + (on ? 0.25 * (1 - sat((t - at) / 0.4)) : 0))}>{i ? "+∞" : "−∞"}</T></g>; })}
    <T x={540} y={LY + 70} s={34} c={GRN} f="InterX" sc={closed ? pp(t, 39.4) : 0}>on ajoute les deux infinis</T>
    <g transform={`translate(540 730) scale(${pp(t, 40.5)})`}><rect x={-320} y={-74} width={640} height={148} rx={28} fill="#0b0b12" stroke={GRN} strokeOpacity={0.8} strokeWidth={4} />
      <g transform="translate(-235 0)"><T x={0} y={0} s={84} c={GRN} f={AMS}>R</T><path d="M-28 -44 H28" stroke={GRN} strokeWidth={6} strokeLinecap="round" /></g><T x={-140} y={0} s={70} c="#fff" f={KM}>=</T>
      <T x={95} y={0} s={76} c="#fff" f={KM}><tspan fill={GRN}>[</tspan>−∞ , +∞<tspan fill={GRN}>]</tspan></T></g>
    <Chip x={540} y={846} text="INTERVALLE FERMÉ" c={GRN} sc={br ? pp(t, 41.6) : 0} s={40} />
  </>; };
/* 4 — conclusion */
const End = (t: number) => <>
  <T x={540} y={120} s={44} c={DIM} f="InterX" sc={pp(t, 43.9)}>donc, pour les limites :</T>
  <g transform={`translate(540 330) scale(${pp(t, 44.4)})`}><rect x={-440} y={-110} width={880} height={220} rx={36} fill="#0b0b12" stroke={YEL} strokeOpacity={0.8} strokeWidth={5} style={{ filter: `drop-shadow(0 0 26px ${YEL}55)` }} />
    <T x={-300} y={-14} s={80} c="#fff" f={KM}>lim</T><T x={-300} y={54} s={34} c={DIM} f={KM}>x → 0⁺</T><T x={-150} y={0} s={80} c="#fff" f={KM}>1/x</T><T x={60} y={0} s={80} c={YEL} f={KM}>= +∞</T>
    <T x={250} y={0} s={80} c={GRN} f={KM} sc={pp(t, 45.6)}>∈</T><g transform={`translate(350 0) scale(${pp(t, 45.9)})`}><T x={0} y={0} s={96} c={GRN} f={AMS}>R</T><path d="M-32 -50 H32" stroke={GRN} strokeWidth={7} strokeLinecap="round" /></g></g>
  <Tick x={540} y={540} ok sc={pp(t, 46.6)} s={2.4} />
  <Person x={250} y={800} s={1.0} ink="#fff" col={BLUE} label="" t={t} sc={pp(t, 44.8)} wave={0.7 + Math.sin(t * 8) * 0.3} skin="#c98a5e" hair="#1d1420" />
  <T x={640} y={720} s={64} c="#fff" sc={pp(t, 47.0)}>ON TRAVAILLE DANS</T><Rbar x={640} y={820} s={120} sc={pp(t, 47.5)} c={GRN} bar={1} />
</>;
type Scene = { a: number; r: (t: number) => React.ReactNode; cam: Key[] };
const SCENES: Scene[] = [
  { a: 0, r: Hook, cam: [[0, 540, 450, 1.0], [2.4, 540, 450, 1.12]] },
  { a: 2.45, r: Limit, cam: [[2.45, 540, 450, 1.0], [3.6, 600, 560, 1.25], [6.0, 420, 420, 1.45], [7.0, 560, 330, 1.4], [8.4, 700, 280, 1.55], [10, 620, 400, 1.1]] },
  { a: 10.05, r: Reals, cam: [[10.05, 540, 450, 1.0], [12.6, 540, 300, 1.35], [15.2, 540, 420, 1.1], [16.0, 540, 430, 1.4], [17.2, 540, 520, 1.1], [18.4, 300, 520, 1.6], [19.8, 300, 520, 1.6], [20.6, 800, 520, 1.6], [21.6, 780, 600, 1.3], [22.2, 540, 400, 1.15], [24.4, 700, 360, 1.5], [27, 600, 430, 1.5], [29.8, 540, 450, 1.05]] },
  { a: 30.6, r: Bar, cam: [[30.6, 540, 450, 1.0], [32.3, 360, 250, 1.5], [34, 600, 250, 1.35], [38, 600, 280, 1.3], [38.6, 300, 500, 1.55], [39.2, 780, 500, 1.55], [40.3, 540, 520, 1.15], [41, 540, 720, 1.45], [43.7, 540, 700, 1.5]] },
  { a: 43.75, r: End, cam: [[43.75, 540, 450, 1.0], [44.6, 540, 340, 1.3], [46.4, 560, 380, 1.35], [47.2, 540, 600, 1.1], [49.66, 560, 640, 1.2]] },
];
const BEATS = [0.15, 0.7, 1.5, 3.3, 4.9, 7.0, 7.4, 8.2, 12.6, 13.4, 15.9, 17.4, 18.2, 20.2, 22.1, 22.8, 25.4, 25.6, 32.2, 34.0, 36.4, 38.5, 39.2, 40.5, 41.6, 44.4, 45.6, 46.6, 47.5];
const SUBS: [number, number, string][] = [[0.1, 2.4, "*Suis-moi* bien."], [2.5, 4.6, "Imagine la *limite*, quand *x tend vers 0*…"], [4.6, 6.7, "…par valeurs positives, de *1 sur x*."], [6.8, 10.0, "Cette limite vaut *plus l’infini*."],
  [10.1, 12.7, "Et nous, on étudie toujours…"], [12.7, 15.3, "…dans l’ensemble des *nombres réels*, ℝ."], [15.8, 17.1, "Mais il y a un *problème*."], [17.2, 19.6, "ℝ, c’est un intervalle *ouvert* en moins l’infini…"], [19.6, 21.8, "…et *ouvert* en plus l’infini."],
  [22.0, 24.5, "Alors comment la limite peut valoir *plus l’infini* ?"], [24.5, 27.2, "Dans ℝ, les infinis sont *exclus*…"], [27.2, 29.9, "…l’intervalle est *ouvert* des deux côtés."],
  [30.7, 33.8, "Les mathématiciens ont créé un ensemble : *ℝ barre*."], [33.9, 38.3, "ℝ *union* moins l’infini, plus l’infini."], [38.3, 40.4, "Ils ont *ajouté* moins l’infini et plus l’infini…"], [40.4, 43.7, "…ça donne l’intervalle *fermé*."],
  [43.8, 46.4, "Donc pour les *limites*…"], [46.4, 49.4, "…on travaille dans *ℝ barre*."]];

const SH = 900, TOP = 430;
const Strip: React.FC = () => {
  const f = useCurrentFrame(), t = orig(f);
  let i = 0; for (let j = 0; j < SCENES.length; j++) if (t >= SCENES[j].a) i = j;
  const sc = SCENES[i], u = t - sc.a, [cx0, cy0, zr] = cam(sc.cam, t), z0 = soft(zr), cx = 540 + (cx0 - 540) * 0.45, cy = 450 + (cy0 - 450) * 0.45;
  const beat = Math.max(0, ...BEATS.map((b) => (t >= b ? 1 - sat((t - b) / 0.18) : 0))), z = z0 * (1 + beat * 0.03);
  const dir = i % 2 ? 1 : -1, gl = i === 0 ? 0 : sat(1 - u / 0.14), dx = 22 * gl * dir, g = Math.floor(t * 15);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#050506" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs><filter id="m2rgb" x="-4%" width="108%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={dx} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-dx} result="bo" />
        <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" /></filter></defs></svg>
      <div style={{ position: "absolute", inset: 0, filter: gl > 0 ? "url(#m2rgb)" : undefined }}>
        <div style={{ position: "absolute", width: 900, height: 900, left: -330 + Math.sin(t * 0.5) * 60 - (cx - 540) * 0.15, top: -360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.55), transparent 62%)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", width: 950, height: 950, right: -360 + Math.cos(t * 0.4) * 60 + (cx - 540) * 0.15, bottom: -300, borderRadius: "50%", background: "radial-gradient(circle, rgba(40,224,255,0.5), transparent 62%)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", width: 700, height: 700, left: 220 + Math.sin(t * 0.3) * 120, top: 760, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,92,255,0.26), transparent 60%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", inset: -200, opacity: 0.5, backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1.4px, transparent 1.4px)", backgroundSize: `${50 * z}px ${50 * z}px`, backgroundPosition: `${-cx * z * 0.6}px ${-cy * z * 0.6}px` }} />
        <svg width={1080} height={SH} viewBox={`0 0 1080 ${SH}`} style={{ position: "absolute", left: 0, top: TOP, overflow: "visible" }}>
          <g transform={`translate(${540 - cx * z} ${450 - cy * z}) scale(${z})`}>{sc.r(t)}</g></svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: i === 0 ? 0 : sat(1 - u * 13) * 0.4 }} />
      {gl > 0.3 ? [0, 1].map((b) => <div key={b} style={{ position: "absolute", left: 0, right: 0, top: (g * 131 + b * 311) % 1800, height: 18 + ((g * 17 + b * 29) % 40),
        background: b ? "rgba(40,224,255,0.25)" : "rgba(255,45,45,0.25)", transform: `translateX(${((g * 53 + b * 97) % 60) - 30}px)` }} />) : null}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("series/grain.png")})`, backgroundPosition: `${(g * 173) % 512}px ${(g * 311) % 512}px`, opacity: 0.14, mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(0,0,0,0.55)" }} />
    </div>
  );
};
const Subs: React.FC = () => {
  const t = orig(useCurrentFrame()), s = SUBS.find((x) => t >= x[0] && t < x[1]); if (!s) return null;
  const p = eo((t - s[0]) / 0.2);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1470, textAlign: "center", fontFamily: "InterX", fontWeight: 800, fontSize: 60, lineHeight: 1.25, color: "#fff", opacity: p, transform: `scale(${0.92 + 0.08 * p})`,
      textShadow: "0 0 18px #000, 0 4px 10px #000, 0 0 4px #000" }}>
      {s[2].split("*").map((part, i) => (i % 2 ? <span key={i} style={{ color: YEL }}>{part}</span> : <span key={i}>{part}</span>))}
    </div>
  );
};
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, fr(at))} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);
export const Mont2: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame();
  const [h] = useState(() => delayRender("katex + display fonts"));
  useEffect(() => {
    Promise.all(["400 40px KaTeX_Main", "italic 40px KaTeX_Math", "40px KaTeX_AMS", "40px Anton"].map((x) => document.fonts.load(x, "fRx∞∪∈∉")))
      .catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  const to = orig(f), face = faceOn(to), fw = FACE.find(([a, b]) => to >= a && to < b), fu = fw ? to - fw[0] : 0, cut = fw ? sat(1 - fu / 0.14) : 0, gi = SEG.findIndex((x, i) => f >= x.o && (i === SEG.length - 1 || f < SEG[i + 1].o));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Strip />
      {/* the speaker, full screen, only on the key moments; every jump cut gets a slightly different framing */}
      {face ? <AbsoluteFill style={{ overflow: "hidden" }}>
        {SEG.map((g, i) => <Sequence key={i} from={g.o} durationInFrames={g.b - g.a} layout="none">
          <OffthreadVideo src={staticFile("mont2/src.mp4")} muted startFrom={g.a} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${1.1 + (i % 2) * 0.07 + 0.04 * sat(fu / 2.4)}) translateX(${cut * 14}px)`, transformOrigin: "50% 48%", filter: "contrast(1.06) saturate(1.12)" }} />
        </Sequence>)}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(0,0,0,0.45), transparent 22%, transparent 55%, rgba(0,0,0,0.8))" }} />
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: cut * 0.45 }} />
      </AbsoluteFill> : null}
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: 1080 * sat(f / MONT2_FRAMES), background: RED, boxShadow: `0 0 16px ${RED}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: "InterX", fontWeight: 800, fontSize: 30, letterSpacing: 5, color: "rgba(255,255,255,0.7)" }}>ANALYSE · LA DROITE RÉELLE ACHEVÉE</div>
      <Subs />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [MONT2_FRAMES - 8, MONT2_FRAMES - 1], [0, 1], clamp) }} />
      <Audio src={staticFile("mont2/voice_cut.m4a")} />
      <Audio src={staticFile("mont2/bed.wav")} volume={(x) => interpolate(x, [0, 15, MONT2_FRAMES - 30, MONT2_FRAMES - 2], [0, 0.07, 0.07, 0], clamp)} />
      {[...SCENES.slice(1).map((x) => x.a), ...FACE.flat().filter((x) => x > 0)].map((x, i) => <Sfx key={`c${i}`} at={outT(x) - 0.03} src="whoosh" v={0.24} />)}
      {BEATS.filter((x) => !faceOn(x)).map((x, i) => <Sfx key={`b${i}`} at={outT(x) - 0.02} src={i % 3 === 0 ? "pop" : i % 3 === 1 ? "tick" : "swipe"} v={0.16} />)}
      {[7.4, 34.0, 41.6, 46.6].map((x) => <Sfx key={`d${x}`} at={outT(x)} src="ding" v={0.22} />)}
    </AbsoluteFill>
  );
};
