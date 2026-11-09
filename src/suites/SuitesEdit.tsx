// "Les suites numériques" (Analyse 1) — darija voice-over that names every notion in French.
// Same kit as the ensembles / relations videos: classroom + characters, KaTeX boards, stickers,
// yellow-word captions. Animations: students carrying number cards, indexed boxes u₀ u₁ u₂,
// a number line with hops, a staircase (+r), doubling bars (×q), live plots for
// croissante / décroissante, points converging into a band around ℓ, 1/n → 0, and a divergent spray.
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { clamp, theme } from "../theme";
import { MathBg, Scene as BoardScene, Tex, sec } from "../maths/kit";
import { Sticker } from "../pomme/PommeEdit";
import { P, Person, Sparkles } from "../pomme/world";
import { Classroom, Confetti, Glasses } from "../expose/classroom";
import captions from "./captions.json";

const s = sec;
export const SUITES_FRAMES = s(114.6);
const C = { pink: "#FF4FA3", blue: "#3D8BFF", yellow: "#FFD23F", green: "#2EC27E", purple: "#9B5CFF", cyan: "#22D3EE", white: "#FFFFFF" };
type Cfg = { damping: number; stiffness: number; mass: number };
const sp = (f: number, at: number, cfg: Cfg = theme.spring.bouncy) => (f < at ? 0 : spring({ frame: f - at, fps: 30, config: cfg }));
const pr = (f: number, at: number, d = 0.5) => interpolate(f, [at, at + s(d)], [0, 1], { ...clamp, easing: theme.ease.out });
const FEET = 1520;

/* ---------- classroom scene wrapper: colourful circle wipe ---------- */
const CScene: React.FC<{ a: number; b: number; wipe?: string; children: (f: number) => React.ReactNode }> = ({ a, b, wipe = C.pink, children }) => {
  const f = useCurrentFrame();
  if (f < s(a) || f >= s(b)) return null;
  const t = f - s(a);
  const ring = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: theme.ease.out });
  const p = interpolate(t, [0, 10], [0, 1], { ...clamp, easing: theme.ease.out });
  const out = interpolate(f, [s(b) - 7, s(b)], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: wipe, clipPath: `circle(${ring * 160 * (1 - out)}% at 50% 50%)` }} />
      <AbsoluteFill style={{ clipPath: `circle(${Math.max(0, p * 150 - 6) * (1 - out)}% at 50% 50%)` }}>{children(f)}</AbsoluteFill>
    </AbsoluteFill>
  );
};
const Live: React.FC<{ children: (f: number) => React.ReactNode }> = ({ children }) => <>{children(useCurrentFrame())}</>;

