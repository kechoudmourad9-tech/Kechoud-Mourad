// Synthesizes an original 25s upbeat bed at 120 BPM (fpb = 0.5s) for the montage.
// Adapted from haidrrrry/claude-remotion-skill (MIT). Hits line up with Edit.tsx scenes.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const DUR = 25;
const N = SR * DUR;
const out = new Float32Array(N);
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
mkdirSync(OUT, { recursive: true });

const add = (start, dur, fn) => {
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n && s0 + i < N; i++) out[s0 + i] += fn(i / SR, i / n);
};
// deterministic noise
let seed = 1;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647 - 0.5;
};

const kick = (t) =>
  add(t, 0.28, (ts, p) => {
    const f = 140 - 95 * Math.min(1, ts * 9);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 7) * 0.85;
  });
const hat = (t) =>
  add(t, 0.045, (ts, p) => rnd() * 2 * Math.exp(-p * 10) * 0.1);
const bass = (t, f, dur = 0.21) =>
  add(t, dur, (ts, p) => {
    const env = Math.min(1, ts * 90) * Math.exp(-p * 4);
    return (
      (Math.sin(2 * Math.PI * f * ts) + Math.sin(2 * Math.PI * f * 3 * ts) / 3.5) *
      env *
      0.3
    );
  });
const impact = (t) => {
  add(t, 0.9, (ts, p) => {
    const f = 60 - 25 * Math.min(1, ts * 3);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 4.5) * 0.9;
  });
  add(t, 0.35, (ts, p) => rnd() * 2 * Math.exp(-p * 6) * 0.35);
};

// pad: bright major chord (C - G - A min - F), 2 bars each, ducked low under the voice
const chords = [[130.81, 164.81, 196], [98, 123.47, 146.83], [110, 130.81, 164.81], [87.31, 110, 130.81]];
add(0, DUR, (ts) => {
  const c = chords[Math.floor(ts / 4) % 4];
  const attack = Math.min(1, ts / 1.5), release = Math.min(1, (DUR - ts) / 1.5);
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(Math.PI * ts * 4)); // 8th-note sidechain feel
  return c.reduce((a, f) => a + Math.sin(2 * Math.PI * f * ts) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * ts), 0) * 0.03 * attack * release * pulse;
});
const FPB = 0.5;
// four-on-the-floor 1s..20.5s, drops out 9s..9.5s (pre-payoff gap), finale 21s..24s
for (let b = 2; b < 48; b++) { const t = b * FPB; if (t >= 9 && t < 9.5) continue; if (t >= 20.5 && t < 21) continue; kick(t); }
for (let b = 2; b < 48; b++) { hat(b * FPB + 0.25); if (b >= 19) hat(b * FPB + 0.125); }
const roots = [65.41, 49, 55, 43.65];
for (let e = 8; e < 192; e++) { const t = e * 0.125; if ((t >= 9 && t < 9.5) || t >= 24) continue; bass(t, roots[Math.floor(t / 4) % 4] * (e % 4 === 2 ? 2 : 1), 0.11); }
// risers into the payoff (9.3s) and the CTA (20.8s)
add(7.6, 1.7, (ts, p) => rnd() * 2 * p * p * 0.45);
add(19.4, 1.4, (ts, p) => rnd() * 2 * p * p * 0.4);
impact(9.3);
impact(20.8);

// normalize
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
const g = 0.9 / peak;
const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 2, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++)
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i] * g)) * 32767), 44 + i * 2);
writeFileSync(join(OUT, "track.wav"), buf);
console.log("track.wav written, peak", peak.toFixed(2));
