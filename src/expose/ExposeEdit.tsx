// "كيفاش نديرو exposé؟" — the user's Instagram-story answer, edited with the talking-head method
// (pause cuts, punch-ins on phrase changes, full-screen animated cards, Arabic captions, music bed + UI sounds).
import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { Grain, Vignette } from "../components/Layers";
import { house } from "../darija/theme";
import { Person, Sparkles } from "../pomme/world";
import { clamp } from "../theme";

const C = { ...house.colors, blue: "#4FA8FF", green: "#4CC38A", yellow: "#FFD23F", purple: "#9B5CFF" };
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
        <Shot a={s.a} b={s.b} last={i === SEGS.length - 1} />
      </Sequence>
    ))}
  </>
);
const Shot: React.FC<{ a: number; b: number; last: boolean }> = ({ a, b, last }) => {
  const f = useCurrentFrame();
  const t = a + f / FPS;
  // alternate framing on every phrase change (the skill's punch-in on each cut / new line)
  const idx = CAPS.findIndex(([s, e]) => t >= s && t < e + 0.15);
  const z = idx < 0 ? 1.04 : idx % 2 ? 1.14 : 1.0;
  const len = Math.round((b - a) * FPS);
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "540px 760px" }}>
      <OffthreadVideo src={staticFile("expose/src.mp4")} startFrom={Math.round(a * FPS)}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.08) contrast(1.05)" }}
        volume={(fr) => interpolate(fr, [0, 2, len - 3, len], [0, 1, 1, last ? 1 : 0], clamp) * (last && fr > len ? 0 : 1)} />
    </AbsoluteFill>
  );
};

