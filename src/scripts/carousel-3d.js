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
        
        // Initialize snapping values
        this.updateSnapSettings();
        
        // Camera zoom states (initialized after responsive settings)
        this.updateZoomStates();
        this.isZoomAnimating = false;
        
        // Zoom is nu altijd simpel - geen drag tracking nodig
        
        // Events data
        this.eventsData = [];
        
        this.loadEvents();
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
            this.cameraDistance = 25; // Meer ingezoomd op mobile portrait
            this.fov = 45;
        }
        // Mobile Landscape & Small Tablets
        else if (screenWidth <= 767) {
            this.radius = 220;
            this.cardWidth = 100;
            this.cardHeight = 125;
            this.cameraDistance = 30; // Meer ingezoomd op mobile landscape
            this.fov = 42;
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
    
    updateSnapSettings() {
        // Snapping - nog veel sterker op mobile
        this.snapThreshold = window.innerWidth <= 768 ? 0.08 : 0.01; // When to start snapping
        this.snapStrength = window.innerWidth <= 768 ? 0.4 : 0.1; // How strong the snap is
        this.damping = window.innerWidth <= 768 ? 0.88 : 0.95; // Much faster damping on mobile for quicker snap
    }
    
    updateZoomStates() {
        this.originalCameraDistance = this.cameraDistance;
        // Subtielere zoom op mobile, dramatischer op desktop
        this.zoomedOutDistance = window.innerWidth <= 768 ? 
            this.cameraDistance * 1.2 : // Heel subtiele zoom op mobile
            this.cameraDistance * 2.5;  // Dramatische zoom op desktop
    }
    
    async loadEvents() {
        try {
            const response = await fetch('./src/data/events.json');
            const data = await response.json();
            this.eventsData = data.events;
            
            // Wait for fonts to load before initializing
            await this.waitForFonts();
            this.init();
        } catch (error) {
            console.error('❌ Error loading events:', error);
            this.eventsData = this.createFallbackEvents();
            
            // Wait for fonts to load before initializing
            await this.waitForFonts();
            this.init();
        }
    }
    
    async waitForFonts() {
        try {
            // Load the correct astronef fonts used in hero (narrow version)
            await document.fonts.load('400 36px astronef-std-super-narrow');
            await document.fonts.load('400 48px astronef-std-super-narrow');
            this.astronefAvailable = true;
        } catch (error) {
            this.astronefAvailable = false;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    createFallbackEvents() {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
        const colors = ['#4B83F2', '#27AE60', '#9932CC', '#FF6B6B', '#4ECDC4', '#FFE66D', '#E74C3C', '#3498DB', '#F39C12', '#8E44AD', '#16A085', '#E67E22'];
        
        return months.map((month, i) => ({
            id: i + 1,
            month: month,
            title: `${month} Event`,
            description: `Een geweldig evenement in ${month}`,
            date: `${i + 1} ${month.toLowerCase()}`,
            color: colors[i]
        }));
    }
    
    init() {
        this.setupThreeJS();
        this.createCards();
        this.setupEventListeners();
        this.animate();
        
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
        
        // Use ShapeGeometry and manually set UV coordinates
        const geometry = new THREE.ShapeGeometry(shape);
        
        // Generate proper UV coordinates for texture mapping
        const positions = geometry.attributes.position;
        const uvs = [];
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            
            // Map coordinates to UV space (0-1)
            const u = (x + width/2) / width;
            const v = (y + height/2) / height;
            
            uvs.push(u, v);
        }
        
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        
        return geometry;
    }
    
    createCardTexture(eventData) {
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size - higher resolution for sharp text
        canvas.width = 512;
        canvas.height = 614; // 5:6 aspect ratio (512 * 1.2)
        
        // Use event color from JSON
        const bgColor = eventData.color || '#6E90DB';
        
        // Fill background with solid color matching site background
        context.fillStyle = bgColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Remove pattern overlay to eliminate lines
        
        // Draw month label at top - bright white
        context.fillStyle = '#ffffff';
        const monthFont = this.astronefAvailable ? '400 42px astronef-std-super-narrow, Arial, sans-serif' : 'bold 42px Arial, sans-serif';
        context.font = monthFont;
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(eventData.month, canvas.width / 2, 25);
        
        // Draw title - bright white
        context.fillStyle = '#ffffff';
        const titleFont = this.astronefAvailable ? '400 52px astronef-std-super-narrow, Arial, sans-serif' : 'bold 52px Arial, sans-serif';
        context.font = titleFont;
        context.textAlign = 'center';
        context.textBaseline = 'top';
        
        // No text shadow for flat appearance
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Convert title to uppercase and limit width
        const titleText = eventData.title.toUpperCase();
        const titleLines = this.wrapText(context, titleText, canvas.width - 80); // Smaller max width for better readability
        let yPosition = 120;
        
        titleLines.forEach(line => {
            context.fillText(line, canvas.width / 2, yPosition);
            yPosition += 45;
        });
        
        // Reset shadow for description
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Draw description - bright white
        context.fillStyle = '#ffffff';
        context.font = '24px Arial, sans-serif';
        
        const descLines = this.wrapText(context, eventData.description, canvas.width - 60);
        yPosition += 30;
        
        descLines.forEach(line => {
            context.fillText(line, canvas.width / 2, yPosition);
            yPosition += 32;
        });
        
        // Add date at bottom if exists - bright white
        if (eventData.date) {
            context.fillStyle = '#ffffff';
            context.font = 'bold 22px Arial, sans-serif';
            context.fillText(eventData.date, canvas.width / 2, canvas.height - 50);
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.flipY = true; // Flip Y to fix mirroring
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        
        return texture;
    }
    
    wrapText(context, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = context.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    adjustColor(color, amount) {
        // Adjust color brightness
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
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
        
        // Disable shadows completely
        this.renderer.shadowMap.enabled = false;
        
        // Disable tone mapping for accurate colors
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // No lighting needed for MeshBasicMaterial
    }
    
    createCards() {
        // Card geometry with responsive sizing and custom shape
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
        
        // Create circular timeline
        this.createTimelineCircle();
        
        for (let i = 0; i < this.cardCount; i++) {
            // Get event data for this card
            const eventData = this.eventsData[i] || {
                id: i + 1,
                month: months[i],
                title: `Event ${i + 1}`,
                description: 'Een geweldig evenement in Heerlen.',
                date: `${i + 1} ${months[i].toLowerCase()}`,
                color: `#${colors[i].toString(16).padStart(6, '0')}`
            };
            
            // Create texture with event content
            const texture = this.createCardTexture(eventData);
            
            // Custom unlit shader material like Mapbox uses
            const material = new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D map;
                    varying vec2 vUv;
                    void main() {
                        gl_FragColor = texture2D(map, vUv);
                    }
                `,
                uniforms: {
                    map: { value: texture }
                },
                transparent: true,
                side: THREE.DoubleSide
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
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        this.lastPointerX = clientX;
        this.lastPointerY = clientY;
        this.initialPointerX = clientX;
        this.initialPointerY = clientY;
        this.hasMovedHorizontally = false;
        
        this.container.style.cursor = 'grabbing';
        
        // Subtiele zoom op mobile, normale zoom op desktop
        this.zoomOut();
    }
    
    zoomOut() {
        // Kill bestaande animatie en start nieuwe
        gsap.killTweensOf(this.camera.position);
        this.isZoomAnimating = true;
        
        // Langzamere animatie op mobile, sneller op desktop
        const duration = window.innerWidth <= 768 ? 0.6 : 0.25;
        
        gsap.to(this.camera.position, {
            z: this.zoomedOutDistance,
            duration: duration,
            ease: "power2.out",
            onComplete: () => {
                this.isZoomAnimating = false;
            }
        });
    }
    
    onPointerMove(event) {
        if (!this.isInteracting) return;
        
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        const deltaX = clientX - this.lastPointerX;
        const deltaY = clientY - this.lastPointerY;
        
        // Check movement direction on mobile
        if (window.innerWidth <= 768 && event.touches) {
            const totalDeltaX = Math.abs(clientX - this.initialPointerX);
            const totalDeltaY = Math.abs(clientY - this.initialPointerY);
            
            // If vertical movement is dominant, allow default scroll behavior
            if (totalDeltaY > totalDeltaX && totalDeltaY > 15) {
                this.isInteracting = false;
                this.container.style.cursor = 'grab';
                // Subtiele zoom in op mobile
                if (window.innerWidth <= 768) {
                    this.zoomIn();
                }
                return;
            }
            
            // Only prevent default if horizontal movement is detected - lagere threshold
            if (totalDeltaX > 5) {
                event.preventDefault();
                this.hasMovedHorizontally = true;
            }
        } else {
            event.preventDefault();
        }
        
        // Normale drag beweging
        if (Math.abs(deltaX) > 0) {
            // Lagere sensitivity voor minder responsive draai beweging
            let sensitivity = window.innerWidth <= 768 ? 0.5 : 0.3;
            
            // Convert to rotation (natural direction - als je de kaarten vasthoudt)
            const rotationDelta = (deltaX / this.canvas.clientWidth) * Math.PI * sensitivity;
            this.targetRotation += rotationDelta;
            this.velocity = rotationDelta * 0.1;
        }
        
        this.lastPointerX = clientX;
        this.lastPointerY = clientY;
    }
    
    onPointerEnd() {
        this.isInteracting = false;
        this.container.style.cursor = 'grab';
        
        // Subtiele zoom in op mobile, normale zoom op desktop
        this.zoomIn();
    }
    
    zoomIn() {
        // Kill bestaande animatie en start nieuwe
        gsap.killTweensOf(this.camera.position);
        this.isZoomAnimating = true;
        
        // Langzamere animatie op mobile, normale snelheid op desktop
        const duration = window.innerWidth <= 768 ? 0.8 : 0.4;
        
        gsap.to(this.camera.position, {
            z: this.originalCameraDistance,
            duration: duration,
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
        
        // Update snap settings for current screen size
        this.updateSnapSettings();
        
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