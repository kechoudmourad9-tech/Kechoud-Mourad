// "Les bases de l'informatique — du transistor au malware": ~4.5 min fully 3D explainer
// (react-three-fiber in Remotion). A guide character presents floating 3D models on a neon stage:
// vacuum tubes → transistor → bits → logic gates → CPU / GPU → memory → code & compiler → OS & apps →
// network → malware (virus, worm, trojan, ransomware, spyware, botnet) → infection → protection.
// French voice-over (public/info/voice.m4a), word-highlight captions, chapter header, music + SFX.
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { useFontFaces } from "../components/FontFaces";
import { Vignette } from "../components/Layers";
import { clamp, theme } from "../theme";
import { Cam, Earth, Stars } from "../terre/world3d";
import { AppWin, Bit, Bug, Chip, Doc, Eye, Gamepad, Gate, Guy, Hacker, Horse, Lamp, Laptop, Lbl, Lock, Monitor, Mosfet, N, Phone, Server, Shadowify, Shield, Stage, Sub, Tube,
  Virus, Wire, Worm, lerp, pop, ramp, rnd, sat, textTex } from "./kit3d";
import T from "./timing.json";
import captions from "./captions.json";

const FPS = 30;
const fr = (x: number) => Math.round(x * FPS);
export const INFO_FRAMES = fr(T.total);
const S = (i: number) => T.S[i], E = (i: number) => T.E[i];
const nz = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
/** time of the first word of sentence i starting with `key` (fallback: a fraction of the sentence) */
const w = (i: number, key: string, frac = 0.5, nth = 0) => {
  const m = (T.W[i] as [string, number, number][]).filter((x) => nz(x[0]).startsWith(key));
  return m[nth] ? m[nth][1] : S(i) + frac * (E(i) - S(i));
};
const a_ = (i: number) => S(i) - 0.2;                       // sub-scene boundary before sentence i
type V3 = [number, number, number];

/* chapters: [first sentence, title] */
const CH: [number, string][] = [[0, "Une seule idée"], [3, "Le transistor"], [9, "Bits & octets"], [14, "Portes logiques"], [19, "Le processeur"], [23, "La mémoire"],
  [26, "Le code"], [31, "Le logiciel"], [35, "Le réseau"], [38, "Les malwares"], [45, "L'infection"], [49, "Se protéger"], [54, "En résumé"]];
const chStart = (k: number) => (k === 0 ? 0 : S(CH[k][0]) - 0.4);
const chOf = (t: number) => { let k = 0; for (let i = 0; i < CH.length; i++) if (t >= chStart(i)) k = i; return k; };

/* the guide character: stands on the floor, points at the floating model */
const Guide: React.FC<{ t: number; x?: number; point?: boolean; shirt?: string; cheer?: boolean; scared?: boolean; z?: number }> = ({ t, x = -2.4, point = true, shirt = N.pink, cheer, scared, z = 0 }) => (
  <Guy pos={[x + (scared ? Math.sin(t * 40) * 0.03 : 0), cheer ? Math.abs(Math.sin(t * 6)) * 0.35 : 0, z]} rot={[0, x < 0 ? 0.35 : -0.35, 0]} scale={1.15} shirt={shirt}
    armR={cheer || scared ? -2.7 + Math.sin(t * 9) * 0.3 : x < 0 && point ? -2.3 + Math.sin(t * 2.2) * 0.12 : 0.1 + Math.sin(t * 2) * 0.05}
    armL={cheer || scared ? -2.7 + Math.cos(t * 9) * 0.3 : x >= 0 && point ? -2.3 + Math.sin(t * 2.2) * 0.12 : -0.1 + Math.sin(t * 2) * 0.05} mouth={scared ? "o" : "smile"} />
);
const Float: React.FC<{ t: number; y?: number; children: React.ReactNode; amp?: number; x?: number; z?: number }> = ({ t, y = 5.4, children, amp = 0.12, x = 0, z = 0 }) => (
  <group position={[x, y + Math.sin(t * 1.3) * amp, z]}>{children}</group>
);
const Box: React.FC<{ pos: V3; size: V3; color: string; em?: number; rot?: V3 }> = ({ pos, size, color, em = 0, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.4} metalness={0.2} emissive={color} emissiveIntensity={em} /></mesh>
);
/* falling 0/1 rain */
const BitRain: React.FC<{ t: number; n?: number; y0?: number; y1?: number; w?: number; color?: string }> = ({ t, n = 40, y0 = 8.4, y1 = 2.6, w: W = 6, color = N.cyan }) => (
  <>{Array.from({ length: n }).map((_, i) => { const p = (t * (0.25 + rnd(i, 1) * 0.3) + rnd(i, 2)) % 1;
    return <Lbl key={i} text={rnd(i + Math.floor(t * 2 + rnd(i, 5) * 9), 3) > 0.5 ? "1" : "0"} pos={[(rnd(i, 4) - 0.5) * W, lerp(y0, y1, p), -1 + rnd(i, 6) * 1.5]} h={0.42} fg={i % 3 ? color : "#ffffff"}
      op={Math.sin(p * Math.PI)} />; })}</>
);

/* ================= A — intro ================= */
const Intro: React.FC<{ t: number }> = ({ t }) => {
  const sw = Math.sin((t - S(1)) * 2.6) > 0 ? 1 : 0;       // the switch toggles
  return (<>
    <Stage t={t} />
    <Guide t={t} cheer={t < S(1) - 0.5} point={t > S(1)} />
    <Sub t={t} a={0} b={a_(1)}>
      <Float t={t} y={5.6}>
        <Phone pos={[-2.2, 0.2 + Math.sin(t * 2) * 0.15, 0]} s={1.05 * pop(t, 0.3)} rot={[0, Math.sin(t) * 0.5, 0.1]}><Lbl text="♥" font="sans-serif" h={0.6} /></Phone>
        <Gamepad pos={[0, 1.7 + Math.sin(t * 2 + 1) * 0.15, 0]} s={1.25 * pop(t, 1.0)} rot={[0.2, Math.sin(t * 1.2) * 0.5, 0]} />
        <Laptop pos={[2.0, -0.7 + Math.sin(t * 2 + 2) * 0.15, 0]} s={1.05 * pop(t, 1.7)} rot={[0.15, -0.5 + Math.sin(t * 0.9) * 0.3, 0]} />
        <Lamp pos={[0, -0.2, 0]} on={1} r={0.5 * pop(t, w(0, "idée", 0.8))} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(1)} b={a_(2)}>
      <Float t={t} y={5.6}>
        <Box pos={[-3, 0, 0]} size={[0.9, 1.5, 0.6]} color={N.green} em={0.3} /><Lbl text="+" pos={[-3, 0, 0.32]} h={0.8} />
        <Wire a={[-2.5, 0, 0]} b={[-0.75, 0, 0]} on={sw} /><Wire a={[0.75, 0, 0]} b={[2.3, 0, 0]} on={sw} />
        <group position={[-0.75, 0, 0]} rotation={[0, 0, sw ? 0 : 0.6]}><Wire a={[0, 0, 0]} b={[1.5, 0, 0]} on={sw} r={0.1} /></group>
        <Lamp pos={[2.75, 0, 0]} on={sw} r={0.6} />
        {sw > 0 && Array.from({ length: 8 }).map((_, i) => <mesh key={i} position={[-2.5 + ((t * 3 + i * 0.6) % 4.8), 0, 0.12]}><sphereGeometry args={[0.09, 8, 8]} /><meshBasicMaterial color={N.cyan} toneMapped={false} /></mesh>)}
        <Bit v={sw} pos={[0, 2.1, 0]} s={1.5} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(2)} b={chStart(1)}>
      <Float t={t} y={5.6}>
        <group scale={pop(t, w(2, "transistor", 0.4))} position={[-2, 0.8, 0]}><Mosfet t={t} on={1} s={0.42} /></group>
        {[0, 1, 2, 3].map((i) => <mesh key={i} position={[-0.7 + i * 0.5, 0.8 - i * 0.45, 0]} scale={pop(t, w(2, "transistor", 0.4) + 0.3 + i * 0.12)}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color={N.yellow} toneMapped={false} /></mesh>)}
        <Virus t={t} pos={[1.9, -1.0, 0]} s={1.9 * pop(t, w(2, "virus", 0.85))} />
        <Lbl text="5 min" pos={[0, 2.5, 0]} h={1.1} bg={N.purple} s={pop(t, S(2) + 0.1)} />
      </Float>
    </Sub>
  </>);
};

