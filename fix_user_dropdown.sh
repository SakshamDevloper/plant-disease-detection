#!/bin/bash

echo "========================================="
echo "í´§ Fixing User Dropdown - Popup Style"
echo "========================================="

# Create backup of original files
echo "í³¦ Creating backups..."
cp static/css/style.css static/css/style.css.backup 2>/dev/null
cp templates/index.html templates/index.html.backup 2>/dev/null
cp static/js/main.js static/js/main.js.backup 2>/dev/null

# Update CSS with popup dropdown styles
echo "í¾¨ Updating CSS with popup dropdown styles..."

cat >> static/css/style.css << 'EOF'

/* ========== USER PROFILE DROPDOWN - POPUP STYLE ========== */
.user-profile-wrapper {
    position: relative;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s;
}

.user-profile:hover {
    background: rgba(46, 204, 113, 0.1);
}

.user-profile img {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--primary);
}

.user-profile span {
    font-weight: 500;
    color: #333;
    font-size: 0.9rem;
}

.user-profile i {
    font-size: 0.75rem;
    color: #888;
    transition: transform 0.3s;
}

.user-profile.active i {
    transform: rotate(180deg);
}

.user-dropdown {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 300px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    overflow: hidden;
    animation: slideDown 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.user-dropdown::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 30px;
    width: 16px;
    height: 16px;
    background: white;
    transform: rotate(45deg);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    border-left: 1px solid rgba(0, 0, 0, 0.05);
}

.user-dropdown .dropdown-header {
    padding: 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    display: flex;
    align-items: center;
    gap: 15px;
}

.user-dropdown .dropdown-header img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 3px solid white;
}

.user-dropdown .dropdown-header i {
    font-size: 28px;
    color: white;
}

.user-dropdown .dropdown-header .user-info h4 {
    font-size: 1rem;
    margin-bottom: 4px;
}

.user-dropdown .dropdown-header .user-info p {
    font-size: 0.8rem;
    opacity: 0.9;
}

.user-dropdown .dropdown-body {
    padding: 8px 0;
}

.user-dropdown a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    text-decoration: none;
    color: #333;
    transition: all 0.2s;
    font-size: 0.95rem;
}

.user-dropdown a i {
    width: 22px;
    color: var(--primary);
    font-size: 1.1rem;
}

.user-dropdown a:hover {
    background: #f5f5f5;
    padding-left: 25px;
}

.user-dropdown .dropdown-divider {
    height: 1px;
    background: #eee;
    margin: 8px 0;
}

.user-dropdown .logout-btn {
    color: var(--danger) !important;
}

.user-dropdown .logout-btn i {
    color: var(--danger) !important;
}

[data-theme="dark"] .user-dropdown {
    background: #1a232c;
    border: 1px solid #2a3743;
}

[data-theme="dark"] .user-dropdown::before {
    background: #1a232c;
    border-top: 1px solid #2a3743;
    border-left: 1px solid #2a3743;
}

[data-theme="dark"] .user-dropdown a {
    color: #e8edf2;
}

[data-theme="dark"] .user-dropdown a:hover {
    background: #212c38;
}

[data-theme="dark"] .user-dropdown .dropdown-divider {
    background: #2a3743;
}

[data-theme="dark"] .user-profile span {
    color: #e8edf2;
}

[data-theme="dark"] .user-profile {
    background: rgba(255, 255, 255, 0.05);
}
EOF

echo "âœ… CSS updated!"

# Create JavaScript file for dropdown
echo "í³ Creating dropdown JavaScript..."

cat > static/js/user-dropdown.js << 'EOF'
document.addEventListener('DOMContentLoaded', function() {
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userProfileBtn && userDropdown) {
        userDropdown.style.display = 'none';
        
        userProfileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = userDropdown.style.display === 'block';
            
            const notificationPanel = document.getElementById('notificationPanel');
            if (notificationPanel) {
                notificationPanel.style.display = 'none';
            }
            
            userDropdown.style.display = isVisible ? 'none' : 'block';
            userProfileBtn.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!userProfileBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.display = 'none';
                userProfileBtn.classList.remove('active');
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                userDropdown.style.display = 'none';
                userProfileBtn.classList.remove('active');
            }
        });
    }
    
    fetch('/auth/check')
        .then(res => res.json())
        .then(data => {
            const userDropdown = document.getElementById('userDropdown');
            const userNameDisplay = document.getElementById('userNameDisplay');
            const userAvatar = document.getElementById('userAvatar');
            
            if (data.authenticated && data.user) {
                if (userNameDisplay) {
                    userNameDisplay.textContent = data.user.full_name || data.user.username || 'Gardener';
                }
                if (userAvatar) {
                    userAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.user.full_name || data.user.username) + '&background=2ecc71&color=fff';
                }
                
                if (userDropdown) {
                    userDropdown.innerHTML = '<div class="dropdown-header"><img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(data.user.full_name || data.user.username) + '&background=667eea&color=fff" alt="User"><div class="user-info"><h4>' + (data.user.full_name || data.user.username) + '</h4><p>' + data.user.email + '</p></div></div><div class="dropdown-body"><a href="/dashboard"><i class="fas fa-chart-pie"></i> Dashboard</a><a href="/profile"><i class="fas fa-user-circle"></i> My Profile</a><a href="/history"><i class="fas fa-history"></i> Analysis History</a><a href="/settings"><i class="fas fa-cog"></i> Settings</a><div class="dropdown-divider"></div><a href="#" onclick="handleLogout(); return false;" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a></div>';
                }
            } else {
                if (userDropdown) {
                    userDropdown.innerHTML = '<div class="dropdown-header"><i class="fas fa-leaf" style="font-size: 28px;"></i><div class="user-info"><h4>Welcome!</h4><p>Sign in to access all features</p></div></div><div class="dropdown-body"><a href="/login"><i class="fas fa-sign-in-alt"></i> Login</a><a href="/register"><i class="fas fa-user-plus"></i> Register</a></div>';
                }
            }
        })
        .catch(err => {
            console.log('Auth check failed');
            const userDropdown = document.getElementById('userDropdown');
            if (userDropdown) {
                userDropdown.innerHTML = '<div class="dropdown-header"><i class="fas fa-leaf" style="font-size: 28px;"></i><div class="user-info"><h4>PlantDoctor PRO</h4><p>AI Plant Disease Detection</p></div></div><div class="dropdown-body"><a href="/login"><i class="fas fa-sign-in-alt"></i> Login</a><a href="/register"><i class="fas fa-user-plus"></i> Register</a></div>';
            }
        });
});

async function handleLogout() {
    try {
        await fetch('/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
    }
}
EOF

echo "âœ… Dropdown JavaScript created!"

# Add script to index.html
if ! grep -q "user-dropdown.js" templates/index.html; then
    sed -i 's|</body>|    <script src="{{ url_for('\''static'\'', filename='\''js/user-dropdown.js'\'') }}"></script>\n</body>|' templates/index.html
    echo "âœ… Added script reference to index.html"
fi

echo ""
echo "========================================="
echo "âœ… USER DROPDOWN POPUP FIX COMPLETE!"
echo "========================================="
echo "íº€ Restart Flask: python app.py"
echo "í´„ Hard refresh: Ctrl+Shift+R"
echo "========================================="
