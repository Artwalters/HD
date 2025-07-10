// ==============================
// APPLICATION MANAGER
// ==============================

class AppManager {
    constructor() {
        this.config = window.HeerlenConfig;
        this.map = null;
        this.dataLoader = null;
        this.markerManager = null;
        this.popupManager = null;
        this.filterManager = null;
        this.controlsManager = null;
        this.locationManager = null;
        this.navigationManager = null;
        this.audioManager = null;
        this.isInitialized = false;
    }

    /**
     * Initialiseert de volledige applicatie
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ App al geïnitialiseerd');
            return;
        }

        try {
            console.log('🚀 Heerlen Doen wordt geïnitialiseerd...');
            
            // 1. Initialiseer map
            await this.initializeMap();
            
            // 2. Initialiseer data loader
            this.initializeDataLoader();
            
            // 3. Initialiseer marker manager
            this.initializeMarkerManager();
            
            // 4. Initialiseer popup manager
            this.initializePopupManager();
            
            // 5. Initialiseer filter manager
            this.initializeFilterManager();
            
            // 6. Initialiseer controls manager
            this.initializeControlsManager();
            
            // 7. Initialiseer audio manager
            this.initializeAudioManager();
            
            // 8. Initialiseer location manager
            this.initializeLocationManager();
            
            // 9. Initialiseer navigation manager
            this.initializeNavigationManager();
            
            // 10. Laad en toon data
            await this.loadAndDisplayData();
            
            this.isInitialized = true;
            console.log('✅ Heerlen Doen succesvol geïnitialiseerd!');
            
            // Toon statistieken
            this.logStats();
            
        } catch (error) {
            console.error('❌ Fout bij initialiseren van app:', error);
            throw error;
        }
    }

    /**
     * Initialiseert Mapbox kaart
     */
    async initializeMap() {
        return new Promise((resolve, reject) => {
            // Set access token
            mapboxgl.accessToken = this.config.map.accessToken;

            // Get performance optimized config
            const optimizedConfig = window.PerformanceManager?.getOptimizedMapConfig({
                container: "map",
                style: this.config.map.style,
                center: this.config.map.center,
                zoom: this.config.map.zoom,
                pitch: this.config.map.pitch,
                bearing: this.config.map.bearing,
                antialias: true,
                interactive: true,
                renderWorldCopies: false,
                preserveDrawingBuffer: false,
                maxParallelImageRequests: 16,
                fadeDuration: 0
            }) || {
                container: "map",
                style: this.config.map.style,
                center: this.config.map.center,
                zoom: this.config.map.zoom,
                pitch: this.config.map.pitch,
                bearing: this.config.map.bearing,
                antialias: true,
                interactive: true,
                renderWorldCopies: false,
                preserveDrawingBuffer: false,
                maxParallelImageRequests: 16,
                fadeDuration: 0
            };

            // Create map with optimized config
            this.map = new mapboxgl.Map(optimizedConfig);

            // Don't add default controls - we'll use custom ones

            // Wait for map to load
            this.map.on('load', () => {
                console.log('✅ Mapbox kaart geladen');
                resolve();
            });

            this.map.on('error', (error) => {
                console.error('❌ Mapbox error:', error);
                reject(error);
            });
        });
    }

    /**
     * Initialiseert data loader
     */
    initializeDataLoader() {
        this.dataLoader = new DataLoader(this.config);
        console.log('✅ Data loader geïnitialiseerd');
    }

    /**
     * Initialiseert marker manager
     */
    initializeMarkerManager() {
        this.markerManager = new MarkerManager(this.map, this.config);
        console.log('✅ Marker manager geïnitialiseerd');
    }

    /**
     * Initialiseert popup manager
     */
    initializePopupManager() {
        this.popupManager = new PopupManager(this.map, this.config);
        this.popupManager.initialize();
        console.log('✅ Popup manager geïnitialiseerd');
    }

    /**
     * Initialiseert filter manager
     */
    initializeFilterManager() {
        this.filterManager = new FilterManager(this, this.config);
        this.filterManager.initialize();
        console.log('✅ Filter manager geïnitialiseerd');
    }

    /**
     * Initialiseert controls manager
     */
    initializeControlsManager() {
        this.controlsManager = new ControlsManager(this.map, this.config);
        this.controlsManager.initialize();
        console.log('✅ Controls manager geïnitialiseerd');
    }

    /**
     * Initialiseert audio manager
     */
    initializeAudioManager() {
        this.audioManager = new AudioManager(this.config);
        console.log('🔊 Audio Manager geïnitialiseerd');
    }

    /**
     * Initialiseert location manager
     */
    initializeLocationManager() {
        this.locationManager = new LocationManager(this.map, this.config);
        this.locationManager.initialize();
        console.log('✅ Location manager geïnitialiseerd');
    }

    /**
     * Initialiseert navigation manager
     */
    initializeNavigationManager() {
        this.navigationManager = new NavigationManager(this.map, this.config, this.locationManager, this.audioManager);
        this.navigationManager.initialize();
        console.log('✅ Navigation manager geïnitialiseerd');
    }

    /**
     * Laadt en toont alle data
     */
    async loadAndDisplayData() {
        try {
            // Laad alle data
            const allData = await this.dataLoader.loadAllData();
            
            // Initialiseer markers met data
            this.markerManager.initialize(allData);
            
            // Update filter data
            if (this.filterManager) {
                this.filterManager.updateData();
            }
            
            console.log('✅ Data geladen en markers getoond');
            
        } catch (error) {
            console.error('❌ Fout bij laden van data:', error);
            throw error;
        }
    }