/* ================= B — transistor ================= */
const Transistor: React.FC<{ t: number }> = ({ t }) => {
  const on = t >= a_(7) ? 0 : t >= w(6, "tension", 0.3) ? 1 : 0;
  const zoom = ramp(t, a_(8), a_(8) + 1.2);
  return (<>
    <Stage t={t} a={N.orange} b={N.purple} />
    <Guide t={t} x={t < a_(5) ? -2.5 : 2.5} />
    <Sub t={t} a={chStart(1)} b={a_(4)}>
      {Array.from({ length: 12 }).map((_, i) => <Tube key={i} pos={[-2.25 + (i % 4) * 1.5, 3.4 + Math.floor(i / 4) * 1.8, -0.5]} s={1.25 * pop(t, chStart(1) + 0.2 + i * 0.07)} glow={0.55 + Math.sin(t * 7 + i * 2) * 0.35} />)}
      <Box pos={[0, 3.3, -0.5]} size={[6.4, 0.16, 1]} color="#3a3f5c" /><Box pos={[0, 5.1, -0.5]} size={[6.4, 0.16, 1]} color="#3a3f5c" /><Box pos={[0, 6.9, -0.5]} size={[6.4, 0.16, 1]} color="#3a3f5c" />
    </Sub>
    <Sub t={t} a={a_(4)} b={a_(5)}>
      <Float t={t} y={5.6}>
        <group rotation={[0, Math.sin(t * 1.5) * 0.6, 0]} scale={1.5}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.6, 0.6, 0.5, 20, 1, false, 0, Math.PI]} /><meshStandardMaterial color="#15182b" roughness={0.4} /></mesh>
          <Box pos={[0, 0, 0]} size={[1.2, 1.0, 0.04]} color="#15182b" />
          {[-0.35, 0, 0.35].map((x) => <mesh key={x} position={[x, -1.1, 0.1]}><cylinderGeometry args={[0.04, 0.04, 1.4, 8]} /><meshStandardMaterial color={N.metal} metalness={0.9} roughness={0.2} /></mesh>)}
        </group>
        <Lbl text="1947" pos={[0, 2.3, 0]} h={1.2} bg={N.orange} s={pop(t, w(4, "1947", 0.3))} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(5)} b={a_(8)}>
      <Float t={t} y={5.2} amp={0.06}>
        <group rotation={[0.25, Math.sin(t * 0.5) * 0.25, 0]}><Mosfet t={t} on={on} s={1.05} /></group>
        <Lbl text="grille" pos={[0, 2.75, 0]} h={0.5} bg={N.gold} fg={N.ink} s={pop(t, w(6, "grille", 0.5))} />
        <Lbl text="source" pos={[-2.3, 1.95, 0]} h={0.4} bg={N.blue} s={pop(t, S(5) + 0.8)} /><Lbl text="drain" pos={[2.3, 1.95, 0]} h={0.4} bg={N.blue} s={pop(t, S(5) + 1.0)} />
        {t >= w(6, "tension", 0.3) && t < a_(7) && [0, 1, 2].map((i) => <Lbl key={i} text="⚡" font="sans-serif" pos={[-0.6 + i * 0.6, 3.5 + Math.sin(t * 12 + i) * 0.1, 0]} h={0.6} fg={N.yellow} />)}
        <Bit v={on} pos={[0, -2.2, 0.5]} s={1.3 * pop(t, w(6, "courant", 0.6))} on={N.green} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(8)} b={chStart(2)}>
      <Float t={t} y={5.3} amp={0.05}>
        <group rotation={[0.5 - zoom * 0.2, Math.sin(t * 0.6) * 0.3, 0]} scale={1.45}>
          <Chip label="" pulse={0.5 + Math.sin(t * 5) * 0.3} />
          {Array.from({ length: 196 }).map((_, i) => { const x = i % 14, y = Math.floor(i / 14);
            return <mesh key={i} position={[-0.65 + x * 0.1, -0.65 + y * 0.1, 0.17]}><boxGeometry args={[0.06, 0.06, 0.03]} />
              <meshBasicMaterial color={Math.sin(t * (4 + rnd(i, 1) * 9) + i) > 0.2 ? N.cyan : "#24306b"} toneMapped={false} /></mesh>; })}
        </group>
        <group scale={pop(t, w(8, "cheveu", 0.85) - 0.5)}>
          <mesh position={[0, -2.2, 1]} rotation={[0, 0, Math.PI / 2 - 0.12]}><cylinderGeometry args={[0.42, 0.42, 9, 20]} /><meshStandardMaterial color="#6b3a1e" roughness={0.6} /></mesh>
          <Lbl text="un cheveu" pos={[-1.2, -2.2, 1.45]} h={0.42} fg="#fff" />
          <mesh position={[2.2, -1.35, 1]}><boxGeometry args={[0.06, 0.06, 0.06]} /><meshBasicMaterial color={N.cyan} toneMapped={false} /></mesh>
          <Lbl text="← 1 transistor" pos={[2.2, -1.0, 1.2]} h={0.34} fg={N.cyan} />
        </group>
      </Float>
    </Sub>
  </>);
};

/* ================= C — bits ================= */
const A_BITS = [0, 1, 0, 0, 0, 0, 0, 1];
const HEART = ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000", "00000000"];
const Bits: React.FC<{ t: number }> = ({ t }) => {
  const cnt = Math.floor(ramp(t, S(10) + 0.3, w(10, "256", 0.6) + 0.6) * 255);
  const t12 = w(12, "sécrit", 0.4) + 0.5, d12 = (E(12) - t12) / 8;
  const bitsRow = (vals: number[], y: number, show: (i: number) => number) => vals.map((v, i) => (
    <Bit key={i} v={v} pos={[-2.25 + (i % 4) * 1.5, y - Math.floor(i / 4) * 1.5, 0]} s={1.15 * show(i)} />));
  return (<>
    <Stage t={t} a={N.yellow} b={N.cyan} />
    <Guide t={t} x={-2.5} />
    <Sub t={t} a={chStart(2)} b={a_(10)}>
      <Float t={t} y={5.6}><group rotation={[0.2, Math.sin(t * 1.4) * 0.5, 0]}><Bit v={Math.sin((t - S(9)) * 4) > 0 ? 1 : 0} s={2.6} /></group>
        <Lbl text="1 bit" pos={[0, 2.4, 0]} h={1} bg={N.yellow} fg={N.ink} s={pop(t, w(9, "bit", 0.85))} /></Float>
    </Sub>
    <Sub t={t} a={a_(10)} b={a_(12)}>
      <Float t={t} y={5.9} amp={0.06}>
        {bitsRow(Array.from({ length: 8 }).map((_, i) => (cnt >> (7 - i)) & 1), 0.75, (i) => pop(t, S(10) + 0.2 + i * 0.07))}
        <Lbl text={`= ${cnt}`} pos={[0, -2.3, 0]} h={1.1} fg={N.yellow} />
        {t >= a_(11) && <>
          <Lbl text="42" pos={[-2.3, 2.6, 0]} h={0.85} bg={N.blue} s={pop(t, w(11, "nombre", 0.3))} />
          <Lbl text="A" pos={[0, 2.6, 0]} h={0.85} bg={N.pink} s={pop(t, w(11, "lettre", 0.55))} />
          <group position={[2.3, 2.6, 0]} scale={pop(t, w(11, "pixel", 0.85))}><Box pos={[0, 0, 0]} size={[0.85, 0.85, 0.3]} color={new THREE.Color().setHSL((t * 0.3) % 1, 0.9, 0.55).getStyle()} em={0.5} /></group>
        </>}
      </Float>
    </Sub>
    <Sub t={t} a={a_(12)} b={a_(13)}>
      <Float t={t} y={5.9} amp={0.06}>
        {bitsRow(A_BITS.map((v, i) => (t >= t12 + i * d12 ? v : 0)), 0.2, (i) => (t >= t12 + i * d12 ? 1 + 0.25 * (1 - sat((t - t12 - i * d12) * 4)) : 0.85))}
        <Lbl text="A" pos={[0, 2.5, 0]} h={1.9} fg={N.pink} s={pop(t, S(12) + 0.6)} />
        <Lbl text="= 65" pos={[0, -2.9, 0]} h={0.8} fg={N.yellow} s={pop(t, E(12) - 0.3)} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(13)} b={chStart(3)}>
      <BitRain t={t} n={46} />
      <Float t={t} y={5.6} amp={0.08}>
        <group rotation={[0, Math.sin(t * 0.9) * 0.35, 0]}>
          {HEART.flatMap((row, y) => row.split("").map((c, x) => c === "1" && <mesh key={`${x}${y}`} position={[-1.4 + x * 0.4, 1.4 - y * 0.4, 0]} scale={pop(t, w(13, "photo", 0.15) + (x + y) * 0.04)}>
            <boxGeometry args={[0.36, 0.36, 0.36]} /><meshStandardMaterial color={y < 3 ? N.pink : N.red} emissive={N.pink} emissiveIntensity={0.4} /></mesh>))}
        </group>
        {Array.from({ length: 11 }).map((_, i) => <Box key={i} pos={[-2.5 + i * 0.5, -2.6 + Math.abs(Math.sin(t * 6 + i * 0.8)) * 0.45, 0]} size={[0.3, 0.3 + Math.abs(Math.sin(t * 6 + i * 0.8)) * 0.9, 0.3]} color={N.cyan} em={0.5} />)}
      </Float>
    </Sub>
  </>);
};

/* ================= D — logic gates ================= */
const Gates: React.FC<{ t: number }> = ({ t }) => {
  const ph = (i: number) => Math.min(3, Math.floor(sat((t - S(i) - 0.5) / (E(i) - S(i) - 0.5)) * 4));
  const A = [0, 1, 0, 1], B = [0, 0, 1, 1];
  return (<>
    <Stage t={t} a={N.purple} b={N.green} />
    <Guide t={t} x={2.5} />
    <Sub t={t} a={chStart(3)} b={a_(15)}>
      <Float t={t} y={5.6}>
        {[-1, 0, 1].map((i) => { const k = ramp(t, w(14, "fabrique", 0.5), w(14, "fabrique", 0.5) + 0.7);
          return <group key={i} position={[i * 2.1 * (1 - k), 1.6 * (1 - k) * (i === 0 ? 1 : 0.4), 0]} scale={(1 - k) * pop(t, S(14) + 0.3 + (i + 1) * 0.2)}><Mosfet t={t} on={1} s={0.36} /></group>; })}
        <group scale={pop(t, w(14, "fabrique", 0.5) + 0.5)} rotation={[0, Math.sin(t * 1.5) * 0.4, 0]}><Gate kind="and" a={1} b={1} s={1.05} /></group>
      </Float>
    </Sub>
    {([[15, "and", "ET", N.purple], [16, "or", "OU", N.blue], [17, "not", "NON", N.pink]] as const).map(([i, kind, name, col]) => (
      <Sub key={i} t={t} a={a_(i)} b={i === 17 ? a_(18) : a_(i + 1)}>
        <Float t={t} y={5.3} amp={0.06}>
          <group rotation={[0.1, Math.sin(t * 0.8) * 0.18, 0]}><Gate kind={kind} a={kind === "not" ? (ph(i) % 2) : A[ph(i)]} b={B[ph(i)]} s={1.12} color={col} name={name} /></group>
          <Lbl text={`porte ${name}`} pos={[0, 2.6, 0]} h={0.9} bg={col} />
          <Lbl text={kind === "not" ? `${ph(i) % 2}  →  ${1 - (ph(i) % 2)}` : `${A[ph(i)]} ${name} ${B[ph(i)]}  =  ${kind === "and" ? A[ph(i)] * B[ph(i)] : Math.max(A[ph(i)], B[ph(i)])}`} pos={[0, -2.3, 0]} h={0.8} fg={N.yellow} />
        </Float>
      </Sub>
    ))}
    <Sub t={t} a={a_(18)} b={chStart(4)}>
      <Float t={t} y={5.5} amp={0.05}>
        <group rotation={[0.3, Math.sin(t * 0.5) * 0.3, 0]}>
          <Box pos={[0, 0, -0.25]} size={[6.6, 5.6, 0.2]} color="#0e5a3c" />
          {Array.from({ length: 12 }).map((_, i) => { const x = -2.2 + (i % 3) * 2.2, y = 1.8 - Math.floor(i / 3) * 1.2, k = (["and", "or", "not"] as const)[(i * 7) % 3];
            return <group key={i} position={[x, y, 0]} scale={0.3 * pop(t, S(18) + 0.2 + i * 0.06)}><Gate kind={k} a={Math.sin(t * 5 + i) > 0 ? 1 : 0} b={Math.sin(t * 3.3 + i * 2) > 0 ? 1 : 0} color={[N.purple, N.blue, N.pink][(i * 7) % 3]} /></group>; })}
          {Array.from({ length: 24 }).map((_, i) => { const row = i % 4, p = (t * (0.5 + rnd(i, 1) * 0.5) + rnd(i, 2)) % 1;
            return <mesh key={i} position={[-3 + p * 6, 1.8 - row * 1.2 + (rnd(i, 3) - 0.5) * 0.5, 0.05]}><sphereGeometry args={[0.06, 6, 6]} /><meshBasicMaterial color={N.yellow} toneMapped={false} /></mesh>; })}
        </group>
        <Lbl text="1 + 1 = 10" pos={[0, 3.25, 0]} h={0.8} bg={N.green} s={pop(t, w(18, "additionnent", 0.5))} />
      </Float>
    </Sub>
  </>);
};

