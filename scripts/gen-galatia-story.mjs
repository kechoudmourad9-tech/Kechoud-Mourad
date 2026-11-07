// Original score for the GALATIA story trailer (86.5 s). Cue times match src/galatia/GalatiaStory.tsx (T).
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const SR = 44100, DUR = 87, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const saw = (p) => 2 * (p - Math.floor(p + 0.5));
const add = (t0, dur, fn, pan = 0) => {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR), gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && s0 + i < N; i++) { const v = fn(i / SR, i / n); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
};
const pad = (t0, t1, notes, amp, cutoff = 0.02, att = 2, rel = 2) => notes.forEach((f, k) => {
  let lp = 0; add(t0, t1 - t0, (t) => { const e = Math.min(1, t / att) * Math.min(1, (t1 - t0 - t) / rel);
    lp += cutoff * (saw(f * t) + saw(f * 1.005 * t) - lp); return lp * e * amp; }, k % 2 ? 0.5 : -0.5); });
const drone = (t0, t1, amp, f = 36.71) => { let lp = 0; add(t0, t1 - t0, (t) => { const e = Math.min(1, t / 2) * Math.min(1, (t1 - t0 - t) / 1);
  lp += 0.012 * (saw(f * t) + saw(f * 1.004 * t) + Math.sin(2 * Math.PI * f * 1.5 * t) - lp); return lp * e * amp; }); };
const braam = (t0, g = 1) => { for (const s of [-0.4, 0.4]) { let lp = 0; add(t0, 3.4, (t) => { const e = Math.min(1, t * 25) * Math.exp(-t * 0.9);
  let x = 0; for (const f of [73.42, 110, 146.83, 174.61]) x += saw(f * (1 + s * 0.01) * t) + 0.5 * saw(f * 2.003 * t);
  lp += (0.02 + 0.25 * Math.exp(-t * 2.2)) * (x - lp); return lp * e * 0.2 * g; }, s); }
  add(t0, 2.5, (t) => Math.sin(2 * Math.PI * (48 - 14 * Math.min(1, t * 2)) * t) * Math.exp(-t * 1.6) * 0.9 * g); };
const impact = (t0, g = 1) => { add(t0, 0.5, (t, p) => rnd() * Math.exp(-p * 7) * 0.5 * g);
  add(t0, 2.2, (t) => Math.sin(2 * Math.PI * (90 * Math.exp(-t * 3) + 28) * t) * Math.exp(-t * 1.3) * g); };
const swell = (tEnd, len = 1.4, g = 1) => add(tEnd - len, len, (t, p) => (rnd() * p ** 3 * 0.35 + Math.sin(2 * Math.PI * (200 + p * 900) * t) * p * p * 0.06) * g);
const tom = (t0, g = 0.7, f = 120) => add(t0, 0.6, (x) => Math.sin(2 * Math.PI * (f * Math.exp(-x * 4) + 45) * x) * Math.exp(-x * 5) * g);
const ping = (t0, f, g = 0.05, pan = 0) => add(t0, 2.5, (x) => (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(2 * Math.PI * f * 2.01 * x)) * Math.exp(-x * 1.8) * g, pan);
const heart = (t0) => { tom(t0, 0.5, 70); tom(t0 + 0.28, 0.35, 65); };

