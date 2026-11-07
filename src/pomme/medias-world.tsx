// Backgrounds + icons for the Arabic "وسائل الإعلام والاتصال" video (this video only):
// a city at dusk instead of the field, and a navy "network" board instead of the maths board.
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../theme";
import { P } from "./world";

export const C2 = {
  green: "#2EE6A0",
  red: "#FF4D5E",
  navy: "#070B24",
  cyan: "#38E1FF",
};

/* ---------------- city at dusk ---------------- */
export const CityBg: React.FC = () => {
  const f = useCurrentFrame();
  const sat = ((f * 2.2) % 1500) - 200;
  const waves = [0, 1, 2].map((i) => ((f + i * 25) % 75) / 75);
  const buildings = [
    [0, 820, 170], [150, 700, 150], [290, 880, 130], [410, 620, 170], [570, 760, 140], [700, 560, 160], [850, 800, 120], [960, 680, 140],
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #1A1050 0%, #4B2A8A 38%, #C2477E 62%, #FF9A5A 78%, #FFC76B 86%)" }} />
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: (i * 211) % 1080, top: (i * 97) % 700, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2,
          borderRadius: "50%", background: "#fff", opacity: 0.35 + 0.5 * Math.abs(Math.sin(f / 20 + i)) }} />
      ))}
      <div style={{ position: "absolute", left: 120, top: 180, width: 140, height: 140, borderRadius: "50%", background: "#FFF2D6",
        boxShadow: "0 0 80px #FFE6A8, 0 0 160px #FFB86B88" }} />
      {/* satellite */}
      <svg width={140} height={80} viewBox="0 0 140 80" style={{ position: "absolute", left: sat, top: 380 - sat * 0.12, transform: "rotate(-8deg)" }}>
        <rect x={0} y={28} width={46} height={24} fill={C2.cyan} opacity={0.9} /><rect x={94} y={28} width={46} height={24} fill={C2.cyan} opacity={0.9} />
        <rect x={52} y={22} width={36} height={36} rx={6} fill="#E8E8F5" /><circle cx={70} cy={16} r={8} fill="none" stroke="#E8E8F5" strokeWidth={4} />
      </svg>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* far skyline */}
        <path d="M0 1180 L0 1020 L60 1020 L60 960 L140 960 L140 1050 L220 1050 L220 930 L300 930 L300 1000 L380 1000 L380 900 L470 900 L470 1010 L560 1010 L560 950 L640 950 L640 880 L720 880 L720 1000 L820 1000 L820 940 L900 940 L900 1030 L1000 1030 L1000 970 L1080 970 L1080 1180 Z" fill="#3A1F6B" opacity={0.85} />
        {/* antenna tower with signal waves */}
        <g transform="translate(780 560)">
          <path d="M-40 400 L0 0 L40 400" stroke="#2A1747" strokeWidth={14} fill="none" />
          <path d="M-28 280 L28 280 M-18 180 L18 180 M-10 90 L10 90" stroke="#2A1747" strokeWidth={8} />
          <circle cx={0} cy={-6} r={12} fill={f % 30 < 15 ? C2.red : "#7A2030"} />
          {waves.map((w, i) => (
            <path key={i} d={`M ${-60 - w * 160} ${-20 - w * 60} Q 0 ${-120 - w * 180} ${60 + w * 160} ${-20 - w * 60}`} fill="none"
              stroke={C2.cyan} strokeWidth={6} opacity={1 - w} strokeLinecap="round" />
          ))}
        </g>
        {/* near buildings with windows */}
        {buildings.map(([x, top, w], i) => (
          <g key={i}>
            <rect x={x} y={top + 300} width={w} height={1200} fill={["#24124A", "#2B1656", "#201043"][i % 3]} />
            {Array.from({ length: 30 }).map((_, k) => {
              const cx = x + 18 + (k % 3) * (w - 36) / 2.4, cy = top + 330 + Math.floor(k / 3) * 60;
              if (cy > 1460) return null;
              const on = Math.sin(i * 7 + k * 3 + Math.floor(f / 45)) > -0.2;
              return <rect key={k} x={cx} y={cy} width={22} height={30} rx={3} fill={on ? (k % 4 ? "#FFD27A" : C2.cyan) : "#3A2470"} opacity={on ? 0.9 : 0.6} />;
            })}
          </g>
        ))}
        {/* street */}
        <rect x={0} y={1440} width={1080} height={480} fill="#2A2350" />
        <rect x={0} y={1440} width={1080} height={22} fill="#4A3F7A" />
        {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={((i * 160 - f * 3) % 1280) - 100} y={1700} width={90} height={14} rx={7} fill="#FFD27A" opacity={0.7} />)}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- network board ---------------- */
