// 3D kit for "Les bases de l'informatique": neon studio stage, text labels (canvas textures),
// devices, chip, transistor, logic gates, documents, malware creatures, lock, shield, servers.
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { Guy, rnd } from "../terre/world3d";

export const N = { pink: "#FF4FA3", blue: "#3D8BFF", yellow: "#FFD23F", green: "#2EC27E", purple: "#9B5CFF", cyan: "#22D3EE", red: "#FF4B4B", orange: "#FF9F43",
  ink: "#0b0d1e", white: "#ffffff", gold: "#e8b84a", metal: "#8f98b3" };

/* ---------- easing helpers (time in seconds) ---------- */
export const sat = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => { const k = sat(x); return k * k * (3 - 2 * k); };
export const ramp = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
export const pop = (t: number, at: number, d = 0.4) => { const k = sat((t - at) / d); if (k <= 0) return 0; const c = 1.70158 * 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ---------- every lit mesh casts + receives shadows ---------- */
export const Shadowify: React.FC = () => {
  const { scene } = useThree();
  scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(m.material as THREE.Material).transparent && (m.material as THREE.Material).type !== "MeshBasicMaterial") { m.castShadow = true; m.receiveShadow = true; } });
  return null;
};

/* ---------- stage ---------- */
export const Stage: React.FC<{ bg?: string; floor?: string; a?: string; b?: string; t: number; dim?: number }> = ({ bg = "#0a0c22", floor = "#141838", a = N.pink, b = N.blue, t, dim = 1 }) => (
  <>
    <color attach="background" args={[bg]} />
    <fog attach="fog" args={[bg, 22, 60]} />
    <ambientLight intensity={0.75 * dim} />
    <directionalLight position={[5, 14, 9]} intensity={2.3 * dim} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9}
      shadow-camera-top={14} shadow-camera-bottom={-4} shadow-camera-far={40} shadow-bias={-0.002} />
    <pointLight position={[-7, 5, 4]} intensity={90 * dim} color={a} />
    <pointLight position={[7, 6, 2]} intensity={90 * dim} color={b} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[160, 160]} /><meshStandardMaterial color={floor} roughness={0.55} metalness={0.25} /></mesh>
    {Array.from({ length: 21 }).map((_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 10) * 2.4, 0.01, -10]}><planeGeometry args={[0.04, 70]} /><meshBasicMaterial color={b} transparent opacity={0.22} /></mesh>)}
    {Array.from({ length: 26 }).map((_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 12 - ((i * 2.4 + t * 0.8) % 62)]}><planeGeometry args={[60, 0.04]} /><meshBasicMaterial color={a} transparent opacity={0.2} /></mesh>)}
    {Array.from({ length: 70 }).map((_, i) => <mesh key={i} position={[(rnd(i, 1) - 0.5) * 30, 1 + rnd(i, 2) * 16 + Math.sin(t * 0.6 + i) * 0.4, -8 - rnd(i, 3) * 22]}>
      <sphereGeometry args={[0.05 + rnd(i, 4) * 0.06, 6, 6]} /><meshBasicMaterial color={i % 2 ? a : b} transparent opacity={0.7} /></mesh>)}
  </>
);

/* ---------- text label on a plane (canvas texture, cached) ---------- */
const cache = new Map<string, { tex: THREE.CanvasTexture; ar: number }>();
export const textTex = (text: string, fg = "#fff", bg = "", font = "Anton", pad = 0.25) => {
  const key = [text, fg, bg, font, pad].join("|");
  const hit = cache.get(key); if (hit) return hit;
  const c = document.createElement("canvas"), g = c.getContext("2d")!, H = 160, f = `${font === "mono" ? "700 " : ""}${H * 0.7}px ${font === "mono" ? "monospace" : font}`;
  g.font = f; const w = Math.ceil(g.measureText(text).width + H * pad * 2);
  c.width = Math.max(8, w); c.height = H;
  if (bg) { g.fillStyle = bg; const r = H * 0.28; g.beginPath(); g.roundRect(0, 0, c.width, H, r); g.fill(); }
  g.font = f; g.fillStyle = fg; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText(text, c.width / 2, H * 0.54);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const v = { tex, ar: c.width / H }; cache.set(key, v); return v;
};
export const Lbl: React.FC<{ text: string; pos?: [number, number, number]; h?: number; fg?: string; bg?: string; font?: string; rot?: [number, number, number]; s?: number; op?: number; maxW?: number }> = ({
  text, pos = [0, 0, 0], h = 0.6, fg, bg, font, rot = [0, 0, 0], s = 1, op = 1, maxW }) => {
  const { tex, ar } = textTex(text, fg, bg, font);
  const w = h * ar, k = maxW && w > maxW ? maxW / w : 1;
  if (s <= 0.001) return null;
  return <mesh position={pos} rotation={rot} scale={[s * k, s * k, s * k]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} transparent opacity={op} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
};

