// Clip renderers for "La complexité" (1920x1080). Every clip is a small hand-made motion graphic
// driven by local time u (s) and its duration d. Kinds are referenced from script.json.
import React from "react";

export const RED = "#ff2d2d", BLUE = "#2f7bff", YEL = "#ffd23f", GRN = "#27c26c", PUR = "#9b5cff", CYAN = "#28e0ff";
export const sat = (x: number) => Math.min(1, Math.max(0, x));
export const eo = (x: number) => 1 - Math.pow(1 - sat(x), 3);
const k = (u: number, at = 0, d = 0.3) => eo((u - at) / d);
const pp = (u: number, at = 0, d = 0.32) => { const x = sat((u - at) / d); if (x <= 0) return 0; const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const rnd = (i: number, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
const fit = (txt: string, max: number, w = 1650, cw = 0.5) => Math.min(max, w / (Math.max(1, txt.length) * cw));
export type Ctx = { u: number; d: number; ink: string; dim: string; bg: string };
type A = unknown[];

const Draw: React.FC<{ d: string; p: number; c: string; w?: number; dash?: string; glow?: boolean }> = ({ d, p, c, w = 10, dash, glow }) => (
  dash ? <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} opacity={sat(p)} />
    : <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sat(p)}
      style={glow ? { filter: `drop-shadow(0 0 14px ${c})` } : undefined} />
);
const T: React.FC<{ x: number; y: number; s?: number; c?: string; f?: string; children: React.ReactNode; sc?: number; rot?: number; anchor?: "start" | "middle" | "end"; it?: boolean; glow?: string; ls?: number; op?: number }> = ({
  x, y, s = 80, c = "#fff", f = "Anton", children, sc = 1, rot = 0, anchor = "middle", it, glow, ls = 0, op = 1 }) => (
  sc <= 0.001 ? null : <text transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} fontFamily={f} fontSize={s} fill={c} textAnchor={anchor} dominantBaseline="central" opacity={op}
    fontStyle={it ? "italic" : undefined} letterSpacing={ls} style={glow ? { filter: `drop-shadow(0 0 18px ${glow})` } : undefined}>{children}</text>
);
const Pill: React.FC<{ x: number; y: number; text: string; c?: string; fg?: string; s?: number; sc?: number }> = ({ x, y, text, c = RED, fg = "#fff", s = 64, sc = 1 }) => {
  const w = text.length * s * 0.5 + s * 1.2;
  return sc <= 0.001 ? null : <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-w / 2} y={-s * 0.75} width={w} height={s * 1.5} rx={s * 0.4} fill={c} /><T x={0} y={2} s={s} c={fg}>{text}</T></g>;
};
const Head: React.FC<{ x: number; y: number; p: number; c: string; a?: number; s?: number }> = ({ x, y, p, c, a = 0, s = 1 }) => (
  p < 0.95 ? null : <path d="M-30 -22 L10 0 L-30 22 Z" fill={c} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} />
);
const Cell: React.FC<{ x: number; y: number; w: number; h?: number; fill?: string; stroke: string; txt?: string | number; tc?: string; sc?: number; ts?: number; sw?: number }> = ({ x, y, w, h = w, fill = "none", stroke, txt, tc, sc = 1, ts, sw = 6 }) => (
  sc <= 0.001 ? null : <g transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={fill} stroke={stroke} strokeWidth={sw} />
    {txt !== undefined && <T x={0} y={3} s={ts ?? h * 0.5} c={tc ?? stroke} f="KaTeX_Main">{txt}</T>}</g>
);

