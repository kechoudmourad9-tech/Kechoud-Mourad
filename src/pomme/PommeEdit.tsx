import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { clamp } from "../theme";
import { Arrow, MathBg, Scene, Tex, sec } from "../maths/kit";
import captions from "./captions.json";
import { Apple, AppleHalf, Basket, Bubble, Field, Gear, P, Person, PersonPose, Sparkles, handR } from "./world";

export const POMME_FRAMES = sec(66.6);
const FEET = 1500;
const SC = 1.35;

/* ---------- colourful sticker text ---------- */
export const Sticker: React.FC<{ at: number; x: number; y: number; bg: string; color?: string; size?: number; rot?: number;
  until?: number; children: React.ReactNode }> = ({ at, x, y, bg, color = "#fff", size = 64, rot = -3, until, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || (until !== undefined && f >= until)) return null;
  const p = spring({ frame: f - at, fps, config: P.spring.bouncy });
  const o = until !== undefined ? interpolate(f, [until - 7, until], [1, 0], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot + (1 - p) * 12}deg) scale(${p})`,
      opacity: o, background: bg, color, fontFamily: P.display, fontSize: size, textTransform: "uppercase", whiteSpace: "nowrap",
      padding: `${size * 0.12}px ${size * 0.4}px`, borderRadius: size * 0.3, border: "6px solid #fff",
      boxShadow: `0 10px 0 rgba(0,0,0,0.18), 0 0 40px ${bg}88`, lineHeight: 1.1 }}>
      {children}
    </div>
  );
};

const ease = (f: number, a: number, b: number, from: number, to: number) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: P.ease.inOut });

/* ---------- 1. the field story (0 – 33.4 s) ---------- */
const FieldStory: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sec;

  // people
  const ax = ease(f, s(3.9), s(5.0), -200, 300);
  const bx = ease(f, s(4.8), s(5.8), 1280, 890);
  const holding = f >= s(7.6);
  const raise = ease(f, s(17.5), s(18.1), 0, 1);
  const thrown = f >= s(20.3);
  const armR = !holding ? 8 : thrown ? ease(f, s(20.3), s(20.9), -150, 8) : -55 - 95 * raise;
  const bJump = f >= s(21.1) ? Math.max(0, Math.sin(Math.min(Math.PI, (f - s(21.1)) / 5))) * 70 : 0;
  const A: PersonPose = { x: ax, feet: FEET, shirt: P.pink, hair: "#3B2416", label: "A", labelColor: P.pink, scale: SC,
    walk: f > s(3.9) && f < s(5.0) ? 1 : 0, armR, face: 1 };
  const B: PersonPose = { x: bx, feet: FEET, shirt: P.blue, hair: "#1B1530", skin: P.skin2, label: "B", labelColor: P.blue, scale: SC,
    walk: f > s(4.8) && f < s(5.8) ? 1 : 0, armR: -8, armL: f >= s(21.1) && f < s(23) ? -150 : -8, jump: bJump, face: -1 };
  const [hx, hy] = handR(A);

  // apple state
  const appleIn = spring({ frame: f - s(7.8), fps, config: P.spring.bouncy });
  const cut = f >= s(18.5);
  const split = spring({ frame: f - s(18.5), fps, config: P.spring.snappy });
  const BASKET_B: [number, number] = [690, FEET + 10];
  const flight = (delay: number) => {
    const t = interpolate(f, [s(20.2) + delay, s(21.0) + delay], [0, 1], { ...clamp, easing: P.ease.inOut });
    return t;
  };
  const halfPos = (side: -1 | 1, delay: number): [number, number, number] => {
    const t = flight(delay);
    const sx = hx + side * 22 * split, sy = hy - 30;
    const ex = BASKET_B[0] + side * 26, ey = BASKET_B[1] - 120;
    return [sx + (ex - sx) * t, sy + (ey - sy) * t - Math.sin(Math.PI * t) * 380, t * 360 * side];
  };

  // basket shake when B's basket is said to be empty, and when the halves land
  const shakeB = (f > s(11.6) && f < s(12.4) ? Math.sin(f) * 6 : 0) + (f > s(21.0) && f < s(21.5) ? Math.sin(f * 1.3) * 5 : 0);
  const basketA = spring({ frame: f - s(8.6), fps, config: P.spring.bouncy });
  const basketB = spring({ frame: f - s(11.5), fps, config: P.spring.bouncy });
  const slash = interpolate(f, [s(18.35), s(18.6)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Field />
      {/* hook title */}
      <Sticker at={s(0.2)} until={s(3.4)} x={540} y={420} bg={P.purple} size={78} rot={-4}>Comprendre</Sticker>
      <Sticker at={s(1.3)} until={s(3.4)} x={540} y={570} bg={P.pink} size={120} rot={3}>la base</Sticker>
      <Sticker at={s(1.8)} until={s(3.4)} x={540} y={720} bg={P.blue} size={78} rot={-2}>des maths</Sticker>

      <Sticker at={s(4.3)} until={s(7.4)} x={300} y={420} bg={P.pink} size={62} rot={-4}>Personne A</Sticker>
      <Sticker at={s(5.2)} until={s(7.4)} x={790} y={420} bg={P.blue} size={62} rot={3}>Personne B</Sticker>

      {/* baskets */}
      {f >= s(8.6) && <div style={{ position: "absolute", inset: 0, transform: `scale(${basketA})`, transformOrigin: `120px ${FEET}px` }}>
        <Basket x={120} y={FEET + 10} size={170} />
      </div>}
      {f >= s(11.5) && <div style={{ position: "absolute", inset: 0, transform: `scale(${basketB})`, transformOrigin: `${BASKET_B[0]}px ${FEET}px` }}>
        <Basket x={BASKET_B[0]} y={BASKET_B[1]} size={190} shake={shakeB} />
      </div>}
      <Sticker at={s(9.0)} until={s(10.0)} x={120} y={1280} bg={P.orange} size={44}>vide</Sticker>
      <Sticker at={s(11.9)} until={s(13.2)} x={BASKET_B[0]} y={1290} bg={P.orange} size={50}>vide</Sticker>

      <Person {...A} />
      <Person {...B} />

      {/* apple in A's hand, then halves */}
      {holding && !cut && <div style={{ position: "absolute", inset: 0, transform: `scale(${appleIn})`, transformOrigin: `${hx}px ${hy}px` }}>
        <Apple x={hx} y={hy - 30} size={100} />
      </div>}
      {cut && (() => {
        const [x1, y1, r1] = halfPos(-1, 0);
        const [x2, y2, r2] = halfPos(1, 4);
        return <>
          <AppleHalf x={x1} y={y1} size={100} side={1} rot={r1} />
          <AppleHalf x={x2} y={y2} size={100} side={-1} rot={r2} />
        </>;
      })()}
      {/* knife slash */}
      {slash > 0 && slash < 1 && (
        <div style={{ position: "absolute", left: hx - 120, top: hy - 30, width: 240 * slash, height: 10, borderRadius: 5,
          background: "#fff", boxShadow: "0 0 30px #fff, 0 0 60px #FFD23F", transform: "rotate(-60deg)", transformOrigin: "0 50%" }} />
      )}
      <Sparkles at={s(18.5)} x={hx} y={hy - 30} color={P.yellow} />
      <Sparkles at={s(21.0)} x={BASKET_B[0]} y={BASKET_B[1] - 130} color={P.pink} />

      {/* thought bubble: A's plan */}
      <Bubble at={s(13.1)} until={s(16.6)} x={560} y={620} w={820} h={230} tailX={ax + 40} tailY={950}>
        <div style={{ position: "relative", width: 110, height: 110 }}><Apple x={55} y={60} size={100} /></div>
        <span style={{ fontFamily: P.display, fontSize: 70, color: P.orange }}>÷2</span>
        <span style={{ fontFamily: P.display, fontSize: 70, color: P.ink }}>→</span>
        <div style={{ position: "relative", width: 150, height: 110 }}>
          <AppleHalf x={50} y={60} size={90} side={1} /><AppleHalf x={100} y={60} size={90} side={-1} />
        </div>
        <span style={{ fontFamily: P.display, fontSize: 70, color: P.ink }}>→</span>
        <span style={{ fontFamily: P.display, fontSize: 64, color: "#fff", background: P.blue, borderRadius: 40, width: 80, height: 80,
          display: "flex", alignItems: "center", justifyContent: "center" }}>B</span>
      </Bubble>

      <Sticker at={s(18.4)} until={s(20.0)} x={hx + 40} y={hy - 210} bg={P.orange} size={56} rot={6}>couper !</Sticker>
      <Sticker at={s(20.1)} until={s(21.4)} x={540} y={640} bg={P.blue} size={56} rot={-4}>donner !</Sticker>
      <Sticker at={s(23.4)} until={s(24.8)} x={BASKET_B[0]} y={1250} bg={P.purple} size={56}>½ + ½</Sticker>

      {/* the arrow = an application */}
      <Arrow at={s(24.9)} from={[330, 900]} to={[820, 900]} bend={-0.32} color={P.pink} width={16} dur={20} />
      <Sticker at={s(26.4)} x={575} y={520} bg={P.pink} size={96} rot={-4}>Application</Sticker>
      <Sticker at={s(28.5)} until={s(33.4)} x={330} y={700} bg={P.orange} size={46} rot={-8}>1. couper</Sticker>
      <Sticker at={s(30.5)} until={s(33.4)} x={810} y={700} bg={P.blue} size={46} rot={8}>2. donner</Sticker>
      <Sticker at={s(32.5)} x={575} y={760} bg={P.purple} size={88} rot={0}>f</Sticker>
    </AbsoluteFill>
  );
};

/* ---------- 2. set theory (33.4 – 41.9 s) ---------- */
const SetTheory: React.FC = () => {
  const s = sec;
  return (
    <>
      <Sticker at={s(37.4)} x={540} y={380} bg={P.purple} size={70} rot={-3}>La théorie des</Sticker>
      <Sticker at={s(38.0)} x={540} y={520} bg={P.pink} size={130} rot={2}>ensembles</Sticker>
      <Gear x={170} y={760} r={90} speed={2} color={P.orange} />
      <Gear x={910} y={760} r={70} speed={-2.6} color={P.blue} />
      {[[220, P.orange, "\\in", 35.1], [540, P.purple, "\\cup", 35.5], [860, P.yellow, "\\subset", 35.9]].map(([x, c, sym, t], i) => (
        <div key={i}>
          <Person x={x as number} feet={1560} shirt={c as string} hair={["#3B2416", "#1B1530", "#6B3A1E"][i]} skin={i === 1 ? P.skin2 : P.skin}
            scale={0.78} armR={i === 1 ? -150 : 8} face={0} />
          <Bubble at={s(t as number)} until={s(41.9)} x={x as number} y={1000} w={190} h={150} tailX={(x as number) + 10} tailY={1160}>
            <div style={{ position: "relative", width: 1, height: 1 }}>
              <Tex at={s(t as number) + 3} x={0} y={0} size={90} tex={sym as string} color={P.ink} dur={10} />
            </div>
          </Bubble>
        </div>
      ))}
    </>
  );
};

/* ---------- 3. sets diagram (41.9 – 55.6 s) ---------- */
const SetsDiagram: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sec;
  const ell = (at: number, y: number, color: string) => {
    if (f < at) return null;
    const p = interpolate(f, [at, at + 22], [0, 1], { ...clamp, easing: P.ease.out });
    return <ellipse cx={540} cy={y} rx={420} ry={200} fill={`${color}1F`} stroke={color} strokeWidth={8} pathLength={1}
      strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 16px ${color})` }} />;
  };
  const E = [["1", 400], ["-2", 540], ["\\pi", 680]] as const;
  const F = [["0", 400], ["7", 540], ["\\sqrt{2}", 680]] as const;
  const colors = [P.orange, P.yellow, P.purple];
  return (
    <>
      <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
        {ell(s(44.3), 560, P.pink)}
        {ell(s(51.8), 1230, P.blue)}
      </svg>
      <Sticker at={s(44.6)} x={540} y={310} bg={P.pink} size={56} rot={-2}>Ensemble de départ</Sticker>
      <Sticker at={s(52.4)} x={540} y={1490} bg={P.blue} size={56} rot={2}>Ensemble d'arrivée</Sticker>
      {E.map(([t, x], i) => {
        const p = spring({ frame: f - s(45.9) - i * 5, fps, config: P.spring.bouncy });
        return f >= s(45.9) + i * 5 ? <div key={t}>
          <div style={{ position: "absolute", left: x - 16, top: 600 - 16, width: 32, height: 32, borderRadius: 16, background: colors[i],
            transform: `scale(${p})`, boxShadow: `0 0 20px ${colors[i]}` }} />
          <Tex at={s(45.9) + i * 5} x={x} y={530} size={64} tex={t} dur={8} />
        </div> : null;
      })}
      {F.map(([t, x], i) => {
        const at = s(52.8) + i * 5;
        const p = spring({ frame: f - at, fps, config: P.spring.bouncy });
        return f >= at ? <div key={t}>
          <div style={{ position: "absolute", left: x - 16, top: 1190 - 16, width: 32, height: 32, borderRadius: 16, background: colors[i],
            transform: `scale(${p})`, boxShadow: `0 0 20px ${colors[i]}` }} />
          <Tex at={at} x={x} y={1270} size={64} tex={t} dur={8} />
        </div> : null;
      })}
      {E.map(([, x], i) => (
        <Arrow key={`a${i}`} at={s(50.6) + i * 6} from={[x, 625]} to={[F[(i + 1) % 3][1], 1165]} bend={0.12 * (i - 1)} color={colors[i]} width={7} />
      ))}
      <Tex at={s(47.8)} x={210} y={560} size={80} tex={"\\mathbb{R}"} color={P.pink} />
      <Tex at={s(48.4)} x={870} y={560} size={80} tex={"\\mathbb{Z}"} color={P.pink} />
      <Tex at={s(53.9)} x={210} y={1230} size={80} tex={"\\mathbb{N}"} color={P.blue} />
      <Tex at={s(54.5)} x={870} y={1230} size={80} tex={"\\mathbb{R}"} color={P.blue} />
    </>
  );
};

