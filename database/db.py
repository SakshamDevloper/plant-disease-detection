# database/db.py - User authentication database
import sqlite3
import hashlib
import secrets
from datetime import datetime
import os

os.makedirs('database', exist_ok=True)

def get_db():
    conn = sqlite3.connect('database/users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    # Users table
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
    
    # User sessions table
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    
    # User preferences table
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
    hash_part, salt = stored_hash.split(':')
    return hashlib.sha256((password + salt).encode()).hexdigest() == hash_part

def create_user(username, email, password, full_name=''):
    conn = get_db()
    c = conn.cursor()
    
    try:
        password_hash = hash_password(password)
        c.execute('''INSERT INTO users (username, email, password_hash, full_name) 
                     VALUES (?, ?, ?, ?)''', 
                  (username, email, password_hash, full_name))
        user_id = c.lastrowid
        
        # Create user preferences
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
        # Update last login
        c.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
        conn.commit()
        
        # Create session token
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
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT u.* FROM users u 
                 JOIN sessions s ON u.id = s.user_id 
                 WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP''',
              (token,))
    user = c.fetchone()
    conn.close()
    
    return dict(user) if user else None

def logout(token):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM sessions WHERE token = ?', (token,))
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("✅ Database setup complete!")