/* ================= E — CPU / GPU ================= */
const Cpu: React.FC<{ t: number }> = ({ t }) => {
  const P: V3[] = [[-2.3, 1.6, 0.4], [0, 0, 0.5], [2.3, 1.6, 0.4], [0, -2.3, 0.4]];
  const tf = w(20, "chercher", 0.45), td = w(20, "décode", 0.7), te = w(20, "exécute", 0.9);
  let pos: V3, stage = 0;
  if (t < a_(21)) {
    const k1 = ramp(t, tf, tf + 0.6), k2 = ramp(t, td, td + 0.5), k3 = ramp(t, te, te + 0.5);
    stage = k3 > 0.5 ? 3 : k2 > 0.5 ? 2 : k1 > 0.5 ? 1 : 0;
    pos = [0, 1, 2].map((j) => lerp(lerp(lerp(P[0][j], P[1][j], k1), P[2][j], k2), P[3][j], k3)) as V3;
  } else { const u = ((((t - S(21)) * 2.4) % 1) + 1) % 1, s3 = Math.min(2, Math.floor(u * 3)), k = (u * 3) % 1; stage = s3 + 1; pos = [0, 1, 2].map((j) => lerp(P[[0, 1, 2][s3]][j], P[[1, 2, 3][s3]][j], k)) as V3; }
  const paint = ramp(t, S(22) + 1.5, E(22));
  return (<>
    <Stage t={t} a={N.cyan} b={N.pink} />
    <Guide t={t} x={-2.5} />
    <Sub t={t} a={chStart(4)} b={a_(20)}>
      <Float t={t} y={5.5}>
        <group rotation={[0.35, Math.sin(t * 0.9) * 0.5, 0]} position={[0, lerp(3, 0, ramp(t, S(19), S(19) + 0.9)), 0]} scale={1.5}><Chip pulse={0.5 + Math.sin(t * 6) * 0.4} /></group>
        <Lbl text="le cerveau" pos={[0, 2.9, 0]} h={0.8} bg={N.cyan} fg={N.ink} s={pop(t, w(19, "cerveau", 0.7))} />
        {Array.from({ length: 10 }).map((_, i) => { const a = (i / 10) * 6.283 + t * 0.6, r = 2.4 + Math.sin(t * 3 + i) * 0.2; return <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r * 0.8, 0.3]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color={N.cyan} toneMapped={false} /></mesh>; })}
      </Float>
    </Sub>
    <Sub t={t} a={a_(20)} b={a_(22)}>
      <Float t={t} y={5.3} amp={0.05}>
        <Chip s={0.8} pulse={stage === 3 ? 1 : 0.2} />
        <Lbl text="mémoire" pos={[-2.3, 2.45, 0.4]} h={0.5} bg={stage === 1 ? N.yellow : "#2a2f52"} fg={stage === 1 ? N.ink : "#fff"} />
        <Lbl text="décodeur" pos={[2.3, 2.45, 0.4]} h={0.5} bg={stage === 2 ? N.yellow : "#2a2f52"} fg={stage === 2 ? N.ink : "#fff"} />
        <Lbl text="calcul" pos={[0, -3.15, 0.4]} h={0.5} bg={stage === 3 ? N.yellow : "#2a2f52"} fg={stage === 3 ? N.ink : "#fff"} />
        <Box pos={[-2.3, 1.6, 0]} size={[1.3, 1.0, 0.3]} color="#1f7a4f" /><Box pos={[2.3, 1.6, 0]} size={[1.3, 1.0, 0.3]} color={N.purple} /><Box pos={[0, -2.3, 0]} size={[1.6, 1.0, 0.3]} color={N.blue} />
        <Wire a={[-1.6, 1.3, 0]} b={[-0.6, 0.5, 0]} on={stage === 1 ? 1 : 0} /><Wire a={[0.6, 0.5, 0]} b={[1.6, 1.3, 0]} on={stage === 2 ? 1 : 0} /><Wire a={[1.9, 1.0, 0]} b={[0.6, -1.8, 0]} on={stage === 3 ? 1 : 0} />
        <group position={pos} rotation={[t * 3, t * 2, 0]}><Box pos={[0, 0, 0]} size={[0.5, 0.5, 0.5]} color={[N.yellow, N.yellow, N.orange, N.green][stage]} em={0.8} /></group>
        {t >= a_(21) && <group position={[0, 0, 0.3]}><mesh scale={1 + ((t * 2.4) % 1) * 2.2}><torusGeometry args={[1, 0.03, 6, 40]} /><meshBasicMaterial color={N.cyan} transparent opacity={1 - ((t * 2.4) % 1)} /></mesh></group>}
      </Float>
    </Sub>
    <Sub t={t} a={a_(22)} b={chStart(5)}>
      <Float t={t} y={5.4} amp={0.05}>
        <group rotation={[0.25, Math.sin(t * 0.6) * 0.25, 0]} position={[0, -0.6, 0]} scale={0.92}>
          <Box pos={[0, -1.6, 0]} size={[6.2, 2.4, 0.3]} color="#15182b" />
          {Array.from({ length: 2 }).map((_, i) => <group key={i} position={[-1.5 + i * 3, -1.6, 0.25]} rotation={[0, 0, t * 9]}>
            {[0, 1, 2, 3, 4, 5].map((b) => <mesh key={b} rotation={[0, 0, b * 1.047]} position={[Math.cos(b * 1.047) * 0.45, Math.sin(b * 1.047) * 0.45, 0]}><boxGeometry args={[0.7, 0.18, 0.05]} /><meshStandardMaterial color={N.metal} metalness={0.8} roughness={0.3} /></mesh>)}
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.1, 12]} /><meshStandardMaterial color={N.pink} /></mesh></group>)}
          {Array.from({ length: 144 }).map((_, i) => { const x = i % 12, y = Math.floor(i / 12), lit = (y * 12 + x) / 144 < paint;
            const face = (x - 5.5) ** 2 + (y - 5.5) ** 2 < 26, eye = (y === 7 || y === 8) && (x === 3 || x === 4 || x === 7 || x === 8), mouth = y === 3 && x > 3 && x < 8 || y === 4 && (x === 3 || x === 8);
            return <mesh key={i} position={[-1.76 + x * 0.32, 0.1 + y * 0.32, 0]}><boxGeometry args={[0.29, 0.29, 0.14]} />
              <meshBasicMaterial color={!lit ? (Math.sin(t * 14 + i) > 0.6 ? N.cyan : "#1c2148") : eye || mouth ? "#1b1d2e" : face ? N.yellow : N.blue} toneMapped={false} /></mesh>; })}
        </group>
        <Lbl text="GPU" pos={[0, -4.0, 0.6]} h={0.8} bg={N.pink} s={pop(t, w(22, "graphique", 0.25))} />
      </Float>
    </Sub>
  </>);
};

