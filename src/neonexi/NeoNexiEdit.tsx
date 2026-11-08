// "ACTE I — La vengeance de la Neo Nexi Company": polish pass on the user's own trailer.
// Music and cut timing are kept untouched; we upscale/grade the footage (public/neonexi/src.mp4),
// replace the dead black frames and small default-font text with animated typography,
// add French subtitles for the English narration, push-ins, impacts and an end title.
import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp, theme } from "../theme";

const FPS = 30;
const s = (t: number) => Math.round(t * FPS);
const SRC = 80.0;
export const NEONEXI_FRAMES = s(84.6);
const C = { violet: "#8B5CFF", blue: "#3DA2FF", pink: "#FF3DB8", ice: "#E4ECFF", gold: "#FFD27A" };
const ease = theme.ease;

/* ---------- footage + slow push-ins on the held shots ---------- */
const PUSH: [number, number][] = [[20, 23], [29.4, 32], [33, 36], [39, 42.9], [48, 52], [60, 65]];
const Footage: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const r = PUSH.find(([a, b]) => t >= a && t < b);
  const z = r ? interpolate(t, r, [1.0, 1.07], { ...clamp, easing: ease.inOut }) : 1;
  return (
    <AbsoluteFill style={{ transform: `scale(${z})` }}>
      <OffthreadVideo src={staticFile("neonexi/src.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

/* ---------- black card with neon atmosphere (covers the dead black frames) ---------- */
const Card: React.FC<{ a: number; b: number; children: React.ReactNode; glow?: string }> = ({ a, b, children, glow = C.violet }) => {
  const f = useCurrentFrame();
  if (f < s(a) || f >= s(b)) return null;
  const t = f - s(a);
  const out = interpolate(f, [s(b) - 6, s(b)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#05030B", opacity: Math.min(1, t / 4) }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, ${glow}30, transparent 60%)`, opacity: out }} />
      <AbsoluteFill style={{ opacity: 0.08 * out, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "80px 80px", backgroundPosition: `0 ${t * 0.8}px`, maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)" }} />
      <AbsoluteFill style={{ opacity: out }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Line: React.FC<{ at: number; text: string; size?: number; y?: number; color?: string; font?: string; spacing?: [number, number]; italic?: boolean }> = ({
  at, text, size = 70, y = 540, color = C.ice, font = "Rajdhani", spacing = [30, 8], italic,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - s(at), [0, 28], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: y, transform: "translateY(-50%)", textAlign: "center", fontFamily: font, fontWeight: 700,
      fontStyle: italic ? "italic" : undefined, fontSize: size, color, letterSpacing: interpolate(p, [0, 1], spacing), opacity: p, filter: `blur(${(1 - p) * 8}px)`,
      textShadow: `0 0 30px ${C.violet}aa` }}>{text}</div>
  );
};

/* glitch logo (36–39 s) */
const GlitchLogo: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const t = f - s(at);
  const g = t < 12 || (t > 50 && t < 56) ? 1 : 0;
  const j = (k: number) => (g ? Math.sin(t * 7 + k) * 14 : 0);
  const word = (color: string, dx: number, blend?: React.CSSProperties["mixBlendMode"]) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 500, transform: `translate(${dx}px,-50%)`, textAlign: "center", fontFamily: "Orbitron", fontWeight: 900,
      fontSize: 190, letterSpacing: 30, color, mixBlendMode: blend }}>NEO NEXI</div>
  );
  return (
    <>
      {word(C.pink, j(1) - 6, "screen")}
      {word(C.blue, j(2) + 6, "screen")}
      {word("#ffffff", 0)}
      {g ? [0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 400 + ((i * 97 + t * 31) % 220), height: 14 + i * 6,
        background: i % 2 ? C.pink : C.blue, opacity: 0.35, mixBlendMode: "screen" }} />) : null}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 5px)" }} />
      <Line at={at + 0.6} text="— COMPANY —" size={40} y={680} color={C.ice} spacing={[40, 26]} />
    </>
  );
};

/* project loading (55–60 s): lands on 100 % exactly on the poster cut */
const Loading: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [s(a) + 6, s(b) - 4], [0, 1], { ...clamp, easing: ease.inOut });
  const n = Math.round(p * 100);
  const shake = p > 0.9 ? Math.sin(f * 3) * 6 * (p - 0.9) * 10 : 0;
  return (
    <div style={{ position: "absolute", left: 360, right: 360, top: 400, transform: `translateX(${shake}px)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani", fontWeight: 700, color: C.ice, fontSize: 34, letterSpacing: 10 }}>
        <span>CHARGEMENT DU PROJET</span><span style={{ fontVariantNumeric: "tabular-nums", color: n === 100 ? C.gold : C.blue }}>{n} %</span>
      </div>
      <div style={{ marginTop: 22, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.12)", overflow: "hidden", border: `1px solid ${C.blue}66` }}>
        <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.violet}, ${C.blue}, ${C.pink})`, boxShadow: `0 0 24px ${C.blue}` }} />
      </div>
      <div style={{ marginTop: 26, fontFamily: "Orbitron", fontWeight: 700, fontSize: 30, letterSpacing: 18, color: C.violet, textAlign: "center",
        opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 8)) }}>G · A · L · A · T · I · A</div>
    </div>
  );
};