/* ---------- number card held by a student ---------- */
const Card: React.FC<{ x: number; y: number; v: string; color: string; k: number; rank?: string }> = ({ x, y, v, color, k, rank }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${k}) rotate(${(1 - k) * 20}deg)` }}>
    <div style={{ width: 130, height: 130, borderRadius: 26, background: "#fff", border: `7px solid ${color}`, boxShadow: `0 10px 0 rgba(0,0,0,0.15), 0 0 30px ${color}88`,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "KaTeX_Main", fontSize: 84, color: P.ink }}>{v}</div>
    {rank && <div style={{ position: "absolute", left: "50%", top: -64, transform: "translateX(-50%)", fontFamily: "KaTeX_Math", fontStyle: "italic", fontSize: 50,
      color: "#fff", background: color, borderRadius: 18, padding: "0 14px", whiteSpace: "nowrap" }}>{rank}</div>}
  </div>
);

/* ---------- plot helper: axes + points + optional polyline ---------- */
type Pt = { x: number; y: number; at: number; c?: string };
const Plot: React.FC<{ f: number; ox: number; oy: number; w: number; h: number; at: number; pts: Pt[]; line?: string; xl?: string; yl?: string; axes?: boolean }> = ({ f, ox, oy, w, h, at, pts, line, xl = "n", yl = "uₙ", axes = true }) => {
  const a = pr(f, at, 0.6);
  const shown = pts.filter((p) => f >= p.at);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs><marker id="pa" markerWidth={8} markerHeight={8} refX={5} refY={4} orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 Z" fill="#fff" /></marker></defs>
      {axes && <>
      <path d={`M ${ox} ${oy} L ${ox + w * a} ${oy}`} stroke="#fff" strokeWidth={5} markerEnd={a > 0.95 ? "url(#pa)" : undefined} />
      <path d={`M ${ox} ${oy} L ${ox} ${oy - h * a}`} stroke="#fff" strokeWidth={5} markerEnd={a > 0.95 ? "url(#pa)" : undefined} />
      {a > 0.9 && <text x={ox + w + 10} y={oy + 50} fill="#fff" fontFamily="KaTeX_Math" fontStyle="italic" fontSize={50}>{xl}</text>}
      {a > 0.9 && <text x={ox - 30} y={oy - h - 20} fill="#fff" fontFamily="KaTeX_Math" fontStyle="italic" fontSize={50}>{yl}</text>}
      </>}
      {line && shown.length > 1 && <polyline points={shown.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={line} strokeWidth={6} strokeDasharray="14 12"
        style={{ filter: `drop-shadow(0 0 10px ${line})` }} opacity={0.8} />}
      {shown.map((p, i) => {
        const k = sp(f, p.at);
        return <circle key={i} cx={p.x} cy={p.y} r={18 * k} fill={p.c ?? C.yellow} stroke="#fff" strokeWidth={4} style={{ filter: `drop-shadow(0 0 14px ${p.c ?? C.yellow})` }} />;
      })}
    </svg>
  );
};

/* ================= classroom story ================= */
const Intro: React.FC = () => (
  <>
    {/* 0 — title */}
    <CScene a={0} b={8.2} wipe={C.purple}>{(f) => (<>
      <Classroom boardText={f > s(5.4) ? "(uₙ)" : "Analyse 1"} />
      <Sticker at={s(0.4)} x={540} y={760} bg={C.purple} size={80} rot={-3}>Analyse 1</Sticker>
      <Sticker at={s(5.5)} x={540} y={890} bg={C.pink} size={104} rot={3}>Les suites</Sticker>
      <Sticker at={s(6.6)} x={540} y={1020} bg={C.blue} size={64} rot={-2}>numériques</Sticker>
      <Sparkles at={s(5.7)} x={540} y={890} color={C.yellow} />
      <Person x={860} feet={1360} shirt="#7A8BA6" hair="#9AA0A8" scale={0.9} armR={-120 + Math.sin(f / 3) * 15} face={-1} />
      <Glasses x={860} feet={1360} scale={0.9} />
      <Person x={220} feet={FEET} shirt={C.blue} hair="#1B1530" scale={1.0} armR={-150 + Math.sin(f / 4) * 20} face={1} />
      <Person x={470} feet={FEET + 60} shirt={C.yellow} hair="#6B3A1E" skin={P.skin2} scale={0.85} armR={-150 + Math.sin(f / 4 + 1) * 20} face={1} />
    </>)}</CScene>

    {/* 1 — what is a suite? students line up holding ordered number cards */}
    <CScene a={8.2} b={17.9} wipe={C.yellow}>{(f) => {
      const vals = ["1", "3", "5", "7", "9"], shirts = [C.pink, C.blue, C.green, C.purple, C.cyan];
      return (<>
        <Classroom boardText={f > s(9.4) ? "une suite ?" : ""} />
        {vals.map((v, i) => {
          const at = s(10.4) + i * 7;
          const x = interpolate(f, [at, at + s(0.9)], [1300, 140 + i * 200], { ...clamp, easing: theme.ease.inOut });
          const walking = f > at && f < at + s(0.9);
          return (
            <div key={i}>
              <Person x={x} feet={FEET} shirt={shirts[i]} hair={["#3B2416", "#1B1530", "#6B3A1E"][i % 3]} skin={i % 2 ? P.skin2 : undefined} scale={0.62}
                walk={walking ? 1 : 0} armR={-160} armL={160} face={-1} />
              <Card x={x} y={FEET - 330} v={v} color={shirts[i]} k={sp(f, at + s(0.6))} rank={f > s(14.6) + i * 4 ? `${i}` : undefined} />
            </div>
          );
        })}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path d="M 120 1600 L 960 1600" stroke={C.pink} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1}
            strokeDashoffset={1 - pr(f, s(12.6), 1.0)} style={{ filter: `drop-shadow(0 0 12px ${C.pink})` }} />
        </svg>
        <Sticker at={s(9.5)} x={540} y={760} bg={C.pink} size={90} rot={-3}>une suite ?</Sticker>
        <Sticker at={s(12.5)} x={540} y={900} bg={C.white} color={P.ink} size={56} rot={2}>liste ordonnée de nombres</Sticker>
        <Sticker at={s(15.4)} x={540} y={1010} bg={C.green} size={50} rot={-2}>chaque nombre a sa place</Sticker>
      </>);
    }}</CScene>
  </>
);

/* ================= board scenes ================= */
const Boards: React.FC = () => (
  <>
    {/* 2 — notation: u_n, n = rang, u0 u1 u2 ... */}
    <BoardScene from={s(17.9)} to={s(27.55)} n="1" title="La notation">
      <Tex at={s(19.0)} y={420} size={150} tex={"(u_n)_{n\\in\\mathbb{N}}"} glow="rgba(255,79,163,0.5)" />
      <Live>{(f) => {
        const labels = ["u_0", "u_1", "u_2", "u_3", "\\cdots"], cols = [C.pink, C.blue, C.green, C.purple, "#8C90A6"];
        const times = [s(23.6), s(24.6), s(25.4), s(26.1), s(26.4)];
        return (<>
          {labels.map((l, i) => {
            const k = sp(f, times[i]);
            return k > 0 && <div key={i} style={{ position: "absolute", left: 60 + i * 196, top: 820, width: 176, height: 176, borderRadius: 30,
              border: `6px solid ${cols[i]}`, background: `${cols[i]}22`, transform: `scale(${k}) translateY(${Math.sin(f / 10 + i) * 6}px)`, boxShadow: `0 0 30px ${cols[i]}66` }} />;
          })}
          {labels.map((l, i) => <Tex key={l} at={times[i]} x={148 + i * 196} y={908} size={84} tex={l} />)}
          {[0, 1, 2, 3].map((i) => f > s(21.0) && <div key={i} style={{ position: "absolute", left: 148 + i * 196, top: 1080, transform: `translate(-50%,0) scale(${sp(f, s(21.0) + i * 4)})`,
            fontFamily: "KaTeX_Main", fontSize: 54, color: C.yellow }}>{`n = ${i}`}</div>)}
          {f > s(21.0) && <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <path d="M 300 1260 Q 540 1180 760 1260" fill="none" stroke={C.yellow} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pr(f, s(21.2), 0.6)} />
          </svg>}
        </>);
      }}</Live>
      <Sticker at={s(21.4)} x={540} y={1340} bg={C.yellow} color={P.ink} size={70} rot={-3}>n = le rang</Sticker>
      <Sticker at={s(19.6)} x={540} y={620} bg={C.pink} size={52} rot={2}>u indice n</Sticker>
    </BoardScene>

    {/* 3 — example u_n = 2n + 1 → 1, 3, 5, 7 on a number line with hops */}
    <BoardScene from={s(27.55)} to={s(36.6)} n="2" title="Exemple">
      <Tex at={s(29.3)} y={430} size={140} tex={"u_n = 2n + 1"} box={{ at: s(31.0), color: C.blue }} glow="rgba(61,139,255,0.5)" />
      <Live>{(f) => {
        const X = (v: number) => 120 + v * 105, Y = 1100;
        const vals = [1, 3, 5, 7], at = [s(33.3), s(34.0), s(34.6), s(35.3)];
        const tbl = pr(f, s(31.4), 0.6);
        return (<>
          {/* small n → u_n table */}
          <div style={{ position: "absolute", left: 140, top: 640, width: 800, opacity: tbl, transform: `translateY(${(1 - tbl) * 30}px)`,
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)", fontFamily: "KaTeX_Main", fontSize: 54, color: "#fff", textAlign: "center",
            border: "4px solid #ffffff55", borderRadius: 22, overflow: "hidden" }}>
            {["n", "0", "1", "2", "3"].map((t, i) => <div key={t} style={{ padding: 10, background: "#ffffff14", fontStyle: i ? "normal" : "italic" }}>{t}</div>)}
            {["uₙ", "1", "3", "5", "7"].map((t, i) => <div key={i} style={{ padding: 10, color: i && f > at[i - 1] ? C.yellow : i ? "#ffffff33" : "#fff", borderTop: "3px solid #ffffff33" }}>{t}</div>)}
          </div>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <line x1={X(0) - 40} x2={X(0) - 40 + (X(8.3) - X(0) + 40) * pr(f, s(32.6), 0.7)} y1={Y} y2={Y} stroke="#fff" strokeWidth={6} />
            {Array.from({ length: 9 }).map((_, v) => f > s(32.7) + v * 2 && <g key={v}>
              <line x1={X(v)} x2={X(v)} y1={Y - 16} y2={Y + 16} stroke="#fff" strokeWidth={4} />
              <text x={X(v)} y={Y + 70} textAnchor="middle" fill="#ffffffaa" fontFamily="KaTeX_Main" fontSize={44}>{v}</text>
            </g>)}
            {vals.slice(1).map((v, i) => {
              const p = pr(f, at[i + 1] - 6, 0.3);
              return p > 0 && <path key={v} d={`M ${X(vals[i])} ${Y - 30} Q ${(X(vals[i]) + X(v)) / 2} ${Y - 190} ${X(v)} ${Y - 30}`} fill="none" stroke={C.pink} strokeWidth={7}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 10px ${C.pink})` }} />;
            })}
            {vals.map((v, i) => { const k = sp(f, at[i]); return <circle key={v} cx={X(v)} cy={Y} r={26 * k} fill={C.yellow} stroke="#fff" strokeWidth={5} style={{ filter: `drop-shadow(0 0 16px ${C.yellow})` }} />; })}
            {vals.slice(1).map((v, i) => f > at[i + 1] && <text key={v} x={(X(vals[i]) + X(v)) / 2} y={Y - 140} textAnchor="middle" fill={C.pink} fontFamily="KaTeX_Main" fontSize={46}>+2</text>)}
          </svg>
          <Sticker at={s(35.6)} x={540} y={1380} bg={C.yellow} color={P.ink} size={64} rot={-2}>1, 3, 5, 7 …</Sticker>
        </>);
      }}</Live>
    </BoardScene>
  </>
);

