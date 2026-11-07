import json, time, torch, sys
torch.set_num_threads(4)
from diffusers import AutoPipelineForText2Image
pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=torch.float32)
STYLE = ", cinematic film still, dark fantasy, anamorphic lens, volumetric light, highly detailed, 35mm film grain, dramatic lighting, masterpiece"
only = set(sys.argv[1:])
for key, seed, prompt in json.load(open("shots.json")):
    if only and key not in only: continue
    for v in range(2):
        t = time.time()
        img = pipe(prompt=prompt + STYLE, num_inference_steps=2, guidance_scale=0.0, width=1024, height=576,
                   generator=torch.Generator().manual_seed(seed * 10 + v)).images[0]
        img.save(f"img/{key}_{v}.png"); print(key, v, round(time.time() - t, 1), flush=True)
print("done")
