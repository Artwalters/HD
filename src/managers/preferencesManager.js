// ==============================
// PREFERENCES MANAGER - HEERLEN DOEN
// ==============================

class PreferencesManager {
    constructor() {
        // Initialize with config from global scope
        this.config = window.HeerlenConfig;
        
        this.dataLoader = new DataLoader(this.config);
        this.businesses = [];
        this.currentIndex = 0;
        this.likes = new Set();
        this.dislikes = new Set();
        this.selectedCategories = [];
        this.isAnimating = false;
        this.loadingProgress = 0;
        this.cardsRendered = 0;
        this.maxCardsToRender = 3; // Only render 3 cards at a time for performance
        
        // Swipe tracking
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.swipeThreshold = 100;
        this.rotationMultiplier = 0.1;
        
        // DOM elements
        this.cardsContainer = document.getElementById('cardsContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.feedbackOverlay = document.getElementById('feedbackOverlay');
        
        // Wizard elements
        this.subcategoryWizard = document.getElementById('subcategoryWizard');
        this.currentStepElement = document.getElementById('currentStep');
        this.stepBackButton = document.getElementById('stepBack');
        this.stepNextButton = document.getElementById('stepNext');
        this.stepFinishButton = document.getElementById('stepFinish');
        
        // Wizard state
        this.wizardSteps = [];
        this.currentWizardStep = 0;
        this.subcategoryPreferences = {};
        this.selectedCategories = new Set();
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadSelectedCategories();
        
        // Start de wizard
        this.initializeWizard();
    }
    
    setupEventListeners() {
        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            window.location.href = 'plan-je-dag.html';
        });
        
        // Skip button
        document.getElementById('skipButton').addEventListener('click', () => {
            this.skipToMap();
        });
        
        // Action buttons
        document.getElementById('likeButton').addEventListener('click', () => {
            this.likeCurrentCard();
        });
        
        document.getElementById('dislikeButton').addEventListener('click', () => {
            this.dislikeCurrentCard();
        });
        
        // Continue to map button
        document.getElementById('continueToMap').addEventListener('click', () => {
            this.goToMap();
        });
        
        // Touch events for mobile
        this.cardsContainer.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.cardsContainer.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.cardsContainer.addEventListener('touchend', this.handleEnd.bind(this));
        
        // Mouse events for desktop
        this.cardsContainer.addEventListener('mousedown', this.handleStart.bind(this));
        this.cardsContainer.addEventListener('mousemove', this.handleMove.bind(this));
        this.cardsContainer.addEventListener('mouseup', this.handleEnd.bind(this));
        this.cardsContainer.addEventListener('mouseleave', this.handleEnd.bind(this));
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    
    async loadSelectedCategories() {
        const saved = localStorage.getItem('selectedCategories');
        if (saved) {
            const categoriesArray = JSON.parse(saved);
            this.selectedCategories = new Set(categoriesArray);
            console.log('📋 Selected categories loaded:', Array.from(this.selectedCategories));
        } else {
            // Voor wizard: start met lege set
            this.selectedCategories = new Set();
            console.log('📋 No saved categories, starting with empty selection');
        }
    }
    
