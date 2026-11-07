import torch, numpy as np
from PIL import Image, ImageFilter
torch.set_num_threads(4)
from diffusers import AutoPipelineForImage2Image
pipe = AutoPipelineForImage2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=torch.float32)
src = Image.open("/home/user/Kechoud-Mourad/public/galatia/captain.jpg").convert("RGB")
W, H = 512, 816
small = src.resize((W, H), Image.LANCZOS)
lab = np.array(Image.fromarray(np.load("labels.npy").astype(np.uint8)).resize((W, H), Image.NEAREST))
prompt = ("portrait of a young man wearing a matte black futuristic sci-fi tactical jumpsuit, dark gunmetal armor plates, high black collar, "
          "chest armor plates and thin glowing blue seams, cinematic dramatic lighting, highly detailed, film still")
outs = []
for i, seed in enumerate([4, 12, 33]):
    o = pipe(prompt=prompt, image=small, strength=0.9, num_inference_steps=5, guidance_scale=0.0,
             generator=torch.Generator().manual_seed(seed)).images[0]
    # keep the real face + hair, take the generated suit everywhere else on the body
    keep = np.isin(lab, [1, 2, 11]).astype(np.uint8) * 255          # hat, hair, face
    keepm = Image.fromarray(keep).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(4))
    body = (lab != 0).astype(np.uint8) * 255
    comp = Image.composite(small, o, keepm)
    comp.save(f"suitd_{i}.png"); outs.append(comp); print("suit", i, flush=True)
    Image.fromarray(body).save("body_mask_small.png")
g = Image.new("RGB", (W * 3, H)); [g.paste(o, (i * W, 0)) for i, o in enumerate(outs)]; g.save("suits_dark.jpg", quality=88)