/* ---------- full-screen animated card ---------- */
const Card: React.FC<{ from: number; to: number; children: React.ReactNode; tint?: string }> = ({ from, to, children, tint = C.coral }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const t = f - from;
  const p = interpolate(t, [0, 9], [0, 1], { ...clamp, easing: house.ease.out });
  const out = interpolate(f, [to - 7, to], [0, 1], { ...clamp, easing: house.ease.in });
  return (
    <AbsoluteFill style={{ clipPath: `circle(${p * 150 * (1 - out)}% at 50% 45%)`, background: C.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${tint}38, transparent 55%), radial-gradient(circle at 20% 85%, ${C.blue}22, transparent 45%)` }} />
      <AbsoluteFill style={{ opacity: 0.07, backgroundImage: "radial-gradient(rgba(255,255,255,1) 1.6px, transparent 1.6px)", backgroundSize: "48px 48px",
        backgroundPosition: `0 ${-t}px` }} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 260, gap: 26 }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const useIn = (at: number, dy = 40) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = f < at ? 0 : spring({ frame: f - at, fps, config: house.spring.bouncy });
  return { opacity: Math.min(1, p * 1.8), transform: `translateY(${(1 - p) * dy}px) scale(${0.85 + 0.15 * p})` } as React.CSSProperties;
};
const Label: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <div style={{ ...useIn(at, 20), ...AR, fontWeight: 800, fontSize: 40, letterSpacing: 1, color: C.coral, display: "flex", gap: 14, alignItems: "center" }}>
    <span style={{ width: 46, height: 4, background: C.coral, borderRadius: 2 }} />{children}
  </div>
);
const Big: React.FC<{ at: number; size?: number; color?: string; children: React.ReactNode }> = ({ at, size = 130, color = C.text, children }) => (
  <div style={{ ...useIn(at), ...TITLE, fontSize: size, color, textAlign: "center", textShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>{children}</div>
);
const Pill: React.FC<{ at: number; bg: string; color?: string; size?: number; rot?: number; children: React.ReactNode }> = ({ at, bg, color = C.bg, size = 56, rot = -3, children }) => {
  const st = useIn(at, 30);
  return <div style={{ ...st, transform: `${st.transform} rotate(${rot}deg)`, ...AR, fontWeight: 900, fontSize: size, color, background: bg,
    borderRadius: 999, padding: "4px 44px 14px", border: "5px solid #fff", boxShadow: "0 10px 0 rgba(0,0,0,0.25)" }}>{children}</div>;
};

/* generic app tiles (no brand logos — names only) */
const Tile: React.FC<{ at: number; bg: string; name: string; glyph: "slides" | "design"; ring?: number; check?: number }> = ({ at, bg, name, glyph, ring, check }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = ring !== undefined && f >= ring ? spring({ frame: f - ring, fps, config: house.spring.bouncy }) : 0;
  const c = check !== undefined && f >= check ? spring({ frame: f - check, fps, config: house.spring.bouncy }) : 0;
  return (
    <div style={{ ...useIn(at), position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ width: 300, height: 300, borderRadius: 72, background: `linear-gradient(145deg, ${bg}, ${bg}AA)`, border: "6px solid #fff",
        boxShadow: `0 14px 0 rgba(0,0,0,0.25), 0 0 ${60 * r}px ${C.coral}`, outline: r ? `${10 * r}px solid ${C.coral}` : undefined, outlineOffset: 10,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 100 100" width={190} height={190}>
          {glyph === "slides" ? <>
            <rect x={10} y={18} width={80} height={56} rx={8} fill="none" stroke="#fff" strokeWidth={7} />
            <rect x={24} y={46} width={10} height={18} fill="#fff" /><rect x={40} y={36} width={10} height={28} fill="#fff" /><rect x={56} y={28} width={10} height={36} fill="#fff" />
            <path d="M50 74 V88 M34 88 H66" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
          </> : <>
            <path d="M22 78 C 10 60 18 26 50 20 C 80 16 92 40 82 52 C 74 62 60 52 56 62 C 52 72 64 82 50 86 C 38 90 28 86 22 78 Z" fill="none" stroke="#fff" strokeWidth={7} />
            <circle cx={36} cy={42} r={7} fill="#fff" /><circle cx={56} cy={34} r={7} fill="#fff" /><circle cx={72} cy={44} r={7} fill="#fff" /><circle cx={32} cy={64} r={7} fill="#fff" />
          </>}
        </svg>
      </div>
      <div style={{ fontFamily: "CairoLatin", fontWeight: 900, fontSize: 58, color: C.text }}>{name}</div>
      {c > 0 && <div style={{ position: "absolute", top: -26, right: -26, width: 110, height: 110, borderRadius: 55, background: C.green, border: "6px solid #fff",
        transform: `scale(${c})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" width={70} height={70}><path d="M5 12.5 L10 17 L19 7" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>}
    </div>
  );
};

const Role: React.FC<{ at: number; icon: "mic" | "slides" | "bulb"; text: string; color: string }> = ({ at, icon, text, color }) => (
  <div style={{ ...useIn(at, 30), display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 30, width: 860 }}>
    <div style={{ width: 150, height: 150, borderRadius: 40, background: color, border: "6px solid #fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 100 100" width={96} height={96}>
        {icon === "mic" && <><rect x={36} y={10} width={28} height={50} rx={14} fill="#fff" /><path d="M24 46 C 24 76 76 76 76 46 M50 72 V90 M34 90 H66" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" /></>}
        {icon === "slides" && <><rect x={10} y={20} width={80} height={54} rx={8} fill="none" stroke="#fff" strokeWidth={7} /><path d="M44 36 L62 47 L44 58 Z" fill="#fff" /><path d="M50 74 V88" stroke="#fff" strokeWidth={7} /></>}
        {icon === "bulb" && <><path d="M50 10 C 26 10 18 40 34 56 C 40 62 40 66 40 72 H60 C 60 66 60 62 66 56 C 82 40 74 10 50 10 Z" fill="#fff" /><path d="M40 80 H60 M44 90 H56" stroke="#fff" strokeWidth={7} strokeLinecap="round" /></>}
      </svg>
    </div>
    <div style={{ ...TITLE, fontSize: 82, color: C.text, textAlign: "right", flex: 1 }}>{text}</div>
  </div>
);

const Swap: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const rot = Math.max(0, f - at) * 5;
  return (
    <div style={{ ...useIn(at), position: "relative", width: 420, height: 420 }}>
      <svg viewBox="-110 -110 220 220" width={420} height={420} style={{ transform: `rotate(${rot}deg)` }}>
        {[0, 120, 240].map((a, i) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M 0 -90 A 90 90 0 0 1 72 -54" fill="none" stroke={[C.coral, C.blue, C.yellow][i]} strokeWidth={14} strokeLinecap="round" />
            <path d="M 72 -54 l -26 -2 M 72 -54 l -6 -24" stroke={[C.coral, C.blue, C.yellow][i]} strokeWidth={14} strokeLinecap="round" />
          </g>
        ))}
      </svg>
      {[0, 1, 2].map((i) => {
        const a = (i * 120 - rot - 90) * Math.PI / 180;
        return <div key={i} style={{ position: "absolute", left: 210 + Math.cos(a) * 60 - 34, top: 210 + Math.sin(a) * 60 - 34, width: 68, height: 68, borderRadius: 34,
          background: [C.coral, C.blue, C.yellow][i], border: "5px solid #fff" }} />;
      })}
    </div>
  );
};

const Score: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = f < at ? 0 : spring({ frame: f - at, fps, config: { damping: 30, stiffness: 60 } });
  const n = Math.round(c * 20);
  const pop = f >= at + 22 ? spring({ frame: f - at - 22, fps, config: house.spring.bouncy }) : 0;
  return (
    <div style={{ ...useIn(at), fontFamily: "Lalezar, CairoLatin", fontSize: 330, lineHeight: 1, color: n === 20 ? C.green : C.text, direction: "ltr",
      transform: `scale(${1 + (1 - pop) * 0.12 * (pop > 0 ? 1 : 0)})`, textShadow: n === 20 ? `0 0 60px ${C.green}88` : "none", fontVariantNumeric: "tabular-nums" }}>
      {n}<span style={{ fontSize: 160, color: C.sub }}>/20</span>
    </div>
  );
};

/* ---------- the cards on the timeline (source seconds) ---------- */
const Cards: React.FC = () => (
  <>
    <Card from={0} to={o(2.25) - 1}>
      <Label at={3}>سؤال من عندكم</Label>
      <Big at={6} size={150}>كيفاش نديرو</Big>
      <Big at={11} size={170} color={C.coral}><span style={{ direction: "ltr", unicodeBidi: "isolate" }}>exposé ?</span></Big>
    </Card>
    <Card from={o(6.3)} to={o(8.35)} tint={C.blue}>
      <Label at={o(6.3) + 3}>01 · الفوج</Label>
      <div style={{ position: "relative", width: 900, height: 470 }}>
        {[[200, C.coral, "#3B2416", 0], [450, C.blue, "#1B1530", 5], [700, C.yellow, "#6B3A1E", 10]].map(([x, sh, h, d], i) => (
          <PersonPop key={i} at={o(6.75) + (d as number)} x={x as number} shirt={sh as string} hair={h as string} skin={i === 1 ? "#C98A62" : undefined} />
        ))}
      </div>
      <Pill at={o(6.8) + 12} bg={C.yellow} size={64}>2 ولا 3</Pill>
    </Card>
    <Card from={o(9.6)} to={o(13.25)} tint={C.purple}>
      <Label at={o(9.6) + 3}>02 · التحضير</Label>
      <div style={{ display: "flex", gap: 90, direction: "ltr" }}>
        <Tile at={o(9.9)} bg="#E8692F" name="PowerPoint" glyph="slides" />
        <Tile at={o(11.0)} bg="#7B4DFF" name="Canva" glyph="design" ring={o(12.7)} />
      </div>
      <Pill at={o(12.75)} bg={C.coral} color="#fff" size={60} rot={3}>أنا نصحكم بـ Canva</Pill>
    </Card>
    <Card from={o(13.3)} to={o(15.2)} tint={C.green}>
      <Big at={o(13.3) + 2} size={170} color={C.green}>خير</Big>
      <Big at={o(14.0)} size={150}>وساهل كثر</Big>
      <Sparkles at={o(13.6)} x={540} y={760} color={C.yellow} />
    </Card>
    <Card from={o(16.75)} to={o(18.45)} tint="#E8692F">
      <Tile at={o(16.8)} bg="#E8692F" name="PowerPoint" glyph="slides" check={o(17.9)} />
      <Pill at={o(17.9)} bg={C.green} color="#fff" size={60}>ماشي مشكل</Pill>
    </Card>
    <Card from={o(22.3)} to={o(25.35)} tint={C.coral}>
      <Label at={o(22.3) + 3}>03 · قدّام البروف</Label>
      <Role at={o(22.4)} icon="mic" text="واحد يهدر" color={C.coral} />
      <Role at={o(23.1)} icon="slides" text="واحد يقلّب" color={C.blue} />
      <Role at={o(24.6)} icon="bulb" text="واحد يفهّم" color="#D9A21A" />
    </Card>
    <Card from={o(25.35)} to={o(27.25)} tint={C.yellow}>
      <Swap at={o(25.4)} />
      <Big at={o(25.6)} size={130}>تبادلوا الأدوار</Big>
    </Card>
    <Card from={o(30.3)} to={o(33.85)} tint={C.green}>
      <Label at={o(30.3) + 3}>النتيجة</Label>
      <Score at={o(30.5)} />
      <Pill at={o(32.4)} bg={C.yellow} size={70}>ساهلة!</Pill>
      <Sparkles at={o(31.3)} x={540} y={800} color={C.green} />
    </Card>
    <Card from={o(33.85)} to={EXPOSE_FRAMES}>
      <Big at={o(33.85) + 2} size={150}>بالتوفيق!</Big>
      <Big at={o(33.85) + 8} size={120} color={C.coral}>في الـ <span style={{ unicodeBidi: "isolate" }}>exposé</span></Big>
    </Card>
  </>
);
const PersonPop: React.FC<{ at: number; x: number; shirt: string; hair: string; skin?: string }> = ({ at, x, shirt, hair, skin }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: house.spring.bouncy });
  return <div style={{ position: "absolute", inset: 0, transform: `scale(${p})`, transformOrigin: `${x}px 470px` }}>
    <Person x={x} feet={470} shirt={shirt} hair={hair} skin={skin} scale={0.95} armR={-150 + Math.sin(f / 4) * 20} face={0} />
  </div>;
};

