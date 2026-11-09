// "Les relations binaires" — 106 s explainer on the user's own voice-over (public/relations/voice.m4a).
// Same kit as the ensembles / pomme videos (characters, classroom, KaTeX boards, stickers, yellow-word captions),
// with richer animation: walking students, a height chart with counters, drawn relation graphs
// (self-loops, two-way arrows, merging nodes, dashed transitive edge), a live comparison table and a sorting line-up.
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { clamp, theme } from "../theme";
import { MathBg, Scene as BoardScene, Tex, sec } from "../maths/kit";
import { Sticker } from "../pomme/PommeEdit";
import { P, Person, Sparkles } from "../pomme/world";
import { Classroom, Confetti, Glasses, K } from "../expose/classroom";
import captions from "./captions.json";

const s = sec;
export const RELATIONS_FRAMES = s(106.0);
const C = { pink: "#FF4FA3", blue: "#3D8BFF", yellow: "#FFD23F", green: "#2EC27E", purple: "#9B5CFF", orange: "#FF8A3D", white: "#FFFFFF" };
const sp = (f: number, at: number, cfg: { damping: number; stiffness: number; mass: number } = theme.spring.bouncy) => (f < at ? 0 : spring({ frame: f - at, fps: 30, config: cfg }));
const pr = (f: number, at: number, d = 0.5) => interpolate(f, [at, at + s(d)], [0, 1], { ...clamp, easing: theme.ease.out });

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