/* typewriter (65–69 s) */
const Typewriter: React.FC<{ a: number; text: string }> = ({ a, text }) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [s(a) + 4, s(a) + 4 + text.length * 2.2], [0, text.length], clamp));
  return (
    <div style={{ position: "absolute", left: 100, right: 100, top: 540, transform: "translateY(-50%)", textAlign: "center", fontFamily: "Cinzel", fontWeight: 700,
      fontSize: 82, color: C.ice, textShadow: `0 0 30px ${C.violet}` }}>
      {text.slice(0, n)}<span style={{ opacity: f % 20 < 10 ? 1 : 0, color: C.pink }}>|</span>
    </div>
  );
};

/* release timeline (69–78 s) */
const Timeline: React.FC<{ items: [number, string, string][] }> = ({ items }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const first = s(items[0][0]);
  const lineH = interpolate(f, [first, s(items[items.length - 1][0]) + 10], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div style={{ position: "absolute", left: 560, top: 300, width: 900, height: 480 }}>
      <div style={{ position: "absolute", left: 20, top: 20, width: 4, height: 440 * lineH, background: `linear-gradient(180deg, ${C.violet}, ${C.pink})`, boxShadow: `0 0 18px ${C.violet}` }} />
      {items.map(([t, year, label], i) => {
        const p = f < s(t) ? 0 : spring({ frame: f - s(t), fps, config: theme.spring.snappy });
        return (
          <div key={year} style={{ position: "absolute", left: 0, top: i * 190, display: "flex", alignItems: "center", gap: 40, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: [C.violet, C.blue, C.pink][i], border: "5px solid #fff", boxShadow: `0 0 26px ${[C.violet, C.blue, C.pink][i]}`,
              transform: `scale(${p})` }} />
            <div>
              <div style={{ fontFamily: "Orbitron", fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: 8 }}>{year}</div>
              <div style={{ fontFamily: "Rajdhani", fontWeight: 700, fontSize: 44, color: C.ice, letterSpacing: 3, opacity: 0.9 }}>{label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EndTitle: React.FC<{ a: number }> = ({ a }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - s(a);
  const p = spring({ frame: t, fps, config: { damping: 24, stiffness: 70, mass: 1.2 } });
  const sweep = interpolate(t, [8, 70], [-20, 130], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, transform: `translateY(-50%) scale(${interpolate(p, [0, 1], [1.15, 1])})`, textAlign: "center",
        fontFamily: "Orbitron", fontWeight: 900, fontSize: 190, letterSpacing: interpolate(p, [0, 1], [70, 36]), opacity: p,
        backgroundImage: `linear-gradient(100deg, ${C.violet} 0%, #ffffff ${sweep - 8}%, #ffffff ${sweep}%, ${C.blue} ${sweep + 8}%, ${C.pink} 100%)`,
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: `drop-shadow(0 0 30px ${C.violet}aa)` }}>GALATIA</div>
      <Line at={a + 0.9} text="ACTE I" size={46} y={640} color={C.pink} spacing={[50, 30]} />
      <Line at={a + 1.4} text="La vengeance de la Neo Nexi Company" size={52} y={720} spacing={[20, 6]} font="Cinzel" />
    </>
  );
};

/* ---------- subtitles for the English narration ---------- */
const SUBS: [number, number, string][] = [
  [0.2, 5.3, "Parlons maintenant de la société Neo Nexi,"],
  [5.4, 10.6, "un nom qui résonnait autrefois de puissance et d'innovation,"],
  [10.9, 15.9, "et qui n'est plus aujourd'hui qu'un faible murmure, perdu dans le temps."],
];
const Subs: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cur = SUBS.find(([a, b]) => t >= a && t < b);
  if (!cur) return null;
  const o = interpolate(t, [cur[0], cur[0] + 0.25, cur[1] - 0.25, cur[1]], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: "Cormorant Garamond", fontStyle: "italic", fontWeight: 600,
      fontSize: 42, color: "#fff", opacity: o, textShadow: "0 2px 8px #000" }}>{cur[2]}</div>
  );
};

/* ---------- finishing ---------- */
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "240px", backgroundPosition: `${(f * 53) % 240}px ${(f * 97) % 240}px`, opacity: 0.08, mixBlendMode: "overlay" }} />;
};
const HITS = [6.0, 16.0, 20.0, 25.0, 28.0, 29.5, 36.0, 39.0, 43.0, 45.0, 46.45, 53.0, 55.0, 60.0, 65.0, 69.2, 70.8, 72.5, 78.0, 80.6];
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  let v = 0;
  for (const h of [25.0, 60.0, 80.6]) { const d = f - s(h); if (d >= 0 && d < 10) v = Math.max(v, 1 - d / 10); }
  return <AbsoluteFill style={{ background: "#fff", opacity: v * 0.6, mixBlendMode: "screen", pointerEvents: "none" }} />;
};
const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60}><Audio src={staticFile(src)} volume={v} /></Sequence>
);

