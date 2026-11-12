// "La complexité" — ~14 min horizontal (1920x1080) explainer. Fast-cut motion-graphic clips (graph paper,
// neon on black, blueprint, red slams) change every few seconds, driven by script.json (text + clip list
// per sentence) and timing.json (sentence start/end from the synthesized French voice-over).
import "katex/dist/katex.min.css";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useFontFaces } from "../components/FontFaces";
import { clamp } from "../theme";
import { R, eo, sat } from "./clips";
import script from "./script.json";
import T from "./timing.json";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
export const CX_FRAMES = fr(T.total);
type Bg = "paper" | "dark" | "blue" | "red";
type Clip = { a: number; kind: string; args: unknown[]; bg: Bg };
const FORCE: Record<string, Bg> = { chap: "dark", slamr: "red", code: "dark", vs: "dark", end: "dark", loop: "dark", tape: "blue", reduce: "dark", sudoku: "paper", strike: "paper", grid: "paper", dice: "dark" };
const CYCLE: Bg[] = ["paper", "dark", "blue", "dark", "paper", "dark"];

const CLIPS: Clip[] = (() => {
  const out: Clip[] = []; let n = 0;
  (script as { t: string; c: unknown[][] }[]).forEach((s, i) => {
    const a = T.S[i] - 0.12, b = T.E[i], w = s.c.map((c) => (c[0] === "chap" ? 0.75 : 1)), tot = w.reduce((x, y) => x + y, 0); let acc = 0;
    s.c.forEach((c, j) => { const kind = c[0] as string; out.push({ a: Math.max(0, a + ((b - a) * acc) / tot), kind, args: c.slice(1), bg: FORCE[kind] ?? CYCLE[n % CYCLE.length] }); acc += w[j]; n++; });
  });
  return out;
})();

const Paper: React.FC = () => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <rect width={1920} height={1080} fill="#f3f1ea" />
    {Array.from({ length: 49 }).map((_, i) => <line key={`v${i}`} x1={i * 40} x2={i * 40} y1={0} y2={1080} stroke="#9bb4d6" strokeWidth={i % 5 ? 1 : 2.6} opacity={0.5} />)}
    {Array.from({ length: 28 }).map((_, i) => <line key={`h${i}`} y1={i * 40} y2={i * 40} x1={0} x2={1920} stroke="#9bb4d6" strokeWidth={i % 5 ? 1 : 2.6} opacity={0.5} />)}
  </svg>
);
const BG: Record<Bg, React.ReactNode> = {
  paper: <Paper />,
  dark: <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, #1b1d2e 0%, #07070c 78%)" }} />,
  blue: <div style={{ position: "absolute", inset: 0, background: "#0f3fa8", backgroundImage: "linear-gradient(#ffffff22 2px, transparent 2px), linear-gradient(90deg, #ffffff22 2px, transparent 2px)", backgroundSize: "60px 60px" }} />,
  red: <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, #ff4a4a 0%, #c20d0d 82%)" }} />,
};
const INK: Record<Bg, [string, string]> = { paper: ["#141414", "#6b7280"], dark: ["#ffffff", "#9aa0b5"], blue: ["#eaf2ff", "#a9c4ff"], red: ["#ffffff", "#ffd9d9"] };

