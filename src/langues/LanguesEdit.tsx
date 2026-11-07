// "مشكل اللغات للطلبة الجدد" — the user's own (already partly edited) video. We keep all of his own overlays
// and add, in the free windows only: full-screen character scenes (classroom kit), punch-ins, Arabic captions,
// a cleaned/normalised voice, a music bed and UI sounds.
import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Person, Sparkles } from "../pomme/world";
import { clamp, theme } from "../theme";
import { Classroom, K } from "../expose/classroom";

const FPS = 30;
const s = (t: number) => Math.round(t * FPS);
const SRC = 48.8;
const OUTRO = 2.2;
export const LANGUES_FRAMES = s(SRC + OUTRO);
const AR: React.CSSProperties = { fontFamily: "Cairo, CairoLatin", direction: "rtl" };
const TITLE: React.CSSProperties = { fontFamily: "Lalezar, CairoLatin", direction: "rtl", lineHeight: 1.15 };

/* ---------- captions (darija in Arabic script; seconds) ---------- */
const CAPS: [number, number, string][] = [
  [0.0, 1.4, "اللغات، هذا مشكل"], [1.4, 3.6, "بزاف من الطلبة الجدد"], [3.7, 5.0, "اللي يطلعوا للجامعة"], [5.0, 6.3, "عندكم لغتين تقراو بيهم"],
  [6.4, 8.8, "يا إما الفرنسية ولا الإنجليزية"], [8.9, 10.1, "لازم تعرفوا بلي في الجامعة"], [10.1, 11.7, "ما لازمش تكونوا هاربين في اللغات"],
  [11.8, 13.6, "لازم تعرفوا غير الكلمات المفتاحية"], [14.1, 15.4, "واليوم جبتلكم الحل"], [15.5, 17.7, "ادخلوا للبيو تاعي"],
  [17.8, 19.6, "حطيت لينك لصحاب"], [19.6, 21.3, "informatique و maths"], [21.4, 23.0, "فيه كامل الكلمات المفتاحية"],
  [23.0, 25.1, "تاع السنة الأولى والثانية"], [25.2, 26.9, "إذا حبيت تطور اللغات"], [27.3, 28.6, "كاين groupe Telegram"],
  [28.7, 30.3, "اكتبلي Telegram في الكومنتار"], [30.4, 31.4, "ونبعثهولك في البريفي"], [31.5, 33.4, "تقدر تتكوميونيكي مع الناس"],
  [33.5, 35.2, "وحاجة عجبتني في هاد الغروب"], [35.3, 37.0, "تقدر تبعث message vocal"], [37.1, 38.2, "ما تقدرش تكتب؟"],
  [38.3, 40.8, "هكا تتعلم الكوميونيكاسيون مع الناس"], [41.0, 42.6, "وتتعلم لغات جدد"], [42.7, 44.4, "ماشي غير الإنجليزية، كاين الفرنسية"],
  [44.5, 45.1, "الشينوية"], [45.2, 47.4, "الإسبانيول، الألمانية، الإيطالية"], [47.5, 48.6, "etc, etc!"],
];