    async loadBusinesses() {
        try {
            this.loadingState.style.display = 'flex';
            this.updateLoadingProgress(0, 'Laden van categorieën...');
            
            console.log('📋 loadBusinesses - selectedCategories:', Array.from(this.selectedCategories));
            console.log('📋 loadBusinesses - selectedCategories length:', this.selectedCategories.size);
            
            // Load data for selected categories with progress tracking
            const allBusinesses = [];
            const categoriesArray = Array.from(this.selectedCategories);
            const totalCategories = categoriesArray.length;
            
            for (let i = 0; i < categoriesArray.length; i++) {
                const category = categoriesArray[i];
                this.updateLoadingProgress(
                    (i / totalCategories) * 50, 
                    `Laden van ${category}...`
                );
                
                try {
                    console.log(`📋 Attempting to load data for category: ${category}`);
                    const categoryData = await this.dataLoader.loadCategoryData(category);
                    console.log(`📋 loadCategoryData result for ${category}:`, categoryData);
                    
                    if (categoryData && categoryData.features) {
                        console.log(`✅ Loaded ${categoryData.features.length} items for ${category}`);
                        allBusinesses.push(...categoryData.features);
                    } else {
                        console.warn(`⚠️ No data found for category: ${category}`, categoryData);
                    }
                } catch (categoryError) {
                    console.error(`❌ Error loading category ${category}:`, categoryError);
                    // Continue with other categories
                }
            }
            
            this.updateLoadingProgress(60, 'Voorbereiden van cards...');
            
            // Filter out duplicates by ID
            const uniqueBusinesses = this.removeDuplicates(allBusinesses);
            
            // Filter bedrijven op basis van subcategorie voorkeuren
            const filteredBusinesses = this.filterBySubcategoryPreferences(uniqueBusinesses);
            
            // Shuffle businesses for random order
            this.businesses = this.shuffleArray(filteredBusinesses);
            
            this.updateLoadingProgress(80, 'Laden van voorkeuren...');
            
            // Load existing likes
            this.loadExistingLikes();
            
            this.updateLoadingProgress(100, 'Gereed!');
            
            setTimeout(() => {
                this.loadingState.style.display = 'none';
                
                if (this.businesses.length === 0) {
                    this.showEmptyState();
                } else {
                    console.log(`📋 Ready to show ${this.businesses.length} businesses`);
                    
                    // Debug: laat eerste paar businesses zien
                    if (this.businesses.length > 0) {
                        console.log('📋 EERSTE PAAR BUSINESSES:');
                        this.businesses.slice(0, 3).forEach(business => {
                            console.log(`📋 ${business.properties.name}:`, {
                                category: business.properties.category,
                                subcategories: business.properties.subcategories,
                                hasSubcategories: !!business.properties.subcategories
                            });
                        });
                    }
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ Error loading businesses:', error);
            this.loadingState.style.display = 'none';
            this.showEmptyState();
        }
    }
    
    /**
     * Updates loading progress display
     */
    updateLoadingProgress(percentage, message) {
        this.loadingProgress = percentage;
        
        // Update progress bar if it exists
        if (this.progressBar) {
            this.progressBar.style.setProperty('--progress-width', `${percentage}%`);
        }
        
        // Update loading message
        const loadingMessage = this.loadingState.querySelector('p');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }
    
    /**
     * Removes duplicate businesses by ID
     */
    removeDuplicates(businesses) {
        const seen = new Set();
        return businesses.filter(business => {
            const id = business.properties.id;
            if (seen.has(id)) {
                return false;
            }
            seen.add(id);
            return true;
        });
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Filter bedrijven op basis van subcategorie voorkeuren
     */
    filterBySubcategoryPreferences(businesses) {
        console.log('📋 ===== FILTERING DEBUG =====');
        console.log('📋 Totaal aantal businesses:', businesses.length);
        console.log('📋 Geselecteerde categorieën:', Array.from(this.selectedCategories));
        console.log('📋 Subcategorie voorkeuren:', this.subcategoryPreferences);
        
        // Filter eerst op geselecteerde categorieën
        const categoryFiltered = businesses.filter(business => {
            const match = this.selectedCategories.has(business.properties.category);
            console.log(`📋 ${business.properties.name} (${business.properties.category}): ${match ? 'MATCH' : 'NO MATCH'}`);
            return match;
        });

        console.log(`📋 Na categorie filtering: ${categoryFiltered.length} bedrijven`);

        // Als er geen subcategorie voorkeuren zijn, toon alle bedrijven van geselecteerde categorieën
        if (!this.subcategoryPreferences || Object.keys(this.subcategoryPreferences).length === 0) {
            console.log('📋 Geen subcategorie voorkeuren, toon alle bedrijven van geselecteerde categorieën');
            return categoryFiltered;
        }

        // FIX: Converteer oude voorkeuren format naar nieuwe format
        let needsConversion = false;
        for (const [category, prefs] of Object.entries(this.subcategoryPreferences)) {
            if (Array.isArray(prefs)) {
                needsConversion = true;
                break;
            }
        }
        
        if (needsConversion) {
            console.log('📋 Oude voorkeuren format gedetecteerd, converteer naar nieuwe format');
            this.subcategoryPreferences = this.convertOldPreferencesFormat(this.subcategoryPreferences);
            console.log('📋 Geconverteerde voorkeuren:', this.subcategoryPreferences);
        }

        const filtered = categoryFiltered.filter(business => {
            const category = business.properties.category;
            const categoryPrefs = this.subcategoryPreferences[category];
            
            console.log(`📋 Checking ${business.properties.name}:`);
            console.log(`📋   Category: ${category}`);
            console.log(`📋   Category prefs:`, categoryPrefs);
            
            // Als er geen voorkeuren zijn voor deze categorie, toon het bedrijf
            if (!categoryPrefs || Object.keys(categoryPrefs).length === 0) {
                console.log(`📋   No prefs for category - INCLUDE`);
                return true;
            }

            // Als bedrijf geen subcategorie data heeft, EXCLUDE het (alleen tonen wat matcht)
            if (!business.properties.subcategories) {
                console.log(`📋   No subcategories on business - EXCLUDE`);
                return false;
            }

            // Check of bedrijf matcht met voorkeuren
            const matches = this.businessMatchesPreferences(business, categoryPrefs);
            console.log(`📋   Business matches prefs: ${matches ? 'YES' : 'NO'}`);
            return matches;
        });

        console.log(`📋 Gefilterd van ${businesses.length} naar ${categoryFiltered.length} (categorieën) naar ${filtered.length} (voorkeuren)`);
        console.log('📋 ===== END FILTERING DEBUG =====');
        return filtered;
    }

    /**
     * Check of een bedrijf matcht met de voorkeuren
     */
    businessMatchesPreferences(business, categoryPrefs) {
        const subcategories = business.properties.subcategories;

        // Voor elke stap in de voorkeuren
        for (const [stepId, selectedOptions] of Object.entries(categoryPrefs)) {
            if (!selectedOptions || selectedOptions.length === 0) continue;

            // Als bedrijf geen subcategorie data heeft voor deze stap, skip deze check
            if (!subcategories || !subcategories[stepId]) {
                console.log(`📋 Bedrijf ${business.properties.name} heeft geen data voor ${stepId}, wordt toegestaan`);
                continue;
            }

            const businessOptions = subcategories[stepId];

            // Check of bedrijf minstens één van de geselecteerde opties heeft
            const hasMatch = selectedOptions.some(option => 
                businessOptions.includes(option)
            );

            if (!hasMatch) {
                console.log(`📋 Bedrijf ${business.properties.name} matcht niet met voorkeuren voor ${stepId}:`, {
                    gevraagd: selectedOptions,
                    heeft: businessOptions
                });
                return false;
            }
        }

        return true;
    }
    
    loadExistingLikes() {
        // Load from both old and new storage keys for compatibility
        const existingLikes = localStorage.getItem('likedLocations');
        const heerlenLikes = localStorage.getItem('heerlen-doen-likes');
        
        if (existingLikes) {
            const likedIds = JSON.parse(existingLikes);
            likedIds.forEach(id => this.likes.add(String(id))); // Keep as string for composite ID compatibility
        }
        
        if (heerlenLikes) {
            const likedIds = JSON.parse(heerlenLikes);
            likedIds.forEach(id => this.likes.add(String(id))); // Keep as string for composite ID compatibility
        }
        
        console.log(`📋 Loaded ${this.likes.size} existing likes:`, Array.from(this.likes));
    }
    
    showCurrentCard() {
        console.log('📋 showCurrentCard called:', {
            currentIndex: this.currentIndex,
            businessesLength: this.businesses.length,
            cardsContainer: !!this.cardsContainer
        });
        
        if (this.currentIndex >= this.businesses.length) {
            console.log('📋 No more businesses, showing empty state');
            this.showEmptyState();
            return;
        }
        
        // Clear container
        this.cardsContainer.innerHTML = '';
        
        // Render multiple cards for smooth experience (performance optimized)
        const cardsToRender = Math.min(this.maxCardsToRender, this.businesses.length - this.currentIndex);
        
        for (let i = 0; i < cardsToRender; i++) {
            const businessIndex = this.currentIndex + i;
            if (businessIndex >= this.businesses.length) break;
            
            const business = this.businesses[businessIndex];
            const card = this.createCard(business);
            
            // Add appropriate classes for stacking
            if (i === 0) {
                card.classList.add('current-card');
            } else if (i === 1) {
                card.classList.add('next-card');
            } else {
                card.classList.add('stack-card');
            }
            
            this.cardsContainer.appendChild(card);
        }
    }
    
    createCard(business) {
        const card = document.createElement('div');
        card.className = 'preference-card';
        
        // Use the composite ID that matches the map system
        const compositeId = business.properties.compositeId || business.properties.id;
        card.dataset.businessId = compositeId;
        
        // Use fallback image if no image provided
        const imageUrl = business.properties.image || 'assets/images/catcute.png';
        
        // Create more detailed card content
        const address = business.properties.address || '';
        const phone = business.properties.phone || '';
        const website = business.properties.website || '';
        const openingHours = business.properties.opening_hours || business.properties.openingHours || '';
        
        // Extract tags from various possible sources
        let tags = [];
        if (business.properties.tags && Array.isArray(business.properties.tags)) {
            tags = business.properties.tags;
        } else if (business.properties.tags && typeof business.properties.tags === 'string') {
            tags = business.properties.tags.split(',').map(tag => tag.trim());
        }
        
        // Extract subcategory matches
        const subcategoryMatches = this.getSubcategoryMatches(business);
        
        // Get category icon
        const categoryIcon = this.getCategoryIcon(business.properties.category);
        
        card.innerHTML = `
            <div class="card-image">
                <img src="${imageUrl}" alt="${business.properties.name}" onerror="this.src='assets/images/catcute.png'">
                <div class="card-category-badge">
                    <span class="category-icon">${categoryIcon}</span>
                    <span class="category-name">${business.properties.category}</span>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${business.properties.name}</h3>
                <p class="card-description">${business.properties.description || 'Ontdek deze geweldige locatie in Heerlen!'}</p>
                
                ${subcategoryMatches.length > 0 ? `<div class="card-subcategory-tags">
                    ${subcategoryMatches.map(match => `<span class="subcategory-tag">${match.icon} ${match.label}</span>`).join('')}
                </div>` : ''}
                
                
                ${address ? `<div class="card-address">📍 ${address}</div>` : ''}
                ${openingHours ? `<div class="card-hours">🕐 ${openingHours}</div>` : ''}
                
                <div class="card-details">
                    ${tags.length > 0 ? `<div class="card-tags">
                        ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>` : ''}
                </div>
                
                ${phone || website ? `<div class="card-contact">
                    ${phone ? `<span class="contact-phone">📞 ${phone}</span>` : ''}
                    ${website ? `<span class="contact-website">🌐 ${website}</span>` : ''}
                </div>` : ''}
            </div>
        `;
        
        return card;
    }
    
    handleStart(e) {
        if (this.isAnimating) return;
        
        e.preventDefault();
        this.isDragging = true;
        
        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        
        this.startX = clientX;
        this.startY = clientY;
        this.currentX = clientX;
        this.currentY = clientY;
        
        // Change cursor
        const currentCard = this.cardsContainer.querySelector('.preference-card.current-card');
        if (currentCard) {
            currentCard.style.cursor = 'grabbing';
        }
    }
    
    handleMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        
        e.preventDefault();
        
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        this.currentX = clientX;
        this.currentY = clientY;
        
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        
        this.updateCardPosition(deltaX, deltaY);
    }
    
    handleEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        
        // Reset cursor
        const currentCard = this.cardsContainer.querySelector('.preference-card.current-card');
        if (currentCard) {
            currentCard.style.cursor = 'grab';
        }
        
        this.handleSwipe(deltaX, deltaY);
    }
    
    updateCardPosition(deltaX, deltaY) {
        const card = this.cardsContainer.querySelector('.preference-card.current-card');
        if (!card) return;
        
        const rotation = deltaX * this.rotationMultiplier;
        const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 300);
        
        // Apply transform
        card.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg)`;
        card.style.opacity = opacity;
        
        // Show visual feedback
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                card.classList.add('swiping-right');
                card.classList.remove('swiping-left');
                this.showPawFeedback('right');
            } else {
                card.classList.add('swiping-left');
                card.classList.remove('swiping-right');
                this.showPawFeedback('left');
            }
        } else {
            card.classList.remove('swiping-left', 'swiping-right');
            this.hidePawFeedback();
        }
    }
    
    handleSwipe(deltaX, deltaY) {
        if (Math.abs(deltaX) > this.swipeThreshold) {
            if (deltaX > 0) {
                this.likeCurrentCard();
            } else {
                this.dislikeCurrentCard();
            }
        } else {
            this.resetCardPosition();
        }
    }
    
    resetCardPosition() {
        const card = this.cardsContainer.querySelector('.preference-card.current-card');
        if (card) {
            card.style.transition = 'all 0.3s ease-out';
            card.style.transform = '';
            card.style.opacity = '';
            card.classList.remove('swiping-left', 'swiping-right');
            
            // Remove transition after animation
            setTimeout(() => {
                card.style.transition = '';
            }, 300);
        }
        
        this.hidePawFeedback();
    }
    
    likeCurrentCard() {
        if (this.isAnimating || this.currentIndex >= this.businesses.length) return;
        
        const business = this.businesses[this.currentIndex];
        // Use composite ID that matches map system
        const businessId = business.properties.compositeId || business.properties.id;
        
        this.likes.add(businessId);
        // Remove from dislikes if it was there
        this.dislikes.delete(businessId);
        
        this.showFeedback('like');
        this.animateCardExit('right');
        this.nextCard();
        
        console.log(`❤️ Liked: ${business.properties.name} (ID: ${businessId})`);
    }
    
    dislikeCurrentCard() {
        if (this.isAnimating || this.currentIndex >= this.businesses.length) return;
        
        const business = this.businesses[this.currentIndex];
        // Use composite ID that matches map system
        const businessId = business.properties.compositeId || business.properties.id;
        
        this.dislikes.add(businessId);
        // Remove from likes if it was there
        this.likes.delete(businessId);
        
        this.showFeedback('dislike');
        this.animateCardExit('left');
        this.nextCard();
        
        console.log(`👎 Disliked: ${business.properties.name} (ID: ${businessId})`);
    }
    
    showFeedback(type) {
        const feedback = this.feedbackOverlay.querySelector(`.${type}-feedback`);
        feedback.style.display = 'block';
        
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 500);
    }
    
    animateCardExit(direction) {
        const card = this.cardsContainer.querySelector('.preference-card.current-card');
        if (!card) return;
        
        this.isAnimating = true;
        
        const translateX = direction === 'right' ? '150vw' : '-150vw';
        const rotation = direction === 'right' ? '45deg' : '-45deg';
        
        // Add swipe animation class
        card.classList.add(direction === 'right' ? 'swipe-right' : 'swipe-left');
        
        card.style.transition = 'all 0.4s ease-out';
        card.style.transform = `translateX(${translateX}) rotate(${rotation})`;
        card.style.opacity = '0';
        
        // Move other cards up in the stack
        const nextCard = this.cardsContainer.querySelector('.preference-card.next-card');
        if (nextCard) {
            nextCard.classList.remove('next-card');
            nextCard.classList.add('current-card');
        }
        
        const stackCard = this.cardsContainer.querySelector('.preference-card.stack-card');
        if (stackCard) {
            stackCard.classList.remove('stack-card');
            stackCard.classList.add('next-card');
            // CSS classes handle the transforms now
        }
        
        setTimeout(() => {
            this.isAnimating = false;
            card.remove();
            this.hidePawFeedback();
        }, 400);
    }
    
    nextCard() {
        this.currentIndex++;
        this.saveLikes();
        this.updateProgress();
        
        setTimeout(() => {
            this.showCurrentCard();
        }, 300);
    }
    
    updateProgress() {
        const progress = (this.currentIndex / this.businesses.length) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `${this.currentIndex} van ${this.businesses.length}`;
    }
    
    saveLikes() {
        // Save likes to both storage keys for compatibility
        const likesArray = Array.from(this.likes);
        const dislikesArray = Array.from(this.dislikes);
        
        // Save to old format for backward compatibility
        localStorage.setItem('likedLocations', JSON.stringify(likesArray));
        localStorage.setItem('dislikedLocations', JSON.stringify(dislikesArray));
        
        // Save to new format for likes manager
        localStorage.setItem('heerlen-doen-likes', JSON.stringify(likesArray));
        
        console.log(`💾 Saved ${likesArray.length} likes and ${dislikesArray.length} dislikes`);
        
        // Trigger likes update event for other components
        this.notifyLikesChanged();
    }
    
    notifyLikesChanged() {
        // Dispatch custom event to notify other components
        const event = new CustomEvent('likesChanged', {
            detail: {
                likes: Array.from(this.likes),
                dislikes: Array.from(this.dislikes)
            }
        });
        window.dispatchEvent(event);
    }
    
    showEmptyState() {
        this.cardsContainer.style.display = 'none';
        this.emptyState.style.display = 'flex';
        this.saveLikes();
    }
    
    skipToMap() {
        this.saveLikes();
        this.goToMap();
    }
    
    goToMap() {
        // Mark that preferences have been completed
        localStorage.setItem('preferencesCompleted', 'true');
        
        // Final save and debug
        this.saveLikes();
        
        // Debug: log final state
        console.log('🎯 Final preferences state:');
        console.log('  - Likes:', Array.from(this.likes));
        console.log('  - Dislikes:', Array.from(this.dislikes));
        console.log('  - Sample liked business IDs from data:', this.businesses
            .filter((b, i) => i < 3)
            .map(b => ({
                name: b.properties.name,
                originalId: b.properties.originalId,
                id: b.properties.id,
                compositeId: b.properties.compositeId
            }))
        );
        console.log('  - localStorage heerlen-doen-likes:', JSON.parse(localStorage.getItem('heerlen-doen-likes') || '[]'));
        console.log('  - localStorage likedLocations:', JSON.parse(localStorage.getItem('likedLocations') || '[]'));
        
        // Small delay to ensure storage is written
        setTimeout(() => {
            window.location.href = 'index.html?fromPreferences=true';
        }, 100);
    }
    
    handleKeydown(e) {
        if (this.isAnimating) return;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.dislikeCurrentCard();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.likeCurrentCard();
        }
    }
    
    showPawFeedback(direction) {
        // You can add paw feedback elements here if needed
        // For now, we'll just show card feedback
    }
    
    hidePawFeedback() {
        // Hide paw feedback elements
    }

    /**
     * Initialiseert de wizard
     */
    initializeWizard() {
        // Laad opgeslagen voorkeuren
        this.loadSubcategoryPreferences();
        
        // Laad geselecteerde categorieën uit localStorage
        this.loadSelectedCategoriesFromPreferences();
        
        // Maak wizard stappen
        this.createWizardSteps();
        
        // Setup wizard event listeners
        this.setupWizardListeners();
        
        // Toon eerste stap
        this.showWizardStep(0);
    }

    /**
     * Laad geselecteerde categorieën uit plan-je-dag.html (NIET uit oude voorkeuren)
     */
    loadSelectedCategoriesFromPreferences() {
        // Converteer array naar Set als het nodig is
        if (Array.isArray(this.selectedCategories)) {
            this.selectedCategories = new Set(this.selectedCategories);
        }
        
        // NIET categorieën toevoegen uit oude voorkeuren - gebruik alleen plan-je-dag.html selectie
        console.log('📋 Alleen gebruiken van plan-je-dag.html categorieën:', Array.from(this.selectedCategories));
    }

    /**
     * Maak wizard stappen op basis van geselecteerde categorieën
     */
    createWizardSteps() {
        if (!window.SubcategoryDefinitions) {
            console.error('SubcategoryDefinitions niet geladen');
            return;
        }

        this.wizardSteps = [];
        
        // Ga direct naar subcategorie stappen (categorieën komen van plan-je-dag.html)
        this.selectedCategories.forEach(category => {
            const definition = window.SubcategoryDefinitions[category];
            if (definition) {
                definition.steps.forEach(step => {
                    this.wizardSteps.push({
                        type: 'subcategory',
                        category: category,
                        step: step
                    });
                });
            }
        });

        console.log('📋 Wizard stappen gemaakt:', this.wizardSteps.length, 'voor categorieën:', Array.from(this.selectedCategories));
        
        // Als er geen stappen zijn, sla de wizard over
        if (this.wizardSteps.length === 0) {
            console.log('📋 Geen subcategorie stappen, ga direct naar swipen');
            this.finishWizard();
            return;
        }
    }

    /**
     * Setup wizard event listeners
     */
    setupWizardListeners() {
        this.stepBackButton.addEventListener('click', () => {
            this.goToPreviousStep();
        });

        this.stepNextButton.addEventListener('click', () => {
            this.goToNextStep();
        });

        this.stepFinishButton.addEventListener('click', () => {
            this.finishWizard();
        });
    }

    /**
     * Laad opgeslagen subcategorie voorkeuren
     */
    loadSubcategoryPreferences() {
        try {
            const saved = localStorage.getItem('categoryPreferences');
            if (saved) {
                this.subcategoryPreferences = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Fout bij laden subcategorie voorkeuren:', error);
            this.subcategoryPreferences = {};
        }
    }

    /**
     * Toont een specifieke wizard stap
     */
    showWizardStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.wizardSteps.length) {
            return;
        }

        this.currentWizardStep = stepIndex;
        const wizardStep = this.wizardSteps[stepIndex];

        // Update progress
        this.updateWizardProgress();

        // Alleen subcategory stappen nu
        if (wizardStep.type === 'subcategory') {
            this.showSubcategoryStep(wizardStep);
        }

        // Update navigation
        this.updateWizardNavigation();
    }


    /**
     * Toont een subcategorie stap
     */
    showSubcategoryStep(wizardStep) {
        const categoryIcon = this.getCategoryIcon(wizardStep.category);

        this.currentStepElement.innerHTML = `
            <div class="step-header">
                <div class="category-icon">${categoryIcon}</div>
                <h2>${wizardStep.category}</h2>
                <p>Stap ${this.currentWizardStep + 1} van ${this.wizardSteps.length}</p>
            </div>
            
            <div class="step-title">
                ${wizardStep.step.icon} ${wizardStep.step.title}
            </div>
            
            <div class="options-grid">
                ${wizardStep.step.options.map(option => `
                    <button class="option-button" 
                            data-category="${wizardStep.category}" 
                            data-step="${wizardStep.step.id}" 
                            data-option="${option.id}">
                        <span class="option-icon">${option.icon}</span>
                        <span class="option-label">${option.label}</span>
                    </button>
                `).join('')}
            </div>
        `;

        // Setup option click listeners
        this.setupOptionListeners();

        // Restore selections for this step
        this.restoreStepSelections(wizardStep.category, wizardStep.step.id);
    }


    /**
     * Setup option button listeners voor huidige stap
     */
    setupOptionListeners() {
        const optionButtons = this.currentStepElement.querySelectorAll('.option-button');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleOptionClick(button);
            });
        });
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
     * Krijgt de gematchte subcategorieën voor een bedrijf
     */
    getSubcategoryMatches(business) {
        const matches = [];
        const category = business.properties.category;
        const categoryPrefs = this.subcategoryPreferences[category];
        
        if (!categoryPrefs || !business.properties.subcategories) {
            return matches;
        }

        const definition = window.SubcategoryDefinitions[category];
        if (!definition) {
            return matches;
        }

        // Loop door elke stap in de definitie
        definition.steps.forEach(step => {
            const selectedOptions = categoryPrefs[step.id] || [];
            const businessOptions = business.properties.subcategories[step.id] || [];
            
            // Vind welke opties matchen
            step.options.forEach(option => {
                if (selectedOptions.includes(option.id) && businessOptions.includes(option.id)) {
                    matches.push({
                        icon: option.icon,
                        label: option.label
                    });
                }
            });
        });
        
        // Fallback: als er geen matches zijn, toon alle subcategorieën van het bedrijf
        if (matches.length === 0) {
            const fallbackMatches = this.getAllSubcategoriesForBusiness(business);
            return fallbackMatches.slice(0, 3); // Maximaal 3 tags om ruimte te besparen
        }
        
        return matches;
    }

    /**
     * Krijgt alle subcategorieën voor een bedrijf (fallback)
     */
    getAllSubcategoriesForBusiness(business) {
        const matches = [];
        const category = business.properties.category;
        const subcategories = business.properties.subcategories;
        
        console.log(`📋 getAllSubcategoriesForBusiness for ${business.properties.name}:`);
        console.log(`📋   Category: ${category}`);
        console.log(`📋   Subcategories:`, subcategories);
        
        if (!subcategories) {
            console.log(`📋   No subcategories found`);
            return matches;
        }
        
        const definition = window.SubcategoryDefinitions[category];
        if (!definition) {
            console.log(`📋   No definition found for ${category}`);
            return matches;
        }
        
        // Loop door elke stap in de definitie
        definition.steps.forEach(step => {
            const businessOptions = subcategories[step.id] || [];
            console.log(`📋   Step ${step.id}: businessOptions =`, businessOptions);
            
            // Voeg alle opties toe die het bedrijf heeft
            step.options.forEach(option => {
                if (businessOptions.includes(option.id)) {
                    console.log(`📋   Adding option: ${option.label}`);
                    matches.push({
                        icon: option.icon,
                        label: option.label
                    });
                }
            });
        });
        
        console.log(`📋   Final matches:`, matches);
        return matches;
    }

    /**
     * Converteer oude voorkeuren format naar nieuwe format
     */
    convertOldPreferencesFormat(oldPreferences) {
        const newPreferences = {};
        
        for (const [category, prefs] of Object.entries(oldPreferences)) {
            if (Array.isArray(prefs)) {
                // Converteer array naar object format
                newPreferences[category] = {};
                
                // Voor Eten & Drinken: array items zijn cuisine_type
                if (category === 'Eten & Drinken') {
                    newPreferences[category]['cuisine_type'] = prefs;
                }
                // Voor Cultuur: array items zijn period
                else if (category === 'Cultuur') {
                    newPreferences[category]['period'] = prefs;
                }
                // Voor Mode: array items zijn target_audience
                else if (category === 'Mode') {
                    newPreferences[category]['target_audience'] = prefs;
                }
                // Voor Murals: array items zijn style (als dat bestaat)
                else if (category === 'Murals') {
                    newPreferences[category]['style'] = prefs;
                }
                
                console.log(`📋 Converted ${category}: ${JSON.stringify(prefs)} → ${JSON.stringify(newPreferences[category])}`);
            } else {
                // Behoud object format
                newPreferences[category] = prefs;
            }
        }
        
        return newPreferences;
    }

    /**
     * Herstel selecties voor een specifieke stap
     */
    restoreStepSelections(category, stepId) {
        if (this.subcategoryPreferences[category] && this.subcategoryPreferences[category][stepId]) {
            const selectedOptions = this.subcategoryPreferences[category][stepId];
            selectedOptions.forEach(optionId => {
                const button = this.currentStepElement.querySelector(
                    `[data-option="${optionId}"]`
                );
                if (button) {
                    button.classList.add('selected');
                }
            });
        }
    }

    /**
     * Update wizard progress
     */
    updateWizardProgress() {
        const progress = ((this.currentWizardStep + 1) / this.wizardSteps.length) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `${this.currentWizardStep + 1} van ${this.wizardSteps.length}`;
    }

    /**
     * Update wizard navigatie buttons
     */
    updateWizardNavigation() {
        // Back button
        this.stepBackButton.style.display = this.currentWizardStep > 0 ? 'block' : 'none';
        
        // Next/Finish button
        const isLastStep = this.currentWizardStep >= this.wizardSteps.length - 1;
        
        if (isLastStep) {
            this.stepNextButton.style.display = 'none';
            this.stepFinishButton.style.display = 'block';
        } else {
            this.stepNextButton.style.display = 'block';
            this.stepFinishButton.style.display = 'none';
        }
        
        // Enable/disable next button based on selections
        this.updateNextButtonState();
    }

    /**
     * Update next button state
     */
    updateNextButtonState() {
        // Voor subcategorie stappen: altijd enabled (optioneel)
        this.stepNextButton.disabled = false;
        this.stepFinishButton.disabled = false;
    }

    /**
     * Ga naar vorige stap
     */
    goToPreviousStep() {
        if (this.currentWizardStep > 0) {
            this.showWizardStep(this.currentWizardStep - 1);
        }
    }

    /**
     * Ga naar volgende stap
     */
    goToNextStep() {
        if (this.currentWizardStep < this.wizardSteps.length - 1) {
            this.showWizardStep(this.currentWizardStep + 1);
        }
    }

    /**
     * Voltooi de wizard
     */
    async finishWizard() {
        console.log('Wizard voltooid met voorkeuren:', this.subcategoryPreferences);
        console.log('Geselecteerde categorieën:', Array.from(this.selectedCategories));
        
        // Sla geselecteerde categorieën op voor de kaart
        this.saveSelectedCategories();
        
        // Verberg wizard
        this.subcategoryWizard.style.display = 'none';
        
        // Toon cards container
        this.cardsContainer.style.display = 'block';
        
        // Laad bedrijven met filtering
        await this.loadBusinesses();
        
        console.log('📋 Na loadBusinesses: aantal bedrijven =', this.businesses.length);
        
        if (this.businesses.length === 0) {
            console.warn('⚠️ Geen bedrijven gevonden na filtering!');
            this.showEmptyState();
        } else {
            this.showCurrentCard();
            this.updateProgress();
        }
    }

    /**
     * Sla geselecteerde categorieën op voor de kaart
     */
    saveSelectedCategories() {
        const categoriesArray = Array.from(this.selectedCategories);
        localStorage.setItem('selectedCategories', JSON.stringify(categoriesArray));
        console.log('💾 Geselecteerde categorieën opgeslagen:', categoriesArray);
    }

    /**
     * Setup event listeners voor subcategorie selectie
     */
    setupSubcategoryListeners() {
        // Option button clicks
        this.categoriesContainer.addEventListener('click', (e) => {
            if (e.target.closest('.option-button')) {
                this.handleOptionClick(e.target.closest('.option-button'));
            }
        });

        // Continue button
        this.continueButton.addEventListener('click', () => {
            this.finishSubcategorySelection();
        });
    }

    /**
     * Behandelt klik op een optie button
     */
    handleOptionClick(button) {
        const category = button.dataset.category;
        const stepId = button.dataset.step;
        const optionId = button.dataset.option;

        // Toggle selectie
        button.classList.toggle('selected');

        // Update voorkeuren
        if (!this.subcategoryPreferences[category]) {
            this.subcategoryPreferences[category] = {};
        }
        if (!this.subcategoryPreferences[category][stepId]) {
            this.subcategoryPreferences[category][stepId] = [];
        }

        const options = this.subcategoryPreferences[category][stepId];
        const index = options.indexOf(optionId);

        if (button.classList.contains('selected')) {
            if (index === -1) {
                options.push(optionId);
            }
        } else {
            if (index > -1) {
                options.splice(index, 1);
            }
        }

        // Cleanup lege arrays
        if (options.length === 0) {
            delete this.subcategoryPreferences[category][stepId];
        }
        if (Object.keys(this.subcategoryPreferences[category] || {}).length === 0) {
            delete this.subcategoryPreferences[category];
        }

        // Sla voorkeuren op
        this.saveSubcategoryPreferences();
        
        // Update navigatie (voor nu altijd enabled)
        this.updateNextButtonState();

        console.log('Voorkeur bijgewerkt:', { category, stepId, optionId, selected: button.classList.contains('selected') });
    }


    /**
     * Sla subcategorie voorkeuren op
     */
    saveSubcategoryPreferences() {
        try {
            console.log('💾 Opslaan subcategorie voorkeuren:', this.subcategoryPreferences);
            localStorage.setItem('categoryPreferences', JSON.stringify(this.subcategoryPreferences));
        } catch (error) {
            console.error('Fout bij opslaan subcategorie voorkeuren:', error);
        }
    }

}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PreferencesManager();
});