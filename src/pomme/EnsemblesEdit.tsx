// "La théorie des ensembles" — explainer narrated with the user's own recorded voice.
// Timings were authored against the cloned-voice draft; remap-ensembles.json maps them onto the real recording.
// Same kit as the pomme video: illustrated field + people, then white formulas on black with colour.
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { clamp } from "../theme";
import { Arrow, MathBg, Scene, Tex, sec } from "../maths/kit";
import captions from "./captions-ensembles-real.json";
import anchors from "./remap-ensembles.json";
import { Sticker } from "./PommeEdit";
import { Basket, Bubble, Field, Fruit, FruitName, P, Person, Sparkles } from "./world";

/** draft time (s) -> real-voice time (s): piecewise-linear through matched words, slope 1 past the last word */
const A = anchors as number[][];
export const remap = (t: number) => {
  if (t <= A[0][0]) return t;
  for (let i = 1; i < A.length; i++) {
    if (t <= A[i][0]) {
      const [o0, n0] = A[i - 1], [o1, n1] = A[i];
      return n0 + ((t - o0) / (o1 - o0)) * (n1 - n0);
    }
  }
  const [oL, nL] = A[A.length - 1];
  return nL + (t - oL);
};
const s = (t: number) => sec(remap(t));
// this recording ends on "…on construit toutes les mathématiques": short music outro after it
export const ENSEMBLES_FRAMES = s(87.3) + sec(2.4);

/* ---------- helpers ---------- */
const usePop = (at: number, cfg = P.spring.bouncy) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f < at ? 0 : spring({ frame: f - at, fps, config: cfg });
};

/** a fruit that drops in on an arc and lands at (x, y) */
const DropFruit: React.FC<{ name: FruitName; at: number; x: number; y: number; size?: number; from?: [number, number];
  glowAt?: number }> = ({ name, at, x, y, size = 110, from, glowAt }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const t = interpolate(f, [at, at + 14], [0, 1], { ...clamp, easing: P.ease.out });
  const [fx, fy] = from ?? [x, y - 500];
  const cx = fx + (x - fx) * t, cy = fy + (y - fy) * t - Math.sin(Math.PI * t) * 120;
  const g = glowAt !== undefined && f >= glowAt ? Math.max(0, 1 - (f - glowAt) / 20) : 0;
  const bob = Math.sin((f - at) / 14) * 3;
  return (
    <>
      {g > 0 && <div style={{ position: "absolute", left: x - size * 0.75, top: y - size * 0.75, width: size * 1.5, height: size * 1.5,
        borderRadius: "50%", background: `radial-gradient(circle, ${P.yellow}AA, transparent 65%)`, transform: `scale(${1 + g * 0.4})` }} />}
      <Fruit name={name} x={cx} y={cy + bob} size={size * (1 + g * 0.25)} rot={(1 - t) * 180} />
    </>
  );
};