/* ================= arithmetic: the staircase ================= */
const Arith: React.FC = () => (
  <CScene a={36.6} b={52.4} wipe={C.green}>{(f) => {
    const step = 150, rise = 96, x0 = 120, base = FEET;
    const climb = interpolate(f, [s(42.2), s(46.0)], [0, 4], { ...clamp });
    const ci = Math.min(4, Math.floor(climb)), frac = climb - ci;
    const hop = Math.sin(Math.PI * frac) * 70 * (climb < 4 ? 1 : 0);
    const px = x0 + 60 + (ci + (climb < 4 ? frac : 0)) * step;
    const pfeet = base - (ci + (climb < 4 ? Math.min(1, frac * 1.6) : 0)) * rise;
    return (<>
      <Classroom screen={f > s(48.0) ? <div style={{ transform: "scale(0.9)" }} /> : undefined} boardText={f < s(48.0) ? "+ r" : undefined} />
      {f >= s(48.0) && <Tex at={s(48.0)} x={680} y={415} size={72} tex={"u_{n+1} = u_n + r"} box={{ at: s(50.4), color: C.yellow }} maxW={600} />}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const k = sp(f, s(40.6) + i * 4);
          const y = base - (i + 1) * rise;
          return <g key={i} transform={`translate(0 ${(1 - k) * 300})`} opacity={Math.min(1, k * 2)}>
            <rect x={x0 + i * step} y={y} width={step + 4} height={(i + 1) * rise} fill={[C.pink, C.blue, C.green, C.purple, C.cyan][i]} stroke="#fff" strokeWidth={5} />
            <text x={x0 + i * step + step / 2} y={y + 70} textAnchor="middle" fill="#fff" fontFamily="KaTeX_Math" fontStyle="italic" fontSize={46}>{`u${"₀₁₂₃₄"[i]}`}</text>
          </g>;
        })}
        {[0, 1, 2, 3].map((i) => {
          const p = pr(f, s(45.9) + i * 5, 0.35);
          const x = x0 + (i + 1) * step + 10, y1 = base - (i + 1) * rise, y2 = y1 - rise;
          return p > 0 && <g key={i}>
            <line x1={x} x2={x} y1={y1} y2={y1 - rise * p} stroke={C.yellow} strokeWidth={8} style={{ filter: `drop-shadow(0 0 8px ${C.yellow})` }} />
            <text x={x + 10} y={(y1 + y2) / 2 + 16} fill={C.yellow} fontFamily="KaTeX_Main" fontSize={44} opacity={p}>+r</text>
          </g>;
        })}
      </svg>
      <Person x={px} feet={pfeet - rise} jump={hop} shirt={C.yellow} hair="#3B2416" scale={0.6} walk={climb > 0 && climb < 4 ? 1 : 0}
        armR={climb >= 4 ? -150 + Math.sin(f / 4) * 20 : 8} face={1} />
      <Sticker at={s(40.6)} x={540} y={740} bg={C.green} size={70} rot={-3}>suite arithmétique</Sticker>
      <Sticker at={s(46.0)} x={300} y={860} bg={C.yellow} color={P.ink} size={64} rot={3}>la raison r</Sticker>
      <Sticker at={s(43.0)} x={720} y={860} bg={C.white} color={P.ink} size={44} rot={-2} until={s(46.0)}>on ajoute le même nombre</Sticker>
      {f > s(46.0) && <Sparkles at={s(46.0)} x={px} y={pfeet - rise - 300} color={C.yellow} />}
    </>);
  }}</CScene>
);

