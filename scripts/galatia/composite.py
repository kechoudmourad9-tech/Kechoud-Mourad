import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
W, H = 1024, 576
suit = Image.open("suitd_1.png").convert("RGB")                 # 512x816, real face + generated armour
lab = np.array(Image.fromarray(np.load("labels.npy").astype(np.uint8)).resize(suit.size, Image.NEAREST))
body = lab != 0
skin = np.isin(lab, [1, 2, 11])                                  # hair / face stay untouched
a = np.asarray(suit).astype(np.float32) / 255
# recolour the armour to matte black gunmetal, keep specular highlights
L = a.mean(2, keepdims=True)
dark = np.clip(0.025 + 0.2 * L ** 2.2, 0, 1) * np.array([0.92, 0.97, 1.08])
spec = np.clip((L - 0.88) * 3, 0, 1) * np.array([0.35, 0.5, 0.75])
armour = np.clip(dark + spec, 0, 1)
m = (body & ~skin).astype(np.float32)
m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[..., None] / 255
rec = a * (1 - m) + armour * m
hero = Image.fromarray((rec * 255).astype(np.uint8))
alpha = Image.fromarray((body * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(3))
hero.save("hero_suit.png")

def place(bg_path, out, light, rim, scale=0.98, x=0.5, bg_dim=0.75, bg_blur=2.5, grade=1.0):
    bg = Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(bg_blur))
    bg = ImageEnhance.Brightness(bg).enhance(bg_dim)
    h = int(H * scale); w = int(hero.width * h / hero.height)
    hr = hero.resize((w, h), Image.LANCZOS); al = alpha.resize((w, h), Image.LANCZOS)
    ha = np.asarray(hr).astype(np.float32) / 255
    # key light colour + side rim from the scene
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    side = np.clip((xx / w - 0.5) * 2 * rim[3], 0, 1)[..., None]
    key = 0.55 + 0.6 * np.clip(0.5 + (xx / w - 0.5) * rim[3] * 1.4, 0, 1)[..., None]   # one side lit, the other in shadow
    fade = np.clip(1.25 - yy / h * 1.1, 0.25, 1)[..., None]                             # lower body sinks into darkness
    lit = ha * np.array(light) * grade * key * fade + side * np.array(rim[:3]) * 0.5
    edge = np.asarray(al.filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255
    halo = np.clip(edge - np.asarray(al).astype(np.float32) / 255 * 0.9, 0, 1)[..., None] * np.array(rim[:3]) * 0.9
    hr2 = Image.fromarray((np.clip(lit, 0, 1) * 255).astype(np.uint8))
    out_img = bg.copy()
    px = int(W * x - w / 2); py = H - h
    glow = Image.fromarray((np.clip(halo, 0, 1) * 255).astype(np.uint8))
    out_img.paste(Image.fromarray(np.clip(np.asarray(out_img.crop((px, py, px + w, py + h))).astype(np.float32) + np.asarray(glow), 0, 255).astype(np.uint8)), (px, py))
    out_img.paste(hr2, (px, py), al)
    out_img.save(out)

place("img/forest_1.png", "img/hero_forest.png", light=[1.05, 0.78, 0.55], rim=[1.0, 0.45, 0.1, 1.0], bg_dim=0.85)
place("img/crack_0.png", "img/hero_crack.png", light=[0.72, 0.82, 1.05], rim=[1.0, 0.75, 0.35, -1.0], bg_dim=0.9, grade=0.95)
place("img/palace_0.png", "img/hero_palace.png", light=[0.85, 0.85, 1.0], rim=[0.55, 0.65, 1.0, 1.0], bg_dim=0.6, scale=0.9)
print("ok")