const Ellipse: React.FC<{ at: number; cx: number; cy: number; rx: number; ry: number; color: string; fill?: number; width?: number }> = ({
  at, cx, cy, rx, ry, color, fill = 0.12, width = 8,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = interpolate(f, [at, at + 20], [0, 1], { ...clamp, easing: P.ease.out });
  const a = Math.round(fill * 255).toString(16).padStart(2, "0");
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={1080} height={1920}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`${color}${a}`} fillOpacity={p} stroke={color} strokeWidth={width}
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 14px ${color})` }} />
    </svg>
  );
};

const Dot: React.FC<{ at: number; x: number; y: number; tex: string; color: string; size?: number }> = ({ at, x, y, tex, color, size = 60 }) => {
  const p = usePop(at);
  if (p === 0) return null;
  return (
    <>
      <div style={{ position: "absolute", left: x - 13, top: y + size * 0.55, width: 26, height: 26, borderRadius: 13, background: color,
        transform: `scale(${p})`, boxShadow: `0 0 18px ${color}` }} />
      <Tex at={at} x={x} y={y} size={size} tex={tex} dur={8} />
    </>
  );
};

/* ---------- 1. hook (field) ---------- */
const Hook: React.FC = () => {
  const blocks: [string, string][] = [["\\in", P.pink], ["\\cup", P.blue], ["\\cap", P.orange], ["\\subset", P.purple], ["\\varnothing", P.yellow]];
  return (
    <AbsoluteFill>
      <Field />
      <Sticker at={s(0.3)} x={540} y={330} bg={P.purple} size={70} rot={-3}>C'est quoi</Sticker>
      <Sticker at={s(1.2)} x={540} y={480} bg={P.pink} size={120} rot={2}>un ensemble ?</Sticker>
      <Person x={250} feet={1500} shirt={P.pink} hair="#3B2416" scale={1.25} armR={-150} face={1} />
      <Bubble at={s(1.0)} until={s(4.6)} x={260} y={760} w={150} h={150} tailX={280} tailY={930}>
        <span style={{ fontFamily: P.display, fontSize: 100, color: P.pink }}>?</span>
      </Bubble>
      {/* building blocks: the maths rest on sets */}
      {blocks.map(([t, c], i) => {
        const at = s(2.4) + i * 7;
        return <Block key={t} at={at} x={720} y={1420 - i * 120} tex={t} color={c} />;
      })}
      <Sticker at={s(3.6)} x={720} y={760} bg={P.blue} size={54} rot={4}>toutes les maths</Sticker>
    </AbsoluteFill>
  );
};

const Block: React.FC<{ at: number; x: number; y: number; tex: string; color: string }> = ({ at, x, y, tex, color }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 180, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: x - 130, top: y - 55 - (1 - p) * 500, width: 260, height: 110, borderRadius: 22,
      background: color, border: "6px solid #fff", boxShadow: "0 10px 0 rgba(0,0,0,0.2)", display: "flex", alignItems: "center",
      justifyContent: "center" }}>
      <div style={{ position: "relative", width: 1, height: 1 }}><Tex at={at} x={0} y={0} size={70} tex={tex} dur={1} /></div>
    </div>
  );
};

/* ---------- 2. the basket (field) ---------- */
const BasketScene: React.FC = () => {
  const bp = usePop(s(5.8));
  const BX = 640, BY = 1520;
  const fruits: [FruitName, number, number, number, number][] = [
    ["pomme", s(8.2), BX - 85, BY - 205, s(13.2)],
    ["banane", s(9.1), BX + 5, BY - 225, s(13.7)],
    ["orange", s(10.1), BX + 90, BY - 200, s(14.3)],
  ];
  return (
    <AbsoluteFill>
      <Field />
      <Person x={230} feet={1500} shirt={P.pink} hair="#3B2416" scale={1.25} armR={-60} face={1} label="A" labelColor={P.pink} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${bp})`, transformOrigin: `${BX}px ${BY}px` }}>
        <Basket x={BX} y={BY} size={360} />
      </div>
      {fruits.map(([n, at, x, y, g]) => <DropFruit key={n} name={n} at={at} x={x} y={y} size={120} glowAt={g} />)}
      <Sticker at={s(8.2)} until={s(11.6)} x={BX - 120} y={1000} bg={P.apple} size={48} rot={-6}>pomme</Sticker>
      <Sticker at={s(9.1)} until={s(11.6)} x={BX + 60} y={900} bg={P.yellow} color={P.ink} size={48} rot={4}>banane</Sticker>
      <Sticker at={s(10.1)} until={s(11.6)} x={BX + 150} y={1060} bg={P.orange} size={48} rot={-3}>orange</Sticker>
      <Sticker at={s(11.8)} x={540} y={420} bg={P.purple} size={110} rot={-3}>= un ensemble</Sticker>
      <Arrow at={s(12.0)} from={[620, 500]} to={[650, 1190]} bend={-0.15} color={P.purple} width={12} />
      <Sticker at={s(15.1)} x={540} y={620} bg={P.pink} size={80} rot={3}>ses éléments</Sticker>
      {[BX - 85, BX + 5, BX + 90].map((x, i) => (
        <Arrow key={x} at={s(15.2) + i * 3} from={[540 + (i - 1) * 90, 680]} to={[x, 1230]} bend={0.1 * (i - 1)} color={P.pink} width={7} />
      ))}
    </AbsoluteFill>
  );
};

/* ---------- 3. notation (board) ---------- */
const Notation: React.FC = () => (
  <>
    <Tex at={s(18.5)} y={460} size={230} tex={"\\{ \\quad \\}"} glow={P.pinkGlow} until={s(19.3)} />
    <Sticker at={s(18.7)} until={s(19.3)} x={540} y={700} bg={P.pink} size={60}>accolades</Sticker>
    {(["pomme", "banane", "orange"] as FruitName[]).map((n, i) => (
      <DropFruit key={n} name={n} at={s(20.2) + i * 15} x={455 + i * 205} y={480} size={120} from={[455 + i * 205, 300]} />
    ))}
    <Tex at={s(19.3)} y={700} size={92} dur={40}
      tex={"A = \\{\\, {\\color{#FF3B4E}\\text{pomme}},\\ {\\color{#FFD23F}\\text{banane}},\\ {\\color{#FF8A1F}\\text{orange}} \\,\\}"} />
    <Tex at={s(24.4)} y={1080} size={140} tex={"{\\color{#FF3B4E}\\text{pomme}} \\in A"} box={{ at: s(26.1), color: P.pink }} />
    <Arrow at={s(26.1)} from={[700, 1330]} to={[640, 1150]} bend={0.25} color={P.yellow} width={8} />
    <Sticker at={s(26.1)} x={700} y={1380} bg={P.yellow} color={P.ink} size={58} rot={-3}>appartient à</Sticker>
  </>
);