/* a group that pops in at `a` and out at `b` (seconds) */
export const Sub: React.FC<{ t: number; a: number; b: number; pos?: [number, number, number]; children: React.ReactNode }> = ({ t, a, b, pos = [0, 0, 0], children }) => {
  if (t < a || t >= b) return null;
  const k = pop(t, a) * (1 - ramp(t, b - 0.22, b));
  return <group position={pos} scale={Math.max(0.0001, k)}>{children}</group>;
};

/* ---------- devices ---------- */
export const Monitor: React.FC<{ pos?: [number, number, number]; s?: number; screen?: string; glow?: number; rot?: [number, number, number]; children?: React.ReactNode; map?: THREE.Texture }> = ({
  pos = [0, 0, 0], s = 1, screen = "#1b2a5c", glow = 1, rot = [0, 0, 0], children, map }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh position={[0, 1.25, 0]}><boxGeometry args={[2.3, 1.5, 0.14]} /><meshStandardMaterial color="#23273d" roughness={0.4} metalness={0.5} /></mesh>
    <mesh position={[0, 1.25, 0.075]}><planeGeometry args={[2.1, 1.3]} /><meshBasicMaterial color={map ? "#fff" : screen} map={map} toneMapped={false} opacity={glow} transparent={glow < 1} /></mesh>
    <group position={[0, 1.25, 0.09]}>{children}</group>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.24, 0.5, 0.12]} /><meshStandardMaterial color="#3a4060" metalness={0.5} roughness={0.4} /></mesh>
    <mesh position={[0, 0.05, 0.1]}><boxGeometry args={[1.1, 0.1, 0.7]} /><meshStandardMaterial color="#3a4060" metalness={0.5} roughness={0.4} /></mesh>
  </group>
);
export const Laptop: React.FC<{ pos?: [number, number, number]; s?: number; screen?: string; rot?: [number, number, number]; children?: React.ReactNode }> = ({ pos = [0, 0, 0], s = 1, screen = "#1f6feb", rot = [0, 0, 0], children }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh position={[0, 0.06, 0.55]}><boxGeometry args={[2.0, 0.12, 1.3]} /><meshStandardMaterial color="#aab2cc" metalness={0.6} roughness={0.35} /></mesh>
    <mesh position={[0, 0.125, 0.5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.7, 0.8]} /><meshStandardMaterial color="#2b3050" /></mesh>
    <group position={[0, 0.12, -0.1]} rotation={[-0.22, 0, 0]}>
      <mesh position={[0, 0.7, 0]}><boxGeometry args={[2.0, 1.35, 0.08]} /><meshStandardMaterial color="#aab2cc" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 0.7, 0.045]}><planeGeometry args={[1.84, 1.18]} /><meshBasicMaterial color={screen} toneMapped={false} /></mesh>
      <group position={[0, 0.7, 0.06]}>{children}</group>
    </group>
  </group>
);
export const Phone: React.FC<{ pos?: [number, number, number]; s?: number; rot?: [number, number, number]; screen?: string; children?: React.ReactNode }> = ({ pos = [0, 0, 0], s = 1, rot = [0, 0, 0], screen = "#7c4dff", children }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh><boxGeometry args={[0.95, 1.9, 0.12]} /><meshStandardMaterial color="#1a1d33" metalness={0.6} roughness={0.3} /></mesh>
    <mesh position={[0, 0, 0.065]}><planeGeometry args={[0.83, 1.72]} /><meshBasicMaterial color={screen} toneMapped={false} /></mesh>
    <group position={[0, 0, 0.08]}>{children}</group>
  </group>
);
export const Gamepad: React.FC<{ pos?: [number, number, number]; s?: number; rot?: [number, number, number] }> = ({ pos = [0, 0, 0], s = 1, rot = [0, 0, 0] }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh><boxGeometry args={[1.5, 0.7, 0.3]} /><meshStandardMaterial color="#f4f5fb" roughness={0.4} /></mesh>
    {[-1, 1].map((d) => <mesh key={d} position={[0.78 * d, -0.22, 0]} rotation={[0, 0, d * 0.35]}><capsuleGeometry args={[0.26, 0.5, 6, 12]} /><meshStandardMaterial color="#f4f5fb" roughness={0.4} /></mesh>)}
    <mesh position={[-0.45, 0.08, 0.17]}><cylinderGeometry args={[0.16, 0.16, 0.1, 16]} /><meshStandardMaterial color="#23273d" /></mesh>
    {[[0.35, 0.12, N.red], [0.6, 0.12, N.green], [0.475, 0.26, N.yellow], [0.475, -0.02, N.blue]].map(([x, y, c], i) => <mesh key={i} position={[x as number, y as number, 0.17]}><sphereGeometry args={[0.075, 10, 10]} /><meshStandardMaterial color={c as string} /></mesh>)}
  </group>
);
export const Server: React.FC<{ pos?: [number, number, number]; s?: number; t: number; seed?: number; evil?: boolean }> = ({ pos = [0, 0, 0], s = 1, t, seed = 0, evil }) => (
  <group position={pos} scale={s}>
    <mesh position={[0, 1.6, 0]}><boxGeometry args={[1.3, 3.2, 1]} /><meshStandardMaterial color="#1c2038" metalness={0.5} roughness={0.45} /></mesh>
    {Array.from({ length: 6 }).map((_, i) => <group key={i} position={[0, 0.4 + i * 0.48, 0.51]}>
      <mesh><planeGeometry args={[1.12, 0.36]} /><meshStandardMaterial color="#2c3254" /></mesh>
      {[0, 1, 2].map((j) => <mesh key={j} position={[-0.4 + j * 0.16, 0, 0.01]}><circleGeometry args={[0.045, 10]} />
        <meshBasicMaterial color={evil ? N.red : Math.sin(t * (6 + j * 3) + i * 2 + seed) > 0 ? N.green : "#124a2c"} toneMapped={false} /></mesh>)}
    </group>)}
  </group>
);

