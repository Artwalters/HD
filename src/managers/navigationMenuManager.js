// ==============================
// NAVIGATION MENU MANAGER - HEERLEN DOEN
// ==============================

class NavigationMenuManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.navigationLoaded = false;
        this.init();
    }
    
    async init() {
        await this.loadNavigation();
        this.setActiveNavItem();
        this.setupEventListeners();
        console.log('📱 Navigation menu geïnitialiseerd');
    }
    
    /**
     * Laadt de navigatie component
     */
    async loadNavigation() {
        try {
            const response = await fetch('./src/components/navigation.html');
            const navigationHTML = await response.text();
            
            // Voeg navigatie toe aan body
            const navContainer = document.createElement('div');
            navContainer.innerHTML = navigationHTML;
            document.body.appendChild(navContainer.firstElementChild);
            
            this.navigationLoaded = true;
        } catch (error) {
            console.error('❌ Fout bij laden van navigatie:', error);
        }
    }
    
    /**
     * Bepaalt huidige pagina gebaseerd op URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        // Map filenames naar pagina types
        const pageMap = {
            'welcome.html': 'home',
            'index.html': 'map',
            'likes.html': 'likes',
            'preferences.html': 'preferences'
        };
        
        return pageMap[filename] || 'map'; // Default naar map
    }
    
    /**
     * Zet actieve navigatie item
     */
    setActiveNavItem() {
        if (!this.navigationLoaded) return;
        
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            
            const pageType = item.dataset.page;
            if (pageType === this.currentPage) {
                item.classList.add('active');
            }
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Laat default link gedrag toe, maar voeg visuele feedback toe
                this.handleNavClick(e.target.closest('.nav-item'));
            });
        });
        
        // Update active state wanneer pagina verandert (voor SPA gedrag)
        window.addEventListener('popstate', () => {
            this.currentPage = this.getCurrentPage();
            this.setActiveNavItem();
        });
    }
    
    /**
     * Behandelt navigatie click
     */
    handleNavClick(navItem) {
        // Voeg tijdelijke feedback toe
        navItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            navItem.style.transform = '';
        }, 150);
        
        // Update active state (voor visuele feedback voor redirect)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');
    }
    
    /**
     * Verberg navigatie (voor fullscreen content)
     */
    hide() {
        const navigation = document.getElementById('mainNavigation');
        if (navigation) {
            navigation.style.transform = 'translateY(100%)';
        }
    }
    
    /**
     * Toon navigatie
     */
    show() {
        const navigation = document.getElementById('mainNavigation');
        if (navigation) {
            navigation.style.transform = 'translateY(0)';
        }
    }
    
    /**
     * Toggle navigatie zichtbaarheid
     */
    toggle() {
        const navigation = document.getElementById('mainNavigation');
        if (navigation) {
            const isHidden = navigation.style.transform === 'translateY(100%)';
            if (isHidden) {
                this.show();
            } else {
                this.hide();
            }
        }
    }
}

// Maak globaal beschikbaar
window.NavigationMenuManager = NavigationMenuManager;

// Auto-initialisatie
document.addEventListener('DOMContentLoaded', () => {
    window.navigationMenu = new NavigationMenuManager();
});