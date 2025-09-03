import os
import uuid
from datetime import datetime
from io import BytesIO

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image

from ultralytics import YOLO

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# -------------------------
# Env & Firebase init
# -------------------------
load_dotenv()

FIREBASE_CRED_PATH = os.getenv("FIREBASE_CRED_PATH", "serviceAccountKey.json")
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.5"))

if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CRED_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# -------------------------
# YOLO model
# -------------------------
MODEL_PATH = os.path.join("models", "best.pt")
model = YOLO(MODEL_PATH)

# Class name your model uses for occupied seats.
# From your training/logs it looked like "occupied".
OCCUPIED_CLASS_NAME = "occupied"

# -------------------------
# Flask
# -------------------------
app = Flask(__name__)
CORS(app)

# Where to save annotated images
RESULTS_DIR = os.path.join("static", "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

@app.route("/")
def index():
    return jsonify({"ok": True, "service": "seat-detector", "time": datetime.utcnow().isoformat() + "Z"})

@app.route("/results/<path:fname>")
def serve_result(fname):
    return send_from_directory(RESULTS_DIR, fname)

@app.route("/detect", methods=["POST"])
def detect():
    """
    Multipart form-data:
      - file: the image
      - seat_id: (optional) document id in Firestore (e.g., "seat_12")
    """
    if "file" not in request.files:
        return jsonify({"error": "No file in request under 'file'"}), 400

    file = request.files["file"]
    seat_id = request.form.get("seat_id", "seat_1")

    # Load image
    try:
        img = Image.open(file.stream).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Invalid image: {e}"}), 400

    # Run YOLO prediction
    # We’ll also save an annotated image so you can review results.
    run = model.predict(
        source=img,
        conf=CONF_THRESHOLD,
        save=True,              # saves to runs/detect/predict* by ultralytics
        imgsz=640,
        verbose=False
    )

    # Extract detections
    # Assume single class "occupied". Mark seat occupied if any detection present.
    occupied = False
    max_conf = 0.0
    boxes_out = []

    if run and len(run) > 0:
        r0 = run[0]  # first image
        names = r0.names  # id->name mapping
        # Iterate predictions
        if r0.boxes is not None:
            for b in r0.boxes:
                cls_id = int(b.cls[0].item())
                cls_name = names.get(cls_id, str(cls_id))
                conf = float(b.conf[0].item())
                if cls_name == OCCUPIED_CLASS_NAME:
                    occupied = True
                    max_conf = max(max_conf, conf)
                # Collect for returning (optional)
                xyxy = [float(x) for x in b.xyxy[0].tolist()]  # [x1,y1,x2,y2]
                boxes_out.append({
                    "class_id": cls_id,
                    "class_name": cls_name,
                    "conf": conf,
                    "box_xyxy": xyxy
                })

    status = "occupied" if occupied else "free"

    # Find the last annotated file ultralytics saved and copy to our /static/results
    # (Ultralytics saves to runs/detect/predict, predict2, ...)
    annotated_path = _latest_annotated_path()
    result_filename = None
    if annotated_path:
        result_filename = f"{uuid.uuid4().hex}.jpg"
        Image.open(annotated_path).save(os.path.join(RESULTS_DIR, result_filename))

    # Update Firestore seat doc
    try:
        number = int(seat_id.split("_")[1]) if "_" in seat_id else None
    except (IndexError, ValueError):
        number = None  # fallback if parsing fails
    seat_doc = {
        "status": status,
        "confidence": round(max_conf, 3),
        "last_updated": firestore.SERVER_TIMESTAMP,
        "number": number
    }
    db.collection("seats").document(seat_id).set(seat_doc, merge=True)

    return jsonify({
        "seat_id": seat_id,
        "status": status,
        "max_confidence": round(max_conf, 3),
        "boxes": boxes_out,
        "annotated_url": f"/results/{result_filename}" if result_filename else None
    })


@app.route("/seats", methods=["GET"])
def list_seats():
    docs = db.collection("seats").stream()
    seats = []
    for d in docs:
        item = d.to_dict()
        item["id"] = d.id
        seats.append(item)
    return jsonify({"seats": seats})


@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok", "message": "Connected to Library Wi-Fi"})

def _latest_annotated_path():
    """
    Find the most recent file in runs/detect/predict* directories
    that looks like the rendered annotated output from ultralytics.
    """
    import glob
    candidates = []
    for d in glob.glob("runs/detect/predict*"):
        candidates.extend(glob.glob(os.path.join(d, "*.jpg")))
        candidates.extend(glob.glob(os.path.join(d, "*.png")))
        candidates.extend(glob.glob(os.path.join(d, "*.jpeg")))
    if not candidates:
        return None
    # newest by mtime
    candidates.sort(key=lambda p: os.path.getmtime(p))
    return candidates[-1]


if __name__ == "__main__":
    # For local dev
    app.run(host="0.0.0.0", port=5001, debug=True)
