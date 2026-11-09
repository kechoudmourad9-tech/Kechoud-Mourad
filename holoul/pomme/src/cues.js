// Single source of event timing (seconds) for picture AND sound (Khaam/Holoul rule: retime here, both move).
// Word timings live in beats.json (voice-over transcription); these are the visual events placed on those words.
export const CH = [0, 5.5, 24.7, 33.4, 55.6, 65.5];      // chapter starts (last = CTA)
export const END = 70.5;
export const E = {
  cards: [0.3, 0.55, 0.8], base: 1.45, personA: 4.3, personB: 5.1,
  apple: 7.8, basketA: 8.6, basketB: 11.5, vide: 11.95,
  thought: 13.1, lift: 17.6, cut: 18.4, give: 20.2, land: 21.0, halves: 23.4,
  arrow: 24.95, appStamp: 26.45, check1: 28.4, check2: 30.4, eqChip: 32.45,
  window: 34.9, typeStart: 35.3,
  depart: 44.3, depEls: [45.9, 46.15, 46.4], chipR: 47.8, chipZ: 48.4,
  arrows: [52.05, 52.3, 52.55], arrivee: 51.7, arrEls: [52.8, 53.05, 53.3], chipN: 53.9, chipR2: 54.5,
  fWindow: 56.0, fType: 56.3, xmap: 58.0, fx: 60.9, example: 61.75, halvesEx: 63.3, fStamp: 63.6,
  cta: 65.6,
};
// typing windows (start, duration) used for key-click ticks
export const TYPING = [[35.3, 6.0], [56.3, 1.4], [58.0, 1.2], [60.9, 0.8], [66.0, 0.6]];

export function soundCues() {
  const c = [];
  const add = (t, src, v) => c.push({ t, src, v });
  CH.slice(1).forEach((t) => add(t - 0.12, 'whoosh', 0.45));
  [...E.cards, E.personA, E.personB, E.apple, E.basketA, E.basketB, E.thought, E.give, E.give + 0.13, E.arrow, E.eqChip, E.window, E.depart,
    ...E.depEls, E.chipR, E.chipZ, E.arrivee, ...E.arrEls, E.chipN, E.chipR2, E.fWindow, E.example, E.halvesEx, E.cta, E.cta + 1.2].forEach((t) => add(t, 'pop', 0.32));
  [E.base, E.vide, E.appStamp, E.fStamp].forEach((t) => add(t, 'bass', 0.42));
  add(E.cut, 'swipe', 0.5);
  [E.land, E.halves].forEach((t) => add(t, 'check', 0.4));
  [E.check1 + 0.7, E.check2 + 0.7].forEach((t) => add(t, 'check', 0.45));
  E.arrows.forEach((t) => add(t, 'swipe', 0.22));
  TYPING.forEach(([s, d]) => { for (let t = s; t < s + d; t += 0.11) add(t, 'tick', 0.12); });
  add(E.cta + 1.7, 'ding', 0.45);
  return c.sort((a, b) => a.t - b.t);
}
