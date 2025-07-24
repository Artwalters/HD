/**
 * 3D Carousel Component
 * Circulaire 3D carousel met swipe en scroll functionaliteit
 */

class Carousel3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = this.container.querySelector('.carousel-3d-canvas');
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cards = [];
        this.cardGeometry = null;
        this.cardMaterials = [];
        
        // Carousel properties
        this.radius = 300;
        this.cardCount = 8;
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.isInteracting = false;
        
        // Touch/Mouse interaction
        this.lastPointerX = 0;
        this.velocity = 0;
        this.damping = 0.95;
        
        this.init();
    }
    
    init() {
        this.setupThreeJS();
        this.createCards();
        this.setupEventListeners();
        this.animate();
        
        console.log('🎠 3D Carousel initialized');
    }
    
    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.canvas.clientWidth / this.canvas.clientHeight,
            1,
            2000
        );
        this.camera.position.set(0, 0, 800);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0xffffff, 0);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(200, 200, 200);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }
    
    createCards() {
        // Card geometry
        this.cardGeometry = new THREE.PlaneGeometry(120, 150);
        
        // Card colors (verschillende kleuren voor visual effect)
        const colors = [
            0x4B83F2, // Blauw
            0x27AE60, // Groen
            0x9932CC, // Paars
            0xFF6B6B, // Rood
            0x4ECDC4, // Turquoise
            0xFFE66D, // Geel
            0xE74C3C, // Donkerrood
            0x3498DB  // Lichtblauw
        ];
        
        for (let i = 0; i < this.cardCount; i++) {
            // Material
            const material = new THREE.MeshLambertMaterial({
                color: colors[i],
                transparent: true,
                opacity: 0.9
            });
            this.cardMaterials.push(material);
            
            // Mesh
            const card = new THREE.Mesh(this.cardGeometry, material);
            
            // Position in circle
            const angle = (i / this.cardCount) * Math.PI * 2;
            card.position.x = Math.cos(angle) * this.radius;
            card.position.z = Math.sin(angle) * this.radius;
            card.position.y = 0;
            
            // Rotate to face center
            card.lookAt(0, 0, 0);
            
            // Add subtle animation offset
            card.userData = {
                originalY: 0,
                index: i,
                angle: angle
            };
            
            this.cards.push(card);
            this.scene.add(card);
        }
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onPointerStart.bind(this));
        this.canvas.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onPointerEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.onPointerEnd.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.onPointerStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('touchend', this.onPointerEnd.bind(this));
        
        // Wheel event for scroll
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        
        // Resize
        window.addEventListener('resize', this.onResize.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onPointerStart(event) {
        this.isInteracting = true;
        this.velocity = 0;
        
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        this.lastPointerX = clientX;
        
        this.container.style.cursor = 'grabbing';
    }
    
    onPointerMove(event) {
        if (!this.isInteracting) return;
        
        event.preventDefault();
        
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const deltaX = clientX - this.lastPointerX;
        
        // Convert to rotation (reverse direction)
        const rotationDelta = -(deltaX / this.canvas.clientWidth) * Math.PI * 0.5;
        this.targetRotation += rotationDelta;
        this.velocity = rotationDelta * 0.1;
        
        this.lastPointerX = clientX;
    }
    
    onPointerEnd() {
        this.isInteracting = false;
        this.container.style.cursor = 'grab';
    }
    
    onWheel(event) {
        event.preventDefault();
        
        const delta = -event.deltaY * 0.001;
        this.targetRotation += delta;
        this.velocity = delta * 0.1;
    }
    
    onResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Smooth rotation interpolation
        if (!this.isInteracting) {
            this.velocity *= this.damping;
            this.targetRotation += this.velocity;
        }
        
        // Lerp current rotation to target
        this.currentRotation += (this.targetRotation - this.currentRotation) * 0.05;
        
        // Update card positions
        this.updateCards();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateCards() {
        this.cards.forEach((card, index) => {
            // Base angle + rotation
            const angle = card.userData.angle + this.currentRotation;
            
            // Position in circle
            card.position.x = Math.cos(angle) * this.radius;
            card.position.z = Math.sin(angle) * this.radius;
            
            // Subtle floating animation
            const time = Date.now() * 0.001;
            card.position.y = Math.sin(time + index * 0.5) * 10;
            
            // Face center
            card.lookAt(0, 0, 0);
            
            // Scale based on distance from camera (depth effect)
            const distanceFromFront = Math.abs(card.position.z);
            const scale = Math.max(0.6, 1 - (distanceFromFront / this.radius) * 0.3);
            card.scale.setScalar(scale);
            
            // Opacity based on position
            const opacity = Math.max(0.3, 1 - (distanceFromFront / this.radius) * 0.6);
            card.material.opacity = opacity;
        });
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure canvas is properly sized
    setTimeout(() => {
        if (document.getElementById('carousel-3d')) {
            window.carousel3D = new Carousel3D('carousel-3d');
        }
    }, 100);
});