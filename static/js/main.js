// PlantDoctor AI - Fixed main.js with working dark mode and animations
// Socket.IO mock
const socket = {
    on: function() { return this; },
    emit: function() { return this; },
    connect: function() { return this; },
    disconnect: function() { return this; }
};

if (typeof io === 'undefined') {
    window.io = function() { return socket; };
}

class PlantDoctorApp {
    constructor() {
        this.socket = socket;
        this.currentSection = 'dashboard';
        this.userData = null;
        this.analyses = [];
        this.map = null;
        this.charts = {};
        this.selectedFiles = null;
        this.currentDisease = null;
        
        this.init();
    }
    
    async init() {
        this.loadTheme(); // Load saved theme first
        this.setupEventListeners();
        this.initializeThreeJS();
        await this.loadUserData();
        this.initializeCharts();
        this.setupVoiceAssistant();
        this.updateGreeting();
        this.loadNotifications();
        this.setupHoverAnimations(); // Add hover animations
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        localStorage.setItem('theme', newTheme);
        this.updateChartsTheme();
        this.showNotification(`Switched to ${newTheme} mode`, 'success');
    }
    
    updateChartsTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e8edf2' : '#2c3e50';
        
        if (this.charts.disease) {
            this.charts.disease.options.plugins.legend.labels.color = textColor;
            this.charts.disease.update();
        }
        if (this.charts.accuracy) {
            if (this.charts.accuracy.options.scales) {
                this.charts.accuracy.options.scales.x.ticks = { color: textColor };
                this.charts.accuracy.options.scales.y.ticks = { color: textColor };
            }
            this.charts.accuracy.update();
        }
    }
    
    setupHoverAnimations() {
        // Add smooth hover effects to cards
        const cards = document.querySelectorAll('.stat-card, .chart-card, .learn-card, .video-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            });
        });
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) this.switchSection(section);
            });
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // File upload
        const uploadArea = document.getElementById('uploadAreaEnhanced');
        const fileInput = document.getElementById('fileInput');
        const selectFileBtn = document.getElementById('selectFileBtn');
        
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#2ecc71';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#ddd';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#ddd';
                const files = e.dataTransfer.files;
                if (files.length > 0) this.handleFileSelect(files);
            });
        }
        
        if (selectFileBtn && fileInput) {
            selectFileBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        }
        
        // Analysis button
        const startBtn = document.getElementById('startAnalysisBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startAnalysis());
        }
        
        // Location button
        const locationBtn = document.getElementById('useLocationBtn');
        if (locationBtn) {
            locationBtn.addEventListener('click', () => this.getCurrentLocation());
        }
        
        // Chat assistant
        const assistantAvatar = document.getElementById('assistantAvatar');
        if (assistantAvatar) {
            assistantAvatar.addEventListener('click', () => this.toggleChat());
        }
        
        const sendMessageBtn = document.getElementById('sendMessage');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => this.sendChatMessage());
        }
        
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }
        
        // Close chat
        const closeChat = document.querySelector('.close-chat');
        if (closeChat) {
            closeChat.addEventListener('click', () => {
                document.getElementById('assistantChat').style.display = 'none';
            });
        }
        
        // FAB
        const fabMain = document.getElementById('fabMain');
        if (fabMain) {
            fabMain.addEventListener('click', () => this.toggleFab());
        }
        
        document.querySelectorAll('.fab-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'analyze') this.switchSection('analyze');
                this.toggleFab();
            });
        });
        
        // Notification
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.toggleNotificationPanel());
        }
        
        // Tab buttons
        document.querySelectorAll('.tab-btn-enhanced').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // User profile dropdown
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                userProfile.classList.toggle('active');
            });
            
            document.addEventListener('click', () => {
                userProfile.classList.remove('active');
            });
        }
    }
    
    handleFileSelect(files) {
        if (!files || files.length === 0) return;
        
        this.selectedFiles = files;
        const file = files[0];
        
        const preview = document.getElementById('uploadPreview');
        const previewGrid = document.getElementById('previewGrid');
        
        if (preview && previewGrid) {
            preview.style.display = 'block';
            previewGrid.innerHTML = '';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width:100px;height:100px;object-fit:cover;border-radius:8px;margin:5px;';
                previewGrid.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
        
        const uploadZone = document.querySelector('.upload-zone');
        if (uploadZone) uploadZone.style.display = 'none';
        
        const startBtn = document.getElementById('startAnalysisBtn');
        if (startBtn) startBtn.disabled = false;
        
        this.showNotification('Image ready for analysis', 'success');
    }
    
    async startAnalysis() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.showNotification('Please select an image first', 'warning');
            return;
        }
        
        const uploadAdvanced = document.querySelector('.upload-advanced');
        const analysisProgress = document.getElementById('analysisProgress');
        
        if (uploadAdvanced) uploadAdvanced.style.display = 'none';
        if (analysisProgress) analysisProgress.style.display = 'block';
        
        const formData = new FormData();
        formData.append('file', this.selectedFiles[0]);
        
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.displayResults(data);
            } else {
                this.showNotification(data.error || 'Analysis failed', 'error');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showNotification('Error connecting to server', 'error');
        } finally {
            if (analysisProgress) analysisProgress.style.display = 'none';
        }
    }
    
    displayResults(data) {
        const resultsSection = document.getElementById('resultsEnhanced');
        if (!resultsSection) return;
        
        resultsSection.style.display = 'block';
        
        // Update basic info
        if (document.getElementById('diseaseTitle')) 
            document.getElementById('diseaseTitle').textContent = data.disease_name || 'Unknown';
        if (document.getElementById('confidenceValue')) 
            document.getElementById('confidenceValue').textContent = `${data.confidence || 0}%`;
        if (document.getElementById('resultImage')) 
            document.getElementById('resultImage').src = data.image_url || '';
        if (document.getElementById('diseaseDescription')) 
            document.getElementById('diseaseDescription').textContent = data.description || '';
        
        // Update lists
        this.updateList('symptomsList', data.symptoms || []);
        this.updateList('treatment', data.treatment || []);
        this.updateList('prevention', data.prevention || []);
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        this.showNotification('Analysis complete!', 'success');
    }
    
    updateList(elementId, items) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.innerHTML = items.map(item => `<li>${item}</li>`).join('');
    }
    
    initializeCharts() {
        const diseaseCtx = document.getElementById('diseaseChart');
        if (diseaseCtx) {
            this.charts.disease = new Chart(diseaseCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Late Blight', 'Early Blight', 'Leaf Mold', 'Healthy', 'Other'],
                    datasets: [{
                        data: [35, 25, 15, 20, 5],
                        backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#2ecc71', '#95a5a6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
        
        const accuracyCtx = document.getElementById('accuracyChart');
        if (accuracyCtx) {
            this.charts.accuracy = new Chart(accuracyCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Model Accuracy',
                        data: [88, 90, 92, 91, 94, 95],
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { min: 80, max: 100 } }
                }
            });
        }
    }
    
    async loadUserData() {
        try {
            const response = await fetch('/api/user-data');
            if (!response.ok) throw new Error('API not available');
            
            const data = await response.json();
            this.userData = data;
            
            if (document.getElementById('userName')) 
                document.getElementById('userName').textContent = data.name || 'Gardener';
            if (document.getElementById('totalAnalyses')) 
                document.getElementById('totalAnalyses').textContent = data.total_analyses || 120;
            if (document.getElementById('healthyPlants')) 
                document.getElementById('healthyPlants').textContent = data.healthy_plants || 78;
            if (document.getElementById('diseasesDetected')) 
                document.getElementById('diseasesDetected').textContent = data.diseases_detected || 42;
        } catch (error) {
            console.log('Using default dashboard data');
            if (document.getElementById('userName')) 
                document.getElementById('userName').textContent = 'Gardener';
            if (document.getElementById('totalAnalyses')) 
                document.getElementById('totalAnalyses').textContent = '120';
            if (document.getElementById('healthyPlants')) 
                document.getElementById('healthyPlants').textContent = '78';
            if (document.getElementById('diseasesDetected')) 
                document.getElementById('diseasesDetected').textContent = '42';
        }
    }
    
    switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) target.classList.add('active');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });
        
        this.currentSection = sectionId;
        
        if (sectionId === 'map') setTimeout(() => this.initializeMap(), 100);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn-enhanced').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content-enhanced').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }
    
    toggleChat() {
        const chat = document.getElementById('assistantChat');
        if (chat) chat.style.display = chat.style.display === 'none' ? 'block' : 'none';
    }
    
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        this.addChatMessage(message, 'user');
        input.value = '';
        
        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: message })
            });
            const data = await response.json();
            this.addChatMessage(data.response || 'How can I help with your plants?', 'bot');
        } catch (error) {
            this.addChatMessage('Upload a photo for disease analysis!', 'bot');
        }
    }
    
    addChatMessage(message, type) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = message;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    updateGreeting() {
        const hour = new Date().getHours();
        const greeting = document.getElementById('greetingMessage');
        if (!greeting) return;
        
        if (hour < 12) greeting.textContent = 'Good morning! Ready to check on your plants? 🌅';
        else if (hour < 18) greeting.textContent = 'Good afternoon! Time for a plant health check? ☀️';
        else greeting.textContent = 'Good evening! Let\'s ensure your plants are healthy for tomorrow! 🌙';
    }
    
    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed;top:20px;right:20px;padding:15px 20px;
            background:${type==='error'?'#e74c3c':type==='success'?'#2ecc71':'#3498db'};
            color:white;border-radius:8px;z-index:10000;
            box-shadow:0 4px 12px rgba(0,0,0,0.15);
            animation:slideIn 0.3s ease;
        `;
        toast.innerHTML = `${message} <button style="background:none;border:none;color:white;margin-left:15px;cursor:pointer;" onclick="this.parentElement.remove()">×</button>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
    
    toggleFab() {
        document.querySelector('.fab-container')?.classList.toggle('active');
    }
    
    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
    
    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const input = document.getElementById('locationInput');
                    if (input) input.value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                    this.showNotification('Location detected!', 'success');
                },
                () => this.showNotification('Could not get location', 'error')
            );
        }
    }
    
    initializeMap() {
        const mapEl = document.getElementById('diseaseMap');
        if (!mapEl || this.map || typeof L === 'undefined') return;
        
        this.map = L.map('diseaseMap').setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.map);
        
        L.circleMarker([28.6139, 77.2090], { radius: 8, fillColor: '#e74c3c', color: '#fff', weight: 2, fillOpacity: 0.8 })
            .bindPopup('<strong>Late Blight</strong><br>Severity: Critical').addTo(this.map);
        L.circleMarker([19.0760, 72.8777], { radius: 8, fillColor: '#f39c12', color: '#fff', weight: 2, fillOpacity: 0.8 })
            .bindPopup('<strong>Early Blight</strong><br>Severity: Moderate').addTo(this.map);
    }
    
    initializeThreeJS() {
        const container = document.getElementById('particle-background');
        if (!container || typeof THREE === 'undefined') return;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        
        const geometry = new THREE.BufferGeometry();
        const count = 2000;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            pos[i] = (Math.random() - 0.5) * 15;
            pos[i+1] = (Math.random() - 0.5) * 15;
            pos[i+2] = (Math.random() - 0.5) * 15;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        
        const material = new THREE.PointsMaterial({ 
            size: 0.02, 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const points = new THREE.Points(geometry, material);
        scene.add(points);
        
        camera.position.z = 8;
        
        const animate = () => {
            requestAnimationFrame(animate);
            points.rotation.y += 0.0003;
            points.rotation.x += 0.0001;
            renderer.render(scene, camera);
        };
        animate();
        
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupVoiceAssistant() {}
    loadNotifications() {}
    loadHistory() {}
    loadCommunityPosts() {}
    openOutbreakReport() {}
    getAnalysisOptions() { return {}; }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PlantDoctorApp();
});

// Add slideIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .stat-card, .chart-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease !important;
    }
