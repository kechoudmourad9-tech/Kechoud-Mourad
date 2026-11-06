// theme.ts — single source of truth (from the remotion-motion-graphics skill template).
// NEVER inline colors, easings, or spring configs in components.
import { Easing } from "remotion";

// Source clip: 720x1280 (rotated iPhone .mov), 24.27s @ 30fps = 728 frames.
// Rendered 1.5x up to a 1080x1920 Reels master.
export const VIDEO = {
  fps: 30,
  durationInFrames: 728,
  width: 1080,
  height: 1920,
} as const;

export const theme = {
  colors: {
    bg: "#0B0B12",
    bgAlt: "#16161F",
    primary: "#FFD60A", // THE hero colour (yellow) — max one element per frame
    accent: "#FF3D7F", // pink
    paper: "#FFFFFF",
    ink: "#0B0B12",
    text: "#F7F7FA",
    textDim: "#B4B4C2",
    glow: "rgba(255, 214, 10, 0.45)",
  },
  fonts: {
    display: "Anton",
    body: "InterX",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
    slam: { damping: 13, stiffness: 260, mass: 0.6 },
  },
} as const;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