/* ================= geometric: doubling bars ================= */
const Geo: React.FC = () => (
  <BoardScene from={s(52.4)} to={s(59.9)} n="3" title="Suite géométrique">
    <Sticker at={s(53.3)} x={540} y={330} bg={C.purple} size={70} rot={-3}>suite géométrique</Sticker>
    <Live>{(f) => {
      const vals = [1, 2, 4, 8, 16], base = 1250, unit = 38;
      return (<>
        {vals.map((v, i) => {
          const at = s(55.0) + i * 9;
          const g = interpolate(f, [at, at + s(0.5)], [0, 1], { ...clamp, easing: theme.ease.out });
          const h = v * unit * g, x = 150 + i * 190;
          return g > 0 && <div key={i}>
            <div style={{ position: "absolute", left: x - 60, top: base - h, width: 120, height: h, borderRadius: "18px 18px 6px 6px",
              background: `linear-gradient(180deg, ${C.pink}, ${C.purple})`, boxShadow: `0 0 30px ${C.pink}88`, border: "4px solid #fff" }} />
            <div style={{ position: "absolute", left: x, top: base - h - 70, transform: "translateX(-50%)", fontFamily: "KaTeX_Main", fontSize: 54, color: "#fff" }}>{v}</div>
            <div style={{ position: "absolute", left: x, top: base + 20, transform: "translateX(-50%)", fontFamily: "KaTeX_Math", fontStyle: "italic", fontSize: 44, color: "#ffffffaa" }}>{`u${"₀₁₂₃₄"[i]}`}</div>
          </div>;
        })}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 1, 2, 3].map((i) => {
            const at = s(55.0) + (i + 1) * 9 - 4, p = pr(f, at, 0.3);
            const x1 = 150 + i * 190, x2 = x1 + 190, y = base - vals[i + 1] * unit - 110;
            return p > 0 && <g key={i}>
              <path d={`M ${x1 + 20} ${base - vals[i] * unit - 90} Q ${(x1 + x2) / 2} ${y - 70} ${x2 - 10} ${y + 10}`} fill="none" stroke={C.yellow} strokeWidth={6}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              <text x={(x1 + x2) / 2} y={y - 60} textAnchor="middle" fill={C.yellow} fontFamily="KaTeX_Main" fontSize={44} opacity={p}>×2</text>
            </g>;
          })}
        </svg>
      </>);
    }}</Live>
    <Tex at={s(57.2)} y={1440} size={110} tex={"u_{n+1} = q \\times u_n"} box={{ at: s(58.6), color: C.purple }} glow="rgba(155,92,255,0.5)" />
    <Sticker at={s(55.4)} x={540} y={440} bg={C.white} color={P.ink} size={44} rot={3}>on multiplie par q</Sticker>
  </BoardScene>
);