/* ---------- chip ---------- */
export const Chip: React.FC<{ pos?: [number, number, number]; s?: number; rot?: [number, number, number]; label?: string; glow?: string; pulse?: number }> = ({ pos = [0, 0, 0], s = 1, rot = [0, 0, 0], label = "CPU", glow = N.cyan, pulse = 0 }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh><boxGeometry args={[2.2, 2.2, 0.28]} /><meshStandardMaterial color="#15182b" roughness={0.35} metalness={0.6} /></mesh>
    <mesh position={[0, 0, 0.15]}><planeGeometry args={[1.5, 1.5]} /><meshStandardMaterial color="#2a2f52" emissive={glow} emissiveIntensity={0.25 + pulse * 0.9} metalness={0.8} roughness={0.25} /></mesh>
    {Array.from({ length: 32 }).map((_, i) => { const side = i % 4, k = Math.floor(i / 4), o = -0.875 + k * 0.25;
      const p: [number, number, number] = side === 0 ? [o, 1.2, 0] : side === 1 ? [o, -1.2, 0] : side === 2 ? [1.2, o, 0] : [-1.2, o, 0];
      return <mesh key={i} position={p}><boxGeometry args={side < 2 ? [0.1, 0.3, 0.1] : [0.3, 0.1, 0.1]} /><meshStandardMaterial color={N.gold} metalness={0.9} roughness={0.25} /></mesh>; })}
    {label && <Lbl text={label} pos={[0, 0, 0.17]} h={0.55} fg="#ffffff" maxW={1.4} />}
  </group>
);