/* ---------- footage with punch-ins on every new phrase ---------- */
const Footage: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const idx = CAPS.findIndex(([a, b]) => t >= a && t < b + 0.1);
  // his own screen-recording inserts (15–23 s, 35–37 s, 44–48 s) stay unzoomed so their UI is fully visible
  const insert = (t > 14.6 && t < 23.2) || (t > 35 && t < 37.3) || t > 43.8;
  const z = insert || idx < 0 ? 1.0 : idx % 2 ? 1.12 : 1.0;
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "540px 700px" }}>
      <OffthreadVideo src={staticFile("langues/src.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

/* ---------- scene kit ---------- */
const Scene: React.FC<{ from: number; to: number; wipe: string; children: React.ReactNode }> = ({ from, to, wipe, children }) => {
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
const usePop = (at: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f < at ? 0 : spring({ frame: f - at, fps, config: theme.spring.bouncy });
};
const Sticker: React.FC<{ at: number; x: number; y: number; bg: string; color?: string; size?: number; rot?: number; children: React.ReactNode }> = ({
  at, x, y, bg, color = K.white, size = 70, rot = -3, children,
}) => {
  const p = usePop(at);
  if (p === 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot + (1 - p) * 12}deg) scale(${p})`, background: bg, color,
      ...TITLE, unicodeBidi: "plaintext", fontSize: size, padding: `0 ${size * 0.4}px ${size * 0.12}px`, borderRadius: size * 0.32, border: "6px solid #fff",
      boxShadow: `0 10px 0 rgba(0,0,0,0.15), 0 0 30px ${bg}66`, whiteSpace: "nowrap" }}>{children}</div>
  );
};
const Chip: React.FC<{ x: number; y: number; bg: string; text: string; rot?: number; scale?: number; o?: number }> = ({ x, y, bg, text, rot = 0, scale = 1, o = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`, opacity: o, background: bg, color: "#fff",
    fontFamily: "CairoLatin", fontWeight: 900, fontSize: 46, padding: "2px 28px 8px", borderRadius: 999, border: "4px solid #fff", whiteSpace: "nowrap",
    boxShadow: "0 6px 0 rgba(0,0,0,0.15)" }}>{text}</div>
);

/* ---------- A: lost in two languages -> only the key words matter (8.9–13.0 s) ---------- */
const KeyWords: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const t = f - from;
  const settle = s(11.8) - from;
  const noise = ["le théorème", "the function", "néanmoins", "approximately", "d'ailleurs", "whereas", "cependant", "furthermore", "la démonstration", "therefore"];
  const keys: [string, string][] = [["fonction", K.blue], ["matrice", K.pink], ["algorithme", K.purple], ["dérivée", K.green]];
  const gone = interpolate(t, [settle - 4, settle + 6], [1, 0], clamp);
  return (
    <>
      <Classroom boardText="Français / English" />
      <Person x={540} feet={1520} shirt={K.pink} hair="#3B2416" scale={1.15} armR={t < settle ? -140 + Math.sin(t / 3) * 15 : -60} armL={t < settle ? 140 : -8} face={0}
        jump={t >= settle + 8 ? Math.abs(Math.sin((t - settle) / 6)) * 50 : 0} />
      {noise.map((w, i) => {
        const a = i * 0.63 + t / (22 + (i % 4) * 6);
        const r = 330 + (i % 3) * 70;
        return <Chip key={w} x={540 + Math.cos(a) * r} y={930 + Math.sin(a) * r * 0.55} bg={i % 2 ? "#7A8BA6" : "#9AA6C0"} text={w} rot={Math.sin(a) * 10}
          o={gone * Math.min(1, t / 8)} scale={0.85} />;
      })}
      {keys.map(([w, c], i) => {
        const p = interpolate(t, [settle + i * 4, settle + 14 + i * 4], [0, 1], { ...clamp, easing: theme.ease.out });
        if (p === 0) return null;
        const a = i * 1.57 + 0.4;
        return <Chip key={w} x={540 + Math.cos(a) * 420 * (1 - p) + (i % 2 ? 210 : -210) * p} y={880 + Math.sin(a) * 300 * (1 - p) + (i < 2 ? -70 : 50) * p}
          bg={c} text={w} scale={0.9 + 0.25 * p} />;
      })}
      <Sticker at={s(12.6)} x={540} y={640} bg={K.yellow} color={K.ink} size={92} rot={-3}>غير الكلمات المفتاحية</Sticker>
      <Sparkles at={settle + from + 10} x={540} y={900} color={K.yellow} />
    </>
  );
};

