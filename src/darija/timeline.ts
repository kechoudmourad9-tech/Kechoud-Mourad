import cuts from "./cuts.json";
import track from "./faceTrack.json";
import { FPS, OUTRO } from "./theme";

export type Seg = { src: number; len: number; at: number };
export const SEGS: Seg[] = (cuts.segments as Seg[]).map((s, i, a) => (i === a.length - 1 ? { ...s, len: s.len + OUTRO } : s));
export const TOTAL = cuts.total + OUTRO;

// Push-ins: alternate framing on every jump cut, slow push on the strong lines.
const PUSH = new Set([0, 9]); // hook, "الفرق الوحيد" line
export const zoomOf = (i: number, local: number, len: number) =>
  PUSH.has(i) ? 1.0 + 0.08 * Math.min(1, local / len) : i % 2 ? 1.12 : 1.0;

const T = track as number[][];
const face = (srcFrame: number) => T[Math.max(0, Math.min(T.length - 1, srcFrame))];

export const segAt = (f: number) => {
  let i = SEGS.findIndex((s) => f >= s.at && f < s.at + s.len);
  if (i < 0) i = f < 0 ? 0 : SEGS.length - 1;
  return i;
};

/** zoom origin for a segment = head centre on its first frame (keeps the face in place across punch-ins) */
export const originOf = (i: number) => {
  const [cx, cy] = face(SEGS[i].src);
  return [cx, cy] as const;
};

/** head [cx, cy, size] in OUTPUT pixels at output frame f, including the segment's zoom */
export const headAt = (f: number) => {
  const i = segAt(f);
  const s = SEGS[i];
  const local = Math.max(0, Math.min(s.len - 1, f - s.at));
  const [cx, cy, size] = face(s.src + local);
  const z = zoomOf(i, local, s.len);
  const [ox, oy] = originOf(i);
  return [ox + (cx - ox) * z, oy + (cy - oy) * z, size * z] as const;
};

/** source seconds -> output frame (times inside a removed gap snap to the next kept segment) */
export const out = (srcSec: number) => {
  const sf = Math.round(srcSec * FPS);
  for (const s of SEGS) {
    if (sf < s.src) return s.at;
    if (sf < s.src + s.len) return s.at + (sf - s.src);
  }
  return TOTAL;
};
