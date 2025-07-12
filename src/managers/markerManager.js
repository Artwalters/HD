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
        this.isInitialized = false;
    }

    /**
     * Initialiseert markers op de kaart
     * @param {Object} data - GeoJSON data
     */
    initialize(data) {
        if (!data || !data.features) {
            console.warn('⚠️ Geen geldige data voor markers');
            return;
        }

        // Verwijder bestaande layers en sources
        this.cleanup();

        // Voeg data source toe
        this.map.addSource(this.sourceId, {
            type: 'geojson',
            data: data
        });

        // Voeg marker circles layer toe
        this.addMarkersLayer();
        
        // Voeg text labels layer toe
        this.addLabelsLayer();
        
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
                    this.config.markerZoom.min, 2.4,
                    this.config.markerZoom.small, 4,
                    this.config.markerZoom.medium, 5.6,
                    this.config.markerZoom.large, 7.2
                ],
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.9
            }
        });
    }

    /**
     * Voegt text labels layer toe
     */
    addLabelsLayer() {
        this.map.addLayer({
            id: this.labelsLayerId,
            type: 'symbol',
            source: this.sourceId,
            layout: {
                'text-field': this.createIconExpression(),
                'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    this.config.markerZoom.min, 6.4,
                    this.config.markerZoom.small, 9.6,
                    this.config.markerZoom.medium, 12.8,
                    this.config.markerZoom.large, 16
                ],
                'text-anchor': 'center',
                'text-allow-overlap': true,
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
            },
            paint: {
                'text-color': '#ffffff'
            }
        });
    }

    /**
     * Creëert expressie voor icon mapping
     * @returns {Array} Mapbox expression voor icon mapping
     */
    createIconExpression() {
        const expression = ['case'];
        
        // Voeg alle categorie mappings toe
        Object.entries(this.config.categories).forEach(([category, categoryConfig]) => {
            // Voor elke categorie, map de icons
            Object.entries(categoryConfig.iconMap).forEach(([emoji, letter]) => {
                expression.push(
                    ['==', ['get', 'icon'], emoji],
                    letter
                );
            });
        });
        
        // Default fallback
        expression.push('•'); // Default icon
        
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
    updateData(data) {
        if (!this.isInitialized) {
            this.initialize(data);
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
        // Verwijder layers als ze bestaan
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