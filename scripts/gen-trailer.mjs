// Original cinematic trailer score for "Galatia" (45 s): drone, braams, ticking build, toms,
// riser, silence, title impact, pad. Hit times match src/galatia/GalatiaTrailer.tsx (HITS).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100, DUR = 46, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "galatia");
mkdirSync(OUT, { recursive: true });
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));
const add = (t0, dur, fn, pan = 0) => {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && s0 + i < N; i++) { const v = fn(i / SR, i / n); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
};

export const HITS = { braam: [3.0, 9.0, 16.0, 21.0], build: 23.0, riser: [29.8, 33.2], title: 34.5, end: 41.5 };

// low drone with slow movement (0 – 34.0, then again under the title)
const drone = (t0, t1, amp) => {
  let lp = 0;
  add(t0, t1 - t0, (t, p) => {
    const env = Math.min(1, t / 2.5) * Math.min(1, (t1 - t0 - t) / 0.6);
    const x = saw(36.71 * t) * 0.6 + saw(36.71 * 1.003 * t) * 0.6 + Math.sin(2 * Math.PI * 55 * t) * 0.5;
    const cut = 0.012 + 0.01 * (0.5 + 0.5 * Math.sin(t * 0.7));
    lp += cut * (x - lp);
    return lp * env * amp;
  });
};
drone(0, 33.6, 0.9);
drone(34.5, 46, 0.7);

// braam: detuned saw stack, filter opens then closes, sub hit
const braam = (t0, gain = 1) => {
  const notes = [73.42, 110, 146.83, 220];
  for (const [k, side] of [[0, -0.4], [1, 0.4]]) {
    let lp = 0;
    add(t0, 3.6, (t, p) => {
      const env = Math.min(1, t * 25) * Math.exp(-t * 0.9);
      let x = 0; for (const f of notes) x += saw(f * (1 + (k ? 0.004 : -0.004)) * t) + 0.5 * saw(f * 2.002 * t);
      const cut = 0.02 + 0.25 * Math.exp(-t * 2.2);
      lp += cut * (x - lp);
      return lp * env * 0.22 * gain;
    }, side);
  }
  add(t0, 2.5, (t) => Math.sin(2 * Math.PI * (48 - 14 * Math.min(1, t * 2)) * t) * Math.exp(-t * 1.6) * 0.9 * gain);
  add(t0, 0.25, (t, p) => rnd() * Math.exp(-p * 8) * 0.25 * gain);
};
// impact: noise crack + pitch-dropping sub
const impact = (t0, gain = 1) => {
  add(t0, 0.5, (t, p) => rnd() * Math.exp(-p * 7) * 0.5 * gain);
  add(t0, 2.2, (t) => Math.sin(2 * Math.PI * (90 * Math.exp(-t * 3) + 28) * t) * Math.exp(-t * 1.3) * 1.0 * gain);
};
// reversed swell into a hit
const swell = (tEnd, len = 1.4) => add(tEnd - len, len, (t, p) => rnd() * p * p * p * 0.35 + Math.sin(2 * Math.PI * (200 + p * 900) * t) * p * p * 0.06);

for (const t of HITS.braam) { swell(t, 1.2); braam(t); }

// ticking clock build (23 → 33.2), accelerating, with toms every bar
let t = HITS.build, gap = 0.5;
while (t < 33.2) {
  add(t, 0.04, (x, p) => (Math.sin(2 * Math.PI * 2400 * x) * 0.5 + rnd() * 0.5) * Math.exp(-p * 9) * 0.22, Math.sin(t * 3) * 0.6);
  t += gap; gap = Math.max(0.12, gap * 0.96);
}
const tom = (t0, f = 130, g = 0.7) => add(t0, 0.6, (x) => Math.sin(2 * Math.PI * (f * Math.exp(-x * 4) + 45) * x) * Math.exp(-x * 5) * g);
for (let b = 0; b < 40; b++) {
  const tt = 23 + b * 0.25;
  if (tt >= 33.2) break;
  const pat = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1];
  if (tt > 27 && pat[b % 16]) tom(tt, 120 + (b % 3) * 20, 0.55 + (tt - 27) / 14);
}
// cut hits in the build
for (const h of [23.0, 25.0, 27.0, 28.5, 30.0, 31.0, 32.0]) impact(h, 0.45);
// riser 29.8 → 33.2 then silence until the title
add(HITS.riser[0], HITS.riser[1] - HITS.riser[0], (x, p) => rnd() * p * p * 0.35 + Math.sin(2 * Math.PI * (120 + p * p * 1500) * x) * p * 0.12);

// title impact + big braam
impact(HITS.title, 1.3); braam(HITS.title, 1.2);
// pad under the title (D minor add9), soft and wide
for (const [f, pan] of [[146.83, -0.6], [174.61, 0.6], [220, -0.3], [329.63, 0.3], [293.66, 0]]) {
  let lp = 0;
  add(HITS.title + 0.3, 46 - HITS.title - 0.3, (x) => {
    const env = Math.min(1, x / 3) * Math.min(1, (46 - HITS.title - 0.3 - x) / 3);
    lp += 0.03 * (saw(f * x) + saw(f * 1.006 * x) - lp);
    return lp * env * 0.12;
  }, pan);
}
// high shimmer arpeggio on the title section
const arp = [587.33, 698.46, 880, 1174.66];
for (let k = 0; k < 24; k++) {
  const tt = 36 + k * 0.25;
  add(tt, 0.6, (x) => Math.sin(2 * Math.PI * arp[k % 4] * x) * Math.exp(-x * 5) * 0.05 * Math.min(1, k / 6), (k % 2 ? 0.5 : -0.5));
}
impact(HITS.end, 0.9);

// simple stereo reverb (feedback combs), then normalise
const rev = (buf, taps) => {
  const out = new Float32Array(N);
  for (const [d, g] of taps) { const D = Math.floor(d * SR); for (let i = D; i < N; i++) out[i] += (buf[i - D] + out[i - D] * 0.0) * g; }
  return out;
};
const rl = rev(L, [[0.031, 0.32], [0.067, 0.25], [0.113, 0.2], [0.171, 0.15], [0.29, 0.1]]);
const rr = rev(R, [[0.037, 0.32], [0.071, 0.25], [0.127, 0.2], [0.183, 0.15], [0.31, 0.1]]);
for (let i = 0; i < N; i++) { L[i] += rl[i]; R[i] += rr[i]; }
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
}
writeFileSync(join(OUT, "score.wav"), buf);
console.log("score.wav written");
