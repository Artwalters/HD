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
                
                <button class="control-btn compass-btn" data-action="reset-bearing" title="Reset kompas">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L8 7h8l-4-5z"></path>
                        <path d="M12 22l4-5H8l4 5z"></path>
                        <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                </button>
                
                <button class="control-btn fullscreen-btn" data-action="fullscreen" title="Volledig scherm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18-5v3a2 2 0 0 1-2 2h-3m0 8h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
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
                case 'f':
                case 'F':
                    this.toggleFullscreen();
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
            case 'fullscreen':
                this.toggleFullscreen();
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
     * Reset bearing (kompas)
     */
    resetBearing() {
        this.map.easeTo({
            bearing: 0,
            pitch: 45,
            duration: 500
        });
        
        console.log('🧭 Kompas gereset');
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen not supported:', err);
            });
        } else {
            document.exitFullscreen();
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
        
        // Update compass button (highlight when bearing is not 0)
        if (Math.abs(currentBearing) > 1) {
            compassBtn.classList.add('active');
        } else {
            compassBtn.classList.remove('active');
        }
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