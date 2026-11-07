// "كيفاش نديرو exposé؟" — the user's Instagram-story answer, edited with the talking-head method
// (pause cuts, punch-ins on phrase changes, Arabic captions, music bed + UI sounds). The tips are acted out
// full-screen by the illustrated characters in a bright classroom (src/expose/classroom.tsx).
import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Person, Sparkles } from "../pomme/world";
import { clamp, theme } from "../theme";
import { Bubble, Classroom, Confetti, Desk, Glasses, GradeSheet, K, Laptop, Slides, ease } from "./classroom";

const FPS = 30;
const AR: React.CSSProperties = { fontFamily: "Cairo, CairoLatin", direction: "rtl" };
const TITLE: React.CSSProperties = { fontFamily: "Lalezar, CairoLatin", direction: "rtl", lineHeight: 1.15 };

/* ---------- cut list (source seconds): the two dead pauses are removed ---------- */
const KEEP: [number, number][] = [[0, 2.25], [3.65, 18.45], [19.45, 33.85]];
const SEGS = (() => { let at = 0; return KEEP.map(([a, b]) => { const s = { a, b, at }; at += b - a; return s; }); })();
const OUTRO = 1.8;
export const EXPOSE_FRAMES = Math.round((SEGS[SEGS.length - 1].at + (33.85 - 19.45) + OUTRO) * FPS);
/** source seconds -> output frame */
const o = (t: number) => {
  for (const s of SEGS) { if (t < s.a) return Math.round(s.at * FPS); if (t <= s.b) return Math.round((s.at + t - s.a) * FPS); }
  return Math.round((SEGS[SEGS.length - 1].at + 33.85 - 19.45) * FPS);
};

/* ---------- captions (darija, Arabic script; source times) ---------- */
const CAPS: [number, number, string][] = [
  [0.0, 2.2, "على الـ exposés تاع البروفات"],
  [3.8, 5.1, "Généralement"], [5.2, 6.2, "لازم تتقسموا بيناتكم"], [6.2, 7.1, "ولا تكونوا حتى ثلاثة"], [7.1, 8.3, "باش ديرو الـ exposé تاعكم"],
  [8.5, 9.6, "كيفاش تديروا الـ exposé؟"], [9.7, 10.6, "وجدوا PowerPoint"], [10.6, 11.4, "ولا في Canva"], [11.4, 12.2, "كل واحد وكيفاش"],
  [12.2, 13.3, "أنا نصحكم plus sur Canva"], [13.3, 15.2, "خير وساهل كثر"], [15.3, 16.7, "كان يلزموكم PowerPoint"], [16.8, 18.4, "ديروا PowerPoint، ماشي مشكل"],
  [19.6, 21.3, "كي توجدوا الـ exposé تاعكم"], [21.3, 22.3, "وتوصلوا عند البروف"], [22.4, 23.0, "واحد يهدر"], [23.1, 24.5, "واحد يقلّب الـ PowerPoint"],
  [24.6, 25.3, "واحد يفهّم"], [25.4, 27.2, "تبادلوا ما بيناتكم"], [27.3, 28.5, "ديروا حاجة شابة"], [28.6, 30.3, "والبروف يعجبو الحال"],
  [30.4, 31.4, "ويمدّلكم عشرين"], [31.5, 33.4, "وهذي هي، ساهلة!"],
];

/* ---------- footage with punch-ins ---------- */
const Footage: React.FC = () => (
  <>
    {SEGS.map((s, i) => (
      <Sequence key={i} from={Math.round(s.at * FPS)} durationInFrames={Math.round((s.b - s.a) * FPS) + (i === SEGS.length - 1 ? Math.round(OUTRO * FPS) : 0)}>
        <Shot a={s.a} b={s.b} />
      </Sequence>
    ))}
  </>
);
const Shot: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const f = useCurrentFrame();
  const t = a + f / FPS;
  const idx = CAPS.findIndex(([s, e]) => t >= s && t < e + 0.15);
  const z = idx < 0 ? 1.04 : idx % 2 ? 1.14 : 1.0;
  const len = Math.round((b - a) * FPS);
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "540px 760px" }}>
      <OffthreadVideo src={staticFile("expose/src.mp4")} startFrom={Math.round(a * FPS)}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.1) contrast(1.04) brightness(1.03)" }}
        volume={(fr) => interpolate(fr, [0, 2, len - 3, len], [0, 1, 1, 0], clamp)} />
    </AbsoluteFill>
  );
};

