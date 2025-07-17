// ==============================
// LOCATION MANAGER MODULE - v1.0
// ==============================

class LocationManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.userLocation = null;
        this.isTracking = false;
        this.watchId = null;
        this.locationElement = null;
        this.geolocateControl = null;
        this.isInitialized = false;
        this.permissionState = 'prompt'; // 'granted', 'denied', 'prompt'
        
        // Device orientation properties
        this.deviceOrientation = null;
        this.heading = null;
        this.isOrientationSupported = false;
        this.isOrientationTracking = false;
        this.compassElement = null;
        this.orientationCallbacks = [];
        this.hasHadInitialLocation = false;
        this.lastOrientationUpdate = 0;
        this.orientationUtils = null;
    }

    /**
     * Initialiseert de location manager
     */
    async initialize() {
        if (this.isInitialized) return;

        this.checkGeolocationSupport();
        await this.initializeOrientationTracking();
        this.createLocationControl();
        this.createCompassControl();
        this.setupMapListeners();
        this.isInitialized = true;
        
        console.log('✅ Location manager geïnitialiseerd');
    }

    /**
     * Controleert of geolocation ondersteund wordt
     */
    checkGeolocationSupport() {
        if (!navigator.geolocation) {
            console.error('❌ Geolocation wordt niet ondersteund door deze browser');
            return false;
        }

        // Check voor HTTPS (vereist door Chrome)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('⚠️ Geolocation vereist HTTPS in moderne browsers');
            return false;
        }

        return true;
    }

    /**
     * Initialize modern orientation tracking
     */
    async initializeOrientationTracking() {
        console.log('🧭 Initializing orientation tracking...');
        
        // Try SimpleOrientation first (direct iOS permission)
        if (window.SimpleOrientation) {
            console.log('🧭 Using SimpleOrientation for direct permission handling');
            
            // Subscribe to heading changes
            window.SimpleOrientation.onHeadingChange((heading) => {
                this.heading = heading;
                this.updateUserLocationOrientation();
                
                // Notify callbacks
                this.orientationCallbacks.forEach(callback => {
                    callback({ heading: heading });
                });
            });
            
            this.isOrientationSupported = true;
            // Don't set isOrientationTracking = true until user grants permission
            console.log('✅ SimpleOrientation connected - ready for permission request');
            return;
        }
        
        // Fallback to OrientationUtils
        if (window.OrientationUtils) {
            this.orientationUtils = window.OrientationUtils;
            
            // Initialize orientation tracking
            const success = await this.orientationUtils.initialize();
            if (success) {
                this.isOrientationSupported = true;
                this.isOrientationTracking = true;
                
                // Subscribe to orientation changes
                this.orientationUtils.onOrientationChange((heading) => {
                    this.heading = heading;
                    this.updateUserLocationOrientation();
                    
                    // Notify callbacks
                    this.orientationCallbacks.forEach(callback => {
                        callback({ heading: heading });
                    });
                });
                
                console.log('✅ Modern orientation tracking initialized');
            } else {
                console.warn('⚠️ Orientation tracking failed to initialize');
                this.fallbackToLegacyOrientation();
            }
        } else {
            console.warn('⚠️ OrientationUtils not available, using legacy orientation');
            this.fallbackToLegacyOrientation();
        }
    }

    /**
     * Fallback to legacy orientation implementation
     */
    fallbackToLegacyOrientation() {
        console.log('🔄 Falling back to legacy orientation tracking...');
        this.isOrientationSupported = true;
        this.setupLegacyOrientationListeners();
    }

    /**
     * Creëert custom location control
     */
    createLocationControl() {
        this.locationElement = document.createElement('div');
        this.locationElement.className = 'custom-location-control';
        this.locationElement.innerHTML = this.generateLocationHTML();
        
        // Add to controls container
        const controlsContainer = document.querySelector('.custom-controls .controls-wrapper');
        if (controlsContainer) {
            controlsContainer.appendChild(this.createLocationButton());
        }
    }

    /**
     * Creëert compass control (disabled - not working properly)
     */
    createCompassControl() {
        // Compass disabled due to poor performance and accuracy issues
        console.log('🧭 Compass control disabled (not working properly)');
        this.compassElement = null;
        return;
    }
    
    /**
     * Test compass functionality (disabled)
     */
    testCompass() {
        // Compass testing disabled
        return;
    }

    /**
     * Creëert location button
     */
    createLocationButton() {
        const button = document.createElement('button');
        button.className = 'control-btn location-btn';
        button.title = 'Mijn locatie';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v4"></path>
                <path d="M12 18v4"></path>
                <path d="M2 12h4"></path>
                <path d="M18 12h4"></path>
            </svg>
        `;

        button.addEventListener('click', this.handleLocationClick.bind(this));
        return button;
    }

    /**
     * Request orientation permission directly when needed
     */
    requestOrientationPermissionDirect() {
        console.log('🧭 Requesting orientation permission directly...');
        
        // Only for iOS devices
        if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            console.log('🤖 No permission needed for this platform');
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            if (window.SimpleOrientation) {
                // Disable success message for automatic requests
                const originalShowMessage = window.SimpleOrientation.showSuccessMessage;
                window.SimpleOrientation.showSuccessMessage = false;

                // Store original callback to restore later
                const originalCallbacks = [...window.SimpleOrientation.callbacks];
                
                // Add our own callback to detect when permission is granted
                const permissionCallback = (heading) => {
                    console.log('🧭 Orientation permission granted and tracking started');
                    // Remove our callback
                    window.SimpleOrientation.offHeadingChange(permissionCallback);
                    // Restore original settings
                    window.SimpleOrientation.showSuccessMessage = originalShowMessage;
                    resolve(true);
                };
                
                window.SimpleOrientation.onHeadingChange(permissionCallback);

                // Set a timeout in case permission is denied
                setTimeout(() => {
                    if (!window.SimpleOrientation.hasPermission) {
                        window.SimpleOrientation.offHeadingChange(permissionCallback);
                        window.SimpleOrientation.showSuccessMessage = originalShowMessage;
                        resolve(false);
                    }
                }, 5000);

                // This will call DeviceOrientationEvent.requestPermission() DIRECTLY
                window.SimpleOrientation.requestPermissionDirect();
            } else {
                console.error('❌ SimpleOrientation niet beschikbaar');
                resolve(false);
            }
        });
    }

    /**
     * Genereert location HTML
     */
    generateLocationHTML() {
        return `
            <div class="location-wrapper">
                <div class="location-status">
                    <div class="location-indicator"></div>
                    <span class="location-text">Locatie zoeken...</span>
                </div>
            </div>
        `;
    }

    /**
     * Behandelt location button click
     */
    async handleLocationClick() {
        if (!this.checkGeolocationSupport()) {
            this.showLocationError('Geolocation wordt niet ondersteund');
            return;
        }

        const button = document.querySelector('.location-btn');
        
        try {
            button.classList.add('loading');
            
            if (this.isTracking) {
                this.stopTracking();
            } else {
                // Request orientation permission first if needed (iOS)
                if (!this.isOrientationTracking) {
                    console.log('🧭 Requesting orientation permission from location click...');
                    await this.requestOrientationPermissionDirect();
                }
                
                await this.startTracking();
            }
            
        } catch (error) {
            this.handleLocationError(error);
        } finally {
            button.classList.remove('loading');
        }
    }

    /**
     * Request orientation permission with user-friendly UI
     * Following best practices: only ask when user expects it
     */
    async requestOrientationPermissionWithUI() {
        // Check if we need to ask for permission at all
        if (!this.orientationUtils) {
            console.log('⚠️ OrientationUtils not available');
            return;
        }

        // Check current permission status first
        const permissionStatus = await this.orientationUtils.checkPermissionStatus();
        
        if (permissionStatus === 'granted') {
            console.log('✅ Orientation permission already granted');
            await this.initializeOrientationTracking();
            return;
        }
        
        if (permissionStatus === 'denied') {
            console.log('❌ Orientation permission previously denied');
            this.showOrientationPermissionInfo();
            return;
        }

        // Only ask for permission if status is 'prompt'
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            const userChoice = confirm(
                '🧭 Kompas Richting\n\n' +
                'Deze app kan je apparaat kompas gebruiken om je kijkrichting te tonen op de kaart. ' +
                'Dit maakt navigatie veel handiger!\n\n' +
                'Wil je kompas richting inschakelen?'
            );
            
            if (userChoice) {
                // Initialize orientation tracking - this will handle the permission request
                await this.initializeOrientationTracking();
            } else {
                console.log('👤 User chose not to enable orientation');
            }
        } else {
            // For non-iOS devices, just initialize orientation tracking
            await this.initializeOrientationTracking();
        }
    }

    /**
     * Show information about orientation permissions
     */
    showOrientationPermissionInfo() {
        const message = /iPad|iPhone|iPod/.test(navigator.userAgent) 
            ? 'Kompas richting is uitgeschakeld.\n\n' +
              'Om kompas richting in te schakelen:\n' +
              '• Ga naar Safari > Instellingen\n' +
              '• Kies "Motion & Orientation Access"\n' +
              '• Schakel toegang in voor deze website\n' +
              '• Herlaad de pagina'
            : 'Kompas richting is uitgeschakeld.\n\n' +
              'Herlaad de pagina en sta toegang toe wanneer daarom wordt gevraagd.';
        
        alert(message);
    }

    /**
     * Start location tracking
     */
    async startTracking() {
        return new Promise((resolve, reject) => {
            // Check permissions first
            this.checkPermissions().then(permission => {
                if (permission === 'denied') {
                    reject(new Error('Locatie toegang geweigerd'));
                    return;
                }

                // Get current position
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.handleLocationSuccess(position);
                        this.startWatchingPosition();
                        resolve(position);
                    },
                    (error) => {
                        this.handleLocationError(error);
                        reject(error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            });
        });
    }

    /**
     * Stop location tracking
     */
    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        this.isTracking = false;
        this.updateLocationButton('stopped');
        this.removeLocationMarker();
        
        console.log('📍 Location tracking gestopt');
    }

    /**
     * Start watching position changes
     */
    startWatchingPosition() {
        if (this.watchId) return;

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handleLocationSuccess(position);
            },
            (error) => {
                this.handleLocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    }

    /**
     * Setup legacy orientation event listeners (fallback)
     */
    setupLegacyOrientationListeners() {
        if (!this.isOrientationSupported) return;
        
        // Request permission voor iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS permission handling
            this.requestOrientationPermission();
        } else {
            // Android en andere browsers
            this.startOrientationTracking();
        }
    }

    /**
     * Request orientation permission (iOS)
     */
    async requestOrientationPermission() {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                this.startOrientationTracking();
            } else {
                console.warn('⚠️ Device orientation permission geweigerd');
            }
        } catch (error) {
            console.error('❌ Error requesting orientation permission:', error);
            // Fallback for older iOS versions
            this.startOrientationTracking();
        }
    }

    /**
     * Start orientation tracking
     */
    startOrientationTracking() {
        console.log('🧭 Starting orientation tracking...');
        
        // Start tracking voor alle browsers
        window.addEventListener('deviceorientationabsolute', this.handleOrientationChange.bind(this), true);
        window.addEventListener('deviceorientation', this.handleOrientationChange.bind(this), true);
        
        this.isOrientationTracking = true;
        console.log('✅ Orientation event listeners added');
        
        // Fallback: simulate orientation for testing als geen device events
        setTimeout(() => {
            if (!this.deviceOrientation) {
                console.log('🔄 No device orientation detected, using simulated orientation');
                this.simulateOrientation();
            }
        }, 2000);
    }
    
    /**
     * Simulate orientation for testing
     */
    simulateOrientation() {
        let simulatedHeading = 0;
        
        const simulateInterval = setInterval(() => {
            this.deviceOrientation = {
                alpha: simulatedHeading,
                beta: 0,
                gamma: 0,
                heading: simulatedHeading,
                timestamp: Date.now()
            };
            
            this.heading = simulatedHeading;
            // this.updateCompass(simulatedHeading); // Disabled - compass removed
            this.updateUserLocationOrientation();
            
            // Notify callbacks
            this.orientationCallbacks.forEach(callback => {
                callback(this.deviceOrientation);
            });
            
            simulatedHeading = (simulatedHeading + 10) % 360;
        }, 1000);
        
        // Stop simulation after 30 seconds
        setTimeout(() => {
            clearInterval(simulateInterval);
            console.log('🛑 Orientation simulation stopped');
        }, 30000);
    }

    /**
     * Handle orientation change with improved accuracy
     */
    handleOrientationChange(event) {
        if (!event.alpha && event.alpha !== 0) return;
        
        // Get compass heading with better iOS/Android handling
        let heading = event.alpha;
        
        // iOS Safari uses webkitCompassHeading (more accurate)
        if (event.webkitCompassHeading !== undefined) {
            heading = event.webkitCompassHeading;
        } else {
            // Android/other browsers - adjust alpha
            heading = (360 - event.alpha) % 360;
        }
        
        // Smooth heading updates to reduce jitter
        if (this.heading !== null) {
            const diff = Math.abs(heading - this.heading);
            // Only update if significant change (reduce jitter)
            if (diff < 5 && diff > 0) {
                heading = this.heading + (heading - this.heading) * 0.3; // Smooth interpolation
            }
        }
        
        this.deviceOrientation = {
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
            heading: heading,
            timestamp: Date.now()
        };
        
        this.heading = heading;
        
        // Throttle updates - only update every 200ms
        const now = Date.now();
        if (!this.lastOrientationUpdate || (now - this.lastOrientationUpdate) > 200) {
            console.log(`🧭 Orientation update - Heading: ${heading.toFixed(1)}°`);
            // this.updateCompass(heading); // Disabled - compass removed
            this.updateUserLocationOrientation();
            this.lastOrientationUpdate = now;
        }
        
        // Notify callbacks
        this.orientationCallbacks.forEach(callback => {
            callback(this.deviceOrientation);
        });
    }

    /**
     * Update compass display (disabled)
     */
    updateCompass(heading) {
        // Compass disabled - no updates needed
        return;
    }

    /**
     * Update user location with orientation
     */
    updateUserLocationOrientation() {
        if (!this.userLocation) return;
        
        const sourceId = 'user-location';
        const source = this.map.getSource(sourceId);
        
        if (source) {
            const data = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [this.userLocation.lng, this.userLocation.lat]
                },
                properties: {
                    accuracy: this.userLocation.accuracy,
                    heading: this.heading || 0
                }
            };
            
            source.setData(data);
        }
        
        // Update user location pin with new directional gradient
        const pinSource = this.map.getSource('user-location-pin');
        if (pinSource) {
            const pinData = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [this.userLocation.lng, this.userLocation.lat]
                },
                properties: {
                    heading: this.heading || 0
                }
            };
            
            pinSource.setData(pinData);
            
            // Update the directional dot image with new heading
            const newDotSvg = this.createDirectionalDotSvg(this.heading || 0);
            const img = new Image();
            img.onload = () => {
                this.map.updateImage('navigation-arrow', img);
            };
            img.src = newDotSvg;
            
            console.log(`🧭 Updated Google Maps dot with heading: ${this.heading || 0}°`);
        }
    }

    /**
     * Behandelt successful location
     */
    handleLocationSuccess(position) {
        const { latitude, longitude, accuracy, heading: geolocationHeading } = position.coords;
        
        this.userLocation = {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            timestamp: Date.now(),
            geolocationHeading: geolocationHeading // Store geolocation heading as fallback
        };

        this.isTracking = true;
        this.updateLocationButton('active');
        this.updateLocationMarker();
        
        // Send geolocation heading to debug panel
        if (window.OrientationDebug && geolocationHeading !== null && geolocationHeading !== undefined) {
            window.OrientationDebug.updateGeolocationHeading(geolocationHeading);
        }
        
        // Use geolocation heading as fallback if device orientation not available
        if (!this.isOrientationTracking && geolocationHeading !== null && geolocationHeading !== undefined) {
            console.log(`🧭 Using geolocation heading as fallback: ${geolocationHeading}°`);
            this.heading = geolocationHeading;
            this.updateUserLocationOrientation();
        }
        
        // Start orientation tracking if not already started
        if (!this.isOrientationTracking) {
            console.log('🧭 Starting orientation tracking from location success');
            this.initializeOrientationTracking();
        }
        
        // Only fly to user location once when first found, never during navigation
        const navigationManager = window.HeerlenApp?.navigationManager;
        const isFirstLocation = !this.hasHadInitialLocation;
        
        if (!navigationManager?.isNavigationActive() && isFirstLocation) {
            this.flyToUserLocation();
            this.hasHadInitialLocation = true;
            console.log('📍 Initial location found, flying to position');
        } else {
            console.log('📍 Location updated but not moving camera (navigation active or already positioned)');
        }
        
        // Dispatch custom event for other modules
        document.dispatchEvent(new CustomEvent('userLocationUpdate', {
            detail: this.userLocation
        }));
        
        const headingInfo = geolocationHeading !== null ? ` heading: ${geolocationHeading}°` : '';
        console.log(`📍 Locatie gevonden: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)${headingInfo}`);
    }

    /**
     * Behandelt location errors
     */
    handleLocationError(error) {
        let errorMessage = 'Onbekende fout';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Locatie toegang geweigerd';
                this.permissionState = 'denied';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Locatie niet beschikbaar';
                break;
            case error.TIMEOUT:
                errorMessage = 'Locatie timeout';
                break;
        }

        this.showLocationError(errorMessage);
        this.updateLocationButton('error');
        
        console.error('❌ Location error:', errorMessage);
    }

    /**
     * Controleer permissions
     */
    async checkPermissions() {
        if (!navigator.permissions) {
            return 'prompt'; // Fallback voor browsers zonder permissions API
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            this.permissionState = permission.state;
            return permission.state;
        } catch (error) {
            console.warn('Permissions API niet beschikbaar');
            return 'prompt';
        }
    }

    /**
     * Update location button state
     */
    updateLocationButton(state) {
        const button = document.querySelector('.location-btn');
        if (!button) return;

        // Remove all state classes
        button.classList.remove('active', 'error', 'loading');
        
        switch (state) {
            case 'active':
                button.classList.add('active');
                button.title = 'Stop locatie tracking';
                break;
            case 'error':
                button.classList.add('error');
                button.title = 'Locatie fout - probeer opnieuw';
                break;
            case 'loading':
                button.classList.add('loading');
                button.title = 'Locatie zoeken...';
                break;
            case 'stopped':
                button.title = 'Mijn locatie';
                break;
        }
    }

    /**
     * Update location marker op kaart
     */
    updateLocationMarker() {
        if (!this.userLocation) return;

        const sourceId = 'user-location';
        const layerId = 'user-location-layer';
        const accuracyLayerId = 'user-location-accuracy';

        // Remove existing layers
        this.removeLocationMarker();

        // Add user location source for accuracy circle
        this.map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [this.userLocation.lng, this.userLocation.lat]
                },
                properties: {
                    accuracy: this.userLocation.accuracy
                }
            }
        });
        
        // Add accuracy circle (light blue transparent circle like Google Maps)
        if (this.userLocation.accuracy > 0) {
            this.map.addLayer({
                id: accuracyLayerId,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': {
                        stops: [
                            [0, 0],
                            [20, this.metersToPixelsAtMaxZoom(this.userLocation.accuracy, this.userLocation.lat)]
                        ],
                        base: 2
                    },
                    'circle-color': '#1a73e8',
                    'circle-opacity': 0.1,
                    'circle-stroke-width': 0.5,
                    'circle-stroke-color': '#1a73e8',
                    'circle-stroke-opacity': 0.2
                }
            });
        }

        // Add user location pin source
        this.map.addSource('user-location-pin', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [this.userLocation.lng, this.userLocation.lat]
                },
                properties: {
                    heading: this.heading || 0
                }
            }
        });
        
        // Responsive dot size based on screen width
        const isMobile = window.innerWidth <= 768;
        const dotSize = isMobile ? 48 : 40; // Larger to show direction indicator clearly
        
        // Create Google Maps style blue dot
        const googleMapsDotSvg = this.createDirectionalDotSvg(this.heading || 0);
        
        // Add navigation arrow image to map
        if (!this.map.hasImage('navigation-arrow')) {
            const img = new Image();
            img.onload = () => {
                // Check if image already exists before adding
                if (!this.map.hasImage('navigation-arrow')) {
                    this.map.addImage('navigation-arrow', img, { sdf: false });
                }
                this.addNavigationArrowLayer(dotSize);
            };
            img.src = googleMapsDotSvg;
        } else {
            this.addNavigationArrowLayer(dotSize);
        }
    }
    
    /**
     * Create directional dot SVG with gradient based on heading
     */
    createDirectionalDotSvg(heading) {
        // Google Maps style blue dot with directional indicator
        console.log(`🧭 Creating directional indicator with heading: ${heading}°`);
        
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                    </filter>
                </defs>
                
                <!-- Rotate entire group based on heading -->
                <g transform="rotate(${heading}, 32, 32)">
                    <!-- Direction cone/view indicator -->
                    <path d="M 32 20 L 26 32 L 32 29 L 38 32 Z" 
                          fill="#4285f4" 
                          opacity="0.8"
                          filter="url(#shadow)"/>
                    
                    <!-- Larger view cone for better visibility -->
                    <path d="M 32 10 L 20 32 L 32 26 L 44 32 Z" 
                          fill="#4285f4" 
                          opacity="0.3"/>
                </g>
                
                <!-- Main blue circle (doesn't rotate) -->
                <circle cx="32" cy="32" r="12" fill="#1a73e8" stroke="#FFFFFF" stroke-width="4" filter="url(#shadow)"/>
                
                <!-- Inner white dot for contrast -->
                <circle cx="32" cy="32" r="4" fill="#FFFFFF" opacity="0.9"/>
            </svg>
        `)}`;
    }
    
    /**
     * Add navigation arrow layer to map
     */
    addNavigationArrowLayer(dotSize) {
        const layerConfig = {
            id: 'user-location-pin',
            type: 'symbol',
            source: 'user-location-pin',
            layout: {
                'icon-image': 'navigation-arrow',
                'icon-size': dotSize / 64, // Scale based on new SVG size (64x64)
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-anchor': 'center'
            },
            paint: {
                'icon-opacity': 1.0
            }
        };
        
        console.log('📍 Creating Google Maps style navigation arrow with heading:', this.heading || 0, 'degrees');
        
        // Check if layer already exists before adding
        if (this.map.getLayer('user-location-pin')) {
            this.map.removeLayer('user-location-pin');
        }
        
        // Add layer on top of route layers to ensure user pin is always visible
        try {
            // Try to place before route end marker, otherwise add normally
            if (this.map.getLayer('route-end')) {
                this.map.addLayer(layerConfig, 'route-end');
            } else {
                this.map.addLayer(layerConfig);
            }
        } catch (error) {
            // Fallback: just add the layer normally
            this.map.addLayer(layerConfig);
        }
    }

    /**
     * Convert meters to pixels at max zoom for circle radius
     */
    metersToPixelsAtMaxZoom(meters, latitude) {
        const mapboxTileSize = 512; // Mapbox GL JS tile size
        const worldSize = mapboxTileSize * Math.pow(2, 20); // World size at zoom 20
        const latRad = latitude * Math.PI / 180;
        const metersPerPixel = Math.cos(latRad) * 2 * Math.PI * 6371000 / worldSize;
        return meters / metersPerPixel;
    }
    
    /**
     * Verwijder location marker
     */
    removeLocationMarker() {
        const layers = ['user-location-accuracy', 'user-location-pin'];
        const sources = ['user-location', 'user-location-pin'];

        layers.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });

        sources.forEach(sourceId => {
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        });
    }

    /**
     * Voeg pulsing animatie toe (disabled)
     */
    addPulsingAnimation(layerId) {
        // Pulsing animation disabled for cleaner UI
        return;
    }

    /**
     * Fly naar user location
     */
    flyToUserLocation() {
        if (!this.userLocation) return;

        this.map.flyTo({
            center: [this.userLocation.lng, this.userLocation.lat],
            zoom: 16,
            duration: 1000
        });
    }

    /**
     * Toon location error
     */
    showLocationError(message) {
        // You can implement a toast notification here
        console.error('Location Error:', message);
        
        // Simple alert for now - can be replaced with better UI
        setTimeout(() => {
            alert(`Locatie fout: ${message}`);
        }, 100);
    }

    /**
     * Setup map listeners
     */
    setupMapListeners() {
        // Listen for map moves to update location button state
        this.map.on('movestart', () => {
            if (this.isTracking) {
                // User is manually moving map while tracking
                this.updateLocationButton('active');
            }
        });
    }

    /**
     * Krijg huidige user location
     */
    getUserLocation() {
        return this.userLocation;
    }

    /**
     * Check of user location beschikbaar is
     */
    hasUserLocation() {
        return this.userLocation !== null && this.isTracking;
    }

    /**
     * Bereken afstand tot een punt
     */
    calculateDistanceTo(lat, lng) {
        if (!this.userLocation) return null;

        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat - this.userLocation.lat) * Math.PI / 180;
        const dLon = (lng - this.userLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.userLocation.lat * Math.PI / 180) * 
                  Math.cos(lat * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return distance * 1000; // Convert to meters
    }

    /**
     * Subscribe to orientation updates
     */
    onOrientationChange(callback) {
        this.orientationCallbacks.push(callback);
    }

    /**
     * Unsubscribe from orientation updates
     */
    offOrientationChange(callback) {
        const index = this.orientationCallbacks.indexOf(callback);
        if (index > -1) {
            this.orientationCallbacks.splice(index, 1);
        }
    }

    /**
     * Get current heading
     */
    getHeading() {
        return this.heading;
    }

    /**
     * Get device orientation
     */
    getDeviceOrientation() {
        return this.deviceOrientation;
    }

    /**
     * Check if orientation is supported
     */
    isOrientationSupported() {
        return this.isOrientationSupported;
    }

    /**
     * Toggle compass visibility
     */
    toggleCompass() {
        if (!this.compassElement) return false;
        
        const isVisible = this.compassElement.style.display !== 'none';
        this.compassElement.style.display = isVisible ? 'none' : 'block';
        
        return !isVisible;
    }

    /**
     * Cleanup location manager
     */
    destroy() {
        this.stopTracking();
        this.removeLocationMarker();
        
        // Stop orientation tracking
        if (this.orientationUtils) {
            this.orientationUtils.destroy();
            this.orientationUtils = null;
        }
        
        // Fallback: stop legacy listeners if active
        if (this.isOrientationTracking) {
            window.removeEventListener('deviceorientationabsolute', this.handleOrientationChange);
            window.removeEventListener('deviceorientation', this.handleOrientationChange);
            this.isOrientationTracking = false;
        }
        
        if (this.locationElement) {
            this.locationElement.remove();
            this.locationElement = null;
        }
        
        if (this.compassElement) {
            this.compassElement.remove();
            this.compassElement = null;
        }
        
        this.orientationCallbacks = [];
        this.isInitialized = false;
        console.log('🗑️ Location manager vernietigd');
    }
}

// Export voor gebruik in andere modules
window.LocationManager = LocationManager;