import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import wraps
from flask import request, jsonify

# Load Service Account Certificate
if not firebase_admin._apps:
    try:
        # 1. Try to load credentials from environment variable dictionary (for Render/Production)
        creds_json = os.environ.get("FIREBASE_CREDENTIALS")
        if creds_json:
            creds_dict = json.loads(creds_json)
            cred = credentials.Certificate(creds_dict)
            print("Firebase Admin SDK initialized successfully via environment credentials.")
        else:
            # 2. Fallback to local file path (for Local Development)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            service_account_path = os.path.join(current_dir, 'serviceAccountKey.json')
            cred = credentials.Certificate(service_account_path)
            print("Firebase Admin SDK initialized successfully via local serviceAccountKey.json.")
            
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        # Initialize app default if both methods fail (rely on ADC)
        firebase_admin.initialize_app()

db = firestore.client()

# In-memory Demo Session Database
DEMO_DATABASE = {
    'users': {},   # uid -> settings dict
    'habits': {}   # uid_date -> log dict
}

def require_auth(f):
    """
    Decorator to protect Flask routes. Verifies Firebase ID Token
    passed in the 'Authorization: Bearer <token>' header.
    Bypasses for demo_token and sets UID to 'demo_user'.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        # Bypass for Demo Mode
        if auth_header == 'Bearer demo_token' or request.headers.get('X-Test-User-Id') == 'demo_user':
            request.uid = 'demo_user'
            return f(*args, **kwargs)
            
        # Bypass for testing environment
        test_uid = request.headers.get('X-Test-User-Id')
        if test_uid:
            request.uid = test_uid
            return f(*args, **kwargs)
            
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized: Missing or malformed authentication token'}), 401
        
        token = auth_header.split('Bearer ')[1]
        try:
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token
            request.uid = decoded_token['uid']
        except Exception as e:
            return jsonify({'error': f'Unauthorized: Invalid token - {str(e)}'}), 401
            
        return f(*args, **kwargs)
    return decorated_function