/* ---------- MOSFET cross-section ---------- */
export const Mosfet: React.FC<{ t: number; on: number; s?: number; pos?: [number, number, number] }> = ({ t, on, s = 1, pos = [0, 0, 0] }) => (
  <group position={pos} scale={s}>
    <mesh position={[0, -0.5, 0]}><boxGeometry args={[5.2, 1.5, 1.6]} /><meshStandardMaterial color="#5b3fa8" roughness={0.6} /></mesh>
    {[-1, 1].map((d) => <mesh key={d} position={[1.75 * d, 0.02, 0]}><boxGeometry args={[1.5, 0.75, 1.62]} /><meshStandardMaterial color={N.blue} roughness={0.5} /></mesh>)}
    <mesh position={[0, 0.33, 0]}><boxGeometry args={[2.0, 0.12, 1.62]} /><meshStandardMaterial color="#f1f3ff" /></mesh>
    <mesh position={[0, 0.72, 0]}><boxGeometry args={[2.0, 0.65, 1.62]} /><meshStandardMaterial color={N.gold} metalness={0.8} roughness={0.3} emissive={N.yellow} emissiveIntensity={on * 1.3} /></mesh>
    {[-1, 0, 1].map((d) => <mesh key={d} position={[1.75 * d, d === 0 ? 1.7 : 1.1, 0]}><cylinderGeometry args={[0.09, 0.09, d === 0 ? 1.4 : 1.5, 10]} /><meshStandardMaterial color={N.metal} metalness={0.8} roughness={0.3} /></mesh>)}
    {/* channel glow */}
    <mesh position={[0, 0.2, 0.82]}><planeGeometry args={[2.0, 0.22]} /><meshBasicMaterial color={N.cyan} transparent opacity={on * 0.9} toneMapped={false} /></mesh>
    {/* electrons */}
    {Array.from({ length: 16 }).map((_, i) => {
      const ph = (t * 0.9 + i / 16) % 1;
      const x = on > 0.5 ? -2.4 + ph * 4.8 : -2.3 + rnd(i, 1) * 1.1 + Math.sin(t * 9 + i) * 0.04;
      const y = on > 0.5 ? (Math.abs(x) < 1 ? 0.18 : 0.05 + rnd(i, 2) * 0.2) : -0.2 + rnd(i, 3) * 0.5;
      return <mesh key={i} position={[x, y, 0.85 + rnd(i, 4) * 0.05]}><sphereGeometry args={[0.085, 10, 10]} /><meshBasicMaterial color={N.cyan} toneMapped={false} /></mesh>;
    })}
  </group>
);

/* ---------- bit cube ---------- */
export const Bit: React.FC<{ v: number; pos?: [number, number, number]; s?: number; on?: string }> = ({ v, pos = [0, 0, 0], s = 1, on = N.yellow }) => (
  <group position={pos} scale={s}>
    <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={v ? on : "#232846"} emissive={v ? on : "#000"} emissiveIntensity={v ? 0.55 : 0} roughness={0.35} /></mesh>
    <Lbl text={v ? "1" : "0"} pos={[0, 0, 0.51]} h={0.8} fg={v ? N.ink : "#7d86b8"} />
  </group>
);

/* ---------- wires & lamps ---------- */
export const Wire: React.FC<{ a: [number, number, number]; b: [number, number, number]; on?: number; color?: string; r?: number }> = ({ a, b, on = 0, color = N.yellow, r = 0.07 }) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), mid = A.clone().add(B).multiplyScalar(0.5), len = A.distanceTo(B);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return <mesh position={mid} quaternion={q}><cylinderGeometry args={[r, r, len, 8]} /><meshStandardMaterial color={on > 0.5 ? color : "#3a4168"} emissive={color} emissiveIntensity={on * 1.2} /></mesh>;
};
export const Lamp: React.FC<{ pos: [number, number, number]; on: number; color?: string; r?: number }> = ({ pos, on, color = N.yellow, r = 0.34 }) => (
  <group position={pos}>
    <mesh><sphereGeometry args={[r, 20, 16]} /><meshStandardMaterial color={on > 0.5 ? color : "#2a2f52"} emissive={color} emissiveIntensity={on * 1.6} roughness={0.3} /></mesh>
    {on > 0.5 && <mesh><sphereGeometry args={[r * 1.7, 16, 12]} /><meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} /></mesh>}
  </group>
);