export const NetBg: React.FC<{ accent?: string }> = ({ accent = C2.cyan }) => {
  const f = useCurrentFrame();
  const nodes = Array.from({ length: 18 }).map((_, i) => [((i * 263) % 980) + 50 + Math.sin(f / 50 + i) * 20, ((i * 419) % 1800) + 60 + Math.cos(f / 60 + i) * 20]);
  const links: [number, number][] = [];
  nodes.forEach((a, i) => nodes.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1]) < 420) links.push([i, j]); }));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, #15215A, ${C2.navy} 70%)`, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {links.map(([i, j], k) => {
          const [x1, y1] = nodes[i], [x2, y2] = nodes[j];
          const t = ((f / 40 + k * 0.37) % 1);
          return (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth={2} opacity={0.18} />
              <circle cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={4} fill={accent} opacity={0.6} />
            </g>
          );
        })}
        {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7} fill={accent} opacity={0.5} />)}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- icons: coloured app-tiles with white glyphs ---------------- */
type IconName = "tv" | "radio" | "news" | "phone" | "web" | "social" | "book" | "play" | "cap" | "work" | "cart" | "game" | "lock" | "eye" | "clock" | "globe" | "heart";
const GLYPH: Record<IconName, React.ReactNode> = {
  tv: <><rect x={14} y={24} width={72} height={50} rx={8} fill="none" stroke="#fff" strokeWidth={7} /><path d="M38 12 L50 24 L62 12 M36 86 H64" stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" /></>,
  radio: <><rect x={12} y={34} width={76} height={48} rx={10} fill="none" stroke="#fff" strokeWidth={7} /><circle cx={34} cy={58} r={11} fill="#fff" /><path d="M58 50 H76 M58 64 H76 M24 34 L70 14" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></>,
  news: <><rect x={14} y={16} width={72} height={68} rx={8} fill="none" stroke="#fff" strokeWidth={7} /><rect x={26} y={28} width={22} height={20} fill="#fff" /><path d="M56 30 H74 M56 44 H74 M26 60 H74 M26 72 H74" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></>,
  phone: <><rect x={28} y={8} width={44} height={84} rx={10} fill="none" stroke="#fff" strokeWidth={7} /><circle cx={50} cy={78} r={5} fill="#fff" /></>,
  web: <><circle cx={50} cy={50} r={36} fill="none" stroke="#fff" strokeWidth={7} /><ellipse cx={50} cy={50} rx={15} ry={36} fill="none" stroke="#fff" strokeWidth={6} /><path d="M14 50 H86 M22 30 H78 M22 70 H78" stroke="#fff" strokeWidth={5} /></>,
  globe: <><circle cx={50} cy={50} r={36} fill="none" stroke="#fff" strokeWidth={7} /><ellipse cx={50} cy={50} rx={15} ry={36} fill="none" stroke="#fff" strokeWidth={6} /><path d="M14 50 H86" stroke="#fff" strokeWidth={5} /></>,
  social: <><path d="M14 22 H86 V66 H44 L26 82 V66 H14 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" /><path d="M50 58 C 30 44 36 30 50 40 C 64 30 70 44 50 58 Z" fill="#fff" /></>,
  heart: <path d="M50 84 C 10 56 14 22 50 38 C 86 22 90 56 50 84 Z" fill="#fff" />,
  book: <><path d="M50 26 C 36 16 22 16 12 20 V80 C 22 76 36 76 50 86 C 64 76 78 76 88 80 V20 C 78 16 64 16 50 26 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" /><path d="M50 26 V86" stroke="#fff" strokeWidth={6} /></>,
  play: <><rect x={10} y={20} width={80} height={60} rx={16} fill="none" stroke="#fff" strokeWidth={7} /><path d="M42 36 L64 50 L42 64 Z" fill="#fff" /></>,
  cap: <><path d="M50 18 L92 38 L50 58 L8 38 Z" fill="#fff" /><path d="M26 48 V70 C 40 82 60 82 74 70 V48" fill="none" stroke="#fff" strokeWidth={7} /><path d="M88 40 V66" stroke="#fff" strokeWidth={5} /></>,
  work: <><rect x={12} y={32} width={76} height={52} rx={8} fill="none" stroke="#fff" strokeWidth={7} /><path d="M36 32 V22 H64 V32 M12 54 H88" stroke="#fff" strokeWidth={6} fill="none" /></>,
  cart: <><path d="M8 18 H22 L32 66 H80 L90 32 H28" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" /><circle cx={38} cy={80} r={7} fill="#fff" /><circle cx={74} cy={80} r={7} fill="#fff" /></>,
  game: <><rect x={8} y={30} width={84} height={44} rx={22} fill="none" stroke="#fff" strokeWidth={7} /><path d="M28 44 V60 M20 52 H36" stroke="#fff" strokeWidth={6} strokeLinecap="round" /><circle cx={66} cy={46} r={5} fill="#fff" /><circle cx={76} cy={58} r={5} fill="#fff" /></>,
  lock: <><rect x={18} y={44} width={64} height={46} rx={10} fill="none" stroke="#fff" strokeWidth={7} /><path d="M32 44 V32 C 32 10 68 10 68 32 V44" fill="none" stroke="#fff" strokeWidth={7} /><circle cx={50} cy={66} r={7} fill="#fff" /></>,
  eye: <><path d="M6 50 C 26 18 74 18 94 50 C 74 82 26 82 6 50 Z" fill="none" stroke="#fff" strokeWidth={7} /><circle cx={50} cy={50} r={14} fill="#fff" /></>,
  clock: <><circle cx={50} cy={50} r={38} fill="none" stroke="#fff" strokeWidth={7} /><path d="M50 26 V50 L66 60" stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" /></>,
};
export type { IconName };