export const NeoNexiEdit: React.FC = () => {
  useFontFaces([
    ["Orbitron", "fonts/orbitron-latin-900-normal.woff2", "900"],
    ["Orbitron", "fonts/orbitron-latin-700-normal.woff2", "700"],
    ["Rajdhani", "fonts/rajdhani-latin-700-normal.woff2", "700"],
    ["Cinzel", "fonts/cinzel-latin-700-normal.woff2", "700"],
    ["Cormorant Garamond", "fonts/cormorant-garamond-latin-600-italic.woff2", "600"],
  ]);
  const f = useCurrentFrame();
  const typeTicks = Array.from({ length: 16 }, (_, i) => s(65) + 4 + Math.round(i * 4.4));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < s(SRC) && <Footage />}
      {/* opening title over the smoke */}
      {f >= s(0.8) && f < s(5.8) && <>
        <Line at={0.8} text="NEO NEXI PRÉSENTE" size={30} y={420} color={C.ice} spacing={[40, 22]} />
        <Line at={1.6} text="ACTE I" size={130} y={530} color="#fff" spacing={[60, 30]} font="Orbitron" />
      </>}
      <Card a={16.0} b={20.0}><Line at={16.3} text="Quelques mois plus tard…" size={84} font="Cinzel" spacing={[24, 6]} /></Card>
      <Card a={36.0} b={39.0} glow={C.blue}><GlitchLogo at={36.0} /></Card>
      <Card a={45.0} b={46.45}><Line at={45.1} text="« Le monde verra que nous en sommes capables. »" size={62} font="Cinzel" spacing={[14, 2]} /></Card>
      <Card a={46.45} b={48.0} glow={C.pink}><Line at={46.5} text="« Nous aurons besoin de votre aide. »" size={70} font="Cinzel" spacing={[14, 2]} /></Card>
      <Card a={55.0} b={60.0} glow={C.blue}><Loading a={55.0} b={60.0} /></Card>
      <Card a={65.0} b={69.0}><Typewriter a={65.0} text="Le plus gros projet jamais réalisé." /></Card>
      <Card a={69.0} b={78.0}>
        <Timeline items={[[69.2, "2027", "Galatia — live event"], [70.8, "2028", "Galatia — L'aventure de Neo Nexi"], [72.5, "2029", "Galatia — la BD"]]} />
      </Card>
      <Card a={78.0} b={80.6} glow={C.violet}><Line at={78.1} text="Phantom Wilds" size={110} font="Cinzel" spacing={[30, 12]} color="#fff" /></Card>
      <Card a={80.6} b={84.6} glow={C.violet}><EndTitle a={80.6} /></Card>
      <Flash />
      <Grain />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 92, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 92, background: "#000" }} />
      <Subs />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [NEONEXI_FRAMES - 18, NEONEXI_FRAMES - 1], [0, 1], clamp) }} />
      {/* sound: original track untouched (inside src.mp4); impacts layered underneath */}
      {HITS.map((h) => <Sfx key={h} at={s(h) - 2} src={h === 60.0 || h === 80.6 ? "sfx/bass.wav" : "sfx/whoosh.wav"} v={h === 60.0 || h === 80.6 ? 0.55 : 0.22} />)}
      {[60.0, 80.6, 25.0].map((h) => <Sfx key={`i${h}`} at={s(h)} src="sfx/pop.wav" v={0.2} />)}
      {typeTicks.map((t) => <Sfx key={`t${t}`} at={t} src="sfx/tick.wav" v={0.18} />)}
      {Array.from({ length: 12 }).map((_, i) => <Sfx key={`l${i}`} at={s(55.3) + i * 12} src="sfx/tick.wav" v={0.15} />)}
      <Sequence from={s(80.6)} durationInFrames={s(4.0)}>
        <Audio src={staticFile("galatia/score.wav")} startFrom={s(34.4)} volume={(fr) => interpolate(fr, [0, 6, s(3.4), s(4.0)], [0, 0.75, 0.75, 0], clamp)} />
      </Sequence>
    </AbsoluteFill>
  );
};