/* ---------- logic gates ---------- */
const gateGeo = (kind: "and" | "or" | "not") => {
  const sh = new THREE.Shape();
  if (kind === "and") { sh.moveTo(-0.9, -0.8); sh.lineTo(0.1, -0.8); sh.absarc(0.1, 0, 0.8, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(-0.9, 0.8); sh.closePath(); }
  else if (kind === "or") { sh.moveTo(-0.95, -0.8); sh.quadraticCurveTo(0.35, -0.8, 1, 0); sh.quadraticCurveTo(0.35, 0.8, -0.95, 0.8); sh.quadraticCurveTo(-0.45, 0, -0.95, -0.8); }
  else { sh.moveTo(-0.85, -0.8); sh.lineTo(0.65, 0); sh.lineTo(-0.85, 0.8); sh.closePath(); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }); g.translate(0, 0, -0.22); return g;
};
export const Gate: React.FC<{ kind: "and" | "or" | "not"; a: number; b?: number; pos?: [number, number, number]; s?: number; color?: string; name?: string }> = ({ kind, a, b = 0, pos = [0, 0, 0], s = 1, color = N.purple, name }) => {
  const geo = useMemo(() => gateGeo(kind), [kind]);
  const out = kind === "and" ? a * b : kind === "or" ? Math.max(a, b) : 1 - a;
  const two = kind !== "not";
  return (
    <group position={pos} scale={s}>
      <mesh geometry={geo}><meshStandardMaterial color={color} roughness={0.35} metalness={0.3} emissive={color} emissiveIntensity={0.15 + out * 0.35} /></mesh>
      {kind === "not" && <mesh position={[0.83, 0, 0]}><sphereGeometry args={[0.17, 14, 12]} /><meshStandardMaterial color={color} /></mesh>}
      {name && <Lbl text={name} pos={[kind === "not" ? -0.35 : -0.1, 0, 0.3]} h={0.55} />}
      {two ? <>
        <Wire a={[-2.4, 0.4, 0]} b={[-0.9, 0.4, 0]} on={a} /><Wire a={[-2.4, -0.4, 0]} b={[-0.9, -0.4, 0]} on={b} />
        <Lamp pos={[-2.6, 0.4, 0]} on={a} r={0.3} /><Lamp pos={[-2.6, -0.4, 0]} on={b} r={0.3} />
      </> : <><Wire a={[-2.4, 0, 0]} b={[-0.85, 0, 0]} on={a} /><Lamp pos={[-2.6, 0, 0]} on={a} r={0.3} /></>}
      <Wire a={[kind === "and" ? 0.9 : 1.0, 0, 0]} b={[2.3, 0, 0]} on={out} color={N.green} />
      <Lamp pos={[2.6, 0, 0]} on={out} color={N.green} r={0.36} />
    </group>
  );
};

/* ---------- document / file ---------- */
export const Doc: React.FC<{ pos?: [number, number, number]; s?: number; color?: string; rot?: [number, number, number]; bad?: number; locked?: number }> = ({ pos = [0, 0, 0], s = 1, color = N.blue, rot = [0, 0, 0], bad = 0, locked = 0 }) => {
  const c = new THREE.Color("#f4f6ff").lerp(new THREE.Color("#ffb3b3"), bad).lerp(new THREE.Color("#7b8096"), locked);
  return (
    <group position={pos} scale={s} rotation={rot}>
      <mesh><boxGeometry args={[0.8, 1.05, 0.1]} /><meshStandardMaterial color={c} roughness={0.6} /></mesh>
      <mesh position={[0, 0.36, 0.055]}><planeGeometry args={[0.8, 0.3]} /><meshBasicMaterial color={locked > 0.5 ? "#555a70" : bad > 0.5 ? N.red : color} /></mesh>
      {[0, 1, 2].map((i) => <mesh key={i} position={[-0.06 * i, 0.05 - i * 0.17, 0.055]}><planeGeometry args={[0.56 - i * 0.12, 0.07]} /><meshBasicMaterial color="#9aa3c7" /></mesh>)}
    </group>
  );
};