/* ================= variation: croissante / décroissante ================= */
const Variation: React.FC = () => (
  <BoardScene from={s(59.9)} to={s(76.7)} n="4" title="Sens de variation">
    <Live>{(f) => {
      const up: Pt[] = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 130 + i * 62, y: 1000 - i * 50 - (i % 2) * 8, at: s(63.2) + i * 4, c: C.green }));
      const dn: Pt[] = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 610 + i * 62, y: 760 + i * 46 + (i % 2) * 6, at: s(64.0) + i * 4, c: C.pink }));
      const pos = sp(f, s(69.2)), neg = sp(f, s(72.3));
      return (<>
        <Plot f={f} ox={100} oy={1060} w={400} h={380} at={s(62.9)} pts={up} line={C.green} />
        <Plot f={f} ox={580} oy={1060} w={400} h={380} at={s(63.4)} pts={dn} line={C.pink} />
        <Sticker at={s(63.4)} x={300} y={1150} bg={C.green} size={44} rot={-3}>croissante ↗</Sticker>
        <Sticker at={s(64.6)} x={780} y={1150} bg={C.pink} size={44} rot={3}>décroissante ↘</Sticker>
        <Tex at={s(66.3)} y={430} size={120} tex={"u_{n+1} - u_n"} box={{ at: s(68.0), color: C.yellow }} glow="rgba(255,210,63,0.45)" />
        {/* the two verdict rows */}
        {[[pos, "> 0", "croissante", C.green, 1290], [neg, "< 0", "décroissante", C.pink, 1440]].map(([k, sign, word, col, y]) => (k as number) > 0 && (
          <div key={word as string} style={{ position: "absolute", left: 540, top: y as number, transform: `translate(-50%,-50%) scale(${k as number})`, display: "flex", alignItems: "center", gap: 26,
            background: `${col}22`, border: `5px solid ${col}`, borderRadius: 30, padding: "12px 34px", whiteSpace: "nowrap", boxShadow: `0 0 30px ${col}66` }}>
            <span style={{ fontFamily: "KaTeX_Main", fontSize: 64, color: "#fff" }}>{sign as string}</span>
            <span style={{ fontFamily: "KaTeX_Main", fontSize: 64, color: col as string }}>⟹</span>
            <span style={{ fontFamily: "Rajdhani", fontWeight: 700, fontSize: 64, color: "#fff" }}>{word as string}</span>
          </div>
        ))}
      </>);
    }}</Live>
  </BoardScene>
);

