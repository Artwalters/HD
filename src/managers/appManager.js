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
        this.likesManager = null;
        this.threejsManager = null;
        // AudioManager verwijderd
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
            
            // Check if user needs to select categories first
            if (this.shouldRedirectToWelcome()) {
                this.redirectToWelcome();
                return;
            }
            
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
            
            // 7. Audio manager verwijderd
            
            // 8. Initialiseer location manager
            await this.initializeLocationManager();
            
            // 9. Initialiseer navigation manager
            this.initializeNavigationManager();
            
            // 10. Initialiseer likes manager
            this.initializeLikesManager();
            
            // 11. Initialiseer Three.js manager
            this.initializeThreeJSManager();
            
            // 12. Laad en toon data
            await this.loadAndDisplayData();
            
            this.isInitialized = true;
            
            // Maak app globaal beschikbaar voor andere managers
            window.app = this;
            
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
        this.popupManager = new PopupManager(this.map, this.config, this.dataLoader);
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
    }

    /**
     * Audio manager verwijderd - niet meer gebruikt
     */

    /**
     * Initialiseert location manager
     */
    async initializeLocationManager() {
        this.locationManager = new LocationManager(this.map, this.config);
        await this.locationManager.initialize();
        console.log('✅ Location manager geïnitialiseerd');
    }

    /**
     * Initialiseert navigation manager
     */
    initializeNavigationManager() {
        this.navigationManager = new NavigationManager(this.map, this.config, this.locationManager);
        this.navigationManager.initialize();
        console.log('✅ Navigation manager geïnitialiseerd');
    }

    /**
     * Initialiseert likes manager
     */
    initializeLikesManager() {
        this.likesManager = new LikesManager();
        this.likesManager.initialize();
        
        // Setup callback voor likes changes
        this.likesManager.addCallback((locationId, isLiked) => {
            this.onLikeChanged(locationId, isLiked);
        });
        
        console.log('✅ Likes manager geïnitialiseerd');
    }

    /**
     * Initialiseert Three.js manager
     */
    initializeThreeJSManager() {
        console.log('🔄 Initialisatie Three.js manager...');
        console.log('THREE available:', typeof THREE !== 'undefined');
        console.log('ThreeJSManager available:', typeof ThreeJSManager !== 'undefined');
        console.log('GLTFLoader available:', typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined');
        
        // Check if ThreeJSManager is available
        if (typeof ThreeJSManager === 'undefined') {
            console.warn('⚠️ ThreeJSManager niet beschikbaar - Three.js layer overgeslagen');
            return;
        }

        // Check if THREE.js is available
        if (typeof THREE === 'undefined') {
            console.warn('⚠️ THREE.js niet beschikbaar - Three.js layer overgeslagen');
            return;
        }

        this.threejsManager = new ThreeJSManager(this.map, this.config);
        this.threejsManager.initialize();
        
        console.log('✅ Three.js manager geïnitialiseerd');
    }

    /**
     * Handler voor like changes
     */
    onLikeChanged(locationId, isLiked) {
        // Update marker hearts only
        if (this.markerManager && this.likesManager) {
            // Get fresh likes from storage
            this.likesManager.loadLikes();
            const likedIds = new Set(this.likesManager.getLikedIds());
            this.markerManager.updateLikedStatus(likedIds);
            console.log(`🔄 Updated markers with ${likedIds.size} liked locations`);
        }
        
        // Let individual buttons handle their own updates
        console.log(`🔄 Updated markers for location ${locationId}: ${isLiked ? 'liked' : 'unliked'}`);
    }

    /**
     * Updates all like buttons across different UI components
     */
    updateAllLikeButtons(locationId, isLiked) {
        console.log(`🔄 Updating all like buttons for location ${locationId} to ${isLiked ? 'liked' : 'unliked'}`);
        
        // Find ALL buttons with this location ID
        const allButtons = document.querySelectorAll(`[data-location-id="${locationId}"]`);
        console.log(`🔍 Found ${allButtons.length} buttons with location ID ${locationId}`);
        
        allButtons.forEach(button => {
            if (button.classList.contains('like-button') || button.classList.contains('info-panel-like')) {
                const wasLiked = button.classList.contains('liked');
                button.classList.toggle('liked', isLiked);
                
                const componentType = button.classList.contains('info-panel-like') ? 'info-panel' : 'popup';
                console.log(`🔄 Updated ${componentType} like button for ${locationId}: ${wasLiked} → ${isLiked}`);
            }
        });
        
        // Double check with more specific selectors
        const popupButtons = document.querySelectorAll('.like-button');
        const infoPanelButtons = document.querySelectorAll('.info-panel-like');
        console.log(`🔍 Total buttons found: ${popupButtons.length} popup, ${infoPanelButtons.length} info-panel`);
    }


    /**
     * Krijgt geselecteerde categorieën uit localStorage
     */
    getSelectedCategories() {
        try {
            const saved = localStorage.getItem('selectedCategories');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Fout bij laden selectedCategories:', error);
            return [];
        }
    }

    /**
     * Laadt en toont alle data
     */
    async loadAndDisplayData() {
        try {
            // Laad alle data
            const allData = await this.dataLoader.loadAllData();
            
            // Haal geselecteerde categorieën op uit localStorage
            const selectedCategories = this.getSelectedCategories();
            
            // Filter data op basis van geselecteerde categorieën
            let displayData = allData;
            if (selectedCategories.length > 0) {
                displayData = {
                    type: "FeatureCollection",
                    features: allData.features.filter(feature => 
                        selectedCategories.includes(feature.properties.category)
                    )
                };
                console.log(`📋 Gefilterd op geselecteerde categorieën: ${displayData.features.length} items van ${allData.features.length}`);
            } else {
                console.log('📋 Geen categorieën geselecteerd, toon niets');
                displayData = { type: "FeatureCollection", features: [] };
            }
            
            // Set liked status op data
            if (this.likesManager) {
                // Force reload likes from storage to get latest data
                this.likesManager.loadLikes();
                
                const likedIds = this.likesManager.getLikedIds();
                console.log('🔍 All liked IDs from storage:', likedIds);
                
                displayData.features.forEach(feature => {
                    const featureId = feature.properties.id;
                    const isLiked = this.likesManager.isLiked(featureId);
                    feature.properties.liked = isLiked;
                    console.log(`🔍 Location ${featureId} (${feature.properties.name}) liked: ${isLiked}`);
                });
                
                console.log('🔍 Features with liked status:', displayData.features.map(f => ({
                    id: f.properties.id,
                    name: f.properties.name,
                    liked: f.properties.liked
                })));
            }
            
            // Initialiseer markers met ALLE data
            await this.markerManager.initialize(displayData);
            
            // Update filter data
            if (this.filterManager) {
                this.filterManager.updateData();
            }
            
            // Apply category filters from preferences
            this.applyCategoryFilters();
            
            // Setup likes change listener
            this.setupLikesChangeListener();
            
            // Trigger Three.js layer loading if it hasn't loaded yet
            setTimeout(() => {
                if (this.threejsManager && this.map.isStyleLoaded() && !this.map.getLayer('3d-models')) {
                    console.log('🔄 Manually triggering Three.js layer loading...');
                    this.threejsManager.addLayer();
                }
            }, 2000);
            
            console.log('✅ Data geladen en markers getoond');
            
        } catch (error) {
            console.error('❌ Fout bij laden van data:', error);
            throw error;
        }
    }

    /**
     * Filters data based on selected categories from preferences
     */
    filterDataBySelectedCategories(allData) {
        const selectedCategories = localStorage.getItem('selectedCategories');
        
        if (!selectedCategories) {
            return allData;
        }
        
        try {
            const categories = JSON.parse(selectedCategories);
            
            if (!categories || categories.length === 0) {
                return allData;
            }
            
            const filteredFeatures = allData.features.filter(feature => {
                return categories.includes(feature.properties.category);
            });
            
            return {
                type: 'FeatureCollection',
                features: filteredFeatures
            };
            
        } catch (error) {
            console.warn('Error filtering by selected categories:', error);
            return allData;
        }
    }

    /**
     * Applies category filters from preferences to the filter manager
     */
    applyCategoryFilters() {
        const selectedCategories = localStorage.getItem('selectedCategories');
        
        if (!selectedCategories || !this.filterManager) {
            return;
        }
        
        try {
            const categories = JSON.parse(selectedCategories);
            
            if (categories && categories.length > 0) {
                // Log the selected categories for now
                // Note: filterManager doesn't have setAvailableCategories method yet
                console.log('🎯 Selected categories for filtering:', categories);
                console.log('📋 Available filter methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.filterManager)));
            }
            
        } catch (error) {
            console.warn('Error applying category filters:', error);
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
        
        if (this.threejsManager) {
            this.threejsManager.destroy();
        }
        
        // AudioManager verwijderd
        
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

    /**
     * Checks if user should be redirected to welcome page
     * @returns {boolean} - True if redirect is needed
     */
    shouldRedirectToWelcome() {
        // Check if coming from preferences page
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('fromPreferences') === 'true') {
            return false;
        }
        
        // Check if preferences have been completed
        const preferencesCompleted = localStorage.getItem('preferencesCompleted');
        if (!preferencesCompleted) {
            return true;
        }
        
        // Check if categories are selected
        const selectedCategories = localStorage.getItem('selectedCategories');
        if (!selectedCategories) {
            return true;
        }
        
        try {
            const categories = JSON.parse(selectedCategories);
            return !categories || categories.length === 0;
        } catch (error) {
            console.warn('Error parsing selected categories:', error);
            return true;
        }
    }

    /**
     * Redirects to welcome page for category selection
     */
    redirectToWelcome() {
        console.log('🔄 Redirecting to welcome page for category selection');
        window.location.href = 'plan-je-dag.html';
    }

    /**
     * Setup listener for likes changes from preferences
     */
    setupLikesChangeListener() {
        window.addEventListener('likesChanged', (event) => {
            console.log('🔄 Likes changed event received in app:', event.detail);
            
            if (this.markerManager && this.likesManager) {
                // Force reload likes from storage
                this.likesManager.loadLikes();
                const likedIds = new Set(this.likesManager.getLikedIds());
                
                // Update markers
                this.markerManager.updateLikedStatus(likedIds);
                
                console.log('✅ Updated map markers with new likes');
            }
        });
    }
}

// Export voor gebruik in andere modules
window.AppManager = AppManager;