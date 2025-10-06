from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import os
from PIL import Image

app = Flask(__name__)

# --- Tải các khuôn mặt mẫu ---
known_face_encodings = []
known_face_names = []

known_dir = "known_faces"
for filename in os.listdir(known_dir):
    if filename.endswith((".jpg", ".jpeg", ".png")):
        img_path = os.path.join(known_dir, filename)
        image = face_recognition.load_image_file(img_path)
        encodings = face_recognition.face_encodings(image)
        if len(encodings) > 0:
            known_face_encodings.append(encodings[0])
            known_face_names.append(os.path.splitext(filename)[0])
            print(f"✅ Loaded: {filename}")
        else:
            print(f"⚠️ No face found in {filename}")

@app.route("/")
def home():
    return jsonify({"message": "Face Recognition API running ✅"})

# --- API nhận diện khuôn mặt ---
@app.route("/api/recognize", methods=["POST"])
def recognize():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img = face_recognition.load_image_file(file)

    encodings = face_recognition.face_encodings(img)
    if len(encodings) == 0:
        return jsonify({"result": "No face detected"}), 400

    face_encoding = encodings[0]

    matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
    face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)

    if len(face_distances) > 0:
        best_match_index = np.argmin(face_distances)
        if matches[best_match_index]:
            name = known_face_names[best_match_index]
            return jsonify({"result": "Match", "student_name": name})
    
    return jsonify({"result": "Unknown"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
