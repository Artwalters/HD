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
        this.preferenceModal = null;
        this.currentSubcategoryFilters = {};
        this.pendingCategorySelection = new Set();
    }

    /**
     * Initialiseert het filter element
     */
    initialize() {
        if (this.isInitialized) return;

        this.createFilterElement();
        this.setupEventListeners();
        this.initializePreferenceModal();
        this.loadSavedPreferences();
        this.initializeDefaultState();
        this.isInitialized = true;
        
        // Debug: log alle categorieën uit config
        console.log('📋 Alle categorieën uit config:', Object.keys(this.config.categories));
        console.log('✅ Filter manager geïnitialiseerd');
    }

    /**
     * Initialiseert de standaard staat (geselecteerde categorieën actief)
     */
    initializeDefaultState() {
        // Haal geselecteerde categorieën op uit localStorage
        const selectedCategories = localStorage.getItem('selectedCategories');
        let categoriesToActivate = [];
        
        if (selectedCategories) {
            try {
                categoriesToActivate = JSON.parse(selectedCategories);
                console.log('📋 Geselecteerde categorieën uit welcome screen:', categoriesToActivate);
            } catch (e) {
                console.error('Fout bij parsen van selectedCategories:', e);
                // Als parsing faalt, activeer geen categorieën
                categoriesToActivate = [];
            }
        } else {
            // Als geen categorieën geselecteerd, activeer niets (gebruiker heeft nog niet gekozen)
            categoriesToActivate = [];
            console.log('📋 Geen categorieën geselecteerd in welcome screen');
        }
        
        // Activeer alleen de categorieën die in welcome screen zijn geselecteerd
        categoriesToActivate.forEach(category => {
            this.activeFilters.add(category);
        });
        
        // Laad ook subcategorie voorkeuren
        this.loadSavedPreferences();
        
        console.log('📋 FilterManager - categoriesToActivate:', categoriesToActivate);
        console.log('📋 FilterManager - activeFilters:', Array.from(this.activeFilters));
        console.log('📋 FilterManager - subcategorie voorkeuren:', this.currentSubcategoryFilters);
        
        // Update UI (gebeurt na createFilterElement in initialize())
        this.updateFilterUI();
        
        // Apply initial filter met voorkeuren
        this.applyFilterWithPreferences();
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
        // Toon ALLE categorieën, niet alleen geselecteerde
        const allCategories = Object.keys(this.config.categories);
        
        return `
            <div class="filter-buttons">
                ${allCategories.map(category => this.generateCategoryButton(category)).join('')}
            </div>
        `;
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
     * Genereert een categorie button
     */
    generateCategoryButton(category) {
        const categoryConfig = this.config.categories[category];
        const count = this.getCategoryCount(category);
        const icon = this.getCategoryIcon(category);
        
        // Check of category subcategorieën heeft
        const hasSubcategories = window.SubcategoryDefinitions && window.SubcategoryDefinitions[category];
        const subcategoryIndicator = hasSubcategories ? ' 🔧' : '';
        
        return `
            <button class="filter-btn ${hasSubcategories ? 'has-subcategories' : ''}" data-category="${category}" style="--category-color: ${categoryConfig.color}">
                <span class="filter-icon">${icon}</span>
                <span class="filter-label">${category}${subcategoryIndicator}</span>
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
        
        console.log('🔍 Filter button clicked:', category);
        
        // Direct een eenvoudige modal tonen
        if (window.SubcategoryDefinitions && window.SubcategoryDefinitions[category]) {
            this.showSimplePreferenceModal(category);
        } else {
            // Normale toggle voor categorieën zonder subcategorieën
            this.toggleCategory(category, button);
            this.applyMultiFilter();
        }
    }

    /**
     * Toont de preference modal via het PreferenceModal component
     */
    showSimplePreferenceModal(category) {
        // Voeg categorie toe aan pending selection
        this.pendingCategorySelection.clear();
        this.pendingCategorySelection.add(category);
        
        // Gebruik de nieuwe PreferenceModal component
        this.showPreferenceModal();
    }

    /**
     * Laad opgeslagen voorkeuren voor een categorie
     */
    loadPreferencesForCategory(category) {
        try {
            const saved = localStorage.getItem('categoryPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                return preferences[category] || [];
            }
        } catch (error) {
            console.error('Fout bij laden voorkeuren:', error);
        }
        return [];
    }


    /**
     * Sla voorkeuren op voor een categorie
     */
    savePreferencesForCategory(category, preferences) {
        try {
            let saved = {};
            const existing = localStorage.getItem('categoryPreferences');
            if (existing) {
                saved = JSON.parse(existing);
            }
            
            saved[category] = preferences;
            localStorage.setItem('categoryPreferences', JSON.stringify(saved));
            console.log('Voorkeuren opgeslagen:', saved);
        } catch (error) {
            console.error('Fout bij opslaan voorkeuren:', error);
        }
    }

    /**
     * Past filtering toe met voorkeuren
     */
    applyFilterWithPreferences() {
        if (this.activeFilters.size === 0) {
            // Geen filters actief, toon niets
            this.appManager.markerManager.updateData({ type: "FeatureCollection", features: [] });
            return;
        }

        const allData = this.appManager.dataLoader.getAllData();
        if (!allData) {
            console.warn('Geen data beschikbaar voor filtering');
            return;
        }

        // Laad subcategorie voorkeuren uit preferences
        const subcategoryPreferences = this.loadSubcategoryPreferences();

        let filteredFeatures = allData.features.filter(feature => {
            const category = feature.properties.category;
            
            // Check basis categorie filter
            if (!this.activeFilters.has(category)) {
                return false;
            }
            
            // Check subcategorie voorkeuren als die bestaan
            if (subcategoryPreferences[category]) {
                return this.matchesSubcategoryPreferences(feature, category, subcategoryPreferences[category]);
            }
            
            return true;
        });

        const filteredData = {
            type: "FeatureCollection",
            features: filteredFeatures
        };

        this.appManager.markerManager.updateData(filteredData);
        
        console.log(`🔍 Filter met voorkeuren toegepast: ${filteredFeatures.length} resultaten`);
        console.log(`🔍 Gebruikte subcategorie voorkeuren:`, subcategoryPreferences);
        this.updateFilterUI();
    }

    /**
     * Laad subcategorie voorkeuren uit localStorage
     */
    loadSubcategoryPreferences() {
        try {
            const saved = localStorage.getItem('categoryPreferences');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Fout bij laden subcategorie voorkeuren:', error);
            return {};
        }
    }

    /**
     * Check of feature matcht met subcategorie voorkeuren
     */
    matchesSubcategoryPreferences(feature, category, categoryPreferences) {
        const featureProperties = feature.properties;
        
        // Als er geen subcategorie data is in de feature, toon het alsnog
        if (!featureProperties.subcategories) {
            return true;
        }

        // Voor elke stap in de voorkeuren
        for (const [stepId, selectedOptions] of Object.entries(categoryPreferences)) {
            // Check of selectedOptions een array is
            if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) continue;

            const featureSubcategories = featureProperties.subcategories[stepId];
            if (!featureSubcategories) continue;

            // Check of feature minstens één van de geselecteerde opties heeft
            const hasMatch = selectedOptions.some(option => 
                featureSubcategories.includes(option)
            );

            if (!hasMatch) {
                return false;
            }
        }

        return true;
    }

    /**
     * Laad alle opgeslagen voorkeuren
     */
    loadAllPreferences() {
        try {
            const saved = localStorage.getItem('categoryPreferences');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Fout bij laden alle voorkeuren:', error);
            return {};
        }
    }

    /**
     * Controleert of feature matcht met voorkeuren
     */
    matchesPreferences(feature, category, preferences) {
        const featureProperties = feature.properties;
        
        // Als er geen subcategorie data is in de feature, toon het alsnog
        if (!featureProperties.subcategories) {
            return true;
        }

        // Voor nu gebruiken we alleen de eerste stap van de subcategorieën
        const definition = window.SubcategoryDefinitions[category];
        if (!definition || !definition.steps[0]) {
            return true;
        }

        const stepId = definition.steps[0].id;
        const featureSubcategories = featureProperties.subcategories[stepId];
        
        if (!featureSubcategories) {
            return true; // Geen subcategorie data, toon het
        }

        // Check of feature minstens één van de geselecteerde voorkeuren heeft
        return preferences.some(preference => 
            featureSubcategories.includes(preference)
        );
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
    }


    /**
     * Past multi-filter toe (gebruikt nu voorkeuren)
     */
    applyMultiFilter() {
        // Gebruik altijd de voorkeuren-aware filtering
        this.applyFilterWithPreferences();
        
        const activeCategories = Array.from(this.activeFilters);
        console.log(`🔍 Multi-filter toegepast: ${activeCategories.join(', ') || 'Geen'}`);
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
        // Update counts and active states
        const buttons = this.filterElement.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            const category = btn.dataset.category;
            const countElement = btn.querySelector('.filter-count');
            
            // Update active state
            if (this.activeFilters.has(category)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
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
        const categoryButtons = this.filterElement.querySelectorAll('.filter-btn');
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
     * Initialiseert de preference modal
     */
    initializePreferenceModal() {
        console.log('🎭 Initializing preference modal...');
        console.log('🎭 window.PreferenceModal available:', !!window.PreferenceModal);
        
        if (window.PreferenceModal) {
            this.preferenceModal = new window.PreferenceModal(this);
            console.log('🎭 PreferenceModal instance created:', !!this.preferenceModal);
        } else {
            console.error('❌ window.PreferenceModal not available during FilterManager initialization');
        }
    }

    /**
     * Laadt opgeslagen voorkeuren
     */
    loadSavedPreferences() {
        try {
            // Gebruik categoryPreferences in plaats van userSubcategoryPreferences
            const savedPreferences = localStorage.getItem('categoryPreferences');
            if (savedPreferences) {
                this.currentSubcategoryFilters = JSON.parse(savedPreferences);
                console.log('📋 Opgeslagen voorkeuren geladen:', this.currentSubcategoryFilters);
            }
        } catch (error) {
            console.error('Fout bij laden van voorkeuren:', error);
            this.currentSubcategoryFilters = {};
        }
    }

    /**
     * Behandelt klik op categorie met subcategorieën
     */
    handleCategoryWithSubcategories(category, button) {
        console.log('🔄 handleCategoryWithSubcategories called for:', category);
        console.log('🔄 Category already active:', this.activeFilters.has(category));
        
        // Check of categorie al actief is
        if (this.activeFilters.has(category)) {
            console.log('🔄 Deactivating category:', category);
            // Deactiveer categorie
            this.activeFilters.delete(category);
            button.classList.remove('active');
            
            // Verwijder subcategorie filters voor deze categorie
            if (this.currentSubcategoryFilters[category]) {
                delete this.currentSubcategoryFilters[category];
                localStorage.setItem('userSubcategoryPreferences', JSON.stringify(this.currentSubcategoryFilters));
            }
            
            this.applyMultiFilter();
        } else {
            console.log('🔄 Activating category and showing modal:', category);
            // Activeer categorie en voeg toe aan pending
            this.pendingCategorySelection.add(category);
            
            // Toon preference modal met huidige pending categorieën
            this.showPreferenceModal();
        }
    }

    /**
     * Toont preference modal voor geselecteerde categorieën
     */
    showPreferenceModal() {
        console.log('🎯 showPreferenceModal called');
        console.log('🎯 preferenceModal available:', !!this.preferenceModal);
        console.log('🎯 pendingCategorySelection:', Array.from(this.pendingCategorySelection));
        console.log('🎯 window.PreferenceModal:', !!window.PreferenceModal);
        console.log('🎯 window.SubcategoryDefinitions:', !!window.SubcategoryDefinitions);
        
        if (!this.preferenceModal) {
            console.warn('❌ Preference modal niet beschikbaar, probeer opnieuw te initialiseren...');
            this.initializePreferenceModal();
            if (!this.preferenceModal) {
                console.error('❌ Preference modal nog steeds niet beschikbaar na herinitialisatie');
                return;
            }
        }

        const categoriesWithSubcategories = Array.from(this.pendingCategorySelection).filter(
            category => window.SubcategoryDefinitions && window.SubcategoryDefinitions[category]
        );
        
        console.log('🎯 categoriesWithSubcategories:', categoriesWithSubcategories);

        if (categoriesWithSubcategories.length > 0) {
            console.log('🎯 Showing modal for categories:', categoriesWithSubcategories);
            this.preferenceModal.show(categoriesWithSubcategories);
        } else {
            console.warn('🎯 No categories with subcategories found');
        }
    }

    /**
     * Past subcategorie filters toe (wordt aangeroepen vanuit modal)
     */
    applySubcategoryFilters(preferences) {
        // Update huidige filters - merge met bestaande
        Object.assign(this.currentSubcategoryFilters, preferences);
        
        // Sla op in localStorage  
        localStorage.setItem('categoryPreferences', JSON.stringify(this.currentSubcategoryFilters));
        
        // Activeer alle categorieën waarvoor voorkeuren zijn ingesteld
        Object.keys(preferences).forEach(category => {
            this.activeFilters.add(category);
            
            // Update UI button
            const button = this.filterElement.querySelector(`[data-category="${category}"]`);
            if (button) {
                button.classList.add('active');
            }
        });
        
        // Clear pending selection
        this.pendingCategorySelection.clear();
        
        // Pas filters toe met voorkeuren
        this.applyFilterWithPreferences();
        
        // Update UI
        this.updateFilterUI();
    }

    /**
     * Past geavanceerde filters toe met subcategorieën
     */
    applyAdvancedFilter() {
        if (this.activeFilters.size === 0) {
            // Geen filters actief, toon niets
            this.appManager.markerManager.updateData({ type: "FeatureCollection", features: [] });
            return;
        }

        const allData = this.appManager.dataLoader.getAllData();
        if (!allData) {
            console.warn('Geen data beschikbaar voor filtering');
            return;
        }

        let filteredFeatures = allData.features.filter(feature => {
            const category = feature.properties.category;
            
            // Check basis categorie filter
            if (!this.activeFilters.has(category)) {
                return false;
            }
            
            // Check subcategorie filters als die bestaan
            if (this.currentSubcategoryFilters[category]) {
                return this.matchesSubcategoryFilters(feature, category);
            }
            
            return true;
        });

        const filteredData = {
            type: "FeatureCollection",
            features: filteredFeatures
        };

        this.appManager.markerManager.updateData(filteredData);
        
        console.log(`🔍 Geavanceerd filter toegepast: ${filteredFeatures.length} resultaten`);
    }

    /**
     * Controleert of feature matcht met subcategorie filters
     */
    matchesSubcategoryFilters(feature, category) {
        const subcategoryPreferences = this.currentSubcategoryFilters[category];
        const featureProperties = feature.properties;
        
        // Als er geen subcategorie data is in de feature, toon het alsnog
        if (!featureProperties.subcategories) {
            return true;
        }
        
        // Check elke subcategorie stap
        for (const [stepId, selectedOptions] of Object.entries(subcategoryPreferences)) {
            if (selectedOptions.length === 0) {
                continue; // Skip lege selecties
            }
            
            const featureSubcategories = featureProperties.subcategories[stepId];
            if (!featureSubcategories) {
                continue; // Skip als feature geen data heeft voor deze stap
            }
            
            // Check of feature minstens één van de geselecteerde opties heeft
            const hasMatch = selectedOptions.some(option => 
                featureSubcategories.includes(option)
            );
            
            if (!hasMatch) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Override van applyMultiFilter om geavanceerde filtering te gebruiken
     */
    applyMultiFilter() {
        if (Object.keys(this.currentSubcategoryFilters).length > 0) {
            this.applyAdvancedFilter();
        } else {
            // Fallback naar normale filtering
            if (this.activeFilters.size === 0) {
                this.appManager.markerManager.updateData({ type: "FeatureCollection", features: [] });
            } else {
                const filteredData = this.getFilteredData();
                this.appManager.markerManager.updateData(filteredData);
            }
        }
        
        this.updateFilterUI();
        
        const activeCategories = Array.from(this.activeFilters);
        console.log(`🔍 Multi-filter toegepast: ${activeCategories.join(', ') || 'Geen'}`);
    }

    /**
     * Cleanup filter manager
     */
    destroy() {
        if (this.preferenceModal) {
            this.preferenceModal.destroy();
            this.preferenceModal = null;
        }
        
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