/* ================= the limit ================= */
const Limit: React.FC = () => (
  <>
    <CScene a={76.7} b={81.38} wipe={C.blue}>{(f) => {
      const x = interpolate(f, [s(77.0), s(81.2)], [160, 760], { ...clamp, easing: theme.ease.inOut });
      return (<>
        <Classroom boardText={f > s(78.8) ? "lim" : ""} />
        <Person x={x} feet={FEET} shirt={C.blue} hair="#1B1530" scale={1.0} walk={1} face={1} />
        <Sticker at={s(78.8)} x={540} y={780} bg={C.blue} size={110} rot={-3}>la limite</Sticker>
        <Sticker at={s(77.0)} x={540} y={930} bg={C.yellow} color={P.ink} size={52} rot={3}>le plus important !</Sticker>
        <Sparkles at={s(79.0)} x={540} y={780} color={C.yellow} />
      </>);
    }}</CScene>

    {/* converge vers l: points approach a dashed line, band tightens */}
    <BoardScene from={s(81.38)} to={s(90.6)} n="5" title="Convergence">
      <Tex at={s(81.6)} y={420} size={110} tex={"n \\to +\\infty"} glow="rgba(61,139,255,0.5)" />
      <Live>{(f) => {
        const L = 820;
        const pts: Pt[] = Array.from({ length: 14 }).map((_, i) => ({ x: 140 + i * 58, y: L + 360 * Math.pow(0.72, i) * (i % 2 ? -0.7 : 1), at: s(82.0) + i * 6, c: C.cyan }));
        const band = pr(f, s(86.0), 1.2);
        const bw = 140 - 100 * pr(f, s(87.5), 1.5);
        const zoom = 1 + 0.12 * pr(f, s(88.0), 1.5);
        return (<div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "900px 820px" }}>
          {band > 0 && <div style={{ position: "absolute", left: 100, width: 900 * band, top: L - bw / 2, height: bw, background: `${C.yellow}22`, borderTop: `3px dashed ${C.yellow}88`, borderBottom: `3px dashed ${C.yellow}88` }} />}
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <line x1={100} x2={100 + 900 * pr(f, s(86.0), 0.8)} y1={L} y2={L} stroke={C.yellow} strokeWidth={6} strokeDasharray="20 14" style={{ filter: `drop-shadow(0 0 10px ${C.yellow})` }} />
          </svg>
          {f > s(86.6) && <div style={{ position: "absolute", left: 1000, top: L - 50, fontFamily: "KaTeX_Math", fontStyle: "italic", fontSize: 76, color: C.yellow, transform: `scale(${sp(f, s(86.6))})` }}>ℓ</div>}
          <Plot f={f} ox={100} oy={1260} w={880} h={720} at={s(81.6)} pts={pts} line={C.cyan} />
        </div>);
      }}</Live>
      <Sticker at={s(88.3)} x={540} y={1390} bg={C.green} size={64} rot={-3}>converge vers ℓ</Sticker>
      <Tex at={s(88.8)} y={1540} size={90} tex={"\\lim_{n\\to+\\infty} u_n = \\ell"} />
    </BoardScene>

    {/* 1/n → 0 */}
    <BoardScene from={s(90.6)} to={s(95.6)} n="5" title="Exemple">
      <Tex at={s(91.5)} y={430} size={130} tex={"u_n = \\dfrac{1}{n}"} glow="rgba(255,79,163,0.5)" />
      <Live>{(f) => {
        const pts: Pt[] = Array.from({ length: 12 }).map((_, i) => ({ x: 170 + i * 66, y: 1240 - 520 / (i + 1), at: s(92.0) + i * 3, c: C.pink }));
        return (<>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <line x1={110} x2={110 + 880 * pr(f, s(92.6), 0.8)} y1={1240} y2={1240} stroke={C.green} strokeWidth={10} style={{ filter: `drop-shadow(0 0 14px ${C.green})` }} />
          </svg>
          <Plot f={f} ox={110} oy={1240} w={880} h={560} at={s(91.6)} pts={pts} line={C.pink} />
        </>);
      }}</Live>
      <Tex at={s(93.4)} y={1440} size={100} tex={"\\dfrac{1}{n} \\longrightarrow 0"} box={{ at: s(94.4), color: C.green }} />
    </BoardScene>

    {/* diverge */}
    <BoardScene from={s(95.6)} to={s(100.9)} n="5" title="Divergence">
      <Live>{(f) => {
        const up: Pt[] = Array.from({ length: 9 }).map((_, i) => ({ x: 150 + i * 70, y: 1200 - i * i * 9, at: s(96.0) + i * 4, c: C.purple }));
        const osc: Pt[] = Array.from({ length: 9 }).map((_, i) => ({ x: 170 + i * 70, y: 1050 + (i % 2 ? 110 : -110), at: s(97.2) + i * 4, c: C.cyan }));
        const shake = f > s(99.5) && f < s(100.2) ? Math.sin(f * 2.5) * 10 : 0;
        return (<div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
          <Plot f={f} ox={110} oy={1260} w={880} h={640} at={s(95.8)} pts={up} line={C.purple} />
          <Plot f={f} ox={110} oy={1260} w={0} h={0} at={s(95.8)} pts={osc} line={C.cyan} axes={false} />
        </div>);
      }}</Live>
      <Tex at={s(96.4)} y={420} size={84} tex={"u_n = n^2 \\qquad v_n = (-1)^n"} />
      <Sticker at={s(99.6)} x={540} y={1440} bg={C.pink} size={96} rot={-3}>diverge !</Sticker>
    </BoardScene>
  </>
);

