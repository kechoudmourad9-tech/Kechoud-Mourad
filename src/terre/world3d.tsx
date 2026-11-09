// 3D kit for "Et si la Terre s'arrêtait de tourner ?" — procedural Earth (shader), stars, low-poly
// characters with animated limbs, cars, buildings, trees. Everything is driven by the Remotion frame.
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

export const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Cam: React.FC<{ pos: [number, number, number]; look: [number, number, number]; fov?: number; roll?: number }> = ({ pos, look, fov = 45, roll = 0 }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov;
  c.up.set(Math.sin(roll), Math.cos(roll), 0);
  c.lookAt(...look);
  c.updateProjectionMatrix();
  return null;
};

/* ---------------- Earth ---------------- */
const NOISE = `
float hash(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }
`;
const VERT = `varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){ vP = normalize(position); vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz;
  gl_Position = projectionMatrix*viewMatrix*w; }`;
const EARTH_FRAG = `${NOISE}
uniform vec3 uL; uniform float uMig; uniform vec3 uCam; varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){
  float n = fbm(vP*2.1+vec3(3.1,1.7,0.4));
  float lat = abs(vP.y);
  float thr = mix(0.50, 0.50 + (lat-0.42)*1.5, uMig);
  float land = smoothstep(thr-0.012, thr+0.012, n);
  vec3 sea = mix(vec3(0.02,0.16,0.48), vec3(0.08,0.42,0.80), smoothstep(thr-0.22, thr, n));
  vec3 grn = mix(vec3(0.16,0.55,0.20), vec3(0.62,0.52,0.28), smoothstep(thr+0.02, thr+0.20, n));
  grn = mix(grn, vec3(0.80,0.66,0.38), uMig*0.45*(1.0-smoothstep(0.0,0.5,lat)));
  vec3 col = mix(sea, grn, land);
  float ice = smoothstep(0.86,0.92,lat+ (n-0.5)*0.12) * (1.0-uMig);
  col = mix(col, vec3(0.95,0.97,1.0), ice);
  float d = dot(normalize(vN), normalize(uL));
  float lit = smoothstep(-0.12, 0.45, d);
  vec3 V = normalize(uCam - vW);
  float spec = pow(max(dot(reflect(-normalize(uL), vN), V),0.0), 30.0) * (1.0-land) * 0.6;
  float rim = pow(1.0 - max(dot(vN, V),0.0), 2.6);
  vec3 night = col*0.06 + vec3(1.0,0.8,0.4)*land*step(0.62, noise(vP*40.0))*0.25;
  gl_FragColor = vec4(mix(night, col*(0.25+0.95*max(d,0.0)) + spec, lit) + vec3(0.25,0.55,1.0)*rim*0.55*(0.25+lit), 1.0);
}`;
const CLOUD_FRAG = `${NOISE}
uniform vec3 uL; uniform float uT; varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){ float c = fbm(vP*3.2 + vec3(uT,0.0,uT*0.4)); float a = smoothstep(0.52,0.72,c);
  float d = smoothstep(-0.1,0.5,dot(normalize(vN), normalize(uL)));
  gl_FragColor = vec4(vec3(1.0)*(0.08+0.92*d), a*0.85); }`;
const ATMO_FRAG = `uniform vec3 uL; uniform vec3 uCam; varying vec3 vN; varying vec3 vW;
void main(){ vec3 V = normalize(uCam - vW); float f = pow(smoothstep(0.0, 0.53, -dot(vN, V)), 1.6);
  float d = 0.35 + 0.65*smoothstep(-0.3,0.5,dot(-vN, normalize(uL)));
  gl_FragColor = vec4(vec3(0.3,0.6,1.0), f*d*0.9); }`;

