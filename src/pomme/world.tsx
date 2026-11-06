// Illustrated world for the "pomme" explainer: a sunny field, animated people, apple, basket.
// Everything is drawn in SVG/CSS (no image assets), in a bright, colourful palette.
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../theme";
import { M } from "../maths/kit";

export const P = {
  ...M,
  skyTop: "#5DB8FF",
  skyBottom: "#FFD6EC",
  sun: "#FFD23F",
  grass: "#33C47A",
  grassDark: "#1E9A5C",
  hill1: "#7FE0A0",
  hill2: "#4FCB85",
  orange: "#FF8A3D",
  purple: "#9B5CFF",
  yellow: "#FFD23F",
  apple: "#FF3B4E",
  wood: "#B9733A",
  woodDark: "#7E4A20",
  skin: "#F2B48C",
  skin2: "#C98A62",
  ink: "#1B1530",
} as const;

/* ---------------- the field ---------------- */
export const Field: React.FC = () => {
  const f = useCurrentFrame();
  const clouds = [
    { y: 260, s: 1.2, v: 0.35, o: 0 },
    { y: 430, s: 0.8, v: 0.55, o: 500 },
    { y: 150, s: 0.9, v: 0.25, o: 900 },
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${P.skyTop} 0%, #9FD4FF 45%, ${P.skyBottom} 72%)` }} />
      {/* sun */}
      <div style={{ position: "absolute", left: 760, top: 150 }}>
        <svg width={260} height={260} viewBox="-130 -130 260 260" style={{ transform: `rotate(${f * 0.4}deg)` }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={-7} y={-125} width={14} height={40} rx={7} fill={P.sun} opacity={0.8}
              transform={`rotate(${i * 30})`} />
          ))}
          <circle r={70 + Math.sin(f / 15) * 3} fill={P.sun} />
          <circle r={70} fill="url(#sunG)" />
          <defs><radialGradient id="sunG"><stop offset="0%" stopColor="#FFF4B8" /><stop offset="100%" stopColor={P.sun} stopOpacity={0} /></radialGradient></defs>
        </svg>
      </div>
      {clouds.map((c, i) => {
        const x = ((c.o + f * c.v) % 1500) - 300;
        return (
          <svg key={i} width={300 * c.s} height={130 * c.s} viewBox="0 0 300 130" style={{ position: "absolute", left: x, top: c.y }}>
            <g fill="#FFFFFF" opacity={0.92}>
              <ellipse cx={90} cy={85} rx={80} ry={42} /><ellipse cx={160} cy={60} rx={70} ry={55} />
              <ellipse cx={220} cy={88} rx={70} ry={38} />
            </g>
          </svg>
        );
      })}
      {/* hills */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={`M0 1080 Q 260 ${960 + Math.sin(f / 80) * 4} 540 1050 T 1080 1000 V 1920 H 0 Z`} fill={P.hill1} />
        <path d="M0 1180 Q 320 1060 640 1170 T 1080 1130 V 1920 H 0 Z" fill={P.hill2} />
        <path d="M0 1300 Q 540 1200 1080 1300 V 1920 H 0 Z" fill={P.grass} />
        <path d="M0 1700 Q 540 1640 1080 1700 V 1920 H 0 Z" fill={P.grassDark} opacity={0.6} />
        {/* trees */}
        {[[120, 1110, 1], [960, 1060, 0.8], [600, 1040, 0.6]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-12} y={-20} width={24} height={90} rx={8} fill={P.woodDark} />
            <circle cx={0} cy={-70} r={70} fill="#2FAE6A" />
            <circle cx={-40} cy={-40} r={50} fill="#38C07A" />
            <circle cx={45} cy={-45} r={52} fill="#29A060" />
            {[[-20, -90], [30, -60], [-45, -40]].map(([ax, ay], k) => <circle key={k} cx={ax} cy={ay} r={10} fill={P.apple} />)}
          </g>
        ))}
        {/* flowers */}
        {Array.from({ length: 26 }).map((_, i) => {
          const x = (i * 197) % 1060 + 10, y = 1330 + ((i * 89) % 520);
          const c = [P.pink, P.yellow, "#FFFFFF", P.purple, P.orange][i % 5];
          const sway = Math.sin(f / 18 + i) * 3;
          return (
            <g key={i} transform={`translate(${x + sway} ${y})`}>
              {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 9} cy={Math.sin((a * Math.PI) / 180) * 9} r={7} fill={c} />)}
              <circle r={6} fill={P.yellow} />
            </g>
          );
        })}
        {/* grass blades */}
        {Array.from({ length: 60 }).map((_, i) => {
          const x = i * 18 + 4, h = 40 + ((i * 37) % 30), sway = Math.sin(f / 14 + i * 0.6) * 10;
          return <path key={i} d={`M ${x} 1920 Q ${x + sway / 2} ${1920 - h / 2} ${x + sway} ${1920 - h}`} stroke="#1A8A50" strokeWidth={6} fill="none" strokeLinecap="round" />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- a person ---------------- */
export type PersonPose = { x: number; feet: number; shirt: string; hair: string; skin?: string; walk?: number; armR?: number;
  armL?: number; jump?: number; label?: string; labelColor?: string; scale?: number; face?: number };

// right-hand position in world space (for objects held in the hand)
export const handR = (p: PersonPose) => {
  const s = p.scale ?? 1;
  const a = ((p.armR ?? 8) * Math.PI) / 180;
  const hx = 138 + -112 * Math.sin(a), hy = 165 + 112 * Math.cos(a);
  return [p.x + (hx - 100) * s, p.feet - (p.jump ?? 0) - (420 - hy) * s] as const;
};

export const Person: React.FC<PersonPose & { at?: number }> = (p) => {
  const f = useCurrentFrame();
  const s = p.scale ?? 1;
  const walk = p.walk ?? 0;
  const leg = Math.sin(f / 3.2) * 24 * walk;
  const bob = Math.abs(Math.sin(f / 3.2)) * 8 * walk + Math.sin(f / 20) * 2;
  const blink = (f % 95) < 4 ? 0.15 : 1;
  const armR = (p.armR ?? 8) + Math.sin(f / 3.2) * 20 * walk;
  const armL = (p.armL ?? -8) - Math.sin(f / 3.2) * 20 * walk;
  const face = p.face ?? 0; // eye offset: -1 looks left, 1 looks right
  return (
    <div style={{ position: "absolute", left: p.x - 100 * s, top: p.feet - 420 * s - (p.jump ?? 0) - bob, width: 200 * s, height: 420 * s }}>
      {/* shadow */}
      <div style={{ position: "absolute", left: 30 * s, bottom: -12 * s + bob - (p.jump ?? 0) * -1, width: 140 * s, height: 26 * s,
        borderRadius: "50%", background: "rgba(0,60,20,0.25)", transform: `scale(${1 - (p.jump ?? 0) / 300})` }} />
      <svg viewBox="0 0 200 420" width={200 * s} height={420 * s} style={{ overflow: "visible" }}>
        {/* legs */}
        <g transform={`rotate(${leg} 85 270)`}><rect x={70} y={262} width={30} height={150} rx={15} fill="#2D2A4A" /><ellipse cx={82} cy={412} rx={26} ry={12} fill="#1B1530" /></g>
        <g transform={`rotate(${-leg} 115 270)`}><rect x={100} y={262} width={30} height={150} rx={15} fill="#2D2A4A" /><ellipse cx={120} cy={412} rx={26} ry={12} fill="#1B1530" /></g>
        {/* left arm (behind) */}
        <g transform={`rotate(${armL} 62 165)`}><rect x={50} y={160} width={24} height={112} rx={12} fill={p.shirt} /><circle cx={62} cy={278} r={15} fill={p.skin ?? P.skin} /></g>
        {/* body */}
        <rect x={52} y={140} width={96} height={145} rx={42} fill={p.shirt} />
        <rect x={52} y={232} width={96} height={20} fill="rgba(0,0,0,0.12)" />
        {/* head */}
        <rect x={88} y={120} width={24} height={30} fill={p.skin ?? P.skin} />
        <circle cx={100} cy={85} r={56} fill={p.skin ?? P.skin} />
        <path d="M44 82 Q 44 22 100 22 Q 158 22 156 82 Q 140 50 100 52 Q 60 50 44 82 Z" fill={p.hair} />
        <g transform={`translate(${face * 8} 0)`}>
          <ellipse cx={80} cy={88} rx={7} ry={9 * blink} fill={P.ink} />
          <ellipse cx={120} cy={88} rx={7} ry={9 * blink} fill={P.ink} />
          <path d="M82 112 Q 100 128 118 112" stroke={P.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          <circle cx={68} cy={106} r={9} fill={P.pink} opacity={0.35} /><circle cx={132} cy={106} r={9} fill={P.pink} opacity={0.35} />
        </g>
        {/* right arm (front) */}
        <g transform={`rotate(${armR} 138 165)`}><rect x={126} y={160} width={24} height={112} rx={12} fill={p.shirt} /><circle cx={138} cy={278} r={15} fill={p.skin ?? P.skin} /></g>
      </svg>
      {p.label && (
        <div style={{ position: "absolute", left: "50%", top: -95 * s, transform: "translateX(-50%)", width: 84 * s, height: 84 * s,
          borderRadius: "50%", background: p.labelColor ?? P.pink, color: "#fff", fontFamily: M.display, fontSize: 56 * s,
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 0 rgba(0,0,0,0.18), 0 0 30px ${p.labelColor ?? P.pink}`,
          border: "5px solid #fff" }}>{p.label}</div>
      )}
    </div>
  );
};

/* ---------------- apple / halves / basket ---------------- */
export const Apple: React.FC<{ x: number; y: number; size?: number; rot?: number }> = ({ x, y, size = 90, rot = 0 }) => (
  <svg viewBox="-50 -55 100 105" width={size} height={size} style={{ position: "absolute", left: x - size / 2, top: y - size / 2,
    transform: `rotate(${rot}deg)`, overflow: "visible", filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.2))" }}>
    <path d="M0 -28 C 30 -46 54 -18 44 12 C 36 38 16 48 0 40 C -16 48 -36 38 -44 12 C -54 -18 -30 -46 0 -28 Z" fill={P.apple} />
    <ellipse cx={-20} cy={-14} rx={9} ry={14} fill="#FFFFFF" opacity={0.35} />
    <path d="M0 -28 Q 2 -42 8 -50" stroke={P.woodDark} strokeWidth={5} fill="none" strokeLinecap="round" />
    <path d="M6 -40 Q 26 -54 34 -36 Q 18 -30 6 -40 Z" fill="#3BC46F" />
  </svg>
);

export const AppleHalf: React.FC<{ x: number; y: number; size?: number; side: -1 | 1; rot?: number }> = ({ x, y, size = 90, side, rot = 0 }) => (
  <svg viewBox="-50 -55 100 105" width={size} height={size} style={{ position: "absolute", left: x - size / 2, top: y - size / 2,
    transform: `rotate(${rot}deg) scaleX(${side})`, overflow: "visible", filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.2))" }}>
    <path d="M0 -28 C -30 -46 -54 -18 -44 12 C -36 38 -16 48 0 40 Z" fill={P.apple} />
    <path d="M-4 -24 C -26 -38 -46 -14 -38 10 C -32 30 -16 38 -4 34 Z" fill="#FFF3D6" />
    <ellipse cx={-14} cy={4} rx={4} ry={7} fill={P.woodDark} />
  </svg>
);

export const Basket: React.FC<{ x: number; y: number; size?: number; shake?: number }> = ({ x, y, size = 180, shake = 0 }) => (
  <svg viewBox="0 0 200 140" width={size} height={size * 0.7} style={{ position: "absolute", left: x - size / 2, top: y - size * 0.7,
    transform: `rotate(${shake}deg)`, transformOrigin: "50% 100%", overflow: "visible", filter: "drop-shadow(0 8px 4px rgba(0,0,0,0.2))" }}>
    <path d="M40 40 Q 100 -40 160 40" stroke={P.woodDark} strokeWidth={10} fill="none" />
    <path d="M10 40 H190 L170 135 H30 Z" fill={P.wood} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${16 + i * 2} ${62 + i * 20} H${184 - i * 2}`} stroke={P.woodDark} strokeWidth={5} opacity={0.6} />)}
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={`v${i}`} d={`M${35 + i * 26} 42 L${42 + i * 23} 133`} stroke={P.woodDark} strokeWidth={4} opacity={0.45} />)}
    <rect x={4} y={34} width={192} height={14} rx={7} fill={P.woodDark} />
  </svg>
);

export const Sparkles: React.FC<{ at: number; x: number; y: number; color?: string }> = ({ at, x, y, color = P.yellow }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 40) return null;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2, r = 30 + t * 4;
        const o = interpolate(t, [20, 40], [1, 0], clamp);
        return <path key={i} transform={`translate(${x + Math.cos(a) * r} ${y + Math.sin(a) * r}) rotate(${t * 6}) scale(${1 - t / 60})`}
          d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill={i % 2 ? color : "#fff"} opacity={o} />;
      })}
    </svg>
  );
};

