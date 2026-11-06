import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { clamp } from "../theme";
import { house } from "./theme";
import { SEGS, TOTAL, originOf, out, zoomOf } from "./timeline";

const C = house.colors;
const AR: React.CSSProperties = { fontFamily: `${house.fonts.body}, CairoLatin`, direction: "rtl" };
const TITLE: React.CSSProperties = { fontFamily: house.fonts.title, direction: "rtl", lineHeight: 1.05 };

/* ================= footage: jump cuts + punch-ins ================= */
const Footage: React.FC = () => (
  <>
    {SEGS.map((s, i) => (
      <Sequence key={i} from={s.at} durationInFrames={s.len}>
        <Shot i={i} />
      </Sequence>
    ))}
  </>
);

const Shot: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const s = SEGS[i];
  const [ox, oy] = originOf(i);
  const z = zoomOf(i, f, s.len);
  const last = i === SEGS.length - 1;
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `${ox}px ${oy}px` }}>
      <OffthreadVideo src={staticFile("darija/src.mp4")} startFrom={s.src}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.08) contrast(1.06)" }}
        // 2-frame audio fades on every cut so jump cuts never click; the outro hold is muted
        volume={(fr) => interpolate(fr, [0, 2, s.len - (last ? 75 : 0) - 3, s.len - (last ? 75 : 0)], [0, 1, 1, 0], clamp)} />
    </AbsoluteFill>
  );
};

/* grade layer directly above the footage (warm, slightly crushed) */
const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "#E8825F", mixBlendMode: "soft-light", opacity: 0.1 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,11,10,0.25), transparent 22%, transparent 66%, rgba(14,11,10,0.55))" }} />
  </AbsoluteFill>
);

/* ================= head-tracked card ================= */
const Card: React.FC<{ from: number; to: number; w?: number; h?: number; children: React.ReactNode }> = ({
  from, to, w = 1.2, h = 1.42, children,
}) => {
  // Full-screen graphic scene: covers the whole frame (footage included), wipes in from the
  // bottom, wipes out upward (faster), with its own animated background.
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from || frame >= to) return null;
  void w; void h;
  const t = frame - from;
  const p = spring({ frame: t, fps, config: { damping: 22, stiffness: 140, mass: 0.8 } });
  const o = interpolate(frame, [to - 8, to], [0, 1], { ...clamp, easing: house.ease.in });
  const reveal = interpolate(p, [0, 1], [100, 0]);
  const push = 1 + Math.min(1, t / (to - from)) * 0.03; // slow push while it holds
  const d1 = Math.sin(t / 40) * 60, d2 = Math.cos(t / 55) * 50;
  return (
    <AbsoluteFill style={{ clipPath: `inset(${o * 100}% 0 ${reveal}% 0)` }}>
      <AbsoluteFill style={{ background: C.bg }} />
      <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", left: -500 + d1, top: -300,
        background: `radial-gradient(circle, ${C.coral}33, transparent 62%)`, filter: "blur(40px)" }} />
      <div style={{ position: "absolute", width: 1200, height: 1200, borderRadius: "50%", right: -500 - d2, bottom: -200,
        background: "radial-gradient(circle, rgba(255,240,225,0.10), transparent 64%)", filter: "blur(50px)" }} />
      {/* faint grid */}
      <AbsoluteFill style={{ opacity: 0.06, backgroundImage:
        "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "90px 90px", backgroundPosition: `0 ${-t * 0.6}px`,
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)" }} />
      {/* coral edge line that leads the wipe */}
      <div style={{ position: "absolute", left: 0, right: 0, top: `${100 - (100 - reveal)}%`, height: 10, background: C.coral,
        opacity: reveal > 0.5 ? 1 : 0 }} />
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 160 }}>
        <div style={{ width: 760, display: "flex", flexDirection: "column", justifyContent: "center",
          transform: `translateY(${interpolate(p, [0, 1], [120, 0]) - o * 60}px) scale(${1.18 * push})`,
          opacity: interpolate(p, [0.2, 0.7], [0, 1], clamp) }}>
          {children}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const useRise = (delay: number, dy = 22) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: house.spring.smooth });
  return { opacity: interpolate(p, [0, 0.6], [0, 1], clamp), transform: `translateY(${interpolate(p, [0, 1], [dy, 0])}px)` };
};