/* ---------- icons (drawn around 0,0 in a ~400px box) ---------- */
const ICONS: Record<string, (ink: string, u: number) => React.ReactNode> = {
  stopwatch: (ink, u) => <><circle r={150} fill="none" stroke={ink} strokeWidth={22} /><rect x={-22} y={-205} width={44} height={50} fill={ink} /><rect x={-50} y={-225} width={100} height={28} rx={10} fill={ink} />
    <line x1={0} y1={0} x2={Math.sin(u * 4) * 110} y2={-Math.cos(u * 4) * 110} stroke={RED} strokeWidth={16} strokeLinecap="round" /><circle r={16} fill={RED} /></>,
  snail: (ink, u) => <g transform={`translate(${-60 + u * 14} 40)`}><path d="M-210 90 H190 Q250 90 250 30 V-40" fill="none" stroke={ink} strokeWidth={36} strokeLinecap="round" />
    <circle cx={-20} cy={-20} r={120} fill={YEL} stroke={ink} strokeWidth={18} /><path d="M-20 -20 m-60 0 a60 60 0 1 1 60 60 a36 36 0 1 1 -30 -52" fill="none" stroke={ink} strokeWidth={14} />
    <line x1={250} y1={-40} x2={230} y2={-110} stroke={ink} strokeWidth={12} /><line x1={250} y1={-40} x2={290} y2={-105} stroke={ink} strokeWidth={12} /><circle cx={228} cy={-116} r={12} fill={ink} /><circle cx={292} cy={-110} r={12} fill={ink} /></g>,
  plane: (ink, u) => <g transform={`translate(${-80 + u * 40} ${20 - u * 14}) rotate(-12)`}><path d="M-220 0 L200 -30 Q250 -20 200 10 L-220 30 Z" fill={ink} /><path d="M-40 -5 L40 -170 L90 -170 L60 -10 Z M-40 20 L30 150 L80 150 L60 15 Z M-200 0 L-230 -80 L-190 -80 L-150 0 Z" fill={RED} /></g>,
  sun: (ink, u) => <>{Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-12} y={-230} width={24} height={60} rx={12} fill={YEL} transform={`rotate(${i * 30 + u * 20})`} />)}
    <circle r={140 + Math.sin(u * 5) * 6} fill={YEL} stroke={RED} strokeWidth={14} /></>,
  database: (ink, u) => <>{[-110, 0, 110].map((y, i) => <g key={i}><path d={`M-170 ${y - 40} V${y + 40} A170 46 0 0 0 170 ${y + 40} V${y - 40}`} fill={i === Math.floor(u * 3) % 3 ? RED : "none"} stroke={ink} strokeWidth={16} />
    <ellipse cx={0} cy={y - 40} rx={170} ry={46} fill="none" stroke={ink} strokeWidth={16} /></g>)}</>,
  server: (ink, u) => <>{[-130, 0, 130].map((y, i) => <g key={i}><rect x={-210} y={y - 52} width={420} height={104} rx={18} fill="none" stroke={ink} strokeWidth={16} />
    {[0, 1, 2].map((j) => <circle key={j} cx={-150 + j * 50} cy={y} r={15} fill={Math.sin(u * 14 + i * 2 + j) > 0 ? RED : ink} />)}<rect x={40} y={y - 10} width={130} height={20} rx={10} fill={ink} /></g>)}</>,
  lock: (ink) => <><path d="M-90 -40 V-110 A90 90 0 0 1 90 -110 V-40" fill="none" stroke={ink} strokeWidth={30} /><rect x={-150} y={-40} width={300} height={230} rx={30} fill={YEL} stroke={ink} strokeWidth={16} /><circle cy={50} r={30} fill={ink} /><rect x={-11} y={60} width={22} height={70} fill={ink} /></>,
  unlock: (ink, u) => <><g transform={`rotate(${-34 * k(u, 0.3, 0.4)} 90 -40)`}><path d="M-90 -40 V-110 A90 90 0 0 1 90 -110 V-40" fill="none" stroke={ink} strokeWidth={30} /></g>
    <rect x={-150} y={-40} width={300} height={230} rx={30} fill={RED} stroke={ink} strokeWidth={16} /><circle cy={50} r={30} fill={ink} /><rect x={-11} y={60} width={22} height={70} fill={ink} /></>,
  dollar: (ink, u) => <><circle r={190} fill={YEL} stroke={ink} strokeWidth={18} transform={`scale(${Math.abs(Math.cos(u * 3)) * 0.7 + 0.3} 1)`} /><T x={0} y={8} s={280} c={ink}>$</T></>,
  hourglass: (ink, u) => <g transform={`rotate(${Math.floor(u / 1.6) * 180 + eo((u % 1.6 - 1.3) / 0.3) * 180})`}><path d="M-130 -200 H130 M-130 200 H130 M-110 -200 C-110 -60 -20 -40 -20 0 C-20 40 -110 60 -110 200 M110 -200 C110 -60 20 -40 20 0 C20 40 110 60 110 200" fill="none" stroke={ink} strokeWidth={20} strokeLinecap="round" />
    <path d="M-70 -120 H70 L0 -20 Z" fill={YEL} /><path d="M-90 190 H90 L0 110 Z" fill={YEL} /></g>,
  calendar: (ink, u) => <><rect x={-200} y={-170} width={400} height={360} rx={30} fill="none" stroke={ink} strokeWidth={18} /><rect x={-200} y={-170} width={400} height={90} rx={30} fill={RED} />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-160 + (i % 4) * 85} y={-50 + Math.floor(i / 4) * 75} width={62} height={52} rx={10} fill={i <= Math.floor(u * 6) ? GRN : "none"} stroke={ink} strokeWidth={8} />)}</>,
  wall: (ink) => <>{Array.from({ length: 20 }).map((_, i) => { const r = Math.floor(i / 4), c = i % 4; return <rect key={i} x={-240 + c * 125 + (r % 2 ? -60 : 0)} y={-200 + r * 82} width={115} height={72} rx={8} fill={RED} stroke={ink} strokeWidth={8} />; })}</>,
  bulb: (ink, u) => <><path d="M-70 110 C-70 40 -150 10 -150 -80 A150 150 0 0 1 150 -80 C150 10 70 40 70 110 Z" fill={Math.sin(u * 8) > -0.3 ? YEL : "none"} stroke={ink} strokeWidth={18} /><rect x={-60} y={130} width={120} height={28} rx={10} fill={ink} /><rect x={-40} y={172} width={80} height={24} rx={10} fill={ink} /></>,
  atom: (ink, u) => <>{[0, 60, 120].map((a, i) => <g key={a} transform={`rotate(${a})`}><ellipse rx={230} ry={84} fill="none" stroke={ink} strokeWidth={12} />
    <circle cx={Math.cos(u * 5 + i * 2) * 230} cy={Math.sin(u * 5 + i * 2) * 84} r={20} fill={CYAN} /></g>)}<circle r={44} fill={RED} /></>,
  rocket: (ink, u) => <g transform={`translate(0 ${60 - u * 40}) rotate(0)`}><path d="M0 -240 C110 -150 110 40 70 120 H-70 C-110 40 -110 -150 0 -240 Z" fill="#fff" stroke={ink} strokeWidth={16} /><circle cy={-70} r={40} fill={BLUE} stroke={ink} strokeWidth={12} />
    <path d="M-80 60 L-150 170 L-70 130 Z M80 60 L150 170 L70 130 Z" fill={RED} /><path d={`M-45 124 Q0 ${230 + Math.sin(u * 30) * 40} 45 124 Z`} fill={YEL} /></g>,
  cache: (ink, u) => <><rect x={-200} y={-140} width={400} height={280} rx={30} fill="none" stroke={ink} strokeWidth={18} /><path d="M30 -110 L-60 20 H10 L-30 120 L80 -20 H10 Z" fill={YEL} stroke={ink} strokeWidth={10} transform={`scale(${1 + Math.sin(u * 8) * 0.06})`} /></>,
  gps: (ink, u) => <><path d="M0 200 C-160 20 -150 -200 0 -200 C150 -200 160 20 0 200 Z" fill={RED} stroke={ink} strokeWidth={16} transform={`translate(0 ${-Math.abs(Math.sin(u * 5)) * 30})`} /><circle cy={-70 - Math.abs(Math.sin(u * 5)) * 30} r={56} fill="#fff" /></>,
  spell: (ink, u) => <><T x={0} y={-30} s={170} c={ink} f="KaTeX_Main">algoritme</T><path d="M-330 60 q22 -30 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0" fill="none" stroke={RED} strokeWidth={12} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k(u, 0.2, 0.5)} /></>,
  dna: (ink, u) => <>{Array.from({ length: 14 }).map((_, i) => { const y = -230 + i * 36, a = i * 0.55 + u * 3, x = Math.sin(a) * 120; return <g key={i}><line x1={x} y1={y} x2={-x} y2={y} stroke={ink} strokeWidth={8} opacity={0.5} />
    <circle cx={x} cy={y} r={20} fill={RED} /><circle cx={-x} cy={y} r={20} fill={BLUE} /></g>; })}</>,
};

/* ---------- data for the algorithm animations ---------- */
const V0 = [7, 3, 10, 1, 8, 5, 12, 2, 9, 4, 11, 6];
type St = { a: number[]; hi: number[]; piv?: number };
const bubbleSteps = (() => { const a = [...V0], out: St[] = [{ a: [...a], hi: [] }]; for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length - 1 - i; j++) { if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]]; out.push({ a: [...a], hi: [j, j + 1] }); } return out; })();
const mergeSteps = (() => { let a = [...V0]; const out: St[] = [{ a: [...a], hi: [] }]; for (let w = 1; w < a.length; w *= 2) { const b = [...a]; for (let lo = 0; lo < a.length; lo += 2 * w) { let i = lo, j = Math.min(lo + w, a.length); const mid = j, hi = Math.min(lo + 2 * w, a.length);
  for (let q = lo; q < hi; q++) { b[q] = i < mid && (j >= hi || a[i] <= a[j]) ? a[i++] : a[j++]; const s = [...a]; for (let z = lo; z <= q; z++) s[z] = b[z]; out.push({ a: s, hi: [q] }); } } a = b; } return out; })();