/* ---------- captions ---------- */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cur = CAPS.find(([a, b]) => f >= o(a) && f < o(b) + 4);
  if (!cur) return null;
  const [a, b, text] = cur;
  const A = o(a), B = o(b);
  const words = text.split(" ");
  const p = spring({ frame: f - A, fps, config: house.spring.snappy });
  const active = Math.min(words.length - 1, Math.floor(((f - A) / Math.max(1, B - A)) * words.length));
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1600, display: "flex", justifyContent: "center",
      opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 20px", direction: "rtl", padding: "4px 34px 12px",
        background: "rgba(14,11,10,0.8)", borderRadius: 26, border: "3px solid rgba(255,255,255,0.9)" }}>
        {words.map((w, i) => (
          <span key={i} style={{ ...AR, fontWeight: 900, fontSize: 70, lineHeight: 1.5, unicodeBidi: "isolate", color: i === active ? C.coral : "#fff" }}>{w}</span>
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
    <Audio src={staticFile("sfx/bed36.wav")} volume={(fr) => interpolate(fr, [0, 12, EXPOSE_FRAMES - 60, EXPOSE_FRAMES - 45, EXPOSE_FRAMES - 3], [0, 0.06, 0.06, 0.2, 0], clamp)} />
    {[0, o(6.3), o(9.6), o(13.3), o(16.75), o(22.3), o(25.35), o(30.3), o(33.85)].map((t) => <Sfx key={`w${t}`} at={t - 2} src="swipe" />)}
    {[o(6.75), o(6.75) + 5, o(6.75) + 10, o(9.9), o(11.0), o(12.75), o(22.4), o(23.1), o(24.6), o(32.4)].map((t) => <Sfx key={`p${t}`} at={t - 1} src="pop" v={0.26} />)}
    {[o(12.7), o(17.9), o(31.3)].map((t) => <Sfx key={`d${t}`} at={t} src="ding" v={0.3} />)}
    {Array.from({ length: 10 }).map((_, i) => <Sfx key={`t${i}`} at={o(30.5) + i * 2} src="tick" v={0.22} />)}
    <Sfx at={o(17.9)} src="check" v={0.35} />
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
    <AbsoluteFill style={{ background: C.bg }}>
      <Footage />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 70%, rgba(14,11,10,0.55))" }} />
      <Cards />
      <Captions />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [EXPOSE_FRAMES - 8, EXPOSE_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
