import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables (same as app.py)
load_dotenv()

FIREBASE_CRED_PATH = os.getenv("FIREBASE_CRED_PATH", "serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CRED_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def migrate_seats():
    seats_ref = db.collection("seats")
    docs = seats_ref.stream()

    for doc in docs:
        seat_id = doc.id  # e.g. "seat_12"
        data = doc.to_dict()

        # If "number" already exists, skip
        if "number" in data and data["number"] is not None:
            print(f"✅ {seat_id} already has number {data['number']}")
            continue

        try:
            if "_" in seat_id:
                number = int(seat_id.split("_")[1])
            else:
                print(f"⚠️ Could not parse seat number from {seat_id}, skipping")
                continue

            # Update Firestore doc
            seats_ref.document(seat_id).update({"number": number})
            print(f"✨ Updated {seat_id} with number={number}")

        except Exception as e:
            print(f"❌ Error processing {seat_id}: {e}")

if __name__ == "__main__":
    migrate_seats()