/* ---------- 4. inclusion (board) ---------- */
const Inclusion: React.FC = () => (
  <>
    <Ellipse at={s(28.0)} cx={540} cy={860} rx={430} ry={330} color={P.pink} />
    <Tex at={s(28.2)} x={170} y={600} size={110} tex="A" color={P.pink} />
    <DropFruit name="pomme" at={s(28.3)} x={420} y={800} size={130} />
    <DropFruit name="banane" at={s(28.5)} x={590} y={880} size={130} />
    <DropFruit name="orange" at={s(28.7)} x={790} y={1020} size={130} />
    <Ellipse at={s(30.4)} cx={505} cy={845} rx={200} ry={155} color={P.blue} fill={0.25} />
    <Tex at={s(30.5)} x={340} y={1040} size={100} tex="C" color={P.blue} />
    <Sparkles at={s(34.0)} x={505} y={845} color={P.blue} />
    <Tex at={s(37.0)} y={1420} size={170} tex={"{\\color{#3D8BFF}C} \\subset {\\color{#FF4FA3}A}"} box={{ at: s(38.4), color: P.yellow }} />
    <Sticker at={s(38.0)} x={540} y={1580} bg={P.blue} size={50} rot={2}>C est inclus dans A</Sticker>
  </>
);

/* ---------- 5. union & intersection (board) ---------- */
const Venn: React.FC = () => {
  const f = useCurrentFrame();
  const uni = interpolate(f, [s(46.7), s(47.3), s(49.2), s(49.7)], [0, 1, 1, 0], clamp);
  const inter = interpolate(f, [s(53.8), s(54.4)], [0, 1], clamp);
  const pulse = 1 + Math.sin(f / 5) * 0.04 * inter;
  return (
    <>
      <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
        <defs>
          <clipPath id="clipA"><circle cx={410} cy={800} r={270} /></clipPath>
        </defs>
        {uni > 0 && <>
          <circle cx={410} cy={800} r={270} fill={P.purple} opacity={0.45 * uni} />
          <circle cx={670} cy={800} r={270} fill={P.purple} opacity={0.45 * uni} />
        </>}
        {inter > 0 && <circle cx={670} cy={800} r={270} fill={P.yellow} opacity={0.6 * inter} clipPath="url(#clipA)"
          style={{ transformOrigin: "540px 800px", transform: `scale(${pulse})` }} />}
      </svg>
      <Ellipse at={s(39.5)} cx={410} cy={800} rx={270} ry={270} color={P.pink} fill={0.08} />
      <Ellipse at={s(40.4)} cx={670} cy={800} rx={270} ry={270} color={P.blue} fill={0.08} />
      <Tex at={s(39.6)} x={190} y={520} size={100} tex="A" color={P.pink} />
      <Tex at={s(40.5)} x={890} y={520} size={100} tex="B" color={P.blue} />
      <DropFruit name="pomme" at={s(39.6)} x={300} y={730} size={115} />
      <DropFruit name="orange" at={s(39.8)} x={320} y={900} size={115} />
      <DropFruit name="banane" at={s(41.6)} x={540} y={810} size={125} glowAt={s(56.9)} />
      <DropFruit name="fraise" at={s(42.6)} x={780} y={810} size={115} />
      <Sticker at={s(46.8)} until={s(49.6)} x={540} y={1150} bg={P.purple} size={70} rot={-2}>union</Sticker>
      <Tex at={s(47.0)} y={1330} size={80} until={s(49.6)}
        tex={"A \\cup B = \\{\\text{pomme},\\, \\text{banane},\\, \\text{orange},\\, \\text{fraise}\\}"} />
      <Sticker at={s(53.9)} x={540} y={1150} bg={P.yellow} color={P.ink} size={70} rot={2}>intersection</Sticker>
      <Tex at={s(54.3)} y={1340} size={120} tex={"A \\cap B = \\{\\, {\\color{#FFD23F}\\text{banane}} \\,\\}"} box={{ at: s(56.8), color: P.yellow }} />
    </>
  );
};

