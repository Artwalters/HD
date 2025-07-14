// ==============================
// FILTER MANAGER MODULE - v1.0
// ==============================

class FilterManager {
    constructor(appManager, config) {
        this.appManager = appManager;
        this.config = config;
        this.filterElement = null;
        this.activeFilters = new Set(); // Changed to Set for multiple selections
        this.isInitialized = false;
    }

    /**
     * Initialiseert het filter element
     */
    initialize() {
        if (this.isInitialized) return;

        this.createFilterElement();
        this.setupEventListeners();
        this.initializeDefaultState();
        this.isInitialized = true;
        
        console.log('✅ Filter manager geïnitialiseerd');
    }

    /**
     * Initialiseert de standaard staat (alle categorieën actief)
     */
    initializeDefaultState() {
        // Selecteer alle categorieën standaard
        Object.keys(this.config.categories).forEach(category => {
            this.activeFilters.add(category);
        });
        
        // Update UI
        const allButton = this.filterElement.querySelector('[data-category="all"]');
        const categoryButtons = this.filterElement.querySelectorAll('.filter-btn:not(.filter-btn-all)');
        
        allButton.classList.add('active');
        categoryButtons.forEach(btn => btn.classList.add('active'));
        
        // Update counts
        this.updateFilterUI();
    }

    /**
     * Creëert het filter element
     */
    createFilterElement() {
        // Create main filter container
        this.filterElement = document.createElement('div');
        this.filterElement.className = 'filter-container';
        this.filterElement.innerHTML = this.generateFilterHTML();
        
        // Add to map container
        const mapContainer = document.getElementById('map');
        mapContainer.appendChild(this.filterElement);
    }