/* ---------- 4. the function (55.6 – end) ---------- */
const FunctionScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sec;
  const ap = spring({ frame: f - s(61.8), fps, config: P.spring.bouncy });
  const hp = spring({ frame: f - s(63.3), fps, config: P.spring.bouncy });
  return (
    <>
      <Tex at={s(56.2)} y={420} size={140} tex={"f : E \\longrightarrow F"} />
      <Tex at={s(57.9)} x={300} y={700} size={140} tex={"{\\color{#FF4FA3}x}"} />
      <Arrow at={s(59.3)} from={[400, 700]} to={[640, 700]} bend={-0.2} color={P.yellow} width={10} />
      <Tex at={s(60.9)} x={790} y={700} size={140} tex={"{\\color{#3D8BFF}f(x)}"} glow={P.blueGlow} />
      <Sticker at={s(61.7)} x={540} y={930} bg={P.orange} size={56} rot={-3}>Exemple : la pomme</Sticker>
      {f >= s(61.8) && <div style={{ position: "absolute", inset: 0, transform: `scale(${ap})`, transformOrigin: "290px 1150px" }}>
        <Apple x={290} y={1150} size={170} /></div>}
      <Arrow at={s(62.6)} from={[400, 1150]} to={[640, 1150]} bend={-0.2} color={P.pink} width={10} />
      {f >= s(63.3) && <div style={{ position: "absolute", inset: 0, transform: `scale(${hp})`, transformOrigin: "790px 1150px" }}>
        <AppleHalf x={750} y={1150} size={150} side={1} /><AppleHalf x={840} y={1150} size={150} side={-1} /></div>}
      <Tex at={s(63.4)} y={1410} size={110} tex={"f(x) = \\dfrac{x}{2}"} box={{ at: s(64.6), color: P.pink }} />
      <Sparkles at={s(63.3)} x={795} y={1150} color={P.yellow} />
    </>
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
    <div style={{ position: "absolute", left: 50, right: 50, top: 1660, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", padding: "10px 28px",
        background: "rgba(10,8,25,0.78)", borderRadius: 22, border: "3px solid rgba(255,255,255,0.9)" }}>
        {page.map((w, i) => (
          <span key={i} style={{ fontFamily: P.body, fontWeight: 800, fontSize: 52, lineHeight: 1.35,
            color: t >= w.s && t < w.e + 0.1 ? P.yellow : t >= w.s ? "#fff" : "rgba(255,255,255,0.5)" }}>{w.t}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- sound ---------- */
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.32 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={v} />
  </Sequence>
);
const Sound: React.FC = () => {
  const s = sec;
  const pops = [0.2, 1.3, 1.8, 4.3, 5.2, 7.8, 8.6, 11.5, 13.1, 23.4, 28.5, 30.5, 32.5, 44.6, 52.4, 61.7, 61.8, 63.3];
  return (
    <>
      <Audio src={staticFile("pomme/voice.m4a")} />
      <Audio src={staticFile("sfx/bed68.wav")} volume={(f) => interpolate(f, [0, 15, POMME_FRAMES - 45, POMME_FRAMES - 3], [0, 0.07, 0.07, 0], clamp)} />
      {pops.map((t) => <Sfx key={t} at={s(t) - 1} src="pop" v={0.3} />)}
      {[3.9, 4.8, 18.35, 20.2, 24.9, 33.4, 41.9, 55.6].map((t) => <Sfx key={`w${t}`} at={s(t) - 2} src="whoosh" v={0.35} />)}
      {[21.0, 26.4, 38.0, 64.6].map((t) => <Sfx key={`d${t}`} at={s(t)} src="ding" v={0.3} />)}
      <Sfx at={s(26.4)} src="bass" v={0.4} />
      {[45.9, 46.07, 46.23, 52.8, 52.97, 53.13].map((t) => <Sfx key={`c${t}`} at={s(t)} src="check" v={0.3} />)}
    </>
  );
};

export const PommeEdit: React.FC = () => {
  useFontFaces([
    [P.display, "fonts/anton.woff2", "400"],
    [P.body, "fonts/inter-600.woff2", "600"],
    [P.body, "fonts/inter-800.woff2", "800"],
  ]);
  const f = useCurrentFrame();
  const s = sec;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < s(33.4) && <FieldStory />}
      {f >= s(33.4) && <MathBg />}
      {/* extra colour glows on the black boards */}
      {f >= s(33.4) && <AbsoluteFill style={{ background: `radial-gradient(circle at 80% 30%, ${P.purple}33, transparent 45%), radial-gradient(circle at 15% 75%, ${P.orange}26, transparent 45%)` }} />}
      <Scene from={s(33.4)} to={s(41.9)} n="1" title="Les mathématiciens"><SetTheory /></Scene>
      <Scene from={s(41.9)} to={s(55.6)} n="2" title="Une application, c'est…"><SetsDiagram /></Scene>
      <Scene from={s(55.6)} to={POMME_FRAMES} n="3" title="Définie par une fonction"><FunctionScene /></Scene>
      <Captions />
      <Grain />
      <Vignette />
      <Sound />
    </AbsoluteFill>
  );
};
