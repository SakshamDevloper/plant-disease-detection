// ar-viewer.js - Augmented Reality viewer for plant disease visualization

class ARViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.isInitialized = false;
        this.annotations = [];
        this.controls = null;
        
        this.init();
    }
    
    async init() {
        await this.setupScene();
        this.setupLighting();
        this.setupControls();
        this.setupEventListeners();
        this.isInitialized = true;
        
        // Start animation loop
        this.animate();
    }
    
    async setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e14);
        
        // Add fog for depth
        this.scene.fog = new THREE.FogExp2(0x0a0e14, 0.002);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add to container
        const container = document.getElementById('ar-viewer-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        }
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(20, 20, 0x2ecc71, 0x444444);
        this.scene.add(gridHelper);
        
        // Add axes helper (optional)
        // const axesHelper = new THREE.AxesHelper(5);
        // this.scene.add(axesHelper);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(10, 20, 5);
        sunLight.castShadow = true;
        sunLight.receiveShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 50;
        sunLight.shadow.camera.left = -10;
        sunLight.shadow.camera.right = 10;
        sunLight.shadow.camera.top = 10;
        sunLight.shadow.camera.bottom = -10;
        this.scene.add(sunLight);
        
        // Fill light
        const fillLight = new THREE.PointLight(0x4466ff, 0.5);
        fillLight.position.set(-5, 5, 5);
        this.scene.add(fillLight);
        
        // Back light
        const backLight = new THREE.PointLight(0xffaa44, 0.3);
        backLight.position.set(0, 5, -10);
        this.scene.add(backLight);
        
        // Ground reflection light
        const groundLight = new THREE.PointLight(0x44ff66, 0.2);
        groundLight.position.set(0, -2, 0);
        this.scene.add(groundLight);
    }
    
    setupControls() {
        // Orbit controls for interaction
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.0;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 1, 0);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Toggle auto-rotate on user interaction
        this.renderer.domElement.addEventListener('mousedown', () => {
            if (this.controls) {
                this.controls.autoRotate = false;
            }
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            setTimeout(() => {
                if (this.controls) {
                    this.controls.autoRotate = true;
                }
            }, 3000);
        });
    }
    
    async loadPlantModel(plantType, diseaseType = null) {
        // Clear existing model
        if (this.model) {
            this.scene.remove(this.model);
        }
        
        // Create a group for the plant
        this.model = new THREE.Group();
        
        // Create plant based on type
        switch(plantType.toLowerCase()) {
            case 'tomato':
                await this.createTomatoPlant(diseaseType);
                break;
            case 'potato':
                await this.createPotatoPlant(diseaseType);
                break;
            case 'pepper':
                await this.createPepperPlant(diseaseType);
                break;
            default:
                await this.createGenericPlant(diseaseType);
        }
        
        this.scene.add(this.model);
        
        // Add disease visualization if specified
        if (diseaseType) {
            this.visualizeDisease(diseaseType);
        }
    }
    
    async createTomatoPlant(diseaseType) {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2ecc71,
            roughness: 0.7,
            metalness: 0.1
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1.5;
        stem.castShadow = true;
        stem.receiveShadow = true;
        this.model.add(stem);
        
        // Create leaves
        for (let i = 0; i < 6; i++) {
            const leaf = this.createLeaf(0x27ae60);
            leaf.position.y = 1 + i * 0.5;
            leaf.rotation.y = (i * Math.PI) / 3;
            leaf.rotation.z = 0.3;
            leaf.rotation.x = 0.2;
            this.model.add(leaf);
        }
        
        // Create tomatoes
        for (let i = 0; i < 3; i++) {
            const tomato = this.createTomato();
            tomato.position.y = 1.2 + i * 0.6;
            tomato.position.x = 0.8 * Math.sin(i * 2);
            tomato.position.z = 0.8 * Math.cos(i * 2);
            this.model.add(tomato);
        }
    }
    
    async createPotatoPlant(diseaseType) {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.12, 0.18, 2.5, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x558b2f });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1.25;
        stem.castShadow = true;
        stem.receiveShadow = true;
        this.model.add(stem);
        
        // Create leaves
        for (let i = 0; i < 5; i++) {
            const leaf = this.createLeaf(0x689f38, 0.8);
            leaf.position.y = 0.8 + i * 0.5;
            leaf.rotation.y = (i * Math.PI * 2) / 5;
            leaf.rotation.z = 0.4;
            this.model.add(leaf);
        }
        
        // Create potatoes underground
        for (let i = 0; i < 4; i++) {
            const potato = this.createPotato();
            potato.position.y = -0.2;
            potato.position.x = 0.5 * Math.sin(i * 1.5);
            potato.position.z = 0.5 * Math.cos(i * 1.5);
            this.model.add(potato);
        }
    }
    
    async createPepperPlant(diseaseType) {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x33691e });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1;
        stem.castShadow = true;
        stem.receiveShadow = true;
        this.model.add(stem);
        
        // Create leaves
        for (let i = 0; i < 4; i++) {
            const leaf = this.createLeaf(0x43a047);
            leaf.position.y = 0.6 + i * 0.4;
            leaf.rotation.y = (i * Math.PI) / 2;
            this.model.add(leaf);
        }
        
        // Create peppers
        for (let i = 0; i < 2; i++) {
            const pepper = this.createPepper();
            pepper.position.y = 1 + i * 0.5;
            pepper.position.x = 0.6;
            pepper.rotation.z = 0.3;
            this.model.add(pepper);
        }
    }
    
    async createGenericPlant(diseaseType) {
        // Simple generic plant
        const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1;
        stem.castShadow = true;
        stem.receiveShadow = true;
        this.model.add(stem);
        
        for (let i = 0; i < 4; i++) {
            const leaf = this.createLeaf(0x66bb6a);
            leaf.position.y = 0.7 + i * 0.4;
            leaf.rotation.y = (i * Math.PI) / 2;
            this.model.add(leaf);
        }
    }
    
    createLeaf(color = 0x4caf50, size = 1) {
        const group = new THREE.Group();
        
        // Leaf shape
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.bezierCurveTo(0.5, 0.2, 0.8, 0.5, 0, 1);
        shape.bezierCurveTo(-0.8, 0.5, -0.5, 0.2, 0, 0);
        
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            side: THREE.DoubleSide,
            roughness: 0.6,
            metalness: 0.1
        });
        
        const leaf = new THREE.Mesh(geometry, material);
        leaf.scale.set(size, size, size);
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        
        // Add vein
        const veinGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
        const veinMaterial = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
        const vein = new THREE.Mesh(veinGeometry, veinMaterial);
        vein.rotation.z = Math.PI / 2;
        vein.position.y = 0.5;
        leaf.add(vein);
        
        group.add(leaf);
        
        return group;
    }
    
    createTomato() {
        const geometry = new THREE.SphereGeometry(0.25, 32, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xe53935,
            roughness: 0.3,
            metalness: 0.1,
            emissive: new THREE.Color(0x330000)
        });
        const tomato = new THREE.Mesh(geometry, material);
        tomato.castShadow = true;
        tomato.receiveShadow = true;
        
        // Add stem
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.3;
        tomato.add(stem);
        
        return tomato;
    }
    
    createPotato() {
        const geometry = new THREE.SphereGeometry(0.2, 24, 12);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xc8a35b,
            roughness: 0.8,
            metalness: 0.05
        });
        const potato = new THREE.Mesh(geometry, material);
        potato.scale.set(1.2, 0.9, 0.8);
        potato.castShadow = true;
        potato.receiveShadow = true;
        
        return potato;
    }
    
    createPepper() {
        const geometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xf44336,
            roughness: 0.4,
            metalness: 0.1
        });
        const pepper = new THREE.Mesh(geometry, material);
        pepper.rotation.x = Math.PI / 2;
        pepper.castShadow = true;
        pepper.receiveShadow = true;
        
        return pepper;
    }
    
    visualizeDisease(diseaseType) {
        // Clear existing disease visualizations
        this.clearDiseaseVisualizations();
        
        // Add disease spots/effects based on type
        const diseaseGroup = new THREE.Group();
        diseaseGroup.name = 'disease-visualization';
        
        switch(diseaseType.toLowerCase()) {
            case 'late blight':
                this.addLateBlightEffects(diseaseGroup);
                break;
            case 'early blight':
                this.addEarlyBlightEffects(diseaseGroup);
                break;
            case 'leaf mold':
                this.addLeafMoldEffects(diseaseGroup);
                break;
            case 'powdery mildew':
                this.addPowderyMildewEffects(diseaseGroup);
                break;
        }
        
        this.model.add(diseaseGroup);
    }
    
    addLateBlightEffects(group) {
        // Add brown spots to leaves
        for (let i = 0; i < 20; i++) {
            const spotGeometry = new THREE.SphereGeometry(0.05, 8);
            const spotMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x5d4037,
                transparent: true,
                opacity: 0.7
            });
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            
            // Position randomly on leaves
            spot.position.set(
                (Math.random() - 0.5) * 2,
                1 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            group.add(spot);
        }
        
        // Add white fuzzy growth particles
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 3;
            positions[i + 1] = 1 + Math.random() * 2.5;
            positions[i + 2] = (Math.random() - 0.5) * 3;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xeeeeee,
            size: 0.03,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
    }
    
    addEarlyBlightEffects(group) {
        // Add concentric ring spots
        for (let i = 0; i < 15; i++) {
            const spotGroup = new THREE.Group();
            
            for (let j = 0; j < 3; j++) {
                const ringGeometry = new THREE.TorusGeometry(0.08 + j * 0.03, 0.01, 8, 20);
                const ringMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8d6e63,
                    transparent: true,
                    opacity: 0.5 + j * 0.1
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                spotGroup.add(ring);
            }
            
            spotGroup.position.set(
                (Math.random() - 0.5) * 2,
                0.8 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            group.add(spotGroup);
        }
    }
    
    addLeafMoldEffects(group) {
        // Add purple/gray mold patches
        for (let i = 0; i < 12; i++) {
            const moldGeometry = new THREE.PlaneGeometry(0.3, 0.2);
            const moldMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x7b1fa2,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const mold = new THREE.Mesh(moldGeometry, moldMaterial);
            
            mold.position.set(
                (Math.random() - 0.5) * 1.5,
                1.2 + Math.random() * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            mold.rotation.y = Math.random() * Math.PI;
            mold.rotation.x = Math.random() * 0.5;
            
            group.add(mold);
        }
    }
    
    addPowderyMildewEffects(group) {
        // Add white powder coating
        const powderCount = 30;
        
        for (let i = 0; i < powderCount; i++) {
            const powderGeometry = new THREE.SphereGeometry(0.04, 4);
            const powderMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xf5f5f5,
                transparent: true,
                opacity: 0.5,
                roughness: 0.9
            });
            const powder = new THREE.Mesh(powderGeometry, powderMaterial);
            
            powder.position.set(
                (Math.random() - 0.5) * 2.5,
                1 + Math.random() * 2,
                (Math.random() - 0.5) * 2.5
            );
            
            group.add(powder);
        }
    }
    
    clearDiseaseVisualizations() {
        if (this.model) {
            const existing = this.model.getObjectByName('disease-visualization');
            if (existing) {
                this.model.remove(existing);
            }
        }
    }
    
    addAnnotation(text, position, color = 0xff5722) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border
        context.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.lineWidth = 3;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Draw text
        context.font = 'Bold 20px Plus Jakarta Sans';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Word wrap
        const words = text.split(' ');
        const lines = [];
        let line = '';
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = context.measureText(testLine);
            
            if (metrics.width > canvas.width - 40) {
                lines.push(line);
                line = word + ' ';
            } else {
                line = testLine;
            }
        });
        lines.push(line);
        
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, canvas.height / 2 - 20 + index * 25);
        });
        
        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(position);
        sprite.scale.set(1.5, 0.75, 1);
        
        this.scene.add(sprite);
        this.annotations.push(sprite);
        
        return sprite;
    }
    
    clearAnnotations() {
        this.annotations.forEach(annotation => {
            this.scene.remove(annotation);
        });
        this.annotations = [];
    }
    
    takeScreenshot() {
        this.renderer.render(this.scene, this.camera);
        return this.renderer.domElement.toDataURL('image/png');
    }
    
    startRecording(duration = 10) {
        const chunks = [];
        const stream = this.renderer.domElement.captureStream(30);
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `plant-ar-${Date.now()}.webm`;
            a.click();
            
            URL.revokeObjectURL(url);
        };
        
        recorder.start();
        setTimeout(() => recorder.stop(), duration * 1000);
        
        return recorder;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate disease particles if present
        if (this.model) {
            const diseaseGroup = this.model.getObjectByName('disease-visualization');
            if (diseaseGroup) {
                diseaseGroup.children.forEach((child, index) => {
                    if (child.isPoints) {
                        child.rotation.y += 0.001;
                    }
                });
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
        
        this.clearAnnotations();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        this.isInitialized = false;
    }
}