/* ================= summary + outro ================= */
const Outro: React.FC = () => (
  <>
    <CScene a={100.9} b={107.4} wipe={C.yellow}>{(f) => (<>
      <Classroom boardText="résumé" />
      <Person x={180} feet={FEET} shirt={C.pink} hair="#3B2416" scale={0.95} armR={-70} face={1} />
      <div style={{ position: "absolute", left: 330, top: 760, width: 690, transform: `rotate(-2deg) scale(${sp(f, s(101.0))})`, background: "#fff", borderRadius: 26,
        border: `6px solid ${P.ink}`, padding: "24px 34px", boxShadow: "0 12px 0 rgba(0,0,0,0.15)" }}>
        {[["1", "définir la suite", s(101.9), C.pink], ["2", "sens de variation", s(103.6), C.blue], ["3", "calculer la limite", s(106.3), C.green]].map(([n, t, at, col]) => {
          const k = sp(f, at as number);
          return <div key={n as string} style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 0", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 52, color: P.ink,
            opacity: 0.35 + 0.65 * Math.min(1, k * 2), transform: `translateX(${(1 - Math.min(1, k)) * 40}px)` }}>
            <span style={{ width: 62, height: 62, borderRadius: 31, background: k > 0.2 ? (col as string) : "#E5E9F2", color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 40, transform: `scale(${0.6 + 0.4 * k})` }}>{k > 0.2 ? "✓" : (n as string)}</span>{t as string}</div>;
        })}
      </div>
      <Sticker at={s(101.0)} x={540} y={700} bg={C.purple} size={64} rot={-3}>la méthode</Sticker>
    </>)}</CScene>

    <CScene a={107.4} b={114.6} wipe={C.pink}>{(f) => (<>
      <Classroom boardText="(uₙ) ✓" />
      {[[230, C.pink, "#3B2416"], [540, C.blue, "#1B1530"], [850, C.yellow, "#6B3A1E"]].map(([x, sh, h], i) => (
        <Person key={i} x={x as number} feet={FEET} shirt={sh as string} hair={h as string} skin={i === 1 ? P.skin2 : undefined} scale={1.0}
          armR={-150 + Math.sin(f / 4 + i) * 22} face={0} jump={f > s(110.0) ? Math.abs(Math.sin((f + i * 6) / 6)) * 30 : 0} />
      ))}
      <Sticker at={s(108.0)} x={540} y={740} bg={C.green} size={70} rot={-3}>les suites : ✓</Sticker>
      <Sticker at={s(111.2)} x={540} y={880} bg={C.pink} size={96} rot={3}>Abonne-toi !</Sticker>
      <Confetti at={s(110.0)} />
    </>)}</CScene>
  </>
);