const Label: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <div style={{ ...useRise(at, 12), ...AR, fontWeight: 600, fontSize: 30, letterSpacing: 2, color: C.dim,
    display: "flex", alignItems: "center", gap: 16 }}>
    <span style={{ width: 40, height: 3, background: C.coral, borderRadius: 2 }} />
    {children}
  </div>
);

const Title: React.FC<{ at: number; size?: number; color?: string; children: React.ReactNode }> = ({
  at, size = 128, color = C.text, children,
}) => <div style={{ ...useRise(at, 30), ...TITLE, fontSize: size, color, marginTop: 14 }}>{children}</div>;

const Sub: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <div style={{ ...useRise(at, 16), ...AR, fontWeight: 600, fontSize: 44, color: C.sub, marginTop: 18 }}>{children}</div>
);

/* ================= the graphics ================= */
const Hook: React.FC<{ a: number; b: number }> = ({ a, b }) => (
  <Card from={a} to={b}>
    <Label at={a + 4}>دليل الطالب الجديد</Label>
    <Title at={a + 7} size={170}>أول نهار</Title>
    <Title at={a + 12} size={120} color={C.sub}>في الجامعة</Title>
    <div style={{ ...useRise(a + 24, 20), marginTop: 30 }}>
      <span style={{ ...AR, fontWeight: 800, fontSize: 56, color: C.bg, background: C.coral, borderRadius: 999,
        padding: "8px 40px" }}>واش تدير؟</span>
    </div>
  </Card>
);

const Check: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: house.spring.snappy });
  const tick = spring({ frame: frame - at - 6, fps, config: house.spring.bouncy });
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 26, marginTop: 26,
      opacity: interpolate(p, [0, 0.5], [0.25, 1], clamp), transform: `translateX(${interpolate(p, [0, 1], [-24, 0])}px)` }}>
      <div style={{ width: 66, height: 66, borderRadius: 33, flexShrink: 0, position: "relative",
        border: `3px solid ${tick > 0.5 ? C.green : C.line}`, background: tick > 0.05 ? C.greenBg : "transparent" }}>
        <svg viewBox="0 0 24 24" width={66} height={66} style={{ position: "absolute", left: -3, top: -3 }}>
          <path d="M6.5 12.5 L10.5 16.5 L17.5 8.5" fill="none" stroke={C.green} strokeWidth={2.6} strokeLinecap="round"
            strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - tick)} />
        </svg>
      </div>
      <div style={{ ...AR, fontWeight: 800, fontSize: 62, color: tick > 0.5 ? C.text : C.sub, flex: 1, textAlign: "right" }}>{text}</div>
    </div>
  );
};

const Morning: React.FC<{ a: number; b: number; items: [number, string][] }> = ({ a, b, items }) => (
  <Card from={a} to={b} h={1.6}>
    <Label at={a + 3}>01 · روتين الصباح</Label>
    <Title at={a + 6} size={110}>قبل ما تخرج</Title>
    <div style={{ height: 2, background: C.line, margin: "26px 0 6px" }} />
    {items.map(([t, s]) => <Check key={s} at={t} text={s} />)}
  </Card>
);

const Tip: React.FC<{ a: number; b: number; n: string; title: string; sub: string }> = ({ a, b, n, title, sub }) => (
  <Card from={a} to={b}>
    <Label at={a + 3}>{n}</Label>
    <Title at={a + 6} size={150}>{title}</Title>
    <Sub at={a + 14}>{sub}</Sub>
  </Card>
);

