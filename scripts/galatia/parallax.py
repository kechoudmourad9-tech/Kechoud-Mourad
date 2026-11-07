# 2.5D camera moves: estimate depth (Depth-Anything-V2-Small), then re-project every frame so near
# things move more than far things. Writes one 1920x1080 30fps clip per shot.
import json, subprocess, sys, numpy as np, torch, cv2
from PIL import Image, ImageFilter
from transformers import pipeline

torch.set_num_threads(4)
depth_pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf")
W, H, FPS = 1920, 1080, 30
M = 1.12  # oversize margin so moves never reveal edges

# motion presets: (zoom start, zoom end, pan x px, pan y px, dolly strength, parallax px)
MOVES = {
    "push":   (1.00, 1.10, 0, 0, 0.10, 18),
    "pushfast": (1.00, 1.22, 0, 0, 0.22, 30),
    "pull":   (1.12, 1.00, 0, 0, -0.08, 18),
    "left":   (1.05, 1.08, 70, 0, 0.03, 45),
    "right":  (1.05, 1.08, -70, 0, 0.03, 45),
    "up":     (1.04, 1.10, 0, 60, 0.05, 35),
    "down":   (1.06, 1.10, 0, -60, 0.05, 35),
    "shake":  (1.08, 1.14, 0, 0, 0.12, 25),
}

def render(src, out, move, secs, sharpen=True):
    img = Image.open(src).convert("RGB")
    big = img.resize((int(W * M), int(H * M)), Image.LANCZOS)
    if sharpen:
        big = big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=90, threshold=2))
    d = np.array(depth_pipe(img)["depth"].resize(big.size, Image.BICUBIC)).astype(np.float32)
    d = cv2.GaussianBlur(d, (0, 0), 6)
    d = (d - d.min()) / max(1e-6, d.max() - d.min())          # 1 = near
    a = np.array(big)
    bw, bh = big.size
    z0, z1, px, py, dolly, par = MOVES[move]
    uu, vv = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    # depth sampled on the output grid (centre crop of the oversized image)
    ox, oy = (bw - W) / 2, (bh - H) / 2
    dd = cv2.remap(d, uu + ox, vv + oy, cv2.INTER_LINEAR)
    n = int(secs * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for i in range(n):
        t = i / max(1, n - 1)
        e = t * t * (3 - 2 * t)                                    # smoothstep
        zoom = z0 + (z1 - z0) * e
        zeff = zoom * (1 + dolly * e * dd)
        sx = (uu - W / 2) / zeff + bw / 2 - (px * (e - 0.5)) * (0.4 + dd) - par * (e - 0.5) * dd
        sy = (vv - H / 2) / zeff + bh / 2 - (py * (e - 0.5)) * (0.4 + dd)
        if move == "shake":
            sx += np.sin(i * 1.7) * 3; sy += np.cos(i * 2.1) * 3
        frame = cv2.remap(a, sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        ff.stdin.write(frame.tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == "__main__":
    plan = json.load(open(sys.argv[1]))
    for name, src, move, secs in plan:
        render(src, f"clips/{name}.mp4", move, secs)
        print("clip", name, flush=True)
    print("done")
