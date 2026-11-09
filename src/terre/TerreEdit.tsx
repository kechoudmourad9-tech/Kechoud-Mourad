// "Et si la Terre s'arrêtait de tourner ?" — fully 3D explainer (react-three-fiber inside Remotion):
// procedural Earth, a low-poly city with animated characters and cars thrown east, supersonic wind,
// a giant wave, water migrating to the poles, endless day / night, the fading magnetic field.
// French voice-over (public/terre/voice.m4a), word-highlight captions, music bed + SFX.
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { useFontFaces } from "../components/FontFaces";
import { Vignette } from "../components/Layers";
import { clamp, theme } from "../theme";
import { Building, Cam, Car, Earth, Guy, Stars, Tree, fly, rnd } from "./world3d";
import T from "./timing.json";
import captions from "./captions.json";

const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const L = T.L, Q = T.cue;
export const TERRE_FRAMES = s(T.total);
const cut = (i: number) => L[i] - 0.3;
const C = { pink: "#FF4FA3", blue: "#3D8BFF", yellow: "#FFD23F", green: "#2EC27E", purple: "#9B5CFF", cyan: "#22D3EE", red: "#FF5A4F" };
const ez = (t: number, a: number, b: number, x0 = 0, x1 = 1) => interpolate(t, [a, b], [x0, x1], { ...clamp, easing: theme.ease.inOut });
const eo = (t: number, a: number, b: number, x0 = 0, x1 = 1) => interpolate(t, [a, b], [x0, x1], { ...clamp, easing: theme.ease.out });
const SUN: [number, number, number] = [5, 2, 4];
const SHIRTS = [C.pink, C.blue, C.yellow, C.green, C.purple, C.cyan, C.red];
const HAIRS = ["#2b1a10", "#14101f", "#6b3a1e", "#c9a227"];
const SKINS = ["#f2c29b", "#c98a5e", "#8d5a3b", "#f6d3b3"];

/* ============ 1 — space: the spinning Earth, then the brutal stop ============ */
const SpaceIntro: React.FC<{ t: number }> = ({ t }) => {
  const stop = Q.coup;                                   // "d'un seul coup"
  const spin = t < stop ? t * 1.5 : stop * 1.5 + (1 - Math.exp(-(t - stop) * 9)) * 0.12;
  const sh = t > stop ? Math.exp(-(t - stop) * 4) * 0.25 : 0;
  const z = ez(t, 0, cut(1), 15, 12.2);
  return (<>
    <color attach="background" args={["#02030a"]} />
    <Cam pos={[Math.sin(t * 60) * sh, 0.6 + Math.cos(t * 47) * sh, z]} look={[0, 0.1, 0]} fov={42} />
    <Stars />
    <Earth spin={spin} light={SUN} cloudT={Math.min(t, stop) * 0.05} pos={[0, 0.4, 0]} />
  </>);
};

/* ============ 2 — 1 670 km/h at the equator, a little guy riding along ============ */
const Equator: React.FC<{ t: number }> = ({ t }) => {
  const u = t - cut(1);
  const spin = u * 0.35;
  const a = -spin * 0 + 0;                                // camera fixed; the guy rides the globe
  return (<>
    <color attach="background" args={["#02030a"]} />
    <Cam pos={[0, 0.5 + a, ez(u, 0, 7, 10.5, 8.6)]} look={[0, 0, 0]} fov={44} />
    <Stars />
    <ambientLight intensity={1.3} /><directionalLight position={[4, 2, 5]} intensity={2} />
    <Earth spin={spin + 1.2} tilt={0.2} light={[4, 2, 5]} cloudT={u * 0.03}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.06, 0.022, 8, 120]} /><meshBasicMaterial color={C.yellow} /></mesh>
      {/* the rider + speed streak, placed so they pass in front of the camera */}
      <group rotation={[0, -1.2 - 0.35 * 3.6 - Math.PI / 2, 0]}>
        <Guy pos={[2.0, 0, 0]} rot={[0, 0, -Math.PI / 2]} scale={0.3} shirt={C.pink} armL={-2.6 + Math.sin(u * 8) * 0.3} armR={-2.6 + Math.cos(u * 8) * 0.3} />
      </group>
    </Earth>
  </>);
};

/* ============ 3 — the city: everything keeps going east ============ */
const BLD = Array.from({ length: 15 }).map((_, i) => ({ x: -16 + i * 4.1, w: 3.2 + rnd(i, 1) * 0.8, h: 5 + rnd(i, 2) * 8, d: 3.5,
  color: ["#ff8fb8", "#7fb2ff", "#ffd97a", "#8fe0b0", "#c3a4ff"][i % 5] }));
