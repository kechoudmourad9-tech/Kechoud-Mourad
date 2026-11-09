// "Comprendre la base des maths" — explainer reel built with the Holoul/Khaam explainer system (lib/kit.js):
// paper world + one red accent, persistent HUD (section label + progress pips), editorial word-timed top caption,
// a literal visual for every spoken phrase, halftone chapter wipes, comment-keyword end card. LTR (French).
import { loadFirstFont } from '../lib/arabic.js';
import * as K from '../lib/kit.js';
import { CH, E, END } from '../cues.js';

const INK = '#141414', RED = '#E8322B', PAPER = '#F2EFE8', SKY = '#DCE6FF', BLUE = '#2F5BFF', YELLOW = '#FFD43B', GREEN = '#1F9D6B';
let paper, beats;

export async function init() {
  const F = '/assets/fonts/';
  await loadFirstFont('Alexandria', [F + 'alexandria-latin-600-normal.woff2'], { weight: '600' });
  await loadFirstFont('Alexandria', [F + 'alexandria-latin-800-normal.woff2'], { weight: '800' });
  await loadFirstFont('JetBrains Mono', [F + 'jetbrains-mono-latin-500-normal.woff2'], { weight: '500' });
  await loadFirstFont('JetBrains Mono', [F + 'jetbrains-mono-latin-700-normal.woff2'], { weight: '700' });
  await loadFirstFont('Instrument Serif', [F + 'instrument-serif-latin-400-italic.woff2'], { weight: '400', style: 'italic' });
  await loadFirstFont('Anton', [F + 'anton.woff2'], { weight: '400' });
  // Latin roles for this reel: clean sans captions, serif-italic keywords, condensed stamps, mono HUD.
  Object.assign(K.FONTS, { text: 'Alexandria', accent: 'Instrument Serif', heavy: 'Anton', mono: 'JetBrains Mono', arUi: 'Alexandria' });
  beats = await (await fetch(new URL('../beats.json', import.meta.url))).json();
  paper = K.paperTile(11);
}

/* ---------- small code-drawn devices (circles + rounded rects, per the kit's asset rules) ---------- */
function figure(ctx, x, feet, { color = INK, label = '', s = 1, alpha = 1, armUp = 0, jump = 0 } = {}) {
  K.around(ctx, x, feet - 150, { s, alpha }, () => {
    const y = feet - jump;
    ctx.fillStyle = color;
    K.rr(ctx, x - 58, y - 230, 116, 200, 58); ctx.fill();                          // body
    ctx.beginPath(); ctx.arc(x, y - 290, 58, 0, Math.PI * 2); ctx.fill();          // head
    ctx.strokeStyle = color; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 50, y - 190); ctx.lineTo(x + 100 + 20 * armUp, y - 120 - 140 * armUp); ctx.stroke();  // right arm
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 18, y - 296, 7, 0, 7); ctx.arc(x + 18, y - 296, 7, 0, 7); ctx.fill();
    if (label) K.chip(ctx, label, { x, y: y - 395, size: 34, bg: INK, fg: '#fff' });
  });
}
function apple(ctx, x, y, r = 48, { half = 0, split = 0 } = {}) {
  const leaf = () => { ctx.fillStyle = GREEN; ctx.beginPath(); ctx.ellipse(x + r * 0.35, y - r * 1.05, r * 0.32, r * 0.16, -0.5, 0, 7); ctx.fill(); };
  if (!half) {
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x - r * 0.28, y, r * 0.78, 0, 7); ctx.arc(x + r * 0.28, y, r * 0.78, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - r * 0.7); ctx.lineTo(x + 4, y - r * 1.15); ctx.stroke(); leaf(); return;
  }
  for (const side of [-1, 1]) {
    const cx = x + side * split;
    ctx.save(); ctx.beginPath(); ctx.rect(side < 0 ? cx - r * 1.2 : cx, y - r * 1.2, r * 1.2, r * 2.4); ctx.clip();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx, y, r * 0.95, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFF4DA'; ctx.beginPath(); ctx.arc(cx, y, r * 0.8, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(cx + side * r * 0.22, y, 5, 9, 0, 0, 7); ctx.fill();
  }
}
function basket(ctx, x, y, w = 220, { s = 1, alpha = 1 } = {}) {
  K.around(ctx, x, y, { s, alpha }, () => {
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y - 20, w * 0.33, Math.PI, 0); ctx.stroke();
    K.withShadow(ctx, () => { ctx.fillStyle = '#C98B4E'; ctx.beginPath(); ctx.moveTo(x - w / 2, y - 20); ctx.lineTo(x + w / 2, y - 20); ctx.lineTo(x + w * 0.4, y + 90); ctx.lineTo(x - w * 0.4, y + 90); ctx.closePath(); ctx.fill(); }, { blur: 20, y: 8 });
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 4; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 10, y - 20 + i * 27); ctx.lineTo(x + w / 2 - 10, y - 20 + i * 27); ctx.stroke(); }
  });
}
function arrowDraw(ctx, x1, y1, x2, y2, p, { bend = -180, color = RED, lw = 14 } = {}) {
  if (p <= 0) return;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + bend, n = 60, end = Math.floor(n * p);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath();
  let px = x1, py = y1;
  for (let i = 0; i <= end; i++) { const u = i / n; px = (1 - u) ** 2 * x1 + 2 * (1 - u) * u * mx + u * u * x2; py = (1 - u) ** 2 * y1 + 2 * (1 - u) * u * my + u * u * y2; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  if (p > 0.95) { const a = Math.atan2(y2 - my, x2 - mx); ctx.beginPath(); ctx.moveTo(x2 - 44 * Math.cos(a - 0.5), y2 - 44 * Math.sin(a - 0.5)); ctx.lineTo(x2, y2); ctx.lineTo(x2 - 44 * Math.cos(a + 0.5), y2 - 44 * Math.sin(a + 0.5)); ctx.stroke(); }
  ctx.restore();
}
const bigText = (ctx, text, x, y, { size = 90, color = INK, family = K.FONTS.text, weight = 800, align = 'center', alpha = 1 } = {}) => {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.font = K.font(weight, size, family); ctx.direction = 'ltr'; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); ctx.restore();
};