/* ---------- relation graph: nodes + drawn arrows (normal, two-way, self-loop, dashed) ---------- */
type Node = { id: string; x: number; y: number; label: string; color: string; at: number };
type Edge = { from: string; to: string; at: number; color?: string; dashed?: boolean; bend?: number; label?: string };
const Graph: React.FC<{ f: number; nodes: Node[]; edges: Edge[]; merge?: { a: string; b: string; at: number } }> = ({ f, nodes, edges, merge }) => {
  const m = merge ? interpolate(f, [merge.at, merge.at + s(0.7)], [0, 1], { ...clamp, easing: theme.ease.inOut }) : 0;
  const pos = (n: Node): [number, number] => {
    if (!merge || (n.id !== merge.a && n.id !== merge.b)) return [n.x, n.y];
    const A = nodes.find((k) => k.id === merge.a)!, B = nodes.find((k) => k.id === merge.b)!;
    const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
    return [n.x + (cx - n.x) * m, n.y + (cy - n.y) * m];
  };
  const R = 62;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        {["#FFD23F", "#FF4FA3", "#3D8BFF", "#2EC27E", "#FFFFFF"].map((c) => (
          <marker key={c} id={`ah${c.slice(1)}`} markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4 L0,8 Z" fill={c} />
          </marker>
        ))}
      </defs>
      {edges.map((e, i) => {
        if (f < e.at) return null;
        const A = nodes.find((n) => n.id === e.from)!, B = nodes.find((n) => n.id === e.to)!;
        const [x1, y1] = pos(A), [x2, y2] = pos(B);
        const p = interpolate(f, [e.at, e.at + s(0.55)], [0, 1], { ...clamp, easing: theme.ease.out });
        const col = e.color ?? C.yellow;
        const fade = merge && m > 0 && (e.from === merge.a || e.from === merge.b) && (e.to === merge.a || e.to === merge.b) ? 1 - m : 1;
        let d: string;
        if (e.from === e.to) {
          d = `M ${x1 - 34} ${y1 - R + 6} C ${x1 - 120} ${y1 - R - 170} ${x1 + 120} ${y1 - R - 170} ${x1 + 34} ${y1 - R + 6}`;
        } else {
          const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, bend = e.bend ?? 0.18;
          const sx = x1 + ux * (R + 8), sy = y1 + uy * (R + 8), ex = x2 - ux * (R + 18), ey = y2 - uy * (R + 18);
          const mx = (sx + ex) / 2 - uy * L * bend, my = (sy + ey) / 2 + ux * L * bend;
          d = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
        }
        const glow = e.dashed ? 0.6 + 0.4 * Math.sin(f / 5) : 1;
        return (
          <g key={i} opacity={fade}>
            <path d={d} fill="none" stroke={col} strokeWidth={10} strokeLinecap="round" pathLength={1}
              strokeDasharray={e.dashed ? undefined : 1} strokeDashoffset={e.dashed ? undefined : 1 - p}
              style={{ filter: `drop-shadow(0 0 ${12 * glow}px ${col})`, ...(e.dashed ? { strokeDasharray: "0.04 0.03", opacity: p } : {}) }}
              markerEnd={p > 0.92 ? `url(#ah${col.slice(1)})` : undefined} />
          </g>
        );
      })}
      {nodes.map((n) => {
        const k = sp(f, n.at);
        if (k === 0) return null;
        const [x, y] = pos(n);
        const hide = merge && n.id === merge.b && m > 0.98;
        if (hide) return null;
        const merged = merge && n.id === merge.a && m > 0.98;
        return (
          <g key={n.id} transform={`translate(${x} ${y}) scale(${k * (merged ? 1.15 : 1)})`}>
            <circle r={R} fill={merged ? C.green : n.color} stroke="#fff" strokeWidth={6} style={{ filter: `drop-shadow(0 0 18px ${merged ? C.green : n.color})` }} />
            <text y={22} textAnchor="middle" fontFamily="KaTeX_Math" fontStyle="italic" fontSize={merged ? 46 : 64} fill="#fff">{merged ? "a = b" : n.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ---------- height chart (toise) ---------- */
const Toise: React.FC<{ f: number; x: number; feet: number; at: number; meters: number; color: string; pxPerM: number }> = ({ f, x, feet, at, meters, color, pxPerM }) => {
  const p = interpolate(f, [at, at + s(1.0)], [0, 1], { ...clamp, easing: theme.ease.out });
  if (f < at - s(0.6)) return null;
  const h = meters * pxPerM * p;
  return (
    <>
      <div style={{ position: "absolute", left: x - 18, top: feet - h, width: 36, height: h, borderRadius: 18, background: color, boxShadow: `0 0 24px ${color}`, opacity: 0.9 }} />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: x - (i % 5 === 0 ? 34 : 26), top: feet - i * pxPerM * 0.2, width: i % 5 === 0 ? 68 : 52, height: 4, background: "#ffffffaa" }} />
      ))}
      {p > 0 && <div style={{ position: "absolute", left: x - 120, top: feet - h - 92, width: 240, textAlign: "center", fontFamily: "Lalezar, CairoLatin", fontSize: 64,
        color: "#fff", textShadow: `0 4px 0 ${color}, 0 0 20px ${color}`, fontVariantNumeric: "tabular-nums" }}>{(meters * p).toFixed(2).replace(".", ",")} m</div>}
    </>
  );
};

/* ---------- comparison table (équivalence vs ordre) ---------- */
const Table: React.FC<{ f: number }> = ({ f }) => {
  const rows = ["réflexive", "symétrique", "antisymétrique", "transitive"];
  const eq = [s(77.4), s(78.2), -1, s(79.3)], ord = [s(81.9), -1, s(82.7), s(84.0)];
  const col = (title: string, at: number, ticks: number[], color: string, x: number) => {
    const k = sp(f, at);
    return (
      <div style={{ position: "absolute", left: x, top: 560, width: 430, transform: `scale(${k}) rotate(${(1 - k) * 8}deg)`, opacity: Math.min(1, k * 2),
        background: "rgba(255,255,255,0.08)", border: `5px solid ${color}`, borderRadius: 36, padding: "26px 26px 34px", boxShadow: `0 0 40px ${color}55` }}>
        <div style={{ fontFamily: "Lalezar, CairoLatin", fontSize: 58, color, textAlign: "center", marginBottom: 14 }}>{title}</div>
        {rows.map((r, i) => {
          const tk = ticks[i] < 0 ? 0 : sp(f, ticks[i]);
          const no = ticks[i] < 0;
          return (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 6px", borderTop: i ? "2px solid rgba(255,255,255,0.12)" : "none",
              opacity: no ? 0.35 : 0.6 + 0.4 * Math.min(1, tk * 2) }}>
              <div style={{ width: 54, height: 54, borderRadius: 27, border: `4px solid ${no ? "#ffffff55" : C.green}`, background: tk > 0.2 ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${no ? 1 : 0.6 + 0.4 * tk})` }}>
                {tk > 0.2 && <svg viewBox="0 0 24 24" width={40} height={40}><path d="M5 12.5 L10 17 L19 7" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <div style={{ fontFamily: "Rajdhani", fontWeight: 700, fontSize: 40, color: "#fff" }}>{r}</div>
            </div>
          );
        })}
      </div>
    );
  };
  return <>{col("Équivalence", s(72.8), eq, C.pink, 70)}{col("Ordre", s(74.3), ord, C.blue, 580)}</>;
};

/* ---------- the timeline ---------- */
const Story: React.FC = () => {
  const FEET = 1520;
  return (
    <>
      {/* 0 — title */}
      <CScene a={0} b={1.9} wipe={C.purple}>{(f) => (<>
        <Classroom boardText="ℛ" />
        <Sticker at={s(0.1)} x={540} y={760} bg={C.purple} size={96} rot={-3}>Les relations</Sticker>
        <Sticker at={s(0.5)} x={540} y={900} bg={C.pink} size={130} rot={3}>binaires</Sticker>
        <Sparkles at={s(0.7)} x={540} y={900} color={C.yellow} />
        <Person x={250} feet={FEET} shirt={C.blue} hair="#1B1530" scale={1.0} armR={-150 + Math.sin(f / 4) * 20} face={1} />
        <Person x={830} feet={FEET} shirt={C.yellow} hair="#6B3A1E" scale={1.0} armR={-150 + Math.sin(f / 4 + 1) * 20} face={-1} />
      </>)}</CScene>

      {/* 1 — a class of 20, the teacher wants to compare heights */}
      <CScene a={1.9} b={8.85} wipe={C.yellow}>{(f) => (<>
        <Classroom boardText={f > s(7.8) ? "la taille ?" : ""} />
        <Person x={860} feet={1340} shirt="#7A8BA6" hair="#9AA0A8" scale={0.9} armR={f > s(5.2) ? -120 + Math.sin(f / 3) * 15 : -8} face={-1} />
        <Glasses x={860} feet={1340} scale={0.9} />
        {Array.from({ length: 20 }).map((_, i) => {
          const row = Math.floor(i / 5), col = i % 5, at = s(2.6) + i * 2;
          const k = sp(f, at);
          if (k === 0) return null;
          const shirts = [C.pink, C.blue, C.yellow, C.green, C.purple, C.orange];
          return <div key={i} style={{ position: "absolute", inset: 0, transform: `scale(${k})`, transformOrigin: `${110 + col * 150}px ${1440 + row * 110}px` }}>
            <Person x={110 + col * 150 + (row % 2) * 40} feet={1440 + row * 110} shirt={shirts[(i * 7) % 6]} hair={["#3B2416", "#1B1530", "#6B3A1E"][i % 3]} skin={i % 4 === 1 ? P.skin2 : undefined}
              scale={0.42} face={1} jump={f > s(7.3) ? Math.abs(Math.sin((f + i * 5) / 6)) * 12 : 0} />
          </div>;
        })}
        <Sticker at={s(3.9)} x={300} y={780} bg={C.pink} size={80} rot={-4}>20 élèves</Sticker>
        <Sticker at={s(7.3)} x={720} y={760} bg={C.blue} size={58} rot={3}>on compare la taille</Sticker>
      </>)}</CScene>

      {/* 2 — A and B walk to the front, the height chart rises, A > B */}
      <CScene a={8.85} b={20.05} wipe={C.blue}>{(f) => {
        const ax = interpolate(f, [s(10.9), s(11.9)], [-200, 330], { ...clamp, easing: theme.ease.inOut });
        const bx = interpolate(f, [s(11.9), s(12.9)], [1280, 760], { ...clamp, easing: theme.ease.inOut });
        const ppm = 262;
        const big = sp(f, s(18.6), theme.spring.snappy);
        return (<>
          <Classroom boardText={f > s(17.9) ? "A > B" : "A ? B"} />
          <Toise f={f} x={150} feet={FEET} at={s(13.7)} meters={2.0} color={C.pink} pxPerM={ppm} />
          <Toise f={f} x={940} feet={FEET} at={s(15.8)} meters={1.7} color={C.blue} pxPerM={ppm} />
          <Person x={ax} feet={FEET} shirt={C.pink} hair="#3B2416" scale={1.25} walk={f > s(10.9) && f < s(11.9) ? 1 : 0} label="A" labelColor={C.pink}
            armR={f > s(18.6) ? -150 + Math.sin(f / 4) * 18 : -8} face={1} jump={f > s(18.6) && f < s(19.4) ? Math.sin((f - s(18.6)) / 24 * Math.PI) * 50 : 0} />
          <Person x={bx} feet={FEET} shirt={C.blue} hair="#1B1530" skin={P.skin2} scale={1.06} walk={f > s(11.9) && f < s(12.9) ? 1 : 0} label="B" labelColor={C.blue} face={-1} />
          {f > s(18.4) && <div style={{ position: "absolute", left: 470, top: 960, transform: `translate(-50%,-50%) scale(${big})`, fontFamily: "KaTeX_Main", fontSize: 220,
            color: C.yellow, textShadow: "0 8px 0 rgba(0,0,0,0.15), 0 0 30px #fff" }}>&gt;</div>}
          <Sticker at={s(18.6)} x={540} y={720} bg={C.yellow} color={P.ink} size={70} rot={-3}>A est plus grand que B</Sticker>
        </>);
      }}</CScene>

      {/* 3 — "that's a relation": two elements compared */}
      <CScene a={20.05} b={26.15} wipe={C.green}>{(f) => (<>
        <Classroom boardText="relation" />
        <Person x={240} feet={FEET} shirt={C.pink} hair="#3B2416" scale={1.0} label="A" labelColor={C.pink} face={1} />
        <Person x={840} feet={FEET} shirt={C.blue} hair="#1B1530" skin={P.skin2} scale={0.88} label="B" labelColor={C.blue} face={-1} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path d="M 330 1020 Q 540 760 750 1020" fill="none" stroke={C.purple} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={1}
            strokeDashoffset={1 - pr(f, s(21.1), 0.7)} style={{ filter: `drop-shadow(0 0 12px ${C.purple})` }} />
        </svg>
        <Sticker at={s(21.3)} x={540} y={760} bg={C.purple} size={110} rot={-3}>une relation</Sticker>
        <Sticker at={s(22.6)} x={540} y={1180} bg={C.white} color={P.ink} size={52} rot={2}>on compare 2 éléments</Sticker>
      </>)}</CScene>
    </>
  );
};

const Board: React.FC = () => {
  const N = (id: string, x: number, y: number, label: string, color: string, at: number): Node => ({ id, x, y, label, color, at });
  return (
    <>
      {/* 4 — in algebra: a set, two elements linked, the notation a R b */}
      <BoardScene from={s(26.15)} to={s(40.3)} n="1" title="En algèbre">{(() => <BoardOne />)()}</BoardScene>

      {/* 5..8 — the four properties as graphs */}
      <BoardScene from={s(40.3)} to={s(46.75)} n="2" title="Propriété 1 / 4">
        <Sticker at={s(43.4)} x={540} y={360} bg={C.pink} size={96} rot={-3}>réflexive</Sticker>
        <GraphAt nodes={[N("a", 260, 900, "a", C.pink, s(44.2)), N("b", 540, 980, "b", C.blue, s(44.4)), N("c", 820, 900, "c", C.purple, s(44.6))]}
          edges={[{ from: "a", to: "a", at: s(45.2) }, { from: "b", to: "b", at: s(45.5) }, { from: "c", to: "c", at: s(45.8) }]} />
        <Tex at={s(45.6)} y={1360} size={110} tex={"\\forall a,\\; a \\,\\mathcal{R}\\, a"} box={{ at: s(46.2), color: C.pink }} />
      </BoardScene>
      <BoardScene from={s(46.75)} to={s(54.45)} n="2" title="Propriété 2 / 4">
        <Sticker at={s(47.3)} x={540} y={360} bg={C.blue} size={96} rot={3}>symétrique</Sticker>
        <GraphAt nodes={[N("a", 300, 950, "a", C.pink, s(48.7)), N("b", 780, 950, "b", C.blue, s(50.4))]}
          edges={[{ from: "a", to: "b", at: s(49.9), bend: 0.22 }, { from: "b", to: "a", at: s(52.9), bend: 0.22, color: "#2EC27E" }]} />
        <Tex at={s(50.7)} y={1360} size={104} tex={"a\\,\\mathcal{R}\\,b \\;\\Longrightarrow\\; b\\,\\mathcal{R}\\,a"} box={{ at: s(53.8), color: C.blue }} />
      </BoardScene>
      <BoardScene from={s(54.45)} to={s(61.05)} n="2" title="Propriété 3 / 4">
        <Sticker at={s(55.2)} x={540} y={360} bg={C.purple} size={88} rot={-3}>antisymétrique</Sticker>
        <GraphAt nodes={[N("a", 300, 950, "a", C.pink, s(56.4)), N("b", 780, 950, "b", C.blue, s(57.2))]}
          edges={[{ from: "a", to: "b", at: s(56.9), bend: 0.22 }, { from: "b", to: "a", at: s(58.2), bend: 0.22, color: "#2EC27E" }]} merge={{ a: "a", b: "b", at: s(59.9) }} />
        <Tex at={s(58.9)} y={1360} size={84} tex={"a\\,\\mathcal{R}\\,b \\,\\wedge\\, b\\,\\mathcal{R}\\,a \\;\\Longrightarrow\\; a = b"} box={{ at: s(60.6), color: C.purple }} />
        <Sparkles at={s(60.5)} x={540} y={950} color={C.green} />
      </BoardScene>
      <BoardScene from={s(61.05)} to={s(68.85)} n="2" title="Propriété 4 / 4">
        <Sticker at={s(62.3)} x={540} y={360} bg={C.green} size={96} rot={3}>transitive</Sticker>
        <GraphAt nodes={[N("a", 220, 1060, "a", C.pink, s(63.1)), N("b", 540, 760, "b", C.blue, s(64.0)), N("c", 860, 1060, "c", C.purple, s(65.2))]}
          edges={[{ from: "a", to: "b", at: s(63.5), bend: -0.1 }, { from: "b", to: "c", at: s(64.9), bend: -0.1 },
            { from: "a", to: "c", at: s(67.3), bend: -0.18, dashed: true, color: "#2EC27E" }]} />
        <Tex at={s(65.6)} y={1380} size={84} tex={"a\\,\\mathcal{R}\\,b \\,\\wedge\\, b\\,\\mathcal{R}\\,c \\;\\Longrightarrow\\; a\\,\\mathcal{R}\\,c"} box={{ at: s(68.3), color: C.green }} />
      </BoardScene>

      {/* 9 — two important relations: equivalence vs order */}
      <BoardScene from={s(68.85)} to={s(84.85)} n="3" title="Deux relations importantes">{(() => <TableAt />)()}</BoardScene>
    </>
  );
};
const GraphAt: React.FC<{ nodes: Node[]; edges: Edge[]; merge?: { a: string; b: string; at: number } }> = (p) => {
  const f = useCurrentFrame();
  return <Graph f={f} {...p} />;
};
const TableAt: React.FC = () => { const f = useCurrentFrame(); return <Table f={f} />; };
const BoardOne: React.FC = () => {
  const f = useCurrentFrame();
  const e = sp(f, s(28.0));
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={540} cy={880} rx={430 * e} ry={290 * e} fill="#FF4FA314" stroke={C.pink} strokeWidth={8} style={{ filter: `drop-shadow(0 0 16px ${C.pink})` }} />
      </svg>
      {e > 0 && <Tex at={s(28.0)} x={170} y={640} size={110} tex="E" color={C.pink} />}
      <Graph f={f} nodes={[{ id: "a", x: 360, y: 900, label: "a", color: C.blue, at: s(30.6) }, { id: "b", x: 720, y: 900, label: "b", color: C.purple, at: s(31.2) },
        { id: "c", x: 540, y: 1080, label: "c", color: C.orange, at: s(31.6) }]} edges={[{ from: "a", to: "b", at: s(30.9), bend: 0.25, color: "#FFD23F" }]} />
      {f >= s(33.9) && f < s(35.3) && <div style={{ position: "absolute", left: 540, top: 1360, transform: `translate(-50%,-50%) scale(${sp(f, s(33.9))})`, fontFamily: "KaTeX_Caligraphic",
        fontSize: 260, color: C.yellow, textShadow: `0 0 40px ${C.yellow}` }}>R</div>}
      <Tex at={s(35.3)} y={1360} size={150} tex={"a \\;\\mathcal{R}\\; b"} box={{ at: s(39.2), color: C.yellow }} glow="rgba(255,210,63,0.5)" />
    </>
  );
};

/* ---------- examples + conclusion (classroom) ---------- */
const Examples: React.FC = () => {
  const FEET = 1520;
  return (
    <>
      {/* 10 — "être égal": an equivalence relation */}
      <CScene a={84.85} b={88.85} wipe={C.pink}>{(f) => (<>
        <Classroom boardText="x = y" />
        <Person x={300} feet={FEET} shirt={C.pink} hair="#3B2416" scale={1.1} label="x" labelColor={C.pink} face={1} />
        <Person x={780} feet={FEET} shirt={C.yellow} hair="#6B3A1E" scale={1.1} label="y" labelColor={C.orange} face={-1} />
        {f > s(87.0) && <div style={{ position: "absolute", left: 540, top: 1150, transform: `translate(-50%,-50%) scale(${sp(f, s(87.0))})`, fontFamily: "KaTeX_Main", fontSize: 200,
          color: C.green, textShadow: "0 0 30px #fff" }}>=</div>}
        <Sticker at={s(86.4)} x={540} y={720} bg={C.pink} size={76} rot={-3}>« être égal »</Sticker>
        <Sticker at={s(88.2)} x={540} y={860} bg={C.green} size={56} rot={3}>relation d'équivalence</Sticker>
      </>)}</CScene>

      {/* 11 — "≤": an order relation — students sort themselves by height */}
      <CScene a={88.85} b={93.65} wipe={C.blue}>{(f) => {
        const hs = [1.62, 1.95, 1.50, 1.80];                     // heights (m), unsorted
        const order = [2, 0, 3, 1];                              // indices sorted ascending
        const sortP = interpolate(f, [s(89.9), s(91.0)], [0, 1], { ...clamp, easing: theme.ease.inOut });
        const shirts = [C.pink, C.blue, C.yellow, C.green];
        return (<>
          <Classroom boardText="x ≤ y" />
          {hs.map((h, i) => {
            const from = 170 + i * 245, to = 170 + order.indexOf(i) * 245;
            const x = from + (to - from) * sortP, hop = Math.sin(Math.PI * sortP) * 90 * (from === to ? 0 : 1);
            return <Person key={i} x={x} feet={FEET} jump={hop} shirt={shirts[i]} hair={["#3B2416", "#1B1530", "#6B3A1E", "#3B2416"][i]} scale={h / 1.95 * 1.15}
              walk={sortP > 0 && sortP < 1 ? 1 : 0} face={0} />;
          })}
          {[0, 1, 2].map((k) => f > s(91.3) + k * 4 && <div key={k} style={{ position: "absolute", left: 292 + k * 245, top: 1180, transform: `translate(-50%,-50%) scale(${sp(f, s(91.3) + k * 4)})`,
            fontFamily: "KaTeX_Main", fontSize: 110, color: C.blue, textShadow: "0 0 20px #fff" }}>≤</div>)}
          <Sticker at={s(90.0)} x={540} y={720} bg={C.blue} size={70} rot={-3}>« inférieur ou égal »</Sticker>
          <Sticker at={s(92.4)} x={540} y={860} bg={C.purple} size={56} rot={3}>relation d'ordre</Sticker>
        </>);
      }}</CScene>

      {/* 12 — prove it with the definitions */}
      <CScene a={93.65} b={95.85} wipe={C.yellow}>{(f) => (<>
        <Classroom boardText="preuve" />
        <Person x={250} feet={FEET} shirt={C.pink} hair="#3B2416" scale={1.0} armR={-70} face={1} />
        <div style={{ position: "absolute", left: 470, top: 820, width: 470, transform: `rotate(-3deg) scale(${sp(f, s(93.8))})`, background: "#fff", borderRadius: 22,
          border: `6px solid ${P.ink}`, padding: "20px 30px", boxShadow: "0 12px 0 rgba(0,0,0,0.15)" }}>
          {["réflexive ?", "symétrique ?", "transitive ?"].map((t, i) => {
            const k = sp(f, s(94.2) + i * 9);
            return <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 44, color: P.ink }}>
              <span style={{ width: 46, height: 46, borderRadius: 23, background: k > 0.2 ? C.green : "#E5E9F2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                transform: `scale(${0.6 + 0.4 * k})`, fontSize: 34 }}>{k > 0.2 ? "✓" : ""}</span>{t}</div>;
          })}
        </div>
        <Sticker at={s(94.0)} x={540} y={700} bg={C.orange} size={70} rot={-3}>à prouver !</Sticker>
      </>)}</CScene>

      {/* 13 — a relation = a link between two elements */}
      <CScene a={95.85} b={103.4} wipe={C.purple}>{(f) => {
        const link = pr(f, s(98.6), 0.8);
        const props: [string, string, number, number][] = [["réflexive", C.pink, 230, 640], ["symétrique", C.blue, 850, 640], ["antisymétrique", C.purple, 250, 1680], ["transitive", C.green, 830, 1680]];
        return (<>
          <Classroom boardText="un lien" />
          <Person x={250} feet={FEET} shirt={C.pink} hair="#3B2416" scale={1.1} label="A" labelColor={C.pink} armR={-80} face={1} />
          <Person x={830} feet={FEET} shirt={C.blue} hair="#1B1530" skin={P.skin2} scale={1.1} label="B" labelColor={C.blue} armL={80} face={-1} />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <path d={`M 390 1150 Q 540 ${1150 + Math.sin(f / 8) * 50} 690 1150`} fill="none" stroke={C.yellow} strokeWidth={14} strokeLinecap="round" pathLength={1}
              strokeDasharray={1} strokeDashoffset={1 - link} style={{ filter: `drop-shadow(0 0 ${14 + Math.sin(f / 5) * 6}px ${C.yellow})` }} />
          </svg>
          <Sticker at={s(98.7)} x={540} y={980} bg={C.yellow} color={P.ink} size={72} rot={-3}>un lien</Sticker>
          {props.map(([t, c, x], i) => <Sticker key={t} at={s(100.6) + i * 5} x={x} y={i < 2 ? 640 : 790} bg={c} size={44} rot={i % 2 ? 4 : -4}>{t}</Sticker>)}
          <Sparkles at={s(98.9)} x={540} y={1150} color={C.yellow} />
        </>);
      }}</CScene>

      {/* 14 — outro */}
      <CScene a={103.4} b={106.0} wipe={C.yellow}>{(f) => (<>
        <Classroom boardText="ℛ" />
        {[[250, C.pink, "#3B2416"], [540, C.blue, "#1B1530"], [830, C.yellow, "#6B3A1E"]].map(([x, sh, h], i) => (
          <Person key={i} x={x as number} feet={FEET} shirt={sh as string} hair={h as string} skin={i === 1 ? P.skin2 : undefined} scale={1.05} armR={-150 + Math.sin(f / 4 + i) * 22} face={0} />
        ))}
        <Sticker at={s(103.5)} x={540} y={760} bg={C.pink} size={110} rot={-3}>Abonne-toi !</Sticker>
        <Confetti at={s(103.6)} />
      </>)}</CScene>
    </>
  );
};

/* ---------- captions (yellow active word, like the ensembles video) ---------- */
type W = { t: string; s: number; e: number };
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / 30;
  const page = (captions as W[][]).find((p, i, arr) => t >= p[0].s - 0.05 && t < (arr[i + 1]?.[0].s ?? p[p.length - 1].e + 0.4));
  if (!page || t > page[page.length - 1].e + 0.5) return null;
  const p = spring({ frame: frame - s(page[0].s), fps, config: theme.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1680, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", padding: "10px 28px",
        background: "rgba(10,8,25,0.82)", borderRadius: 22, border: "3px solid rgba(255,255,255,0.9)" }}>
        {page.map((w, i) => (
          <span key={i} style={{ fontFamily: "InterX", fontWeight: 800, fontSize: 50, lineHeight: 1.35,
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
const CUTS = [1.9, 8.85, 20.05, 26.15, 40.3, 46.75, 54.45, 61.05, 68.85, 84.85, 88.85, 93.65, 95.85, 103.4];
const POPS = [0.1, 0.5, 3.9, 7.3, 18.6, 21.3, 22.6, 28.0, 30.6, 31.2, 31.6, 33.9, 43.4, 44.2, 44.4, 44.6, 47.3, 48.7, 50.4, 55.2, 56.4, 57.2, 62.3, 63.1, 64.0, 65.2,
  72.8, 74.3, 86.4, 88.2, 90.0, 91.3, 92.4, 93.8, 94.0, 98.7, 100.6, 100.77, 100.93, 101.1, 103.5];
const SWIPES = [21.1, 30.9, 45.2, 45.5, 45.8, 49.9, 52.9, 56.9, 58.2, 63.5, 64.9, 67.3, 98.6];
const DINGS = [18.6, 39.2, 46.2, 53.8, 59.9, 68.3, 77.4, 78.2, 79.3, 81.9, 82.7, 84.0, 87.0, 94.2, 94.5, 94.8];
const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("relations/voice.m4a")} />
    <Audio src={staticFile("sfx/bed107.wav")} volume={(fr) => interpolate(fr, [0, 15, s(103.2), s(103.5), RELATIONS_FRAMES - 3], [0, 0.06, 0.06, 0.22, 0], clamp)} />
    {CUTS.map((t) => <Sfx key={`w${t}`} at={s(t) - 2} src="whoosh" v={0.32} />)}
    {POPS.map((t) => <Sfx key={`p${t}`} at={s(t) - 1} src="pop" v={0.24} />)}
    {SWIPES.map((t) => <Sfx key={`s${t}`} at={s(t)} src="swipe" v={0.26} />)}
    {DINGS.map((t) => <Sfx key={`d${t}`} at={s(t)} src="ding" v={0.2} />)}
    {[s(10.9), s(11.9), s(89.9)].map((t) => <Sfx key={`walk${t}`} at={t} src="check" v={0.15} />)}
    {Array.from({ length: 10 }).map((_, i) => <Sfx key={`t${i}`} at={s(13.7) + i * 3} src="tick" v={0.14} />)}
    {Array.from({ length: 8 }).map((_, i) => <Sfx key={`u${i}`} at={s(15.8) + i * 3} src="tick" v={0.14} />)}
    <Sfx at={s(59.9)} src="bass" v={0.35} />
  </>
);

export const RelationsEdit: React.FC = () => {
  useFontFaces([
    ["Anton", "fonts/anton.woff2", "400"],
    ["InterX", "fonts/inter-600.woff2", "600"],
    ["InterX", "fonts/inter-800.woff2", "800"],
    ["Lalezar", "fonts/lalezar-arabic-400-normal.woff2", "400"],
    ["CairoLatin", "fonts/cairo-latin-900-normal.woff2", "900"],
    ["Rajdhani", "fonts/rajdhani-latin-700-normal.woff2", "700"],
  ]);
  const f = useCurrentFrame();
  const board = f >= s(26.15) && f < s(84.85);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {board && <MathBg />}
      {board && <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 20%, ${C.purple}33, transparent 45%), radial-gradient(circle at 10% 85%, ${C.blue}2A, transparent 45%)` }} />}
      <Story />
      <Board />
      <Examples />
      <Captions />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [RELATIONS_FRAMES - 8, RELATIONS_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
