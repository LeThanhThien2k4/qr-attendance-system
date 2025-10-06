import cv2
import os

input_folder = "known_faces"

for filename in os.listdir(input_folder):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        path = os.path.join(input_folder, filename)
        try:
            img = cv2.imread(path)
            if img is None:
                print(f"❌ Không thể đọc được {filename}, file có thể bị lỗi.")
                continue
            # ép ảnh về đúng định dạng 8-bit BGR (chuẩn của OpenCV)
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            cv2.imwrite(path, cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR))
            print(f"✅ Rebuilt {filename} bằng OpenCV (chuẩn 8-bit RGB).")
        except Exception as e:
            print(f"❌ Lỗi khi xử lý {filename}: {e}")