/* ---------- full-screen scene wrapper: colourful circle wipe in, quick wipe out ---------- */
const Scene: React.FC<{ from: number; to: number; children: React.ReactNode; wipe?: string }> = ({ from, to, children, wipe = K.pink }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const t = f - from;
  const p = interpolate(t, [0, 10], [0, 1], { ...clamp, easing: theme.ease.out });
  const ring = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: theme.ease.out });
  const out = interpolate(f, [to - 7, to], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: wipe, clipPath: `circle(${ring * 160 * (1 - out)}% at 50% 50%)` }} />
      <AbsoluteFill style={{ clipPath: `circle(${Math.max(0, p * 150 - 6) * (1 - out)}% at 50% 50%)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const useIn = (at: number, dy = 40) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = f < at ? 0 : spring({ frame: f - at, fps, config: theme.spring.bouncy });
  return { p, style: { opacity: Math.min(1, p * 1.8), transform: `translateY(${(1 - p) * dy}px) scale(${0.85 + 0.15 * p})` } as React.CSSProperties };
};
const Sticker: React.FC<{ at: number; x: number; y: number; bg: string; color?: string; size?: number; rot?: number; children: React.ReactNode }> = ({
  at, x, y, bg, color = K.white, size = 70, rot = -3, children,
}) => {
  const { p } = useIn(at);
  if (p === 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot + (1 - p) * 12}deg) scale(${p})`,
      background: bg, color, ...TITLE, fontSize: size, padding: `0 ${size * 0.4}px ${size * 0.12}px`, borderRadius: size * 0.32, border: "6px solid #fff",
      boxShadow: `0 10px 0 rgba(0,0,0,0.15), 0 0 30px ${bg}66`, whiteSpace: "nowrap" }}>{children}</div>
  );
};
const Step: React.FC<{ at: number; n: string; text: string; bg: string }> = ({ at, n, text, bg }) => (
  <Sticker at={at} x={540} y={130} bg={bg} size={58} rot={-2}><span style={{ unicodeBidi: "isolate" }}>{n}</span> · {text}</Sticker>
);