const Route: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - a - 16, fps, config: { damping: 30, stiffness: 40 } });
  const W = 640;
  return (
    <Card from={a} to={b}>
      <Label at={a + 3}>03 · الطريق</Label>
      <Title at={a + 6} size={140}>اخرج من الدار</Title>
      <div style={{ ...useRise(a + 12), position: "relative", height: 150, marginTop: 40, direction: "ltr" }}>
        <div style={{ position: "absolute", left: 40, right: 40, top: 40, height: 6, borderRadius: 3, background: C.line }} />
        <div style={{ position: "absolute", right: 40, top: 40, height: 6, borderRadius: 3, background: C.coral,
          width: `calc((100% - 80px) * ${p})` }} />
        {[0, 1].map((k) => (
          <div key={k} style={{ position: "absolute", top: 24, [k ? "left" : "right"]: 22, width: 38, height: 38,
            borderRadius: 19, background: k && p < 0.98 ? C.card : C.coral, border: `5px solid ${C.coral}` }} />
        ))}
        <div style={{ position: "absolute", top: 92, right: 0, ...AR, fontWeight: 800, fontSize: 40, color: C.sub }}>الدار</div>
        <div style={{ position: "absolute", top: 92, left: 0, ...AR, fontWeight: 800, fontSize: 40, color: p > 0.9 ? C.text : C.sub }}>الجامعة</div>
        <div style={{ position: "absolute", top: 12, right: 40 + p * (W - 80) - 30, width: 60, height: 60, borderRadius: 14,
          background: C.text, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <svg viewBox="0 0 24 24" width={40} height={40}><path d="M7 3h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zm0 4v4h10V7zm1 8.2a1.2 1.2 0 1 0 0 .01zm8 0a1.2 1.2 0 1 0 0 .01zM8 19l-2 2m10-2 2 2" fill="none" stroke={C.bg} strokeWidth={1.8} strokeLinecap="round" /></svg>
        </div>
      </div>
    </Card>
  );
};

const Compare: React.FC<{ a: number; b: number; big: number }> = ({ a, b, big }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame: frame - a - 10, fps, config: house.spring.smooth });
  const s2 = spring({ frame: frame - big, fps, config: house.spring.bouncy });
  const box = (label: string, size: number, p: number, hot: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ width: size, height: size, borderRadius: 28, transform: `scale(${p})`, transformOrigin: "50% 100%",
        background: hot ? C.coral : "#3A3431", border: `2px solid ${C.cardEdge}`,
        boxShadow: hot ? `0 0 70px ${C.coral}55` : "none" }} />
      <div style={{ ...AR, fontWeight: 800, fontSize: 50, color: hot ? C.text : C.sub, opacity: p }}>{label}</div>
    </div>
  );
  return (
    <Card from={a} to={b}>
      <Label at={a + 3}>04 · الفرق الوحيد</Label>
      <Title at={a + 6} size={92}>نفس الشي، غير أكبر</Title>
      <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "flex-end", justifyContent: "center",
        gap: 60, marginTop: 26 }}>
        {box("الليسي", 130, s1, false)}
        {box("الجامعة", 260, s2, true)}
      </div>
      <Sub at={big + 8}>ماكانش علاه تخاف</Sub>
    </Card>
  );
};

const RiseDiv: React.FC<{ d: number; dy?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ d, dy = 22, style, children }) =>
  <div style={{ ...style, ...useRise(d, dy) }}>{children}</div>;