/* ---------- HUD + caption ---------- */
const LABELS = ['// 01 · l\'idée', '// 02 · l\'histoire', '// 03 · l\'application', '// 04 · les ensembles', '// 05 · la fonction', '// commente'];
function hud(ctx, t, W, chapter) {
  K.sectionLabel(ctx, LABELS[chapter], { x: 72, y: 170, rtl: false, style: chapter === 5 ? 'tape' : 'mono', size: 28, tape: RED });
  if (chapter < 5) K.progressPips(ctx, { x: W - 72, y: 170, total: 5, done: chapter, active: chapter, rtl: true, accent: RED, label: `${chapter + 1}/5` });
}
function caption(ctx, t, W) {
  const cl = beats.clauses.find((c, i) => t >= c[0].s - 0.05 && t < (beats.clauses[i + 1]?.[0].s ?? c.at(-1).e + 0.6));
  if (!cl) return;
  K.captionBlock(ctx, cl.map((w) => ({ w: w.w, s: w.s, key: w.key })), t,
    { x: 90, y: 330, maxWidth: W - 180, size: 58, rtl: false, keyColor: RED, family: K.FONTS.text, keyFamily: K.FONTS.accent, weight: 600, keyWeight: 400 });
}

/* ---------- chapters ---------- */
function ch1(ctx, t, W, H) {
  K.drawPaper(ctx, W, H, paper, PAPER);
  ['∑', 'π', '∫'].forEach((sym, i) => {
    const e = K.enter(t, E.cards[i], { rise: 90 });
    if (t < E.cards[i]) return;
    K.card(ctx, 230 + i * 220, 600 + e.dy, 180, 220, { r: 26, s: e.s, alpha: e.alpha, rot: (i - 1) * 4, fill: ['#fff', '#FFF6D8', '#fff'][i] }, (x, y, w, h) => bigText(ctx, sym, x + w / 2, y + h / 2 + 6, { size: 120, family: 'serif', weight: 700 }));
  });
  if (t >= E.base) {
    const e = K.enter(t, E.base, { rise: 40 });
    K.card(ctx, 180, 860 + e.dy, 720, 150, { r: 22, fill: INK, s: e.s, alpha: e.alpha }, (x, y, w, h) => bigText(ctx, 'LA BASE', x + w / 2, y + h / 2 + 4, { size: 96, color: '#fff', family: K.FONTS.heavy, weight: 400 }));
    K.burst(ctx, 540, 935, t, { start: E.base + 0.05, r: 380, n: 12, color: RED });
  }
  if (t >= E.personA) figure(ctx, 340, 1430, { label: 'A', s: K.enter(t, E.personA).s, alpha: K.enter(t, E.personA).alpha });
  if (t >= E.personB) figure(ctx, 740, 1430, { label: 'B', color: BLUE, s: K.enter(t, E.personB).s, alpha: K.enter(t, E.personB).alpha });
}

