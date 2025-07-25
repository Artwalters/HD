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
    
    createMapCardGeometry(width, height, cornerRadius) {
        const shape = new THREE.Shape();
        const hw = width / 2;
        const hh = height / 2;
        const cr = cornerRadius;
        
        // Bottom notch parameters - kleine halve cirkel zoals in screenshot
        const notchWidth = width * 0.16; // Smalle breedte (15% van card)
        const notchDepth = height * 0.06; // Diepte van de halve cirkel (dieper uitgesneden)
        
        // Start from top-left corner (with radius)
        shape.moveTo(-hw + cr, hh);
        shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
        shape.lineTo(-hw, -hh + cr);
        shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
        
        // Bottom edge - left side to notch
        shape.lineTo(-notchWidth/2, -hh);
        
        // Create perfect circular notch with two quadratic curves
        // Eerste helft van de cirkel
        shape.quadraticCurveTo(
            -notchWidth/2, -hh + notchDepth,    // Control point links
            0, -hh + notchDepth                 // Midden (diepste punt)
        );
        
        // Tweede helft van de cirkel
        shape.quadraticCurveTo(
            notchWidth/2, -hh + notchDepth,     // Control point rechts
            notchWidth/2, -hh                   // End point
        );
        
        // Continue to bottom-right corner
        shape.lineTo(hw - cr, -hh);
        shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
        shape.lineTo(hw, hh - cr);
        shape.quadraticCurveTo(hw, hh, hw - cr, hh);
        shape.lineTo(-hw + cr, hh);
        
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
        this.cardGeometry = this.createMapCardGeometry(this.cardWidth, this.cardHeight, borderRadius);
        
        // Month names for timeline
        const months = [
            'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
            'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'
        ];
        
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
        
        // Array to store month labels
        this.monthLabels = [];
        
        // Create circular timeline
        this.createTimelineCircle();
        
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
            
            // Create month label for this card
            this.createMonthLabel(i, months[i], angle);
        }
    }
    
    createTimelineCircle() {
        // Create circular timeline like battle pass system
        const timelineRadius = this.radius + this.cardHeight * 0.2; // Same as labels
        const points = [];
        const segments = 64; // More segments for smooth circle
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * timelineRadius;
            const z = Math.sin(angle) * timelineRadius;
            points.push(new THREE.Vector3(x, -this.cardHeight * 0.5, z));
        }
        
        // Create line geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create line material - subtle gray line
        const material = new THREE.LineBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.6,
            linewidth: 2
        });
        
        // Create the timeline circle
        this.timelineCircle = new THREE.Line(geometry, material);
        this.scene.add(this.timelineCircle);
        
        // Create dots at each month position for battle pass effect
        this.createTimelineDots(timelineRadius);
    }
    
    createTimelineDots(radius) {
        this.timelineDots = [];
        
        for (let i = 0; i < this.cardCount; i++) {
            const angle = (i / this.cardCount) * Math.PI * 2;
            
            // Create dot geometry
            const dotGeometry = new THREE.CircleGeometry(this.cardWidth * 0.04, 8);
            
            // Create dot material - matching card color or neutral
            const dotMaterial = new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.8
            });
            
            // Create dot mesh
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            
            // Position on timeline circle
            dot.position.x = Math.cos(angle) * radius;
            dot.position.z = Math.sin(angle) * radius;
            dot.position.y = -this.cardHeight * 0.5;
            
            // Face up
            dot.rotation.x = -Math.PI / 2;
            
            // Store reference
            dot.userData = {
                index: i,
                angle: angle
            };
            
            this.timelineDots.push(dot);
            this.scene.add(dot);
        }
    }
    
    createMonthLabel(index, monthText, angle) {
        // Create text geometry
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set font properties - responsive font size
        const fontSize = window.innerWidth <= 768 ? 48 : 64;
        context.font = `${fontSize}px astronef, sans-serif`;
        context.fillStyle = '#22201F';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text
        context.fillText(monthText, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        // Create geometry for text plane
        const labelWidth = this.cardWidth * 0.8;
        const labelHeight = labelWidth * 0.25;
        const geometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
        
        // Create mesh
        const label = new THREE.Mesh(geometry, material);
        
        // Position below the card - above the timeline circle
        const labelRadius = this.radius + this.cardHeight * 0.2;
        label.position.x = Math.cos(angle) * labelRadius;
        label.position.z = Math.sin(angle) * labelRadius;
        label.position.y = -this.cardHeight * 0.35;
        
        // Face camera
        label.lookAt(0, label.position.y, 0);
        
        // Store reference data
        label.userData = {
            index: index,
            angle: angle,
            originalRadius: labelRadius
        };
        
        this.monthLabels.push(label);
        this.scene.add(label);
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
        
        // Remove existing month labels
        this.monthLabels.forEach(label => {
            this.scene.remove(label);
        });
        this.monthLabels = [];
        
        // Remove existing timeline elements
        if (this.timelineCircle) {
            this.scene.remove(this.timelineCircle);
        }
        if (this.timelineDots) {
            this.timelineDots.forEach(dot => {
                this.scene.remove(dot);
            });
            this.timelineDots = [];
        }
        
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
        this.updateMonthLabels();
        
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
    
    updateMonthLabels() {
        this.monthLabels.forEach((label, index) => {
            // Calculate position with rotation
            const angle = label.userData.angle + this.currentRotation;
            
            // Position in circle - slightly outside the cards
            const labelRadius = label.userData.originalRadius;
            label.position.x = Math.cos(angle) * labelRadius;
            label.position.z = Math.sin(angle) * labelRadius;
            
            // Keep Y position stable above timeline circle
            label.position.y = -this.cardHeight * 0.35;
            
            // Always face camera for readability
            label.lookAt(this.camera.position);
            
            // Scale and opacity based on distance from front (similar to cards)
            const distanceFromFront = Math.abs(label.position.z);
            const scale = Math.max(0.6, 1 - (distanceFromFront / this.radius) * 0.3);
            label.scale.setScalar(scale);
            
            // Opacity based on position
            const opacity = Math.max(0.4, 1 - (distanceFromFront / this.radius) * 0.5);
            label.material.opacity = opacity;
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