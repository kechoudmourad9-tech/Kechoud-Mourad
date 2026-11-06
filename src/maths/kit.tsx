// Motion kit for the maths voice-over edit: full-screen scenes, KaTeX formulas that "write"
// themselves, self-drawing arrows / boxes, chests and the token. Black bg, white formulas,
// pink + blue accents.
import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill, continueRender, delayRender, interpolate, spring, useCurrentFrame, useVideoConfig,
} from "remotion";
import { clamp, theme } from "../theme";

export const M = {
  bg: "#000000",
  white: "#FFFFFF",
  pink: "#FF4FA3",
  blue: "#3D8BFF",
  dim: "#8C90A6",
  pinkGlow: "rgba(255,79,163,0.45)",
  blueGlow: "rgba(61,139,255,0.45)",
  ease: theme.ease,
  spring: theme.spring,
  display: "Anton",
  body: "InterX",
} as const;

export const sec = (s: number) => Math.round(s * 30);

/* ---------------- formula ---------------- */
export const Tex: React.FC<{
  tex: string; at: number; dur?: number; size?: number; color?: string; x?: number; y: number;
  box?: { at: number; color: string }; glow?: string; until?: number; maxW?: number;
}> = ({ tex, at, dur = 22, size = 72, color = M.white, x = 540, y, box, glow, until, maxW = 940 }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    // KaTeX renders at 1.21em: shrink any formula wider than the safe width so nothing leaves the frame
    const w = ref.current?.scrollWidth ?? 0;
    if (w > 0) setFit(Math.min(1, maxW / w));
  });
  const { fps } = useVideoConfig();
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, displayMode: false }), [tex]);
  const [h] = useState(() => delayRender("katex fonts"));
  useEffect(() => {
    // re-measure once the KaTeX fonts are in, then let the frame render
    document.fonts.ready.then(() => {
      const w = ref.current?.scrollWidth ?? 0;
      if (w > 0) setFit(Math.min(1, maxW / w));
      requestAnimationFrame(() => continueRender(h));
    });
  }, [h, maxW]);
  const hidden = frame < at - 1 || (until !== undefined && frame >= until);
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: M.ease.out });
  const lift = spring({ frame: frame - at, fps, config: M.spring.smooth });
  const bp = box ? interpolate(frame, [box.at, box.at + 16], [0, 1], { ...clamp, easing: M.ease.out }) : 0;
  const fade = until !== undefined ? interpolate(frame, [until - 8, until], [1, 0], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) translateY(${(1 - lift) * 26}px) scale(${fit})`,
      opacity: hidden ? 0 : fade, whiteSpace: "nowrap" }}>
      <div ref={ref} style={{ position: "relative", display: "inline-block", fontSize: size, color,
        clipPath: `inset(-40% ${(1 - p) * 100}% -40% -5%)`,
        textShadow: glow ? `0 0 30px ${glow}` : "0 0 18px rgba(255,255,255,0.18)" }}
        dangerouslySetInnerHTML={{ __html: html }} />
      {/* writing cursor */}
      {p > 0 && p < 1 && (
        <div style={{ position: "absolute", top: "-10%", bottom: "-10%", left: `${p * 100}%`, width: 6, borderRadius: 3,
          background: M.pink, boxShadow: `0 0 20px ${M.pink}` }} />
      )}
      {box && bp > 0 && (
        <svg style={{ position: "absolute", left: -28, top: -22, width: "calc(100% + 56px)", height: "calc(100% + 44px)", overflow: "visible" }}
          preserveAspectRatio="none">
          <rect x="0" y="0" width="100%" height="100%" rx="18" fill="none" stroke={box.color}
            strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - bp}
            style={{ filter: `drop-shadow(0 0 12px ${box.color})` }} />
        </svg>
      )}
    </div>
  );
};

/* ---------------- plain text ---------------- */
export const Txt: React.FC<{ at: number; y: number; x?: number; size?: number; color?: string; font?: "display" | "body";
  children: React.ReactNode; until?: number; weight?: number; spacing?: number }> = ({
  at, y, x = 540, size = 64, color = M.white, font = "display", children, until, weight = 800, spacing = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = spring({ frame: frame - at, fps, config: M.spring.snappy });
  const fade = until !== undefined ? interpolate(frame, [until - 8, until], [1, 0], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, whiteSpace: "nowrap",
      transform: `translate(-50%, -50%) translateY(${(1 - p) * 40}px) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
      opacity: Math.min(1, p * 1.6) * fade, fontFamily: font === "display" ? M.display : M.body, fontWeight: weight,
      fontSize: size, color, letterSpacing: spacing, textTransform: font === "display" ? "uppercase" : undefined, lineHeight: 1 }}>
      {children}
    </div>
  );
};

