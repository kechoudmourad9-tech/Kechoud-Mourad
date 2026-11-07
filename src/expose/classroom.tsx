// Bright illustrated classroom for the exposé video: wall, board/projector screen, desk, laptop,
// professor, grade sheet. Same character kit as the pomme videos (Person).
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../theme";
import { P } from "../pomme/world";

export const K = {
  wall: "#BFE6FF", wall2: "#9FD8FF", floor: "#FFE29A", floor2: "#FFD36B", board: "#1D7A6B", boardEdge: "#7A4A22",
  pink: "#FF4FA3", blue: "#3D8BFF", yellow: "#FFD23F", green: "#2EC27E", purple: "#9B5CFF", ink: "#1B1530", white: "#FFFFFF",
};

/* ---------- the room ---------- */
export const Classroom: React.FC<{ screen?: React.ReactNode; boardText?: string }> = ({ screen, boardText }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${K.wall2} 0%, ${K.wall} 62%)` }} />
      {/* wall stripes + window with moving clouds */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1040, height: 30, background: "#86C9F5" }} />
      <div style={{ position: "absolute", left: 60, top: 230, width: 230, height: 300, borderRadius: 26, background: "linear-gradient(180deg,#6EC6FF,#D9F3FF)",
        border: "14px solid #fff", overflow: "hidden" }}>
        {[0, 1].map((i) => <div key={i} style={{ position: "absolute", top: 50 + i * 110, left: ((f * (0.6 + i * 0.3) + i * 120) % 360) - 120, width: 120, height: 46,
          borderRadius: 30, background: "#fff", opacity: 0.95 }} />)}
        <div style={{ position: "absolute", left: 101, top: 0, width: 10, height: "100%", background: "#fff" }} />
      </div>
      {/* board / projector screen */}
      <div style={{ position: "absolute", left: 340, top: 200, width: 680, height: 430, borderRadius: 24, background: K.board, border: `16px solid ${K.boardEdge}`,
        boxShadow: "0 18px 0 rgba(0,0,0,0.12)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {screen ?? (boardText && <div style={{ fontFamily: "Lalezar, CairoLatin", unicodeBidi: "plaintext", fontSize: 92, color: "#EFFFF9", opacity: 0.95 }}>{boardText}</div>)}
      </div>
      {/* floor */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={1070} width={1080} height={850} fill={K.floor} />
        {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={i * 135} y1={1070} x2={i * 135 - 200 + i * 45} y2={1920} stroke={K.floor2} strokeWidth={6} />)}
        <rect x={0} y={1070} width={1080} height={18} fill="#F2C55A" />
      </svg>
      {/* plant */}
      <svg width={180} height={300} viewBox="0 0 180 300" style={{ position: "absolute", right: 30, top: 830 }}>
        {[-30, -10, 10, 30].map((a, i) => <ellipse key={i} cx={90} cy={110} rx={22} ry={90} fill={i % 2 ? "#2EC27E" : "#25A86C"} transform={`rotate(${a + Math.sin(f / 30 + i) * 3} 90 200)`} />)}
        <path d="M45 190 H135 L120 290 H60 Z" fill={K.pink} />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- slides that build on the screen ---------- */
export const Slides: React.FC<{ at: number; page?: number; color?: string }> = ({ at, page = 0, color = K.blue }) => {
  const f = useCurrentFrame();
  const t = Math.max(0, f - at);
  const bars = [0.45, 0.7, 0.55, 0.9];
  return (
    <div style={{ width: 600, height: 360, background: "#fff", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 18,
      transform: `translateX(${interpolate(t, [0, 10], [60, 0], clamp)}px)`, opacity: interpolate(t, [0, 8], [0, 1], clamp) }}>
      <div style={{ height: 34, width: `${interpolate(t, [4, 16], [0, 70], clamp)}%`, borderRadius: 10, background: color }} />
      <div style={{ display: "flex", gap: 26, alignItems: "flex-end", height: 200, direction: "ltr" }}>
        {page % 2 === 0
          ? bars.map((b, i) => <div key={i} style={{ width: 70, height: `${b * 100 * interpolate(t, [8 + i * 4, 20 + i * 4], [0, 1], clamp)}%`, borderRadius: 10,
              background: [K.pink, K.blue, K.yellow, K.green][i] }} />)
          : <svg viewBox="0 0 100 100" width={200} height={200}><circle cx={50} cy={50} r={40} fill={K.yellow} />
              <path d={`M50 50 L50 10 A40 40 0 ${t > 20 ? 1 : 0} 1 ${50 + 40 * Math.sin(Math.min(1, t / 25) * 4.2)} ${50 - 40 * Math.cos(Math.min(1, t / 25) * 4.2)} Z`} fill={K.pink} /></svg>}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ height: 18, borderRadius: 9, background: "#DDE6F5", width: `${interpolate(t, [12 + i * 5, 24 + i * 5], [0, 100 - i * 18], clamp)}%` }} />)}
        </div>
      </div>
    </div>
  );
};

/* ---------- laptop on a desk ---------- */
export const Laptop: React.FC<{ x: number; y: number; children?: React.ReactNode; w?: number }> = ({ x, y, children, w = 520 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y }}>
    <div style={{ width: w, height: w * 0.62, background: "#2C3350", borderRadius: 22, padding: 18, boxShadow: "0 10px 0 rgba(0,0,0,0.15)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 10, background: "#EAF4FF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
    <div style={{ width: w * 1.2, height: 26, marginLeft: -w * 0.1, background: "#C8D2E8", borderRadius: "0 0 20px 20px" }} />
  </div>
);
export const Desk: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 760 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y }}>
    <div style={{ width: w, height: 40, background: "#C98A4B", borderRadius: 12 }} />
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 40px" }}>
      <div style={{ width: 30, height: 260, background: "#A86E36" }} /><div style={{ width: 30, height: 260, background: "#A86E36" }} />
    </div>
  </div>
);

/* ---------- small props ---------- */
export const Glasses: React.FC<{ x: number; feet: number; scale: number; jump?: number }> = ({ x, feet, scale, jump = 0 }) => (
  <svg viewBox="0 0 120 40" width={120 * scale} height={40 * scale} style={{ position: "absolute", left: x - 60 * scale, top: feet - 420 * scale + 70 * scale - jump }}>
    <rect x={6} y={6} width={44} height={28} rx={10} fill="rgba(200,230,255,0.35)" stroke={K.ink} strokeWidth={6} />
    <rect x={70} y={6} width={44} height={28} rx={10} fill="rgba(200,230,255,0.35)" stroke={K.ink} strokeWidth={6} />
    <path d="M50 18 H70" stroke={K.ink} strokeWidth={6} />
  </svg>
);

export const Bubble: React.FC<{ at: number; x: number; y: number; children: React.ReactNode; color?: string }> = ({ at, x, y, children, color = K.white }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: P.spring.bouncy });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) scale(${p})`, transformOrigin: "50% 100%",
      background: color, borderRadius: 34, padding: "10px 30px 18px", border: `5px solid ${K.ink}`, boxShadow: "0 8px 0 rgba(0,0,0,0.15)",
      fontFamily: "Lalezar, CairoLatin", direction: "rtl", fontSize: 60, color: K.ink, whiteSpace: "nowrap" }}>
      {children}
      <div style={{ position: "absolute", left: "50%", bottom: -26, width: 34, height: 34, background: color, borderRight: `5px solid ${K.ink}`,
        borderBottom: `5px solid ${K.ink}`, transform: "translateX(-50%) rotate(45deg)" }} />
    </div>
  );
};