/* ================= F — memory ================= */
const Memory: React.FC<{ t: number }> = ({ t }) => {
  const off = ramp(t, w(24, "oublie", 0.65), w(24, "éteint", 0.9) + 0.2);
  const stack = (i: number) => pop(t, S(25) + 1.0 + i * 0.22);
  return (<>
    <Stage t={t} a={N.green} b={N.blue} dim={t >= a_(24) && t < a_(25) ? 1 - off * 0.6 : 1} />
    <Guide t={t} x={2.5} scared={t >= a_(24) && t < a_(25) && off > 0.5} />
    <Sub t={t} a={chStart(5)} b={a_(24)}>
      <Float t={t} y={5.5}><group rotation={[0.3, Math.sin(t) * 0.4, 0]}><Chip s={1.2} pulse={0.4} /></group>
        <Lbl text="?" pos={[1.9, 1.9, 0]} h={1.6} fg={N.yellow} s={pop(t, S(23) + 0.4)} />
        <group scale={pop(t, w(23, "mémoire", 0.8))} position={[-2.1, -1.8, 0]} rotation={[0, 0, 0.2]}><Box pos={[0, 0, 0]} size={[2.6, 0.7, 0.12]} color="#1f7a4f" /></group></Float>
    </Sub>
    <Sub t={t} a={a_(24)} b={a_(25)}>
      <Float t={t} y={5.4} amp={0.05}>
        {[-1, 1].map((d) => <group key={d} position={[1.5 * d, 0, 0]} rotation={[0, Math.sin(t * 0.7) * 0.25, 0]}>
          <Box pos={[0, 0, 0]} size={[1.9, 5.0, 0.16]} color="#1f7a4f" />
          {[0, 1, 2, 3].map((i) => <Box key={i} pos={[0, -1.7 + i * 1.15, 0.12]} size={[1.4, 0.8, 0.14]} color="#15182b" em={0} />)}
          {[0, 1, 2, 3].map((i) => <mesh key={`l${i}`} position={[0, -1.7 + i * 1.15, 0.2]}><planeGeometry args={[1.1, 0.5]} /><meshBasicMaterial color={N.green} transparent opacity={(1 - off) * (0.35 + 0.65 * Math.abs(Math.sin(t * 16 + i * 2 + d)))} toneMapped={false} /></mesh>)}
          <Box pos={[0, -2.6, 0]} size={[1.7, 0.25, 0.1]} color={N.gold} />
        </group>)}
        {Array.from({ length: 14 }).map((_, i) => { const p = (t * (1.6 + rnd(i, 1)) + rnd(i, 2)) % 1;
          return <group key={i} position={[lerp(-3.4, 3.4, p), -2 + rnd(i, 3) * 4, 0.6]} scale={(1 - off) * 0.34}><Bit v={i % 2} /></group>; })}
        <Lbl text="RAM" pos={[0, 3.2, 0]} h={0.9} bg={N.green} s={pop(t, w(24, "ram", 0.25))} />
        <Lbl text="OFF" pos={[0, 0, 1]} h={1.3} bg={N.red} s={pop(t, w(24, "éteint", 0.9))} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(25)} b={chStart(6)}>
      <Float t={t} y={5.3} amp={0.05}>
        <group position={[-1.6, 1.2, 0]} rotation={[0.9, 0, Math.sin(t * 0.5) * 0.1]}>
          <Box pos={[0, 0, 0]} size={[2.6, 0.3, 3.0]} color="#3a4060" />
          <mesh position={[0, 0.2, 0.2]} rotation={[0, t * 4, 0]}><cylinderGeometry args={[1.05, 1.05, 0.06, 32]} /><meshStandardMaterial color="#cfd6f0" metalness={0.95} roughness={0.15} /></mesh>
          <mesh position={[0, 0.25, 0.2]}><cylinderGeometry args={[0.2, 0.2, 0.1, 14]} /><meshStandardMaterial color={N.metal} /></mesh>
          <group position={[1.0, 0.28, -1.1]} rotation={[0, 0.5 + Math.sin(t * 3) * 0.25, 0]}><Box pos={[-0.5, 0, 0.3]} size={[0.12, 0.06, 1.3]} color={N.gold} /></group>
        </group>
        <group position={[1.7, 1.2, 0]} rotation={[0.3, Math.sin(t * 0.7) * 0.3, 0]}><Box pos={[0, 0, 0]} size={[2.2, 1.5, 0.22]} color="#15182b" /><Lbl text="SSD" pos={[0, 0, 0.13]} h={0.7} fg={N.cyan} /></group>
        {[0, 1, 2, 3, 4].map((i) => <Doc key={i} pos={[-2 + i * 1.0, -1.7 + Math.sin(t * 1.5 + i) * 0.08, 0.3]} s={stack(i)} color={[N.blue, N.pink, N.green, N.yellow, N.purple][i]} rot={[0, 0, (i - 2) * 0.06]} />)}
        <Lbl text={`${2025 + Math.floor(ramp(t, w(25, "garde", 0.6), E(25)) * 10)}`} pos={[0, -3.3, 0.3]} h={0.8} bg={N.blue} s={pop(t, w(25, "garde", 0.6))} />
      </Float>
    </Sub>
  </>);
};