// AR Viewer UI Controller
class ARViewerController {
    constructor() {
        this.viewer = null;
        this.container = null;
        this.currentPlant = 'tomato';
        this.currentDisease = null;
        
        this.init();
    }
    
    init() {
        this.container = document.getElementById('ar-viewer-container');
        if (!this.container) return;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Create control panel
        const panel = document.createElement('div');
        panel.className = 'ar-control-panel';
        panel.innerHTML = `
            <div class="ar-panel-header">
                <h3><i class="fas fa-cube"></i> AR Plant Viewer</h3>
                <button class="ar-close-btn">&times;</button>
            </div>
            <div class="ar-panel-body">
                <div class="ar-control-group">
                    <label>Plant Type</label>
                    <select id="ar-plant-select">
                        <option value="tomato">Tomato</option>
                        <option value="potato">Potato</option>
                        <option value="pepper">Pepper</option>
                    </select>
                </div>
                <div class="ar-control-group">
                    <label>Disease Simulation</label>
                    <select id="ar-disease-select">
                        <option value="">None (Healthy)</option>
                        <option value="late blight">Late Blight</option>
                        <option value="early blight">Early Blight</option>
                        <option value="leaf mold">Leaf Mold</option>
                        <option value="powdery mildew">Powdery Mildew</option>
                    </select>
                </div>
                <div class="ar-control-group">
                    <label>View Options</label>
                    <label class="ar-checkbox">
                        <input type="checkbox" id="ar-auto-rotate" checked> Auto Rotate
                    </label>
                    <label class="ar-checkbox">
                        <input type="checkbox" id="ar-show-grid" checked> Show Grid
                    </label>
                    <label class="ar-checkbox">
                        <input type="checkbox" id="ar-show-labels"> Show Labels
                    </label>
                </div>
                <div class="ar-control-actions">
                    <button class="ar-btn" id="ar-screenshot-btn">
                        <i class="fas fa-camera"></i> Screenshot
                    </button>
                    <button class="ar-btn" id="ar-record-btn">
                        <i class="fas fa-video"></i> Record
                    </button>
                    <button class="ar-btn" id="ar-reset-btn">
                        <i class="fas fa-undo"></i> Reset View
                    </button>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);
        
        // Style the panel
        const style = document.createElement('style');
        style.textContent = `
            .ar-control-panel {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 300px;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                box-shadow: var(--glass-shadow);
                border: 1px solid var(--glass-border);
                overflow: hidden;
                z-index: 100;
            }
            
            .ar-panel-header {
                padding: 15px 20px;
                background: var(--primary-gradient);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ar-panel-header h3 {
                margin: 0;
                font-size: 1.1rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .ar-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            .ar-panel-body {
                padding: 20px;
            }
            
            .ar-control-group {
                margin-bottom: 20px;
            }
            
            .ar-control-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--text-primary);
            }
            
            .ar-control-group select {
                width: 100%;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid var(--border-color);
                background: var(--input-bg);
                color: var(--text-primary);
            }
            
            .ar-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                cursor: pointer;
            }
            