function ch2(ctx, t, W, H) {
  K.drawPaper(ctx, W, H, paper, PAPER);
  const Ax = 270, Bx = 810, feet = 1400;
  const raise = K.ease.inOutCubic(K.seg(t, E.lift, 0.5)) * (1 - K.ease.inOutCubic(K.seg(t, E.give + 0.3, 0.5)));
  figure(ctx, Ax, feet, { label: 'A', armUp: raise });
  figure(ctx, Bx, feet, { label: 'B', color: BLUE, jump: t > E.land && t < E.land + 0.6 ? Math.sin((t - E.land) / 0.6 * Math.PI) * 60 : 0, armUp: t > E.land && t < E.land + 1.6 ? 1 : 0 });
  if (t >= E.basketA) basket(ctx, Ax, 1440, 200, { s: K.enter(t, E.basketA).s, alpha: K.enter(t, E.basketA).alpha });
  if (t >= E.basketB) basket(ctx, Bx, 1440, 200, { s: K.enter(t, E.basketB).s, alpha: K.enter(t, E.basketB).alpha });
  K.stamp(ctx, 'VIDE', t, { x: Bx, y: 880, start: E.vide, size: 70, color: RED, rot: -10 });
  // apple in A's hand, then cut, then thrown to B's basket
  const handX = Ax + 110, handY = 1180 - 150 * raise;
  if (t >= E.apple && t < E.cut) { const e = K.enter(t, E.apple); K.around(ctx, handX, handY, { s: e.s, alpha: e.alpha }, () => apple(ctx, handX, handY, 52)); }
  if (t >= E.cut) {
    const fly = K.ease.inOutCubic(K.seg(t, E.give, 0.8));
    const split = 14 + 16 * K.ease.outBack(K.seg(t, E.cut, 0.3));
    const tx = Bx + 10, ty = 1395;
    const x = handX + (tx - handX) * fly, y = handY + (ty - handY) * fly - Math.sin(Math.PI * fly) * 360;
    apple(ctx, x, y, 52 * (1 - fly * 0.15), { half: 1, split: split * (1 - fly * 0.5) });
    if (t < E.cut + 0.3) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round'; const p = K.seg(t, E.cut, 0.2);
      ctx.beginPath(); ctx.moveTo(handX - 30, handY - 90); ctx.lineTo(handX - 30 + 60 * p, handY - 90 + 180 * p); ctx.stroke(); ctx.restore(); }
    K.burst(ctx, handX, handY, t, { start: E.cut, r: 70, n: 8, color: RED, len: 26 });
  }
  // the plan, as a thought card
  if (t >= E.thought && t < E.lift) {
    const e = K.enter(t, E.thought, { rise: 50 }), out = 1 - K.seg(t, E.lift - 0.3, 0.3);
    K.card(ctx, 140, 560 + e.dy, 800, 240, { r: 120, s: e.s, alpha: e.alpha * out, stroke: INK, lw: 4 }, (x, y, w, h) => {
      apple(ctx, x + 150, y + h / 2 + 8, 46);
      bigText(ctx, '÷ 2', x + 300, y + h / 2, { size: 64, color: RED, family: K.FONTS.mono, weight: 700 });
      apple(ctx, x + 470, y + h / 2 + 8, 46, { half: 1, split: 18 });
      bigText(ctx, '→ B', x + 650, y + h / 2, { size: 64, family: K.FONTS.mono, weight: 700 });
    });
  }
  if (t >= E.halves) {
    K.circleMark(ctx, Bx - 150, 1290, 300, 240, { p: K.seg(t, E.halves, 0.45), color: YELLOW });
    K.chip(ctx, '½ + ½', { x: Bx, y: 640, size: 40, bg: YELLOW, s: K.enter(t, E.halves).s, alpha: K.enter(t, E.halves).alpha });
  }
}