/* ---------- malware creatures ---------- */
export const Virus: React.FC<{ pos?: [number, number, number]; s?: number; t: number; color?: string; seed?: number }> = ({ pos = [0, 0, 0], s = 1, t, color = N.red, seed = 0 }) => (
  <group position={pos} scale={s} rotation={[0, Math.sin(t * 2 + seed) * 0.3, Math.sin(t * 3 + seed) * 0.12]}>
    <mesh><icosahedronGeometry args={[0.5, 1]} /><meshStandardMaterial color={color} roughness={0.45} flatShading emissive={color} emissiveIntensity={0.25} /></mesh>
    {Array.from({ length: 12 }).map((_, i) => { const u = rnd(i, 11) * 2 - 1, th = rnd(i, 12) * 6.283, r = Math.sqrt(1 - u * u), d = new THREE.Vector3(r * Math.cos(th), u, r * Math.sin(th) * 0.6 - 0.15).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d), k = 0.62 + Math.sin(t * 6 + i + seed) * 0.05;
      return <mesh key={i} position={[d.x * k, d.y * k, d.z * k]} quaternion={q}><coneGeometry args={[0.09, 0.34, 6]} /><meshStandardMaterial color="#9c1230" /></mesh>; })}
    {[-1, 1].map((d) => <group key={d} position={[0.19 * d, 0.08, 0.44]}>
      <mesh><sphereGeometry args={[0.12, 12, 10]} /><meshBasicMaterial color="#fff" /></mesh>
      <mesh position={[0, -0.01, 0.09]}><sphereGeometry args={[0.055, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0, 0.14, 0.05]} rotation={[0, 0, d * -0.5]}><boxGeometry args={[0.24, 0.05, 0.05]} /><meshBasicMaterial color="#3d0612" /></mesh>
    </group>)}
    <mesh position={[0, -0.2, 0.46]} rotation={[0, 0, 0]}><torusGeometry args={[0.12, 0.025, 6, 12, Math.PI]} /><meshBasicMaterial color="#3d0612" /></mesh>
  </group>
);
export const Worm: React.FC<{ path: (u: number) => [number, number, number]; u: number; t: number; n?: number }> = ({ path, u, t, n = 9 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => { const p = path(Math.max(0, u - i * 0.022)), r = i === 0 ? 0.3 : 0.24 - i * 0.012;
      return <group key={i} position={[p[0], p[1] + Math.sin(t * 12 - i * 0.9) * 0.09, p[2]]}>
        <mesh><sphereGeometry args={[r, 14, 12]} /><meshStandardMaterial color={i % 2 ? "#b5e61d" : "#7cc70f"} roughness={0.5} /></mesh>
        {i === 0 && [-1, 1].map((d) => <mesh key={d} position={[0.12 * d, 0.1, 0.25]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#c81e1e" /></mesh>)}
      </group>; })}
  </>
);
export const Horse: React.FC<{ pos?: [number, number, number]; s?: number; open?: number; roll?: number }> = ({ pos = [0, 0, 0], s = 1, open = 0, roll = 0 }) => {
  const wood = "#b9793a", dark = "#7d4a1e";
  return (
    <group position={pos} scale={s}>
      <mesh position={[0, 1.5, 0]}><boxGeometry args={[2.2, 1.1, 1]} /><meshStandardMaterial color={wood} roughness={0.8} /></mesh>
      <group position={[-0.6, 0.96, 0.51]} rotation={[open * 1.5, 0, 0]}><mesh position={[0, -0.0, 0]}><boxGeometry args={[0.8, 0.05, 0.02]} /><meshStandardMaterial color={dark} /></mesh>
        <mesh position={[0.35, 0.45, 0.02]}><boxGeometry args={[0.9, 0.9, 0.06]} /><meshStandardMaterial color={dark} roughness={0.8} /></mesh></group>
      <mesh position={[1.0, 2.35, 0]} rotation={[0, 0, -0.45]}><boxGeometry args={[0.6, 1.3, 0.7]} /><meshStandardMaterial color={wood} roughness={0.8} /></mesh>
      <mesh position={[1.55, 2.85, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[1.0, 0.5, 0.6]} /><meshStandardMaterial color={wood} roughness={0.8} /></mesh>
      {[-1, 1].map((d) => <mesh key={d} position={[1.3, 3.25, 0.2 * d]}><coneGeometry args={[0.1, 0.3, 6]} /><meshStandardMaterial color={dark} /></mesh>)}
      <mesh position={[1.75, 2.95, 0.31]}><sphereGeometry args={[0.06, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0.85, 2.6, 0]} rotation={[0, 0, -0.45]}><boxGeometry args={[0.16, 1.2, 0.76]} /><meshStandardMaterial color={dark} /></mesh>
      <mesh position={[-1.2, 1.7, 0]} rotation={[0, 0, 0.6]}><boxGeometry args={[0.14, 0.9, 0.3]} /><meshStandardMaterial color={dark} /></mesh>
      {[[-0.8, 0.4], [0.8, 0.4], [-0.8, -0.4], [0.8, -0.4]].map(([x, z], i) => <mesh key={i} position={[x, 0.6, z]}><boxGeometry args={[0.24, 0.8, 0.22]} /><meshStandardMaterial color={wood} roughness={0.8} /></mesh>)}
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[2.8, 0.12, 1.3]} /><meshStandardMaterial color={dark} /></mesh>
      {[[-1, 0.7], [1, 0.7], [-1, -0.7], [1, -0.7]].map(([x, z], i) => <mesh key={i} position={[x, 0.22, z]} rotation={[Math.PI / 2, roll, 0]}><cylinderGeometry args={[0.22, 0.22, 0.12, 14]} /><meshStandardMaterial color="#3b2410" /></mesh>)}
    </group>
  );
};
export const Lock: React.FC<{ pos?: [number, number, number]; s?: number; color?: string; rot?: [number, number, number] }> = ({ pos = [0, 0, 0], s = 1, color = N.gold, rot = [0, 0, 0] }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh><boxGeometry args={[0.9, 0.72, 0.3]} /><meshStandardMaterial color={color} metalness={0.7} roughness={0.3} /></mesh>
    <mesh position={[0, 0.42, 0]}><torusGeometry args={[0.27, 0.075, 10, 20, Math.PI]} /><meshStandardMaterial color="#c8cee6" metalness={0.9} roughness={0.25} /></mesh>
    <mesh position={[0, 0.02, 0.16]}><circleGeometry args={[0.09, 12]} /><meshBasicMaterial color="#231a05" /></mesh>
    <mesh position={[0, -0.1, 0.16]}><planeGeometry args={[0.06, 0.2]} /><meshBasicMaterial color="#231a05" /></mesh>
  </group>
);
const shieldGeo = (() => { let g: THREE.ExtrudeGeometry | null = null; return () => { if (g) return g; const sh = new THREE.Shape();
  sh.moveTo(0, 1.1); sh.quadraticCurveTo(0.55, 0.95, 0.95, 0.75); sh.quadraticCurveTo(1.0, -0.35, 0, -1.15); sh.quadraticCurveTo(-1.0, -0.35, -0.95, 0.75); sh.quadraticCurveTo(-0.55, 0.95, 0, 1.1);
  g = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }); g.translate(0, 0, -0.1); return g; }; })();
