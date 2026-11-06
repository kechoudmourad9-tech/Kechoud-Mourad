import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { clamp } from "../theme";
import captions from "./captions.json";
import { Arrow, Chest, M, MathBg, Scene, Tex, Token, Txt, sec } from "./kit";

export const MATHS_FRAMES = sec(181.9) + 30;

/* ---------- small scene-specific drawings ---------- */
const Burst: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - at;
  if (t < 0 || t > 90) return null;
  const syms = ["∑", "∫", "Ω", "π", "∞", "∂", "σ", "√", "λ", "∏", "≤", "%"];
  return (
    <>
      {syms.map((s, i) => {
        const p = spring({ frame: t - i, fps, config: M.spring.smooth });
        const a = (i / syms.length) * Math.PI * 2;
        const r = 380 * p;
        return (
          <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * r, top: 1050 + Math.sin(a) * r * 1.2,
            transform: `translate(-50%,-50%) rotate(${(1 - p) * 90}deg)`, fontSize: 90, fontFamily: "KaTeX_Main",
            color: i % 3 === 0 ? M.white : i % 2 ? M.pink : M.blue, opacity: interpolate(t, [60, 90], [1, 0], clamp) * p }}>{s}</div>
        );
      })}
    </>
  );
};

const NumberLine: React.FC<{ at: number; y: number }> = ({ at, y }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = interpolate(frame, [at, at + 20], [0, 1], { ...clamp, easing: M.ease.out });
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <line x1={190} y1={y} x2={190 + 700 * p} y2={y} stroke={M.blue} strokeWidth={8} strokeLinecap="round" />
      {[0, 1].map((k) => (
        <g key={k} opacity={p > k * 0.9 ? 1 : 0}>
          <line x1={190 + 700 * k} y1={y - 26} x2={190 + 700 * k} y2={y + 26} stroke={M.white} strokeWidth={6} />
          <text x={190 + 700 * k} y={y + 80} fill={M.white} fontSize={56} textAnchor="middle" fontFamily="KaTeX_Main">{k}</text>
        </g>
      ))}
      <circle cx={190 + 700 * 0.35} cy={y} r={18 * p} fill={M.pink} style={{ filter: `drop-shadow(0 0 12px ${M.pink})` }} />
    </svg>
  );
};

const Venn: React.FC<{ at: number; y: number }> = ({ at, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: M.spring.smooth });
  const q = spring({ frame: frame - at - 10, fps, config: M.spring.bouncy });
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <ellipse cx={540} cy={y} rx={360} ry={210} fill={`${M.blue}14`} stroke={M.blue} strokeWidth={6} pathLength={1}
        strokeDasharray={1} strokeDashoffset={1 - p} />
      <text x={230} y={y - 140} fill={M.blue} fontSize={64} fontFamily="KaTeX_Main" opacity={p}>Ω</text>
      <circle cx={610} cy={y + 10} r={120 * q} fill={`${M.pink}55`} stroke={M.pink} strokeWidth={6} />
      <text x={610} y={y + 32} fill={M.white} fontSize={64} textAnchor="middle" fontFamily="KaTeX_Math" fontStyle="italic" opacity={q}>A</text>
    </svg>
  );
};

const Bracket: React.FC<{ at: number; x1: number; x2: number; y: number; color?: string }> = ({ at, x1, x2, y, color = M.pink }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = interpolate(frame, [at, at + 40], [0, 1], { ...clamp, easing: M.ease.inOut });
  const m = (x1 + x2) / 2;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <path d={`M ${x1} ${y} Q ${x1} ${y + 40} ${x1 + 40} ${y + 40} L ${m - 30} ${y + 40} Q ${m} ${y + 40} ${m} ${y + 80} Q ${m} ${y + 40} ${m + 30} ${y + 40} L ${x2 - 40} ${y + 40} Q ${x2} ${y + 40} ${x2} ${y}`}
        fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}
        style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
    </svg>
  );
};