const City: React.FC<{ t: number; mode: "stop" | "wave" }> = ({ t, mode }) => {
  const stop = mode === "stop" ? Q.stop : 1e9, rip = mode === "stop" ? Q.immeubles : 1e9;
  const t0 = mode === "stop" ? cut(2) : cut(5);
  const u = t - t0, tt = t - stop;
  const sh = tt > 0 ? Math.exp(-tt * 1.6) * 0.5 + (t > rip ? Math.exp(-(t - rip) * 1.5) * 0.4 : 0) : 0;
  const waveT = mode === "wave" ? t - Q.vagues : -1;
  const wz = mode === "wave" ? interpolate(t, [t0, Q.vagues, Q.vagues + 1.4, cut(6)], [-60, -24, -9, 2.5], clamp) : 0;
  const wsh = mode === "wave" ? 0.12 + Math.max(0, waveT) * 0.05 : 0;
  const shake = sh + wsh;
  const camX = mode === "stop" ? ez(u, 0, 9, -2, 1.5) + (tt > 0 ? 2.4 * Math.min(tt, 5.2) - 0.9 * (1 - Math.exp(-tt * 3)) : 0) : 0;
  return (<>
    <color attach="background" args={[mode === "stop" ? "#8fd0ff" : "#7fb6d8"]} />
    <fog attach="fog" args={[mode === "stop" ? "#8fd0ff" : "#7fb6d8", 30, 80]} />
    <Cam pos={[camX + Math.sin(t * 53) * shake, 4.6 + Math.cos(t * 41) * shake, 17 - (mode === "wave" ? ez(u, 0, 6, 0, -2) : 0)]}
      look={[camX, mode === "wave" ? 4.4 : 3.4, 0]} fov={50} roll={Math.sin(t * 37) * shake * 0.03} />
    <ambientLight intensity={1.1} />
    <directionalLight position={[6, 12, 8]} intensity={2.2} />
    {/* ground: road + sidewalks + grass */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#7ccf7a" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]}><planeGeometry args={[200, 5]} /><meshStandardMaterial color="#3a3d4d" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5.2]}><planeGeometry args={[200, 3.4]} /><meshStandardMaterial color="#d9d3c7" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3]}><planeGeometry args={[200, 3]} /><meshStandardMaterial color="#d9d3c7" /></mesh>
    {Array.from({ length: 24 }).map((_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-46 + i * 4, 0.02, 1]}><planeGeometry args={[1.8, 0.16]} /><meshBasicMaterial color="#fff" /></mesh>)}
    {/* buildings: ripped off and thrown east on "les immeubles" */}
    {BLD.map((b, i) => {
      const r = t - rip - i * 0.07, k = r > 0 ? r : 0;
      const tilt = -Math.min(1.5, k * k * 2.2), dx = k > 0.5 ? (k - 0.5) * (k - 0.5) * 26 : 0, dy = k > 0.5 ? Math.sin(Math.min(1, (k - 0.5) * 0.9) * Math.PI) * 4 : 0;
      const sink = mode === "wave" && wz > -6 + 0 ? 0 : 0;
      return <Building key={i} pos={[b.x + b.w / 2 + dx, dy - sink, -7]} w={b.w} h={b.h} d={b.d} color={b.color} rotZ={tilt} />;
    })}
    {[-12, -4, 5, 13].map((x, i) => { const f = fly(tt - 0.15, 40 + i); return <Tree key={i} pos={[x + f.dx, f.dy, -3.4]} bend={Math.max(-1.3, f.rot * 0.5)} s={0.9} />; })}
    {/* cars */}
    {[0, 1, 2].map((i) => {
      const f = fly(tt, 20 + i), drive = Math.min(u, stop - t0) * (2.5 + i);
      const x = -11 + i * 7 + drive + f.dx;
      return <Car key={i} pos={[mode === "wave" ? -9 + i * 8 : x, f.dy, i === 1 ? 2.1 : 0]} rot={[f.rot * 0.4, 0, f.rot]} color={[C.red, C.yellow, C.blue][i]} spin={-drive * 3} />;
    })}
    {/* people */}
    {Array.from({ length: 9 }).map((_, i) => {
      const f = fly(tt - rnd(i, 3) * 0.12, i), dir = i % 3 === 0 ? -1 : 1;
      const walkT = Math.min(u, stop - t0);
      if (mode === "wave") {
        const run = Math.max(0, t - Q.vagues + 0.6 - rnd(i, 4) * 0.5);
        const z = 4.4 + (i % 3) * 0.8 + run * 2.2, x = -6.5 + i * 1.6 + Math.sin(i * 3) * 0.4;
        return <Guy key={i} pos={[x, 0, Math.min(z, 13)]} rot={[0, run > 0 ? 0 : Math.PI, 0]} shirt={SHIRTS[i % 7]} hair={HAIRS[i % 4]} skin={SKINS[i % 4]}
          walk={run > 0 ? 1.3 : 0} phase={t * 16 + i} armL={run > 0 ? -2.7 + Math.sin(t * 14 + i) * 0.4 : undefined} armR={run > 0 ? -2.7 + Math.cos(t * 14 + i) * 0.4 : undefined} mouth={run > 0 ? "o" : "smile"} />;
      }
      const x = -6.5 + i * 1.5 + dir * walkT * 0.9 + f.dx;
      const flying = tt > 0;
      return <Guy key={i} pos={[x, f.dy + (flying ? 0.9 : 0), 4.4 + (i % 3) * 0.9]} rot={flying ? [f.rot * 0.3, Math.PI / 2, f.rot] : [0, dir * Math.PI / 2, 0]}
        shirt={SHIRTS[i % 7]} hair={HAIRS[i % 4]} skin={SKINS[i % 4]} walk={flying ? 0 : 1} phase={t * 7 + i * 2}
        armL={flying ? -2.4 + Math.sin(t * 20 + i) * 0.6 : undefined} armR={flying ? -2.4 + Math.cos(t * 20 + i) * 0.6 : undefined} legSpread={flying ? 0.35 : 0} mouth={flying ? "o" : "smile"} />;
    })}
    {/* debris + speed streaks after the stop */}
    {tt > 0 && Array.from({ length: 26 }).map((_, i) => {
      const x = ((tt * (30 + rnd(i, 1) * 30) + i * 9) % 60) - 30;
      return <mesh key={i} position={[x + camX, 0.6 + rnd(i, 2) * 9, -2 + rnd(i, 3) * 9]}><boxGeometry args={[2 + rnd(i, 4) * 3, 0.04, 0.04]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.55} /></mesh>;
    })}
    {/* the giant wave */}
    {mode === "wave" && <group position={[0, 0, wz]} scale={[1, 1.4, 1]}>
      <mesh position={[0, 4.5, -11]}><boxGeometry args={[140, 9, 22]} /><meshStandardMaterial color="#1668b8" roughness={0.25} transparent opacity={0.93} /></mesh>
      <mesh position={[0, 6, -1]} rotation={[0, 0, Math.PI / 2]} scale={[1.1, 1, 0.8]}><cylinderGeometry args={[6.5, 6.5, 140, 28, 1]} /><meshStandardMaterial color="#1f86d8" roughness={0.2} transparent opacity={0.93} /></mesh>
      {Array.from({ length: 46 }).map((_, i) => (
        <mesh key={i} position={[-46 + i * 2.05, 12.6 + Math.sin(t * 5 + i) * 0.5, 0.8 + Math.cos(t * 4 + i * 2) * 0.6]}><sphereGeometry args={[1.25 + rnd(i, 1) * 0.6, 10, 8]} /><meshStandardMaterial color="#f4fbff" roughness={1} /></mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => { const a = 0.25 + i * 0.26 + ((t * 0.5) % 0.26);
        return <mesh key={`k${i}`} position={[0, 6 + Math.sin(a) * 7.2, -1 + Math.cos(a) * 5.3]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.16, 0.16, 140, 6]} /><meshBasicMaterial color="#9fd8ff" transparent opacity={0.7} /></mesh>; })}
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={`f${i}`} position={[-40 + i * 2.05, 0.5, 4.4 + Math.sin(t * 6 + i * 1.7) * 0.5]}><sphereGeometry args={[0.8 + rnd(i, 3) * 0.5, 8, 6]} /><meshStandardMaterial color="#f4fbff" roughness={1} /></mesh>
      ))}
    </group>}
  </>);
};