export const GradeSheet: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: P.spring.bouncy });
  const c = spring({ frame: f - at - 6, fps, config: { damping: 30, stiffness: 60 } });
  const n = Math.round(c * 20);
  return (
    <div style={{ position: "absolute", left: x - 170, top: y - 220, width: 340, height: 440, background: "#fff", borderRadius: 18, border: `6px solid ${K.ink}`,
      transform: `scale(${p}) rotate(${-6 + Math.sin(f / 10) * 2}deg)`, boxShadow: "0 14px 0 rgba(0,0,0,0.15)", padding: 26, display: "flex", flexDirection: "column", gap: 14 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ height: 14, borderRadius: 7, background: "#DDE6F5", width: `${90 - i * 20}%` }} />)}
      <div style={{ marginTop: 20, textAlign: "center", fontFamily: "Lalezar, CairoLatin", fontSize: 150, lineHeight: 1, color: n === 20 ? K.green : K.pink,
        fontVariantNumeric: "tabular-nums", direction: "ltr" }}>{n}<span style={{ fontSize: 70, color: "#9AA6C0" }}>/20</span></div>
      {n === 20 && <svg viewBox="0 0 100 60" width={200} height={120} style={{ alignSelf: "center", marginTop: -10 }}>
        <path d="M10 30 L38 52 L90 6" stroke={K.green} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
  );
};

export const Confetti: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 60 }).map((_, i) => {
        const x = (i * 137) % 1080, y = -40 + ((t * (6 + (i % 5) * 2) + i * 37) % 1500);
        return <div key={i} style={{ position: "absolute", left: x + Math.sin(t / 8 + i) * 30, top: y, width: 18, height: 10, borderRadius: 3,
          background: [K.pink, K.blue, K.yellow, K.green, K.purple][i % 5], transform: `rotate(${t * 8 + i * 30}deg)` }} />;
      })}
    </AbsoluteFill>
  );
};

export const ease = (f: number, a: number, b: number, x0: number, x1: number) =>
  interpolate(f, [a, b], [x0, x1], { ...clamp, easing: P.ease.inOut });
