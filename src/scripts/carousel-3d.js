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
        
        // Responsive properties
        this.getResponsiveSettings();
        
        // Carousel properties
        this.cardCount = 12; // More cards
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.isInteracting = false;
        
        // Touch/Mouse interaction
        this.lastPointerX = 0;
        this.velocity = 0;
        this.damping = 0.95;
        
        // Snapping
        this.snapThreshold = 0.01; // When to start snapping
        this.snapStrength = 0.1; // How strong the snap is
        
        // Camera zoom states (initialized after responsive settings)
        this.updateZoomStates();
        this.isZoomAnimating = false;
        
        // Zoom is nu altijd simpel - geen drag tracking nodig
        
        this.init();
    }
    
    getResponsiveSettings() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = screenWidth / screenHeight;
        
        // Mobile Portrait
        if (screenWidth <= 480) {
            this.radius = 180;
            this.cardWidth = 80;
            this.cardHeight = 100;
            this.cameraDistance = 35;
            this.fov = 50;
        }
        // Mobile Landscape & Small Tablets
        else if (screenWidth <= 767) {
            this.radius = 220;
            this.cardWidth = 100;
            this.cardHeight = 125;
            this.cameraDistance = 40;
            this.fov = 48;
        }
        // Tablet Portrait
        else if (screenWidth <= 991) {
            this.radius = 250;
            this.cardWidth = 120;
            this.cardHeight = 150;
            this.cameraDistance = 45;
            this.fov = 46;
        }
        // Tablet Landscape & Small Desktop
        else if (screenWidth <= 1199) {
            this.radius = 270;
            this.cardWidth = 140;
            this.cardHeight = 170;
            this.cameraDistance = 48;
            this.fov = 45;
        }
        // Desktop & Large Screens
        else {
            this.radius = 280;
            this.cardWidth = 150;
            this.cardHeight = 180;
            this.cameraDistance = 35; // Meer ingezoomd op desktop
            this.fov = 42; // Iets smaller field of view voor meer zoom effect
        }
        
        // Adjust for very wide screens (ultrawide monitors)
        if (aspectRatio > 2.5) {
            this.radius *= 1.3;
            this.cameraDistance *= 0.9; // Dichter bij op ultrawide voor meer immersie
        }
        // Adjust for large desktop screens (4K, etc)
        else if (screenWidth >= 1920) {
            this.cameraDistance *= 0.85; // Extra zoom op grote schermen
            this.fov *= 0.95; // Iets smaller FOV
        }
        
        // Adjust for very tall screens
        if (aspectRatio < 0.6) {
            this.radius *= 0.8;
            this.cameraDistance *= 0.9;
        }
    }
    
    updateZoomStates() {
        this.originalCameraDistance = this.cameraDistance;
        this.zoomedOutDistance = this.cameraDistance * 2.5; // 150% verder weg tijdens drag - nog dramatischer
    }
    
    init() {
        this.setupThreeJS();
        this.createCards();
        this.setupEventListeners();
        this.animate();
        
        console.log('🎠 3D Carousel initialized');
    }
    
    createRoundedRectGeometry(width, height, radius) {
        const shape = new THREE.Shape();
        const x = -width / 2;
        const y = -height / 2;
        
        shape.moveTo(x + radius, y);
        shape.lineTo(x + width - radius, y);
        shape.quadraticCurveTo(x + width, y, x + width, y + radius);
        shape.lineTo(x + width, y + height - radius);
        shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        shape.lineTo(x + radius, y + height);
        shape.quadraticCurveTo(x, y + height, x, y + height - radius);
        shape.lineTo(x, y + radius);
        shape.quadraticCurveTo(x, y, x + radius, y);
        
        return new THREE.ShapeGeometry(shape);
    }

    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera with responsive settings
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            this.canvas.clientWidth / this.canvas.clientHeight,
            1,
            2000
        );
        this.camera.position.set(0, 0, this.cameraDistance);
        
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
        // Card geometry with responsive sizing and 5/6 aspect ratio
        const borderRadius = Math.max(8, this.cardWidth * 0.1); // Responsive border radius
        this.cardGeometry = this.createRoundedRectGeometry(this.cardWidth, this.cardHeight, borderRadius);
        
        // Card colors (verschillende kleuren voor visual effect)
        const colors = [
            0x4B83F2, // Blauw
            0x27AE60, // Groen
            0x9932CC, // Paars
            0xFF6B6B, // Rood
            0x4ECDC4, // Turquoise
            0xFFE66D, // Geel
            0xE74C3C, // Donkerrood
            0x3498DB, // Lichtblauw
            0xF39C12, // Oranje
            0x8E44AD, // Donkerpaars
            0x16A085, // Donkergroen
            0xE67E22  // Donkeroranje
        ];
        
        for (let i = 0; i < this.cardCount; i++) {
            // Material with border radius simulation
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
        
        // Wheel event for scroll - DISABLED
        // this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        
        // Resize with throttling for better performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.onResize();
            }, 100);
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onPointerStart(event) {
        this.isInteracting = true;
        this.velocity = 0;
        
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        this.lastPointerX = clientX;
        
        this.container.style.cursor = 'grabbing';
        
        // Altijd zoom uit bij start
        this.zoomOut();
    }
    
    zoomOut() {
        // Kill bestaande animatie en start nieuwe
        gsap.killTweensOf(this.camera.position);
        this.isZoomAnimating = true;
        
        gsap.to(this.camera.position, {
            z: this.zoomedOutDistance,
            duration: 0.25,
            ease: "power2.out",
            onComplete: () => {
                this.isZoomAnimating = false;
            }
        });
    }
    
    onPointerMove(event) {
        if (!this.isInteracting) return;
        
        event.preventDefault();
        
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const deltaX = clientX - this.lastPointerX;
        
        // Normale drag beweging
        if (Math.abs(deltaX) > 0) {
            // Responsive sensitivity - more sensitive on mobile
            let sensitivity = window.innerWidth <= 768 ? 0.8 : 0.5;
            
            // Convert to rotation (natural direction - als je de kaarten vasthoudt)
            const rotationDelta = (deltaX / this.canvas.clientWidth) * Math.PI * sensitivity;
            this.targetRotation += rotationDelta;
            this.velocity = rotationDelta * 0.1;
        }
        
        this.lastPointerX = clientX;
    }
    
    onPointerEnd() {
        this.isInteracting = false;
        this.container.style.cursor = 'grab';
        
        // Altijd zoom in bij loslaten
        this.zoomIn();
    }
    
    zoomIn() {
        // Kill bestaande animatie en start nieuwe
        gsap.killTweensOf(this.camera.position);
        this.isZoomAnimating = true;
        
        gsap.to(this.camera.position, {
            z: this.originalCameraDistance,
            duration: 0.4,
            ease: "power2.inOut",
            onComplete: () => {
                this.isZoomAnimating = false;
            }
        });
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
        
        // Update responsive settings
        this.getResponsiveSettings();
        
        // Update camera zoom states with new responsive values
        this.updateZoomStates();
        
        // Update camera
        this.camera.aspect = width / height;
        this.camera.fov = this.fov;
        
        // Set camera to appropriate distance (original or zoomed based on interaction state)
        const targetDistance = this.isInteracting ? this.zoomedOutDistance : this.originalCameraDistance;
        this.camera.position.set(0, 0, targetDistance);
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Recreate cards with new responsive sizes
        if (this.cards.length > 0) {
            this.recreateCards();
        }
    }
    
    recreateCards() {
        // Remove existing cards
        this.cards.forEach(card => {
            this.scene.remove(card);
        });
        this.cards = [];
        this.cardMaterials = [];
        
        // Create new cards with updated responsive settings
        this.createCards();
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Smooth rotation interpolation
        if (!this.isInteracting) {
            this.velocity *= this.damping;
            this.targetRotation += this.velocity;
            
            // Snapping logic when velocity is low
            if (Math.abs(this.velocity) < this.snapThreshold) {
                const cardAngle = (Math.PI * 2) / this.cardCount;
                const currentAngle = this.targetRotation % (Math.PI * 2);
                const nearestCardAngle = Math.round(currentAngle / cardAngle) * cardAngle;
                const snapDifference = nearestCardAngle - currentAngle;
                
                // Apply snapping force
                this.targetRotation += snapDifference * this.snapStrength;
                
                // Stop micro-movements when very close
                if (Math.abs(snapDifference) < 0.01) {
                    this.velocity = 0;
                    this.targetRotation = this.targetRotation - currentAngle + nearestCardAngle;
                }
            }
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
            
            // Keep Y position stable (no floating animation)
            card.position.y = 0;
            
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