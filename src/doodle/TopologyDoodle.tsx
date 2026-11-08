// 5 s doodle explainer beat about topology: "a mug and a donut are the same shape".
// Hand-drawn look: thin near-black ink with a slight wobble (SVG turbulence displacement whose seed
// "boils" every 3 frames), flat fills, no shading/gradients. The last second holds perfectly still.
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp, theme } from "../theme";

export const DOODLE_FRAMES = 150; // 5 s @ 30 fps
const HOLD = 120;                 // from here on: no boil, no motion

const INK = "#1F1B1A";
const SW = 4.5;                   // thin ink line
const COL = {
  sky: "#C9E8F6", cloud: "#FFFFFF", grass1: "#A8D672", grass2: "#86C05A", path: "#EED9A6",
  table: "#F2A65A", parasol: "#FF7A6B", parasol2: "#FFF4E6", mug: "#6FA8DC", donut: "#F2C27E",
  ruler: "#FFD95E", hair: "#7A4A2A", red: "#E53935", label: "#FFFFFF",
};

/* ---------- helpers ---------- */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ink = { stroke: INK, strokeWidth: SW, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** superellipse path: n=2 ellipse, larger n -> boxier */
const superellipse = (cx: number, cy: number, rx: number, ry: number, n: number, steps = 64) => {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const x = cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n);
    d += `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d + "Z";
};

/* ---------- the scene ---------- */
const Scene: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  // mug -> donut morph (frames 12..62)
  const m = interpolate(f, [12, 62], [0, 1], { ...clamp, easing: theme.ease.inOut });
  // person reactions
  const holdHead = interpolate(f, [30, 46], [0, 1], { ...clamp, easing: theme.ease.out }) * (1 - interpolate(f, [92, 102], [0, 1], clamp));
  const shrug = spring({ frame: f - 100, fps, config: { damping: 12, stiffness: 160, mass: 0.6 } });
  const headTilt = Math.sin(Math.min(f, 70) / 6) * 3 * holdHead;
  // ruler pops up with overshoot at 72
  const pop = f < 72 ? 0 : spring({ frame: f - 72, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  // red X: two strokes
  const x1 = interpolate(f, [86, 93], [0, 1], { ...clamp, easing: theme.ease.out });
  const x2 = interpolate(f, [95, 102], [0, 1], { ...clamp, easing: theme.ease.out });
  // label
  const lab = f < 104 ? 0 : spring({ frame: f - 104, fps, config: { damping: 14, stiffness: 160, mass: 0.6 } });
  // cloud drift (stops at HOLD)
  const drift = Math.min(f, HOLD) * 0.35;

  // person geometry (side-on scene, person faces the viewer)
  const PX = 470, HEAD_Y = 860, HEAD_R = 120;
  const neck = HEAD_Y + HEAD_R;
  const hip = neck + 330;
  const shoulderY = neck + 70 - shrug * 26;
  // mug hand position (right arm, holding the object)
  const handX = PX + 175, handY = shoulderY + 170;
  // object (mug/donut) centre
  const OX = handX + 70, OY = handY - 20;

  // mug -> donut parameters
  const rx = lerp(62, 105, m), ry = lerp(80, 62, m), n = lerp(5, 2, m);
  const holeX = lerp(OX + rx + 30, OX, m);     // handle ring slides into the body and becomes the hole
  const holeR = lerp(30, 24, m), ringR = lerp(46, 0, m);

  return (
    <g>
      {/* sky + clouds */}
      <rect x={0} y={0} width={1080} height={1920} fill={COL.sky} />
      {[[160 + drift, 360, 1], [720 + drift * 0.6, 260, 1.25], [880 - drift * 0.4, 560, 0.8]].map(([x, y, s], i) => (
        <path key={i} {...ink} fill={COL.cloud} transform={`translate(${x} ${y}) scale(${s})`}
          d="M -110 30 Q -120 -10 -80 -14 Q -70 -60 -20 -50 Q 10 -88 55 -60 Q 100 -64 104 -20 Q 140 -6 120 30 Z" />
      ))}
      {/* parasol (café terrace) */}
      <line x1={890} y1={760} x2={890} y2={1430} {...ink} />
      <path {...ink} fill={COL.parasol} d="M 700 790 Q 890 600 1080 790 Q 985 760 890 790 Q 795 760 700 790 Z" />
      <path {...ink} fill={COL.parasol2} d="M 840 778 Q 890 640 940 778 Q 890 762 840 778 Z" />
      {/* ground in flat bands */}
      <path {...ink} fill={COL.grass1} d="M -10 1380 Q 300 1360 540 1384 Q 800 1404 1090 1376 L 1090 1930 L -10 1930 Z" />
      <path {...ink} fill={COL.path} d="M -10 1520 Q 360 1505 620 1524 Q 860 1540 1090 1518 L 1090 1930 L -10 1930 Z" />
      <path {...ink} fill={COL.grass2} d="M -10 1700 Q 420 1688 700 1706 Q 900 1716 1090 1700 L 1090 1930 L -10 1930 Z" />
      {/* small round table */}
      <ellipse cx={880} cy={1300} rx={150} ry={26} {...ink} fill={COL.table} />
      <path {...ink} fill="none" d="M 880 1326 L 880 1470 M 820 1470 L 940 1470" />

      {/* ----- the person ----- */}
      <g transform={`rotate(${headTilt} ${PX} ${neck})`}>
        <circle cx={PX} cy={HEAD_Y} r={HEAD_R} {...ink} fill="#FFFFFF" />
        {/* messy brown hair (own design: a tuft of scribbles + one cowlick) */}
        <path {...ink} fill={COL.hair} d={`M ${PX - 112} ${HEAD_Y - 30} Q ${PX - 120} ${HEAD_Y - 120} ${PX - 30} ${HEAD_Y - 128}
          Q ${PX + 40} ${HEAD_Y - 150} ${PX + 100} ${HEAD_Y - 92} Q ${PX + 122} ${HEAD_Y - 60} ${PX + 112} ${HEAD_Y - 30}
          Q ${PX + 80} ${HEAD_Y - 70} ${PX + 40} ${HEAD_Y - 58} Q ${PX + 10} ${HEAD_Y - 84} ${PX - 30} ${HEAD_Y - 62}
          Q ${PX - 70} ${HEAD_Y - 80} ${PX - 112} ${HEAD_Y - 30} Z`} />
        <path {...ink} fill="none" d={`M ${PX + 10} ${HEAD_Y - 132} q 14 -40 40 -38`} />
        {/* eyes + brows (brows lift on the shrug, knit while confused) */}
        <circle cx={PX - 40} cy={HEAD_Y + 6} r={9} fill={INK} />
        <circle cx={PX + 40} cy={HEAD_Y + 6} r={9} fill={INK} />
        <path {...ink} fill="none" d={`M ${PX - 64} ${HEAD_Y - 22 - shrug * 14 + holdHead * 6} L ${PX - 18} ${HEAD_Y - 26 - shrug * 14 - holdHead * 4}`} />
        <path {...ink} fill="none" d={`M ${PX + 18} ${HEAD_Y - 26 - shrug * 14 - holdHead * 4} L ${PX + 64} ${HEAD_Y - 22 - shrug * 14 + holdHead * 6}`} />
        <path {...ink} fill="none" d={`M ${PX - 22} ${HEAD_Y + 58} Q ${PX} ${HEAD_Y + 50 - shrug * 10} ${PX + 22} ${HEAD_Y + 58}`} />
      </g>
      {/* body */}
      <line x1={PX} y1={neck} x2={PX} y2={hip} {...ink} />
      <path {...ink} fill="none" d={`M ${PX} ${hip} L ${PX - 70} ${hip + 230} M ${PX} ${hip} L ${PX + 70} ${hip + 230}`} />
      {/* left arm: hangs, then holds the head, then shrugs */}
      {(() => {
        const sx = PX, sy = shoulderY;
        const rest: [number, number] = [PX - 120, sy + 190];
        const head: [number, number] = [PX - 120, HEAD_Y - 20];
        const shr: [number, number] = [PX - 190, sy - 40];
        const hx = lerp(lerp(rest[0], head[0], holdHead), shr[0], shrug), hy = lerp(lerp(rest[1], head[1], holdHead), shr[1], shrug);
        const ex = (sx + hx) / 2 - 60, ey = (sy + hy) / 2 + 30 - shrug * 40;
        return <path {...ink} fill="none" d={`M ${sx} ${sy} Q ${ex} ${ey} ${hx} ${hy}`} />;
      })()}
      {/* right arm: holds the object, then shrugs palm-up */}
      {(() => {
        const sx = PX, sy = shoulderY;
        const hx = lerp(handX, PX + 190, shrug), hy = lerp(handY, sy - 40, shrug);
        const ex = (sx + hx) / 2 + 40, ey = (sy + hy) / 2 + 40 - shrug * 40;
        return <path {...ink} fill="none" d={`M ${sx} ${sy} Q ${ex} ${ey} ${hx} ${hy}`} />;
      })()}

      {/* ----- the object in his hand: mug morphing into a donut ----- */}
      <g transform={`translate(${(880 - OX) * shrug} ${(1250 - OY) * shrug - Math.sin(Math.PI * Math.min(1, shrug)) * 120})`}>
        {ringR > 2 && <circle cx={holeX} cy={OY} r={ringR} {...ink} fill={lerp(0, 1, m) < 0.5 ? COL.mug : COL.donut} />}
        <path d={superellipse(OX, OY, rx, ry, n)} {...ink} fill={m < 0.5 ? COL.mug : COL.donut} />
        <circle cx={holeX} cy={OY} r={holeR} {...ink} fill={COL.sky} />
        {/* steam -> sprinkles */}
        {m < 0.4 && [0, 1].map((i) => <path key={i} {...ink} fill="none" opacity={1 - m * 2.5}
          d={`M ${OX - 20 + i * 36} ${OY - ry - 20} q -12 -24 0 -46 q 12 -22 0 -44`} />)}
        {m > 0.6 && [[-50, -30, 20], [-10, -44, -30], [34, -36, 40], [60, -10, -10], [-64, 4, 60]].map(([dx, dy, a], i) => (
          <line key={i} x1={OX + dx} y1={OY + dy} x2={OX + dx + 14 * Math.cos((a * Math.PI) / 180)} y2={OY + dy + 14 * Math.sin((a * Math.PI) / 180)}
            stroke={["#FF5C8A", "#3D8BFF", "#2EC27E", "#9B5CFF", "#FF5C8A"][i]} strokeWidth={6} strokeLinecap="round" opacity={(m - 0.6) * 2.5} />
        ))}
        {/* "=" between the two ideas while morphing */}
      </g>

      {/* ----- the ruler pops up (distances), then gets crossed out ----- */}
      <g transform={`translate(540 560) scale(${pop}) rotate(${-8 + (1 - pop) * 20})`}>
        <rect x={-260} y={-55} width={520} height={110} rx={10} {...ink} fill={COL.ruler} />
        {Array.from({ length: 21 }).map((_, i) => (
          <line key={i} x1={-240 + i * 24} y1={-55} x2={-240 + i * 24} y2={-55 + (i % 5 === 0 ? 46 : 26)} {...ink} strokeWidth={3.5} />
        ))}
        <text x={150} y={36} fontFamily="Caveat" fontWeight={700} fontSize={54} fill={INK}>cm</text>
      </g>
      <g>
        <path d="M 290 430 L 790 690" stroke={COL.red} strokeWidth={22} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - x1} opacity={x1 > 0 ? 0.92 : 0} />
        <path d="M 790 430 L 290 690" stroke={COL.red} strokeWidth={22} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - x2} opacity={x2 > 0 ? 0.92 : 0} />
      </g>
    </g>
  );
};

/* handwritten label in a white box (outside the wobble filter so it stays readable) */
const Label: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const p = f < 104 ? 0 : spring({ frame: f - 104, fps, config: { damping: 14, stiffness: 160, mass: 0.6 } });
  if (p === 0) return null;
  return (
    <div style={{ position: "absolute", left: 540, top: 1590, transform: `translate(-50%,-50%) rotate(-2deg) scale(${p})`, background: COL.label,
      border: `${SW}px solid ${INK}`, borderRadius: 10, padding: "6px 34px 12px", fontFamily: "Caveat", fontWeight: 700, fontSize: 76, color: INK, whiteSpace: "nowrap" }}>
      Topologie : tasse = donut
    </div>
  );
};

export const TopologyDoodle: React.FC = () => {
  useFontFaces([["Caveat", "fonts/caveat-latin-700-normal.woff2", "700"]]);
  const frame = useCurrentFrame();
  const f = Math.min(frame, HOLD);                  // everything freezes for the last second
  const seed = frame < HOLD ? Math.floor(frame / 3) % 6 : 99; // lines boil every 3 frames, then stop
  return (
    <AbsoluteFill style={{ background: COL.sky }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#wobble)"><Scene f={f} /></g>
      </svg>
      <Label f={f} />
    </AbsoluteFill>
  );
};