/* ---------- 6. empty set (board) ---------- */
const Vide: React.FC = () => {
  const f = useCurrentFrame();
  const shake = f > s(58.4) && f < s(59.3) ? Math.sin(f * 1.4) * 7 : 0;
  return (
    <>
      <div style={{ position: "absolute", inset: 0 }}><Basket x={540} y={900} size={420} shake={shake} /></div>
      <Sticker at={s(58.6)} until={s(60.2)} x={540} y={450} bg={P.orange} size={70} rot={-3}>aucun fruit…</Sticker>
      <Sticker at={s(60.2)} x={540} y={450} bg={P.purple} size={90} rot={3}>ensemble vide</Sticker>
      <Tex at={s(62.2)} y={1200} size={240} tex={"\\varnothing = \\{\\ \\}"} glow={P.pinkGlow} box={{ at: s(62.9), color: P.pink }} />
    </>
  );
};

/* ---------- 7. numbers: N ⊂ Z ⊂ Q ⊂ R (board) ---------- */
const Nombres: React.FC = () => (
  <>
    <Sticker at={s(63.6)} until={s(67.6)} x={540} y={800} bg={P.blue} size={90} rot={-3}>avec les nombres</Sticker>
    <Ellipse at={s(79.1)} cx={540} cy={860} rx={500} ry={540} color={P.pink} fill={0.08} />
    <Ellipse at={s(77.2)} cx={540} cy={880} rx={390} ry={420} color={P.blue} fill={0.1} />
    <Ellipse at={s(73.0)} cx={540} cy={900} rx={280} ry={305} color={P.orange} fill={0.12} />
    <Ellipse at={s(67.7)} cx={540} cy={920} rx={170} ry={185} color={P.yellow} fill={0.18} />
    <Tex at={s(67.8)} x={540} y={790} size={80} tex={"\\mathbb{N}"} color={P.yellow} />
    <Tex at={s(73.1)} x={540} y={640} size={80} tex={"\\mathbb{Z}"} color={P.orange} />
    <Tex at={s(77.3)} x={540} y={510} size={80} tex={"\\mathbb{Q}"} color={P.blue} />
    <Tex at={s(79.2)} x={540} y={380} size={80} tex={"\\mathbb{R}"} color={P.pink} />
    <Dot at={s(70.2)} x={470} y={880} tex="0" color={P.yellow} size={56} />
    <Dot at={s(70.8)} x={610} y={880} tex="1" color={P.yellow} size={56} />
    <Dot at={s(71.1)} x={470} y={990} tex="2" color={P.yellow} size={56} />
    <Dot at={s(71.7)} x={610} y={990} tex="3" color={P.yellow} size={56} />
    <Dot at={s(74.5)} x={320} y={900} tex="-1" color={P.orange} size={56} />
    <Dot at={s(74.8)} x={760} y={900} tex="-7" color={P.orange} size={56} />
    <Dot at={s(78.0)} x={210} y={880} tex={"\\tfrac{1}{2}"} color={P.blue} size={60} />
    <Dot at={s(78.3)} x={870} y={880} tex={"-\\tfrac{3}{4}"} color={P.blue} size={60} />
    <Dot at={s(80.4)} x={120} y={1000} tex={"\\pi"} color={P.pink} size={62} />
    <Dot at={s(80.7)} x={960} y={1000} tex={"\\sqrt{2}"} color={P.pink} size={56} />
    <Tex at={s(79.6)} y={1500} size={110} dur={30}
      tex={"{\\color{#FFD23F}\\mathbb{N}} \\subset {\\color{#FF8A3D}\\mathbb{Z}} \\subset {\\color{#3D8BFF}\\mathbb{Q}} \\subset {\\color{#FF4FA3}\\mathbb{R}}"} />
  </>
);

/* ---------- 8. outro (field) ---------- */
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const wave = Math.sin(f / 4) * 25;
  return (
    <AbsoluteFill>
      <Field />
      <Person x={230} feet={1500} shirt={P.pink} hair="#3B2416" scale={1.25} armR={-150 + wave} face={1} label="A" labelColor={P.pink} />
      <Person x={850} feet={1500} shirt={P.blue} hair="#1B1530" skin={P.skin2} scale={1.25} armR={-8} armL={150 + wave} face={-1} label="B" labelColor={P.blue} />
      <div style={{ position: "absolute", inset: 0 }}><Basket x={540} y={1520} size={300} /></div>
      {(["pomme", "banane", "orange", "fraise"] as FruitName[]).map((n, i) => (
        <DropFruit key={n} name={n} at={s(83.3) + i * 4} x={455 + i * 57} y={1330 - (i % 2) * 25} size={100} />
      ))}
      <Sticker at={s(82.3)} x={540} y={380} bg={P.purple} size={70} rot={-3}>des paniers + des éléments</Sticker>
      <Sticker at={s(85.0)} x={540} y={530} bg={P.blue} size={80} rot={2}>= toutes les maths</Sticker>
      <Sticker at={s(86.4)} x={540} y={760} bg={P.pink} size={120} rot={-4}>Abonne-toi !</Sticker>
      <Sparkles at={s(86.5)} x={540} y={760} color={P.yellow} />
    </AbsoluteFill>
  );
};