/* ============ 4 — supersonic wind ============ */
const Wind: React.FC<{ t: number }> = ({ t }) => {
  const u = t - cut(4);
  const gust = 0.85 + Math.sin(t * 9) * 0.1;
  return (<>
    <color attach="background" args={["#c9b79a"]} />
    <fog attach="fog" args={["#c9b79a", 14, 55]} />
    <Cam pos={[Math.sin(t * 43) * 0.12 + 0.2 + u * 0.12, 3.6 + Math.cos(t * 51) * 0.1, 15]} look={[0.6, 3.4, 0]} fov={50} roll={Math.sin(t * 29) * 0.012} />
    <ambientLight intensity={1.2} /><directionalLight position={[-4, 10, 8]} intensity={1.8} color="#ffe6c0" />
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#9bbf6a" /></mesh>
    {[[-7, -4], [-2.5, -6], [3, -4.5], [7.5, -7], [11, -3.5]].map(([x, z], i) => <Tree key={i} pos={[x, 0, z]} bend={-(gust + rnd(i, 1) * 0.25) - Math.sin(t * 13 + i) * 0.06} s={1.1 + rnd(i, 2) * 0.5} />)}
    {/* lamp post + a guy hanging on, horizontal like a flag */}
    <mesh position={[-1.2, 2.6, 2.25]}><cylinderGeometry args={[0.1, 0.13, 5.2, 10]} /><meshStandardMaterial color="#3b4257" metalness={0.5} roughness={0.4} /></mesh>
    <mesh position={[-1.2, 5.3, 2.25]}><sphereGeometry args={[0.32, 12, 10]} /><meshBasicMaterial color="#fff3b8" /></mesh>
    <group position={[-1.1, 3.3, 2]} rotation={[0, 0, 1.38 + Math.sin(t * 15) * 0.07]}>
      <Guy pos={[0, -2.75, 0]} rot={[0, Math.PI / 2 - 0.5, 0]} shirt={C.pink} armL={Math.PI - 0.15} armR={Math.PI + 0.15} walk={0.5} phase={t * 22} mouth="o" />
    </group>
    {/* second guy tumbling past + flying things */}
    {(() => { const x = -14 + ((u * 13) % 30); return <Guy pos={[x, 5.5 + Math.sin(u * 3) * 1.2, -1]} rot={[u * 3, Math.PI / 2, -u * 7]} shirt={C.blue} hair="#14101f" skin="#c98a5e"
      armL={-2.4} armR={-2.2} legSpread={0.4} mouth="o" />; })()}
    <Car pos={[-18 + ((u * 17 + 8) % 38), 3 + Math.sin(u * 2.2) * 1.5, -1]} rot={[u * 2, 0.3, -u * 5]} color={C.yellow} />
    {Array.from({ length: 60 }).map((_, i) => {
      const x = ((t * (34 + rnd(i, 1) * 40) + i * 7) % 60) - 30;
      return <mesh key={i} position={[x, 0.3 + rnd(i, 2) * 9, -6 + rnd(i, 3) * 15]}><boxGeometry args={[1.5 + rnd(i, 4) * 4, 0.035, 0.035]} /><meshBasicMaterial color="#fff" transparent opacity={0.6} /></mesh>;
    })}
    {Array.from({ length: 14 }).map((_, i) => {
      const x = ((t * (16 + rnd(i, 5) * 14) + i * 11) % 44) - 22;
      return <mesh key={i} position={[x, 0.5 + rnd(i, 6) * 6 + Math.sin(t * 4 + i) * 0.6, -3 + rnd(i, 7) * 9]} rotation={[t * 6 + i, t * 4, t * 5]}>
        <boxGeometry args={[0.35, 0.35, 0.05]} /><meshStandardMaterial color={i % 2 ? "#6b4423" : "#2fae5a"} /></mesh>;
    })}
  </>);
};

