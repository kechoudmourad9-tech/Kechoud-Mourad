// "وسائل الإعلام والاتصال : الإيجابيات والسلبيات" — Arabic explainer, narrated by the user (first draft used Piper ar_JO-kareem).
// Same kit as the pomme / ensembles videos (characters, stickers, wipes, captions, SFX); new backgrounds for this video only.
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { clamp } from "../theme";
import { Arrow, Scene, sec } from "../maths/kit";
import words from "./medias-words.json";
import { Balance, C2, CityBg, HandPhone, Icon, IconName, NetBg } from "./medias-world";
import { P, Person, PersonPose, Sparkles, handR } from "./world";

type Line = { s: number; e: number; w: { t: string; s: number; e: number }[] };
const L = words as Record<string, Line>;
/** start time (s) of word i of a script line */
const W = (k: string, i = 0) => L[k].w[Math.min(i, L[k].w.length - 1)].s;
const f30 = (t: number) => sec(t);
export const MEDIAS_FRAMES = sec(L.fin2.e + 3.2);

/* ---------- Arabic sticker ---------- */
const ArSticker: React.FC<{ at: number; x: number; y: number; bg: string; color?: string; size?: number; rot?: number; until?: number;
  children: React.ReactNode }> = ({ at, x, y, bg, color = "#fff", size = 80, rot = -3, until, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || (until !== undefined && f >= until)) return null;
  const p = spring({ frame: f - at, fps, config: P.spring.bouncy });
  const o = until !== undefined ? interpolate(f, [until - 7, until], [1, 0], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot + (1 - p) * 12}deg) scale(${p})`,
      opacity: o, background: bg, color, fontFamily: "Lalezar", fontSize: size, direction: "rtl", whiteSpace: "nowrap",
      padding: `${size * 0.02}px ${size * 0.38}px ${size * 0.14}px`, borderRadius: size * 0.3, border: "6px solid #fff",
      boxShadow: `0 10px 0 rgba(0,0,0,0.22), 0 0 40px ${bg}88`, lineHeight: 1.35 }}>
      {children}
    </div>
  );
};

/* numbered point title (١ ٢ ٣ ٤) */
const Point: React.FC<{ at: number; until: number; n: string; text: string; color: string; y?: number }> = ({ at, until, n, text, color, y = 1250 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f >= until) return null;
  const p = spring({ frame: f - at, fps, config: P.spring.snappy });
  const o = interpolate(f, [until - 7, until], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", flexDirection: "row-reverse", alignItems: "center",
      justifyContent: "center", gap: 24, opacity: Math.min(1, p * 2) * o, transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ width: 110, height: 110, borderRadius: 55, background: color, color: C2.navy, fontFamily: "Lalezar", fontSize: 80,
        display: "flex", alignItems: "center", justifyContent: "center", border: "6px solid #fff", flexShrink: 0, paddingTop: 10 }}>{n}</div>
      <div style={{ fontFamily: "Lalezar", fontSize: 84, color: "#fff", direction: "rtl", lineHeight: 1.25, textAlign: "right",
        textShadow: `0 0 30px ${color}AA` }}>{text}</div>
    </div>
  );
};

/* progress ticks / crosses for the 4 points */
const Tally: React.FC<{ from: number; times: number[]; good: boolean }> = ({ times, good }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = good ? C2.green : C2.red;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1480, display: "flex", flexDirection: "row-reverse", justifyContent: "center", gap: 28 }}>
      {times.map((t, i) => {
        const p = f >= t ? spring({ frame: f - t, fps, config: P.spring.bouncy }) : 0;
        return (
          <div key={i} style={{ width: 84, height: 84, borderRadius: 22, border: `5px solid ${p > 0 ? c : "rgba(255,255,255,0.3)"}`,
            background: p > 0 ? `${c}33` : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width={56} height={56} style={{ transform: `scale(${p})` }}>
              {good ? <path d="M5 12.5 L10 17 L19 7" stroke={c} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M6 6 L18 18 M18 6 L6 18" stroke={c} strokeWidth={3.4} strokeLinecap="round" />}
            </svg>
          </div>
        );
      })}
    </div>
  );
};

const PersonWithPhone: React.FC<PersonPose & { phone?: boolean; glow?: string }> = ({ phone = true, glow, ...pose }) => {
  const [hx, hy] = handR(pose);
  return (
    <>
      <Person {...pose} />
      {phone && <HandPhone x={hx} y={hy} size={78 * (pose.scale ?? 1)} glow={glow} />}
    </>
  );
};

/* ---------- 1. hook (city) ---------- */
const Hook: React.FC = () => (
  <AbsoluteFill>
    <CityBg />
    <PersonWithPhone x={270} feet={1560} shirt={P.pink} hair="#3B2416" scale={1.3} armR={-55} face={1} label="A" labelColor={P.pink} />
    <PersonWithPhone x={820} feet={1560} shirt={P.blue} hair="#1B1530" skin={P.skin2} scale={1.3} armR={-55} face={-1} label="B" labelColor={P.blue} glow={P.pink} />
    <ArSticker at={f30(W("hook", 0))} x={540} y={330} bg={P.purple} size={92} rot={-3}>وسائل الإعلام</ArSticker>
    <ArSticker at={f30(W("hook", 2))} x={540} y={490} bg={P.blue} size={92} rot={2}>والاتصال</ArSticker>
    <ArSticker at={f30(W("hook", 10))} x={750} y={700} bg={C2.green} color={C2.navy} size={96} rot={6}>نعمة</ArSticker>
    <ArSticker at={f30(W("hook", 11))} x={540} y={700} bg="#ffffff00" size={80} rot={0}>أم</ArSticker>
    <ArSticker at={f30(W("hook", 12))} x={330} y={700} bg={C2.red} size={96} rot={-6}>نقمة؟</ArSticker>
  </AbsoluteFill>
);

/* ---------- 2. definition (network board) ---------- */
const Definition: React.FC = () => {
  const f = useCurrentFrame();
  const msgs = [0, 1, 2, 3, 4].map((i) => f30(W("def1", 7)) + i * 9);
  const items: [IconName, string, string, number][] = [
    ["tv", "التلفاز", P.pink, W("def2", 1)], ["radio", "الراديو", P.orange, W("def2", 2)], ["news", "الجرائد", P.purple, W("def2", 3)],
    ["phone", "الهاتف", P.blue, W("def2", 4)], ["web", "الإنترنت", "#16B6C9", W("def2", 5)], ["social", "التواصل الاجتماعي", C2.red, W("def2", 6)],
  ];
  const showDef = f < f30(W("def2", 0)) + 6;
  return (
    <>
      <ArSticker at={f30(L.def1.s)} until={f30(W("def2", 0)) + 6} x={540} y={330} bg={P.purple} size={84}>ما هي؟</ArSticker>
      {showDef && <>
        <PersonWithPhone x={230} feet={1180} shirt={P.pink} hair="#3B2416" scale={1.0} armR={-60} face={1} />
        <PersonWithPhone x={850} feet={1180} shirt={P.blue} hair="#1B1530" skin={P.skin2} scale={1.0} armR={-60} face={-1} glow={P.pink} />
        {msgs.map((m, i) => {
          if (f < m) return null;
          const t = ((f - m) % 40) / 40;
          const dir = i % 2 ? -1 : 1;
          const x = dir > 0 ? 300 + t * 480 : 780 - t * 480;
          return <div key={i} style={{ position: "absolute", left: x - 40, top: 760 - Math.sin(Math.PI * t) * 160, width: 80, height: 58, borderRadius: 18,
            background: dir > 0 ? P.pink : P.blue, border: "4px solid #fff", opacity: 1 - Math.abs(t - 0.5) * 0.6 }} />;
        })}
        <ArSticker at={f30(W("def1", 8))} x={540} y={1330} bg={P.orange} size={64} rot={-2}>الأخبار والمعلومات</ArSticker>
        <ArSticker at={f30(W("def1", 11))} x={540} y={1480} bg={P.blue} size={64} rot={2}>التواصل مع الآخرين</ArSticker>
      </>}
      {items.map(([n, label, bg, t], i) => (
        <Icon key={n} name={n} at={f30(t) - 3} x={[790, 540, 290][i % 3]} y={620 + Math.floor(i / 3) * 520} size={200} bg={bg} label={label} />
      ))}
    </>
  );
};

/* ---------- 3. positives ---------- */
const Positives: React.FC = () => {
  const f = useCurrentFrame();
  const P1 = f30(L.pos1.s), P2 = f30(L.pos2.s), P3 = f30(L.pos3.s), P4 = f30(L.pos4.s), END = f30(L.pos4.e + 0.6);
  const ticks = [P1 + 8, P2 + 8, P3 + 8, P4 + 8];
  return (
    <>
      <ArSticker at={f30(L.pos0.s)} until={P1 + 2} x={540} y={820} bg={C2.green} color={C2.navy} size={150} rot={-3}>الإيجابيات</ArSticker>
      <Sparkles at={f30(L.pos0.s) + 4} x={540} y={820} color={C2.green} />
      {/* 1 — fast news from everywhere */}
      {f >= P1 && f < P2 && <>
        <Icon name="globe" at={P1} x={540} y={640} size={300} bg="#16B6C9" spin />
        {[0, 1, 2, 3].map((i) => {
          const t = ((f - P1 - i * 8) % 30) / 30;
          return f - P1 > i * 8 ? <div key={i} style={{ position: "absolute", left: 540 + Math.cos(i * 1.7) * (180 + t * 300) - 40,
            top: 640 + Math.sin(i * 1.7) * (180 + t * 300) - 30, opacity: 1 - t }}>
            <svg width={80} height={60} viewBox="0 0 80 60"><rect x={2} y={2} width={76} height={56} rx={8} fill="#fff" /><rect x={10} y={10} width={24} height={18} fill={P.pink} /><path d="M40 14 H70 M40 26 H70 M10 40 H70" stroke={C2.navy} strokeWidth={5} /></svg>
          </div> : null;
        })}
      </>}
      <Point at={P1} until={P2} n="١" text="أخبار سريعة من كل العالم" color={C2.green} />
      {/* 2 — distance shrinks */}
      {f >= P2 && f < P3 && (() => {
        const close = interpolate(f, [f30(W("pos2", 1)), f30(W("pos2", 2)) + 15], [0, 1], { ...clamp, easing: P.ease.inOut });
        return <>
          <PersonWithPhone x={160 + close * 140} feet={1080} shirt={P.pink} hair="#3B2416" scale={0.95} armR={-60} face={1} />
          <PersonWithPhone x={920 - close * 140} feet={1080} shirt={P.orange} hair="#6B3A1E" scale={0.95} armR={-60} face={-1} glow={P.pink} />
          <Arrow at={f30(W("pos2", 3))} from={[330 + close * 100, 700]} to={[750 - close * 100, 700]} bend={-0.3} color={C2.green} width={9} />
          <Icon name="heart" at={f30(W("pos2", 6))} x={540} y={520} size={130} bg={C2.red} />
        </>;
      })()}
      <Point at={P2} until={P3} n="٢" text="تقريب المسافات" color={C2.green} />
      {/* 3 — learning */}
      {f >= P3 && f < P4 && <>
        <Icon name="cap" at={f30(W("pos3", 4)) - 3} x={540} y={520} size={210} bg={P.purple} />
        <Icon name="book" at={f30(W("pos3", 5))} x={800} y={820} size={190} bg={P.orange} label="الدروس" />
        <Icon name="play" at={f30(W("pos3", 6))} x={540} y={850} size={190} bg={C2.red} label="الفيديوهات" />
        <Icon name="phone" at={f30(W("pos3", 7))} x={280} y={820} size={190} bg={P.blue} label="الكتب الرقمية" />
      </>}
      <Point at={P3} until={P4} n="٣" text="وسيلة رائعة للتعلّم" color={C2.green} />
      {/* 4 — work, trade, fun */}
      {f >= P4 && f < END && <>
        <Icon name="work" at={f30(W("pos4", 3)) - 3} x={800} y={700} size={200} bg={P.blue} label="العمل" />
        <Icon name="cart" at={f30(W("pos4", 4)) - 3} x={540} y={700} size={200} bg={P.orange} label="التجارة" />
        <Icon name="game" at={f30(W("pos4", 5)) - 3} x={280} y={700} size={200} bg={P.purple} label="الترفيه" />
      </>}
      <Point at={P4} until={END} n="٤" text="أبواب العمل والتجارة والترفيه" color={C2.green} />
      {f >= P1 && f < END && <Tally from={P1} times={ticks} good />}
    </>
  );
};

/* ---------- 4. negatives ---------- */
const Negatives: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const N1 = f30(L.neg1.s), N2 = f30(L.neg2.s), N3 = f30(L.neg3.s), N4 = f30(L.neg4.s), END = f30(L.neg4.e + 0.6);
  const stamp = spring({ frame: f - f30(W("neg1", 3)), fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  return (
    <>
      <ArSticker at={f30(L.neg0.s)} until={N1 + 2} x={540} y={820} bg={C2.red} size={150} rot={3}>السلبيات</ArSticker>
      {/* 1 — fake news */}
      {f >= N1 && f < N2 && <>
        <Icon name="news" at={N1} x={540} y={680} size={330} bg="#5B6178" />
        {f >= f30(W("neg1", 3)) && <div style={{ position: "absolute", left: 540, top: 690, transform: `translate(-50%,-50%) rotate(-12deg) scale(${interpolate(stamp, [0, 1], [2.4, 1])})`,
          opacity: Math.min(1, stamp * 2), border: `9px solid ${C2.red}`, borderRadius: 20, padding: "0 34px 10px", fontFamily: "Lalezar", fontSize: 110,
          color: C2.red, background: "rgba(7,11,36,0.75)", direction: "rtl", boxShadow: `0 0 40px ${C2.red}88` }}>كاذب!</div>}
      </>}
      <Point at={N1} until={N2} n="١" text="الأخبار الكاذبة والإشاعات" color={C2.red} />
      {/* 2 — addiction: the clock races */}
      {f >= N2 && f < N3 && <>
        <Icon name="phone" at={N2} x={360} y={680} size={260} bg={P.blue} />
        <div style={{ position: "absolute", left: 600, top: 540, width: 280, height: 280 }}>
          <svg viewBox="0 0 100 100" width={280} height={280}>
            <circle cx={50} cy={50} r={44} fill="#fff" stroke={C2.red} strokeWidth={6} />
            <path d={`M50 50 L ${50 + 30 * Math.sin((f - N2) / 2)} ${50 - 30 * Math.cos((f - N2) / 2)}`} stroke={C2.navy} strokeWidth={5} strokeLinecap="round" />
            <path d={`M50 50 L ${50 + 20 * Math.sin((f - N2) / 24)} ${50 - 20 * Math.cos((f - N2) / 24)}`} stroke={C2.red} strokeWidth={6} strokeLinecap="round" />
          </svg>
        </div>
        <ArSticker at={f30(W("neg2", 3))} x={740} y={920} bg={C2.red} size={60} rot={4}>ساعات طويلة</ArSticker>
      </>}
      <Point at={N2} until={N3} n="٢" text="الإدمان" color={C2.red} />
      {/* 3 — isolation: together but each on their phone */}
      {f >= N3 && f < N4 && <>
        {[[230, P.pink, "#3B2416", P.skin], [540, P.orange, "#6B3A1E", P.skin2], [850, P.blue, "#1B1530", P.skin]].map(([x, sh, h, sk], i) => (
          <PersonWithPhone key={i} x={x as number} feet={1120} shirt={sh as string} hair={h as string} skin={sk as string} scale={0.9} armR={-60} face={0} />
        ))}
        {[385, 695].map((x) => <div key={x} style={{ position: "absolute", left: x - 6, top: 640, width: 12, height: 480, borderRadius: 6,
          background: `repeating-linear-gradient(180deg, ${C2.red} 0 22px, transparent 22px 40px)`, opacity: interpolate(f, [f30(W("neg3", 7)), f30(W("neg3", 7)) + 10], [0, 1], clamp) }} />)}
      </>}
      <Point at={N3} until={N4} n="٣" text="العزلة" color={C2.red} />
      {/* 4 — privacy & health */}
      {f >= N4 && f < END && <>
        <Icon name="lock" at={f30(W("neg4", 2)) - 3} x={330} y={680} size={240} bg={P.purple} label="الخصوصية" />
        <Icon name="eye" at={f30(W("neg4", 6)) - 3} x={750} y={620} size={190} bg={P.orange} label="العيون" />
        <Icon name="clock" at={f30(W("neg4", 7)) - 3} x={750} y={960} size={150} bg={P.blue} label="النوم" />
      </>}
      <Point at={N4} until={END} n="٤" text="الخصوصية والصحة" color={C2.red} />
      {f >= N1 && f < END && <Tally from={N1} times={[N1 + 8, N2 + 8, N3 + 8, N4 + 8]} good={false} />}
    </>
  );
};

/* ---------- 5. conclusion ---------- */
const Conclusion: React.FC = () => (
  <>
    <Balance at={f30(L.fin1.s)} y={620} />
    <ArSticker at={f30(W("fin1", 4))} x={540} y={1330} bg={P.purple} size={100} rot={-3}>سلاح ذو حدّين</ArSticker>
  </>
);

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const wave = Math.sin(f / 4) * 25;
  const down = f >= f30(W("fin2", 1));
  return (
    <AbsoluteFill>
      <CityBg />
      <PersonWithPhone x={270} feet={1560} shirt={P.pink} hair="#3B2416" scale={1.3} armR={down ? -150 + wave : -55} face={1} label="A" labelColor={P.pink} phone={!down} />
      <PersonWithPhone x={820} feet={1560} shirt={P.blue} hair="#1B1530" skin={P.skin2} scale={1.3} armR={-8} armL={down ? 150 + wave : -8} face={-1} label="B" labelColor={P.blue} phone={!down} />
      <ArSticker at={f30(W("fin2", 0))} x={540} y={380} bg={C2.green} color={C2.navy} size={110} rot={-3}>استعملها بحكمة</ArSticker>
      <ArSticker at={f30(W("fin2", 3))} x={720} y={600} bg={C2.green} color={C2.navy} size={60} rot={4}>+ إيجابياتها</ArSticker>
      <ArSticker at={f30(W("fin2", 5))} x={360} y={720} bg={C2.red} size={60} rot={-4}>− سلبياتها</ArSticker>
      <Sparkles at={f30(W("fin2", 1))} x={540} y={380} color={C2.green} />
    </AbsoluteFill>
  );
};

/* ---------- captions (Arabic, RTL) ---------- */
const PAGES = Object.values(L).flatMap((l) => {
  const out: Line["w"][] = [];
  let cur: Line["w"] = [];
  l.w.forEach((w) => { cur.push(w); if (cur.length >= 4 || /[،.؟:]$/.test(w.t)) { out.push(cur); cur = []; } });
  if (cur.length) out.push(cur);
  return out;
});
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / 30;
  const page = PAGES.find((p, i) => t >= p[0].s - 0.05 && t < (PAGES[i + 1]?.[0].s ?? p[p.length - 1].e + 0.4));
  if (!page || t > page[page.length - 1].e + 0.5) return null;
  const p = spring({ frame: frame - sec(page[0].s), fps, config: P.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1660, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px", padding: "4px 30px 10px", direction: "rtl",
        background: "rgba(7,11,36,0.82)", borderRadius: 22, border: "3px solid rgba(255,255,255,0.9)" }}>
        {page.map((w, i) => (
          <span key={i} style={{ fontFamily: "Cairo", fontWeight: 900, fontSize: 60, lineHeight: 1.6,
            color: t >= w.s && t < w.e + 0.12 ? P.yellow : t >= w.s ? "#fff" : "rgba(255,255,255,0.5)" }}>{w.t}</span>
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
const Sound: React.FC = () => {
  const whoosh = [L.def1.s, L.pos0.s, L.neg0.s, L.fin1.s, L.fin2.s];
  const dings = [L.pos1.s, L.pos2.s, L.pos3.s, L.pos4.s];
  const buzz = [L.neg1.s, L.neg2.s, L.neg3.s, L.neg4.s];
  const pops = [W("hook", 0), W("hook", 2), W("hook", 10), W("hook", 12), ...[1, 2, 3, 4, 5, 6].map((i) => W("def2", i)), W("pos3", 5), W("pos3", 6),
    W("pos3", 7), W("pos4", 3), W("pos4", 4), W("pos4", 5), W("neg4", 2), W("neg4", 6), W("fin1", 4), W("fin2", 0)];
  return (
    <>
      <Audio src={staticFile("pomme/voice-medias-real.m4a")} />
      <Audio src={staticFile("sfx/bed104.wav")} volume={(f) => interpolate(f, [0, 15, MEDIAS_FRAMES - 70, MEDIAS_FRAMES - 50, MEDIAS_FRAMES - 3], [0, 0.07, 0.07, 0.22, 0], clamp)} />
      {whoosh.map((t) => <Sfx key={`w${t}`} at={sec(t) - 3} src="whoosh" v={0.35} />)}
      {dings.map((t) => <Sfx key={`d${t}`} at={sec(t) + 8} src="ding" v={0.28} />)}
      {buzz.map((t) => <Sfx key={`b${t}`} at={sec(t) + 8} src="bass" v={0.3} />)}
      {pops.map((t) => <Sfx key={`p${t}`} at={sec(t) - 2} src="pop" v={0.26} />)}
      <Sfx at={sec(W("neg1", 3))} src="bass" v={0.4} />
    </>
  );
};

export const MediasEdit: React.FC = () => {
  useFontFaces([
    ["Lalezar", "fonts/lalezar-arabic-400-normal.woff2", "400"],
    ["Cairo", "fonts/cairo-arabic-800-normal.woff2", "800"],
    ["Cairo", "fonts/cairo-arabic-900-normal.woff2", "900"],
    ["CairoLatin", "fonts/cairo-latin-800-normal.woff2", "800"],
    ["Anton", "fonts/anton.woff2", "400"],
  ]);
  const f = useCurrentFrame();
  const D = f30(L.def1.s - 0.2), POS = f30(L.pos0.s - 0.3), NEG = f30(L.neg0.s - 0.3), FIN = f30(L.fin1.s - 0.3), OUT = f30(L.fin2.s - 0.2);
  return (
    <AbsoluteFill style={{ background: C2.navy }}>
      {f < D && <Hook />}
      {f >= D && f < POS && <NetBg />}
      {f >= POS && f < NEG && <NetBg accent={C2.green} />}
      {f >= NEG && f < FIN && <NetBg accent={C2.red} />}
      {f >= FIN && f < OUT && <NetBg accent={P.purple} />}
      <Scene from={D} to={POS} n="١" title={<span style={{ fontFamily: "Cairo", direction: "rtl" }}>تعريف</span>}><Definition /></Scene>
      <Scene from={POS} to={NEG} n="٢" title={<span style={{ fontFamily: "Cairo", direction: "rtl" }}>الإيجابيات</span>}><Positives /></Scene>
      <Scene from={NEG} to={FIN} n="٣" title={<span style={{ fontFamily: "Cairo", direction: "rtl" }}>السلبيات</span>}><Negatives /></Scene>
      <Scene from={FIN} to={OUT} n="٤" title={<span style={{ fontFamily: "Cairo", direction: "rtl" }}>الخلاصة</span>}><Conclusion /></Scene>
      {f >= OUT && <Outro />}
      <Captions />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [MEDIAS_FRAMES - 10, MEDIAS_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