/* ---------- phone + group chat (25.2–29.9 s) ---------- */
const GroupChat: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const msgs: [string, string, boolean][] = [["Hello everyone!", K.blue, false], ["Salut la team", K.pink, true], ["Hola!", K.green, false], ["voice 0:12", K.purple, true]];
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${K.wall2}, #E9D5FF)` }} />
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: (i * 157) % 1000, top: ((i * 233 + (f - from) * 2) % 1900) - 80, width: 60, height: 44, borderRadius: 16,
          background: [K.pink, K.blue, K.yellow, K.green][i % 4], opacity: 0.25 }} />
      ))}
      <div style={{ position: "absolute", left: 270, top: 330, width: 540, height: 1040, borderRadius: 70, background: K.ink, padding: 22, boxShadow: "0 30px 0 rgba(0,0,0,0.12)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 52, background: "#F4F8FF", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 120, background: K.blue, display: "flex", alignItems: "center", gap: 18, padding: "0 30px" }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: K.yellow, border: "4px solid #fff" }} />
            <div style={{ fontFamily: "CairoLatin", fontWeight: 900, fontSize: 40, color: "#fff" }}>Groupe langues</div>
          </div>
          <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 22, justifyContent: "flex-end" }}>
            {msgs.map(([m, c, mine], i) => {
              const at = from + 10 + i * 18;
              const p = f < at ? 0 : spring({ frame: f - at, fps, config: theme.spring.bouncy });
              if (p === 0) return null;
              return (
                <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", display: "flex", gap: 12, alignItems: "flex-end", flexDirection: mine ? "row-reverse" : "row",
                  transform: `scale(${p})`, transformOrigin: mine ? "100% 100%" : "0% 100%" }}>
                  <div style={{ width: 54, height: 54, borderRadius: 27, background: c, border: "3px solid #fff", flexShrink: 0 }} />
                  <div style={{ background: mine ? c : "#fff", color: mine ? "#fff" : K.ink, borderRadius: 26, padding: "10px 24px 14px", fontFamily: "CairoLatin",
                    fontWeight: 800, fontSize: 36, border: mine ? "none" : `3px solid ${c}`, display: "flex", alignItems: "center", gap: 10 }}>
                    {m.startsWith("voice") ? <>{Array.from({ length: 9 }).map((_, k) => <span key={k} style={{ width: 6, height: 12 + ((k * 7) % 5) * 7 * (0.6 + 0.4 * Math.abs(Math.sin((f + k * 4) / 5))),
                      background: "#fff", borderRadius: 3 }} />)}<span style={{ marginLeft: 8 }}>0:12</span></> : m}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Sticker at={from + 4} x={540} y={210} bg={K.blue} size={80} rot={-3}>groupe Telegram</Sticker>
      <Sticker at={s(28.7)} x={540} y={1480} bg={K.yellow} color={K.ink} size={60} rot={3}>اكتب Telegram في الكومنتار</Sticker>
    </>
  );
};

/* ---------- two students chatting (31.5–33.3 s) ---------- */
const Chatting: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const t = f - from;
  const turn = Math.floor(t / 14) % 2;
  return (
    <>
      <Classroom boardText="communication" />
      <Person x={300} feet={1520} shirt={K.pink} hair="#3B2416" scale={1.15} armR={turn === 0 ? -100 + Math.sin(f / 3) * 20 : -8} face={1} />
      <Person x={780} feet={1520} shirt={K.blue} hair="#1B1530" skin="#C98A62" scale={1.15} armL={turn === 1 ? 100 + Math.sin(f / 3) * 20 : -8} face={-1} />
      <Sticker at={from + 2} x={330} y={880} bg="#fff" color={K.ink} size={60} rot={-4}>Hi!</Sticker>
      <Sticker at={from + 16} x={760} y={880} bg="#fff" color={K.ink} size={60} rot={4}>Salut!</Sticker>
    </>
  );
};

