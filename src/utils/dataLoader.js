// ==============================
// DATA LOADER MODULE
// ==============================

class DataLoader {
    constructor(config) {
        this.config = config;
        this.loadedData = new Map();
        this.allData = null;
    }

    /**
     * Laadt alle categorieën data
     * @returns {Promise<Object>} Gecombineerde GeoJSON data
     */
    async loadAllData() {
        if (this.allData) {
            return this.allData;
        }

        try {
            const categories = Object.keys(this.config.dataSources);
            const dataPromises = categories.map(category => this.loadCategoryData(category));
            const categoryDataArray = await Promise.all(dataPromises);

            // Combineer alle data in één GeoJSON object
            this.allData = {
                type: "FeatureCollection",
                features: []
            };

            categoryDataArray.forEach(categoryData => {
                if (categoryData && categoryData.features) {
                    this.allData.features.push(...categoryData.features);
                }
            });

            console.log(`✅ Alle data geladen: ${this.allData.features.length} items`);
            return this.allData;

        } catch (error) {
            console.error('❌ Fout bij laden van data:', error);
            throw error;
        }
    }

    /**
     * Laadt data voor specifieke categorie
     * @param {string} category - Categorie naam
     * @returns {Promise<Object>} GeoJSON data voor categorie
     */
    async loadCategoryData(category) {
        const cacheKey = category.toLowerCase();
        
        if (this.loadedData.has(cacheKey)) {
            return this.loadedData.get(cacheKey);
        }

        try {
            const dataSource = this.config.dataSources[category];
            if (!dataSource) {
                console.warn(`⚠️ Geen data bron gevonden voor categorie: ${category}`);
                return null;
            }

            const response = await fetch(dataSource);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Verrijk data met categorie configuratie
            this.enrichDataWithConfig(data, category);
            
            this.loadedData.set(cacheKey, data);
            console.log(`✅ ${category} data geladen: ${data.features?.length || 0} items`);
            
            return data;

        } catch (error) {
            console.error(`❌ Fout bij laden van ${category} data:`, error);
            return null;
        }
    }

    /**
     * Verrijkt data met configuratie (kleuren, icons, etc.)
     * @param {Object} data - GeoJSON data
     * @param {string} category - Categorie naam
     */
    enrichDataWithConfig(data, category) {
        const categoryConfig = this.config.categories[category];
        if (!categoryConfig) return;

        data.features?.forEach(feature => {
            const props = feature.properties;
            
            // Generate unique composite ID
            const originalId = props.id;
            const categoryKey = category.toLowerCase().replace(/\s+/g, '');
            props.originalId = originalId; // Keep original for reference
            props.id = `${categoryKey}_${originalId}`; // Create unique composite ID
            props.globalId = props.id; // Alias for clarity
            
            console.log(`🔗 Generated unique ID: ${originalId} → ${props.id} (${category})`);
            
            // Zet category kleur als deze niet al ingesteld is
            if (!props.color) {
                props.color = categoryConfig.color;
            }
            
            // Map emoji icons naar letters voor Mapbox
            if (props.icon && categoryConfig.iconMap) {
                const mappedIcon = categoryConfig.iconMap[props.icon];
                if (mappedIcon) {
                    props.mappedIcon = mappedIcon;
                } else {
                    props.mappedIcon = categoryConfig.defaultIcon;
                }
            }
        });
    }

    /**
     * Filtert data op categorie
     * @param {string} category - Categorie om te filteren
     * @returns {Object} Gefilterde GeoJSON data
     */
    filterByCategory(category) {
        if (!this.allData) {
            console.warn('⚠️ Data nog niet geladen. Roep eerst loadAllData() aan.');
            return null;
        }

        const filtered = {
            type: "FeatureCollection",
            features: this.allData.features.filter(
                feature => feature.properties.category === category
            )
        };

        return filtered;
    }

    /**
     * Zoekt in data op basis van tekst
     * @param {string} searchTerm - Zoekterm
     * @returns {Object} Gefilterde GeoJSON data
     */
    search(searchTerm) {
        if (!this.allData || !searchTerm) {
            return this.allData;
        }

        const term = searchTerm.toLowerCase();
        const filtered = {
            type: "FeatureCollection",
            features: this.allData.features.filter(feature => {
                const props = feature.properties;
                return props.name?.toLowerCase().includes(term) ||
                       props.description?.toLowerCase().includes(term) ||
                       props.address?.toLowerCase().includes(term) ||
                       props.category?.toLowerCase().includes(term);
            })
        };

        return filtered;
    }

    /**
     * Krijgt alle geladen data
     * @returns {Object} Alle geladen GeoJSON data
     */
    getAllData() {
        return this.allData;
    }

    /**
     * Geeft statistieken over geladen data
     * @returns {Object} Data statistieken
     */
    getStats() {
        if (!this.allData) {
            return { total: 0, categories: {} };
        }

        const stats = {
            total: this.allData.features.length,
            categories: {}
        };

        this.allData.features.forEach(feature => {
            const category = feature.properties.category;
            if (!stats.categories[category]) {
                stats.categories[category] = 0;
            }
            stats.categories[category]++;
        });

        return stats;
    }

    /**
     * Reset de cache
     */
    clearCache() {
        this.loadedData.clear();
        this.allData = null;
        console.log('🗑️ Data cache geleegd');
    }
}

// Export voor gebruik in andere modules
window.DataLoader = DataLoader;