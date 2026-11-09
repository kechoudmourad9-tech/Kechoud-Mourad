// Mix: voice-over + SFX placed from the same cue data as the picture (src/cues.js), then -14 LUFS.
import { spawnSync } from 'node:child_process';
import { soundCues, END } from './src/cues.js';
const cues = soundCues();
const inputs = ['-i', 'assets/voice.wav'], filt = [];
cues.forEach((c, i) => { inputs.push('-i', `assets/sfx/${c.src}.wav`); filt.push(`[${i + 1}]volume=${c.v},adelay=${Math.round(c.t * 1000)}:all=1[c${i}]`); });
filt.push(`[0]volume=1.0[v];[v]${cues.map((_, i) => `[c${i}]`).join('')}amix=inputs=${cues.length + 1}:normalize=0:duration=longest,apad=whole_dur=${END},atrim=0:${END},loudnorm=I=-14:TP=-1.5:LRA=9[o]`);
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filt.join(';'), '-map', '[o]', '-ar', '48000', '-ac', '2', 'renders/mix.wav'], { stdio: 'inherit' });
console.log(r.status === 0 ? `mix.wav ok (${cues.length} cues)` : 'mix failed');