/* ---------- a voice message travelling (37.1–39.8 s) ---------- */
const VoiceNote: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const t = f - from;
  const fly = interpolate(t, [10, 40], [0, 1], { ...clamp, easing: theme.ease.inOut });
  return (
    <>
      <Classroom boardText="message vocal" />
      <Person x={220} feet={1520} shirt={K.yellow} hair="#6B3A1E" scale={1.1} armR={-75} face={1} />
      <Person x={860} feet={1520 - (t > 42 ? Math.abs(Math.sin((t - 42) / 5)) * 50 : 0)} shirt={K.green} hair="#1B1530" skin="#C98A62" scale={1.1} armL={t > 42 ? 150 : -8} face={-1} />
      <div style={{ position: "absolute", left: 220 + fly * 520 - 150, top: 960 - Math.sin(Math.PI * fly) * 260, width: 300, height: 110, borderRadius: 55, background: K.purple,
        border: "6px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 10px 0 rgba(0,0,0,0.15)" }}>
        {Array.from({ length: 11 }).map((_, k) => <span key={k} style={{ width: 9, borderRadius: 5, background: "#fff",
          height: 18 + Math.abs(Math.sin((f + k * 5) / 4)) * 50 }} />)}
      </div>
      <Sticker at={from + 6} x={540} y={720} bg={K.purple} size={84} rot={-3}>ما تقدرش تكتب؟ ابعث vocal</Sticker>
    </>
  );
};

/* ---------- learn new languages (41.0–43.8 s) ---------- */
const Languages: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const t = f - from;
  const words: [string, string][] = [["Hello", K.blue], ["Bonjour", K.pink], ["Hola", K.yellow], ["Hallo", K.green], ["Ciao", K.purple], ["Ni hao", "#FF7A2E"]];
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #DFF3FF, ${K.wall2})` }} />
      <svg width={420} height={420} viewBox="-110 -110 220 220" style={{ position: "absolute", left: 330, top: 640, transform: `rotate(${t * 1.5}deg)` }}>
        <circle r={100} fill={K.blue} stroke="#fff" strokeWidth={8} />
        {[[-40, -30, 38, 26], [30, 20, 42, 30], [-20, 50, 26, 16], [50, -50, 22, 16]].map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={K.green} />)}
        <ellipse rx={100} ry={40} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={4} />
      </svg>
      {words.map(([w, c], i) => {
        const p = interpolate(t, [i * 7, i * 7 + 12], [0, 1], { ...clamp, easing: theme.ease.out });
        const a = (i / words.length) * Math.PI * 2 - Math.PI / 2 + t / 90;
        return <div key={w} style={{ position: "absolute", left: 540 + Math.cos(a) * 400 * p, top: 850 + Math.sin(a) * 430 * p, transform: `translate(-50%,-50%) scale(${p})`,
          background: c, color: "#fff", fontFamily: "CairoLatin", fontWeight: 900, fontSize: 64, padding: "4px 36px 12px", borderRadius: 40, border: "5px solid #fff",
          boxShadow: "0 8px 0 rgba(0,0,0,0.15)" }}>{w}</div>;
      })}
      <Sticker at={from + 4} x={540} y={300} bg={K.pink} size={96} rot={-3}>لغات جدد!</Sticker>
    </>
  );
};

const Outro: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  return (
    <>
      <Classroom boardText="Telegram" />
      {[[250, K.pink, "#3B2416"], [540, K.blue, "#1B1530"], [830, K.yellow, "#6B3A1E"]].map(([x, sh, h], i) => (
        <Person key={i} x={x as number} feet={1520} shirt={sh as string} hair={h as string} skin={i === 1 ? "#C98A62" : undefined} scale={1.1}
          armR={-150 + Math.sin(f / 4 + i) * 22} face={0} />
      ))}
      <Sticker at={from + 3} x={540} y={760} bg={K.yellow} color={K.ink} size={78} rot={-3}>اكتب Telegram في الكومنتار</Sticker>
      <Sticker at={from + 12} x={540} y={900} bg={K.pink} size={70} rot={3}>Abonne-toi!</Sticker>
    </>
  );
};

