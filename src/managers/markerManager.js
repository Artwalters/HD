// ==============================
// MARKER MANAGER MODULE
// ==============================

class MarkerManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.sourceId = 'businesses';
        this.markersLayerId = 'business-markers';
        this.labelsLayerId = 'business-labels';
        this.heartsLayerId = 'business-hearts';
        this.isInitialized = false;
    }

    /**
     * Initialiseert markers op de kaart
     * @param {Object} data - GeoJSON data
     */
    async initialize(data) {
        if (!data || !data.features) {
            console.warn('⚠️ Geen geldige data voor markers');
            return;
        }

        // Verwijder bestaande layers en sources
        this.cleanup();

        // Laad PNG iconen als images
        await this.loadMarkerIcons();

        // Voeg data source toe
        if (!this.map.getSource(this.sourceId)) {
            this.map.addSource(this.sourceId, {
                type: 'geojson',
                data: data
            });
        } else {
            // Update existing source
            this.map.getSource(this.sourceId).setData(data);
        }

        // Voeg marker circles layer toe
        this.addMarkersLayer();
        
        // Voeg icon labels layer toe
        this.addIconsLayer();
        
        // Voeg hearts layer toe voor liked markers
        this.addHeartsLayer();
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log(`✅ Markers geïnitialiseerd: ${data.features.length} items`);
    }

    /**
     * Voegt marker circles layer toe
     */
    addMarkersLayer() {
        this.map.addLayer({
            id: this.markersLayerId,
            type: 'circle',
            source: this.sourceId,
            paint: {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    this.config.markerZoom.min, 3.456,
                    this.config.markerZoom.small, 5.76,
                    this.config.markerZoom.medium, 8.064,
                    this.config.markerZoom.large, 10.368
                ],
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.9
            }
        });
    }

    /**
     * Voegt icon labels layer toe
     */
    addIconsLayer() {
        this.map.addLayer({
            id: this.labelsLayerId,
            type: 'symbol',
            source: this.sourceId,
            layout: {
                'icon-image': this.createIconImageExpression(),
                'icon-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    this.config.markerZoom.min, 0.0648,
                    this.config.markerZoom.small, 0.108,
                    this.config.markerZoom.medium, 0.1512,
                    this.config.markerZoom.large, 0.1944
                ],
                'icon-anchor': 'center',
                'icon-allow-overlap': true
            }
        });
    }

    /**
     * Voegt hearts layer toe voor liked markers
     */
    addHeartsLayer() {
        this.map.addLayer({
            id: this.heartsLayerId,
            type: 'symbol',
            source: this.sourceId,
            layout: {
                'text-field': '❤️',
                'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    this.config.markerZoom.min, 8,
                    this.config.markerZoom.small, 12,
                    this.config.markerZoom.medium, 14,
                    this.config.markerZoom.large, 16
                ],
                'text-anchor': 'center',
                'text-offset': [0.8, -0.8],
                'text-allow-overlap': true,
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
            },
            filter: ['==', ['get', 'liked'], true] // Alleen tonen als liked
        });
    }

    /**
     * Laadt PNG iconen als Mapbox images
     */
    async loadMarkerIcons() {
        const iconPaths = [
            { name: 'cultuur-icon', path: './assets/icons_map/Cultuur.png' },
            { name: 'horeca-icon', path: './assets/icons_map/horeca.png' },
            { name: 'winkelen-icon', path: './assets/icons_map/Winkelen.png' },
            { name: 'bezienswaardighedene-icon', path: './assets/icons_map/Bezienwaardigheden.png' },
            { name: 'murals-icon', path: './assets/icons_map/Murals.png' }
        ];

        for (const iconData of iconPaths) {
            try {
                const image = await this.loadImage(iconData.path);
                if (!this.map.hasImage(iconData.name)) {
                    this.map.addImage(iconData.name, image);
                }
            } catch (error) {
                console.warn(`⚠️ Kon icon niet laden: ${iconData.path}`, error);
            }
        }
    }

    /**
     * Helper functie om image te laden
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Creëert expressie voor icon image mapping
     * @returns {Array} Mapbox expression voor icon image mapping
     */
    createIconImageExpression() {
        const expression = ['case'];
        
        // Map PNG paths naar icon names
        expression.push(
            ['==', ['get', 'icon'], 'assets/icons_map/Cultuur.png'],
            'cultuur-icon'
        );
        expression.push(
            ['==', ['get', 'icon'], 'assets/icons_map/horeca.png'],
            'horeca-icon'
        );
        expression.push(
            ['==', ['get', 'icon'], 'assets/icons_map/Winkelen.png'],
            'winkelen-icon'
        );
        expression.push(
            ['==', ['get', 'icon'], 'assets/icons_map/Bezienwaardigheden.png'],
            'bezienswaardighedene-icon'
        );
        expression.push(
            ['==', ['get', 'icon'], 'assets/icons_map/Murals.png'],
            'murals-icon'
        );
        
        // Default fallback - gebruik eerste icon als backup
        expression.push('cultuur-icon');
        
        return expression;
    }

    /**
     * Setup event listeners voor markers
     */
    setupEventListeners() {
        // Cursor change on hover
        this.map.on('mouseenter', this.markersLayerId, () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', this.markersLayerId, () => {
            this.map.getCanvas().style.cursor = '';
        });
    }

    /**
     * Update markers met nieuwe data
     * @param {Object} data - Nieuwe GeoJSON data
     */
    async updateData(data) {
        if (!this.isInitialized) {
            await this.initialize(data);
            return;
        }

        const source = this.map.getSource(this.sourceId);
        if (source) {
            source.setData(data);
            console.log(`🔄 Markers bijgewerkt: ${data.features.length} items`);
        }
    }

    /**
     * Filtert markers op categorie
     * @param {string} category - Categorie om te tonen (null = alle)
     */
    filterByCategory(category) {
        if (!this.isInitialized) return;

        const filter = category ? 
            ['==', ['get', 'category'], category] : 
            null;

        this.map.setFilter(this.markersLayerId, filter);
        this.map.setFilter(this.labelsLayerId, filter);
        
        // Hearts layer heeft gecombineerde filter: liked EN category
        const heartsFilter = category ? 
            ['all', 
                ['==', ['get', 'liked'], true],
                ['==', ['get', 'category'], category]
            ] : 
            ['==', ['get', 'liked'], true];
            
        this.map.setFilter(this.heartsLayerId, heartsFilter);
        
        console.log(`🔍 Markers gefilterd op: ${category || 'alle categorieën'}`);
    }

    /**
     * Toont/verbergt markers
     * @param {boolean} visible - Zichtbaarheid
     */
    setVisibility(visible) {
        if (!this.isInitialized) return;

        const visibility = visible ? 'visible' : 'none';
        
        this.map.setLayoutProperty(this.markersLayerId, 'visibility', visibility);
        this.map.setLayoutProperty(this.labelsLayerId, 'visibility', visibility);
        this.map.setLayoutProperty(this.heartsLayerId, 'visibility', visibility);
        
        console.log(`👁️ Markers zichtbaarheid: ${visible ? 'zichtbaar' : 'verborgen'}`);
    }

    /**
     * Update marker styling
     * @param {Object} styleOptions - Styling opties
     */
    updateStyle(styleOptions = {}) {
        if (!this.isInitialized) return;

        // Update circle properties
        if (styleOptions.radius) {
            this.map.setPaintProperty(this.markersLayerId, 'circle-radius', styleOptions.radius);
        }
        
        if (styleOptions.opacity) {
            this.map.setPaintProperty(this.markersLayerId, 'circle-opacity', styleOptions.opacity);
        }

        if (styleOptions.strokeWidth) {
            this.map.setPaintProperty(this.markersLayerId, 'circle-stroke-width', styleOptions.strokeWidth);
        }

        // Update text properties
        if (styleOptions.textSize) {
            this.map.setLayoutProperty(this.labelsLayerId, 'text-size', styleOptions.textSize);
        }

        console.log('🎨 Marker styling bijgewerkt');
    }

    /**
     * Update liked status van markers
     * @param {Set|Array} likedIds - Set of Array van liked location IDs
     */
    updateLikedStatus(likedIds) {
        if (!this.isInitialized) {
            console.warn('⚠️ MarkerManager not initialized yet');
            return;
        }

        const source = this.map.getSource(this.sourceId);
        if (!source) {
            console.warn('⚠️ No source found for markers');
            return;
        }

        const data = source._data;
        if (!data || !data.features) {
            console.warn('⚠️ No data or features found');
            return;
        }

        // Convert to Set if it's an array
        const likedSet = likedIds instanceof Set ? likedIds : new Set(likedIds);
        
        console.log('🔍 Updating liked status with IDs:', Array.from(likedSet));

        // Update liked property voor alle features
        let updatedCount = 0;
        data.features.forEach(feature => {
            const featureId = String(feature.properties.id);
            const wasLiked = feature.properties.liked;
            const isLiked = likedSet.has(featureId) || likedSet.has(parseInt(featureId));
            
            if (wasLiked !== isLiked) {
                feature.properties.liked = isLiked;
                updatedCount++;
                console.log(`🔄 ${feature.properties.name} (ID: ${featureId}) liked: ${wasLiked} → ${isLiked}`);
            }
        });

        // Update de source data
        source.setData(data);
        
        console.log(`💖 Liked status bijgewerkt voor ${updatedCount} locaties (${likedSet.size} total likes)`);
    }

    /**
     * Markeert een marker als actief met animatie
     * @param {string} locationId - ID van de locatie
     */
    setActiveMarker(locationId) {
        if (!this.isInitialized) return;

        console.log(`🎯 Setting active marker: ${locationId}`);

        const source = this.map.getSource(this.sourceId);
        if (!source) return;

        const data = source._data;
        if (!data || !data.features) return;

        // Reset alle markers en markeer de actieve
        data.features.forEach(feature => {
            feature.properties.isActive = (feature.properties.id === locationId);
        });

        // Update de source data
        source.setData(data);

        // Start animatie voor actieve marker (alleen wiggle, geen scaling)
        this.startMarkerAnimation(locationId);
    }

    /**
     * Verwijdert actieve marker status
     */
    clearActiveMarker() {
        if (!this.isInitialized) return;

        console.log('🎯 Clearing active marker');

        const source = this.map.getSource(this.sourceId);
        if (!source) return;

        const data = source._data;
        if (!data || !data.features) return;

        // Reset alle markers
        data.features.forEach(feature => {
            feature.properties.isActive = false;
        });

        // Update de source data
        source.setData(data);

        // Stop animatie
        this.stopMarkerAnimation();
    }


    /**
     * Start subtiele wiggle animatie voor actieve marker
     * @param {string} locationId - ID van de actieve locatie
     */
    startMarkerAnimation(locationId) {
        // Stop bestaande animatie
        this.stopMarkerAnimation();

        let animationStep = 0;
        const animationSpeed = 0.1;
        const wiggleAmount = 1.5; // pixels

        this.animationId = setInterval(() => {
            animationStep += animationSpeed;
            
            // Bereken wiggle offset (subtiele sinus wave)
            const offsetX = Math.sin(animationStep) * wiggleAmount;
            const offsetY = Math.cos(animationStep * 1.3) * wiggleAmount * 0.7;

            // Update text offset voor icon (subtle wiggle)
            this.map.setLayoutProperty(this.labelsLayerId, 'icon-offset', [
                'case',
                ['==', ['get', 'isActive'], true],
                [offsetX, offsetY],
                [0, 0]
            ]);

            // Update opacity voor pulsing effect
            const pulse = 0.7 + Math.sin(animationStep * 2) * 0.3; // 0.4 tot 1.0
            this.map.setPaintProperty(this.markersLayerId, 'circle-opacity', [
                'case',
                ['==', ['get', 'isActive'], true],
                pulse,
                0.9
            ]);

        }, 50); // 50ms = 20fps voor smooth animatie
    }

    /**
     * Stop marker animatie
     */
    stopMarkerAnimation() {
        if (this.animationId) {
            clearInterval(this.animationId);
            this.animationId = null;
        }

        // Reset offsets en opacity
        if (this.isInitialized) {
            this.map.setLayoutProperty(this.labelsLayerId, 'icon-offset', [0, 0]);
            this.map.setPaintProperty(this.markersLayerId, 'circle-opacity', 0.9);
        }
    }

    /**
     * Krijg marker op positie
     * @param {Object} point - Screen coordinate {x, y}
     * @returns {Array} Features op die positie
     */
    getMarkersAtPoint(point) {
        if (!this.isInitialized) return [];

        return this.map.queryRenderedFeatures(point, { 
            layers: [this.markersLayerId] 
        });
    }

    /**
     * Cleanup markers en sources
     */
    cleanup() {
        // Stop animatie
        this.stopMarkerAnimation();
        
        // Verwijder layers als ze bestaan
        if (this.map.getLayer(this.heartsLayerId)) {
            this.map.removeLayer(this.heartsLayerId);
        }
        
        if (this.map.getLayer(this.labelsLayerId)) {
            this.map.removeLayer(this.labelsLayerId);
        }
        
        if (this.map.getLayer(this.markersLayerId)) {
            this.map.removeLayer(this.markersLayerId);
        }
        
        // Verwijder source als deze bestaat
        if (this.map.getSource(this.sourceId)) {
            this.map.removeSource(this.sourceId);
        }

        this.isInitialized = false;
    }

    /**
     * Krijg statistieken over huidige markers
     * @returns {Object} Marker statistieken
     */
    getStats() {
        if (!this.isInitialized) {
            return { visible: 0, total: 0 };
        }

        const source = this.map.getSource(this.sourceId);
        const data = source?._data;
        
        return {
            total: data?.features?.length || 0,
            visible: this.map.queryRenderedFeatures({ layers: [this.markersLayerId] }).length
        };
    }
}

// Export voor gebruik in andere modules
window.MarkerManager = MarkerManager;