function ch3(ctx, t, W, H) {
  K.drawPaper(ctx, W, H, paper, PAPER);
  const Ay = 980;
  K.card(ctx, 110, Ay - 110, 220, 220, { r: 110, fill: INK }, (x, y, w, h) => bigText(ctx, 'A', x + w / 2, y + h / 2 + 6, { size: 120, color: '#fff', family: K.FONTS.heavy, weight: 400 }));
  K.card(ctx, 750, Ay - 110, 220, 220, { r: 110, fill: BLUE }, (x, y, w, h) => bigText(ctx, 'B', x + w / 2, y + h / 2 + 6, { size: 120, color: '#fff', family: K.FONTS.heavy, weight: 400 }));
  arrowDraw(ctx, 340, Ay - 40, 740, Ay - 40, K.ease.outCubic(K.seg(t, E.arrow, 0.8)), { bend: -230 });
  K.stamp(ctx, 'APPLICATION', t, { x: 540, y: 640, start: E.appStamp, size: 92, color: RED, rot: -6 });
  K.burst(ctx, 540, 640, t, { start: E.appStamp + 0.08, r: 260, n: 12, color: INK });
  if (t >= E.check1 - 0.4) {
    const e = K.enter(t, E.check1 - 0.4, { rise: 50 });
    K.card(ctx, 140, 1140 + e.dy, 800, 230, { r: 26, fill: '#fff', s: e.s, alpha: e.alpha }, (x, y, w) => K.checklist(ctx,
      [{ title: '1. couper la pomme' }, { title: '2. la donner à B' }], t, { x: x + 30, y: y + 20, w: w - 60, rowH: 95, size: 40, start: E.check1, step: 2.0 - 0.0, dark: false, accent: RED, rtl: false }));
  }
  if (t >= E.eqChip) K.chip(ctx, '= une application', { x: 540, y: 1460, size: 40, bg: INK, fg: '#fff', s: K.enter(t, E.eqChip).s, alpha: K.enter(t, E.eqChip).alpha });
}

function ch4(ctx, t, W, H) {
  ctx.fillStyle = SKY; ctx.fillRect(0, 0, W, H);
  K.dotGrid(ctx, W, H, { gap: 40, r: 2.4, color: 'rgba(47,91,255,.22)' });
  // the set-theory "terminal", until the two sets take over
  if (t < E.depart) {
    const e = K.enter(t, E.window, { rise: 60 }), out = 1 - K.seg(t, E.depart - 0.35, 0.3);
    K.appWindow(ctx, 110, 560 + e.dy, W - 220, 600, { title: 'théorie des ensembles', s: e.s, alpha: e.alpha * out, rot: -1,
      body: (bx, by, bw) => K.typeLines(ctx, [
        { text: '> E = { 1, -2, π }', color: '#FF8A5B' }, 'x ∈ E', 'E ∪ F    E ∩ F', { text: '# les maths reposent dessus', color: YELLOW },
      ], t, { x: bx + 40, y: by + 90, w: bw - 80, size: 44, start: E.typeStart, cps: 16, gapAfter: 0.5 }) });
    return;
  }
  const set = (y, title, color, start, els, elTimes, chips, chipTimes, titleY = 52) => {
    const e = K.enter(t, start, { rise: 60 });
    K.card(ctx, 110, y + e.dy, W - 220, 330, { r: 40, fill: '#fff', stroke: color, lw: 6, s: e.s, alpha: e.alpha }, (x, yy, w) => {
      bigText(ctx, title, x + 40, yy + titleY, { size: 40, align: 'left', color, family: K.FONTS.mono, weight: 700 });
      els.forEach((el, i) => { if (t < elTimes[i]) return; const ee = K.enter(t, elTimes[i]);
        K.around(ctx, x + 260 + i * 160, yy + 190, { s: ee.s, alpha: ee.alpha }, () => { ctx.beginPath(); ctx.arc(x + 260 + i * 160, yy + 190, 54, 0, 7); ctx.fillStyle = color; ctx.fill(); bigText(ctx, el, x + 260 + i * 160, yy + 192, { size: 50, color: '#fff', family: 'serif', weight: 700 }); }); });
      chips.forEach((c, i) => { if (t < chipTimes[i]) return; K.chip(ctx, c, { x: x + w - 90, y: yy + 130 + i * 110, size: 44, bg: YELLOW, s: K.enter(t, chipTimes[i]).s, alpha: K.enter(t, chipTimes[i]).alpha }); });
    });
  };
  set(540, 'ensemble de départ', BLUE, E.depart, ['1', '−2', 'π'], E.depEls, ['ℝ', 'ℤ'], [E.chipR, E.chipZ]);
  if (t >= E.arrivee) set(1080, 'ensemble d\'arrivée', RED, E.arrivee, ['0', '7', '√2'], E.arrEls, ['ℕ', 'ℝ'], [E.chipN, E.chipR2], 290);
  E.arrows.forEach((a, i) => { if (t < a) return; const p = K.ease.outCubic(K.seg(t, a, 0.5)), x1 = 370 + i * 160, x2 = 370 + ((i + 1) % 3) * 160;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, 790); ctx.lineTo(x1 + (x2 - x1) * p, 790 + (1210 - 790) * p); ctx.stroke(); ctx.restore(); });
}

