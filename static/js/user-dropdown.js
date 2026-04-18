// User Dropdown Functionality
document.addEventListener('DOMContentLoaded', function() {
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    
    // Initialize panels as hidden
    if (userDropdown) userDropdown.style.display = 'none';
    if (notificationPanel) notificationPanel.style.display = 'none';
    
    // User Dropdown Toggle
    if (userProfileBtn && userDropdown) {
        userProfileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close notification panel if open
            if (notificationPanel) notificationPanel.style.display = 'none';
            
            // Toggle dropdown
            if (userDropdown.style.display === 'block') {
                userDropdown.style.display = 'none';
                userProfileBtn.classList.remove('active');
            } else {
                userDropdown.style.display = 'block';
                userProfileBtn.classList.add('active');
            }
        });
    }
    
    // Notification Panel Toggle
    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close user dropdown if open
            if (userDropdown) {
                userDropdown.style.display = 'none';
                if (userProfileBtn) userProfileBtn.classList.remove('active');
            }
            
            // Toggle notification panel
            if (notificationPanel.style.display === 'block') {
                notificationPanel.style.display = 'none';
            } else {
                notificationPanel.style.display = 'block';
            }
        });
    }
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (userProfileBtn && !userProfileBtn.contains(e.target) && userDropdown && !userDropdown.contains(e.target)) {
            userDropdown.style.display = 'none';
            userProfileBtn.classList.remove('active');
        }
        if (notificationBtn && !notificationBtn.contains(e.target) && notificationPanel && !notificationPanel.contains(e.target)) {
            notificationPanel.style.display = 'none';
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (userDropdown) {
                userDropdown.style.display = 'none';
                if (userProfileBtn) userProfileBtn.classList.remove('active');
            }
            if (notificationPanel) notificationPanel.style.display = 'none';
        }
    });
    
    // Check auth and populate dropdown
    fetch('/auth/check')
        .then(res => res.json())
        .then(data => {
            const userNameDisplay = document.getElementById('userNameDisplay');
            const userDropdown = document.getElementById('userDropdown');
            const userAvatar = document.getElementById('userAvatar');
            
            if (data.authenticated && data.user) {
                // Update display name
                if (userNameDisplay) {
                    userNameDisplay.textContent = data.user.full_name || data.user.username || 'User';
                }
                
                // Update avatar
                if (userAvatar) {
                    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.full_name || data.user.username)}&background=2ecc71&color=fff`;
                }
                
                // Populate dropdown with user menu
                if (userDropdown) {
                    userDropdown.innerHTML = `
                        <div class="dropdown-header">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.full_name || data.user.username)}&background=667eea&color=fff" alt="User">
                            <div class="user-info">
                                <h4>${data.user.full_name || data.user.username}</h4>
                                <p>${data.user.email}</p>
                            </div>
                        </div>
                        <div class="dropdown-body">
                            <a href="/dashboard"><i class="fas fa-chart-pie"></i> Dashboard</a>
                            <a href="/profile"><i class="fas fa-user-circle"></i> My Profile</a>
                            <a href="/settings"><i class="fas fa-cog"></i> Settings</a>
                            <div class="dropdown-divider"></div>
                            <a href="#" onclick="handleLogout(); return false;" class="logout-btn">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </a>
                        </div>
                    `;
                }
            } else {
                // Not logged in
                if (userDropdown) {
                    userDropdown.innerHTML = `
                        <div class="dropdown-header">
                            <i class="fas fa-leaf" style="font-size: 28px;"></i>
                            <div class="user-info">
                                <h4>Welcome!</h4>
                                <p>Sign in to access features</p>
                            </div>
                        </div>
                        <div class="dropdown-body">
                            <a href="/login"><i class="fas fa-sign-in-alt"></i> Login</a>
                            <a href="/register"><i class="fas fa-user-plus"></i> Register</a>
                        </div>
                    `;
                }
            }
        })
        .catch(err => {
            console.log('Auth check failed, showing default');
            const userDropdown = document.getElementById('userDropdown');
            if (userDropdown) {
                userDropdown.innerHTML = `
                    <div class="dropdown-header">
                        <i class="fas fa-leaf" style="font-size: 28px;"></i>
                        <div class="user-info">
                            <h4>PlantDoctor PRO</h4>
                            <p>AI Plant Disease Detection</p>
                        </div>
                    </div>
                    <div class="dropdown-body">
                        <a href="/login"><i class="fas fa-sign-in-alt"></i> Login</a>
                        <a href="/register"><i class="fas fa-user-plus"></i> Register</a>
                    </div>
                `;
            }
        });
});

// Global logout function
async function handleLogout() {
    try {
        await fetch('/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
    }
}

// Make logout available globally
window.handleLogout = handleLogout;
