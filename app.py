# app.py - Complete Plant Disease Detection App with Authentication
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
from PIL import Image
import numpy as np
import json
import os
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import sqlite3
import hashlib
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Create required directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('database', exist_ok=True)
os.makedirs('static/images', exist_ok=True)

# ========== DATABASE FUNCTIONS ==========
def get_db():
    conn = sqlite3.connect('database/users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY,
        theme TEXT DEFAULT 'light',
        notifications_enabled BOOLEAN DEFAULT 1,
        language TEXT DEFAULT 'en',
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized!")

def hash_password(password):
    salt = secrets.token_hex(16)
    return hashlib.sha256((password + salt).encode()).hexdigest() + ':' + salt

def verify_password(password, stored_hash):
    try:
        hash_part, salt = stored_hash.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == hash_part
    except:
        return False

def create_user(username, email, password, full_name=''):
    conn = get_db()
    c = conn.cursor()
    
    try:
        password_hash = hash_password(password)
        c.execute('''INSERT INTO users (username, email, password_hash, full_name) 
                     VALUES (?, ?, ?, ?)''', 
                  (username, email, password_hash, full_name))
        user_id = c.lastrowid
        
        c.execute('''INSERT INTO user_preferences (user_id) VALUES (?)''', (user_id,))
        
        conn.commit()
        return {'success': True, 'user_id': user_id}
    except sqlite3.IntegrityError as e:
        if 'username' in str(e):
            return {'success': False, 'error': 'Username already exists'}
        elif 'email' in str(e):
            return {'success': False, 'error': 'Email already registered'}
        return {'success': False, 'error': str(e)}
    finally:
        conn.close()

def authenticate_user(username_or_email, password):
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT * FROM users 
                 WHERE (username = ? OR email = ?) AND is_active = 1''',
              (username_or_email, username_or_email))
    user = c.fetchone()
    
    if user and verify_password(password, user['password_hash']):
        c.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
        conn.commit()
        
        token = secrets.token_hex(32)
        c.execute('''INSERT INTO sessions (user_id, token, expires_at) 
                     VALUES (?, ?, datetime('now', '+7 days'))''',
                  (user['id'], token))
        conn.commit()
        
        conn.close()
        return {
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'full_name': user['full_name'],
                'avatar': user['avatar']
            }
        }
    
    conn.close()
    return {'success': False, 'error': 'Invalid username or password'}

def get_user_by_token(token):
    if not token:
        return None
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT u.* FROM users u 
                 JOIN sessions s ON u.id = s.user_id 
                 WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP''',
              (token,))
    user = c.fetchone()
    conn.close()
    
    return dict(user) if user else None

def logout_user(token):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM sessions WHERE token = ?', (token,))
    conn.commit()
    conn.close()

# Initialize database
init_db()

# ========== LOAD MODEL ==========
try:
    model = keras.models.load_model('model/plant_disease_model.h5')
    with open('model/class_indices.json', 'r') as f:
        class_names = json.load(f)
    print("Model loaded successfully!")
    model_loaded = True
except Exception as e:
    print(f"Model not found. Will use demo mode. Error: {e}")
    model_loaded = False
    class_names = {}