function ch5(ctx, t, W, H) {
  K.drawPaper(ctx, W, H, paper, PAPER);
  const e = K.enter(t, E.fWindow, { rise: 60 });
  K.appWindow(ctx, 110, 540 + e.dy, W - 220, 420, { title: 'fonction', s: e.s, alpha: e.alpha, rot: 1,
    body: (bx, by, bw) => K.typeLines(ctx, [{ text: 'f : E → F', color: '#FF8A5B' }, 'x  ↦  f(x)', { text: 'f(x) = x / 2', color: YELLOW }], t,
      { x: bx + 50, y: by + 100, w: bw - 100, size: 60, start: E.fType, cps: 9, gapAfter: 1.6 }) });
  if (t >= E.example) {
    const c = K.enter(t, E.example, { rise: 50 });
    K.card(ctx, 140, 1060 + c.dy, 800, 300, { r: 30, fill: '#fff', s: c.s, alpha: c.alpha, rot: -1.5 }, (x, y, w, h) => {
      apple(ctx, x + 170, y + h / 2 + 10, 70);
      bigText(ctx, 'f', x + 400, y + h / 2 - 40, { size: 60, color: RED, family: K.FONTS.accent, weight: 400 });
      arrowDraw(ctx, x + 300, y + h / 2 + 10, x + 500, y + h / 2 + 10, K.seg(t, E.example + 0.3, 0.5), { bend: -20, lw: 10 });
      if (t >= E.halvesEx) apple(ctx, x + 640, y + h / 2 + 10, 70, { half: 1, split: 22 * K.ease.outBack(K.seg(t, E.halvesEx, 0.4)) });
    });
  }
  K.stamp(ctx, 'f(x)', t, { x: 800, y: 1460, start: E.fStamp, size: 90, color: RED, rot: -8 });
}