/* ================= G — code ================= */
const CODE = ["def saluer(nom):", "    print(\"Salut\", nom)", "", "for i in range(3):", "    saluer(\"toi\")"];
const codeTex = (n: number, bad = false) => {
  const c = document.createElement("canvas"); c.width = 840; c.height = 520; const g = c.getContext("2d")!;
  g.fillStyle = "#0d1028"; g.fillRect(0, 0, 840, 520); g.font = "700 44px monospace"; g.textBaseline = "middle";
  CODE.slice(0, n).forEach((l, i) => { g.fillStyle = "#56607f"; g.fillText(String(i + 1), 24, 70 + i * 82);
    g.fillStyle = bad && i === 1 ? "#ff4b4b" : l.startsWith("def") || l.startsWith("for") ? "#ff79c6" : l.includes("print") ? "#8be9fd" : "#f1fa8c"; g.fillText(bad && i === 1 ? "    prnt(\"Salut\", nom)" : l, 84, 70 + i * 82); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
};
const STEPS = ["1. lire", "2. additionner", "3. comparer", "4. afficher", "5. répéter"];
const Code: React.FC<{ t: number }> = ({ t }) => {
  const texs = useMemo(() => [0, 1, 2, 3, 4, 5].map((n) => codeTex(n)), []);
  const badTex = useMemo(() => codeTex(5, true), []);
  const lines = Math.min(5, Math.floor(ramp(t, S(27) + 0.4, w(27, "langages", 0.6)) * 5.99));
  const cur = Math.min(4, Math.floor(sat((t - w(29, "liste", 0.45)) / (E(29) - w(29, "liste", 0.45))) * 5));
  const bug = t >= a_(30), bt = w(30, "trompe", 0.6), walk = ramp(t, S(30) + 0.2, bt);
  return (<>
    <Stage t={t} a={bug && t > bt ? N.red : N.pink} b={N.cyan} />
    <Guide t={t} x={-2.5} scared={bug && t > bt} />
    <Sub t={t} a={chStart(6)} b={a_(27)}>
      <BitRain t={t} n={50} />
      <Float t={t} y={5.3}><group rotation={[0.3, Math.sin(t) * 0.4, 0]}><Chip s={1.2} pulse={0.6} /></group></Float>
    </Sub>
    <Sub t={t} a={a_(27)} b={a_(28)}>
      <Float t={t} y={3.6} amp={0.05}><Monitor s={2.6} map={texs[lines]} rot={[0, Math.sin(t * 0.6) * 0.12, 0]} /></Float>
      <Lbl text="Python" pos={[-1.7, 8.3, 0]} h={0.7} bg={N.blue} s={pop(t, w(27, "python", 0.8))} /><Lbl text="C" pos={[1.9, 8.3, 0]} h={0.7} bg={N.purple} s={pop(t, w(27, "c", 0.95) + 0.25)} />
    </Sub>
    <Sub t={t} a={a_(28)} b={a_(29)}>
      <Float t={t} y={5.4} amp={0.04}>
        {[0, 1, 2].map((i) => { const p = ((t - S(28)) * 0.45 + i / 3) % 1; return <group key={i} position={[0, lerp(4.2, 1.4, p), 0]} scale={0.55 * Math.sin(Math.min(1, p * 1.3) * Math.PI)}><AppWin color={N.pink} name="code" /></group>; })}
        <mesh position={[0, 1.5, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[1.5, 1.2, 4, 1, true]} /><meshStandardMaterial color={N.metal} metalness={0.7} roughness={0.3} side={THREE.DoubleSide} /></mesh>
        <Box pos={[0, 0, 0]} size={[3.4, 2.0, 1.6]} color={N.purple} em={0.15} />
        <Lbl text="COMPILATEUR" pos={[0, 0.55, 0.82]} h={0.42} />
        {[-0.8, 0.8].map((x, i) => <group key={i} position={[x, -0.3, 0.85]} rotation={[0, 0, (i ? -1 : 1) * t * 3]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.42, 0.42, 0.12, 8]} /><meshStandardMaterial color={N.yellow} metalness={0.6} roughness={0.3} flatShading /></mesh></group>)}
        {Array.from({ length: 10 }).map((_, i) => { const p = ((t - S(28)) * 0.7 + i / 10) % 1; return <group key={i} position={[(rnd(i, 1) - 0.5) * 1.6, lerp(-1.1, -3.4, p), 0.3]} scale={0.42 * sat(p * 5)}><Bit v={(i * 7) % 2} on={N.cyan} /></group>; })}
      </Float>
    </Sub>
    <Sub t={t} a={a_(29)} b={chStart(7)}>
      <Float t={t} y={5.6} amp={0.04}>
        {STEPS.map((s, i) => { const act = !bug && cur === i, bad = bug && i === 2 && t > bt;
          return <group key={i} position={[(act ? 0.25 : 0) + (bad ? Math.sin(t * 50) * 0.06 : 0), 2.2 - i * 1.05, 0]} scale={pop(t, S(29) + 0.25 + i * 0.12)}>
            <Lbl text={bad ? "3. cmoparer ✗" : s} h={0.78} bg={bad ? N.red : act ? N.yellow : "#262c56"} fg={act ? N.ink : "#fff"} /></group>; })}
        {!bug && <Lbl text="▶" font="sans-serif" pos={[-3.0, 2.2 - cur * 1.05, 0]} h={0.7} fg={N.yellow} />}
        {bug && <Bug t={t} pos={[lerp(4.5, 1.6, walk), 0.1 + (t > bt ? Math.abs(Math.sin(t * 8)) * 0.3 : 0), 0.6]} s={1.5} rot={[1.2, 0, 0.6]} />}
        <Lbl text="BUG !" pos={[0, -3.4, 0.5]} h={1.1} bg={N.red} s={pop(t, w(30, "bug", 0.92))} />
      </Float>
    </Sub>
  </>);
};

/* ================= H — software / OS ================= */
const APPS: [string, string][] = [["Navigateur", N.blue], ["Jeux", N.pink], ["Messages", N.green]];
const Software: React.FC<{ t: number }> = ({ t }) => {
  const os = t >= a_(32), turn = ((Math.floor((t - S(33)) * 1.6) % 3) + 3) % 3;
  return (<>
    <Stage t={t} a={N.blue} b={N.yellow} />
    {!os && <Guide t={t} x={-2.5} />}
    <Sub t={t} a={chStart(7)} b={a_(32)}>
      <Float t={t} y={4.2} amp={0.05}>
        <Chip pos={[-1.7, 0, 0]} s={0.75} rot={[0.4, 0.3, 0]} /><Box pos={[0.6, -0.1, 0]} size={[2.2, 0.6, 0.12]} color="#1f7a4f" rot={[0.3, -0.2, 0.1]} /><Box pos={[2.4, 0, 0]} size={[1.1, 1.4, 0.3]} color="#3a4060" rot={[0.2, -0.4, 0]} />
        <Lbl text="matériel" pos={[0, -1.3, 0]} h={0.55} bg="#3a4060" />
      </Float>
      <Float t={t} y={7.0} amp={0.14}>
        {APPS.map(([n, c], i) => <group key={n} position={[-2.1 + i * 2.1, Math.sin(t * 2 + i) * 0.15, 0]} scale={0.95 * pop(t, w(31, "logiciel", 0.6) + i * 0.15)} rotation={[0, Math.sin(t + i) * 0.3, 0]}>
          <mesh><boxGeometry args={[1.7, 1.2, 0.08]} /><meshBasicMaterial color={c} transparent opacity={0.55} /></mesh></group>)}
        <Lbl text="software" pos={[0, 1.35, 0]} h={0.75} bg={N.yellow} fg={N.ink} s={pop(t, w(31, "software", 0.9))} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(32)} b={chStart(8)}>
      <group position={[0, 0, 0]}>
        <Box pos={[0, 1.0, 0]} size={[6.4, 1.1, 2.6]} color="#3a4060" /><Lbl text="MATÉRIEL" pos={[0, 1.0, 1.31]} h={0.55} />
        <group position={[0, lerp(9, 2.35, ramp(t, S(32) + 0.2, S(32) + 0.9)), 0]}>
          <Box pos={[0, 0, 0]} size={[6.0, 1.3, 2.4]} color={N.blue} em={0.25} /><Lbl text="SYSTÈME D'EXPLOITATION" pos={[0, 0, 1.21]} h={0.5} maxW={5.6} />
        </group>
        {t < a_(33) && ["Windows", "Linux", "Android"].map((n, i) => <Lbl key={n} text={n} pos={[-2.2 + i * 2.2, 5.2 + Math.sin(t * 2 + i) * 0.15, 0.5]} h={0.62} bg={[N.cyan, N.yellow, N.green][i]} fg={N.ink}
          s={pop(t, w(32, ["windows", "linux", "android"][i], 0.6 + i * 0.13))} />)}
        {t >= a_(33) && <>
          <Guy pos={[0, 3.0, 0.3]} scale={0.95} shirt={N.pink} armR={-2.2 + Math.sin(t * 5) * 0.7} armL={-2.2 + Math.cos(t * 5) * 0.7} />
          <mesh position={[0.62, 5.4 + Math.sin(t * 5) * 0.25, 0.4]} rotation={[0, 0, -0.5 + Math.sin(t * 5) * 0.5]}><cylinderGeometry args={[0.025, 0.025, 0.9, 6]} /><meshBasicMaterial color="#fff" /></mesh>
          {APPS.map(([n, c], i) => { const act = t < a_(34) && turn === i;
            return <group key={n} position={[-2.2 + i * 2.2, 7.3 + (act ? Math.abs(Math.sin(t * 9)) * 0.3 : 0) - (t >= a_(34) ? 0 : 0), 0]} scale={(act ? 1.1 : 0.9) * pop(t, S(33) + 0.5 + i * 0.2)}>
              <AppWin color={c} name={n} glow={act ? 0.9 : 0.2} /></group>; })}
          {t < a_(34) && <Wire a={[0, 5.6, 0.2]} b={[-2.2 + turn * 2.2, 6.6, 0]} on={1} color={N.yellow} r={0.05} />}
          {t < a_(34) && ["fichiers", "écran", "clavier"].map((n, i) => <Lbl key={n} text={n} pos={[-2.3 + i * 2.3, 4.2, 1.4]} h={0.42} bg="#10132a" s={pop(t, w(33, ["fichiers", "écran", "clavier"][i], 0.75 + i * 0.08))} />)}
        </>}
      </group>
    </Sub>
  </>);
};

/* ================= I — network ================= */
const ll = (lat: number, lon: number, r: number) => new THREE.Vector3(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon));
const ARCS = [[0.6, 0.2, 0.1, 1.5], [0.1, 1.5, -0.5, 2.6], [0.6, 0.2, -0.3, -0.9], [-0.3, -0.9, 0.8, -2.2], [0.8, -2.2, 0.1, 1.5 + 6.283 - 3.6], [-0.5, 2.6, 0.3, 3.9], [0.3, 3.9, 0.8, 4.2]].map(([a, b, c, d]) => {
  const p = ll(a, b, 2.32), q = ll(c, d, 2.32), m = p.clone().add(q).multiplyScalar(0.5).normalize().multiplyScalar(2.32 + p.distanceTo(q) * 0.42);
  return new THREE.QuadraticBezierCurve3(p, m, q);
});
const Network: React.FC<{ t: number }> = ({ t }) => {
  const geos = useMemo(() => ARCS.map((c) => new THREE.TubeGeometry(c, 30, 0.022, 6)), []);
  const globe = t >= a_(36) && t < a_(37);
  return (<>
    {globe ? <><color attach="background" args={["#03040f"]} /><Stars /><ambientLight intensity={1} /><directionalLight position={[4, 6, 8]} intensity={2} /></> : <Stage t={t} a={N.cyan} b={N.purple} />}
    {!globe && <Guide t={t} x={-2.6} z={0.3} />}
    <Sub t={t} a={chStart(8)} b={a_(36)}>
      <Monitor pos={[-1.9, 3.6, 0]} s={1.25} rot={[0, 0.3, 0]} screen={N.blue}><Lbl text="Salut !" h={0.42} s={pop(t, w(35, "parlent", 0.8))} /></Monitor>
      <Monitor pos={[1.9, 5.6, 0]} s={1.25} rot={[0, -0.3, 0]} screen={N.green}><Lbl text="Ça va ?" h={0.42} s={pop(t, w(35, "parlent", 0.8) + 0.4)} /></Monitor>
      <Wire a={[-1.9, 3.7, -0.2]} b={[1.9, 5.7, -0.2]} on={1} color={N.cyan} />
      {Array.from({ length: 6 }).map((_, i) => { const p = (t * 0.8 + i / 6) % 1, d = i % 2 ? p : 1 - p; return <mesh key={i} position={[lerp(-1.9, 1.9, d), lerp(3.7, 5.7, d) + 0.18 * (i % 2 ? 1 : -1), 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><meshBasicMaterial color={i % 2 ? N.yellow : N.pink} toneMapped={false} /></mesh>; })}
    </Sub>
    {globe && <>
      <Earth r={2.3} spin={t * 0.25} tilt={0.25} light={[4, 3, 6]} pos={[0, 4.6, 0]} clouds={0}>
        {geos.map((g, i) => <mesh key={i} geometry={g}><meshBasicMaterial color={[N.cyan, N.yellow, N.pink][i % 3]} toneMapped={false} /></mesh>)}
        {ARCS.flatMap((c, i) => [0, 1, 2].map((j) => { const p = c.getPoint((t * 0.5 + j / 3 + i * 0.13) % 1); return <mesh key={`${i}${j}`} position={p}><boxGeometry args={[0.13, 0.13, 0.13]} /><meshBasicMaterial color="#fff" toneMapped={false} /></mesh>; }))}
        {ARCS.map((c, i) => <mesh key={`n${i}`} position={c.getPoint(0)}><sphereGeometry args={[0.09, 10, 8]} /><meshBasicMaterial color={N.yellow} toneMapped={false} /></mesh>)}
      </Earth>
      <Lbl text="paquets" pos={[0, 8.1, 0]} h={0.7} bg={N.cyan} fg={N.ink} s={pop(t, w(36, "paquets", 0.35))} />
    </>}
    <Sub t={t} a={a_(37)} b={chStart(9)}>
      {[-1, 0, 1].map((i) => <Server key={i} pos={[i * 1.6 + 1.0, 4.6, -0.5]} s={0.95 * pop(t, w(37, "serveurs", 0.45) + (i + 1) * 0.12)} t={t} seed={i * 3} />)}
      <Laptop pos={[-1.6, 3.0, 1.2]} s={1.0} rot={[0, 0.5, 0]} screen="#10132a"><Lbl text="▶" font="sans-serif" h={0.6} fg={N.red} s={pop(t, w(37, "vidéos", 0.85))} /></Laptop>
      <Lbl text="192.168.1.42" pos={[-1.6, 5.0, 1.2]} h={0.5} bg={N.yellow} fg={N.ink} s={pop(t, w(37, "adresse", 0.3))} />
      {Array.from({ length: 8 }).map((_, i) => { const p = (t * 0.7 + i / 8) % 1; return <mesh key={i} position={[lerp(1.0, -1.4, p), lerp(6.2, 3.9, p) + Math.sin(p * Math.PI) * 0.8, lerp(0, 1.2, p)]}><boxGeometry args={[0.2, 0.2, 0.2]} /><meshBasicMaterial color={N.cyan} toneMapped={false} /></mesh>; })}
    </Sub>
  </>);
};

/* ================= J — malware ================= */
const Malware: React.FC<{ t: number }> = ({ t }) => {
  const copies = Math.min(8, Math.floor(1 + ramp(t, w(39, "recopie", 0.6), E(39) + 0.3) * 7.99));
  const NODES: V3[] = [[-2.3, 3.2, 0], [2.3, 4.6, 0], [-2.3, 6.0, 0], [2.3, 7.4, 0]];
  const wu = ramp(t, S(40) + 0.4, E(40) + 0.2);
  const path = (u: number): V3 => { const k = sat(u) * 3, i = Math.min(2, Math.floor(k)), f = k - i; return [lerp(NODES[i][0], NODES[i + 1][0], f), lerp(NODES[i][1], NODES[i + 1][1], f) + 0.9, 0.5]; };
  const hx = lerp(-7, -0.9, ramp(t, S(41) + 0.1, w(41, "entrer", 0.75))), open = ramp(t, w(41, "entrer", 0.75) + 0.2, w(41, "entrer", 0.75) + 0.8);
  const locks = Math.floor(ramp(t, w(42, "chiffre", 0.25), w(42, "puis", 0.6)) * 9.99);
  return (<>
    <Stage t={t} bg="#16050f" floor="#2a0a1a" a={N.red} b={N.purple} />
    {t < a_(39) && <Hacker t={t} pos={[2.5, 0, 0]} s={1.15} rot={[0, -0.4, 0]} />}
    {t >= a_(39) && t < a_(44) && <Guide t={t} x={-2.6} z={0.3} scared point={false} />}
    <Sub t={t} a={chStart(9)} b={a_(39)}>
      <Float t={t} y={5.6}>
        <group scale={1 - ramp(t, w(38, "malveillant", 0.55), w(38, "malveillant", 0.55) + 0.4)}><AppWin color={N.blue} name="app.exe" s={1.5} /></group>
        <Virus t={t} s={2.8 * pop(t, w(38, "malveillant", 0.55) + 0.2)} />
        <Lbl text="MALWARE" pos={[0, 2.7, 0]} h={1.1} bg={N.red} s={pop(t, w(38, "malware", 0.9))} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(39)} b={a_(40)}>
      <Float t={t} y={5.5} amp={0.06}>
        {Array.from({ length: copies }).map((_, i) => { const x = i === 0 ? 0 : -2.25 + ((i - 1) % 4) * 1.5 + (i > 4 ? 0.75 : 0), y = i === 0 ? 1.7 : i < 5 ? -0.3 : -2.0;
          return <group key={i} position={[x, y, 0]} scale={i === 0 ? 1.6 : 1.15}>
            <Doc bad={i === 0 ? ramp(t, w(39, "accroche", 0.3), w(39, "accroche", 0.3) + 0.4) : 1} rot={[0, 0, Math.sin(t * 3 + i) * 0.06]} />
            {(i > 0 || t > w(39, "accroche", 0.3)) && <Virus t={t} seed={i} pos={[0.3, 0.4, 0.2]} s={0.5} />}</group>; })}
        {t < w(39, "accroche", 0.3) && <Virus t={t} pos={[lerp(3.5, 0.5, ramp(t, S(39), w(39, "accroche", 0.3))), 2.4 + Math.abs(Math.sin(t * 8)) * 0.5, 0.3]} s={0.8} />}
        <Lbl text="VIRUS" pos={[0, 3.3, 0]} h={0.9} bg={N.red} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(40)} b={a_(41)}>
      {NODES.map((p, i) => <Monitor key={i} pos={[p[0], p[1] - 0.4, 0]} s={0.85} rot={[0, p[0] < 0 ? 0.35 : -0.35, 0]} screen={wu * 3 >= i - 0.05 ? N.red : N.blue}>
        {wu * 3 >= i - 0.05 && <Lbl text="☠" font="sans-serif" h={0.7} />}</Monitor>)}
      {[0, 1, 2].map((i) => <Wire key={i} a={[NODES[i][0], NODES[i][1] + 0.6, -0.2]} b={[NODES[i + 1][0], NODES[i + 1][1] + 0.6, -0.2]} on={wu * 3 > i ? 1 : 0} color={N.red} r={0.05} />)}
      <Worm path={path} u={wu} t={t} />
      <Lbl text="VER" pos={[0, 8.3, 0]} h={0.9} bg="#7cc70f" fg={N.ink} />
    </Sub>
    <Sub t={t} a={a_(41)} b={a_(42)}>
      <group position={[0, 3.2, 0]}>
        <Horse pos={[hx, 0, 0.5]} s={1.25} open={open} roll={-hx * 2} />
        <Lbl text="GRATUIT !" pos={[hx, 4.7, 1.2]} h={0.6} bg={N.green} s={1 - open} />
        <Monitor pos={[2.4, 0, 0]} s={1.2} rot={[0, -0.5, 0]} screen={open > 0.9 ? N.red : N.blue} />
        {open > 0 && [0, 1, 2, 3].map((i) => { const k = ramp(t, w(41, "entrer", 0.75) + 0.4 + i * 0.15, w(41, "entrer", 0.75) + 1.2 + i * 0.15);
          return <Virus key={i} t={t} seed={i} pos={[lerp(hx - 0.6, 2.3, k), 1.6 + Math.sin(k * Math.PI) * (2 + i * 0.5), 1.2]} s={0.6 * sat(k * 5)} />; })}
      </group>
      <Lbl text="CHEVAL DE TROIE" pos={[0, 8.3, 0]} h={0.8} bg="#b9793a" />
    </Sub>
    <Sub t={t} a={a_(42)} b={a_(43)}>
      <Float t={t} y={5.3} amp={0.05}>
        {Array.from({ length: 9 }).map((_, i) => { const lk = i < locks, dk = lk ? 1 : 0;
          return <group key={i} position={[-1.7 + (i % 3) * 1.7, 1.7 - Math.floor(i / 3) * 1.55, 0]}>
            <Doc s={1.2} locked={dk} color={[N.blue, N.pink, N.green][i % 3]} />{lk && <Lock pos={[0, -0.05, 0.2]} s={0.75} />}</group>; })}
        <Lbl text="RANÇONGICIEL" pos={[0, 3.4, 0]} h={0.8} bg={N.red} />
        <Lbl text="$ $ $" pos={[0, -3.1, 0.5]} h={1.1} bg={N.yellow} fg={N.ink} s={pop(t, w(42, "rançon", 0.9) - 0.3) * (1 + Math.sin(t * 10) * 0.05)} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(43)} b={a_(44)}>
      <Monitor pos={[0, 3.3, 0]} s={1.9} screen="#10132a"><Lbl text="• • • • • •" h={0.3} fg={N.yellow} /></Monitor>
      <Eye pos={[0, 7.0 + ramp(t, S(43), S(43) + 0.6) * 0.6 - 0.6, -0.3]} s={1.5} look={[Math.sin(t * 1.3) * 0.8 - 0.4, -1]} lid={Math.sin(t * 0.9) > 0.95 ? 1 : 0} />
      {Array.from({ length: 6 }).map((_, i) => { const p = (t * 0.6 + i / 6) % 1; return <Lbl key={i} text="•" pos={[(i - 2.5) * 0.25 * (1 - p), lerp(5.5, 7.2, p), 0.4]} h={0.6} fg={N.yellow} op={Math.sin(p * Math.PI) * sat((t - w(43, "voler", 0.7)) * 3)} />; })}
      <Lbl text="LOGICIEL ESPION" pos={[0, 8.3, 0]} h={0.8} bg={N.purple} />
    </Sub>
    <Sub t={t} a={a_(44)} b={chStart(10)}>
      <Hacker t={t} pos={[0, 6.6, -0.5]} s={0.95} />
      {Array.from({ length: 12 }).map((_, i) => { const x = -2.4 + (i % 4) * 1.6, y = 5.0 - Math.floor(i / 4) * 1.35, z = Math.floor(i / 4) * 0.5, inf = t > w(44, "zombie", 0.3) + i * 0.08;
        return <group key={i}><Monitor pos={[x, y, z]} s={0.55} screen={inf ? (Math.sin(t * 8) > 0 ? N.red : "#5a0d18") : N.green}>{inf && <Lbl text="☠" font="sans-serif" h={0.7} />}</Monitor>
          {inf && <Wire a={[x, y + 1.0, z]} b={[0, 7.6, -0.5]} on={1} color={N.red} r={0.02} />}</group>; })}
      <Lbl text="BOTNET" pos={[0, 8.4, 0]} h={0.85} bg={N.red} s={pop(t, w(44, "botnet", 0.92))} />
    </Sub>
  </>);
};