    /**
     * Filtert markers op categorie
     * @param {string} category - Categorie naam (null voor alle)
     */
    filterByCategory(category = null) {
        if (!this.isInitialized) {
            console.warn('⚠️ App nog niet geïnitialiseerd');
            return;
        }

        this.markerManager.filterByCategory(category);
        
        const categoryText = category || 'alle categorieën';
        console.log(`🔍 Gefilterd op: ${categoryText}`);
    }

    /**
     * Zoekt in data
     * @param {string} searchTerm - Zoekterm
     */
    search(searchTerm) {
        if (!this.isInitialized) {
            console.warn('⚠️ App nog niet geïnitialiseerd');
            return;
        }

        const filteredData = this.dataLoader.search(searchTerm);
        this.markerManager.updateData(filteredData);
        
        console.log(`🔍 Zoekresultaten voor "${searchTerm}": ${filteredData.features.length} items`);
        return filteredData;
    }

    /**
     * Update thema kleuren
     * @param {Object} newTheme - Nieuwe thema kleuren
     */
    updateTheme(newTheme) {
        // Update configuratie
        Object.assign(this.config.theme, newTheme);
        
        // Update CSS variabelen
        const root = document.documentElement;
        Object.entries(newTheme).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
        
        console.log('🎨 Thema bijgewerkt:', newTheme);
    }

    /**
     * Voegt nieuwe categorie toe
     * @param {string} categoryName - Naam van nieuwe categorie
     * @param {Object} categoryConfig - Configuratie voor categorie
     */
    addCategory(categoryName, categoryConfig) {
        // Voeg toe aan configuratie
        this.config.categories[categoryName] = categoryConfig;
        
        // Update CSS variabelen
        const root = document.documentElement;
        root.style.setProperty(`--color-${categoryName.toLowerCase()}`, categoryConfig.color);
        
        console.log(`➕ Nieuwe categorie toegevoegd: ${categoryName}`);
    }

    /**
     * Laadt data voor nieuwe categorie
     * @param {string} categoryName - Naam van categorie
     * @param {string} dataSource - URL naar data bestand
     */
    async loadNewCategoryData(categoryName, dataSource) {
        // Voeg data bron toe aan configuratie
        this.config.dataSources[categoryName] = dataSource;
        
        try {
            // Laad nieuwe data
            const categoryData = await this.dataLoader.loadCategoryData(categoryName);
            
            if (categoryData) {
                // Herlaad alle data
                this.dataLoader.clearCache();
                const allData = await this.dataLoader.loadAllData();
                
                // Update markers
                this.markerManager.updateData(allData);
                
                console.log(`✅ Nieuwe categorie data geladen: ${categoryName}`);
            }
            
        } catch (error) {
            console.error(`❌ Fout bij laden van ${categoryName} data:`, error);
        }
    }

    /**
     * Exporteert huidige configuratie
     * @returns {Object} Huidige configuratie
     */
    exportConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * Importeert nieuwe configuratie
     * @param {Object} newConfig - Nieuwe configuratie
     */
    async importConfig(newConfig) {
        // Valideer configuratie
        if (!this.validateConfig(newConfig)) {
            throw new Error('Ongeldige configuratie');
        }

        // Update configuratie
        Object.assign(this.config, newConfig);
        
        // Herinitialiseer als nodig
        if (this.isInitialized) {
            await this.reinitialize();
        }
        
        console.log('📥 Configuratie geïmporteerd');
    }

    /**
     * Herïnitialiseert de applicatie
     */
    async reinitialize() {
        console.log('🔄 App wordt herïnitialiseerd...');
        
        // Cleanup huidige state
        this.cleanup();
        
        // Reset flags
        this.isInitialized = false;
        
        // Herinitialiseer
        await this.initialize();
    }

    /**
     * Valideer configuratie
     * @param {Object} config - Te valideren configuratie
     * @returns {boolean} Of configuratie geldig is
     */
    validateConfig(config) {
        const required = ['map', 'categories', 'theme', 'dataSources'];
        return required.every(key => key in config);
    }

    /**
     * Krijg statistieken over applicatie
     * @returns {Object} App statistieken
     */
    getStats() {
        const stats = {
            initialized: this.isInitialized,
            categories: Object.keys(this.config.categories).length,
            dataSources: Object.keys(this.config.dataSources).length
        };

        if (this.dataLoader) {
            Object.assign(stats, this.dataLoader.getStats());
        }

        if (this.markerManager) {
            Object.assign(stats, { markers: this.markerManager.getStats() });
        }

        return stats;
    }

    /**
     * Log statistieken naar console
     */
    logStats() {
        const stats = this.getStats();
        console.log('📊 App Statistieken:', stats);
    }

    /**
     * Cleanup alle managers
     */
    cleanup() {
        if (this.popupManager) {
            this.popupManager.destroy();
        }
        
        if (this.filterManager) {
            this.filterManager.destroy();
        }
        
        if (this.controlsManager) {
            this.controlsManager.destroy();
        }
        
        if (this.locationManager) {
            this.locationManager.destroy();
        }
        
        if (this.navigationManager) {
            this.navigationManager.destroy();
        }
        
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        
        if (this.markerManager) {
            this.markerManager.cleanup();
        }
        
        if (this.dataLoader) {
            this.dataLoader.clearCache();
        }
        
        console.log('🧹 App cleanup voltooid');
    }

    /**
     * Vernietigt de applicatie
     */
    destroy() {
        this.cleanup();
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        this.isInitialized = false;
        console.log('💥 App vernietigd');
    }
}

// Maak globale instance beschikbaar
window.HeerlenApp = new AppManager();

// Auto-initialiseer wanneer DOM klaar is
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.HeerlenApp.initialize();
    });
} else {
    window.HeerlenApp.initialize();
}