    /**
     * Genereert filter HTML
     */
    generateFilterHTML() {
        const categories = Object.keys(this.config.categories);
        
        return `
            <div class="filter-wrapper">
                <div class="filter-content">
                    <div class="filter-buttons">
                        <button class="filter-btn filter-btn-all" data-category="all">
                            <span class="filter-icon">🌍</span>
                            <span class="filter-label">Alle</span>
                            <span class="filter-count">${this.getTotalCount()}</span>
                        </button>
                        
                        ${categories.map(category => this.generateCategoryButton(category)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genereert een categorie button
     */
    generateCategoryButton(category) {
        const categoryConfig = this.config.categories[category];
        const count = this.getCategoryCount(category);
        const icon = this.getCategoryIcon(category);
        
        return `
            <button class="filter-btn" data-category="${category}" style="--category-color: ${categoryConfig.color}">
                <span class="filter-icon">${icon}</span>
                <span class="filter-label">${category}</span>
                <span class="filter-count">${count}</span>
            </button>
        `;
    }

    /**
     * Krijgt het icon voor een categorie
     */
    getCategoryIcon(category) {
        const icons = {
            'Cultuur': '🎭',
            'Eten & Drinken': '🍽️',
            'Mode': '👗',
            'Murals': '🎨'
        };
        return icons[category] || '📍';
    }

    /**
     * Krijgt het aantal items voor een categorie
     */
    getCategoryCount(category) {
        if (!this.appManager.dataLoader) return 0;
        
        const data = this.appManager.dataLoader.getAllData();
        if (!data || !data.features) return 0;
        
        return data.features.filter(feature => 
            feature.properties.category === category
        ).length;
    }

    /**
     * Krijgt het totaal aantal items
     */
    getTotalCount() {
        if (!this.appManager.dataLoader) return 0;
        
        const data = this.appManager.dataLoader.getAllData();
        return data ? data.features.length : 0;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter button clicks
        const filterBtns = this.filterElement.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', this.handleFilterClick.bind(this));
        });

        // Horizontal scroll support with mouse wheel
        const filterButtons = this.filterElement.querySelector('.filter-buttons');
        filterButtons.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                filterButtons.scrollLeft += e.deltaY;
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.handleKeyboardNavigation(e);
            }
        });
    }

    /**
     * Behandelt filter button clicks
     */
    handleFilterClick(e) {
        e.stopPropagation();
        
        const button = e.currentTarget;
        const category = button.dataset.category;
        
        if (category === 'all') {
            // Toggle all categories
            this.toggleAllCategories();
        } else {
            // Toggle individual category
            this.toggleCategory(category, button);
        }
        
        // Apply filter
        this.applyMultiFilter();
    }

    /**
     * Toggle een enkele categorie
     */
    toggleCategory(category, button) {
        if (this.activeFilters.has(category)) {
            this.activeFilters.delete(category);
            button.classList.remove('active');
        } else {
            this.activeFilters.add(category);
            button.classList.add('active');
        }
        
        // Update "Alle" button state
        this.updateAllButtonState();
    }

    /**
     * Toggle alle categorieën
     */
    toggleAllCategories() {
        const allButton = this.filterElement.querySelector('[data-category="all"]');
        const categoryButtons = this.filterElement.querySelectorAll('.filter-btn:not(.filter-btn-all)');
        
        if (this.activeFilters.size === Object.keys(this.config.categories).length) {
            // Als alle categorieën actief zijn, deselecteer alles
            this.activeFilters.clear();
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            allButton.classList.remove('active');
        } else {
            // Selecteer alle categorieën
            this.activeFilters.clear();
            Object.keys(this.config.categories).forEach(category => {
                this.activeFilters.add(category);
            });
            categoryButtons.forEach(btn => btn.classList.add('active'));
            allButton.classList.add('active');
        }
    }

    /**
     * Update de "Alle" button state
     */
    updateAllButtonState() {
        const allButton = this.filterElement.querySelector('[data-category="all"]');
        const totalCategories = Object.keys(this.config.categories).length;
        
        if (this.activeFilters.size === totalCategories) {
            allButton.classList.add('active');
        } else {
            allButton.classList.remove('active');
        }
    }

    /**
     * Past multi-filter toe
     */
    applyMultiFilter() {
        if (this.activeFilters.size === 0) {
            // Geen filters actief, toon niets
            this.appManager.markerManager.updateData({ type: "FeatureCollection", features: [] });
        } else if (this.activeFilters.size === Object.keys(this.config.categories).length) {
            // Alle categorieën actief, toon alles
            this.appManager.filterByCategory(null);
        } else {
            // Specifieke categorieën actief, filter data
            const filteredData = this.getFilteredData();
            this.appManager.markerManager.updateData(filteredData);
        }
        
        // Update UI
        this.updateFilterUI();
        
        const activeCategories = Array.from(this.activeFilters);
        console.log(`🔍 Multi-filter toegepast: ${activeCategories.join(', ')}`);
    }

    /**
     * Krijgt gefilterde data voor actieve categorieën
     */
    getFilteredData() {
        const allData = this.appManager.dataLoader.getAllData();
        if (!allData) return { type: "FeatureCollection", features: [] };
        
        const filteredFeatures = allData.features.filter(feature => 
            this.activeFilters.has(feature.properties.category)
        );
        
        return {
            type: "FeatureCollection",
            features: filteredFeatures
        };
    }

    /**
     * Krijgt actieve categorieën
     */
    getActiveCategories() {
        return Array.from(this.activeFilters);
    }

    /**
     * Update filter UI
     */
    updateFilterUI() {
        // Update counts to show active/total
        const buttons = this.filterElement.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            const category = btn.dataset.category;
            const countElement = btn.querySelector('.filter-count');
            
            if (category === 'all') {
                const activeCount = this.getActiveCount();
                const totalCount = this.getTotalCount();
                countElement.textContent = `${activeCount}/${totalCount}`;
            } else {
                const categoryCount = this.getCategoryCount(category);
                countElement.textContent = categoryCount;
            }
        });
    }

    /**
     * Krijgt aantal actieve items
     */
    getActiveCount() {
        const filteredData = this.getFilteredData();
        return filteredData.features.length;
    }

    /**
     * Reset filter naar alle categorieën
     */
    resetFilter() {
        // Selecteer alle categorieën
        this.activeFilters.clear();
        Object.keys(this.config.categories).forEach(category => {
            this.activeFilters.add(category);
        });
        
        // Update UI
        const allButton = this.filterElement.querySelector('[data-category="all"]');
        const categoryButtons = this.filterElement.querySelectorAll('.filter-btn:not(.filter-btn-all)');
        
        allButton.classList.add('active');
        categoryButtons.forEach(btn => btn.classList.add('active'));
        
        // Apply filter
        this.applyMultiFilter();
    }

    /**
     * Voegt keyboard navigatie toe
     */
    handleKeyboardNavigation(e) {
        const buttons = Array.from(this.filterElement.querySelectorAll('.filter-btn'));
        const currentIndex = buttons.findIndex(btn => btn === document.activeElement);
        
        if (currentIndex === -1) return;
        
        let nextIndex;
        if (e.key === 'ArrowLeft') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        } else if (e.key === 'ArrowRight') {
            nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        }
        
        if (nextIndex !== undefined) {
            e.preventDefault();
            buttons[nextIndex].focus();
        }
    }

    /**
     * Update filter wanneer data verandert
     */
    updateData() {
        if (!this.isInitialized) return;
        
        // Update counts
        this.updateFilterUI();
        
        console.log('📊 Filter data bijgewerkt');
    }

    /**
     * Krijgt huidige filter status
     */
    getCurrentFilter() {
        return this.getActiveCategories();
    }

    /**
     * Cleanup filter manager
     */
    destroy() {
        if (this.filterElement) {
            this.filterElement.remove();
            this.filterElement = null;
        }
        
        this.isInitialized = false;
        console.log('🗑️ Filter manager vernietigd');
    }
}

// Export voor gebruik in andere modules
window.FilterManager = FilterManager;