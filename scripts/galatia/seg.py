import torch, numpy as np
from PIL import Image
from transformers import SegformerImageProcessor, AutoModelForSemanticSegmentation
proc = SegformerImageProcessor.from_pretrained("mattmdjaga/segformer_b2_clothes")
model = AutoModelForSemanticSegmentation.from_pretrained("mattmdjaga/segformer_b2_clothes")
img = Image.open("/home/user/Kechoud-Mourad/public/galatia/captain.jpg").convert("RGB")
with torch.no_grad():
    logits = model(**proc(images=img, return_tensors="pt")).logits
up = torch.nn.functional.interpolate(logits, size=img.size[::-1], mode="bilinear", align_corners=False)
lab = up.argmax(1)[0].numpy()
names = model.config.id2label
print({names[i]: int((lab == i).sum()) for i in np.unique(lab)})
np.save("labels.npy", lab)
person = (lab != 0).astype(np.uint8) * 255
Image.fromarray(person).save("person_mask.png")
clothes = np.isin(lab, [4, 7]).astype(np.uint8) * 255   # upper-clothes, dress
Image.fromarray(clothes).save("clothes_mask.png")