/* ================= K — infection ================= */
const Infection: React.FC<{ t: number }> = ({ t }) => {
  const click = w(47, "cliquer", 0.6), hy = lerp(11, 5.2, ramp(t, S(47), S(47) + 0.9));
  return (<>
    <Stage t={t} bg="#160a14" floor="#2a1024" a={N.orange} b={N.red} />
    {t < a_(48) && <><Guy pos={[-0.9, 0, 1.2]} rot={[0, 0.6, 0]} scale={1.15} shirt={N.pink} armR={t > click - 0.5 && t < a_(48) ? -1.3 : -0.6} armL={-0.6} mouth={t > click ? "o" : "smile"} />
      <Laptop pos={[0.9, 1.3, 1.6]} s={0.9} rot={[0, -0.6, 0]} screen={t > click ? N.red : N.blue}>{t > click && <Lbl text="☠" font="sans-serif" h={0.8} />}</Laptop>
      <Box pos={[0.9, 0.65, 1.6]} size={[2.2, 1.3, 1.4]} color="#3a4060" /></>}
    <Sub t={t} a={chStart(10)} b={a_(46)}>
      <Lbl text="?" pos={[0, 6.4, 0]} h={2.4} fg={N.yellow} s={pop(t, S(45) + 0.2) * (1 + Math.sin(t * 4) * 0.05)} />
      <Lbl text="▼  par nous" pos={[-0.6, 4.2, 1]} h={0.7} bg={N.orange} fg={N.ink} s={pop(t, w(45, "nous", 0.9) - 0.2)} />
    </Sub>
    <Sub t={t} a={a_(46)} b={a_(47)}>
      <Float t={t} y={6.2}>
        <group position={[-2.2, 0.6, 0]} scale={pop(t, S(46) + 0.1)} rotation={[0, 0, -0.1]}><Box pos={[0, 0, 0]} size={[1.7, 1.15, 0.1]} color="#f4f6ff" /><mesh position={[0, 0.2, 0.06]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.85, 0.5, 3]} /><meshStandardMaterial color="#d7dbee" /></mesh>
          <Virus t={t} pos={[0.6, 0.5, 0.2]} s={0.45} /><Lbl text="facture.pdf.exe" pos={[0, -0.85, 0]} h={0.3} bg="#10132a" /></group>
        <group position={[0, -0.9, 0]} scale={pop(t, w(46, "faux", 0.4))}><AppWin color={N.orange} name="banque-secure.co" s={0.95} /></group>
        <group position={[2.2, 0.6, 0]} scale={pop(t, w(46, "logiciel", 0.75))} rotation={[0, t * 2, 0.2]}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.75, 0.75, 0.05, 28]} /><meshStandardMaterial color="#cfd6f0" metalness={0.95} roughness={0.15} /></mesh></group>
        <Lbl text="jeu-gratuit-crack" pos={[2.2, -0.45, 0]} h={0.3} bg="#10132a" s={pop(t, w(46, "logiciel", 0.75))} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(47)} b={a_(48)}>
      <Wire a={[0.3, 12, 0.8]} b={[0.3, hy + 0.5, 0.8]} on={0} r={0.02} />
      <mesh position={[0.3, hy, 0.8]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.35, 0.06, 8, 20, Math.PI * 1.3]} /><meshStandardMaterial color={N.metal} metalness={0.9} roughness={0.2} /></mesh>
      <Lbl text="Clique ici !" pos={[0.3, hy - 0.9 + Math.sin(t * 5) * 0.08, 0.9]} h={0.62} bg={N.green} />
      <Lbl text="HAMEÇONNAGE" pos={[0, 8.3, 0]} h={0.85} bg={N.orange} fg={N.ink} s={pop(t, w(47, "hameçonnage", 0.2))} />
      {t > click && [0, 1, 2].map((i) => <Virus key={i} t={t} seed={i} pos={[0.9 + (i - 1) * 1.0, 3.2 + pop(t, click + i * 0.1) * (1 + i * 0.5), 1.8]} s={0.6 * pop(t, click + i * 0.1)} />)}
    </Sub>
    <Sub t={t} a={a_(48)} b={chStart(11)}>
      <Wall t={t} patch={0} />
      {[0, 1, 2, 3].map((i) => { const k = ((t - w(48, "pirates", 0.75)) * 0.5 + i / 4) % 1; return t > w(48, "pirates", 0.75) && <Virus key={i} t={t} seed={i} pos={[lerp(-4, 4, k), 5.05 + Math.sin(k * 20) * 0.1, lerp(1.5, -0.5, k)]} s={0.36} />; })}
      <Lbl text="FAILLE" pos={[0, 8.6, 0]} h={0.9} bg={N.red} s={pop(t, w(48, "faille", 0.3))} />
    </Sub>
  </>);
};
/* wall of code bricks with a hole (the vulnerability) */
const Wall: React.FC<{ t: number; patch: number }> = ({ t, patch }) => (
  <group position={[0, 2.2, 0.5]} scale={0.6}>
    {Array.from({ length: 63 }).map((_, i) => { const x = i % 7, y = Math.floor(i / 7), hole = x === 3 && y === 4;
      if (hole) return patch > 0 ? <group key={i} position={[lerp(6, 0, patch), 4.75 + (1 - patch) * 2, 0]} rotation={[0, 0, (1 - patch) * 3]}><Box pos={[0, 0, 0]} size={[0.96, 0.7, 0.5]} color={N.green} em={0.6} /></group> : null;
      return <group key={i} position={[(x - 3) * 1.0, 1.55 + y * 0.8, 0]} scale={pop(t, 0) || 1}><Box pos={[0, 0, 0]} size={[0.96, 0.74, 0.5]} color={(x + y) % 2 ? "#2b3f8f" : "#3550b5"} />
        <mesh position={[0, 0, 0.26]}><planeGeometry args={[0.6 - rnd(i, 1) * 0.3, 0.08]} /><meshBasicMaterial color="#8be9fd" /></mesh></group>; })}
  </group>
);

