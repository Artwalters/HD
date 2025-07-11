// ==============================
// NAVIGATION MANAGER MODULE - v1.0
// ==============================

class NavigationManager {
    constructor(map, config, locationManager, audioManager) {
        this.map = map;
        this.config = config;
        this.locationManager = locationManager;
        this.audioManager = audioManager;
        this.instructionTranslator = new InstructionTranslator();
        this.currentRoute = null;
        this.routeLayer = null;
        this.navigationPanel = null;
        this.isNavigating = false;
        this.routingProfile = 'walking'; // walking, driving, cycling
        this.isInitialized = false;
        
        // New properties for enhanced navigation
        this.isFollowingUser = true;
        this.routeProgress = 0;
        this.currentStepIndex = 0;
        this.lastUserPosition = null;
        this.navigationStartTime = null;
        this.totalDistance = 0;
        this.remainingDistance = 0;
        this.averageSpeed = 0;
        this.lastAnnouncedDistance = null;
        this.lastAnnouncedStep = null;
        this.offRouteThreshold = 50; // meters
        this.isOffRoute = false;
        this.cameraFollowAnimationId = null;
        this.lastRecalculationTime = 0;
        this.recalculationCooldown = 30000; // 30 seconds between recalculations
        this.consecutiveOffRouteCount = 0;
        this.offRouteConfirmationThreshold = 3; // Need 3 consecutive off-route readings
        
        // Bottom sheet state management
        this.panelState = 'collapsed'; // collapsed, partial, expanded
        this.swipeStartY = 0;
        this.swipeCurrentY = 0;
        this.swipeThreshold = 50; // pixels to trigger state change
        this.isDragging = false;
        
        // Progress tracking
        this.positionHistory = [];
        this.speedHistory = [];
        this.maxHistoryLength = 10;
        
        // Store original route for Google Maps-style shortening
        this.originalRouteCoordinates = null;
    }

    /**
     * Initialiseert navigation manager
     */
    initialize() {
        if (this.isInitialized) return;

        this.setupRouteLayer();
        this.setupLocationTracking();
        this.isInitialized = true;
        
        console.log('✅ Navigation manager geïnitialiseerd');
    }

    /**
     * Setup location tracking voor real-time updates
     */
    setupLocationTracking() {
        // Listen voor location updates van LocationManager
        document.addEventListener('userLocationUpdate', (event) => {
            if (this.isNavigating) {
                this.handleLocationUpdate(event.detail);
            }
        });
    }