const quickSteps = (() => { const a = [...V0], out: St[] = [{ a: [...a], hi: [] }]; const qs = (lo: number, hi: number) => { if (lo >= hi) return; const p = a[hi]; let i = lo; for (let j = lo; j < hi; j++) { if (a[j] < p) { [a[i], a[j]] = [a[j], a[i]]; i++; } out.push({ a: [...a], hi: [j, i], piv: hi }); }
  [a[i], a[hi]] = [a[hi], a[i]]; out.push({ a: [...a], hi: [i], piv: i }); qs(lo, i - 1); qs(i + 1, hi); }; qs(0, a.length - 1); return out; })();
const SBars: React.FC<{ st: St; ink: string; done?: boolean }> = ({ st, ink, done }) => <>
  {st.a.map((v, i) => <rect key={i} x={250 + i * 120} y={900 - v * 58} width={96} height={v * 58} rx={12} fill={done ? GRN : st.piv === i ? YEL : st.hi.includes(i) ? RED : ink} />)}
  <line x1={220} y1={908} x2={1700} y2={908} stroke={ink} strokeWidth={8} /></>;
const CITIES = [[360, 260], [760, 170], [1180, 240], [1560, 200], [1620, 560], [1330, 800], [900, 620], [520, 820], [300, 560]];
const route = (order: number[]) => "M" + order.map((i) => `${CITIES[i][0]} ${CITIES[i][1]}`).join(" L") + " Z";
const NN = (() => { const left = CITIES.map((_, i) => i).slice(1), o = [0]; while (left.length) { const c = CITIES[o[o.length - 1]]; left.sort((a, b) => Math.hypot(CITIES[a][0] - c[0], CITIES[a][1] - c[1]) - Math.hypot(CITIES[b][0] - c[0], CITIES[b][1] - c[1])); o.push(left.shift()!); } return o; })();
const treePos = (lv: number, i: number, top = 190, gap = 190): [number, number] => [960 + ((i + 0.5) / 2 ** lv - 0.5) * 1560, top + lv * gap];
const FIB = [["fib(5)"], ["fib(4)", "fib(3)"], ["fib(3)", "fib(2)", "fib(2)", "fib(1)"], ["fib(2)", "fib(1)", "fib(1)", "fib(0)", "fib(1)", "fib(0)", "", ""]];
const BST = [[50], [30, 70], [20, 40, 60, 80]];
const CURVES: Record<string, { f: (x: number) => number; c: string; l: string }> = {
  "1": { f: () => 0.07, c: GRN, l: "O(1)" }, log: { f: (x) => 0.06 + 0.22 * Math.log2(1 + 31 * x) / 5, c: CYAN, l: "O(log n)" }, n: { f: (x) => x * 0.62, c: BLUE, l: "O(n)" },
  nlogn: { f: (x) => x * Math.log2(1 + 7 * x) / 3 * 0.92, c: PUR, l: "O(n log n)" }, n2: { f: (x) => x * x * 1.9, c: YEL, l: "O(n²)" }, "2n": { f: (x) => (Math.pow(2, 9 * x) - 1) / 60, c: RED, l: "O(2ⁿ)" },
};

