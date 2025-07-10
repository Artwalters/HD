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
    }

    /**
     * Initialiseert de location manager
     */
    initialize() {
        if (this.isInitialized) return;

        this.checkGeolocationSupport();
        this.checkOrientationSupport();
        this.createLocationControl();
        this.createCompassControl();
        this.setupMapListeners();
        this.setupOrientationListeners();
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
     * Controleert of device orientation ondersteund wordt
     */
    checkOrientationSupport() {
        // Forceer compass voor alle browsers (ook desktop)
        this.isOrientationSupported = true;
        
        if (typeof DeviceOrientationEvent !== 'undefined') {
            console.log('✅ Device orientation ondersteund');
        } else {
            console.log('🖥️ Desktop browser - compass will use simulated orientation');
        }
        
        return this.isOrientationSupported;
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
     * Creëert compass control
     */
    createCompassControl() {
        // Forceer altijd compass creation voor testing
        console.log('🧭 Creating compass control...');
        
        const compassContainer = document.createElement('div');
        compassContainer.className = 'compass-control';
        compassContainer.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            pointer-events: auto;
        `;
        
        compassContainer.innerHTML = `
            <div class="compass" style="
                position: relative;
                width: 60px;
                height: 60px;
                background: rgba(255, 255, 255, 0.9);
                border: 2px solid rgba(0, 0, 0, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            ">
                <div class="compass-needle" id="compass-needle" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    transition: transform 0.5s ease;
                ">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l3 10-3 2-3-2z" fill="#ff0000"/>
                        <path d="M12 22l-3-10 3-2 3 2z" fill="#ffffff" stroke="#000" stroke-width="1"/>
                    </svg>
                </div>
                <div class="compass-direction" id="compass-direction" style="
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(0, 0, 0, 0.8);
                    background: rgba(255, 255, 255, 0.9);
                    padding: 2px 6px;
                    border-radius: 6px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                ">N</div>
            </div>
        `;
        
        // Add to map container
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.appendChild(compassContainer);
            console.log('✅ Compass added to map container');
        } else {
            console.error('❌ Map container not found');
            return;
        }
        
        this.compassElement = compassContainer;
        
        // Test compass immediately
        setTimeout(() => {
            this.testCompass();
        }, 1000);
    }
    
    /**
     * Test compass functionality
     */
    testCompass() {
        console.log('🗺️ Testing compass...');
        if (this.compassElement) {
            console.log('✅ Compass element exists');
            this.updateCompass(45); // Test with 45 degrees
            
            // Animate through directions for testing
            let testAngle = 0;
            const testInterval = setInterval(() => {
                this.updateCompass(testAngle);
                testAngle += 45;
                if (testAngle >= 360) {
                    clearInterval(testInterval);
                    this.updateCompass(0); // Reset to north
                }
            }, 500);
        } else {
            console.error('❌ Compass element not found');
        }
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
                await this.startTracking();
            }
            
        } catch (error) {
            this.handleLocationError(error);
        } finally {
            button.classList.remove('loading');
        }
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
     * Setup orientation event listeners
     */
    setupOrientationListeners() {
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
            this.updateCompass(simulatedHeading);
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
            this.updateCompass(heading);
            this.updateUserLocationOrientation();
            this.lastOrientationUpdate = now;
        }
        
        // Notify callbacks
        this.orientationCallbacks.forEach(callback => {
            callback(this.deviceOrientation);
        });
    }

    /**
     * Update compass display
     */
    updateCompass(heading) {
        if (!this.compassElement) return;
        
        const needle = this.compassElement.querySelector('#compass-needle');
        const direction = this.compassElement.querySelector('#compass-direction');
        
        if (needle) {
            needle.style.transform = `rotate(${heading}deg)`;
        }
        
        if (direction) {
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const index = Math.round(heading / 45) % 8;
            direction.textContent = directions[index];
        }
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
        
        // Update user location pin with orientation
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
            console.log(`🧭 Updated user location and orientation: ${this.heading}°`);
        }
    }

    /**
     * Behandelt successful location
     */
    handleLocationSuccess(position) {
        const { latitude, longitude, accuracy } = position.coords;
        
        this.userLocation = {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            timestamp: Date.now()
        };

        this.isTracking = true;
        this.updateLocationButton('active');
        this.updateLocationMarker();
        
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
        
        console.log(`📍 Locatie gevonden: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)`);
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

        // Add user location source
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

        // Add simple user location arrow/pin (no circles)
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
        
        // Single pin/arrow that shows both location and orientation
        this.map.addLayer({
            id: 'user-location-pin',
            type: 'symbol',
            source: 'user-location-pin',
            layout: {
                'text-field': '📍', // Location pin emoji
                'text-size': 28,
                'text-rotate': ['get', 'heading'],
                'text-rotation-alignment': 'map',
                'text-allow-overlap': true,
                'text-ignore-placement': true,
                'text-anchor': 'center'
            },
            paint: {
                'text-color': '#4B83F2',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2
            }
        });

        // Add pulsing animation
        this.addPulsingAnimation(layerId);
    }

    /**
     * Verwijder location marker
     */
    removeLocationMarker() {
        const layers = ['user-location-pin'];
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
     * Voeg pulsing animatie toe
     */
    addPulsingAnimation(layerId) {
        let opacity = 1;
        let direction = -1;

        const animate = () => {
            opacity += direction * 0.02;
            
            if (opacity <= 0.3) {
                direction = 1;
            } else if (opacity >= 1) {
                direction = -1;
            }

            if (this.map.getLayer(layerId)) {
                this.map.setPaintProperty(layerId, 'circle-opacity', opacity);
                requestAnimationFrame(animate);
            }
        };

        animate();
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