export const Icon: React.FC<{ name: IconName; at: number; x: number; y: number; size?: number; bg: string; label?: string;
  labelColor?: string; spin?: boolean }> = ({ name, at, x, y, size = 170, bg, label, labelColor = "#fff", spin }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: P.spring.bouncy });
  const float = Math.sin((f - at) / 16) * 6;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + float, width: size, transform: `scale(${p}) rotate(${(1 - p) * -20}deg)` }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.26, background: `linear-gradient(145deg, ${bg}, ${bg}CC)`,
        boxShadow: `0 ${size * 0.08}px 0 rgba(0,0,0,0.25), 0 0 ${size * 0.35}px ${bg}88`, border: "5px solid rgba(255,255,255,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 100 100" width={size * 0.66} height={size * 0.66} style={{ transform: spin ? `rotate(${(f - at) * 6}deg)` : undefined }}>{GLYPH[name]}</svg>
      </div>
      {label && <div style={{ marginTop: 14, textAlign: "center", fontFamily: "Cairo, CairoLatin", fontWeight: 800, fontSize: size * 0.24,
        color: labelColor, direction: "rtl", whiteSpace: "nowrap", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>{label}</div>}
    </div>
  );
};

/* a phone held in a hand (glowing screen) */
export const HandPhone: React.FC<{ x: number; y: number; size?: number; glow?: string }> = ({ x, y, size = 70, glow = C2.cyan }) => {
  const f = useCurrentFrame();
  return (
    <svg viewBox="0 0 40 70" width={size * 0.57} height={size} style={{ position: "absolute", left: x - size * 0.28, top: y - size * 0.7, overflow: "visible",
      filter: `drop-shadow(0 0 ${10 + Math.sin(f / 8) * 4}px ${glow})` }}>
      <rect x={1} y={1} width={38} height={68} rx={7} fill="#15122B" stroke="#fff" strokeWidth={2} />
      <rect x={5} y={7} width={30} height={52} rx={3} fill={glow} opacity={0.85} />
    </svg>
  );
};

/* balance scale for the conclusion */
export const Balance: React.FC<{ at: number; y: number }> = ({ at, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: P.spring.smooth });
  const tilt = Math.sin((f - at) / 18) * 9 * p;
  const arm = 330;
  const pan = (side: -1 | 1, color: string, sign: string) => {
    const a = (tilt * Math.PI) / 180;
    const px = 540 + side * arm * Math.cos(a), py = y + side * arm * Math.sin(a);
    return (
      <g>
        <path d={`M ${px} ${py} L ${px - 90} ${py + 160} M ${px} ${py} L ${px + 90} ${py + 160}`} stroke="#fff" strokeWidth={5} />
        <path d={`M ${px - 120} ${py + 160} Q ${px} ${py + 240} ${px + 120} ${py + 160} Z`} fill={color} stroke="#fff" strokeWidth={5} />
        <text x={px} y={py + 210} textAnchor="middle" fontSize={70} fontFamily="Anton" fill="#fff">{sign}</text>
      </g>
    );
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: interpolate(p, [0, 0.4], [0, 1], clamp) }}>
      <path d={`M 540 ${y - 20} V ${y + 520} M 420 ${y + 520} H 660`} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
      <circle cx={540} cy={y - 30} r={22} fill={P.yellow} />
      <g transform={`rotate(${tilt} 540 ${y})`}><rect x={540 - arm} y={y - 8} width={arm * 2} height={16} rx={8} fill="#fff" /></g>
      {pan(1, C2.green, "+")}
      {pan(-1, C2.red, "−")}
    </svg>
  );
};