`;
document.head.appendChild(style);
// Notification Panel Toggle
document.addEventListener('DOMContentLoaded', function() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const userDropdown = document.getElementById('userDropdown');
    
    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = notificationPanel.style.display === 'block';
            
            // Close user dropdown if open
            if (userDropdown) {
                userDropdown.style.display = 'none';
                const userBtn = document.getElementById('userProfileBtn');
                if (userBtn) userBtn.classList.remove('active');
            }
            
            notificationPanel.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationBtn.contains(e.target) && !notificationPanel.contains(e.target)) {
                notificationPanel.style.display = 'none';
            }
        });
    }
});

// Section Switching Function
function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the corresponding nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
            link.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Initialize map if switching to map section
    if (sectionId === 'map') {
        setTimeout(() => {
            if (window.app && window.app.initializeMap) {
                window.app.initializeMap();
            }
        }, 100);
    }
}

// Make switchSection available globally
window.switchSection = switchSection;

// Fix navigation links on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update nav links to use switchSection
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const sectionId = href.substring(1);
            link.setAttribute('href', '#');
            link.setAttribute('onclick', `switchSection('${sectionId}'); return false;`);
        }
    });
    
    // Ensure only dashboard is visible initially
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'dashboard') {
            section.classList.remove('active');
        } else {
            section.classList.add('active');
        }
    });
});

// Populate History Section with sample data
function loadHistory() {
    const historyGrid = document.getElementById('historyGrid');
    if (!historyGrid) return;
    
    const sampleHistory = [
        { plant: 'Tomato', disease: 'Early Blight', date: '2026-04-19', confidence: 94, status: 'disease' },
        { plant: 'Potato', disease: 'Healthy', date: '2026-04-18', confidence: 97, status: 'healthy' },
        { plant: 'Apple', disease: 'Apple Scab', date: '2026-04-17', confidence: 88, status: 'disease' },
        { plant: 'Corn', disease: 'Common Rust', date: '2026-04-16', confidence: 91, status: 'warning' },
        { plant: 'Grape', disease: 'Healthy', date: '2026-04-15', confidence: 96, status: 'healthy' },
    ];
    
    historyGrid.innerHTML = sampleHistory.map(item => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-icon ${item.status}">
                    <i class="fas fa-${item.status === 'healthy' ? 'check-circle' : 'exclamation-circle'}"></i>
                </div>
                <div class="history-details">
                    <h4>${item.plant} - ${item.disease}</h4>
                    <p>${item.date}</p>
                </div>
            </div>
            <div class="history-confidence">
                <div class="confidence-value">${item.confidence}%</div>
                <div class="confidence-label">Confidence</div>
            </div>
        </div>
    `).join('');
}

