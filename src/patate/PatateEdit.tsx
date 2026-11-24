// « La fusion des patates » — a merge-physics video with the friends' faces on potatoes.
// The physics (drops, bounces, merges of two identical potatoes into the next one) is simulated offline in sim.json;
// this file only draws it: flask, potatoes, merge bursts, the unlocked-potatoes row, the final crown.
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import SIM from "./sim.json";
import AUD from "./audio.json";

const FPS = 30, OFF = Math.round(AUD.off * FPS), DY = 120;
type Body = [number, number, number, number, number];
const FR = SIM.frames as unknown as (Body[] | number)[][];
export const PATATE_FRAMES = OFF + FR.length;
const FIRST = SIM.first as Record<string, number>;
const EVENTS = SIM.events as number[][];
const NAMES = ["", "Dhia", "Mourad", "Ayhem", "Youcef", "Benhafri", "Anes", "Ayoub"];
const FILES = ["", "dhia", "mourad", "ayhem", "youcef", "benhafri", "anes", "ayoub"];
const R = [0, 40, 52, 68, 86, 108, 136, 172];
const LC = ["", "#9be15d", "#4fd1c5", "#4f9dff", "#8f7bff", "#d26bff", "#ff6b9e", "#ffd23f"];   // one colour per level (rings, banner)
const YEL = "#ffd23f", W = "#ffffff", DIM = "#a9b0d6";
const sat = (x: number) => Math.min(1, Math.max(0, x));
const eo = (x: number) => 1 - Math.pow(1 - sat(x), 3);
const pp = (u: number, at = 0, d = 0.32) => { const x = sat((u - at) / d); if (x <= 0) return 0; const c = 2.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** irregular potato outline around the physics circle */
const blob = (r: number, seed: number) => { let d = ""; const n = 22;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + 0.045 * Math.sin(3 * a + seed) + 0.03 * Math.sin(5 * a + seed * 1.7) - 0.02;
    d += `${i ? "L" : "M"}${(Math.cos(a) * r * k * 1.04).toFixed(1)} ${(Math.sin(a) * r * k * 0.98).toFixed(1)} `; } return d + "Z"; };
const Potato: React.FC<{ x: number; y: number; level: number; ang: number; uid: number; sc?: number; label?: boolean }> = ({ x, y, level, ang, uid, sc = 1, label }) => {
  const r = R[level], s = (uid % 7) + 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      <g transform={`rotate(${ang})`}>
        <path d={blob(r, s)} fill="url(#skin)" stroke="#6b4313" strokeWidth={Math.max(2, r * 0.06)} />
        {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={Math.cos(i * 1.9 + s) * r * 0.78} cy={Math.sin(i * 1.9 + s) * r * 0.78} rx={r * 0.06} ry={r * 0.045} fill="#9a6420" opacity={0.6} />)}
        <image href={staticFile(`patate/${FILES[level]}.png`)} x={-r * 0.8} y={-r * 0.84} width={r * 1.6} height={r * 1.6} />
        <path d={blob(r, s)} fill="url(#shine)" />
      </g>
      {label && <g transform={`translate(0 ${r * 0.78})`}><rect x={-r * 0.82} y={-r * 0.17} width={r * 1.64} height={r * 0.34} rx={r * 0.17} fill={LC[level]} />
        <text y={r * 0.02} fontFamily="Anton" fontSize={r * 0.26} fill="#14101f" textAnchor="middle" dominantBaseline="central">{NAMES[level].toUpperCase()}</text></g>}
    </g>
  );
};
const Crown: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} style={{ filter: "drop-shadow(0 0 18px #ffd23f)" }}>
    <path d="M-90 40 L-100 -40 L-50 0 L0 -60 L50 0 L100 -40 L90 40 Z" fill={YEL} stroke="#8a5a00" strokeWidth={6} strokeLinejoin="round" />
    <rect x={-92} y={36} width={184} height={26} rx={6} fill="#f2b705" stroke="#8a5a00" strokeWidth={6} />
    {[-100, 0, 100].map((cx, i) => <circle key={i} cx={cx} cy={i === 1 ? -64 : -44} r={12} fill="#ff5a7a" stroke="#8a5a00" strokeWidth={4} />)}</g>);

const FX = 540, FY = 1080 + DY, FRAD = 430, NECK = 80;
const flaskPath = (() => { const a0 = Math.asin(NECK / FRAD), top = FY - FRAD * Math.cos(a0);
  return `M${FX - NECK} ${120 + DY} V${top} A${FRAD} ${FRAD} 0 1 0 ${FX + NECK} ${top} V${120 + DY}`; })();

