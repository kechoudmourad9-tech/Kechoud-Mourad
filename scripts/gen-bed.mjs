// Calm 90 BPM bed + soft UI kit for the darija edit (house style of capcut-talking-head-edit:
// music ~15 dB under the voice, subtle swipe + ding on cards). Usage: node scripts/gen-bed.mjs 57
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
mkdirSync(OUT, { recursive: true });
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
const wav = (out) => {
  let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.9 / peak : 1, n = out.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i] * g)) * 32767), 44 + i * 2);
  return buf;
};
const mk = (dur) => new Float32Array(Math.floor(dur * SR));
const add = (out, start, dur, fn) => {
  const s0 = Math.floor(start * SR), n = Math.floor(dur * SR);
  for (let i = 0; i < n && s0 + i < out.length; i++) out[s0 + i] += fn(i / SR, i / n);
};

// ---- bed ----
const DUR = Number(process.argv[2] || 60);
const bed = mk(DUR);
const BEAT = 60 / 90;
// Am - F - C - G, one bar (4 beats) each, warm pad
const ch = [[110, 130.81, 164.81], [87.31, 110, 130.81], [130.81, 164.81, 196], [98, 123.47, 146.83]];
add(bed, 0, DUR, (t) => {
  const c = ch[Math.floor(t / (BEAT * 4)) % 4];
  const env = Math.min(1, t / 2) * Math.min(1, (DUR - t) / 2.5);
  return c.reduce((a, f) => a + Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 1.004 * t), 0) * 0.05 * env;
});
for (let t = BEAT * 4; t < DUR - 2.5; t += BEAT) {
  add(bed, t, 0.25, (ts, p) => Math.sin(2 * Math.PI * (110 - 70 * Math.min(1, ts * 10)) * ts) * Math.exp(-p * 6) * 0.5);
  add(bed, t + BEAT / 2, 0.04, (ts, p) => rnd() * Math.exp(-p * 9) * 0.12);
}
for (let e = 8 * 4; e * BEAT / 2 < DUR - 2.5; e++) {
  const t = (e * BEAT) / 2, f = ch[Math.floor(t / (BEAT * 4)) % 4][0] / 2;
  add(bed, t, BEAT / 2 - 0.02, (ts, p) => Math.sin(2 * Math.PI * f * ts) * Math.min(1, ts * 80) * Math.exp(-p * 3) * 0.22);
}
writeFileSync(join(OUT, "bed.wav"), wav(bed));

// ---- soft swipe ----
{ const o = mk(0.32); let lp = 0;
  add(o, 0, 0.32, (t, p) => { lp += (0.04 + 0.18 * Math.sin(Math.PI * p)) * (rnd() * 2 - lp); return lp * Math.sin(Math.PI * p) ** 2 * 0.7; });
  writeFileSync(join(OUT, "swipe.wav"), wav(o)); }
// ---- soft ding (two-partial bell) ----
{ const o = mk(0.9);
  add(o, 0, 0.9, (t, p) => (Math.sin(2 * Math.PI * 1318.5 * t) + 0.5 * Math.sin(2 * Math.PI * 1975.5 * t)) * Math.exp(-p * 6) * Math.min(1, t * 400) * 0.5);
  writeFileSync(join(OUT, "ding.wav"), wav(o)); }
// ---- check tick ----
{ const o = mk(0.09);
  add(o, 0, 0.09, (t, p) => Math.sin(2 * Math.PI * (1500 - 600 * p) * t) * Math.exp(-p * 8) * 0.6);
  writeFileSync(join(OUT, "check.wav"), wav(o)); }
console.log("bed.wav (" + DUR + "s), swipe.wav, ding.wav, check.wav written");