// 0–15.5 eerie opening: drone, high pad, pings as stars vanish
drone(0, 15.6, 0.7);
pad(0.5, 15.5, [587.33, 880, 659.25], 0.035, 0.015, 3, 2);
[1.2, 2.3, 3.1, 4.0, 6.0, 8.2, 10.5, 12.6, 14.1].forEach((t, i) => ping(t, [1174.66, 987.77, 1318.5, 880][i % 4], 0.05, i % 2 ? 0.6 : -0.6));
impact(4.5, 0.35); impact(9.5, 0.4);
swell(15.5, 1.6); braam(15.5);
drone(15.5, 23.1, 0.8);
add(15.5, 5, (t) => rnd() * 0.03 * Math.min(1, t) * (0.6 + 0.4 * Math.sin(t * 13)));      // fire crackle
add(20.5, 2.4, (t) => Math.sin(2 * Math.PI * (1500 + 300 * Math.sin(t * 6)) * t) * Math.exp(-t * 1.5) * 0.05);  // rune shimmer
swell(23.0, 1.2); braam(23.0, 1.1);
drone(23, 31.9, 0.9); pad(23.3, 31.9, [146.83, 220, 293.66, 349.23], 0.06, 0.02, 2, 0.6);
// 31.9–41.35 montage: driving percussion, hit on every cut
const cuts = Array.from({ length: 7 }, (_, i) => 31.9 + i * 1.35);
cuts.forEach((t, i) => { impact(t, 0.45 + i * 0.05); });
for (let t = 31.9; t < 41.3; t += 0.3375) tom(t, 0.4 + (t - 31.9) / 25, 110);
pad(31.9, 41.35, [73.42, 110, 146.83, 220], 0.07, 0.03, 0.5, 0.2);
swell(41.35, 2.2, 1.2);
// 41.35–46 near silence: heartbeat only
heart(42.8); heart(44.2);
// 46–56.3 tension: dissonant high strings + low drone under the whispers
drone(45.8, 56.3, 0.55, 32.7);
pad(45.8, 56.2, [880, 932.33, 1318.5], 0.025, 0.02, 2.5, 0.3);
swell(56.3, 2.5, 1.4);
// 56.3 the music explodes: battle
braam(56.3, 1.4); impact(56.3, 1.3);
pad(56.3, 64.1, [73.42, 110, 146.83, 174.61, 220, 293.66], 0.08, 0.04, 0.2, 0.4);
for (let t = 56.3; t < 64.0; t += 0.1625) tom(t, ((Math.round((t - 56.3) / 0.1625) % 4) === 0 ? 0.9 : 0.45), 125);
Array.from({ length: 6 }, (_, i) => 56.3 + i * 1.3).forEach((t) => impact(t, 0.6));
// 64.1–72.3 palace: dark ostinato, mask falls, reveal
drone(64.1, 72.3, 0.8, 34.65);
for (let t = 64.1; t < 69.2; t += 0.5) add(t, 0.45, (x) => saw(69.3 * x) * Math.exp(-x * 6) * 0.18);
impact(67.6, 0.8); swell(69.2, 1.5); braam(69.2, 1.3);
pad(69.2, 72.3, [138.59, 146.83, 207.65], 0.07, 0.03, 0.1, 0.8);
// 72.3–78.2 silence for the last whisper, faint drone
drone(73.0, 78.2, 0.3, 32.7);
// 78.2 title
swell(78.2, 2.0, 1.1); impact(78.2, 1.3); braam(78.2, 1.1);
pad(78.4, 86.5, [146.83, 174.61, 220, 293.66, 329.63], 0.07, 0.025, 2, 2.5);
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((k) => ping(79.5 + k * 0.45, [587.33, 698.46, 880, 1174.66][k % 4], 0.035, k % 2 ? 0.5 : -0.5));
impact(85.0, 0.7);

// space + normalise
const rev = (b, taps) => { const o = new Float32Array(N); for (const [d, g] of taps) { const D = Math.floor(d * SR); for (let i = D; i < N; i++) o[i] += b[i - D] * g; } return o; };
const rl = rev(L, [[0.031, 0.3], [0.067, 0.24], [0.113, 0.2], [0.171, 0.15], [0.29, 0.1], [0.41, 0.07]]);
const rr = rev(R, [[0.037, 0.3], [0.071, 0.24], [0.127, 0.2], [0.183, 0.15], [0.31, 0.1], [0.43, 0.07]]);
for (let i = 0; i < N; i++) { L[i] += rl[i]; R[i] += rr[i]; }
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.89 / pk, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "public", "galatia", "story-score.wav"), buf);
console.log("story-score.wav written");