const ExpCurve: React.FC<{ at: number; fillAt: number }> = ({ at, fillAt }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = interpolate(frame, [at, at + 30], [0, 1], { ...clamp, easing: M.ease.out });
  const f = interpolate(frame, [fillAt, fillAt + 30], [0, 1], { ...clamp, easing: M.ease.out });
  const X0 = 180, Y0 = 1430, W = 720, H = 520;
  const pts = Array.from({ length: 41 }, (_, i) => {
    const u = i / 40;
    return [X0 + u * W, Y0 - ((Math.exp(2.2 * u) - 1) / (Math.exp(2.2) - 1)) * H] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const tIdx = 30;
  const area = `M ${X0} ${Y0} ` + pts.slice(0, Math.round(tIdx * f) + 1).map(([x, y]) => `L ${x} ${y}`).join(" ") +
    ` L ${pts[Math.round(tIdx * f)][0]} ${Y0} Z`;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <line x1={X0} y1={Y0} x2={X0 + W + 30} y2={Y0} stroke={M.white} strokeWidth={4} opacity={p} />
      <line x1={X0} y1={Y0} x2={X0} y2={Y0 - H - 40} stroke={M.white} strokeWidth={4} opacity={p} />
      {f > 0 && <path d={area} fill={`${M.pink}66`} />}
      <path d={d} fill="none" stroke={M.blue} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1}
        strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 10px ${M.blue})` }} />
      <text x={X0 - 20} y={Y0 + 60} fill={M.white} fontSize={48} fontFamily="KaTeX_Main">0</text>
      <text x={pts[tIdx][0]} y={Y0 + 60} fill={M.pink} fontSize={52} fontFamily="KaTeX_Math" fontStyle="italic" textAnchor="middle" opacity={f}>t</text>
    </svg>
  );
};

const Stamp: React.FC<{ at: number; y: number; text: string; color?: string }> = ({ at, y, text, color = M.pink }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 540, top: y, transform: `translate(-50%,-50%) rotate(-6deg) scale(${interpolate(p, [0, 1], [2.2, 1])})`,
      opacity: Math.min(1, p * 2), border: `8px solid ${color}`, borderRadius: 22, padding: "10px 40px", fontFamily: M.display,
      fontSize: 110, color, textTransform: "uppercase", boxShadow: `0 0 50px ${color}66, inset 0 0 30px ${color}33`, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

const Percent: React.FC<{ at: number; y: number }> = ({ at, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const c = spring({ frame: frame - at, fps, config: { damping: 30, stiffness: 45 } });
  const v = (c * 0.075).toFixed(3).replace(".", ",");
  const pop = spring({ frame: frame - at - 28, fps, config: M.spring.bouncy });
  return (
    <div style={{ position: "absolute", left: 540, top: y, transform: `translate(-50%,-50%) scale(${1 + (frame > at + 28 ? (1 - pop) * 0.15 : 0)})`,
      fontFamily: M.display, fontSize: 260, color: M.pink, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
      textShadow: `0 0 60px ${M.pinkGlow}, 0 0 120px ${M.pinkGlow}` }}>
      {v} %
    </div>
  );
};

const SpinToken: React.FC<{ at: number; x: number; y: number; size: number }> = ({ at, x, y, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: M.spring.bouncy });
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + Math.sin(frame / 12) * 10, transform: `scale(${p})` }}>
      <Token size={size} spin={(frame - at) / 7} />
    </div>
  );
};

/* ---------- scenes (times in seconds of voice-over) ---------- */
const S = (a: number, b: number) => [sec(a), sec(b)] as const;

const Scenes: React.FC = () => {
  const s = sec;
  return (
    <>
      {/* 1 — hook */}
      <Scene from={0} to={s(7.3)} n="FORTNITE" title="× les maths">
        <Txt at={s(0.5)} y={420} size={120}>Trouver le</Txt>
        <Txt at={s(2.5)} y={560} size={190} color={M.pink}>TOKEN</Txt>
        <SpinToken at={s(2.6)} x={540} y={780} size={180} />
        {[0, 1, 2, 3, 4].map((i) => <Chest key={i} at={s(1.0) + i * 4} x={160 + i * 190} y={1020} size={150} />)}
        <Tex at={s(5.6)} y={1300} size={110} tex={"\\mathbb{P}(\\text{token}) = \\,{\\color{#FF4FA3}?}"} />
      </Scene>

      {/* 2 — promise */}
      <Scene from={s(7.3)} to={s(11.8)} title="Aujourd'hui">
        <Txt at={s(8.8)} y={560} size={110}>La probabilité</Txt>
        <Txt at={s(9.3)} y={720} size={200} color={M.pink}>EXACTE</Txt>
        <Txt at={s(10.6)} y={900} size={90} color={M.blue}>avec des maths</Txt>
        <Burst at={s(10.9)} />
      </Scene>

      {/* 3 — probability space */}
      <Scene from={s(11.8)} to={s(18.7)} n="01" title="L'espace de probabilité">
        <Tex at={s(13.8)} y={700} size={150} tex={"(\\,\\Omega,\\ \\mathcal{A},\\ \\mathbb{P}\\,)"} />
        <Arrow at={s(15.7)} from={[330, 800]} to={[230, 1060]} bend={-0.15} color={M.blue} />
        <Txt at={s(15.9)} y={1130} x={230} size={46} font="body" color={M.blue}>l'univers</Txt>
        <Arrow at={s(16.5)} from={[540, 800]} to={[540, 1220]} bend={0} color={M.pink} />
        <Txt at={s(16.8)} y={1290} size={46} font="body" color={M.pink}>la tribu (événements)</Txt>
        <Arrow at={s(17.7)} from={[740, 800]} to={[850, 1060]} bend={0.15} color={M.white} />
        <Txt at={s(17.9)} y={1130} x={850} size={46} font="body">la probabilité</Txt>
      </Scene>

      {/* 4 — P : A -> [0,1], P(A) = |A|/|Ω| */}
      <Scene from={s(18.7)} to={s(29.3)} n="02" title="La probabilité P">
        <Tex at={s(19.3)} y={420} size={110} tex={"\\mathbb{P} : \\mathcal{A} \\longrightarrow [\\,0,1\\,]"} />
        <NumberLine at={s(21.0)} y={600} />
        <Tex at={s(23.8)} y={900} size={150} tex={"\\mathbb{P}(A) = \\dfrac{|A|}{|\\Omega|}"} box={{ at: s(28.6), color: M.pink }} />
        <Venn at={s(26.0)} y={1330} />
        <Arrow at={s(26.4)} from={[700, 880]} to={[650, 1220]} bend={-0.25} color={M.pink} />
      </Scene>

      {/* 5 — Bernoulli + filtration */}
      <Scene from={s(29.3)} to={s(42.0)} n="03" title="Chaque coffre = Bernoulli">
        <Tex at={s(31.1)} y={400} size={120} tex={"Y_n \\overset{\\text{i.i.d.}}{\\sim} \\mathcal{B}(p)"} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Chest key={i} at={s(32.6) + i * 3} x={160 + i * 190} y={660} size={140}
            label={`Y${["₁", "₂", "₃", "₄", "ₙ"][i]} = ${i === 3 ? 1 : 0}`} labelColor={i === 3 ? M.pink : M.blue}
            open={s(33.4) + i * 4} token={i === 3} />
        ))}
        <Txt at={s(34.6)} y={940} size={80} color={M.blue}>Filtration naturelle</Txt>
        <Tex at={s(36.6)} y={1130} size={100} tex={"\\mathcal{F}_n = \\sigma(\\,Y_1,\\, Y_2,\\, \\dots,\\, Y_n\\,)"} />
        <Bracket at={s(38.9)} x1={430} x2={960} y={1200} />
        <Txt at={s(40.6)} y={1360} x={695} size={44} font="body" color={M.pink}>tout ce qu'on sait après n coffres</Txt>
      </Scene>

      {/* 6 — opening n chests */}
      <Scene from={s(42.0)} to={s(47.7)} title="On ouvre les coffres…">
        {Array.from({ length: 8 }).map((_, i) => (
          <Chest key={i} at={s(42.2) + i * 2} x={200 + (i % 4) * 227} y={560 + Math.floor(i / 4) * 330} size={170}
            open={s(43.0) + i * 6} token={i === 7} />
        ))}
        <Counter at={s(43.0)} y={1330} />
      </Scene>

      {/* 7 — S_n */}
      <Scene from={s(47.7)} to={s(53.0)} n="04" title="Le nombre de tokens">
        <Tex at={s(48.6)} y={780} size={170} tex={"S_n = \\sum_{k=1}^{n} Y_k"} glow={M.blueGlow} />
        {[0, 1, 2, 3].map((i) => (
          <Arrow key={i} at={s(50.2) + i * 3} from={[150 + i * 260, 1260]} to={[470, 900]} bend={0.1 * (i - 1.5)} color={M.blue} width={5} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <Tex key={`y${i}`} at={s(50.0) + i * 3} y={1320} x={150 + i * 260} size={80} tex={`Y_{${i + 1}}`} color={i === 2 ? M.pink : M.white} />
        ))}
      </Scene>

      {/* 8 — stopping time */}
      <Scene from={s(53.0)} to={s(71.3)} n="05" title="Le temps d'arrêt T">
        <Tex at={s(54.6)} y={520} size={104} tex={"T = \\inf\\{\\, n \\ge 1 \\;:\\; S_n \\ge 1 \\,\\}"} />
        <Arrow at={s(57.8)} from={[760, 600]} to={[780, 760]} bend={0.2} color={M.blue} />
        <Txt at={s(58.2)} y={820} x={700} size={44} font="body" color={M.blue}>le 1er coffre avec un token</Txt>
        <Tex at={s(62.8)} y={1040} size={130} tex={"\\{\\, T \\le n \\,\\} \\in \\mathcal{F}_n"} box={{ at: s(66.0), color: M.blue }} />
        <Stamp at={s(68.4)} y={1350} text="temps d'arrêt" />
      </Scene>

      {/* 9 — martingale */}
      <Scene from={s(71.3)} to={s(79.3)} n="06" title="La martingale">
        <Txt at={s(71.6)} y={520} size={130} color={M.pink}>Martingale</Txt>
        <Tex at={s(73.3)} y={880} size={180} tex={"M_n = S_n - np"} box={{ at: s(77.1), color: M.pink }} />
        <Txt at={s(75.6)} y={1180} size={44} font="body" color={M.dim}>tokens trouvés − tokens attendus</Txt>
      </Scene>

      {/* 10 — conditional expectation */}
      <Scene from={s(79.3)} to={s(104.1)} n="07" title="L'espérance conditionnelle">
        <Tex at={s(81.1)} y={400} size={100} tex={"\\mathbb{E}\\big[\\, M_{n+1} \\mid \\mathcal{F}_n \\,\\big]"} />
        <Arrow at={s(84.3)} from={[540, 470]} to={[540, 590]} bend={0} color={M.blue} />
        <Tex at={s(86.4)} y={680} size={78} tex={"M_{n+1} = S_n + {\\color{#FF4FA3}Y_{n+1}} - (n+1)\\,p"} />
        <Tex at={s(92.3)} y={920} size={96} tex={"{\\color{#FF4FA3}Y_{n+1}} \\;\\perp\\!\\!\\!\\perp\\; \\mathcal{F}_n"} />
        <Txt at={s(93.4)} y={1030} size={42} font="body" color={M.dim}>indépendant de ce qu'on a déjà vu</Txt>
        <Arrow at={s(98.4)} from={[330, 920]} to={[420, 690]} bend={-0.35} color={M.pink} />
        <Tex at={s(100.7)} y={1290} size={110} tex={"\\mathbb{E}\\big[\\, Y_{n+1} \\mid \\mathcal{F}_n \\,\\big] = p"} box={{ at: s(103.3), color: M.pink }} />
      </Scene>

      {/* 11 — integral */}
      <Scene from={s(104.1)} to={s(115.2)} n="08" title="L'intégrale">
        <Tex at={s(105.9)} y={460} size={120} tex={"p_n = \\int_0^{t} e^{ut}\\,dt \\;\\le\\; B"} box={{ at: s(112.2), color: M.blue }} />
        <ExpCurve at={s(107.4)} fillAt={s(108.6)} />
      </Scene>

      {/* 12 — derivative = 0 → 0 jeton 0 chance */}
      <Scene from={s(115.2)} to={s(126.3)} n="09" title="La dérivée">
        <Tex at={s(116.9)} y={500} size={96} tex={"\\dfrac{dB}{du} = -\\dfrac{d}{dB_k}\\, T\\!\\left(\\dfrac{dB}{du'}\\right) {\\color{#FF4FA3}\\,=\\, 0}"} />
        <Arrow at={s(122.2)} from={[540, 640]} to={[540, 860]} bend={0} color={M.pink} />
        <Tex at={s(122.8)} y={1000} size={110} tex={"0 \\text{ jeton} \\;\\Longrightarrow\\; {\\color{#FF4FA3}0 \\text{ chance}}"} />
        <Chest at={s(123.0)} x={540} y={1320} size={220} open={s(123.6)} />
      </Scene>

      {/* 13 — generating function */}
      <Scene from={s(126.3)} to={s(146.2)} n="10" title="La fonction génératrice">
        <Chest at={s(128.6)} x={540} y={430} size={170} open={s(129.4)} token />
        <Tex at={s(133.2)} y={720} size={110} tex={"G_{S_n}(z) = \\mathbb{E}\\big[\\, z^{S_n} \\big]"} />
        <Arrow at={s(138.3)} from={[540, 790]} to={[540, 900]} bend={0} color={M.blue} />
        <Tex at={s(138.8)} y={1010} size={110} tex={"= \\prod_{k=1}^{n} \\mathbb{E}\\big[\\, z^{Y_k} \\big]"} />
        <Arrow at={s(142.8)} from={[540, 1120]} to={[540, 1230]} bend={0} color={M.blue} />
        <Tex at={s(143.3)} y={1330} size={130} tex={"= (\\,1 - p + p z\\,)^{n}"} box={{ at: s(145.1), color: M.pink }} />
      </Scene>

      {/* 14 — derivatives & variance */}
      <Scene from={s(146.2)} to={s(166.5)} n="11" title="Dérivée et variance">
        <Tex at={s(150.3)} y={420} size={92} tex={"G'_{S_n}(z) = np\\,(1 - p + pz)^{n-1}"} />
        <Tex at={s(156.0)} y={680} size={110} tex={"G'(1) = np"} box={{ at: s(157.4), color: M.blue }} />
        <Tex at={s(158.0)} y={920} size={110} tex={"G''(1) = n(n-1)\\,p^2"} />
        <Arrow at={s(161.6)} from={[540, 1000]} to={[540, 1130]} bend={0} color={M.pink} />
        <Tex at={s(162.8)} y={1260} size={120} tex={"\\operatorname{Var}(S_n) = np\\,(1-p)"} box={{ at: s(165.2), color: M.pink }} glow={M.pinkGlow} />
      </Scene>

      {/* 15 — the big formula */}
      <Scene from={s(166.5)} to={s(172.8)} n="12" title="On assemble tout">
        <Tex at={s(167.4)} y={760} size={96} dur={60}
          tex={"a \\ln\\dfrac{a}{p} \\;+\\; (1-a)\\,\\ln\\dfrac{1-a}{1-p}"} />
        <Arrow at={s(170.6)} from={[540, 900]} to={[540, 1120]} bend={0} color={M.pink} />
        <Txt at={s(171.0)} y={1220} size={70} color={M.blue}>on remplace…</Txt>
      </Scene>

      {/* 16 — result */}
      <Scene from={s(172.8)} to={MATHS_FRAMES} title="Le résultat">
        <SpinToken at={s(173.2)} x={540} y={520} size={260} />
        <Percent at={s(175.4)} y={930} />
        <Txt at={s(178.6)} y={1150} size={80}>de chance d'avoir</Txt>
        <Txt at={s(179.6)} y={1260} size={110} color={M.blue}>le token</Txt>
      </Scene>
    </>
  );
};

const Counter: React.FC<{ at: number; y: number }> = ({ at, y }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const n = Math.min(8, 1 + Math.floor((frame - at) / 6));
  return <Tex at={at} y={y} size={130} tex={`n = ${n}`} dur={8} />;
};

/* ---------- word-highlight captions ---------- */
type W = { t: string; s: number; e: number };
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / 30;
  const page = (captions as W[][]).find((p) => t >= p[0].s - 0.05 && t < p[p.length - 1].e + 0.25);
  if (!page) return null;
  const p = spring({ frame: frame - sec(page[0].s), fps, config: M.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1640, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", padding: "10px 28px",
        background: "rgba(0,0,0,0.6)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
        {page.map((w, i) => (
          <span key={i} style={{ fontFamily: M.body, fontWeight: 800, fontSize: 52, lineHeight: 1.35,
            color: t >= w.s && t < w.e + 0.1 ? M.pink : t >= w.s ? M.white : "rgba(255,255,255,0.45)" }}>{w.t}</span>
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
const SCENE_STARTS = [7.3, 11.8, 18.7, 29.3, 42.0, 47.7, 53.0, 71.3, 79.3, 104.1, 115.2, 126.3, 146.2, 166.5, 172.8];
const DINGS = [28.6, 66.0, 77.1, 103.3, 112.2, 145.1, 157.4, 165.2];

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("maths/voice.m4a")} />
    <Audio src={staticFile("sfx/bed185.wav")}
      volume={(f) => interpolate(f, [0, 15, MATHS_FRAMES - 60, MATHS_FRAMES - 5], [0, 0.06, 0.06, 0], clamp)} />
    <Sfx at={0} src="whoosh" v={0.4} />
    {SCENE_STARTS.map((t) => <Sfx key={`w${t}`} at={sec(t) - 2} src="swipe" />)}
    {DINGS.map((t) => <Sfx key={`d${t}`} at={sec(t)} src="ding" v={0.25} />)}
    <Sfx at={sec(68.4)} src="bass" v={0.4} />
    <Sfx at={sec(122.8)} src="bass" v={0.35} />
    {Array.from({ length: 12 }).map((_, i) => <Sfx key={`t${i}`} at={sec(175.4) + i * 2} src="tick" v={0.25} />)}
    <Sfx at={sec(175.4) + 28} src="pop" v={0.4} />
  </>
);

export const MathsEdit: React.FC = () => {
  useFontFaces([
    [M.display, "fonts/anton.woff2", "400"],
    [M.body, "fonts/inter-600.woff2", "600"],
    [M.body, "fonts/inter-800.woff2", "800"],
  ]);
  void S;
  return (
    <AbsoluteFill style={{ background: M.bg }}>
      <MathBg />
      <Scenes />
      <Captions />
      <Grain />
      <Vignette />
      <Sound />
    </AbsoluteFill>
  );
};