/* ---------- the scenes (source seconds) ---------- */
const Scenes: React.FC = () => {
  const f = useCurrentFrame();
  const FEET = 1500;
  const wave = (k = 0) => -150 + Math.sin(f / 4 + k) * 22;

  // 1 — hook: three students puzzled in front of the board
  const H0 = 0, H1 = o(2.25) - 1;
  // 2 — group: three students walk in and team up
  const G0 = o(6.3), G1 = o(8.35);
  const gx = (from: number, to: number, d: number) => ease(f, G0 + d, G0 + 18 + d, from, to);
  // 3 — preparing slides
  const P0 = o(9.6), P1 = o(13.25);
  // 4 — easier
  const E0 = o(13.3), E1 = o(15.2);
  // 5 — PowerPoint is fine too
  const Q0 = o(16.75), Q1 = o(18.45);
  // 6 — presenting in front of the professor
  const R0 = o(22.3), R1 = o(25.35), r1 = o(22.4), r2 = o(23.1), r3 = o(24.6);
  // 7 — swap roles
  const S0 = o(25.35), S1 = o(27.25);
  // 8 — the grade
  const T0 = o(30.3), T1 = o(33.85);
  const slidePage = f < r2 ? 0 : Math.floor((f - r2) / 20) + 1;
  const jump = (at: number, k = 0) => (f >= at ? Math.abs(Math.sin((f - at) / 6 + k)) * 70 : 0);

  return (
    <>
      <Scene from={H0} to={H1} wipe={K.blue}>
        <Classroom boardText="exposé ?" />
        <Person x={250} feet={FEET} shirt={K.pink} hair="#3B2416" scale={1.15} armR={-120} face={1} />
        <Person x={540} feet={FEET + 30} shirt={K.blue} hair="#1B1530" skin="#C98A62" scale={1.15} armR={-8} armL={130} face={0} />
        <Person x={830} feet={FEET} shirt={K.yellow} hair="#6B3A1E" scale={1.15} armR={-8} face={-1} />
        {[250, 540, 830].map((x, i) => <Bubble key={x} at={4 + i * 5} x={x} y={975} color={[K.white, K.yellow, K.white][i]}>؟</Bubble>)}
        <Sticker at={8} x={540} y={720} bg={K.purple} size={96} rot={-3}>كيفاش نديرو exposé؟</Sticker>
      </Scene>

      <Scene from={G0} to={G1} wipe={K.yellow}>
        <Classroom boardText="الفوج" />
        <Step at={G0 + 4} n="01" text="الفوج" bg={K.blue} />
        <Person x={gx(-200, 300, 0)} feet={FEET} shirt={K.pink} hair="#3B2416" scale={1.15} walk={f < G0 + 18 ? 1 : 0} armR={f > G0 + 22 ? wave() : -8} face={1} />
        <Person x={gx(1280, 780, 3)} feet={FEET} shirt={K.blue} hair="#1B1530" skin="#C98A62" scale={1.15} walk={f < G0 + 21 ? 1 : 0} armL={f > G0 + 22 ? 150 + Math.sin(f / 4) * 22 : -8} face={-1} />
        <Person x={540} feet={FEET + 40 - (f < o(6.8) ? 0 : jump(o(6.8)))} shirt={K.green} hair="#6B3A1E" scale={(f < o(6.8) ? 0 : Math.min(1, (f - o(6.8)) / 8)) * 1.15} armR={wave(1)} armL={150} face={0} />
        <Sticker at={o(6.8) + 6} x={540} y={760} bg={K.yellow} color={K.ink} size={110} rot={3}>2 ولا 3</Sticker>
        <Sparkles at={o(6.8)} x={540} y={1050} color={K.yellow} />
      </Scene>

      <Scene from={P0} to={P1} wipe={K.purple}>
        <Classroom boardText="التحضير" />
        <Step at={P0 + 4} n="02" text="التحضير" bg={K.purple} />
        <Desk x={540} y={1240} />
        <Laptop x={540} y={900}>
          {f < o(11.0) ? <Slides at={o(9.9)} color={K.blue} /> : <Slides at={o(11.0)} page={1} color={K.purple} />}
        </Laptop>
        <Person x={170} feet={FEET + 30} shirt={K.pink} hair="#3B2416" scale={1.1} armR={-70} face={1} />
        <Sticker at={o(9.9)} x={300} y={600} bg="#E8692F" size={64} rot={-5}>PowerPoint</Sticker>
        <Sticker at={o(11.0)} x={780} y={600} bg={K.purple} size={64} rot={5}>Canva</Sticker>
        <Sticker at={o(12.7)} x={780} y={760} bg={K.green} size={56} rot={-3}>نصيحتي</Sticker>
      </Scene>

      <Scene from={E0} to={E1} wipe={K.green}>
        <Classroom boardText="ساهل!" />
        <Desk x={540} y={1240} />
        <Laptop x={540} y={900}><Slides at={E0} page={1} color={K.purple} /></Laptop>
        <Person x={170} feet={FEET + 30 - jump(E0 + 4)} shirt={K.pink} hair="#3B2416" scale={1.1} armR={wave()} armL={150} face={1} />
        <Sticker at={E0 + 3} x={540} y={700} bg={K.green} size={120} rot={-3}>خير وساهل كثر</Sticker>
        <Sparkles at={E0 + 8} x={540} y={700} color={K.yellow} />
      </Scene>

      <Scene from={Q0} to={Q1} wipe="#E8692F">
        <Classroom boardText="PowerPoint" />
        <Desk x={540} y={1240} />
        <Laptop x={540} y={900}><Slides at={Q0} color={K.blue} /></Laptop>
        <Person x={910} feet={FEET + 30} shirt={K.blue} hair="#1B1530" skin="#C98A62" scale={1.1} armR={-8} armL={f > o(17.9) ? 150 : -8} face={-1} />
        <Sticker at={o(17.9)} x={540} y={720} bg={K.green} size={96} rot={3}>ماشي مشكل</Sticker>
      </Scene>

      <Scene from={R0} to={R1} wipe={K.pink}>
        <Classroom screen={<Slides at={r2} page={slidePage} color={[K.blue, K.pink, K.green, K.purple][slidePage % 4]} key={slidePage} />} />
        <Step at={R0 + 4} n="03" text="قدّام البروف" bg={K.pink} />
        {/* professor at his desk, bottom right */}
        <Desk x={880} y={1500} w={360} />
        <Person x={880} feet={1500} shirt="#7A8BA6" hair="#9AA0A8" scale={0.95} armR={-8} face={-1} />
        <Glasses x={880} feet={1500} scale={0.95} />
        {/* the three students */}
        <Person x={170} feet={FEET - 60} shirt={K.pink} hair="#3B2416" scale={1.0} armR={f >= r1 ? -100 + Math.sin(f / 3) * 25 : -8} face={1} />
        <Person x={380} feet={FEET - 60} shirt={K.blue} hair="#1B1530" skin="#C98A62" scale={1.0} armR={f >= r2 ? -60 : -8} face={1} />
        <Person x={600} feet={FEET - 60} shirt={K.yellow} hair="#6B3A1E" scale={1.0} armR={f >= r3 ? -150 : -8} face={1} />
        <Bubble at={r1} x={170} y={980}>يهدر</Bubble>
        <Bubble at={r2} x={390} y={860} color={K.yellow}>يقلّب</Bubble>
        <Bubble at={r3} x={610} y={980} color="#D7FFE9">يفهّم</Bubble>
      </Scene>

      <Scene from={S0} to={S1} wipe={K.yellow}>
        <Classroom boardText="تبادلوا!" />
        {[0, 1, 2].map((i) => {
          const a = ((i * 120 + (f - S0) * 6) * Math.PI) / 180;
          const x = 540 + Math.sin(a) * 300, depth = Math.cos(a);
          return <div key={i} style={{ position: "absolute", inset: 0, zIndex: Math.round(depth * 10) + 10 }}>
            <Person x={x} feet={FEET + depth * 60} shirt={[K.pink, K.blue, K.yellow][i]} hair={["#3B2416", "#1B1530", "#6B3A1E"][i]} skin={i === 1 ? "#C98A62" : undefined}
              scale={1.0 + depth * 0.12} walk={1} armR={-8} face={Math.sin(a) > 0 ? -1 : 1} />
          </div>;
        })}
        <Sticker at={S0 + 4} x={540} y={760} bg={K.pink} size={110} rot={-3}>تبادلوا الأدوار</Sticker>
      </Scene>

      <Scene from={T0} to={T1} wipe={K.green}>
        <Classroom boardText="bravo!" />
        <Person x={790} feet={FEET} shirt="#7A8BA6" hair="#9AA0A8" scale={1.1} armR={-120} face={-1} />
        <Glasses x={790} feet={FEET} scale={1.1} />
        <GradeSheet at={o(30.5)} x={600} y={820} />
        {[[150, K.pink, "#3B2416"], [320, K.blue, "#1B1530"], [490, K.yellow, "#6B3A1E"]].map(([x, sh, h], i) => (
          <Person key={i} x={x as number} feet={FEET + 120 - jump(o(31.2), i)} shirt={sh as string} hair={h as string} skin={i === 1 ? "#C98A62" : undefined}
            scale={0.95} armR={f >= o(31.2) ? wave(i) : -8} armL={f >= o(31.2) ? 150 : -8} face={1} />
        ))}
        <Confetti at={o(31.2)} />
        <Sticker at={o(32.4)} x={540} y={350} bg={K.yellow} color={K.ink} size={110} rot={3}>ساهلة!</Sticker>
      </Scene>

      <Scene from={T1} to={EXPOSE_FRAMES} wipe={K.purple}>
        <Classroom boardText="بالتوفيق!" />
        {[[250, K.pink, "#3B2416"], [540, K.blue, "#1B1530"], [830, K.yellow, "#6B3A1E"]].map(([x, sh, h], i) => (
          <Person key={i} x={x as number} feet={FEET} shirt={sh as string} hair={h as string} skin={i === 1 ? "#C98A62" : undefined} scale={1.1} armR={wave(i)} face={0} />
        ))}
        <Sticker at={T1 + 4} x={540} y={800} bg={K.purple} size={100} rot={-3}>بالتوفيق في الـ exposé!</Sticker>
      </Scene>
    </>
  );
};