/* ---------------- self-drawing curved arrow ---------------- */
export const Arrow: React.FC<{ at: number; from: [number, number]; to: [number, number]; bend?: number; color?: string;
  dur?: number; width?: number; until?: number }> = ({ at, from, to, bend = 0.25, color = M.pink, dur = 16, width = 7, until }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: M.ease.out });
  const [x1, y1] = from, [x2, y2] = to;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hl = 30;
  const head = `M ${x2 - hl * Math.cos(ang - 0.45)} ${y2 - hl * Math.sin(ang - 0.45)} L ${x2} ${y2} L ${x2 - hl * Math.cos(ang + 0.45)} ${y2 - hl * Math.sin(ang + 0.45)}`;
  const hp = interpolate(frame, [at + dur - 4, at + dur + 4], [0, 1], clamp);
  const fade = until !== undefined ? interpolate(frame, [until - 8, until], [1, 0], clamp) : 1;
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", opacity: fade }} width={1080} height={1920}>
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      <path d={head} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
        opacity={hp} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
    </svg>
  );
};

/* ---------------- chest + token ---------------- */
export const Chest: React.FC<{ at: number; x: number; y: number; size?: number; open?: number; token?: boolean; label?: string;
  labelColor?: string }> = ({ at, x, y, size = 150, open, token = false, label, labelColor = M.white }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: M.spring.bouncy });
  const o = open !== undefined ? spring({ frame: frame - open, fps, config: M.spring.snappy }) : 0;
  const tk = open !== undefined && token ? spring({ frame: frame - open - 6, fps, config: M.spring.bouncy }) : 0;
  const s = size / 120;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size,
      transform: `scale(${p}) translateY(${Math.sin((frame - at) / 9) * 2}px)` }}>
      {token && tk > 0 && (
        <div style={{ position: "absolute", left: size / 2 - 32 * s, top: 10 * s - tk * 70 * s }}>
          <Token size={64 * s} spin={frame / 4} />
        </div>
      )}
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ overflow: "visible" }}>
        {token && o > 0.3 && <ellipse cx="60" cy="48" rx="50" ry="22" fill={M.pink} opacity={0.35 * o} style={{ filter: "blur(10px)" }} />}
        <rect x="12" y="50" width="96" height="58" rx="10" fill="#132A57" stroke={M.blue} strokeWidth="5" />
        <rect x="12" y="70" width="96" height="6" fill={M.blue} opacity="0.6" />
        <g style={{ transformOrigin: "12px 50px", transform: `rotate(${-o * 38}deg)` }}>
          <path d="M12 50 V36 Q12 14 60 14 Q108 14 108 36 V50 Z" fill="#3A1030" stroke={M.pink} strokeWidth="5" strokeLinejoin="round" />
        </g>
        <rect x="52" y="44" width="16" height="22" rx="4" fill={M.white} />
      </svg>
      {label && (
        <div style={{ position: "absolute", top: size + 6, left: 0, right: 0, textAlign: "center", fontFamily: "KaTeX_Math",
          fontStyle: "italic", fontSize: size * 0.3, color: labelColor }}>{label}</div>
      )}
    </div>
  );
};