/* ================= L — protection ================= */
const Protect: React.FC<{ t: number }> = ({ t }) => {
  const patch = ramp(t, w(50, "corrigent", 0.6) - 0.3, w(50, "corrigent", 0.6) + 0.5);
  const scan = ramp(t, S(52) + 0.4, E(52));
  const bk = ramp(t, w(53, "sauvegarde", 0.6), E(53));
  return (<>
    <Stage t={t} bg="#051a26" floor="#0b3140" a={N.green} b={N.cyan} />
    {(t < a_(50) || t >= a_(51)) && <Guide t={t} x={-2.6} z={0.3} cheer={t < a_(50)} />}
    <Sub t={t} a={chStart(11)} b={a_(50)}>
      <Float t={t} y={5.6}><Laptop s={1.3} pos={[0, -1.2, 0]} rot={[0.1, Math.sin(t) * 0.3, 0]} screen={N.green} />
        <Shield pos={[0, 1.6, 0.6]} s={1.25 * pop(t, w(49, "protéger", 0.5))} rot={[0, Math.sin(t * 1.5) * 0.4, 0]} /></Float>
    </Sub>
    <Sub t={t} a={a_(50)} b={a_(51)}>
      <Wall t={t} patch={patch} />
      {patch < 0.6 && [0, 1].map((i) => <Virus key={i} t={t} seed={i} pos={[-2.6 + i * 0.9 + Math.sin(t * 3 + i) * 0.2, 5.05 + Math.sin(t * 7 + i) * 0.2, 1.2]} s={0.5} />)}
      {patch >= 0.6 && [0, 1].map((i) => <Virus key={i} t={t} seed={i} pos={[-2.6 - (patch - 0.6) * 12 + i, 5.05 + (patch - 0.6) * 6, 1.2]} s={0.5} />)}
      <Lbl text="MISE À JOUR" pos={[0, 8.3, 0]} h={0.85} bg={N.green} s={pop(t, w(50, "mises", 0.25))} />
    </Sub>
    <Sub t={t} a={a_(51)} b={a_(52)}>
      <Float t={t} y={5.8}>
        <Lock s={2.6} pos={[-1.2, 0.2, 0]} rot={[0, Math.sin(t * 1.2) * 0.4, 0]} />
        <Phone pos={[2.0, 0, 0]} s={1.35 * pop(t, w(51, "double", 0.75))} rot={[0, -0.3, 0.05]} screen="#10132a"><Lbl text="482 913" h={0.3} fg={N.green} /><Lbl text="code" pos={[0, 0.45, 0]} h={0.2} fg="#9aa3c7" /></Phone>
        <Lbl text="M0n-Ch4t-Dort-S0us-1-Arbre!" pos={[0, -2.5, 0.3]} h={0.55} bg="#10132a" fg={N.yellow} font="mono" s={pop(t, w(51, "longs", 0.35))} maxW={6.8} />
        <Lbl text="2FA" pos={[2.0, 1.85, 0]} h={0.6} bg={N.cyan} fg={N.ink} s={pop(t, w(51, "double", 0.75) + 0.2)} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(52)} b={a_(53)}>
      <Float t={t} y={5.4} amp={0.04}>
        {Array.from({ length: 8 }).map((_, i) => { const x = -2.25 + (i % 4) * 1.5, y = 1.2 - Math.floor(i / 4) * 2.2, bad = i === 2 || i === 5, done = scan * 9 > i + 1;
          return <group key={i} position={[x, y, 0]}><Doc s={1.1 * (bad && done ? 1 - ramp(t, 0, 0) * 0 : 1)} bad={bad ? 1 : 0} color={N.blue} />
            {bad && <Virus t={t} seed={i} pos={[0.25, 0.3, 0.2]} s={0.5 * (done ? Math.max(0, 1 - (scan * 9 - i - 1) * 2) : 1)} />}
            {done && <Lbl text={bad ? "✗" : "✓"} font="sans-serif" pos={[0.32, -0.42, 0.2]} h={0.5} fg={bad ? N.red : N.green} />}</group>; })}
        <mesh position={[lerp(-3.4, 3.4, (scan * 2) % 1), scan < 0.5 ? 1.2 : -1.0, 0.4]}><boxGeometry args={[0.1, 1.8, 0.3]} /><meshBasicMaterial color={N.cyan} transparent opacity={0.8} toneMapped={false} /></mesh>
        <Shield pos={[0, 3.3, 0]} s={0.75} /><Lbl text="ANTIVIRUS" pos={[0, -3.5, 0.3]} h={0.8} bg={N.cyan} fg={N.ink} />
      </Float>
    </Sub>
    <Sub t={t} a={a_(53)} b={chStart(12)}>
      <Float t={t} y={5.6}>
        {t < w(53, "sauvegarde", 0.6) - 0.3 ? <>
          <Lbl text="super-promo.xyz/gagner" pos={[0, 0.4, 0]} h={0.55} bg="#10132a" fg={N.cyan} font="mono" maxW={6.6} />
          <group position={[0, -1.5, 0.3]} scale={pop(t, w(53, "clique", 0.15) + 0.3)}><mesh rotation={[Math.PI / 2, Math.PI / 8, 0]}><cylinderGeometry args={[1.0, 1.0, 0.16, 8]} /><meshStandardMaterial color={N.red} roughness={0.4} /></mesh><Lbl text="STOP" pos={[0, 0, 0.1]} h={0.7} /></group>
        </> : <>
          {[0, 1, 2].map((i) => <Doc key={i} pos={[-2.2, 0.9 - i * 1.25, 0]} s={1.05} color={[N.blue, N.pink, N.green][i]} />)}
          {[0, 1, 2].map((i) => { const k = ramp(bk, i * 0.25, i * 0.25 + 0.5); return <Doc key={`c${i}`} pos={[lerp(-2.2, 2.0, k), 0.9 - i * 1.25 + Math.sin(k * Math.PI) * 0.8, 0.3]} s={1.05 * sat(k * 6)} color={[N.blue, N.pink, N.green][i]} />; })}
          <Box pos={[2.0, -0.3, -0.3]} size={[1.8, 3.9, 0.3]} color="#3a4060" /><Lbl text="SAUVEGARDE" pos={[0, 2.5, 0]} h={0.8} bg={N.green} />
          {[[-0.5, 0], [0, 0.3], [0.55, 0.05], [0.1, -0.1]].map(([x, y], i) => <mesh key={i} position={[2.0 + x, -2.9 + y, 0.2]}><sphereGeometry args={[0.45, 14, 12]} /><meshStandardMaterial color="#f4f6ff" /></mesh>)}
        </>}
      </Float>
    </Sub>
  </>);
};