            .ar-checkbox input {
                width: auto;
            }
            
            .ar-control-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .ar-btn {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 8px;
                background: var(--primary-gradient);
                color: white;
                cursor: pointer;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                transition: transform 0.2s ease;
            }
            
            .ar-btn:hover {
                transform: translateY(-2px);
            }
            
            .ar-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 1.2rem;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Initialize viewer button
        document.getElementById('viewInARBtn')?.addEventListener('click', () => {
            this.openViewer();
        });
        
        // Plant selection
        document.getElementById('ar-plant-select')?.addEventListener('change', (e) => {
            this.currentPlant = e.target.value;
            this.updateModel();
        });
        
        // Disease selection
        document.getElementById('ar-disease-select')?.addEventListener('change', (e) => {
            this.currentDisease = e.target.value || null;
            this.updateModel();
        });
        
        // Auto-rotate toggle
        document.getElementById('ar-auto-rotate')?.addEventListener('change', (e) => {
            if (this.viewer && this.viewer.controls) {
                this.viewer.controls.autoRotate = e.target.checked;
            }
        });
        
        // Grid toggle
        document.getElementById('ar-show-grid')?.addEventListener('change', (e) => {
            if (this.viewer) {
                const grid = this.viewer.scene.children.find(c => c.isGridHelper);
                if (grid) grid.visible = e.target.checked;
            }
        });
        