export const Bubble: React.FC<{ at: number; until: number; x: number; y: number; w: number; h: number; tailX: number; tailY: number;
  children: React.ReactNode }> = ({ at, until, x, y, w, h, tailX, tailY, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f >= until) return null;
  const p = spring({ frame: f - at, fps, config: M.spring.bouncy });
  const o = interpolate(f, [until - 8, until], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {[0, 1, 2].map((i) => {
        const k = (i + 1) / 4;
        return <div key={i} style={{ position: "absolute", left: tailX + (x - tailX) * k - (10 + i * 6), top: tailY + (y + h / 2 - tailY) * k,
          width: 20 + i * 12, height: 20 + i * 12, borderRadius: "50%", background: "#fff", transform: `scale(${p})` }} />;
      })}
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 70, background: "#fff",
        transform: `scale(${p})`, boxShadow: "0 16px 0 rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        {children}
      </div>
    </div>
  );
};

export const Gear: React.FC<{ x: number; y: number; r: number; speed: number; color: string }> = ({ x, y, r, speed, color }) => {
  const f = useCurrentFrame();
  return (
    <svg width={r * 2.6} height={r * 2.6} viewBox="-130 -130 260 260" style={{ position: "absolute", left: x - r * 1.3, top: y - r * 1.3,
      transform: `rotate(${f * speed}deg)` }}>
      {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={-16} y={-122} width={32} height={40} rx={6} fill={color} transform={`rotate(${i * 36})`} />)}
      <circle r={92} fill={color} /><circle r={36} fill="#000" />
    </svg>
  );
};