const View: React.FC<{ t: number }> = ({ t }) => {
  const i = useMemo(() => { let lo = 0, hi = CLIPS.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (CLIPS[m].a <= t) lo = m; else hi = m - 1; } return lo; }, [t]);
  const c = CLIPS[i], u = t - c.a, d = (CLIPS[i + 1]?.a ?? T.total) - c.a;
  const dir = i % 2 ? 1 : -1, punch = 1.12 - 0.12 * eo(u / 0.22) + 0.035 * (u / d);
  const [ink, dim] = INK[c.bg];
  const gl = sat(1 - u / 0.16), dx = 26 * gl * dir, f = Math.floor(t * 15);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, overflow: "hidden", background: "#000" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}><defs>
        <filter id={`rgb${i}`} x="-4%" width="108%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={dx} result="ro" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-dx} result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" />
        </filter></defs></svg>
      <div style={{ position: "absolute", inset: 0, filter: gl > 0 ? `url(#rgb${i})` : undefined,
        transform: `translate(${(1 - eo(u / 0.18)) * 40 * dir + Math.sin(t * 0.7) * 5}px, ${Math.cos(t * 0.53) * 4 + (gl > 0.5 ? Math.sin(t * 190) * 7 : 0)}px) scale(${punch}) rotate(${(1 - eo(u / 0.2)) * 1.1 * dir}deg)` }}>
        <div style={{ position: "absolute", inset: -40, transform: `scale(${1.05 - 0.03 * (u / d)})` }}><div style={{ position: "absolute", inset: 40 }}>{BG[c.bg]}</div></div>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <defs><filter id="sticker" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={7} result="dil" /><feFlood floodColor="#ffffff" /><feComposite in2="dil" operator="in" result="out" />
            <feGaussianBlur in="dil" stdDeviation={9} result="bl" /><feOffset in="bl" dy={12} result="off" /><feComponentTransfer in="off" result="sh"><feFuncA type="linear" slope={0.45} /></feComponentTransfer>
            <feMerge><feMergeNode in="sh" /><feMergeNode in="out" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          {(R[c.kind] ?? R.slam)(c.args, { u, d, ink, dim, bg: c.bg })}</svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: sat(1 - u * 14) * 0.3 }} />
      {gl > 0.3 ? [0, 1, 2].map((b) => <div key={b} style={{ position: "absolute", left: 0, right: 0, top: ((f * 131 + b * 367) % 1000), height: 30 + ((f * 17 + b * 29) % 60), background: b % 2 ? "rgba(40,224,255,0.22)" : "rgba(255,45,45,0.22)",
        transform: `translateX(${((f * 53 + b * 97) % 80) - 40}px)` }} />) : null}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("cx/grain.png")})`, backgroundPosition: `${(f * 173) % 512}px ${(f * 311) % 512}px`, opacity: c.bg === "paper" ? 0.2 : 0.14, mixBlendMode: "overlay" }} />
    </div>
  );
};
/** contact sheet for review: frame n shows 20 consecutive clips at 75 % of their duration */
export const CX_SHEETS = Math.ceil(CLIPS.length / 20);
export const CxSheet: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const n = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#222" }}>{CLIPS.slice(n * 20, n * 20 + 20).map((c, j) => { const k = n * 20 + j, d = (CLIPS[k + 1]?.a ?? T.total) - c.a;
    return <div key={k} style={{ position: "absolute", left: (j % 5) * 384, top: Math.floor(j / 5) * 270, width: 384, height: 216, overflow: "hidden" }}>
      <div style={{ transform: "scale(0.2)", transformOrigin: "0 0", width: 1920, height: 1080, position: "relative" }}><View t={c.a + d * 0.78} /></div></div>; })}</AbsoluteFill>;
};

const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, fr(at))} durationInFrames={40}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);

export const CxEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-600.woff2", "600"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame(), t = f / FPS;
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["400 40px KaTeX_Main", "italic 40px KaTeX_Math", "40px KaTeX_AMS", "40px Anton", "600 40px InterX"].map((x) => document.fonts.load(x, "fOn²ⁿ∞Ω")))
      .catch(() => null).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <View t={t} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 220px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: ((f * 12) % 1300) - 110, height: 110, background: "linear-gradient(transparent, rgba(255,255,255,0.045), transparent)" }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: 1920 * sat(t / T.total), background: "#ff2d2d" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [CX_FRAMES - 12, CX_FRAMES - 1], [0, 1], clamp) }} />
      <Audio src={staticFile("cx/voice.m4a")} />
      <Audio src={staticFile("cx/bed.m4a")} volume={(x) => interpolate(x, [0, 20, CX_FRAMES - 60, CX_FRAMES - 3], [0, 0.06, 0.06, 0], clamp)} />
      <Audio src={staticFile("cx/sfx.m4a")} />
    </AbsoluteFill>
  );
};