export const Earth: React.FC<{ r?: number; spin: number; tilt?: number; mig?: number; light: [number, number, number]; clouds?: number; cloudT?: number;
  pos?: [number, number, number]; children?: React.ReactNode }> = ({ r = 2, spin, tilt = 0.41, mig = 0, light, clouds = 1, cloudT = 0, pos = [0, 0, 0], children }) => {
  const { camera } = useThree();
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: EARTH_FRAG,
    uniforms: { uL: { value: new THREE.Vector3() }, uMig: { value: 0 }, uCam: { value: new THREE.Vector3() } } }), []);
  const cmat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: CLOUD_FRAG, transparent: true, depthWrite: false,
    uniforms: { uL: { value: new THREE.Vector3() }, uT: { value: 0 } } }), []);
  const amat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: ATMO_FRAG, transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: THREE.AdditiveBlending, uniforms: { uL: { value: new THREE.Vector3() }, uCam: { value: new THREE.Vector3() } } }), []);
  mat.uniforms.uL.value.set(...light); mat.uniforms.uMig.value = mig; mat.uniforms.uCam.value.copy(camera.position);
  cmat.uniforms.uL.value.set(...light); cmat.uniforms.uT.value = cloudT;
  amat.uniforms.uL.value.set(...light); amat.uniforms.uCam.value.copy(camera.position);
  return (
    <group position={pos} rotation={[0, 0, tilt]}>
      <group rotation={[0, spin, 0]}>
        <mesh material={mat}><sphereGeometry args={[r, 96, 64]} /></mesh>
        {children}
      </group>
      {clouds > 0 && <mesh material={cmat} rotation={[0, spin * 1.08, 0]} scale={1.02}><sphereGeometry args={[r, 64, 48]} /></mesh>}
      <mesh material={amat} scale={1.18}><sphereGeometry args={[r, 48, 32]} /></mesh>
    </group>
  );
};

export const Stars: React.FC<{ n?: number }> = ({ n = 900 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rnd(i, 1) * 2 - 1, th = rnd(i, 2) * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 60 + rnd(i, 3) * 30;
      a[i * 3] = R * s * Math.cos(th); a[i * 3 + 1] = R * u; a[i * 3 + 2] = R * s * Math.sin(th);
    }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, [n]);
  return <points geometry={geo}><pointsMaterial color="#ffffff" size={0.35} sizeAttenuation /></points>;
};

/* ---------------- character ---------------- */
export type GuyProps = { pos?: [number, number, number]; rot?: [number, number, number]; scale?: number; shirt: string; hair?: string; skin?: string;
  walk?: number; phase?: number; armL?: number; armR?: number; legSpread?: number; mouth?: "smile" | "o" };
export const Guy: React.FC<GuyProps> = ({ pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, shirt, hair = "#2b1a10", skin = "#f2c29b", walk = 0, phase = 0,
  armL, armR, legSpread = 0, mouth = "smile" }) => {
  const sw = Math.sin(phase) * 0.8 * walk;
  const aL = armL ?? sw, aR = armR ?? -sw;
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <group position={[0, Math.abs(Math.sin(phase)) * 0.06 * walk, 0]}>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.15 * sd, 0.85, 0]} rotation={[sd * sw + 0, 0, sd * legSpread]}>
            <mesh position={[0, -0.4, 0]}><capsuleGeometry args={[0.13, 0.62, 4, 10]} /><meshStandardMaterial color="#2d2a4a" roughness={0.8} /></mesh>
            <mesh position={[0, -0.82, 0.07]} scale={[1, 0.55, 1.5]}><sphereGeometry args={[0.15, 10, 8]} /><meshStandardMaterial color="#14101f" /></mesh>
          </group>
        ))}
        <mesh position={[0, 1.22, 0]}><capsuleGeometry args={[0.29, 0.42, 6, 14]} /><meshStandardMaterial color={shirt} roughness={0.7} /></mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.38 * sd, 1.5, 0]} rotation={[sd < 0 ? aL : aR, 0, sd * 0.12]}>
            <mesh position={[0, -0.3, 0]}><capsuleGeometry args={[0.09, 0.5, 4, 8]} /><meshStandardMaterial color={shirt} roughness={0.7} /></mesh>
            <mesh position={[0, -0.64, 0]}><sphereGeometry args={[0.11, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
          </group>
        ))}
        <group position={[0, 1.95, 0]}>
          <mesh><sphereGeometry args={[0.31, 20, 16]} /><meshStandardMaterial color={skin} roughness={0.8} /></mesh>
          <mesh position={[0, 0.06, -0.03]} scale={[1.04, 1, 1.04]}><sphereGeometry args={[0.31, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.48]} /><meshStandardMaterial color={hair} roughness={0.9} /></mesh>
          {[-1, 1].map((sd) => <mesh key={sd} position={[0.11 * sd, 0.0, 0.28]} scale={[1, 1.3, 0.6]}><sphereGeometry args={[0.042, 8, 8]} /><meshBasicMaterial color="#14101f" /></mesh>)}
          {mouth === "o"
            ? <mesh position={[0, -0.13, 0.285]} scale={[1, 1.25, 0.5]}><sphereGeometry args={[0.055, 10, 8]} /><meshBasicMaterial color="#5a1f24" /></mesh>
            : <mesh position={[0, -0.1, 0.275]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.016, 6, 12, Math.PI]} /><meshBasicMaterial color="#5a1f24" /></mesh>}
        </group>
      </group>
    </group>
  );
};