/* ---------- captions ---------- */
type W = { t: string; s: number; e: number };
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / 30;
  const page = (captions as W[][]).find((p) => t >= p[0].s - 0.05 && t < p[p.length - 1].e + 0.25);
  if (!page) return null;
  const p = spring({ frame: frame - sec(page[0].s), fps, config: P.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1680, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", padding: "10px 28px",
        background: "rgba(10,8,25,0.8)", borderRadius: 22, border: "3px solid rgba(255,255,255,0.9)" }}>
        {page.map((w, i) => (
          <span key={i} style={{ fontFamily: P.body, fontWeight: 800, fontSize: 50, lineHeight: 1.35,
            color: t >= w.s && t < w.e + 0.1 ? P.yellow : t >= w.s ? "#fff" : "rgba(255,255,255,0.5)" }}>{w.t}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- sound ---------- */
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={v} />
  </Sequence>
);
const CUTS = [4.5, 15.7, 27.7, 39.3, 57.6, 63.5, 81.3];
const POPS = [0.3, 1.2, 2.4, 2.63, 2.87, 3.1, 3.33, 5.8, 8.2, 9.1, 10.1, 11.8, 15.1, 18.7, 20.2, 20.7, 21.2, 26.1, 30.4, 38.0, 41.6, 42.6, 46.8, 53.9, 58.6, 60.2,
  70.2, 70.8, 71.1, 71.7, 74.5, 74.8, 78.0, 78.3, 80.4, 80.7, 82.3, 83.3, 83.43, 83.57, 83.7, 85.0, 86.4];
const DINGS = [26.1, 38.4, 56.8, 62.9, 79.6, 86.5];
const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("pomme/voice-ensembles-real.m4a")} />
    <Audio src={staticFile("sfx/bed90.wav")} volume={(f) => interpolate(f, [0, 15, s(85.9), s(85.9) + 15, ENSEMBLES_FRAMES - 3], [0, 0.07, 0.07, 0.25, 0], clamp)} />
    {CUTS.map((t) => <Sfx key={`w${t}`} at={s(t) - 2} src="whoosh" v={0.35} />)}
    {POPS.map((t) => <Sfx key={`p${t}`} at={s(t) - 1} src="pop" v={0.26} />)}
    {DINGS.map((t) => <Sfx key={`d${t}`} at={s(t)} src="ding" v={0.28} />)}
    <Sfx at={s(46.7)} src="bass" v={0.35} />
    <Sfx at={s(62.2)} src="bass" v={0.35} />
  </>
);

export const EnsemblesEdit: React.FC = () => {
  useFontFaces([
    [P.display, "fonts/anton.woff2", "400"],
    [P.body, "fonts/inter-600.woff2", "600"],
    [P.body, "fonts/inter-800.woff2", "800"],
  ]);
  const f = useCurrentFrame();
  const board = (f >= s(15.7) && f < s(81.3));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < s(4.5) && <Hook />}
      {f >= s(4.5) && f < s(15.7) && <BasketScene />}
      {board && <MathBg />}
      {board && <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 25%, ${P.purple}33, transparent 45%), radial-gradient(circle at 10% 80%, ${P.orange}26, transparent 45%)` }} />}
      <Scene from={s(15.7)} to={s(27.7)} n="1" title="La notation"><Notation /></Scene>
      <Scene from={s(27.7)} to={s(39.3)} n="2" title="L'inclusion"><Inclusion /></Scene>
      <Scene from={s(39.3)} to={s(57.6)} n="3" title="Union et intersection"><Venn /></Scene>
      <Scene from={s(57.6)} to={s(63.5)} n="4" title="L'ensemble vide"><Vide /></Scene>
      <Scene from={s(63.5)} to={s(81.3)} n="5" title="Les ensembles de nombres"><Nombres /></Scene>
      {f >= s(81.3) && <Outro />}
      <Captions />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [ENSEMBLES_FRAMES - 10, ENSEMBLES_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