export const Shield: React.FC<{ pos?: [number, number, number]; s?: number; color?: string; rot?: [number, number, number]; check?: boolean }> = ({ pos = [0, 0, 0], s = 1, color = N.green, rot = [0, 0, 0], check = true }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh geometry={shieldGeo()}><meshStandardMaterial color={color} metalness={0.4} roughness={0.3} emissive={color} emissiveIntensity={0.3} /></mesh>
    {check && <Lbl text="✓" font="sans-serif" pos={[0, 0, 0.2]} h={1.2} fg="#fff" />}
  </group>
);
export const Eye: React.FC<{ pos?: [number, number, number]; s?: number; look?: [number, number]; lid?: number }> = ({ pos = [0, 0, 0], s = 1, look = [0, 0], lid = 0 }) => (
  <group position={pos} scale={s}>
    <mesh><sphereGeometry args={[0.6, 24, 18]} /><meshStandardMaterial color="#fff" roughness={0.3} /></mesh>
    <group position={[look[0] * 0.2, look[1] * 0.2, 0]}>
      <mesh position={[0, 0, 0.5]}><sphereGeometry args={[0.28, 16, 12]} /><meshStandardMaterial color={N.red} emissive={N.red} emissiveIntensity={0.5} /></mesh>
      <mesh position={[0, 0, 0.7]}><sphereGeometry args={[0.13, 12, 10]} /><meshBasicMaterial color="#111" /></mesh>
    </group>
    <mesh position={[0, 0.25 - lid * 0.2, 0.05]} rotation={[-0.3 - lid * 0.5, 0, 0]}><sphereGeometry args={[0.64, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} /><meshStandardMaterial color="#2a0f1a" /></mesh>
  </group>
);
export const Hacker: React.FC<{ pos?: [number, number, number]; s?: number; t: number; rot?: [number, number, number]; armR?: number; armL?: number }> = ({ pos = [0, 0, 0], s = 1, t, rot = [0, 0, 0], armR, armL }) => (
  <group position={pos} scale={s} rotation={rot}>
    <Guy shirt="#1b1d2e" hair="#1b1d2e" skin="#d8b08c" armR={armR ?? -0.9 + Math.sin(t * 9) * 0.15} armL={armL ?? -0.9 + Math.cos(t * 9) * 0.15} />
    <mesh position={[0, 1.99, 0.24]}><boxGeometry args={[0.5, 0.13, 0.16]} /><meshBasicMaterial color={N.red} toneMapped={false} /></mesh>
    <mesh position={[0, 2.02, -0.04]} scale={[1.14, 1.12, 1.12]}><sphereGeometry args={[0.31, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><meshStandardMaterial color="#1b1d2e" roughness={0.9} /></mesh>
  </group>
);
export const Tube: React.FC<{ pos: [number, number, number]; s?: number; glow: number }> = ({ pos, s = 1, glow }) => (
  <group position={pos} scale={s}>
    <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.3, 0.34, 0.3, 14]} /><meshStandardMaterial color="#3a3f5c" metalness={0.7} roughness={0.4} /></mesh>
    <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.07, 0.07, 0.9, 8]} /><meshBasicMaterial color={new THREE.Color("#55301a").lerp(new THREE.Color("#ffb347"), glow)} toneMapped={false} /></mesh>
    <mesh position={[0, 0.85, 0]}><capsuleGeometry args={[0.3, 0.8, 8, 16]} /><meshStandardMaterial color="#ffd9a8" transparent opacity={0.28 + glow * 0.2} roughness={0.1} depthWrite={false} /></mesh>
  </group>
);
export const Bug: React.FC<{ pos?: [number, number, number]; s?: number; t: number; rot?: [number, number, number] }> = ({ pos = [0, 0, 0], s = 1, t, rot = [0, 0, 0] }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh scale={[1, 0.7, 1.3]}><sphereGeometry args={[0.4, 16, 12]} /><meshStandardMaterial color={N.red} roughness={0.35} /></mesh>
    <mesh position={[0, 0.03, 0.5]}><sphereGeometry args={[0.2, 12, 10]} /><meshStandardMaterial color="#1a1a22" /></mesh>
    {[[-0.15, 0.1], [0.17, -0.12], [0.02, -0.3]].map(([x, z], i) => <mesh key={i} position={[x, 0.26, z]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#1a1a22" /></mesh>)}
    {[-1, 1].flatMap((d) => [0, 1, 2].map((i) => <mesh key={`${d}${i}`} position={[0.42 * d, -0.12, -0.3 + i * 0.3]} rotation={[Math.sin(t * 18 + i * 2) * 0.4, 0, d * 1.0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} /><meshStandardMaterial color="#1a1a22" /></mesh>))}
    {[-1, 1].map((d) => <mesh key={d} position={[0.1 * d, 0.16, 0.72]} rotation={[0.9, 0, d * 0.4]}><cylinderGeometry args={[0.02, 0.02, 0.35, 6]} /><meshStandardMaterial color="#1a1a22" /></mesh>)}
  </group>
);
export const AppWin: React.FC<{ pos?: [number, number, number]; s?: number; color: string; name: string; rot?: [number, number, number]; glow?: number }> = ({ pos = [0, 0, 0], s = 1, color, name, rot = [0, 0, 0], glow = 0.3 }) => (
  <group position={pos} scale={s} rotation={rot}>
    <mesh><boxGeometry args={[1.9, 1.3, 0.12]} /><meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={glow} /></mesh>
    <mesh position={[0, 0.5, 0.065]}><planeGeometry args={[1.9, 0.3]} /><meshBasicMaterial color="#10132a" /></mesh>
    {[N.red, N.yellow, N.green].map((c, i) => <mesh key={i} position={[-0.78 + i * 0.16, 0.5, 0.07]}><circleGeometry args={[0.05, 10]} /><meshBasicMaterial color={c} /></mesh>)}
    <Lbl text={name} pos={[0, -0.12, 0.07]} h={0.42} maxW={1.7} />
  </group>
);
export { Guy, rnd };
