from PIL import Image
import os

input_folder = "known_faces"

for filename in os.listdir(input_folder):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        path = os.path.join(input_folder, filename)
        try:
            img = Image.open(path)
            rgb_img = img.convert("RGB")
            rgb_img.save(path)
            print(f"✅ Converted {filename} to RGB")
        except Exception as e:
            print(f"❌ Error converting {filename}: {e}")
