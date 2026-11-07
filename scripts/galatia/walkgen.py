import torch; torch.set_num_threads(4)
from diffusers import AutoPipelineForText2Image
pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=torch.float32)
S = ", cinematic film still, dark fantasy, anamorphic lens, volumetric light, highly detailed, 35mm film grain, dramatic lighting, masterpiece"
P = "back view of one single lone young man with short dark hair wearing a black tactical jumpsuit walking alone through falling ash and embers, a floating city far away in the sky, empty wasteland, only one person"
for i, seed in enumerate([501, 777, 913, 1201]):
    pipe(prompt=P + S, num_inference_steps=2, guidance_scale=0.0, width=1024, height=576, generator=torch.Generator().manual_seed(seed)).images[0].save(f"img/walk_n{i}.png"); print("walk", i, flush=True)