/* ============ 6 — the water migrates to the poles ============ */
const Migrate: React.FC<{ t: number }> = ({ t }) => {
  const u = t - cut(6);
  const mig = ez(t, Q.poles - 0.8, Q.continent + 1.2);
  return (<>
    <color attach="background" args={["#02030a"]} />
    <Cam pos={[0, ez(u, 0, 8, 1.5, 0.4), 12.4]} look={[0, 0, 0]} fov={42} />
    <Stars />
    <Earth spin={0.6 + u * 0.05} tilt={0.15} mig={mig} light={[3, 2.5, 5]} clouds={0} />
  </>);
};

/* ============ 7 — one day = one year: burning side / frozen side ============ */
const DayNight: React.FC<{ t: number }> = ({ t }) => {
  const u = t - cut(7);
  const k = ez(t, Q.nuit - 1.3, Q.nuit - 0.2);            // 0 = day side, 1 = night side
  const camX = -7 + k * 14;
  const sky = new THREE.Color("#ffb347").lerp(new THREE.Color("#07102b"), k);
  return (<>
    <color attach="background" args={[sky.getHex()]} />
    <fog attach="fog" args={[sky.getHex(), 18, 60]} />
    <Cam pos={[camX, 2.6, 10.5 - Math.sin(k * Math.PI) * 0 + ez(u, 0, 9, 0.8, 0)]} look={[camX, 2.5, 0]} fov={46} />
    <ambientLight intensity={1.15 - k * 0.75} color={k > 0.5 ? "#9db8ff" : "#fff1d6"} />
    <directionalLight position={[-12, 9, 2]} intensity={2.6 * (1 - k) + 0.25} color="#fff0c8" />
    {/* ground: desert | ice */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, 0, 0]}><planeGeometry args={[100, 120]} /><meshStandardMaterial color="#e9b96a" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, 0, 0]}><planeGeometry args={[100, 120]} /><meshStandardMaterial color="#dff2ff" /></mesh>
    {/* day side */}
    <mesh position={[-7.5, 8.6, -14]}><sphereGeometry args={[3 + Math.sin(t * 3) * 0.08, 24, 16]} /><meshBasicMaterial color="#fff7c2" /></mesh>
    <mesh position={[-7.5, 8.6, -14.5]}><sphereGeometry args={[4.4, 24, 16]} /><meshBasicMaterial color="#ffd23f" transparent opacity={0.35} /></mesh>
    {[[-11, -3], [-3.5, -5]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]}><capsuleGeometry args={[0.35, 1.8, 6, 10]} /><meshStandardMaterial color="#3f9d4d" /></mesh>
      <mesh position={[0.6, 1.5, 0]} rotation={[0, 0, -0.9]}><capsuleGeometry args={[0.2, 0.7, 4, 8]} /><meshStandardMaterial color="#3f9d4d" /></mesh>
      <mesh position={[-0.6, 1.1, 0]} rotation={[0, 0, 0.9]}><capsuleGeometry args={[0.2, 0.6, 4, 8]} /><meshStandardMaterial color="#3f9d4d" /></mesh>
    </group>)}
    <Guy pos={[-7, 0, 2.5]} rot={[0.08, 0.15, 0]} shirt={C.red} armL={0.15 + Math.sin(t * 2) * 0.05} armR={-2.6 + Math.sin(t * 9) * 0.25} mouth="o" />
    {Array.from({ length: 6 }).map((_, i) => { const p = (t * 1.3 + i * 0.37) % 1;
      return <mesh key={i} position={[-7 + (i % 2 ? 0.42 : -0.42) + Math.sin(i) * 0.1, 2.25 - p * 1.6, 2.75]} scale={[1, 1.5, 1]}><sphereGeometry args={[0.055, 8, 8]} /><meshBasicMaterial color="#6fd3ff" /></mesh>; })}
    {/* night side */}
    <mesh position={[8.5, 8.4, -14]}><sphereGeometry args={[1.5, 20, 14]} /><meshBasicMaterial color="#e8eeff" /></mesh>
    {[[4, -4, 1.2], [11, -5, 1.6], [12.5, -1.5, 0.8]].map(([x, z, r], i) => <mesh key={i} position={[x, 0, z]} scale={[1.6, 1, 1.2]}><sphereGeometry args={[r, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#f4fbff" /></mesh>)}
    <Guy pos={[7 + Math.sin(t * 38) * 0.035, 0, 2.5]} rot={[0, -0.15, 0]} shirt={C.blue} hair="#14101f" skin="#c98a5e" armL={-1.0} armR={-1.0} mouth="o" />
    <mesh position={[7, 2.36, 2.5]}><cylinderGeometry args={[0.33, 0.33, 0.24, 14]} /><meshStandardMaterial color={C.pink} /></mesh>
    <mesh position={[7, 2.56, 2.5]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color="#fff" /></mesh>
    {Array.from({ length: 90 }).map((_, i) => { const p = (t * (0.18 + rnd(i, 1) * 0.15) + rnd(i, 2)) % 1;
      return <mesh key={i} position={[1 + rnd(i, 3) * 14 + Math.sin(t * 2 + i) * 0.3, 9 - p * 9, -4 + rnd(i, 4) * 9]}><sphereGeometry args={[0.05, 6, 6]} /><meshBasicMaterial color="#fff" /></mesh>; })}
  </>);
};

/* ============ 8 — the magnetic shield fades, the solar wind gets through ============ */
const fieldLine = (Lr: number, az: number) => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) { const th = 0.28 + (i / 40) * (Math.PI - 0.56), r = Lr * Math.sin(th) * Math.sin(th);
    pts.push(new THREE.Vector3(r * Math.sin(th) * Math.cos(az), r * Math.cos(th), r * Math.sin(th) * Math.sin(az))); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.022, 6);
};
const Magnet: React.FC<{ t: number }> = ({ t }) => {
  const u = t - cut(8);
  const shield = 1 - ez(t, Q.affaiblir - 1.6, Q.affaiblir + 0.6);
  const lines = useMemo(() => [2.9, 3.6, 4.4].flatMap((Lr) => Array.from({ length: 8 }).map((_, i) => fieldLine(Lr, (i / 8) * Math.PI * 2))), []);
  return (<>
    <color attach="background" args={["#02030a"]} />
    <Cam pos={[1.2, 1.2, ez(u, 0, 8, 19, 17)]} look={[0.4, 0, 0]} fov={44} />
    <Stars />
    <Earth spin={0.9} tilt={0} light={[-6, 1, 3]} clouds={0.6} />
    {lines.map((g, i) => <mesh key={i} geometry={g}><meshBasicMaterial color={C.cyan} transparent opacity={(0.25 + 0.6 * shield) * shield + 0.04} /></mesh>)}
    {/* solar wind */}
    {Array.from({ length: 150 }).map((_, i) => {
      const y0 = (rnd(i, 1) - 0.5) * 9, z0 = (rnd(i, 2) - 0.5) * 6, sp = 4 + rnd(i, 3) * 3;
      const x = -11 + ((t * sp + rnd(i, 4) * 22) % 22);
      const d = Math.hypot(y0, z0), near = Math.exp(-(x * x) / 14);
      const push = shield * near * Math.max(0, 3.8 - d);
      const y = y0 + (y0 >= 0 ? 1 : -1) * push * (d < 0.01 ? 1 : Math.abs(y0) / d), z = z0 + (z0 >= 0 ? 1 : -1) * push * (d < 0.01 ? 0 : Math.abs(z0) / d);
      if (Math.hypot(x, y, z) < 2.05) return null;
      return <mesh key={i} position={[x, y, z]}><sphereGeometry args={[0.06, 6, 6]} /><meshBasicMaterial color={i % 3 ? "#ffb347" : "#ff5a4f"} /></mesh>;
    })}
    <mesh position={[-13.5, 1, -4]}><sphereGeometry args={[2.4, 24, 16]} /><meshBasicMaterial color="#fff2a8" /></mesh>
    <mesh position={[-13.5, 1, -4.4]}><sphereGeometry args={[3.6, 24, 16]} /><meshBasicMaterial color="#ffb347" transparent opacity={0.35} /></mesh>
  </>);
};

/* ============ 9 — relief: it's impossible, the Earth keeps spinning ============ */
const Outro: React.FC<{ t: number }> = ({ t }) => {
  const u = t - cut(9);
  return (<>
    <color attach="background" args={["#040616"]} />
    <Cam pos={[0, 1.4, ez(u, 0, 10, 14, 12.2)]} look={[0, 0.5, 0]} fov={44} />
    <Stars />
    <ambientLight intensity={0.9} /><directionalLight position={[5, 4, 6]} intensity={2.4} />
    <Earth spin={u * 0.9} tilt={0} light={SUN} cloudT={u * 0.04} />
    <Guy pos={[0, 1.97 + Math.abs(Math.sin(t * 5)) * (t > Q.abonne ? 0.25 : 0.05), 0]} rot={[0, Math.sin(u * 0.8) * 0.25, 0]} scale={0.6} shirt={C.pink}
      armR={-2.7 + Math.sin(t * 9) * 0.35} armL={t > Q.abonne ? -2.7 + Math.cos(t * 9) * 0.35 : 0.1} />
  </>);
};

const World: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < cut(1)) return <SpaceIntro t={t} />;
  if (t < cut(2)) return <Equator t={t} />;
  if (t < cut(4)) return <City t={t} mode="stop" />;
  if (t < cut(5)) return <Wind t={t} />;
  if (t < cut(6)) return <City t={t} mode="wave" />;
  if (t < cut(7)) return <Migrate t={t} />;
  if (t < cut(8)) return <DayNight t={t} />;
  if (t < cut(9)) return <Magnet t={t} />;
  return <Outro t={t} />;
};

