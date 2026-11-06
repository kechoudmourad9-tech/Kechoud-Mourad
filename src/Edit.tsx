import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { BgMesh, Grade, Grain, Vignette } from "./components/Layers";
import { useFonts } from "./components/Fonts";
import { HeadCover } from "./components/HeadCover";
import { Confetti, Pill, Rise, WordSlam } from "./components/Motion";
import { clamp, theme } from "./theme";

const c = theme.colors;
const s = (sec: number, fps: number) => Math.round(sec * fps);

// Beat map (seconds) — aligned on the speech + silences found in the clip.
export const BEATS = {
  hook: 0, nouveaux: 1.33, anciens: 4.8, saison: 6.2, date: 9.3, dateOut: 14.6,
  tag1: 14.95, tag2: 17.9, cta: 20.8, end: 24.27,
};

const display: React.CSSProperties = { fontFamily: theme.fonts.display, lineHeight: 0.92, letterSpacing: "-0.01em",
  textTransform: "uppercase" };
const body: React.CSSProperties = { fontFamily: theme.fonts.body, fontWeight: 800, letterSpacing: "0.04em",
  textTransform: "uppercase" };

/* ---------- footage + head-tracked cards (share one transform so cards stay glued to the head) ---------- */
const Footage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const B = Object.fromEntries(Object.entries(BEATS).map(([k, v]) => [k, s(v, fps)])) as Record<keyof typeof BEATS, number>;
  // slow push-in while graphics cover the head, release when the face is back, push again on the CTA
  const zoom =
    interpolate(frame, [0, B.date], [1, 1.07], { ...clamp, easing: theme.ease.inOut }) -
    interpolate(frame, [B.dateOut - 4, B.dateOut + 14], [0, 0.07], { ...clamp, easing: theme.ease.out }) +
    interpolate(frame, [B.cta, B.end], [0, 0.06], { ...clamp, easing: theme.ease.inOut });
  // impact shake on the payoff + CTA
  const shake = (at: number) => {
    const t = frame - at;
    return t < 0 || t > 14 ? 0 : Math.sin(t * 2.4) * 14 * Math.exp(-t / 4);
  };
  const sh = shake(B.date) + shake(B.cta);

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${sh}px, ${sh * 0.6}px)` }}>
      <OffthreadVideo src={staticFile("clip.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover",
        filter: "saturate(1.12) contrast(1.06)" }} />

      {/* 1 — HOOK */}
      <HeadCover from={B.hook} to={B.nouveaux + 6} color={c.primary} rotate={-4}>
        <Rise delay={2}><div style={{ ...body, fontSize: 64, color: c.ink }}>C'est la</div></Rise>
        <WordSlam text="RENTRÉE" delay={5} style={{ ...display, fontSize: 210, color: c.ink, marginTop: 10 }} />
        <Rise delay={14}><div style={{ ...body, fontSize: 40, color: c.ink, marginTop: 24, opacity: 0.75 }}>
          ● Saison 2026 ●</div></Rise>
      </HeadCover>

      {/* 2 — NOUVEAUX ÉTUDIANTS */}
      <HeadCover from={B.nouveaux} to={B.anciens + 6} color={c.paper} rotate={3} border={`10px solid ${c.ink}`}>
        <Rise delay={3}><div style={{ ...body, fontSize: 54, color: c.ink }}>Bienvenue aux</div></Rise>
        <div style={{ ...display, fontSize: 150, color: c.paper, marginTop: 18 }}>
          <Pill delay={12} color={c.accent}><WordSlam text="NOUVEAUX" delay={7} /></Pill>
        </div>
        <WordSlam text="ÉTUDIANTS" delay={16} style={{ ...display, fontSize: 150, color: c.ink, marginTop: 14 }} />
      </HeadCover>

      {/* 3 — & ANCIENS */}
      <HeadCover from={B.anciens} to={B.saison + 6} color={c.accent} rotate={-5}>
        <Rise delay={2}><div style={{ ...display, fontSize: 150, color: c.paper }}>&amp; aux</div></Rise>
        <WordSlam text="ANCIENS" delay={6} style={{ ...display, fontSize: 220, color: c.paper, marginTop: 6 }} />
      </HeadCover>

      {/* 4 — LA SAISON COMMENCE LE… */}
      <HeadCover from={B.saison} to={B.date + 8} color={c.bgAlt} rotate={2} border={`10px solid ${c.paper}`}>
        <WordSlam text="LA SAISON" delay={3} style={{ ...display, fontSize: 150, color: c.paper }} />
        <WordSlam text="COMMENCE" delay={10} style={{ ...display, fontSize: 170, color: c.primary, marginTop: 10,
          textShadow: `0 0 60px ${c.glow}` }} />
        <Dots from={B.saison + 22} />
      </HeadCover>

      {/* 5 — PAYOFF: 19 SEPTEMBRE calendar */}
      <HeadCover from={B.date} to={B.dateOut} color={c.paper} rotate={-3} exit h={1.3}
        border={`10px solid ${c.ink}`}>
        <CalendarBody at={B.date} />
      </HeadCover>
      <Sequence from={B.date} durationInFrames={70}>
        <AbsoluteFill style={{ top: -330 }}><Confetti at={0} /></AbsoluteFill>
      </Sequence>

      {/* 6 — CTA */}
      <HeadCover from={B.cta} to={B.end + 10} color={c.primary} rotate={-3}>
        <WordSlam text="ON VOUS" delay={3} style={{ ...display, fontSize: 170, color: c.ink }} />
        <WordSlam text="ATTEND !" delay={9} style={{ ...display, fontSize: 210, color: c.ink, marginTop: 8 }} />
      </HeadCover>
    </AbsoluteFill>
  );
};

const Dots: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 26, marginTop: 34 }}>
      {[0, 1, 2].map((i) => {
        const p = spring({ frame: frame - from - i * 5, fps, config: theme.spring.bouncy });
        const bob = Math.sin((frame - i * 6) / 5) * 8 * p;
        return <div key={i} style={{ width: 34, height: 34, borderRadius: 17, background: c.paper,
          transform: `scale(${p}) translateY(${bob}px)` }} />;
      })}
    </div>
  );
};

const CalendarBody: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = spring({ frame: frame - at - 4, fps, config: { damping: 30, stiffness: 70 } });
  const n = Math.max(1, Math.round(interpolate(count, [0, 1], [1, 19])));
  const land = spring({ frame: frame - at - 26, fps, config: theme.spring.bouncy });
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", height: "24%", background: c.accent, display: "flex", alignItems: "center",
        justifyContent: "center", position: "relative" }}>
        {[0.22, 0.78].map((x) => (
          <div key={x} style={{ position: "absolute", left: `${x * 100}%`, top: -20, width: 34, height: 80,
            borderRadius: 17, background: c.ink, transform: "translateX(-50%)" }} />
        ))}
        <Rise delay={8}><div style={{ ...display, fontSize: 120, color: c.paper }}>Septembre</div></Rise>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...display, fontSize: 470, color: c.ink, fontVariantNumeric: "tabular-nums",
          transform: `scale(${1 + (1 - land) * 0.08 * (frame > at + 26 ? 1 : 0)})` }}>{n}</div>
        <div style={{ transform: `scale(${land})`, opacity: land }}>
          <Pill delay={at + 30} color={c.ink} pad="8px 30px" rotate={0}>
            <span style={{ ...body, fontSize: 48, color: c.primary }}>Jour J</span>
          </Pill>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- graphics that live outside the head area (face is visible here) ---------- */
const Tag: React.FC<{ from: number; dur: number; color: string; ink: string; children: React.ReactNode;
  rotate?: number; top?: number }> = ({ from, dur, color, ink, children, rotate = -2, top = 1460 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  if (t < 0 || t > dur) return null;
  const p = spring({ frame: t, fps, config: theme.spring.bouncy });
  const out = interpolate(t, [dur - 9, dur], [0, 1], { ...clamp, easing: theme.ease.in });
  const float = Math.sin(t / 12) * 5;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center",
      transform: `translateY(${interpolate(p, [0, 1], [120, 0]) + out * 80 + float}px) rotate(${rotate + (1 - p) * -10}deg) scale(${interpolate(p, [0, 1], [0.6, 1])})`,
      opacity: Math.min(1, p * 2) * (1 - out) }}>
      <div style={{ background: color, color: ink, borderRadius: 30, padding: "26px 46px",
        boxShadow: "0 30px 60px -18px rgba(0,0,0,0.6)", border: `6px solid ${ink}`, maxWidth: 940 }}>
        {children}
      </div>
    </div>
  );
};

const Overlays: React.FC = () => {
  const { fps } = useVideoConfig();
  const B = (k: keyof typeof BEATS) => s(BEATS[k], fps);
  return (
    <>
      <Tag from={B("tag1")} dur={B("tag2") - B("tag1") - 2} color={c.paper} ink={c.ink} rotate={-2}>
        <div style={{ ...display, fontSize: 92, textAlign: "center" }}>
          Nouveaux <span style={{ color: c.accent }}>•</span> Anciens</div>
        <div style={{ ...body, fontSize: 36, textAlign: "center", marginTop: 10 }}>Tout le monde est concerné</div>
      </Tag>
      <Tag from={B("tag2")} dur={B("cta") - B("tag2") - 2} color={c.primary} ink={c.ink} rotate={2}>
        <div style={{ ...body, fontSize: 38, textAlign: "center" }}>Note la date</div>
        <div style={{ ...display, fontSize: 130, textAlign: "center", marginTop: 4 }}>19.09</div>
      </Tag>
      <Tag from={B("cta") + 24} dur={B("end") - B("cta")} color={c.accent} ink={c.paper} rotate={-2} top={1500}>
        <div style={{ ...body, fontSize: 46, textAlign: "center" }}>Abonne-toi pour la suite</div>
      </Tag>
    </>
  );
};

/* ---------- sound design: SFX 2–3 frames before each visual lands ---------- */
const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.6 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={45}>
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
  </Sequence>
);

const Sound: React.FC = () => {
  const { fps } = useVideoConfig();
  const B = (k: keyof typeof BEATS) => s(BEATS[k], fps);
  const ticks = Array.from({ length: 10 }, (_, i) => B("date") + 5 + i * 2);
  return (
    <>
      <Audio src={staticFile("sfx/track.wav")}
        volume={(f) => interpolate(f, [0, 30, 40, 700, 728], [0.32, 0.32, 0.14, 0.14, 0], clamp)} />
      <Sfx at={0} src="whoosh" volume={0.7} />
      <Sfx at={3} src="pop" />
      <Sfx at={B("nouveaux") - 3} src="whoosh" volume={0.55} />
      <Sfx at={B("nouveaux") + 9} src="pop" volume={0.5} />
      <Sfx at={B("anciens") - 3} src="whoosh" volume={0.55} />
      <Sfx at={B("anciens") + 4} src="pop" volume={0.5} />
      <Sfx at={B("saison") - 3} src="whoosh" volume={0.5} />
      <Sfx at={B("date") - 2} src="bass" volume={0.8} />
      {ticks.map((t) => <Sfx key={t} at={t} src="tick" volume={0.35} />)}
      <Sfx at={B("date") + 26} src="pop" volume={0.6} />
      <Sfx at={B("dateOut") - 11} src="whoosh" volume={0.5} />
      <Sfx at={B("tag1") - 2} src="pop" volume={0.5} />
      <Sfx at={B("tag2") - 2} src="pop" volume={0.5} />
      <Sfx at={B("cta") - 3} src="whoosh" volume={0.6} />
      <Sfx at={B("cta") - 1} src="bass" volume={0.7} />
      <Sfx at={B("cta") + 22} src="pop" volume={0.55} />
    </>
  );
};

export const Edit: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill style={{ background: c.bg }}>
      <BgMesh />
      <Footage />
      <Overlays />
      <Grade />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: c.bg, opacity: fadeOut }} />
      <Sound />
    </AbsoluteFill>
  );
};
