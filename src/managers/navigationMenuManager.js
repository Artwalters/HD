// ==============================
// DROPDOWN NAVIGATION MANAGER - HEERLEN DOEN
// ==============================

class NavigationMenuManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.navigationLoaded = false;
        this.isDropdownOpen = false;
        this.init();
    }
    
    async init() {
        await this.loadNavigation();
        this.setActiveNavItem();
        this.setupEventListeners();
        this.createBackdrop();
        console.log('📱 Dropdown navigation menu geïnitialiseerd');
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
            'index.html': 'home',
            'map.html': 'map',
            'likes.html': 'likes',
            'preferences.html': 'preferences',
            'plan-je-dag.html': 'plan'
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
     * Creëert backdrop element voor dropdown
     */
    createBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        backdrop.id = 'navBackdrop';
        document.body.appendChild(backdrop);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle button
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }
        
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Sluit dropdown na klik
                this.closeDropdown();
                // Laat default link gedrag toe
                this.handleNavClick(e.target.closest('.nav-item'));
            });
        });
        
        // Backdrop click om dropdown te sluiten
        const backdrop = document.getElementById('navBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.closeDropdown();
            });
        }
        
        // Escape key om dropdown te sluiten
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });
        
        // Klik buiten dropdown om te sluiten
        document.addEventListener('click', (e) => {
            const navigation = document.getElementById('mainNavigation');
            if (navigation && !navigation.contains(e.target) && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });
        
        // Update active state wanneer pagina verandert (voor SPA gedrag)
        window.addEventListener('popstate', () => {
            this.currentPage = this.getCurrentPage();
            this.setActiveNavItem();
        });
    }
    
    /**
     * Toggle dropdown open/closed
     */
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    /**
     * Open dropdown
     */
    openDropdown() {
        const dropdown = document.getElementById('navDropdown');
        const toggle = document.getElementById('navToggle');
        const backdrop = document.getElementById('navBackdrop');
        
        if (dropdown && toggle) {
            dropdown.classList.add('open');
            toggle.classList.add('active');
            if (backdrop) {
                backdrop.classList.add('open');
            }
            this.isDropdownOpen = true;
        }
    }
    
    /**
     * Close dropdown
     */
    closeDropdown() {
        const dropdown = document.getElementById('navDropdown');
        const toggle = document.getElementById('navToggle');
        const backdrop = document.getElementById('navBackdrop');
        
        if (dropdown && toggle) {
            dropdown.classList.remove('open');
            toggle.classList.remove('active');
            if (backdrop) {
                backdrop.classList.remove('open');
            }
            this.isDropdownOpen = false;
        }
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
            navigation.style.opacity = '0';
            navigation.style.pointerEvents = 'none';
        }
    }
    
    /**
     * Toon navigatie
     */
    show() {
        const navigation = document.getElementById('mainNavigation');
        if (navigation) {
            navigation.style.opacity = '1';
            navigation.style.pointerEvents = 'auto';
        }
    }
    
    /**
     * Toggle navigatie zichtbaarheid
     */
    toggle() {
        const navigation = document.getElementById('mainNavigation');
        if (navigation) {
            const isHidden = navigation.style.opacity === '0';
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