# ========== DISEASE DATABASE ==========
disease_info = {
    'Apple___Apple_scab': {
        'name': 'Apple Scab', 'plant': 'Apple',
        'description': 'Fungal disease causing dark, scaly lesions on leaves and fruit.',
        'symptoms': ['Olive-green spots on leaves', 'Dark, scaly lesions on fruit', 'Leaf yellowing and drop'],
        'treatment': ['Apply fungicide early in season', 'Remove fallen leaves', 'Prune for air circulation'],
        'prevention': ['Plant resistant varieties', 'Clean up fallen leaves', 'Proper spacing']
    },
    'Apple___Black_rot': {
        'name': 'Black Rot', 'plant': 'Apple',
        'description': 'Fungal disease causing fruit rot and leaf spots.',
        'symptoms': ['Purple spots on leaves', 'Fruit rot with concentric rings', 'Cankers on branches'],
        'treatment': ['Remove infected fruit', 'Prune dead branches', 'Apply fungicide'],
        'prevention': ['Proper pruning', 'Remove mummified fruit', 'Good sanitation']
    },
    'Tomato___Early_blight': {
        'name': 'Early Blight', 'plant': 'Tomato',
        'description': 'Common fungal disease causing dark spots with concentric rings.',
        'symptoms': ['Dark brown spots with rings', 'Yellowing leaves', 'Lower leaves affected first'],
        'treatment': ['Remove infected leaves', 'Apply copper fungicide', 'Mulch plants'],
        'prevention': ['Crop rotation', 'Proper spacing', 'Water at base']
    },
    'Tomato___Late_blight': {
        'name': 'Late Blight', 'plant': 'Tomato',
        'description': 'Serious fungal disease that can destroy plants quickly.',
        'symptoms': ['Dark water-soaked spots', 'White fuzzy growth', 'Rapid plant death'],
        'treatment': ['Remove infected plants', 'Apply fungicide preventively', 'Improve drainage'],
        'prevention': ['Use resistant varieties', 'Avoid overhead watering', 'Monitor regularly']
    },
    'Tomato___healthy': {
        'name': 'Healthy', 'plant': 'Tomato',
        'description': 'Your tomato plant appears healthy!',
        'symptoms': ['No disease symptoms detected'],
        'treatment': ['Continue regular care'],
        'prevention': ['Maintain good practices', 'Regular monitoring']
    },
    'Potato___Early_blight': {
        'name': 'Early Blight', 'plant': 'Potato',
        'description': 'Fungal disease causing dark spots on leaves.',
        'symptoms': ['Dark brown spots', 'Yellowing', 'Reduced yield'],
        'treatment': ['Apply fungicide', 'Remove infected leaves', 'Improve air flow'],
        'prevention': ['Crop rotation', 'Certified seed potatoes', 'Proper spacing']
    },
    'Potato___Late_blight': {
        'name': 'Late Blight', 'plant': 'Potato',
        'description': 'Devastating disease that caused Irish Potato Famine.',
        'symptoms': ['Dark lesions', 'White mold', 'Rapid decay'],
        'treatment': ['Remove infected plants', 'Fungicide application', 'Destroy infected tubers'],
        'prevention': ['Resistant varieties', 'Good drainage', 'Monitor weather']
    },
    'Corn_(maize)___Common_rust': {
        'name': 'Common Rust', 'plant': 'Corn',
        'description': 'Fungal disease causing reddish-brown pustules.',
        'symptoms': ['Reddish-brown pustules', 'Yellowing', 'Reduced growth'],
        'treatment': ['Fungicide application', 'Resistant hybrids', 'Early planting'],
        'prevention': ['Resistant varieties', 'Crop rotation', 'Remove debris']
    },
    'Grape___Black_rot': {
        'name': 'Black Rot', 'plant': 'Grape',
        'description': 'Serious fungal disease of grapes.',
        'symptoms': ['Brown spots on leaves', 'Black mummified berries', 'Shoot lesions'],
        'treatment': ['Fungicide program', 'Remove mummies', 'Prune infected parts'],
        'prevention': ['Good sanitation', 'Proper pruning', 'Air circulation']
    }
}

# ========== HELPER FUNCTIONS ==========
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def get_disease_info(class_name):
    clean_name = class_name.replace(' ', '_')
    if clean_name in disease_info:
        return disease_info[clean_name]
    return {
        'name': class_name.replace('___', ' - ').replace('_', ' '),
        'plant': class_name.split('___')[0] if '___' in class_name else 'Unknown',
        'description': 'Plant disease detected.',
        'symptoms': ['Visible symptoms on leaves', 'Discoloration', 'Spots or lesions'],
        'treatment': ['Remove affected parts', 'Improve air circulation', 'Consider fungicide'],
        'prevention': ['Monitor regularly', 'Maintain plant health', 'Proper spacing']
    }

# ========== PAGE ROUTES ==========
@app.route('/')
def index():
    token = request.cookies.get('auth_token')
    user = get_user_by_token(token)
    return render_template('index.html', model_loaded=model_loaded, user=user)

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/dashboard')
def dashboard():
    token = request.cookies.get('auth_token')
    user = get_user_by_token(token)
    if not user:
        return redirect('/login')
    return render_template('index.html', model_loaded=model_loaded, user=user)

# ========== AUTHENTICATION ROUTES ==========
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    
    if not username or not email or not password:
        return jsonify({'success': False, 'error': 'All fields are required'})
    
    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'})
    
    result = create_user(username, email, password, full_name)
    return jsonify(result)

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'})
    
    result = authenticate_user(username, password)
    
    if result['success']:
        response = jsonify({'success': True, 'user': result['user']})
        response.set_cookie('auth_token', result['token'], max_age=7*24*60*60, httponly=True)
        return response
    
    return jsonify(result)

@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    token = request.cookies.get('auth_token')
    if token:
        logout_user(token)
    response = jsonify({'success': True})
    response.delete_cookie('auth_token')
    return response

@app.route('/auth/check', methods=['GET'])
def check_auth():
    token = request.cookies.get('auth_token')
    user = get_user_by_token(token)
    if user:
        return jsonify({'authenticated': True, 'user': {
            'id': user['id'], 'username': user['username'],
            'email': user['email'], 'full_name': user['full_name']
        }})
    return jsonify({'authenticated': False})