/* ---------------- props ---------------- */
export const Car: React.FC<{ pos: [number, number, number]; rot?: [number, number, number]; color: string; spin?: number }> = ({ pos, rot = [0, 0, 0], color, spin = 0 }) => (
  <group position={pos} rotation={rot}>
    <mesh position={[0, 0.5, 0]}><boxGeometry args={[2.4, 0.55, 1.1]} /><meshStandardMaterial color={color} roughness={0.4} metalness={0.2} /></mesh>
    <mesh position={[-0.1, 0.98, 0]}><boxGeometry args={[1.3, 0.48, 1.0]} /><meshStandardMaterial color="#bfe6ff" roughness={0.2} /></mesh>
    {[[-0.75, 0.56], [0.75, 0.56], [-0.75, -0.56], [0.75, -0.56]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.26, z]} rotation={[Math.PI / 2, spin, 0]}><cylinderGeometry args={[0.26, 0.26, 0.2, 14]} /><meshStandardMaterial color="#14101f" /></mesh>
    ))}
    <mesh position={[1.21, 0.52, 0.35]}><sphereGeometry args={[0.09, 8, 8]} /><meshBasicMaterial color="#fff6b0" /></mesh>
    <mesh position={[1.21, 0.52, -0.35]}><sphereGeometry args={[0.09, 8, 8]} /><meshBasicMaterial color="#fff6b0" /></mesh>
  </group>
);

const windowTex = (base: string, lit: string) => {
  const c = document.createElement("canvas"); c.width = 128; c.height = 256;
  const g = c.getContext("2d")!; g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 4; x++) { g.fillStyle = rnd(x + y * 7, 5) > 0.35 ? lit : "#27324d"; g.fillRect(12 + x * 29, 10 + y * 24, 18, 14); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
export const Building: React.FC<{ pos: [number, number, number]; w: number; h: number; d: number; color: string; rotZ?: number }> = ({ pos, w, h, d, color, rotZ = 0 }) => {
  const tex = useMemo(() => windowTex(color, "#ffe9a8"), [color]);
  return (
    <group position={pos} rotation={[0, 0, rotZ]}>
      <mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial map={tex} roughness={0.8} /></mesh>
      <mesh position={[0, h + 0.12, 0]}><boxGeometry args={[w + 0.2, 0.24, d + 0.2]} /><meshStandardMaterial color="#2b2f45" /></mesh>
    </group>
  );
};

export const Tree: React.FC<{ pos: [number, number, number]; bend?: number; s?: number }> = ({ pos, bend = 0, s = 1 }) => (
  <group position={pos} rotation={[0, 0, bend]} scale={s}>
    <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.16, 0.24, 2, 8]} /><meshStandardMaterial color="#6b4423" /></mesh>
    <group position={[0, 2, 0]} rotation={[0, 0, bend * 0.6]}>
      <mesh position={[0, 0.9, 0]}><sphereGeometry args={[1.05, 12, 10]} /><meshStandardMaterial color="#2fae5a" roughness={0.9} /></mesh>
      <mesh position={[0.5, 0.5, 0.3]}><sphereGeometry args={[0.7, 10, 8]} /><meshStandardMaterial color="#25964b" roughness={0.9} /></mesh>
    </group>
  </group>
);

/* tumbling "thrown east" motion after the stop */
export const fly = (tt: number, i: number) => {
  if (tt <= 0) return { dx: 0, dy: 0, rot: 0 };
  const v = 4.6 * (0.75 + rnd(i, 7) * 0.7), up = 7 + rnd(i, 8) * 6;
  const air = (2 * up) / 12, k = tt % air;
  const dy = tt < air * 3 ? Math.max(0, up * k - 6 * k * k) * Math.pow(0.55, Math.floor(tt / air)) : 0;
  return { dx: v * tt, dy, rot: -tt * (5 + rnd(i, 9) * 5) };
};
