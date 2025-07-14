// ==============================
// SWIPE MANAGER - HEERLEN DOEN
// ==============================

class SwipeManager {
    constructor() {
        this.container = document.getElementById('swipeContainer');
        this.cards = Array.from(document.querySelectorAll('.swipe-card'));
        this.dots = Array.from(document.querySelectorAll('.nav-dot'));
        this.selectedCategories = new Set();
        this.currentIndex = 0;
        this.isAnimating = false;
        this.touchStartY = 0;
        this.touchEndY = 0;
        
        // Threshold for swipe detection
        this.swipeThreshold = 50;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateView();
        this.loadSavedCategories();
    }
    
    setupEventListeners() {
        // Touch events for mobile
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Mouse wheel for desktop
        this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Button clicks
        document.querySelectorAll('.card-button').forEach(button => {
            button.addEventListener('click', this.handleSelectCategory.bind(this));
        });
        
        // Navigation dots
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToCard(index));
        });
        
        // Continue button
        document.getElementById('continueButton').addEventListener('click', this.continueToMap.bind(this));
        
        // Skip button
        document.getElementById('skipButton').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    handleTouchStart(e) {
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchMove(e) {
        // Prevent default scrolling
        e.preventDefault();
    }
    
    handleTouchEnd(e) {
        this.touchEndY = e.changedTouches[0].clientY;
        this.handleSwipe();
    }
    
    handleSwipe() {
        const swipeDistance = this.touchStartY - this.touchEndY;
        
        if (Math.abs(swipeDistance) > this.swipeThreshold) {
            if (swipeDistance > 0) {
                // Swiped up - go to next card (down in sequence)
                this.nextCard();
            } else {
                // Swiped down - go to previous card (up in sequence)
                this.previousCard();
            }
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        if (this.isAnimating) return;
        
        if (e.deltaY > 0) {
            this.nextCard();
        } else {
            this.previousCard();
        }
    }
    
    handleKeydown(e) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.previousCard();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.nextCard();
        }
    }
    
    nextCard() {
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
        } else {
            // Loop back to first card
            this.currentIndex = 0;
        }
        this.updateView();
    }
    
    previousCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            // Loop back to last card
            this.currentIndex = this.cards.length - 1;
        }
        this.updateView();
    }
    
    goToCard(index) {
        if (index >= 0 && index < this.cards.length) {
            this.currentIndex = index;
            this.updateView();
        }
    }
    
    updateView() {
        this.isAnimating = true;
        
        // Update card positions - cards flow downward
        this.cards.forEach((card, index) => {
            const offset = index - this.currentIndex;
            card.style.transform = `translateY(${offset * 100}vh)`;
            
            // Update card state
            if (index === this.currentIndex) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        // Update dots
        this.dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Reset animation flag
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }
    
    handleSelectCategory(e) {
        const card = e.target.closest('.swipe-card');
        const category = card.dataset.category;
        
        if (this.selectedCategories.has(category)) {
            // Deselect
            this.selectedCategories.delete(category);
            card.classList.remove('selected');
            e.target.textContent = 'Kies deze activiteit';
        } else {
            // Select
            this.selectedCategories.add(category);
            card.classList.add('selected');
            e.target.textContent = 'Geselecteerd ✓';
        }
        
        this.updateSelectedDisplay();
        this.saveCategories();
    }
    
    updateSelectedDisplay() {
        const selectedList = document.getElementById('selectedList');
        const continueButton = document.getElementById('continueButton');
        
        selectedList.innerHTML = '';
        
        if (this.selectedCategories.size > 0) {
            this.selectedCategories.forEach(category => {
                const chip = document.createElement('div');
                chip.className = 'category-chip';
                chip.textContent = category;
                selectedList.appendChild(chip);
            });
            
            continueButton.style.display = 'block';
        } else {
            continueButton.style.display = 'none';
        }
    }
    
    saveCategories() {
        localStorage.setItem('selectedCategories', JSON.stringify([...this.selectedCategories]));
    }
    
    loadSavedCategories() {
        const saved = localStorage.getItem('selectedCategories');
        if (saved) {
            const categories = JSON.parse(saved);
            categories.forEach(category => {
                this.selectedCategories.add(category);
                const card = document.querySelector(`[data-category="${category}"]`);
                if (card) {
                    card.classList.add('selected');
                    card.querySelector('.card-button').textContent = 'Geselecteerd ✓';
                }
            });
            this.updateSelectedDisplay();
        }
    }
    
    continueToMap() {
        if (this.selectedCategories.size > 0) {
            // Save categories and redirect to preferences page
            this.saveCategories();
            window.location.href = 'preferences.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SwipeManager();
});