/* ---------- captions (yellow active word; Arabic pages right-to-left) ---------- */
type W = { t: string; s: number; e: number; rtl: boolean };
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / 30;
  const pages = captions as W[][];
  const page = pages.find((p, i, arr) => t >= p[0].s - 0.05 && t < (arr[i + 1]?.[0].s ?? p[p.length - 1].e + 0.4));
  if (!page || t > page[page.length - 1].e + 0.5) return null;
  const p = spring({ frame: frame - s(page[0].s), fps, config: theme.spring.snappy });
  const rtl = page[0].rtl;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1680, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", padding: "10px 28px", direction: rtl ? "rtl" : "ltr",
        background: "rgba(10,8,25,0.82)", borderRadius: 22, border: `3px solid ${rtl ? "rgba(255,255,255,0.9)" : C.yellow}` }}>
        {page.map((w, i) => (
          <span key={i} style={{ fontFamily: rtl ? "CairoAr" : "InterX", fontWeight: 800, fontSize: rtl ? 54 : 50, lineHeight: 1.35,
            color: t >= w.s && t < w.e + 0.1 ? C.yellow : t >= w.s ? "#fff" : "rgba(255,255,255,0.5)" }}>{w.t}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- sound ---------- */
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);
const CUTS = [8.2, 17.9, 27.55, 36.6, 52.4, 59.9, 76.7, 81.38, 90.6, 95.6, 100.9, 107.4];
const POPS = [0.4, 5.5, 6.6, 9.5, 12.5, 15.4, 19.6, 21.4, 23.6, 24.6, 25.4, 26.1, 33.3, 34.0, 34.6, 35.3, 35.6, 40.6, 40.73, 40.87, 41.0, 41.13, 43.0, 46.0,
  53.3, 55.4, 63.4, 64.6, 77.0, 78.8, 86.6, 88.3, 99.6, 101.0, 108.0, 111.2];
const SWIPES = [10.4, 10.63, 10.87, 11.1, 11.33, 12.6, 19.0, 29.3, 33.1, 48.0, 57.2, 66.3, 81.6, 86.0, 91.5, 93.4];
const DINGS = [31.0, 46.0, 46.07, 50.4, 58.6, 68.0, 69.2, 72.3, 88.8, 94.4, 101.9, 103.6, 106.3];
const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("suites/voice.m4a")} />
    <Audio src={staticFile("sfx/bed116.wav")} volume={(fr) => interpolate(fr, [0, 15, s(110.8), s(111.2), SUITES_FRAMES - 3], [0, 0.06, 0.06, 0.2, 0], clamp)} />
    {CUTS.map((t) => <Sfx key={`w${t}`} at={s(t) - 2} src="whoosh" v={0.32} />)}
    {POPS.map((t) => <Sfx key={`p${t}`} at={s(t) - 1} src="pop" v={0.22} />)}
    {SWIPES.map((t) => <Sfx key={`s${t}`} at={s(t)} src="swipe" v={0.24} />)}
    {DINGS.map((t) => <Sfx key={`d${t}`} at={s(t)} src="ding" v={0.2} />)}
    {Array.from({ length: 4 }).map((_, i) => <Sfx key={`h${i}`} at={s(42.2) + i * 28} src="tick" v={0.16} />)}
    {Array.from({ length: 5 }).map((_, i) => <Sfx key={`g${i}`} at={s(55.0) + i * 9} src="tick" v={0.16} />)}
    {Array.from({ length: 14 }).map((_, i) => <Sfx key={`c${i}`} at={s(82.0) + i * 6} src="tick" v={0.1} />)}
    <Sfx at={s(99.5)} src="bass" v={0.35} />
    <Sfx at={s(110.0)} src="check" v={0.25} />
  </>
);

export const SuitesEdit: React.FC = () => {
  useFontFaces([
    ["Anton", "fonts/anton.woff2", "400"],
    ["InterX", "fonts/inter-600.woff2", "600"],
    ["InterX", "fonts/inter-800.woff2", "800"],
    ["Lalezar", "fonts/lalezar-arabic-400-normal.woff2", "400"],
    ["CairoAr", "fonts/cairo-arabic-800-normal.woff2", "800"],
    ["CairoLatin", "fonts/cairo-latin-900-normal.woff2", "900"],
    ["Rajdhani", "fonts/rajdhani-latin-700-normal.woff2", "700"],
  ]);
  const f = useCurrentFrame();
  const board = (f >= s(17.9) && f < s(36.6)) || (f >= s(52.4) && f < s(76.7)) || (f >= s(81.38) && f < s(100.9));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {board && <MathBg />}
      {board && <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 20%, ${C.purple}33, transparent 45%), radial-gradient(circle at 10% 85%, ${C.blue}2A, transparent 45%)` }} />}
      <Intro />
      <Boards />
      <Arith />
      <Geo />
      <Variation />
      <Limit />
      <Outro />
      <Captions />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [SUITES_FRAMES - 8, SUITES_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
