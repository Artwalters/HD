// ==============================
// CONTROLS MANAGER MODULE - v1.0
// ==============================

class ControlsManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.controlsElement = null;
        this.isInitialized = false;
    }

    /**
     * Initialiseert de custom controls
     */
    initialize() {
        if (this.isInitialized) return;

        this.removeDefaultControls();
        this.createCustomControls();
        this.setupEventListeners();
        this.setupMapListeners();
        this.addHoverEffects();
        this.isInitialized = true;
        
        console.log('✅ Controls manager geïnitialiseerd');
    }

    /**
     * Verwijdert de standaard Mapbox controls
     */
    removeDefaultControls() {
        // Remove default navigation control if it exists
        const existingControls = document.querySelectorAll('.mapboxgl-ctrl-group');
        existingControls.forEach(control => {
            if (control.querySelector('.mapboxgl-ctrl-zoom-in') || 
                control.querySelector('.mapboxgl-ctrl-zoom-out')) {
                control.remove();
            }
        });
    }

    /**
     * Creëert custom controls
     */
    createCustomControls() {
        this.controlsElement = document.createElement('div');
        this.controlsElement.className = 'custom-controls';
        this.controlsElement.innerHTML = this.generateControlsHTML();
        
        // Add to map container
        const mapContainer = document.getElementById('map');
        mapContainer.appendChild(this.controlsElement);
    }

    /**
     * Genereert controls HTML
     */
    generateControlsHTML() {
        return `
            <div class="controls-wrapper">
                <a href="likes.html" class="control-btn likes-btn" title="Mijn Likes" style="text-decoration: none; color: inherit;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </a>
                
                <button class="control-btn zoom-in-btn" data-action="zoom-in" title="Zoom in">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                </button>
                
                <button class="control-btn zoom-out-btn" data-action="zoom-out" title="Zoom out">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                </button>
                
                <button class="control-btn compass-btn" data-action="reset-bearing" title="Reset naar het noorden">
                    <div class="compass-indicator">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="9" stroke-width="1.5"></circle>
                            <path d="M12 3 L14 8 L12 7 L10 8 Z" fill="currentColor"></path>
                            <text x="12" y="7" text-anchor="middle" font-size="6" font-weight="bold" fill="currentColor">N</text>
                        </svg>
                    </div>
                </button>
                
            </div>
        `;
    }

    /**
     * Setup event listeners voor controls
     */
    setupEventListeners() {
        const buttons = this.controlsElement.querySelectorAll('.control-btn');
        buttons.forEach(button => {
            button.addEventListener('click', this.handleControlClick.bind(this));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
            
            switch(e.key) {
                case '=':
                case '+':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case 'r':
                case 'R':
                    this.resetBearing();
                    break;
            }
        });
    }

    /**
     * Behandelt control button clicks
     */
    handleControlClick(e) {
        const action = e.currentTarget.dataset.action;
        
        switch(action) {
            case 'zoom-in':
                this.zoomIn();
                break;
            case 'zoom-out':
                this.zoomOut();
                break;
            case 'reset-bearing':
                this.resetBearing();
                break;
        }
    }

    /**
     * Zoom in functionaliteit
     */
    zoomIn() {
        const currentZoom = this.map.getZoom();
        const newZoom = Math.min(currentZoom + 1, this.map.getMaxZoom());
        
        this.map.easeTo({
            zoom: newZoom,
            duration: 300
        });
        
        console.log(`🔍 Zoom in naar: ${newZoom.toFixed(1)}`);
    }

    /**
     * Zoom out functionaliteit
     */
    zoomOut() {
        const currentZoom = this.map.getZoom();
        const newZoom = Math.max(currentZoom - 1, this.map.getMinZoom());
        
        this.map.easeTo({
            zoom: newZoom,
            duration: 300
        });
        
        console.log(`🔍 Zoom out naar: ${newZoom.toFixed(1)}`);
    }

    /**
     * Reset bearing (kompas) - Google Maps style
     */
    resetBearing() {
        this.map.easeTo({
            bearing: 0,
            pitch: 45,
            duration: 600
        });
        
        console.log('🧭 Kompas gereset naar het noorden');
    }
    
    /**
     * Update compass indicator met huidige bearing (Google Maps style)
     */
    updateCompassIndicator() {
        const compassIndicator = this.controlsElement?.querySelector('.compass-indicator svg');
        const compassBtn = this.controlsElement?.querySelector('.compass-btn');
        
        if (!compassIndicator || !compassBtn) return;
        
        const currentBearing = this.map.getBearing();
        
        // Rotate compass to show current map orientation (opposite direction)
        compassIndicator.style.transform = `rotate(${-currentBearing}deg)`;
        
        // Show/hide compass button based on bearing (Google Maps behavior)
        if (Math.abs(currentBearing) < 1) {
            // Hide when pointing north
            compassBtn.classList.add('hidden');
            compassBtn.classList.remove('active');
        } else {
            // Show and highlight when rotated
            compassBtn.classList.remove('hidden');
            compassBtn.classList.add('active');
        }
    }


    /**
     * Update controls state
     */
    updateControlsState() {
        const zoomInBtn = this.controlsElement.querySelector('.zoom-in-btn');
        const zoomOutBtn = this.controlsElement.querySelector('.zoom-out-btn');
        const compassBtn = this.controlsElement.querySelector('.compass-btn');
        
        const currentZoom = this.map.getZoom();
        const currentBearing = this.map.getBearing();
        
        // Update zoom buttons
        zoomInBtn.disabled = currentZoom >= this.map.getMaxZoom();
        zoomOutBtn.disabled = currentZoom <= this.map.getMinZoom();
        
        // Update compass button and indicator
        this.updateCompassIndicator();
    }

    /**
     * Add smooth hover effects
     */
    addHoverEffects() {
        const buttons = this.controlsElement.querySelectorAll('.control-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * Setup map event listeners
     */
    setupMapListeners() {
        this.map.on('zoom', this.updateControlsState.bind(this));
        this.map.on('rotate', this.updateControlsState.bind(this));
        this.map.on('load', this.updateControlsState.bind(this));
    }


    /**
     * Cleanup controls manager
     */
    destroy() {
        if (this.controlsElement) {
            this.controlsElement.remove();
            this.controlsElement = null;
        }
        
        this.isInitialized = false;
        console.log('🗑️ Controls manager vernietigd');
    }
}

// Export voor gebruik in andere modules
window.ControlsManager = ControlsManager;