        // Screenshot button
        document.getElementById('ar-screenshot-btn')?.addEventListener('click', () => {
            if (this.viewer) {
                const screenshot = this.viewer.takeScreenshot();
                const link = document.createElement('a');
                link.download = `plant-ar-${Date.now()}.png`;
                link.href = screenshot;
                link.click();
            }
        });
        
        // Record button
        document.getElementById('ar-record-btn')?.addEventListener('click', () => {
            if (this.viewer) {
                this.viewer.startRecording(5);
                this.showNotification('Recording 5 seconds...');
            }
        });
        
        // Reset view button
        document.getElementById('ar-reset-btn')?.addEventListener('click', () => {
            if (this.viewer && this.viewer.camera && this.viewer.controls) {
                this.viewer.camera.position.set(5, 3, 10);
                this.viewer.controls.target.set(0, 1, 0);
                this.viewer.controls.update();
            }
        });
        
        // Close button
        document.querySelector('.ar-close-btn')?.addEventListener('click', () => {
            this.closeViewer();
        });
    }
    
    openViewer() {
        if (!this.viewer) {
            this.viewer = new ARViewer();
        }
        
        this.container.style.display = 'block';
        this.updateModel();
    }
    
    closeViewer() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
        }
        this.container.style.display = 'none';
    }
    
    async updateModel() {
        if (!this.viewer || !this.viewer.isInitialized) return;
        
        await this.viewer.loadPlantModel(this.currentPlant, this.currentDisease);
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'ar-notification';
        notification.textContent = message;
        this.container.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize AR Viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.arViewerController = new ARViewerController();
});