function cta(ctx, t, W, H) {
  K.drawPaper(ctx, W, H, paper, PAPER);
  const lt = t - E.cta;
  bigText(ctx, 'Commente', 540, 560, { size: 96, family: K.FONTS.text, weight: 800, alpha: K.enter(t, E.cta).alpha });
  K.stamp(ctx, 'MATHS', t, { x: 540, y: 720, start: E.cta + 0.15, size: 130, color: RED, rot: -5 });
  // comment field typing the keyword (LTR), then it posts and a DM arrives
  const fy = 1000, fw = 840, fx = 120, h = 100;
  const fe = K.enter(t, E.cta + 0.3, { rise: 40 });
  K.around(ctx, fx + fw / 2, fy + h / 2, { s: fe.s, alpha: fe.alpha }, () => {
    K.withShadow(ctx, () => { K.rr(ctx, fx, fy, fw, h, h / 2); ctx.fillStyle = '#fff'; ctx.fill(); }, { blur: 24, y: 10 });
    const typing = K.seg(lt, 0.4, 0.6), sent = lt >= 1.2;
    const txt = sent ? 'Ajoute un commentaire…' : typing > 0 ? 'MATHS'.slice(0, Math.ceil(5 * typing)) : 'Ajoute un commentaire…';
    bigText(ctx, txt, fx + 50, fy + h / 2 + 2, { size: sent || typing <= 0 ? 34 : 46, align: 'left', color: sent || typing <= 0 ? 'rgba(0,0,0,.4)' : INK, weight: sent || typing <= 0 ? 600 : 800 });
    ctx.beginPath(); ctx.arc(fx + fw - 60, fy + h / 2, 34, 0, 7); ctx.fillStyle = RED; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx + fw - 60, fy + h / 2 + 14); ctx.lineTo(fx + fw - 60, fy + h / 2 - 14); ctx.moveTo(fx + fw - 72, fy + h / 2 - 2); ctx.lineTo(fx + fw - 60, fy + h / 2 - 14); ctx.lineTo(fx + fw - 48, fy + h / 2 - 2); ctx.stroke();
  });
  if (lt >= 1.2) { const p = K.enter(t, E.cta + 1.2, { rise: 30 });
    ctx.save(); ctx.globalAlpha *= p.alpha; ctx.beginPath(); ctx.arc(fx + 40, fy - 90 + p.dy, 32, 0, 7); ctx.fillStyle = '#C9C4B8'; ctx.fill();
    bigText(ctx, 'MATHS', fx + 90, fy - 88 + p.dy, { size: 50, align: 'left' }); ctx.restore(); }
  if (lt >= 1.7) { const d = K.enter(t, E.cta + 1.7, { from: 0.9, rise: -60 });
    K.card(ctx, fx, 1180 + d.dy, fw, 190, { r: 30, s: d.s, alpha: d.alpha }, (x, y, w) => {
      ctx.beginPath(); ctx.arc(x + 80, y + 95, 42, 0, 7); ctx.fillStyle = RED; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; K.rr(ctx, x + 56, y + 78, 48, 34, 5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 56, y + 80); ctx.lineTo(x + 80, y + 98); ctx.lineTo(x + 104, y + 80); ctx.stroke();
      bigText(ctx, 'Nouveau message', x + 150, y + 75, { size: 38, align: 'left' });
      bigText(ctx, 'La partie 2 arrive bientôt', x + 150, y + 128, { size: 30, align: 'left', color: 'rgba(0,0,0,.5)', weight: 600 });
    }); }
}

export function draw(ctx, t, { W, H }) {
  const chapter = CH.findLastIndex((c) => t >= c);
  [ch1, ch2, ch3, ch4, ch5, cta][chapter](ctx, t, W, H);
  hud(ctx, t, W, chapter);
  if (chapter < 5) caption(ctx, t, W);
  else K.captionBlock(ctx, [{ w: 'Commente', s: E.cta }, { w: 'MATHS', s: E.cta + 0.2, key: true }, { w: 'pour', s: E.cta + 0.4 }, { w: 'la', s: E.cta + 0.5 }, { w: 'suite', s: E.cta + 0.6 }], t,
    { x: 90, y: 330, maxWidth: W - 180, size: 58, rtl: false, keyColor: RED, family: K.FONTS.text, keyFamily: K.FONTS.accent, weight: 600, keyWeight: 400 });
  const origins = [[W * 0.8, H * 0.3], [W * 0.2, H * 0.6], [W * 0.5, H * 0.2], [W * 0.8, H * 0.7], [W * 0.5, H * 0.5]];
  CH.slice(1).forEach((c, i) => K.halftoneWipe(ctx, W, H, K.seg(t, c - 0.4, 0.8), { origin: origins[i], color: i === 2 ? BLUE : INK }));
  if (t > END - 0.4) { ctx.fillStyle = `rgba(242,239,232,${K.seg(t, END - 0.4, 0.4)})`; ctx.fillRect(0, 0, W, H); }
}
