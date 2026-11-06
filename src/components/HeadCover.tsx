import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import track from "../faceTrack.json";
import { clamp, theme } from "../theme";

// faceTrack.json: per-frame [centerX, centerY, headSize] in 1080x1920 output space,
// from OpenCV face detection on every frame of the clip (smoothed). The card is
// sized/positioned on it so the speaker's head stays hidden behind every graphic.
const head = (f: number) => (track as number[][])[Math.max(0, Math.min(track.length - 1, Math.round(f)))];

export const HeadCover: React.FC<{
  from: number; to: number; color: string; rotate?: number; w?: number; h?: number;
  exit?: boolean; border?: string; children: React.ReactNode;
}> = ({ from, to, color, rotate = 0, w = 1.12, h = 1.28, exit = false, border, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from || frame >= to) return null;
  const [cx, cy, size] = head(frame);
  const p = spring({ frame: frame - from, fps, config: theme.spring.slam });
  const out = exit ? interpolate(frame, [to - 10, to], [0, 1], { ...clamp, easing: theme.ease.in }) : 0;
  const breathe = Math.sin((frame - from) / 14) * 0.8;
  const W = Math.min(980, size * w);
  const H = size * h;
  const scale = interpolate(p, [0, 1], [0.2, 1]) * (1 - out * 0.5);
  const rot = interpolate(p, [0, 1], [rotate - 14, rotate]) + breathe + out * 18;
  // keep the card inside the frame horizontally (16px+ gutter)
  const left = Math.max(50, Math.min(1080 - 50 - W, cx - W / 2));
  return (
    <div style={{ position: "absolute", left, top: cy - H / 2 + size * 0.04, width: W, height: H,
      transform: `scale(${scale}) rotate(${rot}deg)`, opacity: interpolate(p, [0, 0.35], [0, 1], clamp) * (1 - out),
      background: color, borderRadius: 56, border: border ?? `10px solid ${theme.colors.paper}`,
      boxShadow: "0 50px 90px -20px rgba(0,0,0,0.65)", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", overflow: "hidden", textAlign: "center" }}>
      {children}
    </div>
  );
};
