from PIL import Image
import os

input_folder = "known_faces"

for filename in os.listdir(input_folder):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        path = os.path.join(input_folder, filename)
        try:
            with Image.open(path) as img:
                # ép chuyển về RGB 8-bit
                rgb_img = img.convert("RGB")

                # ép lưu lại, ghi đè luôn, loại bỏ metadata ICC
                rgb_img.save(path, "JPEG", quality=95, subsampling=0)
                print(f"✅ Re-saved {filename} as strict 8-bit RGB JPEG")
        except Exception as e:
            print(f"❌ Error converting {filename}: {e}")