export const PatateEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => { document.fonts.load("40px Anton").catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h)); }, [h]);
  const f = useCurrentFrame(), t = f / FPS, sf = Math.max(0, Math.min(FR.length - 1, f - OFF)), st = (f - OFF) / FPS, row = FR[sf];
  const bodies = row.slice(0, -1) as unknown as Body[], score = row[row.length - 1] as unknown as number;
  const unlocked = (l: number) => l === 1 ? f >= OFF + 18 : FIRST[l] !== undefined && sf >= FIRST[l];
  const maxL = [7, 6, 5, 4, 3, 2, 1].find((l) => unlocked(l)) ?? 0;
  // the newest first appearance drives the banner and a short flash
  const newest = [2, 3, 4, 5, 6, 7].filter((l) => FIRST[l] !== undefined && sf >= FIRST[l]).pop(), nf = newest ? sf - FIRST[newest] : 999;
  const bornAt = new Map<number, number>(); EVENTS.forEach(([ef, , , , uid]) => bornAt.set(uid, ef));
  const kingF = FIRST[7], king = bodies.find((b) => b[1] === 7), endT = kingF !== undefined ? (sf - kingF) / FPS : -1;
  const zoom = endT > 2 ? 1 + 0.16 * eo((endT - 2) / 1.6) : 1 + 0.025 * sat(1 - nf / 9), zx = king && endT > 2 ? king[2] : FX, zy = king && endT > 2 ? king[3] + DY : FY;
  const hue = LC[Math.max(1, maxL)];
  return (
    <AbsoluteFill style={{ background: "#07081a", overflow: "hidden" }}>
      {/* rotating soft rays + glow behind the flask */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="skin" cx="38%" cy="32%" r="75%"><stop offset="0%" stopColor="#ffe29a" /><stop offset="55%" stopColor="#f2b54c" /><stop offset="100%" stopColor="#c9812a" /></radialGradient>
          <radialGradient id="shine" cx="30%" cy="22%" r="60%"><stop offset="0%" stopColor="#fff" stopOpacity={0.35} /><stop offset="45%" stopColor="#fff" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={0.18} /></radialGradient>
          <radialGradient id="bg" cx="50%" cy="62%" r="60%"><stop offset="0%" stopColor={hue} stopOpacity={0.22} /><stop offset="100%" stopColor="#07081a" stopOpacity={0} /></radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#bg)" />
        <g transform={`translate(${FX} ${FY}) rotate(${t * 6})`} opacity={0.16}>{Array.from({ length: 18 }).map((_, i) => <path key={i} d="M0 0 L-60 -1100 L60 -1100 Z" fill={hue} transform={`rotate(${i * 20})`} />)}</g>
        {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={rnd(i) * 1080} cy={(rnd(i + 99) * 1920 + t * (10 + rnd(i + 7) * 30)) % 1920} r={1 + rnd(i + 3) * 2.5} fill="#fff" opacity={0.25 + rnd(i + 5) * 0.4} />)}
      </svg>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${zx} ${zy}) scale(${zoom}) translate(${-zx} ${-zy})`}>
          {/* glass flask */}
          <path d={flaskPath} fill="none" stroke={hue} strokeWidth={16} strokeOpacity={0.18} />
          <path d={flaskPath} fill="#ffffff06" stroke={hue} strokeWidth={6} style={{ filter: `drop-shadow(0 0 14px ${hue})` }} />
          {/* merge bursts */}
          {EVENTS.filter(([ef]) => sf >= ef && sf < ef + 14).map(([ef, x, y, l, uid]) => { const u = (sf - ef) / 14;
            return <g key={uid} transform={`translate(${x} ${y + DY})`} opacity={1 - u}><circle r={R[l] * (0.8 + u * 1.1)} fill="none" stroke={LC[l]} strokeWidth={8 * (1 - u)} />
              {Array.from({ length: 10 }).map((_, i) => { const a = (i / 10) * Math.PI * 2 + uid, d = R[l] * (0.9 + u * 1.6); return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={5 * (1 - u)} fill={i % 2 ? LC[l] : YEL} />; })}</g>; })}
          {[...bodies].sort((a, b) => a[1] - b[1]).map(([uid, l, x, y, ang]) => { const b = bornAt.get(uid), sc = b !== undefined && sf - b < 10 ? 0.75 + 0.25 * pp((sf - b) / FPS, 0, 0.3) : 1;
            return <Potato key={uid} uid={uid} level={l} x={x} y={y + DY} ang={ang * 0.35} sc={sc} label={l >= 5} />; })}
          {king && endT > 2.2 && <Crown x={king[2]} y={king[3] + DY - R[7] - 40 - 380 * (1 - eo((endT - 2.2) / 0.7))} s={0.9} rot={Math.sin(t * 3) * 4} />}
        </g>
      </svg>
      {/* title */}
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: "Anton", fontSize: 54, letterSpacing: 3, color: "#14101f", background: YEL, padding: "6px 26px", borderRadius: 16 }}>LA FUSION DES PATATES</span></div>
      {/* intro question */}
      {f < OFF + 60 && <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", opacity: sat(f / 8) * sat((OFF + 60 - f) / 10), transform: `scale(${pp(t, 0.1)})` }}><div style={{ display: "inline-block", fontFamily: "Anton", fontSize: 92, lineHeight: 1.08, color: W, background: "rgba(7,8,26,0.85)", borderRadius: 30, padding: "18px 40px" }}>
        QUI SERA LA<br /><span style={{ color: YEL }}>PATATE SUPRÊME ?</span></div></div>}
      {/* new potato banner */}
      {newest && nf < 75 && newest < 7 && <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", opacity: sat(nf / 4) * sat((75 - nf) / 10), transform: `scale(${pp(nf / FPS, 0, 0.3)})` }}>
        <div style={{ display: "inline-block", background: "rgba(7,8,26,0.82)", border: `3px solid ${LC[newest]}`, borderRadius: 28, padding: "14px 34px" }}>
        <div style={{ fontFamily: "InterX", fontWeight: 800, fontSize: 34, letterSpacing: 6, color: LC[newest] }}>NIVEAU {newest} !</div>
        <div style={{ fontFamily: "Anton", fontSize: 84, color: W, textShadow: `0 0 26px ${LC[newest]}` }}>LA PATATE À {NAMES[newest].toUpperCase()}</div></div></div>}
      {/* ending */}
      {endT >= 0 && endT <= 5.3 && <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", opacity: sat(endT * 4) }}>
        <div style={{ fontFamily: "InterX", fontWeight: 800, fontSize: 36, letterSpacing: 8, color: YEL, transform: `scale(${pp(endT, 0)})` }}>NIVEAU 7 · MAXIMUM</div>
        <div style={{ fontFamily: "Anton", fontSize: 96, color: W, textShadow: "0 0 30px #ffd23f, 0 6px 18px #000", transform: `scale(${pp(endT, 0.15)})` }}>{endT < 2.9 ? "LA PATATE À AYOUB" : "LA PATATE SUPRÊME"}</div></div>}
      {endT > 5.3 && <div style={{ position: "absolute", top: 290, left: 60, right: 60, textAlign: "center", fontFamily: "Anton", fontSize: 64, lineHeight: 1.1, color: W, transform: `scale(${pp(endT, 5.3)})`, textShadow: "0 6px 18px #000" }}>
        ET TOI, QUELLE PATATE<br />MÉRITE LA <span style={{ color: YEL }}>COURONNE</span> ?</div>}
      {/* flash on each new level */}
      <AbsoluteFill style={{ background: newest === 7 ? YEL : "#fff", opacity: (newest ? sat(1 - nf / 7) * (newest === 7 ? 0.55 : 0.28) : 0) }} />
      {/* score + unlocked potatoes row */}
      {!(endT > 5.3) && <div style={{ position: "absolute", top: 1660, left: 0, right: 0, textAlign: "center", fontFamily: "Anton", fontSize: 60, color: W, letterSpacing: 2 }}>SCORE : {score.toLocaleString("fr-FR")}</div>}
      <svg width={1080} height={200} style={{ position: "absolute", left: 0, top: 1730 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((l) => { const x = 540 + (l - 4) * 138, on = unlocked(l), at = l === 1 ? OFF + 18 : (FIRST[l] ?? 1e9) + OFF, pop = on ? pp((f - at) / FPS, 0, 0.35) : 1;
          return <g key={l} transform={`translate(${x} 70) scale(${pop})`}>
            <circle r={56} fill="#11142c" stroke={on ? LC[l] : "#2c3150"} strokeWidth={5} />
            {on ? <><image href={staticFile(`patate/${FILES[l]}.png`)} x={-50} y={-50} width={100} height={100} /><text y={86} fontFamily="Anton" fontSize={26} fill={W} textAnchor="middle">{NAMES[l].toUpperCase()}</text></>
              : <text y={4} fontFamily="Anton" fontSize={52} fill="#3c4370" textAnchor="middle" dominantBaseline="central">?</text>}</g>; })}
      </svg>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [PATATE_FRAMES - 8, PATATE_FRAMES - 1], [0, 1], clamp) }} />
      {AUDIO ? <Audio src={staticFile("patate/mix.m4a")} /> : null}
    </AbsoluteFill>
  );
};
const AUDIO = true;
