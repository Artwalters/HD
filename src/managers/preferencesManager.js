// ==============================
// PREFERENCES MANAGER - HEERLEN DOEN
// ==============================

class PreferencesManager {
    constructor() {
        // Initialize with config from global scope
        this.config = window.HeerlenConfig || {
            dataSources: {
                "Cultuur": "./src/data/cultuur.json",
                "Eten & Drinken": "./src/data/horeca.json", 
                "Mode": "./src/data/mode.json"
            }
        };
        
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
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadSelectedCategories();
        await this.loadBusinesses();
        this.showCurrentCard();
        this.updateProgress();
    }
    
    setupEventListeners() {
        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            window.location.href = 'welcome.html';
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
            this.selectedCategories = JSON.parse(saved);
            console.log('📋 Selected categories loaded:', this.selectedCategories);
        } else {
            console.warn('⚠️ No categories selected, redirecting to welcome');
            // If no categories selected, redirect back to welcome
            window.location.href = 'welcome.html';
            return;
        }
    }
    
    async loadBusinesses() {
        try {
            this.loadingState.style.display = 'flex';
            this.updateLoadingProgress(0, 'Laden van categorieën...');
            
            // Load data for selected categories with progress tracking
            const allBusinesses = [];
            const totalCategories = this.selectedCategories.length;
            
            for (let i = 0; i < this.selectedCategories.length; i++) {
                const category = this.selectedCategories[i];
                this.updateLoadingProgress(
                    (i / totalCategories) * 50, 
                    `Laden van ${category}...`
                );
                
                try {
                    const categoryData = await this.dataLoader.loadCategoryData(category);
                    if (categoryData && categoryData.features) {
                        console.log(`✅ Loaded ${categoryData.features.length} items for ${category}`);
                        allBusinesses.push(...categoryData.features);
                    } else {
                        console.warn(`⚠️ No data found for category: ${category}`);
                    }
                } catch (categoryError) {
                    console.error(`❌ Error loading category ${category}:`, categoryError);
                    // Continue with other categories
                }
            }
            
            this.updateLoadingProgress(60, 'Voorbereiden van cards...');
            
            // Filter out duplicates by ID
            const uniqueBusinesses = this.removeDuplicates(allBusinesses);
            
            // Shuffle businesses for random order
            this.businesses = this.shuffleArray(uniqueBusinesses);
            
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
        if (this.currentIndex >= this.businesses.length) {
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
                card.style.transform = `scale(${0.95 - (i * 0.02)}) translateY(${i * 4}px)`;
                card.style.zIndex = 10 - i;
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
        
        card.innerHTML = `
            <div class="card-image">
                <img src="${imageUrl}" alt="${business.properties.name}" onerror="this.src='assets/images/catcute.png'">
                <div class="card-category">${business.properties.category}</div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${business.properties.name}</h3>
                <p class="card-description">${business.properties.description || 'Ontdek deze geweldige locatie in Heerlen!'}</p>
                
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
            stackCard.style.transform = 'scale(0.95)';
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PreferencesManager();
});