export const Token: React.FC<{ size: number; spin?: number }> = ({ size, spin = 0 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: `scaleX(${0.35 + 0.65 * Math.abs(Math.cos(spin))})`,
    filter: `drop-shadow(0 0 ${size / 5}px ${M.pink})` }}>
    <defs>
      <radialGradient id="tk" cx="35%" cy="30%">
        <stop offset="0%" stopColor="#FFC2E0" />
        <stop offset="60%" stopColor={M.pink} />
        <stop offset="100%" stopColor="#B0136A" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#tk)" stroke={M.white} strokeWidth="5" />
    <path d="M50 22 L57 42 L78 42 L61 55 L67 76 L50 63 L33 76 L39 55 L22 42 L43 42 Z" fill={M.white} />
  </svg>
);

/* ---------------- scene + background ---------------- */
export const Scene: React.FC<{ from: number; to: number; n?: string; title?: string; children: React.ReactNode }> = ({
  from, to, n, title, children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from || frame >= to) return null;
  const t = frame - from;
  const enter = spring({ frame: t, fps, config: M.spring.smooth });
  const exit = interpolate(frame, [to - 9, to], [0, 1], { ...clamp, easing: M.ease.in });
  // two diagonal bars (pink then blue) sweep across on entry
  const bar = (delay: number, color: string) => {
    const x = interpolate(t, [delay, delay + 12], [-1400, 1600], { ...clamp, easing: M.ease.inOut });
    return <div style={{ position: "absolute", top: -400, left: x, width: 260, height: 2800, background: color,
      transform: "rotate(18deg)", boxShadow: `0 0 80px ${color}` }} />;
  };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: Math.min(1, enter * 1.4) * (1 - exit),
        transform: `scale(${interpolate(enter, [0, 1], [0.96, 1]) * (1 + exit * 0.04)})` }}>
        {title && (
          <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18,
            alignItems: "center", fontFamily: M.body, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: M.white,
            textTransform: "uppercase", opacity: interpolate(t, [4, 14], [0, 1], clamp) }}>
            {n && <span style={{ color: M.bg, background: M.pink, borderRadius: 10, padding: "4px 14px" }}>{n}</span>}
            <span>{title}</span>
          </div>
        )}
        {children}
      </AbsoluteFill>
      {t < 16 && bar(0, M.pink)}
      {t < 18 && bar(3, M.blue)}
    </AbsoluteFill>
  );
};

const SYMS = ["∑", "∫", "Ω", "π", "∞", "∂", "σ", "√", "≤", "λ", "𝔼", "ℙ", "%", "÷", "±", "∏"];
export const MathBg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: M.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1300, height: 1300, borderRadius: "50%", left: -600 + Math.sin(frame / 90) * 80,
        top: -500, background: `radial-gradient(circle, ${M.pink}26, transparent 62%)`, filter: "blur(30px)" }} />
      <div style={{ position: "absolute", width: 1300, height: 1300, borderRadius: "50%", right: -650 - Math.cos(frame / 110) * 80,
        bottom: -450, background: `radial-gradient(circle, ${M.blue}2E, transparent 62%)`, filter: "blur(30px)" }} />
      <AbsoluteFill style={{ opacity: 0.07, backgroundImage: "radial-gradient(rgba(255,255,255,1) 1.6px, transparent 1.6px)",
        backgroundSize: "54px 54px", backgroundPosition: `0 ${(-frame * 0.4) % 54}px` }} />
      {SYMS.map((s, i) => {
        const x = ((i * 137) % 1000) + 40;
        const y = (((i * 263) % 2100) - frame * (0.5 + (i % 4) * 0.18)) % 2100;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y < -100 ? y + 2100 : y, fontSize: 60 + (i % 3) * 30,
            color: i % 2 ? M.pink : M.blue, opacity: 0.1, fontFamily: "KaTeX_Main", transform: `rotate(${Math.sin(frame / 60 + i) * 14}deg)` }}>{s}</div>
        );
      })}
    </AbsoluteFill>
  );
};
