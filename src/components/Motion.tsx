import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";

type SpringCfg = (typeof theme.spring)[keyof typeof theme.spring];

/** Fade + rise + scale entrance (2–3 properties, never a lone fade). */
export const Rise: React.FC<{ delay?: number; dist?: number; cfg?: SpringCfg; children: React.ReactNode;
  style?: React.CSSProperties }> = ({ delay = 0, dist = 50, cfg = theme.spring.snappy, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: cfg });
  return (
    <div style={{ opacity: interpolate(p, [0, 0.6], [0, 1], clamp),
      transform: `translateY(${interpolate(p, [0, 1], [dist, 0])}px) scale(${interpolate(p, [0, 1], [0.86, 1])})`,
      ...style }}>{children}</div>
  );
};

/** Word-by-word slam reveal, 3-frame stagger. */
export const WordSlam: React.FC<{ text: string; delay?: number; per?: number; style?: React.CSSProperties;
  gap?: number }> = ({ text, delay = 0, per = 3, style, gap = 22 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: gap, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.slam });
        return (
          <span key={i} style={{ display: "inline-block", opacity: interpolate(p, [0, 0.5], [0, 1], clamp),
            transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px) scale(${interpolate(p, [0, 1], [1.5, 1])})` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Pill that scales in behind a highlighted word ~5 frames after it lands. */
export const Pill: React.FC<{ delay: number; color: string; children: React.ReactNode; pad?: string;
  rotate?: number }> = ({ delay, color, children, pad = "0 26px", rotate = -2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  return (
    <span style={{ position: "relative", display: "inline-block", padding: pad }}>
      <span style={{ position: "absolute", inset: 0, background: color, borderRadius: 22,
        transform: `rotate(${rotate}deg) scaleX(${p})`, transformOrigin: "0% 50%" }} />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};

/** Deterministic confetti burst. */
export const Confetti: React.FC<{ at: number; count?: number; radius?: number }> = ({ at, count = 22, radius = 640 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - at;
  if (t < 0 || t > 60) return null;
  const colors = [theme.colors.primary, theme.colors.accent, theme.colors.paper];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const p = spring({ frame: t - (i % 4), fps, config: theme.spring.smooth });
        const ang = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
        const r = radius * (0.65 + ((i * 37) % 10) / 28) * p;
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r + t * t * 0.12;
        const o = interpolate(t, [36, 60], [1, 0], { ...clamp, easing: theme.ease.in });
        const w = i % 2 ? 26 : 16;
        return (
          <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: w, height: i % 2 ? 12 : 16,
            borderRadius: i % 3 === 0 ? "50%" : 4, background: colors[i % 3], opacity: o * Math.min(1, p * 3),
            transform: `translate(${x - w / 2}px, ${y}px) rotate(${t * (8 + (i % 5) * 4)}deg)` }} />
        );
      })}
    </>
  );
};