/* ================= 2D overlays ================= */
const Tag: React.FC<{ at: number; until?: number; x?: number; y: number; bg: string; color?: string; size?: number; rot?: number; children: React.ReactNode }> = ({
  at, until, x = 540, y, bg, color = "#fff", size = 64, rot = -3, children }) => {
  const f = useCurrentFrame();
  if (f < s(at) || (until !== undefined && f >= s(until))) return null;
  const p = spring({ frame: f - s(at), fps: FPS, config: theme.spring.bouncy });
  const o = until !== undefined ? interpolate(f, [s(until) - 6, s(until)], [1, 0], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot + (1 - p) * 12}deg) scale(${p})`, opacity: o, background: bg, color,
      fontFamily: "Anton", fontSize: size, textTransform: "uppercase", whiteSpace: "nowrap", padding: `${size * 0.12}px ${size * 0.4}px`, borderRadius: size * 0.3,
      border: "6px solid #fff", boxShadow: `0 10px 0 rgba(0,0,0,0.25), 0 0 40px ${bg}88`, lineHeight: 1.15 }}>{children}</div>
  );
};

const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const kmh = Math.round(eo(t, Q.kmh - 0.2, Q.kmh + 1.6) * 1670);
  const cuts = [1, 2, 4, 5, 6, 7, 8, 9].map(cut);
  const flash = Math.max(...cuts.map((c) => interpolate(f, [s(c) - 3, s(c), s(c) + 5], [0, 1, 0], clamp)), interpolate(f, [s(Q.stop), s(Q.stop) + 2, s(Q.stop) + 9], [0, 0.8, 0], clamp));
  return (
    <AbsoluteFill>
      {/* title */}
      <Tag at={0.25} until={cut(1)} y={330} bg={C.purple} size={84} rot={-3}>Et si la Terre</Tag>
      <Tag at={0.7} until={cut(1)} y={470} bg={C.pink} size={84} rot={2}>s'arrêtait de tourner ?</Tag>
      <Tag at={Q.coup} until={cut(1)} y={1430} bg={C.red} size={110} rot={-4}>Stop !</Tag>
      {/* speed */}
      {t >= Q.kmh - 0.2 && t < cut(2) && <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: "Anton", color: "#fff",
        textShadow: `0 6px 0 ${C.pink}, 0 0 40px ${C.pink}` }}>
        <div style={{ fontSize: 200, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{kmh.toLocaleString("fr-FR").replace(/ /g, " ")}</div>
        <div style={{ fontSize: 80, color: C.yellow, textShadow: "0 5px 0 rgba(0,0,0,0.4)" }}>km/h</div>
      </div>}
      <Tag at={L[1] + 0.3} until={cut(2)} y={1420} bg={C.yellow} color="#14101f" size={58} rot={-2}>à l'équateur</Tag>
      {/* city */}
      <Tag at={Q.stop} until={cut(4)} y={330} bg={C.red} size={96} rot={-4}>La Terre freine !</Tag>
      <Tag at={Q.est - 0.3} until={cut(4)} y={480} bg={C.yellow} color="#14101f" size={64} rot={3}>tout part vers l'est →</Tag>
      <Tag at={Q.avion - 0.2} until={cut(4)} y={1430} bg={C.purple} size={60} rot={-2}>1 670 km/h ✈</Tag>
      {/* wind */}
      <Tag at={Q.vents - 0.2} until={cut(5)} y={330} bg={C.blue} size={84} rot={-3}>Vents supersoniques</Tag>
      <Tag at={Q.son - 0.3} until={cut(5)} y={470} bg="#fff" color="#14101f" size={54} rot={2}>plus rapides que le son</Tag>
      {/* wave */}
      <Tag at={Q.vagues - 0.2} until={cut(6)} y={330} bg={C.cyan} color="#14101f" size={90} rot={-3}>Méga-tsunamis</Tag>
      {/* migration */}
      <Tag at={Q.poles - 0.3} until={cut(7)} y={300} bg={C.blue} size={70} rot={-3}>l'eau file vers les pôles</Tag>
      <Tag at={Q.continent - 0.2} until={cut(7)} y={1300} bg={C.green} size={64} rot={2}>1 méga-continent</Tag>
      <Tag at={Q.oceans - 0.2} until={cut(7)} y={1430} bg={C.cyan} color="#14101f" size={60} rot={-2}>2 océans polaires</Tag>
      {/* day / night */}
      <Tag at={Q.annee - 0.6} until={Q.soleil - 0.4} y={330} bg={C.purple} size={84} rot={-3}>1 jour = 1 an</Tag>
      <Tag at={Q.soleil - 0.4} until={Q.nuit - 0.9} y={330} bg={C.red} size={76} rot={-3}>6 mois de soleil ☀</Tag>
      <Tag at={Q.nuit - 0.4} until={cut(8)} y={330} bg={C.blue} size={76} rot={3}>6 mois de nuit ❄</Tag>
      {/* magnetic field */}
      <Tag at={L[8] + 0.6} until={Q.affaiblir - 0.5} y={300} bg={C.cyan} color="#14101f" size={72} rot={-3}>champ magnétique</Tag>
      <Tag at={Q.affaiblir - 0.5} until={cut(9)} y={300} bg={C.red} size={72} rot={3}>bouclier affaibli !</Tag>
      <Tag at={Q.vent - 0.2} until={cut(9)} y={1430} bg={C.yellow} color="#14101f" size={56} rot={-2}>vent solaire</Tag>
      {/* outro */}
      <Tag at={Q.impossible - 0.1} until={Q.abonne - 0.3} y={330} bg={C.green} size={104} rot={-3}>Impossible ✓</Tag>
      <Tag at={Q.ms - 0.4} until={Q.abonne - 0.3} y={1400} bg={C.yellow} color="#14101f" size={58} rot={2}>−2 ms par siècle seulement</Tag>
      <Tag at={Q.abonne - 0.2} y={250} bg={C.pink} size={110} rot={-3}>Abonne-toi !</Tag>
      {t > Q.abonne && Array.from({ length: 60 }).map((_, i) => { const tt = (t - Q.abonne) * 30;
        return <div key={i} style={{ position: "absolute", left: (i * 137) % 1080 + Math.sin(tt / 8 + i) * 30, top: -40 + ((tt * (6 + (i % 5) * 2) + i * 37) % 1700), width: 18, height: 10,
          borderRadius: 3, background: [C.pink, C.blue, C.yellow, C.green, C.purple][i % 5], transform: `rotate(${tt * 8 + i * 30}deg)` }} />; })}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

type W = [string, number, number];
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const pages = captions as W[][];
  const page = pages.find((p, i) => t >= p[0][1] - 0.05 && t < (pages[i + 1]?.[0][1] ?? p[p.length - 1][2] + 0.4));
  if (!page || t > page[page.length - 1][2] + 0.5) return null;
  const p = spring({ frame: f - s(page[0][1]), fps: FPS, config: theme.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1600, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", padding: "12px 30px", background: "rgba(10,8,25,0.82)", borderRadius: 24,
        border: "3px solid rgba(255,255,255,0.9)" }}>
        {page.map((w, i) => <span key={i} style={{ fontFamily: "InterX", fontWeight: 800, fontSize: 54, lineHeight: 1.35,
          color: t >= w[1] && t < w[2] + 0.1 ? C.yellow : t >= w[1] ? "#fff" : "rgba(255,255,255,0.5)" }}>{w[0]}</span>)}
      </div>
    </div>
  );
};

const Sfx: React.FC<{ at: number; src: string; v?: number }> = ({ at, src, v = 0.3 }) => (
  <Sequence from={Math.max(0, s(at))} durationInFrames={50}><Audio src={staticFile(`sfx/${src}.wav`)} volume={v} /></Sequence>
);
const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("terre/voice.m4a")} />
    <Audio src={staticFile("terre/bed.wav")} volume={(fr) => interpolate(fr, [0, 15, s(Q.abonne), s(Q.abonne) + 10, TERRE_FRAMES - 3], [0, 0.07, 0.07, 0.2, 0], clamp)} />
    {[1, 2, 4, 5, 6, 7, 8, 9].map((i) => <Sfx key={i} at={cut(i) - 0.07} src="whoosh" v={0.34} />)}
    {[Q.coup, Q.stop, Q.immeubles, Q.vagues + 1.2, Q.affaiblir].map((x, i) => <Sfx key={`b${i}`} at={x} src="bass" v={0.45} />)}
    {[0.25, 0.7, L[1] + 0.3, Q.est - 0.3, Q.avion - 0.2, Q.vents - 0.2, Q.son - 0.3, Q.vagues - 0.2, Q.poles - 0.3, Q.continent - 0.2, Q.oceans - 0.2, Q.annee - 0.6, Q.soleil - 0.4,
      Q.nuit - 0.4, L[8] + 0.6, Q.vent - 0.2, Q.ms - 0.4, Q.abonne - 0.2].map((x, i) => <Sfx key={`p${i}`} at={x} src="pop" v={0.24} />)}
    {Array.from({ length: 8 }).map((_, i) => <Sfx key={`t${i}`} at={Q.kmh - 0.2 + i * 0.2} src="tick" v={0.14} />)}
    {[Q.stop + 0.1, Q.stop + 0.5, Q.vents, Q.vents + 1.2, Q.vents + 2.4].map((x, i) => <Sfx key={`s${i}`} at={x} src="swipe" v={0.3} />)}
    <Sfx at={Q.impossible} src="ding" v={0.3} /><Sfx at={Q.abonne} src="check" v={0.3} />
  </>
);

export const TerreEdit: React.FC = () => {
  useFontFaces([["Anton", "fonts/anton.woff2", "400"], ["InterX", "fonts/inter-800.woff2", "800"]]);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }}><World /></ThreeCanvas>
      <Overlays />
      <Captions />
      <Vignette />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [TERRE_FRAMES - 10, TERRE_FRAMES - 1], [0, 1], clamp) }} />
      <Sound />
    </AbsoluteFill>
  );
};
