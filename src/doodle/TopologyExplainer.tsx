// "La topologie" — ~1 min 44 doodle explainer (1080x1920, 30 fps). Same hand-drawn kit as TopologyDoodle:
// thin wobbly ink (boiling SVG displacement), flat fills, no shading. Narration (synthetic, public/topo/voice.m4a),
// script-accurate captions (topo-timing.json), music bed and UI sounds.
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp, theme } from "../theme";
import timing from "./topo-timing.json";

const FPS = 30;
const T = (t: number) => Math.round(t * FPS);
export const TOPO_FRAMES = T(103.6);

const INK = "#1F1B1A";
const SW = 4.5;
const ink = { stroke: INK, strokeWidth: SW, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const COL = {
  sky: "#C9E8F6", paper: "#FBF6EA", grid: "#DCE7F2", grass1: "#A8D672", grass2: "#86C05A", path: "#EED9A6",
  table: "#F2A65A", parasol: "#FF7A6B", parasol2: "#FFF4E6", mug: "#6FA8DC", donut: "#F2C27E", clay: "#F7A8C4",
  ruler: "#FFD95E", hair: "#7A4A2A", red: "#E53935", green: "#3FA34D", yellow: "#FFE36E", blue: "#5B9BD5", purple: "#A98BD9",
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- tiny animation helpers (frame-based) ---------- */
const useF = () => useCurrentFrame();
const prog = (f: number, a: number, d = 0.4) => interpolate(f, [T(a), T(a + d)], [0, 1], { ...clamp, easing: theme.ease.out });
// plain function (no hook) so it can be called any number of times inside the scene render callbacks
const usePop = (f: number, a: number) =>
  f < T(a) ? 0 : spring({ frame: f - T(a), fps: FPS, config: { damping: 9, stiffness: 180, mass: 0.6 } });

const superellipse = (cx: number, cy: number, rx: number, ry: number, n: number, steps = 64) => {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    d += `${i ? "L" : "M"} ${(cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n)).toFixed(1)} ${(cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n)).toFixed(1)} `;
  }
  return d + "Z";
};
const blob = (cx: number, cy: number, r: number, f: number, k = 1) => {
  let d = "";
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rr = r * (1 + 0.08 * k * Math.sin(a * 3 + f / 9) + 0.05 * k * Math.cos(a * 5 - f / 7));
    d += `${i ? "L" : "M"} ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + "Z";
};

/* ---------- red marker X (two strokes) ---------- */
const RedX: React.FC<{ f: number; at: number; cx: number; cy: number; w: number; h?: number }> = ({ f, at, cx, cy, w, h = w }) => {
  const a = prog(f, at, 0.22), b = prog(f, at + 0.28, 0.22);
  return (
    <g opacity={0.92}>
      {a > 0 && <path d={`M ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy + h / 2}`} stroke={COL.red} strokeWidth={18} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - a} />}
      {b > 0 && <path d={`M ${cx + w / 2} ${cy - h / 2} L ${cx - w / 2} ${cy + h / 2}`} stroke={COL.red} strokeWidth={18} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - b} />}
    </g>
  );
};
const Check: React.FC<{ f: number; at: number; x: number; y: number; s?: number }> = ({ f, at, x, y, s = 1 }) => {
  const p = prog(f, at, 0.3);
  return p > 0 ? <path d={`M ${x - 30 * s} ${y} L ${x - 6 * s} ${y + 26 * s} L ${x + 40 * s} ${y - 30 * s}`} stroke={COL.green} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round"
    fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /> : null;
};
/** handwritten text drawn inside the wobbly layer */
const Hand: React.FC<{ x: number; y: number; size?: number; color?: string; children: React.ReactNode; o?: number }> = ({ x, y, size = 64, color = INK, children, o = 1 }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={size} fill={color} opacity={o}>{children}</text>
);

/* ---------- original stick character ---------- */
type Pose = { holdHead?: number; shrug?: number; point?: number; thumbs?: number; wave?: number; shake?: number; brows?: number; smile?: number; hold?: number };
const Person: React.FC<{ x: number; feet: number; s?: number; f: number; pose?: Pose }> = ({ x, feet, s = 1, f, pose = {} }) => {
  const { holdHead = 0, shrug = 0, point = 0, thumbs = 0, wave = 0, shake = 0, brows = 0, smile = 0, hold = 0 } = pose;
  const R = 120 * s, headY = feet - 680 * s, neck = headY + R, hip = neck + 330 * s, sh = neck + 70 * s - shrug * 26 * s;
  const tilt = shake * Math.sin(f / 2.6) * 10;
  const arm = (side: -1 | 1, target: [number, number]) => {
    const [hx, hy] = target;
    const ex = (x + hx) / 2 + side * 40 * s, ey = (sh + hy) / 2 + 30 * s;
    return <path {...ink} fill="none" d={`M ${x} ${sh} Q ${ex} ${ey} ${hx} ${hy}`} />;
  };
  const rest = (side: -1 | 1): [number, number] => [x + side * 120 * s, sh + 190 * s];
  // left arm: rest -> hold head -> shrug
  let L: [number, number] = rest(-1);
  L = [lerp(L[0], x - 120 * s, holdHead), lerp(L[1], headY - 20 * s, holdHead)];
  L = [lerp(L[0], x - 190 * s, shrug), lerp(L[1], sh - 40 * s, shrug)];
  // right arm: rest -> hold object -> point -> thumbs -> wave -> shrug
  let Rr: [number, number] = rest(1);
  Rr = [lerp(Rr[0], x + 175 * s, hold), lerp(Rr[1], sh + 170 * s, hold)];
  Rr = [lerp(Rr[0], x + 230 * s, point), lerp(Rr[1], sh - 30 * s, point)];
  Rr = [lerp(Rr[0], x + 140 * s, thumbs), lerp(Rr[1], sh - 150 * s, thumbs)];
  Rr = [lerp(Rr[0], x + 150 * s + Math.sin(f / 3) * 40 * s, wave), lerp(Rr[1], sh - 180 * s, wave)];
  Rr = [lerp(Rr[0], x + 190 * s, shrug), lerp(Rr[1], sh - 40 * s, shrug)];
  const by = headY - 22 * s - (shrug + brows) * 14 * s;
  return (
    <g>
      <g transform={`rotate(${tilt} ${x} ${neck})`}>
        <circle cx={x} cy={headY} r={R} {...ink} fill="#FFFFFF" />
        <path {...ink} fill={COL.hair} d={`M ${x - 112 * s} ${headY - 30 * s} Q ${x - 120 * s} ${headY - 120 * s} ${x - 30 * s} ${headY - 128 * s}
          Q ${x + 40 * s} ${headY - 150 * s} ${x + 100 * s} ${headY - 92 * s} Q ${x + 122 * s} ${headY - 60 * s} ${x + 112 * s} ${headY - 30 * s}
          Q ${x + 80 * s} ${headY - 70 * s} ${x + 40 * s} ${headY - 58 * s} Q ${x + 10 * s} ${headY - 84 * s} ${x - 30 * s} ${headY - 62 * s}
          Q ${x - 70 * s} ${headY - 80 * s} ${x - 112 * s} ${headY - 30 * s} Z`} />
        <path {...ink} fill="none" d={`M ${x + 10 * s} ${headY - 132 * s} q ${14 * s} ${-40 * s} ${40 * s} ${-38 * s}`} />
        <circle cx={x - 40 * s} cy={headY + 6 * s} r={9 * s} fill={INK} />
        <circle cx={x + 40 * s} cy={headY + 6 * s} r={9 * s} fill={INK} />
        <path {...ink} fill="none" d={`M ${x - 64 * s} ${by + holdHead * 6 * s} L ${x - 18 * s} ${by - 4 * s - holdHead * 4 * s}`} />
        <path {...ink} fill="none" d={`M ${x + 18 * s} ${by - 4 * s - holdHead * 4 * s} L ${x + 64 * s} ${by + holdHead * 6 * s}`} />
        <path {...ink} fill="none" d={`M ${x - 24 * s} ${headY + 58 * s} Q ${x} ${headY + 58 * s + (smile * 26 - holdHead * 10) * s} ${x + 24 * s} ${headY + 58 * s}`} />
      </g>
      <line x1={x} y1={neck} x2={x} y2={hip} {...ink} />
      <path {...ink} fill="none" d={`M ${x} ${hip} L ${x - 70 * s} ${feet} M ${x} ${hip} L ${x + 70 * s} ${feet}`} />
      {arm(-1, L)}
      {arm(1, Rr)}
      {thumbs > 0.5 && <path {...ink} fill="none" d={`M ${Rr[0]} ${Rr[1]} l ${-6 * s} ${-34 * s}`} />}
    </g>
  );
};

/* ---------- backgrounds ---------- */
const Cafe: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill={COL.sky} />
    {[[160 + f * 0.3, 360, 1], [720 + f * 0.2, 260, 1.25], [880 - f * 0.15, 560, 0.8]].map(([x, y, s], i) => (
      <path key={i} {...ink} fill="#fff" transform={`translate(${((x as number) % 1300) - 100} ${y}) scale(${s})`}
        d="M -110 30 Q -120 -10 -80 -14 Q -70 -60 -20 -50 Q 10 -88 55 -60 Q 100 -64 104 -20 Q 140 -6 120 30 Z" />
    ))}
    <line x1={890} y1={760} x2={890} y2={1430} {...ink} />
    <path {...ink} fill={COL.parasol} d="M 700 790 Q 890 600 1080 790 Q 985 760 890 790 Q 795 760 700 790 Z" />
    <path {...ink} fill={COL.parasol2} d="M 840 778 Q 890 640 940 778 Q 890 762 840 778 Z" />
    <path {...ink} fill={COL.grass1} d="M -10 1380 Q 300 1360 540 1384 Q 800 1404 1090 1376 L 1090 1930 L -10 1930 Z" />
    <path {...ink} fill={COL.path} d="M -10 1520 Q 360 1505 620 1524 Q 860 1540 1090 1518 L 1090 1930 L -10 1930 Z" />
    <path {...ink} fill={COL.grass2} d="M -10 1700 Q 420 1688 700 1706 Q 900 1716 1090 1700 L 1090 1930 L -10 1930 Z" />
    <ellipse cx={880} cy={1300} rx={150} ry={26} {...ink} fill={COL.table} />
    <path {...ink} fill="none" d="M 880 1326 L 880 1470 M 820 1470 L 940 1470" />
  </g>
);
const Paper: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill={COL.paper} />
    {Array.from({ length: 30 }).map((_, i) => <line key={i} x1={0} y1={80 + i * 64} x2={1080} y2={80 + i * 64} stroke={COL.grid} strokeWidth={2} />)}
    <line x1={110} y1={0} x2={110} y2={1920} stroke="#F2B8B8" strokeWidth={3} />
  </g>
);
const Floor: React.FC = () => <path {...ink} fill={COL.path} d="M -10 1560 Q 540 1540 1090 1560 L 1090 1930 L -10 1930 Z" />;

/* ---------- objects ---------- */
const MugDonut: React.FC<{ cx: number; cy: number; m: number; grow?: number; s?: number }> = ({ cx, cy, m, grow = 0, s = 1 }) => {
  const rx = lerp(62, 105, m) * s, ry = lerp(80, 62, m) * s, n = lerp(5, 2, m);
  const holeX = lerp(cx + rx + 30 * s + grow * 20 * s, cx, m), holeR = lerp(30 + grow * 14, 24, m) * s, ringR = lerp(46 + grow * 22, 0, m) * s;
  return (
    <g>
      {ringR > 2 && <circle cx={holeX} cy={cy} r={ringR} {...ink} fill={m < 0.5 ? COL.mug : COL.donut} />}
      <path d={superellipse(cx, cy, rx, ry, n)} {...ink} fill={m < 0.5 ? COL.mug : COL.donut} />
      <circle cx={holeX} cy={cy} r={holeR} {...ink} fill={COL.paper} />
      {m > 0.6 && [[-50, -30, 20], [-10, -44, -30], [34, -36, 40], [60, -10, -10], [-64, 4, 60]].map(([dx, dy, a], i) => (
        <line key={i} x1={cx + dx * s} y1={cy + dy * s} x2={cx + (dx + 14 * Math.cos((a * Math.PI) / 180)) * s} y2={cy + (dy + 14 * Math.sin((a * Math.PI) / 180)) * s}
          stroke={["#FF5C8A", "#3D8BFF", "#2EC27E", "#9B5CFF", "#FF5C8A"][i]} strokeWidth={6 * s} strokeLinecap="round" opacity={(m - 0.6) * 2.5} />
      ))}
    </g>
  );
};
const Ruler: React.FC<{ x: number; y: number; s?: number; r?: number }> = ({ x, y, s = 1, r = -8 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${r})`}>
    <rect x={-260} y={-55} width={520} height={110} rx={10} {...ink} fill={COL.ruler} />
    {Array.from({ length: 21 }).map((_, i) => <line key={i} x1={-240 + i * 24} y1={-55} x2={-240 + i * 24} y2={-55 + (i % 5 === 0 ? 46 : 26)} {...ink} strokeWidth={3.5} />)}
    <text x={150} y={36} fontFamily="Caveat" fontWeight={700} fontSize={54} fill={INK}>cm</text>
  </g>
);
const Scissors: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path {...ink} fill="#C9D3E0" d="M -10 -10 L 110 -70 L 120 -58 Z" /><path {...ink} fill="#C9D3E0" d="M -10 10 L 110 70 L 120 58 Z" />
    <circle cx={-50} cy={-34} r={30} {...ink} fill={COL.red} /><circle cx={-50} cy={34} r={30} {...ink} fill={COL.red} />
    <circle cx={-50} cy={-34} r={14} {...ink} fill={COL.paper} /><circle cx={-50} cy={34} r={14} {...ink} fill={COL.paper} />
  </g>
);
const Glue: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-46} y={-60} width={92} height={130} rx={18} {...ink} fill={COL.yellow} />
    <path {...ink} fill="#fff" d="M -24 -60 L -16 -96 L 16 -96 L 24 -60 Z" />
    <path {...ink} fill="none" d="M -10 -96 q 10 -30 30 -10 q 10 14 -4 26" />
    <Hand x={0} y={22} size={44}>colle</Hand>
  </g>
);
const Drill: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={30} cy={40} r={44} {...ink} fill={COL.clay} />
    <path {...ink} fill={COL.blue} d="M -110 -100 L -30 -30 L -46 -14 L -126 -84 Z" />
    <path {...ink} fill="#C9D3E0" d="M -30 -30 L 14 10 L -6 18 L -46 -14 Z" />
    <circle cx={30} cy={40} r={12} {...ink} fill={COL.paper} />
  </g>
);
const Protractor: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path {...ink} fill="#BFE3C9" d="M -130 40 A 130 130 0 0 1 130 40 Z" />
    {Array.from({ length: 9 }).map((_, i) => { const a = Math.PI - (i / 8) * Math.PI; return <line key={i} x1={Math.cos(a) * 130} y1={40 - Math.sin(a) * 130} x2={Math.cos(a) * 104} y2={40 - Math.sin(a) * 104} {...ink} strokeWidth={3} />; })}
    <path {...ink} fill="none" d="M 0 40 L 70 -50 M 0 40 L 110 40" />
  </g>
);
const Straw: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => {
  // k: 0 long straw -> 1 squashed ring (donut seen from the front)
  const w = lerp(560, 120, k), h = lerp(70, 200, k);
  if (k > 0.75) return <g><circle cx={x} cy={y} r={lerp(60, 110, (k - 0.75) * 4)} {...ink} fill={COL.donut} /><circle cx={x} cy={y} r={lerp(30, 42, (k - 0.75) * 4)} {...ink} fill={COL.paper} /></g>;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} {...ink} fill="#fff" />
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M ${x - w / 2 + 30 + i * (w - 60) / 8} ${y - h / 2} l ${18} ${h}`} stroke={COL.red} strokeWidth={10} opacity={1 - k} />)}
      <ellipse cx={x + w / 2 - h * 0.2} cy={y} rx={h * 0.18} ry={h * 0.42} {...ink} fill={COL.paper} />
    </g>
  );
};

/* ---------- scene wrapper: page slides in ---------- */
const Scene: React.FC<{ a: number; b: number; children: (f: number) => React.ReactNode }> = ({ a, b, children }) => {
  const f = useF();
  if (f < T(a) || f >= T(b)) return null;
  const x = interpolate(f, [T(a), T(a) + 8], [1080, 0], { ...clamp, easing: theme.ease.out });
  return <g transform={`translate(${x} 0)`}>{children(f)}</g>;
};

/* ---------- the timeline (seconds from the narration) ---------- */
const Scenes: React.FC = () => {
  const f = useF();
  const pop = (a: number) => usePop(f, a);
  return (
    <>
      {/* 1 — hook: mug and donut, "the same thing" */}
      <Scene a={0} b={6.6}>{(f) => (<>
        <Cafe f={f} />
        <Person x={430} feet={1560} f={f} pose={{ hold: 1, brows: prog(f, 4.4) }} />
        <MugDonut cx={680} cy={1060} m={0} />
        <g transform={`translate(880 1240) scale(${pop(3.3)})`}><MugDonut cx={0} cy={0} m={1} s={0.8} /></g>
        {prog(f, 4.5) > 0 && <Hand x={790} y={1170} size={170} color={COL.red} o={prog(f, 4.5)}>=</Hand>}
      </>)}</Scene>

      {/* 2 — "no he's not crazy" + title */}
      <Scene a={6.6} b={11.1}>{(f) => (<>
        <Cafe f={f} />
        <Person x={540} feet={1560} f={f} pose={{ shake: 1 - prog(f, 8.0), smile: prog(f, 8.8), wave: prog(f, 9.2) }} />
        <g transform={`translate(540 520) scale(${pop(8.8)}) rotate(-3)`}>
          <rect x={-330} y={-90} width={660} height={170} rx={16} {...ink} fill="#fff" />
          <Hand x={0} y={34} size={120}>La topologie</Hand>
          <path d="M -250 60 Q 0 90 250 56" stroke={COL.red} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(f, 9.4, 0.5)} />
        </g>
      </>)}</Scene>

      {/* 3 — the geometry of modelling clay */}
      <Scene a={11.1} b={15.3}>{(f) => (<>
        <Paper /><Floor />
        <Person x={210} feet={1700} s={0.72} f={f} pose={{ point: prog(f, 12.9), smile: 0.6 }} />
        <g transform={`translate(0 0) scale(1)`}><path d={blob(600, 900, 210 * pop(11.5), f, 1.4)} {...ink} fill={COL.clay} /></g>
        {prog(f, 13.7) > 0 && <Hand x={600} y={1260} size={90} o={prog(f, 13.7)}>pâte à modeler</Hand>}
      </>)}</Scene>

      {/* 4 — allowed: stretch, twist, squash */}
      <Scene a={15.3} b={21.4}>{(f) => (<>
        <Paper />
        <Hand x={540} y={330} size={96} color={COL.green}>autorisé</Hand>
        {[[16.3, "étirer", 260], [17.5, "tordre", 540], [18.9, "écraser", 820]].map(([t, label, x], i) => {
          const p = pop(t as number), w = Math.sin((f - T(t as number)) / 6);
          const tr = i === 0 ? `scale(${1 + 0.45 * Math.abs(w)} ${1 - 0.25 * Math.abs(w)})` : i === 1 ? `rotate(${w * 35}) skewX(${w * 20})` : `scale(${1 + 0.2 * Math.abs(w)} ${1 - 0.4 * Math.abs(w)})`;
          return (
            <g key={label as string}>
              <g transform={`translate(${x} 820) scale(${p}) ${p > 0.9 ? tr : ""}`}><path d={blob(0, 0, 110, f, 0.8)} {...ink} fill={COL.clay} /></g>
              {p > 0 && <Hand x={x as number} y={1040} size={70} o={p}>{label}</Hand>}
              <Check f={f} at={(t as number) + 0.5} x={x as number} y={1120} />
            </g>
          );
        })}
        <Person x={540} feet={1720} s={0.62} f={f} pose={{ thumbs: prog(f, 20.0), smile: 1 }} />
      </>)}</Scene>

      {/* 5 — the three forbidden moves */}
      <Scene a={21.4} b={28.2}>{(f) => (<>
        <Paper />
        <Hand x={540} y={330} size={96} color={COL.red} o={prog(f, 22.3)}>3 interdits</Hand>
        <g transform={`translate(0 0)`}>
          <g transform={`translate(260 760) scale(${pop(24.1)})`}><Scissors x={0} y={0} s={1} /></g>
          {pop(24.1) > 0 && <Hand x={260} y={960} size={66}>couper</Hand>}
          <RedX f={f} at={24.5} cx={260} cy={760} w={230} />
          <g transform={`translate(540 760) scale(${pop(25.2)})`}><Glue x={0} y={0} s={1} /></g>
          {pop(25.2) > 0 && <Hand x={540} y={960} size={66}>coller</Hand>}
          <RedX f={f} at={25.6} cx={540} cy={760} w={230} />
          <g transform={`translate(830 760) scale(${pop(26.3)})`}><Drill x={0} y={0} s={1} /></g>
          {pop(26.3) > 0 && <Hand x={830} y={960} size={66}>percer</Hand>}
          <RedX f={f} at={26.9} cx={830} cy={760} w={230} />
        </g>
        <Person x={540} feet={1720} s={0.62} f={f} pose={{ holdHead: prog(f, 22.5) * (1 - prog(f, 27.2)), brows: 1 }} />
      </>)}</Scene>

      {/* 6 — distances, angles, size don't count */}
      <Scene a={28.2} b={32.7}>{(f) => (<>
        <Paper />
        <g transform={`translate(540 520) scale(${pop(29.2)})`}><Ruler x={0} y={0} s={0.8} /></g>
        {pop(29.2) > 0 && <Hand x={540} y={660} size={60}>distances</Hand>}
        <g transform={`translate(300 930) scale(${pop(30.0)})`}><Protractor x={0} y={0} s={1} /></g>
        {pop(30.0) > 0 && <Hand x={300} y={1060} size={60}>angles</Hand>}
        <g transform={`translate(790 930) scale(${pop(30.6)})`}>
          <circle cx={-60} cy={20} r={30} {...ink} fill={COL.blue} /><circle cx={60} cy={0} r={70} {...ink} fill={COL.blue} />
        </g>
        {pop(30.6) > 0 && <Hand x={790} y={1060} size={60}>taille</Hand>}
        <RedX f={f} at={31.3} cx={540} cy={800} w={760} h={560} />
        <Person x={540} feet={1720} s={0.62} f={f} pose={{ shrug: prog(f, 31.8) }} />
      </>)}</Scene>

      {/* 7 — what counts: the number of holes */}
      <Scene a={32.7} b={37.2}>{(f) => (<>
        <Paper />
        <Hand x={540} y={380} size={100} color={COL.blue} o={prog(f, 34.0)}>le nombre de trous</Hand>
        {[[260, 0], [540, 1], [820, 2]].map(([x, n], i) => {
          const p = pop(35.3 + i * 0.25);
          return (
            <g key={i} transform={`translate(${x} 820) scale(${p})`}>
              {n === 0 && <circle r={110} {...ink} fill={COL.purple} />}
              {n === 1 && <><circle r={110} {...ink} fill={COL.donut} /><circle r={40} {...ink} fill={COL.paper} /></>}
              {n === 2 && <><ellipse rx={130} ry={95} {...ink} fill={COL.yellow} /><circle cx={-55} r={30} {...ink} fill={COL.paper} /><circle cx={55} r={30} {...ink} fill={COL.paper} /></>}
              <Hand x={0} y={230} size={110} color={COL.red}>{n}</Hand>
            </g>
          );
        })}
        <Person x={170} feet={1720} s={0.6} f={f} pose={{ point: 1, smile: 0.8 }} />
      </>)}</Scene>

      {/* 8 — ball -> cube */}
      <Scene a={37.2} b={47.5}>{(f) => {
        const sq = Math.sin(Math.min(1, prog(f, 38.9, 0.5)) * Math.PI) * 0.35, st = Math.sin(Math.min(1, prog(f, 40.0, 0.5)) * Math.PI) * 0.35;
        const n = lerp(2, 9, prog(f, 40.9, 0.8));
        const side = prog(f, 42.2, 0.5);
        return (<>
          <Paper />
          <g transform={`translate(${540 + side * 230} 760) scale(${(1 + sq - st * 0.3) * pop(37.7) * (1 - side * 0.35)} ${(1 - sq + st) * pop(37.7) * (1 - side * 0.35)})`}>
            <path d={superellipse(0, 0, 190, 190, n)} {...ink} fill={COL.purple} />
          </g>
          {side > 0 && <g opacity={side}><circle cx={250} cy={760} r={120} {...ink} fill={COL.purple} />
            <Hand x={500} y={800} size={150} color={COL.red}>=</Hand>
            <Hand x={250} y={1000} size={70}>0 trou</Hand><Hand x={770} y={1000} size={70}>0 trou</Hand></g>}
          {prog(f, 46.2) > 0 && <g transform={`translate(540 1180) rotate(-2) scale(${pop(46.2)})`}><rect x={-250} y={-60} width={500} height={110} rx={14} {...ink} fill="#fff" /><Hand x={0} y={20} size={80}>même forme !</Hand></g>}
          <Person x={170} feet={1720} s={0.6} f={f} pose={{ point: prog(f, 38.4), smile: prog(f, 46.2) }} />
        </>);
      }}</Scene>

      {/* 9 — mug -> donut */}
      <Scene a={47.5} b={57.6}>{(f) => {
        const grow = prog(f, 50.3, 0.8), m = prog(f, 52.2, 2.4);
        return (<>
          <Paper />
          <g transform={`translate(560 820) scale(${2.1 * pop(48.3)})`}><MugDonut cx={0} cy={0} m={m} grow={grow * (1 - m)} /></g>
          {prog(f, 55.2) > 0 && <g transform={`translate(540 1230) rotate(-2) scale(${pop(55.2)})`}><rect x={-260} y={-60} width={520} height={110} rx={14} {...ink} fill="#fff" /><Hand x={0} y={20} size={80}>1 trou = 1 trou</Hand></g>}
          <Person x={170} feet={1720} s={0.6} f={f} pose={{ holdHead: prog(f, 51.0) * (1 - prog(f, 54.6)), smile: prog(f, 54.6), thumbs: prog(f, 55.6) }} />
        </>);
      }}</Scene>

      {/* 10 — letters O, D, B */}
      <Scene a={57.6} b={66.7}>{(f) => {
        const holes = prog(f, 61.0, 0.3), bh = prog(f, 64.1, 0.3);
        return (<>
          <Paper />
          <Hand x={540} y={330} size={90} o={prog(f, 58.2)}>les lettres</Hand>
          {[[195, "O", 59.8], [535, "D", 60.2], [880, "B", 63.5]].map(([x, l, t]) => (
            <g key={l as string} transform={`translate(${x} 780) scale(${0.85 * pop(t as number)})`}>
              {l === "O" && <><ellipse rx={110} ry={150} {...ink} fill={COL.blue} /><ellipse rx={50} ry={90} {...ink} fill={holes ? COL.yellow : COL.paper} /></>}
              {l === "D" && <><path {...ink} fill={COL.blue} d="M -90 -150 L 10 -150 Q 120 -150 120 0 Q 120 150 10 150 L -90 150 Z" /><path {...ink} fill={holes ? COL.yellow : COL.paper} d="M -36 -90 L 6 -90 Q 60 -90 60 0 Q 60 90 6 90 L -36 90 Z" /></>}
              {l === "B" && <><path {...ink} fill={COL.purple} d="M -90 -150 L 20 -150 Q 110 -150 110 -75 Q 110 -20 60 -5 Q 125 15 125 75 Q 125 150 30 150 L -90 150 Z" />
                <path {...ink} fill={bh ? COL.yellow : COL.paper} d="M -36 -100 L 10 -100 Q 54 -100 54 -62 Q 54 -26 10 -26 L -36 -26 Z" />
                <path {...ink} fill={bh ? COL.yellow : COL.paper} d="M -36 26 L 18 26 Q 66 26 66 64 Q 66 100 18 100 L -36 100 Z" /></>}
            </g>
          ))}
          {prog(f, 61.8) > 0 && <Hand x={365} y={815} size={120} color={COL.green} o={prog(f, 61.8)}>=</Hand>}
          {prog(f, 65.5) > 0 && <Hand x={712} y={815} size={120} color={COL.red} o={prog(f, 65.5)}>≠</Hand>}
          {prog(f, 61.0) > 0 && <><Hand x={195} y={1040} size={64}>1 trou</Hand><Hand x={535} y={1040} size={64}>1 trou</Hand></>}
          {prog(f, 64.1) > 0 && <Hand x={880} y={1040} size={64} color={COL.red}>2 trous</Hand>}
          <Person x={540} feet={1720} s={0.6} f={f} pose={{ point: prog(f, 59.5) * (1 - prog(f, 63.0)), shrug: prog(f, 65.5) * 0.6, smile: 0.5 }} />
        </>);
      }}</Scene>

      {/* 11 — the straw */}
      <Scene a={66.7} b={75.6}>{(f) => (<>
        <Paper />
        <g transform={`translate(0 0) scale(1)`} opacity={pop(69.2) > 0 ? 1 : 0}>
          <g transform={`translate(540 760) scale(${pop(69.2)}) translate(-540 -760)`}><Straw x={540} y={760} k={prog(f, 73.2, 0.9)} /></g>
        </g>
        {prog(f, 69.7) > 0 && prog(f, 70.7) < 1 && <Hand x={540} y={560} size={160} color={COL.blue}>?</Hand>}
        {prog(f, 71.3) > 0 && <g transform={`translate(540 520) scale(${pop(71.3)})`}><circle r={90} {...ink} fill={COL.yellow} /><Hand x={0} y={40} size={120}>1</Hand></g>}
        {prog(f, 73.5) > 0 && <g transform={`translate(540 1140) rotate(-2) scale(${pop(73.5)})`}><rect x={-330} y={-60} width={660} height={110} rx={14} {...ink} fill="#fff" /><Hand x={0} y={20} size={74}>un donut très allongé</Hand></g>}
        <Person x={540} feet={1720} s={0.6} f={f} pose={{ holdHead: prog(f, 67.9) * (1 - prog(f, 70.7)), thumbs: prog(f, 71.6), smile: prog(f, 71.6) }} />
      </>)}</Scene>

      {/* 12 — metro map: wrong distances, right connections */}
      <Scene a={75.6} b={85.3}>{(f) => {
        const k = prog(f, 79.4, 1.2);
        const geo: [number, number][] = [[200, 600], [330, 740], [520, 690], [700, 860], [880, 760], [430, 980], [610, 1130], [780, 1240], [300, 1180]];
        const sch: [number, number][] = [[200, 640], [360, 640], [540, 640], [720, 820], [880, 820], [540, 880], [540, 1060], [720, 1240], [360, 1060]];
        const P = geo.map((g, i) => [lerp(g[0], sch[i][0], k), lerp(g[1], sch[i][1], k)] as [number, number]);
        const lines: [number[], string][] = [[[0, 1, 2, 3, 4], COL.red], [[2, 5, 6, 7], COL.blue], [[8, 6], COL.green]];
        const pulse = prog(f, 81.3, 0.4) * (0.6 + 0.4 * Math.sin(f / 4));
        const showMap = pop(77.9);
        return (<>
          <Paper />
          <g opacity={showMap > 0 ? 1 : 0} transform={`translate(540 900) scale(${showMap}) translate(-540 -900)`}>
            {lines.map(([ids, c], li) => (
              <path key={li} d={ids.map((id, j) => `${j ? (k < 0.5 ? "Q" : "L") : "M"} ${k < 0.5 && j ? `${(P[ids[j - 1]][0] + P[id][0]) / 2 + 40 * (1 - k * 2)} ${(P[ids[j - 1]][1] + P[id][1]) / 2 - 50 * (1 - k * 2)} ` : ""}${P[id][0]} ${P[id][1]}`).join(" ")}
                stroke={c} strokeWidth={16 + pulse * 6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {P.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={20} {...ink} fill="#fff" />)}
          </g>
          {prog(f, 80.1) > 0 && <><Hand x={500} y={430} size={70} color={COL.red} o={prog(f, 80.1)}>distances fausses</Hand><RedX f={f} at={80.3} cx={780} cy={410} w={56} /></>}
          {prog(f, 82.8) > 0 && <><Hand x={560} y={1420} size={70} color={COL.green} o={prog(f, 82.8)}>connexions justes</Hand><Check f={f} at={83.0} x={860} y={1400} s={0.8} /></>}
          <Person x={170} feet={1720} s={0.6} f={f} pose={{ point: prog(f, 77.5), smile: prog(f, 83.9) }} />
        </>);
      }}</Scene>

      {/* 13 — where it's used: networks, DNA, the universe */}
      <Scene a={85.3} b={92.9}>{(f) => (<>
        <Paper />
        <g transform={`translate(270 620) scale(${pop(86.9)})`}>
          {[[-80, -60], [70, -80], [90, 60], [-60, 80], [0, 0]].map(([x, y], i, a) => <g key={i}>{a.slice(i + 1).map(([x2, y2], j) => <line key={j} x1={x} y1={y} x2={x2} y2={y2} {...ink} strokeWidth={3} />)}</g>)}
          {[[-80, -60], [70, -80], [90, 60], [-60, 80], [0, 0]].map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r={24} {...ink} fill={[COL.blue, COL.red, COL.green, COL.yellow, COL.purple][i]} />)}
          <Hand x={0} y={190} size={64}>réseaux</Hand>
        </g>
        <g transform={`translate(810 620) scale(${pop(88.4)})`}>
          {Array.from({ length: 9 }).map((_, i) => { const y = -120 + i * 30, a = Math.sin(i * 0.8 + f / 10) * 60; return <g key={i}><line x1={-a} y1={y} x2={a} y2={y} stroke={i % 2 ? COL.red : COL.blue} strokeWidth={8} /><circle cx={-a} cy={y} r={10} {...ink} fill="#fff" /><circle cx={a} cy={y} r={10} {...ink} fill="#fff" /></g>; })}
          <Hand x={0} y={190} size={64}>ADN</Hand>
        </g>
        <g transform={`translate(540 1060) scale(${pop(90.6)})`}>
          <ellipse rx={200} ry={110} {...ink} fill="#2B2D5C" /><ellipse rx={80} ry={36} {...ink} fill={COL.paper} />
          {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={Math.cos(i * 1.7) * (110 + (i % 3) * 25)} cy={Math.sin(i * 1.7) * (55 + (i % 3) * 12)} r={4 + (i % 2) * 3} fill={COL.yellow} />)}
          <Hand x={0} y={200} size={64}>la forme de l'univers ?</Hand>
        </g>
        <Person x={150} feet={1740} s={0.55} f={f} pose={{ point: prog(f, 86.2), smile: 0.8 }} />
      </>)}</Scene>

      {/* 14 — remember: count the holes, not the centimetres */}
      <Scene a={92.9} b={99.8}>{(f) => (<>
        <Paper />
        <g transform={`translate(540 520) scale(${pop(96.1) * 0.8})`}><Ruler x={0} y={0} /></g>
        <RedX f={f} at={97.0} cx={540} cy={520} w={460} h={200} />
        {[[300, 1], [540, 2], [780, 3]].map(([x, n], i) => (
          <g key={i} transform={`translate(${x} 900) scale(${pop(98.4 + i * 0.2)})`}>
            <circle r={90} {...ink} fill={[COL.donut, COL.yellow, COL.clay][i]} />
            {Array.from({ length: n }).map((_, j) => <circle key={j} cx={(j - (n - 1) / 2) * 50} r={18} {...ink} fill={COL.paper} />)}
            <Hand x={0} y={170} size={80} color={COL.red}>{n}</Hand>
          </g>
        ))}
        {prog(f, 98.4) > 0 && <g transform={`translate(540 1240) rotate(-2) scale(${pop(98.4)})`}><rect x={-330} y={-60} width={660} height={110} rx={14} {...ink} fill="#fff" /><Hand x={0} y={20} size={78}>on compte les trous !</Hand></g>}
        <Person x={170} feet={1740} s={0.55} f={f} pose={{ thumbs: prog(f, 98.4), smile: 1 }} />
      </>)}</Scene>

      {/* 15 — outro */}
      <Scene a={99.8} b={103.6}>{(f) => (<>
        <Cafe f={f} />
        <g transform="translate(880 1240) scale(0.8)"><MugDonut cx={0} cy={0} m={1} /></g>
        <Person x={430} feet={1560} f={f} pose={{ wave: 1, smile: 1 }} />
        <g transform={`translate(540 560) rotate(-3) scale(${pop(100.0)})`}><rect x={-280} y={-80} width={560} height={150} rx={16} {...ink} fill="#fff" /><Hand x={0} y={30} size={110} color={COL.red}>Abonne-toi !</Hand></g>
      </>)}</Scene>
    </>
  );
};

/* ---------- captions (handwritten, outside the wobble so they stay crisp) ---------- */
type W = { t: string; s: number; e: number };
const PAGES = (timing as { pages: W[][] }).pages;
const Captions: React.FC = () => {
  const f = useF();
  const { fps } = useVideoConfig();
  const t = f / FPS;
  const page = PAGES.find((p, i) => t >= p[0].s - 0.05 && t < (PAGES[i + 1]?.[0].s ?? p[p.length - 1].e + 0.4));
  if (!page || t > page[page.length - 1].e + 0.6) return null;
  const p = spring({ frame: f - T(page[0].s), fps, config: theme.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1780, display: "flex", justifyContent: "center", opacity: interpolate(p, [0, 0.5], [0, 1], clamp) }}>
      <div style={{ background: "#fff", border: `${SW}px solid ${INK}`, borderRadius: 14, padding: "0 30px 6px", display: "flex", flexWrap: "wrap", gap: "0 14px",
        justifyContent: "center", transform: "rotate(-1deg)" }}>
        {page.map((w, i) => (
          <span key={i} style={{ fontFamily: "Caveat", fontWeight: 700, fontSize: 64, color: t >= w.s && t < w.e + 0.05 ? COL.red : INK }}>{w.t}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- sound ---------- */
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.28 }) => (
  <Sequence from={Math.max(0, T(at))} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);
const SCENE_STARTS = [6.6, 11.1, 15.3, 21.4, 28.2, 32.7, 37.2, 47.5, 57.6, 66.7, 75.6, 85.3, 92.9, 99.8];
const POPS = [3.3, 8.8, 11.5, 16.3, 17.5, 18.9, 24.1, 25.2, 26.3, 29.2, 30.0, 30.6, 35.3, 35.55, 35.8, 37.7, 48.3, 59.8, 60.2, 63.5, 69.2, 71.3, 77.9, 86.9, 88.4, 90.6, 96.1, 98.4, 98.6, 98.8, 100.0];
const MARKS = [24.5, 25.6, 26.9, 31.3, 80.3, 97.0];
const DINGS = [9.4, 46.2, 55.2, 61.8, 73.5, 82.8, 98.4];

export const TopologyExplainer: React.FC = () => {
  useFontFaces([["Caveat", "fonts/caveat-latin-700-normal.woff2", "700"]]);
  const frame = useF();
  const seed = Math.floor(frame / 3) % 6;
  return (
    <AbsoluteFill style={{ background: COL.paper }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <filter id="wob" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#wob)"><Scenes /></g>
      </svg>
      <Captions />
      <Audio src={staticFile("topo/voice.m4a")} />
      <Audio src={staticFile("sfx/bed104b.wav")} volume={(fr) => interpolate(fr, [0, 15, TOPO_FRAMES - 60, TOPO_FRAMES - 40, TOPO_FRAMES - 3], [0, 0.06, 0.06, 0.2, 0], clamp)} />
      {SCENE_STARTS.map((t) => <Sfx key={`w${t}`} at={t - 0.05} src="swipe" v={0.3} />)}
      {POPS.map((t) => <Sfx key={`p${t}`} at={t - 0.03} src="pop" v={0.22} />)}
      {MARKS.map((t) => <Sfx key={`m${t}`} at={t} src="whoosh" v={0.25} />)}
      {DINGS.map((t) => <Sfx key={`d${t}`} at={t} src="ding" v={0.22} />)}
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(frame, [TOPO_FRAMES - 10, TOPO_FRAMES - 1], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