const Campus: React.FC<{ a: number; sched: number; b: number }> = ({ a, sched, b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const door = spring({ frame: frame - a - 8, fps, config: house.spring.smooth });
  const showSched = frame >= sched;
  const days = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس"];
  return (
    <Card from={a} to={b} h={1.55}>
      {!showSched ? (
        <>
          <Label at={a + 3}>05 · كي توصل</Label>
          <Title at={a + 6} size={130}>ادخل من الباب الكبير</Title>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 34 }}>
            <RiseDiv d={a + 8} style={{ width: 300, height: 340, borderRadius: "150px 150px 18px 18px", border: `6px solid ${C.coral}`,
              overflow: "hidden", display: "flex" }}>
              {[0, 1].map((k) => (
                <div key={k} style={{ flex: 1, background: "#3A3431", borderLeft: k ? `3px solid ${C.bg}` : undefined,
                  transform: `perspective(600px) rotateY(${(k ? 1 : -1) * door * 70}deg)`, transformOrigin: k ? "100% 50%" : "0% 50%" }} />
              ))}
            </RiseDiv>
          </div>
        </>
      ) : (
        <>
          <Label at={sched + 2}>06 · التوقيت</Label>
          <Title at={sched + 4} size={120}>شوف التوقيت تاعك</Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 34, direction: "rtl" }}>
            {days.map((d, i) => (
              <RiseDiv key={d} d={sched + 8 + i * 3} dy={12} style={{ ...AR, fontWeight: 600, fontSize: 28, color: C.dim, textAlign: "center" }}>{d}</RiseDiv>
            ))}
            {Array.from({ length: 15 }).map((_, k) => {
              const hot = k === 6;
              const p = spring({ frame: frame - sched - 12 - (k % 5) * 3 - Math.floor(k / 5) * 4, fps, config: house.spring.snappy });
              return (
                <div key={k} style={{ height: 96, borderRadius: 16, transform: `scale(${p})`,
                  background: hot ? C.coral : k % 3 === 1 ? "#3A3431" : "#2F2B29", border: `1px solid ${C.cardEdge}`,
                  display: "flex", alignItems: "center", justifyContent: "center", ...AR, fontWeight: 800, fontSize: 28, color: C.bg }}>
                  {hot ? "8:00" : ""}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};

const Agents: React.FC<{ a: number; b: number }> = ({ a, b }) => (
  <Card from={a} to={b}>
    <Label at={a + 3}>07 · ضعت؟ عادي</Label>
    <Title at={a + 6} size={150}>سقسي</Title>
    <div style={{ ...useRise(a + 11, 20), fontFamily: "CairoLatin", fontWeight: 900, fontSize: 96, color: C.coral, marginTop: -6 }}>
      les agents
    </div>
    <Sub at={a + 18}>يدّوك ليها ديريكت</Sub>
  </Card>
);

const Outro: React.FC<{ a: number; b: number }> = ({ a, b }) => (
  <Card from={a} to={b}>
    <Title at={a + 4} size={180}>بالتوفيق!</Title>
    <Sub at={a + 12}>للطلبة الجدد كامل</Sub>
    <div style={{ ...useRise(a + 22, 20), marginTop: 34 }}>
      <span style={{ ...AR, fontWeight: 800, fontSize: 48, color: C.bg, background: C.coral, borderRadius: 999, padding: "8px 36px" }}>
        تابعني للنصائح الجاية
      </span>
    </div>
  </Card>
);

/* ================= word-highlight captions (Arabic, RTL) ================= */
// [source start s, source end s, text] — darija written in Arabic script from the whisper pass, corrected by hand.
const CAPS: [number, number, string][] = [
  [17.76, 18.5, "واش تدير"], [18.5, 19.2, "في أول نهار"], [19.2, 19.9, "في الجامعة؟"],
  [38.9, 40.2, "نوض الصباح بكري"], [40.9, 41.45, "دوش"], [41.45, 42.65, "صلّي صلاتك"], [44.32, 48.7, "اقرا القرآن"],
  [51.42, 53.25, "قهوة بعقلك"], [53.96, 59.3, "البس حوايجك"],
  [63.27, 63.9, "وجّد روحك"], [63.9, 64.98, "ستيكي روحك مليح"],
  [70.86, 72.0, "من بعد اخرج من دارك"], [72.61, 74.2, "ركب الطرام ولا الكار"],
  [87.78, 88.7, "لازم تنحّي"], [88.7, 89.72, "الستراس لي في راسك"], [89.72, 91.52, "الجامعة كيما الليسي"],
  [91.84, 93.7, "الفرق الوحيد"], [93.7, 95.22, "الجامعة كبيرة على الليسي"], [95.3, 96.05, "هذا ما كان"],
  [99.51, 100.46, "كي توصل للجامعة"], [100.46, 101.84, "تلقى باب كبير"], [101.84, 102.6, "ادخل ليه"],
  [103.54, 105.2, "شوف التوقيت تاعك"], [105.2, 106.05, "ولازم تقرا"],
  [106.87, 107.6, "إذا ما عرفتش وين"], [107.6, 108.94, "عادي جداً"],
  [109.45, 110.22, "سقسي les\u00A0agents"], [110.22, 111.48, "تلقى بزاف les\u00A0agents"],
  [111.48, 113.06, "سقسيهم عادي"], [113.06, 114.73, "ويدّوك ليها ديريكت"],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cur = CAPS.find(([a, b]) => frame >= out(a) && frame < out(b) + 2);
  if (!cur) return null;
  const [a, b, text] = cur;
  const A = out(a), B = out(b);
  const words = text.split(" ");
  const p = spring({ frame: frame - A, fps, config: house.spring.snappy });
  const active = Math.min(words.length - 1, Math.floor(((frame - A) / Math.max(1, B - A)) * words.length));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1612, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px) scale(${interpolate(p, [0, 1], [0.92, 1])})` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", direction: "rtl",
        background: "rgba(14,11,10,0.72)", borderRadius: 26, padding: "12px 34px", border: `1px solid ${C.cardEdge}` }}>
        {words.map((w, i) => (
          <span key={i} style={{ ...AR, fontWeight: 900, fontSize: 76, lineHeight: 1.45,
            color: i === active ? C.coral : C.text, unicodeBidi: "isolate", transform: `scale(${i === active ? 1.06 : 1})`, display: "inline-block" }}>{w}</span>
        ))}
      </div>
    </div>
  );
};

/* ================= the schedule of graphics (source seconds -> output frames) ================= */
const G = {
  hook: [out(17.62), out(25.5)],
  morning: [out(39.1), out(48.95)],
  find: [out(63.13), out(65.2)],
  route: [out(70.72), out(75.41)],
  compare: [out(91.7), out(96.29)],
  campus: [out(100.3), out(106.3)],
  agents: [out(109.31), out(111.7)],
  outro: [out(114.73) + 4, TOTAL],
} as const;
const MORNING_ITEMS: [number, string][] = [
  [out(39.24), "نوض بكري"], [out(40.91), "دوش"], [out(41.45), "صلّي صلاتك"], [out(44.32), "اقرا القرآن"],
];

const Graphics: React.FC = () => (
  <>
    <Hook a={G.hook[0]} b={G.hook[1]} />
    <Morning a={G.morning[0]} b={G.morning[1]} items={MORNING_ITEMS} />
    <Tip a={G.find[0]} b={G.find[1]} n="02 · وجّد روحك" title="وجّد روحك" sub="ستيكي روحك مليح" />
    <Route a={G.route[0]} b={G.route[1]} />
    <Compare a={G.compare[0]} b={G.compare[1]} big={out(93.7)} />
    <Campus a={G.campus[0]} sched={out(103.4)} b={G.campus[1]} />
    <Agents a={G.agents[0]} b={G.agents[1]} />
    <Outro a={G.outro[0]} b={G.outro[1]} />
  </>
);

/* ================= sound: music ~15 dB under voice, UI sounds ~6.5 dB under ================= */
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.47 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={v} />
  </Sequence>
);

const Sound: React.FC = () => {
  const chapters = [G.morning[0], G.find[0], G.route[0], G.compare[0], G.campus[0], out(103.4), G.agents[0]];
  return (
    <>
      <Audio src={staticFile("sfx/bed.wav")}
        volume={(f) => interpolate(f, [0, 10, TOTAL - 75, TOTAL - 70, TOTAL - 5], [0.0, 0.17, 0.17, 0.3, 0], clamp)} />
      <Sfx at={G.hook[0]} src="swipe" />
      <Sfx at={G.hook[0] + 22} src="ding" v={0.35} />
      {chapters.map((c) => <Sfx key={`s${c}`} at={c - 2} src="swipe" />)}
      {chapters.map((c) => <Sfx key={`d${c}`} at={c + 6} src="ding" v={0.3} />)}
      {MORNING_ITEMS.map(([t]) => <Sfx key={`c${t}`} at={t + 5} src="check" v={0.4} />)}
      <Sfx at={out(93.7) - 1} src="pop" v={0.45} />
      <Sfx at={G.outro[0] - 2} src="swipe" />
      <Sfx at={G.outro[0] + 4} src="ding" v={0.4} />
    </>
  );
};

export const DarijaEdit: React.FC = () => {
  useFontFaces([
    [house.fonts.title, "fonts/lalezar-arabic-400-normal.woff2", "400"],
    [house.fonts.body, "fonts/cairo-arabic-600-normal.woff2", "600"],
    [house.fonts.body, "fonts/cairo-arabic-800-normal.woff2", "800"],
    [house.fonts.body, "fonts/cairo-arabic-900-normal.woff2", "900"],
    ["CairoLatin", "fonts/cairo-latin-800-normal.woff2", "800"],
    ["CairoLatin", "fonts/cairo-latin-900-normal.woff2", "900"],
  ]);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Footage />
      <Grade />
      <Graphics />
      <Captions />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: C.bg, opacity: interpolate(frame, [TOTAL - 8, TOTAL - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