/* ---------- captions ---------- */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / FPS;
  const cur = CAPS.find(([a, b]) => t >= a && t < b + 0.12);
  if (!cur) return null;
  const [a, b, text] = cur;
  const words = text.split(" ");
  const p = spring({ frame: f - s(a), fps, config: theme.spring.snappy });
  const active = Math.min(words.length - 1, Math.floor(((t - a) / Math.max(0.1, b - a)) * words.length));
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1690, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px", direction: "rtl", padding: "2px 32px 10px",
        background: K.blue, borderRadius: 28, border: "5px solid #fff", boxShadow: "0 10px 0 rgba(0,0,0,0.15)" }}>
        {words.map((w, i) => (
          <span key={i} style={{ ...AR, fontWeight: 900, fontSize: 58, lineHeight: 1.5, unicodeBidi: "isolate", color: i === active ? K.yellow : "#fff" }}>{w}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- sound ---------- */
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);

const SC = { A: [8.9, 13.0], B: [25.2, 29.9], C: [31.5, 33.3], D: [37.1, 39.8], E: [41.0, 43.8] } as const;

export const LanguesEdit: React.FC = () => {
  useFontFaces([
    ["Lalezar", "fonts/lalezar-arabic-400-normal.woff2", "400"],
    ["Cairo", "fonts/cairo-arabic-800-normal.woff2", "800"],
    ["Cairo", "fonts/cairo-arabic-900-normal.woff2", "900"],
    ["CairoLatin", "fonts/cairo-latin-800-normal.woff2", "800"],
    ["CairoLatin", "fonts/cairo-latin-900-normal.woff2", "900"],
  ]);
  const f = useCurrentFrame();
  const starts = [SC.A[0], SC.B[0], SC.C[0], SC.D[0], SC.E[0], SRC];
  return (
    <AbsoluteFill style={{ background: K.wall }}>
      <Footage />
      <Scene from={s(SC.A[0])} to={s(SC.A[1])} wipe={K.yellow}><KeyWords from={s(SC.A[0])} /></Scene>
      <Scene from={s(SC.B[0])} to={s(SC.B[1])} wipe={K.blue}><GroupChat from={s(SC.B[0])} /></Scene>
      <Scene from={s(SC.C[0])} to={s(SC.C[1])} wipe={K.pink}><Chatting from={s(SC.C[0])} /></Scene>
      <Scene from={s(SC.D[0])} to={s(SC.D[1])} wipe={K.purple}><VoiceNote from={s(SC.D[0])} /></Scene>
      <Scene from={s(SC.E[0])} to={s(SC.E[1])} wipe={K.green}><Languages from={s(SC.E[0])} /></Scene>
      <Scene from={s(SRC)} to={LANGUES_FRAMES} wipe={K.yellow}><Outro from={s(SRC)} /></Scene>
      <Captions />
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [LANGUES_FRAMES - 8, LANGUES_FRAMES - 1], [0, 1], clamp) }} />
      <Audio src={staticFile("sfx/bed52.wav")} volume={(fr) => interpolate(fr, [0, 12, s(SRC) - 10, s(SRC) + 5, LANGUES_FRAMES - 3], [0, 0.06, 0.06, 0.22, 0], clamp)} />
      {starts.map((t) => <Sfx key={`w${t}`} at={s(t) - 2} src="whoosh" v={0.3} />)}
      {[12.6, 25.5, 26.1, 26.7, 27.3, 28.7, 31.6, 32.1, 37.3, 41.1, 41.3, 41.6, 41.8, 42.0, 42.3, SRC + 0.1, SRC + 0.4].map((t) => <Sfx key={`p${t}`} at={s(t)} src="pop" v={0.25} />)}
      {[11.8 + 0.4, 39.2].map((t) => <Sfx key={`d${t}`} at={s(t)} src="ding" v={0.28} />)}
      <Sfx at={s(37.5)} src="swipe" v={0.35} />
    </AbsoluteFill>
  );
};