# ========== PREDICTION ROUTE ==========
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            if model_loaded:
                img_array = preprocess_image(filepath)
                predictions = model.predict(img_array, verbose=0)
                predicted_idx = np.argmax(predictions[0])
                confidence = float(predictions[0][predicted_idx] * 100)
                predicted_class = class_names[str(predicted_idx)]
            else:
                import random
                demo_classes = ['Tomato___Early_blight', 'Tomato___Late_blight', 
                               'Tomato___healthy', 'Apple___Apple_scab', 
                               'Potato___Early_blight', 'Corn_(maize)___Common_rust']
                predicted_class = random.choice(demo_classes)
                confidence = random.uniform(75, 98)
            
            disease_data = get_disease_info(predicted_class)
            
            result = {
                'success': True,
                'disease_name': disease_data['name'],
                'plant_type': disease_data['plant'],
                'confidence': round(confidence, 2),
                'description': disease_data['description'],
                'symptoms': disease_data['symptoms'],
                'treatment': disease_data['treatment'],
                'prevention': disease_data['prevention'],
                'image_url': f'/static/uploads/{filename}',
                'raw_class': predicted_class
            }
            
            return jsonify(result)
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

# ========== API ENDPOINTS ==========
@app.route('/api/analytics')
def get_analytics():
    return {
        'total_analyses': 120,
        'healthy_plants': 78,
        'diseases_detected': 42,
        'recent_analyses': [
            {'disease_name': 'Early Blight', 'plant_type': 'Tomato', 'timestamp': '2026-04-18', 'confidence': 94},
            {'disease_name': 'Healthy', 'plant_type': 'Potato', 'timestamp': '2026-04-17', 'confidence': 97},
            {'disease_name': 'Late Blight', 'plant_type': 'Tomato', 'timestamp': '2026-04-16', 'confidence': 89},
        ]
    }

@app.route('/api/user-data')
def user_data():
    token = request.cookies.get('auth_token')
    user = get_user_by_token(token)
    if user:
        return {
            'name': user.get('full_name') or user.get('username', 'Gardener'),
            'total_analyses': 120,
            'healthy_plants': 78,
            'diseases_detected': 42,
            'avatar': user.get('avatar') or 'https://ui-avatars.com/api/?name=' + user.get('username', 'User')
        }
    return {
        'name': 'Gardener',
        'total_analyses': 120,
        'healthy_plants': 78,
        'diseases_detected': 42
    }

@app.route('/api/disease-map')
def disease_map():
    return [
        {'location_lat': 37.7749, 'location_lon': -122.4194, 'disease_name': 'Late Blight', 'severity': 'Critical', 'reported_at': '2026-04-18'},
        {'location_lat': 34.0522, 'location_lon': -118.2437, 'disease_name': 'Early Blight', 'severity': 'Moderate', 'reported_at': '2026-04-17'},
        {'location_lat': 40.7128, 'location_lon': -74.0060, 'disease_name': 'Leaf Mold', 'severity': 'Severe', 'reported_at': '2026-04-16'},
    ]

@app.route('/api/similar-cases')
def similar_cases():
    return [
        {'disease_name': 'Late Blight', 'location': 'California', 'time_ago': '2 days', 'outcome': 'Recovered', 'image_url': '/static/images/disease-prevention.jpg'},
        {'disease_name': 'Early Blight', 'location': 'Florida', 'time_ago': '5 days', 'outcome': 'Treatment', 'image_url': '/static/images/organic-control.jpg'},
    ]

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    query = data.get('query', '').lower()
    
    if 'treatment' in query:
        return {'response': 'For fungal diseases, use neem oil or copper fungicide every 7-10 days.', 'suggestions': ['Application tips?', 'Organic options?']}
    elif 'prevention' in query:
        return {'response': 'Practice crop rotation, proper spacing, and avoid overhead watering.', 'suggestions': ['More tips?', 'Resistant varieties?']}
    elif 'identify' in query:
        return {'response': 'Upload a clear photo of the affected leaf for AI diagnosis.', 'suggestions': ['Upload photo', 'Common symptoms']}
    else:
        return {'response': 'I can help identify plant diseases! Upload a photo or ask about symptoms.', 'suggestions': ['Upload photo', 'Common diseases', 'Treatment options']}

@app.route('/class-info')
def class_info():
    return jsonify(list(disease_info.keys()))

@app.route('/favicon.ico')
def favicon():
    return '', 204

# ========== MAIN ==========
if __name__ == '__main__':
    print("\n" + "="*50)
    print("Plant Disease Detection System")
    print("="*50)
    print(f"Upload folder: {app.config['UPLOAD_FOLDER']}")
    print(f"Model loaded: {model_loaded}")
    print(f"Access at: http://localhost:5000")
    print(f"Login at: http://localhost:5000/login")
    print(f"Register at: http://localhost:5000/register")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)