/* ---------- captions: white on a colourful pill ---------- */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cur = CAPS.find(([a, b]) => f >= o(a) && f < o(b) + 4);
  if (!cur) return null;
  const [a, b, text] = cur;
  const A = o(a), B = o(b);
  const words = text.split(" ");
  const p = spring({ frame: f - A, fps, config: theme.spring.snappy });
  const active = Math.min(words.length - 1, Math.floor(((f - A) / Math.max(1, B - A)) * words.length));
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1640, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 20px", direction: "rtl", padding: "4px 34px 12px",
        background: K.blue, borderRadius: 28, border: "5px solid #fff", boxShadow: "0 10px 0 rgba(0,0,0,0.15)" }}>
        {words.map((w, i) => (
          <span key={i} style={{ ...AR, fontWeight: 900, fontSize: 66, lineHeight: 1.5, unicodeBidi: "isolate", color: i === active ? K.yellow : "#fff" }}>{w}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- sound ---------- */
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.32 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);
const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("sfx/bed36.wav")} volume={(fr) => interpolate(fr, [0, 12, EXPOSE_FRAMES - 60, EXPOSE_FRAMES - 45, EXPOSE_FRAMES - 3], [0, 0.07, 0.07, 0.22, 0], clamp)} />
    {[0, o(6.3), o(9.6), o(13.3), o(16.75), o(22.3), o(25.35), o(30.3), o(33.85)].map((t) => <Sfx key={`w${t}`} at={t - 2} src="whoosh" v={0.3} />)}
    {[4, 9, 14, o(6.8), o(6.8) + 6, o(9.9), o(11.0), o(12.7), o(22.4), o(23.1), o(24.6), o(32.4)].map((t) => <Sfx key={`p${t}`} at={t - 1} src="pop" v={0.26} />)}
    {[o(13.3) + 3, o(17.9), o(31.2)].map((t) => <Sfx key={`d${t}`} at={t} src="ding" v={0.3} />)}
    {Array.from({ length: 10 }).map((_, i) => <Sfx key={`t${i}`} at={o(30.5) + 6 + i * 2} src="tick" v={0.22} />)}
  </>
);

export const ExposeEdit: React.FC = () => {
  useFontFaces([
    ["Lalezar", "fonts/lalezar-arabic-400-normal.woff2", "400"],
    ["Cairo", "fonts/cairo-arabic-800-normal.woff2", "800"],
    ["Cairo", "fonts/cairo-arabic-900-normal.woff2", "900"],
    ["CairoLatin", "fonts/cairo-latin-800-normal.woff2", "800"],
    ["CairoLatin", "fonts/cairo-latin-900-normal.woff2", "900"],
  ]);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: K.wall }}>
      <Footage />
      <Scenes />
      <Captions />
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [EXPOSE_FRAMES - 8, EXPOSE_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