// Call on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadHistory, 500);
});

// Populate History Section with sample data
function loadHistory() {
    const historyGrid = document.getElementById('historyGrid');
    if (!historyGrid) return;
    
    const sampleHistory = [
        { plant: 'Tomato', disease: 'Early Blight', date: '2026-04-19', confidence: 94, status: 'disease' },
        { plant: 'Potato', disease: 'Healthy', date: '2026-04-18', confidence: 97, status: 'healthy' },
        { plant: 'Apple', disease: 'Apple Scab', date: '2026-04-17', confidence: 88, status: 'disease' },
        { plant: 'Corn', disease: 'Common Rust', date: '2026-04-16', confidence: 91, status: 'warning' },
        { plant: 'Grape', disease: 'Healthy', date: '2026-04-15', confidence: 96, status: 'healthy' },
    ];
    
    historyGrid.innerHTML = sampleHistory.map(item => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-icon ${item.status}">
                    <i class="fas fa-${item.status === 'healthy' ? 'check-circle' : 'exclamation-circle'}"></i>
                </div>
                <div class="history-details">
                    <h4>${item.plant} - ${item.disease}</h4>
                    <p>${item.date}</p>
                </div>
            </div>
            <div class="history-confidence">
                <div class="confidence-value">${item.confidence}%</div>
                <div class="confidence-label">Confidence</div>
            </div>
        </div>
    `).join('');
}

// Call on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadHistory, 500);
});

// Fix Dashboard Charts
function initializeCharts() {
    // Disease Distribution Chart
    const diseaseCtx = document.getElementById('diseaseChart');
    if (diseaseCtx) {
        new Chart(diseaseCtx, {
            type: 'doughnut',
            data: {
                labels: ['Late Blight', 'Early Blight', 'Leaf Mold', 'Powdery Mildew', 'Healthy', 'Other'],
                datasets: [{
                    data: [28, 22, 15, 12, 18, 5],
                    backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#2ecc71', '#95a5a6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Accuracy Trend Chart
    const accuracyCtx = document.getElementById('accuracyChart');
    if (accuracyCtx) {
        new Chart(accuracyCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Model Accuracy',
                    data: [88, 90, 92, 91, 94, 95, 96, 95, 97, 96, 98, 97],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 80, max: 100 }
                }
            }
        });
    }
}

// Call charts initialization
if (document.getElementById('diseaseChart')) {
    initializeCharts();
}
