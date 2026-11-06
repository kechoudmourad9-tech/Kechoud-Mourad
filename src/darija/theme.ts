// Theme for the darija edit — house style of the capcut-talking-head-edit skill:
// warm near-black, dark cards with hairline borders, small letter-spaced labels, coral accent.
import { theme as base } from "../theme";

export const FPS = 30;
export const OUTRO = 75; // frames held after the last word (ring-out + CTA)

export const house = {
  colors: {
    bg: "#0E0B0A",
    card: "#262321",
    cardEdge: "rgba(255,255,255,0.10)",
    text: "#F2EDE8",
    sub: "#A39B94",
    dim: "#6E6762",
    line: "#3A3431",
    coral: "#E8825F", // the one accent
    green: "#4CC38A",
    greenBg: "#1E3328",
  },
  fonts: { title: "Lalezar", body: "Cairo" },
  ease: base.ease,
  spring: base.spring,
} as const;