/* ================= M — outro ================= */
const Outro: React.FC<{ t: number }> = ({ t }) => {
  const items = [w(54, "transistor", 0.1), w(54, "code", 0.25), w(54, "logiciel", 0.4), w(54, "malware", 0.55)];
  const v = Math.sin((t - S(55)) * 3.2) > 0 ? 1 : 0;
  return (<>
    <Stage t={t} a={N.pink} b={N.yellow} />
    <Guide t={t} x={t >= a_(56) ? 0 : -2.5} cheer={t >= a_(56)} />
    <Sub t={t} a={chStart(12)} b={a_(55)}>
      <Float t={t} y={5.6} amp={0.06}>
        <group position={[-1.8, 1.4, 0]} scale={pop(t, items[0])}><Mosfet t={t} on={1} s={0.4} /></group>
        <group position={[1.8, 1.6, 0]} scale={pop(t, items[1])}><Lbl text="print(1)" h={0.7} bg="#0d1028" fg="#8be9fd" font="mono" /></group>
        <group position={[-1.8, -1.5, 0]} scale={0.95 * pop(t, items[2])}><AppWin color={N.blue} name="Apps" /></group>
        <group position={[1.8, -1.5, 0]} scale={pop(t, items[3])}><Virus t={t} s={1.4} /><Shield pos={[0.6, -0.5, 0.5]} s={0.6} /></group>
        {[[-0.5, 1.5, 0], [0, 0, -2.2], [-0.5, -1.5, 0]].map(([x, y, r], i) => <Lbl key={i} text="→" font="sans-serif" pos={[i === 1 ? 0 : 0, i === 1 ? 0 : y, 0]} rot={[0, 0, r]} h={0.8} fg={N.yellow} s={pop(t, items[i + 1] - 0.15)} />)}
      </Float>
    </Sub>
    <Sub t={t} a={a_(55)} b={INFO_FRAMES / FPS + 1}>
      <Float t={t} y={t >= a_(56) ? 6.6 : 5.6}>
        <Bit v={t >= a_(56) ? 0 : 1 - v} pos={[-1.5, 0, 0]} s={2.1} on={N.pink} /><Bit v={t >= a_(56) ? 1 : v} pos={[1.5, 0, 0]} s={2.1} />
      </Float>
    </Sub>
  </>);
};

const SCENES = [Intro, Transistor, Bits, Gates, Cpu, Memory, Code, Software, Network, Malware, Infection, Protect, Outro];
const World: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const k = chOf(t), Sc = SCENES[k], u = t - chStart(k);
  const push = 1 - ramp(u, 0, 1.2);
  return (<>
    <Cam pos={[Math.sin(t * 0.23) * 0.6, 5.2 + Math.sin(t * 0.31) * 0.12, 12.8 + push * 2.2]} look={[Math.sin(t * 0.23) * 0.12, 4.9, 0]} fov={50} />
    <Sc t={t} />
    <Shadowify />
  </>);
};

/* ================= 2D overlays ================= */
const Header: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, k = chOf(t);
  const p = spring({ frame: f - fr(chStart(k)), fps: FPS, config: theme.spring.snappy });
  const cuts = CH.slice(1).map((_, i) => chStart(i + 1));
  const flash = Math.max(0, ...cuts.map((c) => interpolate(f, [fr(c) - 3, fr(c), fr(c) + 6], [0, 0.85, 0], clamp)));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center", transform: `translateY(${(1 - p) * -60}px)`, opacity: Math.min(1, p * 1.5) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(10,12,34,0.85)", border: "4px solid #fff", borderRadius: 60, padding: "10px 34px 10px 12px",
          boxShadow: "0 8px 0 rgba(0,0,0,0.3)" }}>
          <span style={{ width: 66, height: 66, borderRadius: 33, background: k === 9 || k === 10 ? N.red : N.pink, color: "#fff", fontFamily: "Anton", fontSize: 40, display: "flex",
            alignItems: "center", justifyContent: "center" }}>{k + 1}</span>
          <span style={{ fontFamily: "Anton", fontSize: 50, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>{CH[k][1]}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 52, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.18)", display: "flex", gap: 6, overflow: "hidden" }}>
        {CH.map((_, i) => { const a = chStart(i), b = i + 1 < CH.length ? chStart(i + 1) : T.total;
          return <div key={i} style={{ flex: b - a, background: "rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${sat((t - a) / (b - a)) * 100}%`, height: "100%", background: i === 9 || i === 10 ? N.red : N.yellow }} /></div>; })}
      </div>
      {t < S(1) - 0.3 && <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: "Anton", fontSize: 92, lineHeight: 1.08, color: "#fff", textTransform: "uppercase",
        textShadow: `0 6px 0 ${N.pink}, 0 0 40px ${N.purple}`, transform: `scale(${spring({ frame: f - 6, fps: FPS, config: theme.spring.bouncy })})` }}>Les bases de<br />l'informatique</div>}
      {t >= a_(56) && <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `rotate(-3deg) scale(${spring({ frame: f - fr(a_(56)), fps: FPS, config: theme.spring.bouncy })})`, background: N.pink, color: "#fff", fontFamily: "Anton", fontSize: 110,
          padding: "10px 44px", borderRadius: 34, border: "6px solid #fff", boxShadow: "0 10px 0 rgba(0,0,0,0.25)" }}>ABONNE-TOI !</div></div>}
      {t >= a_(56) && Array.from({ length: 70 }).map((_, i) => { const tt = (t - a_(56)) * 30;
        return <div key={i} style={{ position: "absolute", left: ((i * 137) % 1080) + Math.sin(tt / 8 + i) * 30, top: -40 + ((tt * (6 + (i % 5) * 2) + i * 37) % 1750), width: 18, height: 10, borderRadius: 3,
          background: [N.pink, N.blue, N.yellow, N.green, N.purple][i % 5], transform: `rotate(${tt * 8 + i * 30}deg)` }} />; })}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

type Wd = [string, number, number];
const Captions: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const pages = captions as Wd[][];
  const page = pages.find((p, i) => t >= p[0][1] - 0.05 && t < (pages[i + 1]?.[0][1] ?? p[p.length - 1][2] + 0.4));
  if (!page || t > page[page.length - 1][2] + 0.5) return null;
  const p = spring({ frame: f - fr(page[0][1]), fps: FPS, config: theme.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1730, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", padding: "12px 30px", background: "rgba(10,8,25,0.84)", borderRadius: 24, border: "3px solid rgba(255,255,255,0.9)" }}>
        {page.map((x, i) => <span key={i} style={{ fontFamily: "InterX", fontWeight: 800, fontSize: 54, lineHeight: 1.35, color: t >= x[1] && t < x[2] + 0.1 ? N.yellow : t >= x[1] ? "#fff" : "rgba(255,255,255,0.5)" }}>{x[0]}</span>)}
      </div>
    </div>
  );
};

const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, fr(at))} durationInFrames={50}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);
const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("info/voice.m4a")} />
    <Audio src={staticFile("info/bed.wav")} volume={(x) => interpolate(x, [0, 15, fr(a_(56)), fr(a_(56)) + 10, INFO_FRAMES - 3], [0, 0.065, 0.065, 0.2, 0], clamp)} />
    {CH.slice(1).map((_, i) => <Sfx key={`c${i}`} at={chStart(i + 1) - 0.07} src="whoosh" v={0.34} />)}
    {T.S.map((x, i) => <Sfx key={`s${i}`} at={x - 0.2} src={i % 2 ? "pop" : "swipe"} v={0.16} />)}
    {[w(6, "tension", 0.3), w(9, "bit", 0.85), w(19, "cerveau", 0.7), w(49, "protéger", 0.5), w(50, "corrigent", 0.6), E(52) - 0.2, a_(56)].map((x, i) => <Sfx key={`d${i}`} at={x} src="ding" v={0.26} />)}
    {[w(24, "éteint", 0.9), w(30, "trompe", 0.6), w(38, "malveillant", 0.55), w(41, "entrer", 0.75) + 0.3, w(42, "rançon", 0.9) - 0.3, w(44, "zombie", 0.3), w(47, "cliquer", 0.6), w(48, "pirates", 0.75)].map((x, i) => <Sfx key={`b${i}`} at={x} src="bass" v={0.4} />)}
    {Array.from({ length: 10 }).map((_, i) => <Sfx key={`t${i}`} at={S(10) + 0.3 + i * 0.22} src="tick" v={0.12} />)}
    {Array.from({ length: 8 }).map((_, i) => <Sfx key={`a${i}`} at={w(12, "sécrit", 0.4) + 0.5 + i * ((E(12) - w(12, "sécrit", 0.4) - 0.5) / 8)} src="tick" v={0.2} />)}
    {Array.from({ length: 9 }).map((_, i) => <Sfx key={`l${i}`} at={lerp(w(42, "chiffre", 0.25), w(42, "puis", 0.6), i / 9)} src="check" v={0.2} />)}
  </>
);

export const InfoEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame();
  const [ok, setOk] = useState(false);
  const [h] = useState(() => delayRender("fonts for 3D labels"));
  useEffect(() => {
    let n = 0;
    const tick = () => { if (document.fonts.check("64px Anton") || n++ > 100) { textTex("warm"); setOk(true); continueRender(h); } else { document.fonts.load("64px Anton").finally(() => setTimeout(tick, 50)); } };
    tick();
  }, [h]);
  return (
    <AbsoluteFill style={{ background: "#0a0c22" }}>
      {ok && <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true }}><World /></ThreeCanvas>}
      <Header />
      <Captions />
      <Vignette />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [INFO_FRAMES - 10, INFO_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
