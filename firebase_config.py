import firebase_admin
from firebase_admin import credentials, firestore, auth, storage

# Path to your downloaded serviceAccountKey.json
cred = credentials.Certificate("serviceAccountKey.json")

# Initialize Firebase App
firebase_admin.initialize_app(cred, {
    'storageBucket': 'your-project-id.appspot.com'  # for storing images/books
})

# Firestore client
db = firestore.client()

# Firebase Auth
firebase_auth = auth