/* ---------- renderers ---------- */
export const R: Record<string, (a: A, c: Ctx) => React.ReactNode> = {
  chap: ([n, title], { u }) => <>
    <rect x={0} y={0} width={1920 * k(u, 0, 0.35)} height={1080} fill={RED} /><T x={420} y={520} s={520} c="#fff" sc={pp(u, 0.1)} op={0.95}>{n as string}</T>
    <rect x={760} y={420} width={12} height={240 * k(u, 0.2, 0.3)} fill="#fff" /><T x={820} y={540} s={fit(title as string, 130, 1000)} c="#fff" anchor="start" sc={k(u, 0.25, 0.3)}>{(title as string).toUpperCase()}</T></>,
  slam: ([txt, sub], { u, ink, dim }) => { const s = fit(txt as string, 330); const g = u < 0.35 ? 14 : 3; return <>
    <T x={960 + g} y={sub ? 480 : 540} s={s} c={RED} sc={pp(u, 0.03)}>{txt as string}</T><T x={960 - g} y={sub ? 480 : 540} s={s} c={CYAN} sc={pp(u, 0.03)}>{txt as string}</T><T x={960} y={sub ? 480 : 540} s={s} c={ink} sc={pp(u, 0.03)}>{txt as string}</T>
    {sub ? <T x={960} y={480 + s * 0.75 + 30} s={76} c={dim} f="InterX" sc={k(u, 0.3, 0.25)}>{sub as string}</T> : null}</>; },
  slamr: ([txt, sub], { u }) => { const s = fit(txt as string, 330); return <><T x={960} y={sub ? 480 : 540} s={s} c="#fff" sc={pp(u, 0.03)} rot={-3}>{txt as string}</T>
    {sub ? <T x={960} y={480 + s * 0.75 + 40} s={80} c="#ffd9d9" f="InterX" sc={k(u, 0.3, 0.25)}>{sub as string}</T> : null}</>; },
  tex: ([txt, sub], { u, ink }) => { const s = fit(txt as string, 430, 1650, 0.52); return <>
    <T x={960} y={sub ? 460 : 540} s={s} c={ink} f="KaTeX_Main" sc={pp(u, 0.05)} glow={ink === "#ffffff" ? BLUE : undefined}>{txt as string}</T>
    {sub ? <Pill x={960} y={460 + s * 0.62 + 90} text={sub as string} sc={pp(u, 0.45)} s={70} /> : null}</>; },
  icon: ([name, label], { u, ink }) => <><g transform={`translate(960 ${label ? 450 : 540}) scale(${1.5 * pp(u, 0.03)})`}>{(ICONS[name as string] ?? ICONS.bulb)(ink, u)}</g>
    {label ? <Pill x={960} y={920} text={label as string} sc={pp(u, 0.35)} s={78} /> : null}</>,
  list: ([title, items], { u, d, ink }) => { const it = items as string[], gap = Math.min(150, 740 / it.length), s = Math.min(96, gap * 0.66); return <>
    <T x={960} y={130} s={fit(title as string, 84, 1500)} c={RED} sc={pp(u, 0)}>{title as string}</T><rect x={960 - 260 * k(u, 0.1)} y={190} width={520 * k(u, 0.1)} height={8} fill={ink} />
    {it.map((x, i) => { const at = 0.25 + (i * Math.max(0.2, d - 1.2)) / it.length, p = pp(u, at); return <g key={i} transform={`translate(${(1 - k(u, at, 0.25)) * -80} 0)`} opacity={sat(p)}>
      <rect x={300} y={290 + i * gap - s * 0.5} width={s} height={s} rx={16} fill={RED} /><T x={300 + s / 2} y={293 + i * gap} s={s * 0.62} c="#fff">{i + 1}</T>
      <T x={340 + s} y={293 + i * gap} s={s} c={ink} f="InterX" anchor="start">{x}</T></g>; })}</>; },
  vs: ([l, r, ls, rs], { u }) => { const sl = fit(l as string, 230, 800), sr = fit(r as string, 230, 800); return <>
    <rect x={0} y={0} width={960} height={1080} fill="#f3f1ea" /><rect x={960} y={0} width={960} height={1080} fill="#0b0b12" />
    <T x={480 - (1 - k(u, 0, 0.3)) * 300} y={ls ? 480 : 540} s={sl} c="#141414" f={/[()²ⁿ∞]/.test(l as string) ? "KaTeX_Main" : "Anton"}>{l as string}</T>
    <T x={1440 + (1 - k(u, 0.35, 0.3)) * 300} y={rs ? 480 : 540} s={sr} c={u > 0.35 ? YEL : "#0b0b12"} f={/[()²ⁿ∞]/.test(r as string) ? "KaTeX_Main" : "Anton"}>{r as string}</T>
    {ls ? <T x={480} y={680} s={68} c={RED} f="InterX" sc={k(u, 0.25)}>{ls as string}</T> : null}{rs ? <T x={1440} y={680} s={68} c="#c9cde0" f="InterX" sc={k(u, 0.6)}>{rs as string}</T> : null}
    <rect x={954} y={0} width={12} height={1080 * k(u, 0, 0.3)} fill={RED} /><circle cx={960} cy={540} r={70 * pp(u, 0.2)} fill={RED} /><T x={960} y={544} s={56} c="#fff" sc={pp(u, 0.2)}>VS</T></>; },
  curve: ([kinds], { u, d, ink, dim }) => { const ks = kinds as string[], X = (x: number) => 260 + x * 1400, Y = (y: number) => 900 - y * 760; return <>
    <Draw d="M260 900 H1720 M260 900 V110" p={k(u, 0, 0.35)} c={ink} w={10} /><T x={1750} y={955} s={70} c={dim} f="KaTeX_Math" it>n</T><T x={150} y={150} s={56} c={dim} f="InterX">temps</T>
    {ks.map((kk, i) => { const cv = CURVES[kk], p = k(u, 0.25 + i * Math.min(0.5, (d - 1.2) / ks.length), Math.min(1.1, d * 0.4)); let path = "", lx = 0, ly = 0;
      for (let j = 0; j <= 60; j++) { const x = j / 60, y = cv.f(x); if (y > 1) break; path += `${j ? "L" : "M"}${X(x)} ${Y(y)} `; lx = X(x); ly = Y(y); }
      return <g key={kk}><Draw d={path} p={p} c={cv.c} w={14} glow={ink === "#ffffff"} /><T x={Math.min(1680, lx + 20)} y={ly < 200 ? 80 + i * 62 : ly - 50} s={ks.length > 3 ? 54 : 78} c={cv.c} f="KaTeX_Main" sc={pp(u, 0.6 + i * 0.3)}
        anchor={lx > 1500 ? "end" : "start"}>{cv.l}</T></g>; })}</>; },
  bars: ([labels, vals, tops], { u, ink }) => { const L = labels as string[], V = vals as number[], Tp = tops as string[], w = Math.min(300, 1400 / L.length - 40), x0 = 960 - (L.length * (w + 40)) / 2 + 20; return <>
    <line x1={200} y1={880} x2={1720} y2={880} stroke={ink} strokeWidth={8} />
    {L.map((l, i) => { const h = Math.max(10, V[i] * 640) * k(u, 0.15 + i * 0.18, 0.5); return <g key={i}><rect x={x0 + i * (w + 40)} y={880 - h} width={w} height={h} rx={14} fill={[BLUE, YEL, RED, PUR][i % 4]} />
      <T x={x0 + i * (w + 40) + w / 2} y={950} s={Math.min(70, w * 0.4)} c={ink} f="KaTeX_Main">{l}</T>
      {Tp[i] ? <T x={x0 + i * (w + 40) + w / 2} y={880 - h - 50} s={fit(Tp[i], 60, w + 30, 0.5)} c={ink} sc={pp(u, 0.5 + i * 0.18)}>{Tp[i]}</T> : null}</g>; })}</>; },
  num: ([txt, label], { u, d, ink }) => { const s = txt as string, n = Math.ceil(sat(u / Math.min(1.6, d * 0.6)) * s.length); return <>
    <T x={960} y={470} s={fit(s, 300, 1700, 0.5)} c={ink}>{s.slice(0, n)}</T>{label ? <Pill x={960} y={720} text={label as string} sc={pp(u, 0.5)} s={72} /> : null}</>; },
  code: ([lines, hi], { u, d }) => { const L = lines as string[], tot = L.join("").length, shown = Math.floor(sat(u / Math.min(2.2, d * 0.7)) * tot); let acc = 0; return <>
    <rect x={210} y={170} width={1500} height={740} rx={30} fill="#11131f" stroke="#2c3152" strokeWidth={6} /><rect x={210} y={170} width={1500} height={80} rx={30} fill="#1c2036" />
    {[RED, YEL, GRN].map((c, i) => <circle key={c} cx={270 + i * 50} cy={210} r={16} fill={c} />)}
    {L.map((l, i) => { const st = acc; acc += l.length; const vis = l.slice(0, Math.max(0, shown - st)); return <g key={i}>
      {i === hi && shown >= acc ? <rect x={230} y={318 + i * 130} width={1460} height={110} rx={12} fill={RED} opacity={0.25} /> : null}
      <T x={260} y={375 + i * 130} s={50} c="#56607f" f="monospace" anchor="start">{i + 1}</T>
      <T x={350} y={375 + i * 130} s={fit(l, 76, 1300, 0.6)} c={/^\s*(def|for|if|return)/.test(l) ? "#ff79c6" : l.includes("#") || l.includes("?") ? YEL : "#e9ecff"} f="monospace" anchor="start"><tspan style={{ whiteSpace: "pre" }} xmlSpace="preserve">{vis}</tspan></T></g>; })}</>; },
  search: ([mode], { u, d, ink, dim }) => { const m = mode as string, N = 13, X = (i: number) => 240 + i * 120, vals = m === "max" ? [4, 9, 2, 7, 15, 3, 8, 21, 6, 1, 12, 5, 10] : Array.from({ length: N }).map((_, i) => 3 + i * 4);
    if (m === "binary") { const steps = [[0, 12, 6], [7, 12, 9], [10, 12, 11], [10, 10, 10]], si = Math.min(3, Math.floor(sat((u - 0.4) / (d - 0.9)) * 4)), [lo, hi, mid] = steps[si]; return <>
      {vals.map((v, i) => <Cell key={i} x={X(i)} y={540} w={104} stroke={ink} fill={i === mid ? (si === 3 ? GRN : YEL) : "none"} txt={v} tc={i === mid ? "#141414" : i < lo || i > hi ? dim : ink} sc={i < lo || i > hi ? 0.78 : 1} />)}
      {vals.map((_, i) => (i < lo || i > hi) ? <line key={`x${i}`} x1={X(i) - 46} y1={540 + 46} x2={X(i) + 46} y2={540 - 46} stroke={RED} strokeWidth={10} /> : null)}
      <path d="M-34 -70 L34 -70 L0 -10 Z" fill={RED} transform={`translate(${X(mid)} 440)`} /><T x={X(mid)} y={330} s={60} c={RED}>milieu</T>
      <T x={960} y={160} s={90} c={ink}>cible : 43</T><Pill x={960} y={860} text={`étape ${si + 1}`} s={70} c={si === 3 ? GRN : RED} /></>; }
    const end = m === "first" ? 0 : m === "linear" ? 10 : 12, cur = Math.min(end, Math.floor(sat((u - 0.3) / (d - 0.8)) * (end + 1))), found = (m === "first" || m === "linear") && cur === end && u > 0.5;
    let best = 0; for (let i = 1; i <= cur; i++) if (vals[i] > vals[best]) best = i;
    return <>{vals.map((v, i) => <Cell key={i} x={X(i)} y={540} w={104} stroke={ink} fill={m === "max" ? (i === best ? YEL : "none") : i === cur ? (found ? GRN : RED) : "none"} txt={v}
      tc={(m === "max" ? i === best : i === cur) ? "#141414" : i < cur ? dim : ink} />)}
      <path d="M-34 -70 L34 -70 L0 -10 Z" fill={RED} transform={`translate(${X(cur)} 440)`} />
      <T x={960} y={160} s={90} c={ink}>{m === "max" ? `maximum : ${vals[best]}` : m === "last" ? "cible : absente…" : `cible : ${vals[end]}`}</T>
      <Pill x={960} y={860} text={`${cur + 1} comparaison${cur ? "s" : ""}`} s={70} c={found ? GRN : RED} /></>; },
  sort: ([algo], { u, d, ink }) => { const a = algo as string; if (a === "shuffle") { const sh = V0.map((_, i) => i + 1).sort((x, y) => rnd(x + Math.floor(u * 5) * 13, 3) - rnd(y + Math.floor(u * 5) * 13, 3)); return <SBars st={{ a: u < 0.5 ? sh.slice().sort((x, y) => x - y) : sh, hi: [] }} ink={ink} />; }
    const steps = a === "merge" ? mergeSteps : a === "quick" ? quickSteps : bubbleSteps, p = sat((u - 0.2) / (d - 0.6));
    const idx = a === "bubble" ? Math.floor(p * steps.length * 0.45) : a === "bubble2" ? Math.floor(steps.length * (0.45 + p * 0.55)) : Math.floor(p * steps.length);
    const done = idx >= steps.length - 1; return <><SBars st={steps[Math.min(steps.length - 1, idx)]} ink={ink} done={done && a !== "bubble"} />
      <T x={960} y={120} s={70} c={RED}>{a === "merge" ? "FUSION" : a === "quick" ? "PIVOT" : "COMPARER · ÉCHANGER"}</T></>; },
  grid: (_, { u, d, ink }) => { const n = 8, cnt = Math.floor(sat((u - 0.2) / (d - 0.7)) * n * n); return <>
    {Array.from({ length: n * n }).map((_, i) => <rect key={i} x={560 + (i % n) * 100} y={150 + Math.floor(i / n) * 100} width={88} height={88} rx={12} fill={i < cnt ? (i === cnt - 1 ? YEL : RED) : "none"} stroke={ink} strokeWidth={5} />)}
    <T x={330} y={540} s={110} c={ink} f="KaTeX_Main">n × n</T><T x={1600} y={540} s={150} c={RED}>{cnt}</T></>; },
  halve: (_, { u, d, ink }) => { const n = Math.min(5, Math.floor(sat(u / (d - 0.3)) * 6)); return <>
    {Array.from({ length: 6 }).map((_, i) => { const w = 1500 / 2 ** i; return i <= n ? <g key={i}><rect x={210} y={150 + i * 140} width={w * k(u, i * (d - 0.3) / 6, 0.3)} height={96} rx={16} fill={i === n ? RED : "none"} stroke={ink} strokeWidth={6} />
      <T x={250 + w} y={198 + i * 140} s={70} c={ink} f="KaTeX_Main" anchor="start">{i === 0 ? "n" : `n / ${2 ** i}`}</T></g> : null; })}</>; },
  tree: ([kind], { u, d, ink }) => { const kd = kind as string, depth = kd === "double" ? 6 : kd === "bst" ? 3 : 4, top = kd === "double" ? 120 : 190, gap = kd === "double" ? 150 : 200; const per = Math.max(0.25, (d - 0.6) / depth);
    const path = [0, 1, 2]; return <>
      {Array.from({ length: depth }).flatMap((_, lv) => Array.from({ length: 2 ** lv }).map((_, i) => { const [x, y] = treePos(lv, i, top, gap), at = 0.1 + lv * per, lab = kd === "fib" ? FIB[lv][i] : kd === "bst" ? String(BST[lv][i]) : "";
        if (kd === "fib" && lab === "") return null; const dup = kd === "fib" && (lab === "fib(3)" || lab === "fib(2)"); const onp = kd === "bst" && i === path[lv] - (lv === 2 ? 0 : 0) && ((lv === 0) || (lv === 1 && i === 1) || (lv === 2 && i === 2)); const [px, py] = lv ? treePos(lv - 1, Math.floor(i / 2), top, gap) : [x, y];
        const w = kd === "double" ? Math.max(18, 110 / (lv + 1)) : kd === "fib" ? 150 : kd === "bst" ? 120 : Math.max(60, 330 / 2 ** lv * 1.6);
        return <g key={`${lv}-${i}`}>{lv ? <Draw d={`M${px} ${py + 30} L${x} ${y - 30}`} p={k(u, at - 0.1, 0.25)} c={onp ? RED : ink} w={onp ? 12 : 6} /> : null}
          {kd === "double" ? <circle cx={x} cy={y} r={w * pp(u, at)} fill={lv === depth - 1 ? RED : ink} />
            : <Cell x={x} y={y} w={w} h={70} stroke={dup || onp ? RED : ink} fill={dup ? "#ff2d2d33" : onp && u > at + 0.2 ? YEL : "none"} txt={lab || undefined} ts={kd === "fib" ? 40 : 46} tc={onp ? "#141414" : ink} sc={pp(u, at)} />}</g>; }))}
      {kd === "double" ? Array.from({ length: depth }).map((_, lv) => <T key={lv} x={1820} y={top + lv * gap} s={64} c={RED} sc={pp(u, 0.1 + lv * per)}>{2 ** lv}</T>) : null}
      {kd === "levels" ? <>{Array.from({ length: depth }).map((_, lv) => <T key={lv} x={1830} y={top + lv * gap} s={70} c={RED} f="KaTeX_Math" it sc={pp(u, 0.3 + lv * per)}>n</T>)}
        <Draw d={`M90 ${top - 30} V${top + 3 * gap + 30}`} p={k(u, 0.3, 0.6)} c={RED} w={10} /><T x={60} y={top + 1.5 * gap} s={60} c={RED} f="KaTeX_Main" rot={-90}>log n niveaux</T></> : null}
      {kd === "bst" ? <Pill x={960} y={920} text="chercher 60 : 3 étapes" s={66} sc={pp(u, 1)} /> : null}</>; },
  arr: ([mode], { u, d, ink, dim }) => { const m = mode as string, X = (i: number) => 300 + i * 120;
    if (m === "access") return <>{Array.from({ length: 12 }).map((_, i) => <Cell key={i} x={X(i)} y={560} w={104} stroke={ink} fill={i === 9 && u > 0.7 ? YEL : "none"} txt={(i * 7 + 3) % 50} tc={i === 9 && u > 0.7 ? "#141414" : ink} />)}
      {Array.from({ length: 12 }).map((_, i) => <T key={i} x={X(i)} y={670} s={40} c={dim} f="InterX">{i}</T>)}
      <Draw d={`M${X(9)} 250 V470`} p={k(u, 0.4, 0.3)} c={RED} w={16} /><Head x={X(9)} y={480} p={k(u, 0.4, 0.3)} c={RED} a={90} s={1.3} /><T x={X(9)} y={180} s={90} c={RED} f="monospace" sc={pp(u, 0.2)}>tab[9]</T><Pill x={960} y={880} text="1 seule opération" s={66} sc={pp(u, 0.9)} c={GRN} /></>;
    if (m === "insert") { const sh = Math.floor(sat((u - 0.5) / (d - 1)) * 7); return <>{Array.from({ length: 11 }).map((_, i) => { const moved = i >= 4 && i >= 11 - sh - 0; return <Cell key={i} x={X(i) + (i >= 4 && 10 - i < sh ? 120 : 0)} y={560} w={104} stroke={ink} txt={(i * 7 + 3) % 50} fill={moved ? "none" : "none"} />; })}
      <Cell x={X(4)} y={560 - (1 - k(u, 0.5 + (d - 1), 0.3)) * 220} w={104} stroke={RED} fill={RED} txt="X" tc="#fff" /><Pill x={960} y={880} text={`${sh} décalages`} s={66} /><T x={960} y={200} s={80} c={ink}>insérer au milieu</T></>; }
    const cap = u < d * 0.33 ? 4 : u < d * 0.66 ? 8 : 16, used = Math.min(cap, Math.floor(sat(u / d) * 11) + 1); return <>
      {Array.from({ length: 16 }).map((_, i) => <Cell key={i} x={220 + i * 99} y={560} w={88} stroke={i < cap ? ink : "none"} fill={i < used ? (i === used - 1 ? YEL : BLUE) : "none"} sc={i < cap ? 1 : 0} />)}
      <T x={960} y={220} s={90} c={ink}>{`capacité : ${cap}`}</T><Pill x={960} y={860} text={used === cap ? "pleine → on double et on recopie" : "ajout : 1 opération"} s={60} c={used === cap ? RED : GRN} /></>; },
  linked: (_, { u, d, ink }) => { const hop = Math.min(5, Math.floor(sat((u - 0.3) / (d * 0.55)) * 6)), ins = k(u, d * 0.62, 0.4); return <>
    {Array.from({ length: 6 }).map((_, i) => <g key={i}><Cell x={260 + i * 280} y={480} w={150} h={110} stroke={ink} fill={i === hop && ins === 0 ? YEL : "none"} txt={["A", "B", "C", "D", "E", "F"][i]} tc={i === hop && ins === 0 ? "#141414" : ink} />
      {i < 5 ? <><Draw d={`M${345 + i * 280} 480 H${435 + i * 280}`} p={i === 2 ? 1 - ins : 1} c={ink} w={8} /><Head x={445 + i * 280} y={480} p={i === 2 ? 1 - ins : 1} c={ink} s={0.7} /></> : null}</g>)}
    <Cell x={960} y={760} w={150} h={110} stroke={RED} fill={RED} txt="X" tc="#fff" sc={pp(u, d * 0.6)} /><Draw d="M830 540 L900 700" p={ins} c={RED} w={8} /><Draw d="M1020 700 L1090 540" p={ins} c={RED} w={8} />
    <T x={960} y={200} s={80} c={ink}>{ins > 0 ? "insérer : 2 flèches à changer" : "atteindre F : suivre la chaîne"}</T></>; },
  hash: (_, { u, ink, dim }) => <>
    <Cell x={330} y={540} w={300} h={130} stroke={ink} txt={"\"Lina\""} ts={70} sc={pp(u, 0.05)} /><Draw d="M490 540 H640" p={k(u, 0.4)} c={ink} w={10} /><Head x={652} y={540} p={k(u, 0.4)} c={ink} />
    <g transform={`translate(800 540) rotate(${u < 1.1 ? u * 200 : 0})`}><rect x={-120} y={-120} width={240} height={240} rx={40} fill={RED} /><T x={0} y={4} s={120} c="#fff" f="KaTeX_Math" it>h</T></g>
    <Draw d="M940 540 H1100 V660 H1215" p={k(u, 1.1, 0.4)} c={RED} w={10} />
    {Array.from({ length: 7 }).map((_, i) => <g key={i}><Cell x={1420} y={180 + i * 120} w={380} h={100} stroke={ink} fill={i === 4 && u > 1.5 ? YEL : "none"} txt={i === 4 ? "Lina → 21" : i === 1 ? "Adam → 19" : ""} ts={50} tc={i === 4 && u > 1.5 ? "#141414" : ink} />
      <T x={1180} y={180 + i * 120} s={46} c={dim} f="InterX">{i}</T></g>)}</>,
  mem: ([mode], { u, d, ink }) => { const m = mode as string, n = m === "fill" ? Math.floor(sat(u / (d - 0.3)) * 96) : 0; return <>
    {m === "fill" ? Array.from({ length: 96 }).map((_, i) => <rect key={i} x={250 + (i % 16) * 90} y={220 + Math.floor(i / 16) * 110} width={78} height={96} rx={10} fill={i < n ? BLUE : "none"} stroke={ink} strokeWidth={5} />)
      : <>{Array.from({ length: 12 }).map((_, i) => <Cell key={i} x={300 + i * 120} y={m === "one" ? 480 : 380} w={104} stroke={ink} fill={BLUE} />)}
        {m === "double" ? Array.from({ length: 12 }).map((_, i) => <Cell key={`c${i}`} x={300 + i * 120} y={680} w={104} stroke={RED} fill={RED} sc={pp(u, 0.4 + i * 0.08)} />) : <Cell x={960} y={720} w={104} stroke={RED} fill={RED} sc={pp(u, 0.5)} />}
        <Pill x={960} y={920} text={m === "one" ? "1 case en plus" : "une copie complète : n cases"} s={62} sc={pp(u, 0.8)} /></>}
    <T x={960} y={110} s={80} c={ink}>MÉMOIRE</T></>; },
  memo: (_, { u, d, ink, dim }) => { const f = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34], n = Math.floor(sat((u - 0.2) / (d - 0.6)) * 10); return <>
    {f.map((v, i) => <g key={i}><Cell x={285 + i * 150} y={560} w={130} stroke={ink} fill={i < n ? (i === n - 1 ? YEL : GRN) : "none"} txt={i < n ? v : "?"} tc={i < n ? "#141414" : dim} />
      <T x={285 + i * 150} y={690} s={40} c={dim} f="monospace">{`fib(${i})`}</T></g>)}
    <T x={960} y={250} s={90} c={ink}>calculé une seule fois</T></>; },
  venn: ([lvl], { u, ink }) => { const l = lvl as string, np = l !== "P", npc = l === "NPC"; return <>
    {np ? <ellipse cx={960} cy={540} rx={820 * pp(u, 0.02, 0.5)} ry={440 * pp(u, 0.02, 0.5)} fill="#2f7bff22" stroke={BLUE} strokeWidth={12} /> : null}
    <circle cx={np ? 640 : 960} cy={540} r={(np ? 250 : 330) * (np ? 1 : pp(u, 0.05, 0.45))} fill="#27c26c33" stroke={GRN} strokeWidth={12} /><T x={np ? 640 : 960} y={540} s={np ? 180 : 260} c={GRN}>P</T>
    {np ? <T x={1040} y={230} s={150} c={BLUE} sc={pp(u, 0.3)}>NP</T> : null}
    {npc ? <><ellipse cx={1400} cy={590} rx={290 * pp(u, 0.5)} ry={210 * pp(u, 0.5)} fill="#ff2d2d33" stroke={RED} strokeWidth={12} /><T x={1400} y={590} s={84} c={RED} sc={pp(u, 0.6)}>NP-COMPLET</T></> : null}
    {!np ? <T x={960} y={950} s={64} c={ink} f="InterX" sc={k(u, 0.5)}>résoluble rapidement</T> : null}</>; },
  tsp: ([mode], { u, d, ink }) => { const m = mode as string, tr = Math.floor(u * 9), order = m === "approx" ? NN : CITIES.map((_, i) => i).sort((a, b) => rnd(a + tr * 17, 5) - rnd(b + tr * 17, 5)); return <>
    {m === "approx" ? <Draw d={route(order)} p={k(u, 0.2, Math.max(0.8, d - 0.9))} c={GRN} w={12} /> : <path d={route(order)} fill="none" stroke={RED} strokeWidth={8} opacity={0.85} />}
    {CITIES.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={26} fill={ink} stroke={m === "approx" ? GRN : RED} strokeWidth={8} />)}
    <Pill x={960} y={980} text={m === "approx" ? "presque optimal, tout de suite" : `essai n° ${(tr * 7919 + 13) % 99991}`} s={56} c={m === "approx" ? GRN : RED} /></>; },
  sudoku: (_, { u, d, ink }) => { const n = Math.floor(sat(u / (d * 0.6)) * 81), ok = k(u, d * 0.68, 0.5); return <>
    {Array.from({ length: 81 }).map((_, i) => { const r = Math.floor(i / 9), c = i % 9, v = ((r * 3 + Math.floor(r / 3) + c) % 9) + 1, giv = rnd(i, 9) > 0.62; return <g key={i}>
      <rect x={555 + c * 90} y={135 + r * 90} width={90} height={90} fill={ok > 0 && r < ok * 9 ? "#27c26c44" : "none"} stroke={ink} strokeWidth={2} />
      {giv || rnd(i, 4) * 81 < n ? <T x={600 + c * 90} y={183 + r * 90} s={56} c={giv ? ink : RED} f="KaTeX_Main">{v}</T> : null}</g>; })}
    {[0, 1, 2, 3].map((i) => <g key={i}><line x1={555 + i * 270} y1={135} x2={555 + i * 270} y2={945} stroke={ink} strokeWidth={8} /><line x1={555} y1={135 + i * 270} x2={1365} y2={135 + i * 270} stroke={ink} strokeWidth={8} /></g>)}
    <T x={280} y={540} s={70} c={RED} sc={pp(u, 0.1)}>{ok > 0 ? "" : "résoudre : long"}</T><T x={1640} y={540} s={70} c={GRN} sc={pp(u, d * 0.68)}>vérifier : rapide</T></>; },
  reduce: (_, { u, ink }) => { const N = ["SAT", "3-SAT", "CLIQUE", "SAC À DOS", "COLORATION", "VOYAGEUR"], P = N.map((_, i) => [960 + Math.cos(i * 1.047 - 1.57) * 620, 540 + Math.sin(i * 1.047 - 1.57) * 380]); return <>
    {[[0, 1], [1, 2], [1, 4], [2, 3], [4, 5], [1, 5], [0, 3], [2, 5]].map(([a, b], i) => <Draw key={i} d={`M${P[a][0]} ${P[a][1]} L${P[b][0]} ${P[b][1]}`} p={k(u, 0.4 + i * 0.18, 0.35)} c={RED} w={8} />)}
    {N.map((n, i) => <g key={n} transform={`translate(${P[i][0]} ${P[i][1]}) scale(${pp(u, 0.05 + i * 0.07)})`}><rect x={-170} y={-52} width={340} height={104} rx={24} fill={i === 0 ? RED : "#11131f"} stroke={ink} strokeWidth={6} /><T x={0} y={3} s={50} c="#fff">{n}</T></g>)}</>; },
  domino: (_, { u, d, ink }) => <>{Array.from({ length: 11 }).map((_, i) => { const f = k(u, 0.4 + i * (d - 1.2) / 11, 0.3); return <rect key={i} x={-22} y={-300} width={44} height={300} rx={8} fill={i === 0 ? RED : f > 0.5 ? RED : ink}
    transform={`translate(${330 + i * 130} 760) rotate(${f * 66})`} />; })}<line x1={200} y1={766} x2={1760} y2={766} stroke={ink} strokeWidth={8} /><T x={960} y={220} s={84} c={ink} sc={pp(u, 0.1)}>un seul tombe… tous tombent</T></>,
  tape: (_, { u, ink }) => { const off = (u * 140) % 140; return <>
    {Array.from({ length: 17 }).map((_, i) => <Cell key={i} x={-140 + i * 140 - off + 140} y={600} w={128} stroke={ink} txt={rnd(i + Math.floor(u * 140 / 140), 2) > 0.5 ? 1 : 0} />)}
    <rect x={888} y={520} width={144} height={160} rx={18} fill="none" stroke={RED} strokeWidth={14} /><path d="M930 410 H990 L960 500 Z" fill={RED} /><T x={960} y={280} s={90} c={ink}>MACHINE DE TURING</T></>; },
  loop: (_, { u, ink }) => <><g transform={`translate(960 520) rotate(${u * 140})`}><path d="M0 -300 A300 300 0 1 1 -212 -212" fill="none" stroke={RED} strokeWidth={34} strokeLinecap="round" /><path d="M-270 -270 L-150 -260 L-200 -150 Z" fill={RED} /></g>
    <T x={960} y={520} s={260} c={ink} f="KaTeX_Main">∞</T><T x={960} y={960} s={70} c={ink} f="monospace">while True: …   s'arrête ?</T></>,
  dice: (_, { u, ink }) => <>{[0, 1].map((dn) => { const v = 1 + Math.floor(rnd(Math.floor(u * 6) + dn * 31, 7) * 6), pips: number[][] = [[], [[0, 0]], [[-1, -1], [1, 1]], [[-1, -1], [0, 0], [1, 1]], [[-1, -1], [1, -1], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]][v] as number[][];
    return <g key={dn} transform={`translate(${680 + dn * 560} 480) rotate(${Math.sin(u * 9 + dn) * 12})`}><rect x={-190} y={-190} width={380} height={380} rx={60} fill="#fff" stroke={ink === "#ffffff" ? RED : ink} strokeWidth={14} />
      {pips.map(([x, y], i) => <circle key={i} cx={x * 100} cy={y * 100} r={34} fill={RED} />)}</g>; })}<Pill x={960} y={900} text="erreur : 1 chance sur des milliards" s={60} sc={pp(u, 0.5)} /></>,
  phone: (_, { u, ink, dim }) => <><rect x={690} y={90} width={540} height={900} rx={70} fill="none" stroke={ink} strokeWidth={16} />
    <clipPath id="ph"><rect x={710} y={150} width={500} height={780} /></clipPath><g clipPath="url(#ph)">{Array.from({ length: 16 }).map((_, i) => { const y = 200 + i * 110 - ((u * 330) % 110) - 0; return <g key={i}>
      <circle cx={790} cy={y} r={38} fill={[RED, BLUE, YEL, GRN][(i + Math.floor(u * 3)) % 4]} /><rect x={860} y={y - 26} width={250 - (i % 3) * 50} height={22} rx={11} fill={ink} /><rect x={860} y={y + 10} width={160} height={16} rx={8} fill={dim} /></g>; })}</g>
    <T x={360} y={540} s={300} c={RED} f="KaTeX_Math" it sc={pp(u, 0.2)}>n</T><T x={1560} y={540} s={84} c={ink} sc={pp(u, 0.4)}>contacts</T></>,
  pixels: (_, { u, ink }) => { const n = 16; return <>{Array.from({ length: n * 9 }).map((_, i) => { const x = i % n, y = Math.floor(i / n), on = (x - 7.5) ** 2 + ((y - 4) * 1.2) ** 2 < 14;
    return <rect key={i} x={480 + x * 60} y={270 + y * 60} width={56} height={56} rx={6} fill={on ? [RED, YEL][(x + y) % 2] : [BLUE, "#1e4fbf"][(x + y) % 2]} opacity={k(u, 0.05 + rnd(i, 3) * 0.8, 0.2)} />; })}
    <T x={960} y={150} s={110} c={ink} f="KaTeX_Main" sc={pp(u, 0.3)}>n pixels</T></>; },
  strike: (_, { u, ink }) => <>
    <T x={960} y={420} s={230} c={ink} f="KaTeX_Main">3n² + 5n + 100</T>
    <Draw d="M215 350 L325 500" p={k(u, 0.5, 0.25)} c={RED} w={22} /><Draw d="M600 425 H1720" p={k(u, 1.1, 0.4)} c={RED} w={22} />
    <rect x={330} y={290} width={230} height={270} rx={30} fill="none" stroke={GRN} strokeWidth={16} opacity={k(u, 1.7, 0.2)} />
    <T x={960} y={800} s={200} c={GRN} f="KaTeX_Main" sc={pp(u, 2.0)}>n²</T></>,
  end: (_, { u }) => <>
    {Array.from({ length: 18 }).map((_, i) => <Draw key={i} d={`M960 540 L${960 + Math.cos(i * 0.349) * 1500} ${540 + Math.sin(i * 0.349) * 1500}`} p={k(u, 0, 0.5)} c={i % 2 ? RED : "#28324f"} w={5} />)}
    <g transform={`translate(960 470) rotate(-3) scale(${pp(u, 0.1)})`}><rect x={-560} y={-150} width={1120} height={300} rx={50} fill={RED} /><T x={0} y={6} s={220} c="#fff">ABONNE-TOI</T></g>
    <T x={960} y={780} s={84} c="#e9ecff" f="InterX" sc={pp(u, 0.7)}>et à très vite pour la suite</T></>,
};