    /**
     * Setup route layer op de kaart
     */
    setupRouteLayer() {
        // Add route source
        this.map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: []
                }
            }
        });

        // Route layer will be dynamically updated to show only remaining route (Google Maps style)

        // Add route background layer (wider, darker)
        this.map.addLayer({
            id: 'route-background',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#1a365d',
                'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8, 3,
                    12, 6,
                    16, 10,
                    20, 16
                ],
                'line-opacity': 0.9
            }
        });

        // Add route main layer (thinner, brighter)
        this.map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#4B83F2',
                'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8, 2,
                    12, 4,
                    16, 6,
                    20, 10
                ],
                'line-opacity': 1
            }
        });


        // Add start/end markers source
        this.map.addSource('route-markers', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        // Add start marker
        this.map.addLayer({
            id: 'route-start',
            type: 'circle',
            source: 'route-markers',
            filter: ['==', ['get', 'type'], 'start'],
            paint: {
                'circle-radius': 8,
                'circle-color': '#4CAF50',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
            }
        });

        // Add end marker
        this.map.addLayer({
            id: 'route-end',
            type: 'circle',
            source: 'route-markers',
            filter: ['==', ['get', 'type'], 'end'],
            paint: {
                'circle-radius': 10,
                'circle-color': '#F44336',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
            }
        });
    }

    /**
     * Bereken route naar bestemming
     */
    async calculateRoute(destinationLat, destinationLng, destinationName) {
        if (!this.locationManager.hasUserLocation()) {
            throw new Error('Gebruikerslocatie is niet beschikbaar');
        }

        const userLocation = this.locationManager.getUserLocation();
        const origin = [userLocation.lng, userLocation.lat];
        const destination = [destinationLng, destinationLat];

        try {
            const route = await this.fetchRoute(origin, destination);
            
            if (!route || !route.routes || route.routes.length === 0) {
                throw new Error('Geen route gevonden');
            }

            this.currentRoute = {
                ...route.routes[0],
                destination: {
                    name: destinationName,
                    lat: destinationLat,
                    lng: destinationLng
                },
                origin: {
                    lat: userLocation.lat,
                    lng: userLocation.lng
                }
            };

            // Initialize navigation state
            this.initializeNavigationState();
            
            this.displayRoute();
            this.showNavigationPanel();
            this.isNavigating = true;

            // Audio announcement
            if (this.audioManager) {
                this.audioManager.announceNavigation({
                    type: 'start',
                    destination: destinationName
                });
            }
            
            // Add zoom out/in animation when starting navigation
            // Camera following will be started after animation completes
            this.startNavigationWithZoomAnimation();

            console.log(`🧭 Route berekend naar ${destinationName}:`, this.currentRoute);
            return this.currentRoute;

        } catch (error) {
            console.error('❌ Fout bij berekenen route:', error);
            throw error;
        }
    }

    /**
     * Fetch route van Mapbox Directions API
     */
    async fetchRoute(origin, destination) {
        const accessToken = this.config.map.accessToken;
        const profile = `mapbox/${this.routingProfile}`;
        
        // Valideer coordinaten
        if (!this.validateCoordinates(origin) || !this.validateCoordinates(destination)) {
            throw new Error('Ongeldige coördinaten');
        }
        
        const url = `https://api.mapbox.com/directions/v5/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?` +
            `steps=true&geometries=geojson&overview=full&access_token=${accessToken}&language=nl`;

        console.log('🔍 Navigation API URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Navigation API Error:', response.status, errorData);
            
            if (response.status === 422) {
                throw new Error('Ongeldige route parameters - controleer coördinaten');
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error('Geen route gevonden tussen deze locaties');
        }

        // Debug info over route detail
        const route = data.routes[0];
        console.log('📊 Route detail:', {
            coordinateCount: route.geometry.coordinates.length,
            stepCount: route.legs[0].steps.length,
            distance: route.distance,
            duration: route.duration
        });

        return data;
    }

    /**
     * Valideer coordinaten
     */
    validateCoordinates(coords) {
        if (!Array.isArray(coords) || coords.length !== 2) {
            return false;
        }
        
        const [lng, lat] = coords;
        
        // Controleer of het geldige nummers zijn
        if (typeof lng !== 'number' || typeof lat !== 'number') {
            return false;
        }
        
        // Controleer bereik
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            return false;
        }
        
        // Controleer of het niet NaN is
        if (isNaN(lng) || isNaN(lat)) {
            return false;
        }
        
        return true;
    }

    /**
     * Toon route op de kaart
     */
    displayRoute() {
        if (!this.currentRoute) return;

        // Gebruik de volledige route geometrie met alle stappen
        const routeGeoJSON = this.createDetailedRouteGeometry();
        
        // Store original coordinates for Google Maps-style route shortening
        this.originalRouteCoordinates = routeGeoJSON.geometry.coordinates;

        this.map.getSource('route').setData(routeGeoJSON);

        // Add start and end markers
        this.addRouteMarkers();

        // Fit map to route
        this.fitMapToRoute();
    }

    /**
     * Creëer gedetailleerde route geometrie
     */
    createDetailedRouteGeometry() {
        if (!this.currentRoute) return null;

        // Gebruik alleen de hoofdroute geometrie - die is al optimaal
        // De API geeft al de beste route geometrie met overview=full
        const coordinates = this.currentRoute.geometry.coordinates;

        console.log('🗺️ Route geometrie:', {
            totalPoints: coordinates.length,
            profile: this.routingProfile,
            start: coordinates[0],
            end: coordinates[coordinates.length - 1]
        });

        return {
            type: 'Feature',
            properties: {
                routeType: this.routingProfile
            },
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        };
    }


    /**
     * Voeg start en end markers toe
     */
    addRouteMarkers() {
        if (!this.currentRoute || !this.originalRouteCoordinates) return;

        // Use original coordinates to ensure markers stay at correct positions
        const coordinates = this.originalRouteCoordinates;
        const endCoord = coordinates[coordinates.length - 1];

        const markersData = {
            type: 'FeatureCollection',
            features: [
                // Don't add start marker - user location pin already shows start position
                {
                    type: 'Feature',
                    properties: { type: 'end' },
                    geometry: {
                        type: 'Point',
                        coordinates: endCoord
                    }
                }
            ]
        };

        this.map.getSource('route-markers').setData(markersData);
    }

    /**
     * Initialize navigation state
     */
    initializeNavigationState() {
        this.routeProgress = 0;
        this.currentStepIndex = 0;
        this.navigationStartTime = Date.now();
        this.totalDistance = this.currentRoute.distance;
        this.remainingDistance = this.totalDistance;
        this.lastUserPosition = null;
        this.lastAnnouncedDistance = null;
        this.lastAnnouncedStep = null;
        this.isOffRoute = false;
        this.positionHistory = [];
        this.speedHistory = [];
        
        // Set realistic initial speed based on routing profile
        switch (this.routingProfile) {
            case 'walking':
                this.averageSpeed = 5; // 5 km/h
                break;
            case 'cycling':
                this.averageSpeed = 15; // 15 km/h
                break;
            case 'driving':
                this.averageSpeed = 30; // 30 km/h (urban driving)
                break;
            default:
                this.averageSpeed = 5; // Default to walking
        }
        this.lastProgressIndex = 0;
        this.lastRecalculationTime = 0;
        this.consecutiveOffRouteCount = 0;
        
        // Camera following will be started after navigation begins
        // Reset following state
        this.isFollowingUser = true; // Default to following during navigation
    }

    /**
     * Handle real-time location updates
     */
    handleLocationUpdate(location) {
        if (!this.currentRoute) return;

        // Only update every few seconds to reduce jumpiness
        const now = Date.now();
        if (this.lastUserPosition && (now - this.lastUserPosition.timestamp) < 2000) {
            // Still update camera and basic tracking
            if (this.isFollowingUser) {
                this.updateCameraPosition(location);
            }
            return;
        }

        this.updatePositionHistory(location);
        this.calculateProgress(location);
        this.checkRouteDeviation(location);
        this.updateNavigationUI();
        this.checkProximityToInstructions(location);
        
        if (this.isFollowingUser) {
            this.updateCameraPosition(location);
        }
        
        // Store with timestamp
        this.lastUserPosition = {
            ...location,
            timestamp: now
        };
    }

    /**
     * Update position history voor snelheidsberekening
     */
    updatePositionHistory(location) {
        const now = Date.now();
        this.positionHistory.push({
            ...location,
            timestamp: now
        });
        
        // Houd geschiedenis beperkt
        if (this.positionHistory.length > this.maxHistoryLength) {
            this.positionHistory.shift();
        }
        
        // Bereken gemiddelde snelheid
        this.calculateAverageSpeed();
    }

    /**
     * Bereken gemiddelde snelheid
     */
    calculateAverageSpeed() {
        if (this.positionHistory.length < 2) return;
        
        const recent = this.positionHistory.slice(-5); // Laatste 5 posities
        let totalDistance = 0;
        let totalTime = 0;
        
        for (let i = 1; i < recent.length; i++) {
            const prev = recent[i - 1];
            const curr = recent[i];
            
            const distance = this.calculateDistance(
                prev.lat, prev.lng,
                curr.lat, curr.lng
            );
            
            const time = (curr.timestamp - prev.timestamp) / 1000; // seconds
            
            totalDistance += distance;
            totalTime += time;
        }
        
        if (totalTime > 0) {
            const calculatedSpeed = (totalDistance / totalTime) * 3.6; // km/h
            
            // Filter out unrealistic speeds (stationary or impossibly fast)
            if (calculatedSpeed >= 0.5 && calculatedSpeed <= 200) {
                this.averageSpeed = calculatedSpeed;
            } else if (calculatedSpeed < 0.5) {
                // Very slow or stationary - keep previous speed or set to minimum
                this.averageSpeed = Math.max(this.averageSpeed, 1.0);
            }
            // If speed > 200 km/h, ignore this calculation (GPS glitch)
        }
    }

    /**
     * Bereken route progress met verbeterde logica
     */
    calculateProgress(location) {
        if (!this.currentRoute || !location || !this.originalRouteCoordinates) return;
        
        // Use original coordinates for accurate progress calculation
        const routeCoordinates = this.originalRouteCoordinates;
        let closestPointIndex = 0;
        let minDistance = Infinity;
        
        // Zoek alleen vooruit vanaf huidige positie om springen tegen te gaan
        const searchStart = Math.max(0, this.getLastKnownProgressIndex() - 5);
        const searchEnd = Math.min(routeCoordinates.length, searchStart + 50);
        
        for (let i = searchStart; i < searchEnd; i++) {
            const coord = routeCoordinates[i];
            const distance = this.calculateDistance(
                location.lat, location.lng,
                coord[1], coord[0]
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPointIndex = i;
            }
        }
        
        // Voorkom springen terug - alleen vooruitgaan
        const lastProgressIndex = this.getLastKnownProgressIndex();
        if (closestPointIndex < lastProgressIndex) {
            closestPointIndex = lastProgressIndex;
        }
        
        // Bereken voortgang als percentage
        const newProgress = (closestPointIndex / routeCoordinates.length) * 100;
        
        // Smooth progress updates - alleen significante wijzigingen
        if (Math.abs(newProgress - this.routeProgress) > 1) {
            this.routeProgress = newProgress;
            this.lastProgressIndex = closestPointIndex;
            
            // Update route to show only remaining path (Google Maps style)
            this.updateRemainingRoute(closestPointIndex);
            
            // Bereken resterende afstand
            this.calculateRemainingDistance(closestPointIndex);
        }
    }
    
    /**
     * Get last known progress index
     */
    getLastKnownProgressIndex() {
        return this.lastProgressIndex || 0;
    }

    /**
     * Update route to show only remaining path (Google Maps style)
     */
    updateRemainingRoute(progressIndex) {
        if (!this.currentRoute || !this.originalRouteCoordinates) return;
        
        // Use original coordinates to maintain accuracy
        const routeCoordinates = this.originalRouteCoordinates;
        
        // Keep from current position to end (route gets shorter)
        const remainingCoordinates = routeCoordinates.slice(progressIndex);
        
        // Ensure we have at least 2 points for a valid line
        if (remainingCoordinates.length < 2) {
            console.log('📍 Route nearly complete, keeping minimal route');
            return;
        }
        
        const remainingRoute = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: remainingCoordinates
            }
        };
        
        // Update main route to show only remaining path
        this.map.getSource('route').setData(remainingRoute);
        
        const percentComplete = Math.round((progressIndex / routeCoordinates.length) * 100);
        console.log(`🗺️ Route ${percentComplete}% complete: ${remainingCoordinates.length} points remaining`);
    }

    /**
     * Bereken resterende afstand
     */
    calculateRemainingDistance(progressIndex) {
        if (!this.currentRoute || !this.originalRouteCoordinates) return;
        
        // Use original coordinates for accurate distance calculation
        const routeCoordinates = this.originalRouteCoordinates;
        let remainingDistance = 0;
        
        for (let i = progressIndex; i < routeCoordinates.length - 1; i++) {
            const from = routeCoordinates[i];
            const to = routeCoordinates[i + 1];
            
            remainingDistance += this.calculateDistance(
                from[1], from[0],
                to[1], to[0]
            );
        }
        
        this.remainingDistance = remainingDistance;
    }

    /**
     * Check route deviation with improved logic
     */
    checkRouteDeviation(location) {
        if (!this.currentRoute || !this.originalRouteCoordinates) return;
        
        const now = Date.now();
        
        // Don't check too frequently
        if (now - this.lastRecalculationTime < 10000) { // 10 second minimum between checks
            return;
        }
        
        // Use original coordinates for deviation check
        const routeCoordinates = this.originalRouteCoordinates;
        let minDistanceToRoute = Infinity;
        
        // Check distance to route, but be smarter about it
        // Only check coordinates around our current progress
        const startIndex = Math.max(0, Math.floor(this.routeProgress / 100 * routeCoordinates.length) - 10);
        const endIndex = Math.min(routeCoordinates.length, startIndex + 20);
        
        for (let i = startIndex; i < endIndex; i++) {
            const coord = routeCoordinates[i];
            const distance = this.calculateDistance(
                location.lat, location.lng,
                coord[1], coord[0]
            );
            
            minDistanceToRoute = Math.min(minDistanceToRoute, distance);
        }
        
        // Use consecutive readings to confirm off-route
        if (minDistanceToRoute > this.offRouteThreshold) {
            this.consecutiveOffRouteCount++;
            console.log(`🔍 Off route reading ${this.consecutiveOffRouteCount}/${this.offRouteConfirmationThreshold} (${Math.round(minDistanceToRoute)}m from route)`);
            
            // Only recalculate after multiple consecutive off-route readings
            if (this.consecutiveOffRouteCount >= this.offRouteConfirmationThreshold && !this.isOffRoute) {
                // Additional check: only recalculate if enough time has passed
                if (now - this.lastRecalculationTime > this.recalculationCooldown) {
                    this.isOffRoute = true;
                    this.lastRecalculationTime = now;
                    
                    if (this.audioManager) {
                        this.audioManager.announceNavigation({ type: 'off-route' });
                    }
                    
                    console.log(`⚠️ User confirmed off route (${Math.round(minDistanceToRoute)}m), recalculating...`);
                    this.recalculateRoute();
                } else {
                    const waitTime = Math.round((this.recalculationCooldown - (now - this.lastRecalculationTime)) / 1000);
                    console.log(`⏱️ Off route but waiting ${waitTime}s before recalculation`);
                }
            }
        } else {
            // Back on route - reset counters
            if (this.consecutiveOffRouteCount > 0) {
                console.log('✅ Back on route');
            }
            this.consecutiveOffRouteCount = 0;
            this.isOffRoute = false;
        }
    }

    /**
     * Check proximity to instructions
     */
    checkProximityToInstructions(location) {
        if (!this.currentRoute || !this.currentRoute.legs) return;
        
        const steps = this.currentRoute.legs[0].steps;
        if (!steps || this.currentStepIndex >= steps.length) return;
        
        const currentStep = steps[this.currentStepIndex];
        if (!currentStep || !currentStep.maneuver) return;
        
        const maneuverLocation = currentStep.maneuver.location;
        const distanceToManeuver = this.calculateDistance(
            location.lat, location.lng,
            maneuverLocation[1], maneuverLocation[0]
        );
        
        // Announce at 200m, 100m, and at maneuver
        if (distanceToManeuver <= 200 && distanceToManeuver > 100) {
            this.announceInstruction(currentStep, 200);
        } else if (distanceToManeuver <= 100 && distanceToManeuver > 50) {
            this.announceInstruction(currentStep, 100);
        } else if (distanceToManeuver <= 20) {
            this.announceInstruction(currentStep);
            this.currentStepIndex++;
        }
    }

    /**
     * Announce navigation instruction
     */
    announceInstruction(step, distance = null) {
        if (!this.audioManager) return;
        
        const instructionKey = `${this.currentStepIndex}-${distance || 'now'}`;
        if (this.lastAnnouncedStep === instructionKey) return;
        
        // Use the same localized instruction for audio as visual
        const localizedInstruction = this.instructionTranslator.generateLocalizedInstruction(step, distance);
        
        // Create instruction object for audio manager
        const instructionData = {
            type: 'localized',
            text: localizedInstruction,
            maneuver: step.maneuver.type,
            destination: step.maneuver.type === 'arrive' ? this.currentRoute.destination.name : null
        };
        
        this.audioManager.announceNavigation(instructionData, distance);
        
        this.lastAnnouncedStep = instructionKey;
    }

    /**
     * Start navigation with zoom out/in animation
     */
    startNavigationWithZoomAnimation() {
        if (!this.currentRoute) return;
        
        const userLocation = this.locationManager.getUserLocation();
        if (!userLocation) return;
        
        const destinationCoords = [this.currentRoute.destination.lng, this.currentRoute.destination.lat];
        const userCoords = [userLocation.lng, userLocation.lat];
        
        // Calculate distance to determine animation speed
        const distance = this.calculateDistance(
            userLocation.lat, userLocation.lng,
            this.currentRoute.destination.lat, this.currentRoute.destination.lng
        );
        
        // Much faster animations for better UX
        let zoomOutDuration = 300;
        let zoomInDuration = 400;
        
        if (distance > 5000) { // More than 5km
            zoomOutDuration = 150;
            zoomInDuration = 200;
        } else if (distance > 2000) { // More than 2km
            zoomOutDuration = 200;
            zoomInDuration = 300;
        }
        
        console.log(`🎬 Starting navigation animation (distance: ${Math.round(distance)}m, durations: ${zoomOutDuration}/${zoomInDuration}ms)`);
        
        // Step 1: Zoom out to show both user and destination
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(userCoords);
        bounds.extend(destinationCoords);
        
        this.map.fitBounds(bounds, {
            padding: 100,
            duration: zoomOutDuration,
            essential: true
        });
        
        // Step 2: After zoom out, zoom back in to user location for navigation
        setTimeout(() => {
            this.map.flyTo({
                center: userCoords,
                zoom: 16,
                duration: zoomInDuration,
                essential: true
            });
            
            // Start camera following AFTER zoom animation completes
            setTimeout(() => {
                if (this.isFollowingUser && this.isNavigating) {
                    console.log('📹 Starting camera following after zoom animation');
                    this.startCameraFollowing();
                }
            }, zoomInDuration + 100);
            
        }, zoomOutDuration + 50); // Very short delay between animations
    }

    /**
     * Start camera following
     */
    startCameraFollowing() {
        if (!this.locationManager.hasUserLocation() || !this.isNavigating) {
            console.log('🔍 Cannot start camera following: no location or not navigating');
            return;
        }
        
        console.log('📹 Starting camera following during navigation');
        
        const updateCamera = () => {
            // Only follow camera during active navigation
            if (!this.isFollowingUser || !this.isNavigating) {
                console.log('📹 Stopping camera following');
                if (this.cameraFollowAnimationId) {
                    clearInterval(this.cameraFollowAnimationId);
                    this.cameraFollowAnimationId = null;
                }
                return;
            }
            
            const userLocation = this.locationManager.getUserLocation();
            if (userLocation) {
                // Use smooth easeTo for camera following
                this.map.easeTo({
                    center: [userLocation.lng, userLocation.lat],
                    duration: 1000,
                    essential: true
                });
            }
        };
        
        // Use interval with much longer intervals to avoid conflicts
        this.cameraFollowAnimationId = setInterval(updateCamera, 5000); // Update every 5 seconds only
        
        updateCamera();
    }

    /**
     * Update camera position
     */
    updateCameraPosition(location) {
        if (!this.isFollowingUser) return;
        
        this.map.easeTo({
            center: [location.lng, location.lat],
            duration: 200,
            essential: true
        });
    }

    /**
     * Toggle camera following
     */
    toggleCameraFollowing() {
        this.isFollowingUser = !this.isFollowingUser;
        
        if (this.isFollowingUser) {
            this.startCameraFollowing();
        } else {
            if (this.cameraFollowAnimationId) {
                clearInterval(this.cameraFollowAnimationId);
                this.cameraFollowAnimationId = null;
            }
        }
        
        console.log(`📹 Camera following ${this.isFollowingUser ? 'ingeschakeld' : 'uitgeschakeld'}`);
        return this.isFollowingUser;
    }

    /**
     * Calculate distance between two points in meters
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Update navigation UI met progress info
     */
    updateNavigationUI() {
        if (!this.navigationPanel) return;
        
        const progressBar = this.navigationPanel.querySelector('.route-progress-bar');
        const etaElement = this.navigationPanel.querySelector('.navigation-eta');
        const speedElement = this.navigationPanel.querySelector('.navigation-speed');
        const distanceElement = this.navigationPanel.querySelector('.remaining-distance');
        
        if (progressBar) {
            progressBar.style.width = `${this.routeProgress}%`;
        }
        
        if (etaElement) {
            let etaSeconds;
            
            // Use realistic speed calculation with fallbacks
            if (this.averageSpeed > 0.5 && this.averageSpeed < 200) {
                // Use calculated speed (only if reasonable: 0.5-200 km/h)
                etaSeconds = (this.remainingDistance / 1000) / this.averageSpeed * 3600; // hours to seconds
            } else {
                // Fallback to route duration proportional to remaining distance
                const totalDistance = this.currentRoute?.distance || this.remainingDistance;
                const totalDuration = this.currentRoute?.duration || 0; // seconds
                
                if (totalDistance > 0 && totalDuration > 0) {
                    etaSeconds = (this.remainingDistance / totalDistance) * totalDuration;
                } else {
                    // Final fallback: assume walking speed (5 km/h)
                    etaSeconds = (this.remainingDistance / 1000) / 5 * 3600;
                }
            }
            
            // Cap ETA to reasonable values (max 24 hours)
            etaSeconds = Math.min(etaSeconds, 24 * 3600);
            
            // Debug log for ETA calculation issues
            if (etaSeconds > 7200) { // More than 2 hours
                console.warn('⚠️ Large ETA detected:', {
                    etaSeconds,
                    averageSpeed: this.averageSpeed,
                    remainingDistance: this.remainingDistance,
                    routeDistance: this.currentRoute?.distance,
                    routeDuration: this.currentRoute?.duration
                });
            }
            
            etaElement.textContent = this.formatDuration(etaSeconds);
        }
        
        if (speedElement) {
            // Display speed with reasonable bounds
            const displaySpeed = Math.max(0, Math.min(200, Math.round(this.averageSpeed)));
            speedElement.textContent = `${displaySpeed} km/h`;
        }
        
        if (distanceElement) {
            distanceElement.textContent = this.formatDistance(this.remainingDistance);
        }
    }

    /**
     * Fit map naar route
     */
    fitMapToRoute() {
        if (!this.currentRoute || !this.originalRouteCoordinates) return;

        // Use original coordinates to fit the entire route
        const coordinates = this.originalRouteCoordinates;
        const bounds = new mapboxgl.LngLatBounds();

        coordinates.forEach(coord => bounds.extend(coord));
        
        this.map.fitBounds(bounds, {
            padding: 50
        });
    }

    /**
     * Toon navigation panel
     */
    showNavigationPanel() {
        if (!this.currentRoute) return;

        // Remove existing panel
        this.hideNavigationPanel();

        // Create navigation panel
        this.navigationPanel = document.createElement('div');
        this.navigationPanel.className = 'navigation-panel';
        this.navigationPanel.innerHTML = this.generateNavigationHTML();

        // Add to map container
        const mapContainer = document.getElementById('map');
        mapContainer.appendChild(this.navigationPanel);

        // Setup event listeners
        this.setupNavigationListeners();
    }

    /**
     * Genereer navigation HTML
     */
    generateNavigationHTML() {
        const route = this.currentRoute;
        const distance = this.formatDistance(route.distance);
        const duration = this.formatDuration(route.duration);
        const steps = route.legs[0].steps;

        return `
            <div class="navigation-content">
                <!-- Swipe handle for minimizing panel -->
                <div class="navigation-handle">
                    <div class="handle-bar"></div>
                </div>
                <div class="navigation-header">
                    <div class="navigation-info">
                        <h3>${route.destination.name}</h3>
                        <div class="navigation-stats">
                            <span class="stat remaining-distance">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                ${distance}
                            </span>
                            <span class="stat navigation-eta">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                ${duration}
                            </span>
                            <span class="stat navigation-speed">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <path d="M12 17h.01"></path>
                                </svg>
                                0 km/h
                            </span>
                        </div>
                        <div class="route-progress">
                            <div class="route-progress-bar" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="navigation-actions">
                        <button class="nav-btn audio-btn ${this.audioManager?.getStatus().enabled ? 'active' : ''}" title="Audio feedback">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                        </button>
                        <button class="nav-btn camera-btn ${this.isFollowingUser ? 'active' : ''}" title="Camera volgen">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                        </button>
                        <button class="nav-btn profile-btn" title="Vervoerswijze: ${this.getProfileName()}" data-profile="${this.routingProfile}">
                            ${this.getProfileIcon()}
                        </button>
                        <button class="nav-btn close-btn" title="Sluiten">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="navigation-instructions">
                    <div class="instructions-header">
                        <h4>Routebeschrijving</h4>
                        <button class="toggle-instructions">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </button>
                    </div>
                    <div class="instructions-list">
                        ${steps.map((step, index) => this.generateStepHTML(step, index)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genereer stap HTML
     */
    generateStepHTML(step, index) {
        // Use localized instruction instead of raw Mapbox instruction
        const localizedInstruction = this.instructionTranslator.generateLocalizedInstruction(step);
        const distance = this.formatDistance(step.distance);
        const icon = this.getManeuverIcon(step.maneuver.type);

        return `
            <div class="instruction-step">
                <div class="step-icon">${icon}</div>
                <div class="step-content">
                    <div class="step-instruction">${localizedInstruction}</div>
                    <div class="step-distance">${distance}</div>
                </div>
            </div>
        `;
    }

    /**
     * Krijg profiel icon
     */
    getProfileIcon() {
        const icons = {
            walking: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14v8M8 10l4 4 4-4"></path>
            </svg>`,
            driving: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 9.6a2 2 0 0 0-1.9-1.6H7.5a2 2 0 0 0-1.9 1.6L3.5 11.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"></path>
                <circle cx="7" cy="17" r="2"></circle>
                <circle cx="17" cy="17" r="2"></circle>
            </svg>`,
            cycling: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18.5" cy="17.5" r="3.5"></circle>
                <circle cx="5.5" cy="17.5" r="3.5"></circle>
                <circle cx="15" cy="5" r="1"></circle>
                <path d="M12 17.5 9 14l-3 3 3 3"></path>
                <path d="M17 8h-4l-1-2h-4"></path>
            </svg>`
        };
        return icons[this.routingProfile] || icons.walking;
    }
    
    /**
     * Krijg profiel naam
     */
    getProfileName() {
        const names = {
            walking: 'Lopen',
            driving: 'Auto',
            cycling: 'Fiets'
        };
        return names[this.routingProfile] || 'Lopen';
    }

    /**
     * Krijg maneuver icon
     */
    getManeuverIcon(maneuverType) {
        const icons = {
            'turn-straight': '↑',
            'turn-right': '→',
            'turn-left': '←',
            'turn-sharp-right': '↗',
            'turn-sharp-left': '↖',
            'turn-slight-right': '↗',
            'turn-slight-left': '↖',
            'arrive': '🏁',
            'depart': '🚶',
            'merge': '↗',
            'fork': '↗',
            'continue': '↑',
            'roundabout': '↻'
        };
        return icons[maneuverType] || '↑';
    }

    /**
     * Format distance
     */
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    }

    /**
     * Format duration
     */
    formatDuration(seconds) {
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) {
            return `${minutes}min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}u ${remainingMinutes}min`;
        }
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigationListeners() {
        const closeBtn = this.navigationPanel.querySelector('.close-btn');
        const profileBtn = this.navigationPanel.querySelector('.profile-btn');
        const toggleBtn = this.navigationPanel.querySelector('.toggle-instructions');
        const audioBtn = this.navigationPanel.querySelector('.audio-btn');
        const cameraBtn = this.navigationPanel.querySelector('.camera-btn');

        closeBtn.addEventListener('click', () => {
            this.stopNavigation();
        });

        profileBtn.addEventListener('click', () => {
            this.showProfileSelector();
        });

        toggleBtn.addEventListener('click', () => {
            this.toggleInstructions();
        });
        
        audioBtn?.addEventListener('click', () => {
            this.toggleAudio();
        });
        
        cameraBtn?.addEventListener('click', () => {
            this.toggleCameraFollowing();
            this.updateCameraButton();
        });
        
        // Setup swipe gestures for panel minimize/maximize
        this.setupSwipeGestures();
    }

    /**
     * Toon profiel selector
     */
    showProfileSelector() {
        // Verwijder bestaande selector
        this.removeProfileSelector();
        
        const profiles = [
            { id: 'walking', name: 'Lopen', icon: '🚶' },
            { id: 'driving', name: 'Auto', icon: '🚗' },
            { id: 'cycling', name: 'Fiets', icon: '🚲' }
        ];

        // Creëer profile selector overlay
        const overlay = document.createElement('div');
        overlay.className = 'profile-selector-overlay';
        overlay.innerHTML = `
            <div class="profile-selector">
                <h3>Kies vervoerswijze</h3>
                <div class="profile-options">
                    ${profiles.map(profile => `
                        <button class="profile-option ${profile.id === this.routingProfile ? 'active' : ''}" 
                                data-profile="${profile.id}">
                            <div class="profile-icon">${profile.icon}</div>
                            <div class="profile-name">${profile.name}</div>
                        </button>
                    `).join('')}
                </div>
                <button class="profile-cancel">Annuleren</button>
            </div>
        `;
        
        // Voeg toe aan body
        document.body.appendChild(overlay);
        
        // Setup event listeners
        this.setupProfileSelectorListeners(overlay, profiles);
        
        // Animatie
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    }
    
    /**
     * Setup profile selector event listeners
     */
    setupProfileSelectorListeners(overlay, profiles) {
        // Profile option clicks
        overlay.querySelectorAll('.profile-option').forEach(button => {
            button.addEventListener('click', () => {
                const profileId = button.dataset.profile;
                if (profileId !== this.routingProfile) {
                    this.routingProfile = profileId;
                    this.removeProfileSelector();
                    this.recalculateRoute();
                }
            });
        });
        
        // Cancel button
        overlay.querySelector('.profile-cancel').addEventListener('click', () => {
            this.removeProfileSelector();
        });
        
        // Overlay click (outside selector)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.removeProfileSelector();
            }
        });
        
        // Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.removeProfileSelector();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    /**
     * Verwijder profile selector
     */
    removeProfileSelector() {
        const overlay = document.querySelector('.profile-selector-overlay');
        if (overlay) {
            overlay.classList.add('hide');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    /**
     * Herbereken route met nieuw profiel
     */
    async recalculateRoute() {
        if (!this.currentRoute) return;

        try {
            const destination = this.currentRoute.destination;
            console.log(`🔄 Herberekenen route voor ${this.getProfileName()}...`);
            await this.calculateRoute(destination.lat, destination.lng, destination.name);
            
            // Update profile button appearance
            this.updateProfileButton();
            
        } catch (error) {
            console.error('❌ Fout bij herberekenen route:', error);
            alert('Fout bij herberekenen route');
        }
    }
    
    /**
     * Update profile button appearance
     */
    updateProfileButton() {
        const profileBtn = this.navigationPanel?.querySelector('.profile-btn');
        if (profileBtn) {
            profileBtn.innerHTML = this.getProfileIcon();
            profileBtn.title = `Vervoerswijze: ${this.getProfileName()}`;
            profileBtn.setAttribute('data-profile', this.routingProfile);
        }
    }

    /**
     * Toggle instructions
     */
    toggleInstructions() {
        const instructionsList = this.navigationPanel.querySelector('.instructions-list');
        const toggleBtn = this.navigationPanel.querySelector('.toggle-instructions');
        
        if (instructionsList.style.display === 'none') {
            instructionsList.style.display = 'block';
            toggleBtn.style.transform = 'rotate(0deg)';
        } else {
            instructionsList.style.display = 'none';
            toggleBtn.style.transform = 'rotate(-90deg)';
        }
    }

    /**
     * Verberg navigation panel
     */
    hideNavigationPanel() {
        if (this.navigationPanel) {
            this.navigationPanel.remove();
            this.navigationPanel = null;
        }
    }

    /**
     * Toggle audio feedback
     */
    toggleAudio() {
        if (!this.audioManager) return;
        
        const isEnabled = this.audioManager.toggleAudio();
        this.updateAudioButton(isEnabled);
        
        if (isEnabled) {
            this.audioManager.speak('Audio feedback ingeschakeld', 'urgent', true);
        }
    }
    
    /**
     * Update audio button appearance
     */
    updateAudioButton(enabled = null) {
        const audioBtn = this.navigationPanel?.querySelector('.audio-btn');
        if (!audioBtn) return;
        
        const isEnabled = enabled !== null ? enabled : this.audioManager?.getStatus().enabled;
        
        if (isEnabled) {
            audioBtn.classList.add('active');
            audioBtn.title = 'Audio uitschakelen';
        } else {
            audioBtn.classList.remove('active');
            audioBtn.title = 'Audio inschakelen';
        }
    }
    
    /**
     * Update camera button appearance
     */
    updateCameraButton() {
        const cameraBtn = this.navigationPanel?.querySelector('.camera-btn');
        if (!cameraBtn) return;
        
        if (this.isFollowingUser) {
            cameraBtn.classList.add('active');
            cameraBtn.title = 'Camera volgen uitschakelen';
        } else {
            cameraBtn.classList.remove('active');
            cameraBtn.title = 'Camera volgen inschakelen';
        }
    }

    /**
     * Stop navigation
     */
    stopNavigation() {
        console.log('🛑 Stopping navigation and camera following');
        
        // Store destination before clearing route
        const destination = this.currentRoute?.destination;
        
        this.isNavigating = false;
        this.currentRoute = null;
        
        // Stop camera following immediately
        if (this.cameraFollowAnimationId) {
            clearInterval(this.cameraFollowAnimationId);
            this.cameraFollowAnimationId = null;
        }
        
        // Reset camera following state
        this.isFollowingUser = true; // Reset for next navigation
        
        // Stop audio
        if (this.audioManager) {
            this.audioManager.stopSpeaking();
        }
        
        // Clear route from map
        this.map.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: []
            }
        });
        
        // Route will be dynamically reset during next navigation

        // Clear route markers
        this.map.getSource('route-markers').setData({
            type: 'FeatureCollection',
            features: []
        });

        // Fly back to destination if available
        if (destination) {
            console.log(`🎯 Flying back to destination: ${destination.name}`);
            this.map.flyTo({
                center: [destination.lng, destination.lat],
                zoom: 17,
                pitch: 0,
                bearing: 0,
                duration: 1000,
                essential: true
            });
        }

        // Hide navigation panel
        this.hideNavigationPanel();
        
        console.log('🛑 Navigatie gestopt');
    }

    /**
     * Navigeer naar locatie vanaf popup
     */
    async navigateToLocation(properties) {
        console.log('🧭 Navigatie gestart voor:', properties);
        
        // Probeer verschillende manieren om coordinates te krijgen
        let lat, lng;
        
        if (properties.coordinates && Array.isArray(properties.coordinates)) {
            lng = properties.coordinates[0];
            lat = properties.coordinates[1];
        } else if (properties.lat && properties.lng) {
            lat = properties.lat;
            lng = properties.lng;
        } else if (properties.geometry && properties.geometry.coordinates) {
            lng = properties.geometry.coordinates[0];
            lat = properties.geometry.coordinates[1];
        } else {
            console.error('❌ Geen coordinaten gevonden in properties:', properties);
            throw new Error('Geen coordinaten beschikbaar voor deze locatie');
        }
        
        // Valideer coordinaten
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            console.error('❌ Ongeldige coordinaten:', { lat, lng });
            throw new Error('Ongeldige locatie coordinaten');
        }
        
        const name = properties.name || 'Bestemming';
        
        console.log('📍 Navigeren naar:', { name, lat, lng });
        
        try {
            await this.calculateRoute(lat, lng, name);
            return true;
        } catch (error) {
            console.error('❌ Navigatie fout:', error);
            throw error;
        }
    }

    /**
     * Krijg huidige route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Check of er navigatie actief is
     */
    isNavigationActive() {
        return this.isNavigating;
    }

    /**
     * Cleanup navigation manager
     */
    destroy() {
        this.stopNavigation();
        
        // Stop camera following
        if (this.cameraFollowAnimationId) {
            cancelAnimationFrame(this.cameraFollowAnimationId);
        }
        
        // Remove route layers
        const layersToRemove = ['route-background', 'route', 'route-start', 'route-end'];
        layersToRemove.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });
        
        // Remove sources
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }
        // Route-completed source removed - using dynamic route updates instead
        if (this.map.getSource('route-markers')) {
            this.map.removeSource('route-markers');
        }
        
        this.isInitialized = false;
        console.log('🗑️ Navigation manager vernietigd');
    }
    
    /**
     * Update panel states based on screen size
     */
    updatePanelStates() {
        // Simple minimize/maximize states - back to original behavior
        this.isPanelMinimized = false;
    }

    /**
     * Setup swipe gestures for bottom sheet
     */
    setupSwipeGestures() {
        if (!this.navigationPanel) return;
        
        const handle = this.navigationPanel.querySelector('.navigation-handle');
        if (!handle) return;
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let startTime = 0;
        
        const handleStart = (e) => {
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            currentY = startY;
            isDragging = true;
            startTime = Date.now();
            this.navigationPanel.style.transition = 'none';
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            const deltaY = currentY - startY;
            
            // Calculate current transform based on panel state and delta
            let currentTransform = 0;
            switch (this.panelState) {
                case 'collapsed':
                    currentTransform = this.navigationPanel.offsetHeight - 120;
                    break;
                case 'partial':
                    currentTransform = this.navigationPanel.offsetHeight - 300;
                    break;
                case 'expanded':
                    currentTransform = 0;
                    break;
            }
            
            // Apply drag transform
            const newTransform = Math.max(0, Math.min(this.navigationPanel.offsetHeight - 120, currentTransform + deltaY));
            this.navigationPanel.style.transform = `translateY(${newTransform}px)`;
        };
        
        const handleEnd = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            this.navigationPanel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
            
            const deltaY = currentY - startY;
            const velocity = Math.abs(deltaY) / (Date.now() - startTime);
            
            // Determine new state based on direction and velocity
            if (velocity > 0.5) {
                // Fast swipe
                if (deltaY > 0) {
                    // Swipe down
                    this.setPanelState(this.panelState === 'expanded' ? 'partial' : 'collapsed');
                } else {
                    // Swipe up
                    this.setPanelState(this.panelState === 'collapsed' ? 'partial' : 'expanded');
                }
            } else {
                // Slow drag - determine by distance
                if (Math.abs(deltaY) > 100) {
                    if (deltaY > 0) {
                        // Drag down
                        this.setPanelState(this.panelState === 'expanded' ? 'partial' : 'collapsed');
                    } else {
                        // Drag up
                        this.setPanelState(this.panelState === 'collapsed' ? 'partial' : 'expanded');
                    }
                } else {
                    // Snap back to current state
                    this.setPanelState(this.panelState);
                }
            }
        };
        
        // Touch events
        handle.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        
        // Mouse events
        handle.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        
        // Handle click to toggle states
        handle.addEventListener('click', (e) => {
            if (!isDragging && Date.now() - startTime < 200) {
                this.togglePanelState();
            }
        });
        
        console.log('✅ Bottom sheet swipe gestures setup');
    }
    
    /**
     * Minimize navigation panel
     */
    minimizePanel() {
        this.setPanelState('collapsed');
    }
    
    /**
     * Maximize navigation panel
     */
    maximizePanel() {
        this.setPanelState('expanded');
    }
    
    /**
     * Set bottom sheet state
     */
    setPanelState(state) {
        if (!this.navigationPanel) return;
        
        // Remove all state classes
        this.navigationPanel.classList.remove('collapsed', 'partial', 'expanded');
        
        // Add new state class
        this.navigationPanel.classList.add(state);
        this.panelState = state;
        
        console.log(`📱 Navigation panel set to ${state}`);
    }
    
    /**
     * Toggle panel state
     */
    togglePanelState() {
        switch (this.panelState) {
            case 'collapsed':
                this.setPanelState('partial');
                break;
            case 'partial':
                this.setPanelState('expanded');
                break;
            case 'expanded':
                this.setPanelState('collapsed');
                break;
        }
    }
}

// Export voor gebruik in andere modules
window.NavigationManager = NavigationManager;