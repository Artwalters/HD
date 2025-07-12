// ==============================
// POPUP MANAGER MODULE - v1.2
// ==============================

class PopupManager {
    constructor(map, config, dataLoader) {
        this.map = map;
        this.config = config;
        this.dataLoader = dataLoader;
        this.activePopup = null;
        this.isInitialized = false;
        this.templateLoader = templateLoader;
    }

    /**
     * Initialiseert popup functionaliteit
     */
    initialize() {
        if (this.isInitialized) return;

        // Setup click event voor popups
        this.map.on('click', 'business-markers', this.handleMarkerClick.bind(this));
        
        // Setup auto-close events
        this.setupAutoCloseEvents();
        
        // Setup click-outside to close
        this.setupClickOutsideClose();
        
        // Setup info panel global events
        this.setupInfoPanelEvents();
        
        this.isInitialized = true;
        console.log('✅ Popup manager geïnitialiseerd');
    }

    /**
     * Setup events voor automatisch sluiten van popups
     */
    setupAutoCloseEvents() {
        const events = ['dragstart', 'zoomstart', 'movestart', 'pitchstart', 'rotatestart'];
        events.forEach(event => {
            this.map.on(event, this.closeActivePopup.bind(this));
        });
    }

    /**
     * Setup click outside to close popup
     */
    setupClickOutsideClose() {
        this.map.on('click', (e) => {
            const features = this.map.queryRenderedFeatures(e.point, { 
                layers: ['business-markers'] 
            });
            if (features.length === 0) {
                this.closeActivePopup();
            }
        });
    }

    /**
     * Setup info panel global events
     */
    setupInfoPanelEvents() {
        // Close info panel with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeInfoPanel();
            }
        });

        // Close info panel when clicking outside on desktop
        document.addEventListener('click', (e) => {
            const infoPanel = document.getElementById('info-panel');
            if (infoPanel && infoPanel.classList.contains('open') && 
                !infoPanel.contains(e.target) && 
                !e.target.closest('.popup-wrapper')) {
                this.closeInfoPanel();
            }
        });
    }

    /**
     * Behandelt marker click events
     * @param {Object} e - Mapbox click event
     */
    async handleMarkerClick(e) {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        
        // Voeg coordinaten toe aan properties voor navigation
        properties.coordinates = coordinates;
        properties.lng = coordinates[0];
        properties.lat = coordinates[1];

        console.log('🔍 Popup geopend voor:', properties.name);

        // Ensure popup appears over correct copy when map is zoomed out
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Calculate responsive offset
        const offset = this.calculateOffset();
        
        // Fly to marker
        this.map.flyTo({ 
            center: coordinates, 
            offset, 
            duration: this.config.popup.animation.duration, 
            essential: true 
        });

        // Close existing popup
        if (this.activePopup) {
            this.closeActivePopup();
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Create and show new popup
        await this.createPopup(coordinates, properties);
    }

    /**
     * Berekent responsive offset voor popup
     * @returns {Array} Offset coordinaten
     */
    calculateOffset() {
        const screenWidth = window.innerWidth;
        
        if (screenWidth <= this.config.ui.responsive.small) {
            return [0, 200];
        } else if (screenWidth <= this.config.ui.responsive.mobile) {
            return [0, 220];
        } else {
            return [0, 250];
        }
    }

    /**
     * Creëert en toont popup
     * @param {Array} coordinates - Lng/Lat coordinaten
     * @param {Object} properties - Feature properties
     */
    async createPopup(coordinates, properties) {
        const popup = new mapboxgl.Popup({
            offset: this.config.popup.offset,
            className: "custom-popup",
            closeButton: false,
            maxWidth: this.config.popup.maxWidth,
            closeOnClick: false,
            anchor: "bottom"
        });

        // Generate popup content
        const { html } = await this.createPopupContent(properties);
        
        popup.setLngLat(coordinates)
             .setHTML(html)
             .addTo(this.map);

        // Set CSS custom properties for dynamic styling
        const popupElement = popup.getElement();
        const color = properties.color || this.config.theme.primary;
        popupElement.style.setProperty('--popup-color', color);
        
        this.activePopup = popup;
        
        // Setup popup interactions
        this.setupPopupInteractions(popup, properties);
    }

    /**
     * Creëert popup content HTML en CSS
     * @param {Object} properties - Feature properties
     * @returns {Promise<Object>} {html}
     */
    async createPopupContent(properties) {
        const html = await this.generatePopupHTML(properties);
        
        return { html };
    }


    /**
     * Genereert popup HTML
     * @param {Object} properties - Feature properties
     * @returns {Promise<string>} HTML content
     */
    async generatePopupHTML(properties) {
        try {
            const template = await this.templateLoader.loadTemplate('popup.html');
            
            // Genereer unieke ID voor gradient
            const id = `popup_${Date.now()}`;
            
            const data = {
                id: id,
                name: properties.name || '',
                description: properties.description || '',
                color: properties.color || this.config.theme.primary,
                address: properties.address || '',
                phone: properties.phone || '',
                website: properties.website || '',
                openingHours: properties.openingHours || ''
            };
            
            return this.templateLoader.renderAdvanced(template, data);
        } catch (error) {
            console.error('Error generating popup HTML:', error);
            // Fallback naar simpele HTML bij fout
            return `<div class="popup-wrapper"><div class="popup-title">${properties.name}</div></div>`;
        }
    }


    /**
     * Setup popup interacties (scroll, flip, close, etc.)
     * @param {Object} popup - Mapbox popup instance
     * @param {Object} properties - Feature properties
     */
    setupPopupInteractions(popup, properties) {
        const popupElement = popup.getElement();
        const popupContent = popupElement.querySelector(".mapboxgl-popup-content");
        const popupWrapper = popupElement.querySelector(".popup-wrapper");
        const frontContent = popupElement.querySelector(".popup-front .content-wrapper");
        const backContent = popupElement.querySelector(".popup-back .content-wrapper");
        const description = popupElement.querySelector(".popup-description");
        const gradient = popupElement.querySelector("#paint0_linear_3248_5");

        // Debug log
        console.log('🔧 Setting up popup interactions...');

        // Setup all interactions from the original code
        try {
            this.setupGradientAnimation(popupWrapper, gradient);
            this.setupPopupHeightAdjustment(popupWrapper, frontContent, backContent);
            this.setupPopupAnimation(popupContent);
            this.setupScrollableDescription(description);
            this.setupFlipInteraction(popupElement, popupWrapper, properties);
            this.setupCloseButton(popupElement, popup, popupContent);
            console.log('✅ Popup interactions setup complete');
        } catch (error) {
            console.error('❌ Error setting up popup interactions:', error);
        }
    }

    /**
     * Setup gradient animation
     * @param {Element} popupWrapper - Popup wrapper element
     * @param {Element} gradient - Gradient element
     */
    setupGradientAnimation(popupWrapper, gradient) {
        if (!gradient) return;
        
        // Animate gradient stops
        const animateGradient = (newY1, newY2) => {
            try {
                const startY1 = gradient.getAttribute('y1') ? parseFloat(gradient.getAttribute('y1').replace('%', '')) : 0;
                const startY2 = gradient.getAttribute('y2') ? parseFloat(gradient.getAttribute('y2').replace('%', '')) : 100;
                const startTime = Date.now();
                
                function step() {
                    const progress = Math.min((Date.now() - startTime) / 800, 1);
                    const currentY1 = startY1 + (newY1 - startY1) * progress;
                    const currentY2 = startY2 + (newY2 - startY2) * progress;
                    gradient.setAttribute('y1', currentY1 + '%');
                    gradient.setAttribute('y2', currentY2 + '%');
                    
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    }
                }
                
                requestAnimationFrame(step);
            } catch (error) {
                console.warn('Gradient animation error:', error);
            }
        };
        
        // Set up hover effect on gradient
        popupWrapper.addEventListener("mouseenter", () => {
            animateGradient(30, 282);
        });
        
        popupWrapper.addEventListener("mouseleave", () => {
            animateGradient(0, 252);
        });
    }

    /**
     * Setup popup height adjustment
     * @param {Element} popupWrapper - Popup wrapper element
     * @param {Element} frontContent - Front content element
     * @param {Element} backContent - Back content element
     */
    setupPopupHeightAdjustment(popupWrapper, frontContent, backContent) {
        const adjustPopupHeight = () => {
            const contentHeight = Math.max(frontContent.offsetHeight, backContent.offsetHeight);
            popupWrapper.style.height = `${contentHeight}px`;
            
            document.querySelectorAll(".popup-side").forEach(side => {
                side.style.height = `${contentHeight}px`;
            });
        };
        
        // Adjust height after content is loaded
        setTimeout(adjustPopupHeight, 10);
        
        // Update height on window resize
        window.addEventListener("resize", adjustPopupHeight);
    }

    /**
     * Setup popup animation
     * @param {Element} popupContent - Popup content element
     */
    setupPopupAnimation(popupContent) {
        // Animate popup appearance
        popupContent.style.opacity = "0";
        popupContent.style.transform = "rotate(8deg) translateY(40px) scale(0.4)";
        
        requestAnimationFrame(() => {
            popupContent.style.transition = "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
            popupContent.style.opacity = "1";
            popupContent.style.transform = "rotate(0deg) translateY(0) scale(1)";
        });
    }

    /**
     * Setup scrollable description
     * @param {Element} description - Description element
     */
    setupScrollableDescription(description) {
        if (!description) return;
        
        // Mouse wheel scrolling
        description.addEventListener("wheel", event => {
            event.stopPropagation();
            event.preventDefault();
            description.scrollTop += event.deltaY;
        }, { passive: false });
        
        // Touch scrolling support
        let startY = 0;
        let isScrolling = false;
        
        description.addEventListener("touchstart", event => {
            startY = event.touches[0].clientY;
            isScrolling = true;
        }, { passive: true });
        
        description.addEventListener("touchmove", event => {
            if (!isScrolling) return;
            
            event.stopPropagation();
            const currentY = event.touches[0].clientY;
            const deltaY = startY - currentY;
            
            description.scrollTop += deltaY;
            startY = currentY;
        }, { passive: false });
        
        description.addEventListener("touchend", () => {
            isScrolling = false;
        }, { passive: true });
        
        // Disable map interactions when scrolling
        description.addEventListener("mouseenter", () => {
            this.map.dragPan.disable();
            this.map.scrollZoom.disable();
        });
        
        description.addEventListener("mouseleave", () => {
            this.map.dragPan.enable();
            this.map.scrollZoom.enable();
        });
        
        // Also disable for touch
        description.addEventListener("touchstart", () => {
            this.map.dragPan.disable();
            this.map.scrollZoom.disable();
        });
        
        description.addEventListener("touchend", () => {
            this.map.dragPan.enable();
            this.map.scrollZoom.enable();
        });
    }

    /**
     * Setup flip interaction
     * @param {Element} popupElement - Popup element
     * @param {Element} popupWrapper - Popup wrapper element
     * @param {Object} properties - Feature properties
     */
    setupFlipInteraction(popupElement, popupWrapper, properties) {
        // Handle info button click - check if it's front or back
        popupElement.querySelectorAll(".more-info-button").forEach(button => {
            button.addEventListener("click", () => {
                const isOnFront = button.closest('.popup-front');
                if (isOnFront) {
                    // Front button - open info panel
                    this.openInfoPanel(properties);
                } else {
                    // Back button - flip back to front
                    popupWrapper.classList.remove("is-flipped");
                }
            });
        });
        
        // Handle card click (flip card) - but avoid buttons
        popupWrapper.addEventListener("click", (e) => {
            // Don't flip if clicking on buttons or interactive elements
            if (e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'A' ||
                e.target.closest('button') || 
                e.target.closest('a')) {
                return;
            }
            
            // Flip the card
            popupWrapper.classList.toggle("is-flipped");
        });
        
        // Handle navigate button click
        popupElement.querySelectorAll(".navigate-button").forEach(button => {
            button.addEventListener("click", () => {
                this.handleNavigationClick(properties);
            });
        });
    }

    /**
     * Setup close button
     * @param {Element} popupElement - Popup element
     * @param {Object} popup - Popup instance
     * @param {Element} popupContent - Popup content element
     */
    setupCloseButton(popupElement, popup, popupContent) {
        const closeButton = popupElement.querySelector(".close-button");
        if (closeButton) {
            closeButton.addEventListener("click", () => {
                popupContent.style.transition = "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
                popupContent.style.transform = "rotate(-5deg) translateY(40px) scale(0.6)";
                popupContent.style.opacity = "0";
                
                setTimeout(() => {
                    popup.remove();
                    this.activePopup = null;
                }, 400);
            });
        }
    }

    /**
     * Sluit actieve popup met animatie
     */
    closeActivePopup() {
        if (this.activePopup) {
            const popupContent = this.activePopup.getElement().querySelector(".mapboxgl-popup-content");
            if (popupContent) {
                popupContent.style.transition = "all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)";
                popupContent.style.transform = "rotate(-5deg) translateY(20px) scale(0.8)";
                popupContent.style.opacity = "0";
                
                setTimeout(() => {
                    if (this.activePopup) {
                        this.activePopup.remove();
                        this.activePopup = null;
                    }
                }, 400);
            } else {
                this.activePopup.remove();
                this.activePopup = null;
            }
        }
    }

    /**
     * Handle navigation button click
     * @param {Object} properties - Feature properties
     */
    async handleNavigationClick(properties) {
        try {
            const app = window.HeerlenApp;
            
            if (!app || !app.navigationManager) {
                throw new Error('Navigation manager niet beschikbaar');
            }
            
            // Check if location is available or start tracking
            if (!app.locationManager || !app.locationManager.hasUserLocation()) {
                console.log('🔍 Gebruikerslocatie niet beschikbaar, starten location tracking...');
                
                // Start location tracking
                try {
                    await app.locationManager.handleLocationClick();
                    
                    // Wait a moment for location to be found
                    let attempts = 0;
                    while (!app.locationManager.hasUserLocation() && attempts < 10) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        attempts++;
                    }
                    
                    if (!app.locationManager.hasUserLocation()) {
                        alert('Kan je locatie niet vinden. Controleer of locatie toegang is toegestaan.');
                        return;
                    }
                } catch (locationError) {
                    alert('Locatie toegang is vereist voor navigatie');
                    return;
                }
            }
            
            console.log(`🧭 Starting navigation to ${properties.name}...`);
            
            // Start navigation immediately
            const success = await app.navigationManager.navigateToLocation(properties);
            
            if (success) {
                // Close popup after starting navigation
                this.closeActivePopup();
                console.log(`✅ Navigatie gestart naar ${properties.name}`);
            } else {
                alert('Kon geen route berekenen naar deze locatie');
            }
            
        } catch (error) {
            console.error('❌ Navigation error:', error);
            alert(`Navigatie fout: ${error.message}`);
        }
    }

    /**
     * Open info panel with business details
     * @param {Object} properties - Feature properties
     */
    openInfoPanel(properties) {
        try {
            // Check if mobile - close popup first with animation
            const mobileBreakpoint = this.config?.ui?.responsive?.mobile || 767;
            const isMobile = window.innerWidth <= mobileBreakpoint;
            
            console.log(`📱 Screen width: ${window.innerWidth}px, breakpoint: ${mobileBreakpoint}px, isMobile: ${isMobile}`);
            
            if (isMobile && this.activePopup) {
                console.log('📱 Mobile detected - closing popup before opening info panel');
                this.closeActivePopup();
                
                // Wait for popup close animation to complete before opening info panel
                setTimeout(() => {
                    this.showInfoPanel(properties);
                }, 400); // Match popup close animation duration
                return;
            }
            
            // Desktop: open info panel immediately
            console.log('💻 Desktop detected - opening info panel immediately');
            this.showInfoPanel(properties);
        } catch (error) {
            console.error('❌ Error in openInfoPanel:', error);
            // Fallback: try to open info panel anyway
            this.showInfoPanel(properties);
        }
    }

    /**
     * Show info panel with business details using template
     * @param {Object} properties - Feature properties
     */
    async showInfoPanel(properties) {
        // Remove existing panel if it exists
        const existingPanel = document.getElementById('info-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        try {
            // Generate suggestions
            const suggestions = await this.generateSuggestions(properties);
            const suggestionsHtml = suggestions.map(suggestion => 
                `<a href="#" class="suggestion-card" data-id="${suggestion.id}">
                    <div class="suggestion-icon">${suggestion.icon}</div>
                    <div class="suggestion-info">
                        <div class="suggestion-name">${suggestion.name}</div>
                        <div class="suggestion-address">${suggestion.address}</div>
                    </div>
                </a>`
            ).join('');

            // Prepare template data
            const templateData = {
                name: properties.name,
                description: properties.description || 'Geen beschrijving beschikbaar',
                photo: properties.photo || './assets/images/catcute.png',
                address: properties.address,
                phone: properties.phone,
                website: properties.website,
                opening_hours: properties.opening_hours,
                hasSuggestions: suggestions.length > 0,
                suggestionsHtml: suggestionsHtml
            };

            // Load and render template
            const template = await this.templateLoader.loadTemplate('info-panel.html');
            const renderedHtml = this.templateLoader.renderAdvanced(template, templateData);

            // Create and insert panel
            const infoPanel = document.createElement('div');
            infoPanel.id = 'info-panel';
            infoPanel.className = 'info-panel'; // Start without 'open' class for animation
            infoPanel.innerHTML = renderedHtml;

            // Set theme color
            const color = properties.color || this.config.theme.primary;
            infoPanel.style.background = color;

            // Add to DOM
            document.body.appendChild(infoPanel);

            // Setup event listeners
            this.setupInfoPanelListeners(infoPanel, properties);

            // Show panel with animation delay
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    infoPanel.classList.add('open');
                });
            });

            console.log(`📋 Info panel geopend voor ${properties.name}`);
        } catch (error) {
            console.error('Error showing info panel:', error);
        }
    }

    /**
     * Setup event listeners for info panel
     * @param {Element} infoPanel - Info panel element
     * @param {Object} properties - Feature properties
     */
    setupInfoPanelListeners(infoPanel, properties) {
        // Setup close button
        const closeButton = infoPanel.querySelector('.info-panel-close');
        if (closeButton) {
            const closeHandler = () => {
                this.closeInfoPanel();
                closeButton.removeEventListener('click', closeHandler);
            };
            closeButton.addEventListener('click', closeHandler);
        }

        // Setup suggestion clicks
        const suggestionCards = infoPanel.querySelectorAll('.suggestion-card');
        suggestionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const suggestionId = parseInt(card.dataset.id);
                this.handleSuggestionClick(suggestionId);
            });
        });

        // Setup scroll expansion on mobile
        this.setupScrollExpansion(infoPanel);
        
        // Setup drag to close on mobile
        this.setupDragToClose(infoPanel);
    }

    /**
     * Generate suggestions for current location
     * @param {Object} currentProperties - Current feature properties
     * @returns {Promise<Array>} Array of suggestion objects
     */
    async generateSuggestions(currentProperties) {
        try {
            const allData = await this.dataLoader.loadAllData();
            const suggestions = [];
            
            // Find suggestions from same category first
            Object.values(allData).forEach(categoryData => {
                if (categoryData.features) {
                    categoryData.features.forEach(feature => {
                        const props = feature.properties;
                        if (props.id !== currentProperties.id && 
                            props.category === currentProperties.category && 
                            suggestions.length < 3) {
                            suggestions.push({
                                id: props.id,
                                name: props.name,
                                address: props.address,
                                icon: props.icon || '📍',
                                category: props.category
                            });
                        }
                    });
                }
            });
            
            // Fill remaining slots with other categories if needed
            if (suggestions.length < 3) {
                Object.values(allData).forEach(categoryData => {
                    if (categoryData.features) {
                        categoryData.features.forEach(feature => {
                            const props = feature.properties;
                            if (props.id !== currentProperties.id && 
                                props.category !== currentProperties.category &&
                                suggestions.length < 3 &&
                                !suggestions.find(s => s.id === props.id)) {
                                suggestions.push({
                                    id: props.id,
                                    name: props.name,
                                    address: props.address,
                                    icon: props.icon || '📍',
                                    category: props.category
                                });
                            }
                        });
                    }
                });
            }
            
            return suggestions;
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return [];
        }
    }

    /**
     * Setup scroll expansion for mobile info panel
     * @param {Element} infoPanel - Info panel element
     */
    setupScrollExpansion(infoPanel) {
        // Clean up any existing scroll handler first
        this.cleanupScrollExpansion(infoPanel);
        
        // Only on mobile devices
        if (window.innerWidth >= 768) {
            // Remove expanded class on desktop
            infoPanel.classList.remove('expanded');
            return;
        }
        
        const content = infoPanel.querySelector('.info-panel-content');
        let isExpanded = false;
        
        const handleScroll = () => {
            // Double check we're still on mobile
            if (window.innerWidth >= 768) return;
            
            // If already expanded, do nothing
            if (isExpanded) return;
            
            // Simple trigger - any scroll expands it
            if (content.scrollTop > 5) {
                infoPanel.classList.add('expanded');
                isExpanded = true;
                // Remove scroll listener after expanding
                content.removeEventListener('scroll', handleScroll);
            }
        };
        
        // Add scroll event listener with passive option for better performance
        content.addEventListener('scroll', handleScroll, { passive: true });
        
        // Store reference to remove listener later
        infoPanel._scrollHandler = handleScroll;
        infoPanel._scrollElement = content;
        infoPanel._isExpanded = isExpanded;
        
        // Add resize listener to handle viewport changes
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                // Desktop - remove expanded class and cleanup
                infoPanel.classList.remove('expanded');
                this.cleanupScrollExpansion(infoPanel);
            } else {
                // Mobile - ensure scroll handler is active
                if (!infoPanel._scrollHandler) {
                    this.setupScrollExpansion(infoPanel);
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        infoPanel._resizeHandler = handleResize;
    }

    /**
     * Setup drag to close functionality for mobile
     * @param {Element} infoPanel - Info panel element
     */
    setupDragToClose(infoPanel) {
        // Only on mobile devices
        if (window.innerWidth >= 768) return;
        
        const header = infoPanel.querySelector('.info-panel-header');
        const content = infoPanel.querySelector('.info-panel-content');
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let closeThreshold = 100; // Minimum drag distance to close
        let expandThreshold = 50; // Minimum drag distance to expand
        let rafId = null;
        
        const handleTouchStart = (e) => {
            // Only allow dragging from header
            const isHeader = e.target.closest('.info-panel-header');
            if (!isHeader) return;
            
            startY = e.touches[0].clientY;
            isDragging = true;
            
            // Add dragging styles
            infoPanel.style.transition = 'none';
            infoPanel.classList.add('dragging');
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            
            // Cancel previous animation frame
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            
            // Use requestAnimationFrame for smooth updates
            rafId = requestAnimationFrame(() => {
                const deltaY = currentY - startY;
                const isExpanded = infoPanel.classList.contains('expanded');
                
                // Calculate new height based on drag
                let currentHeight;
                if (isExpanded) {
                    // Starting from 100vh - subtract deltaY for natural movement
                    currentHeight = window.innerHeight - deltaY;
                } else {
                    // Starting from 40vh - subtract deltaY for natural movement
                    currentHeight = window.innerHeight * 0.4 - deltaY;
                }
                
                // Allow dragging below minimum for close gesture
                const minHeight = deltaY > 0 ? 0 : window.innerHeight * 0.4;
                const maxHeight = window.innerHeight;
                currentHeight = Math.max(minHeight, Math.min(maxHeight, currentHeight));
                
                // Apply height directly for smooth content reflow
                infoPanel.style.height = `${currentHeight}px`;
                
                // Add opacity effect when dragging down close to closing
                if (currentHeight < window.innerHeight * 0.3) {
                    const opacity = currentHeight / (window.innerHeight * 0.3);
                    infoPanel.style.opacity = Math.max(0.5, opacity);
                } else {
                    infoPanel.style.opacity = '';
                }
            });
            
            // Prevent scrolling while dragging
            e.preventDefault();
        };
        
        const handleTouchEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            const deltaY = currentY - startY;
            const isExpanded = infoPanel.classList.contains('expanded');
            
            // Remove dragging styles
            infoPanel.classList.remove('dragging');
            infoPanel.style.transition = '';
            infoPanel.style.height = ''; // Reset inline height
            infoPanel.style.opacity = ''; // Reset opacity
            
            // Get final panel height
            const panelRect = infoPanel.getBoundingClientRect();
            const finalHeight = panelRect.height;
            const viewportHeight = window.innerHeight;
            
            // Determine state based on final position
            if (finalHeight < viewportHeight * 0.2) {
                // Dragged very low - close it
                this.closeInfoPanel();
            } else if (finalHeight < viewportHeight * 0.6) {
                // Between 20% and 60% - snap to middle state
                infoPanel.classList.remove('expanded');
                // Re-enable scroll expansion
                this.setupScrollExpansion(infoPanel);
            } else {
                // Above 60% - snap to expanded
                infoPanel.classList.add('expanded');
                // Remove scroll listener since it's already expanded
                if (infoPanel._scrollHandler && infoPanel._scrollElement) {
                    infoPanel._scrollElement.removeEventListener('scroll', infoPanel._scrollHandler);
                }
            }
            
            // Reset values
            startY = 0;
            currentY = 0;
            
            // Cancel any pending animation frame
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };
        
        // Add touch event listeners - only on header
        header.addEventListener('touchstart', handleTouchStart, { passive: true });
        header.addEventListener('touchmove', handleTouchMove, { passive: false });
        header.addEventListener('touchend', handleTouchEnd);
        
        // Store references for cleanup
        infoPanel._dragHandlers = {
            start: handleTouchStart,
            move: handleTouchMove,
            end: handleTouchEnd,
            header: header
        };
    }

    /**
     * Clean up drag handlers
     * @param {Element} infoPanel - Info panel element
     */
    cleanupDragHandlers(infoPanel) {
        if (infoPanel._dragHandlers) {
            const { start, move, end, header } = infoPanel._dragHandlers;
            
            header.removeEventListener('touchstart', start);
            header.removeEventListener('touchmove', move);
            header.removeEventListener('touchend', end);
            
            delete infoPanel._dragHandlers;
        }
    }

    /**
     * Clean up scroll expansion listeners
     * @param {Element} infoPanel - Info panel element
     */
    cleanupScrollExpansion(infoPanel) {
        // Remove scroll event listener if it exists
        if (infoPanel._scrollHandler && infoPanel._scrollElement) {
            infoPanel._scrollElement.removeEventListener('scroll', infoPanel._scrollHandler);
            delete infoPanel._scrollHandler;
            delete infoPanel._scrollElement;
            delete infoPanel._isExpanded;
        }
        
        // Remove resize listener if it exists
        if (infoPanel._resizeHandler) {
            window.removeEventListener('resize', infoPanel._resizeHandler);
            delete infoPanel._resizeHandler;
        }
    }

    /**
     * Close info panel
     */
    closeInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        if (!infoPanel) return;
        
        // Clean up all listeners
        this.cleanupScrollExpansion(infoPanel);
        this.cleanupDragHandlers(infoPanel);
        
        // Animate close then remove
        infoPanel.classList.remove('open', 'expanded');
        
        // Remove panel after animation completes
        setTimeout(() => {
            if (infoPanel.parentNode) {
                infoPanel.remove();
            }
        }, 300); // Match CSS transition duration
        
        console.log('📋 Info panel gesloten');
    }

    /**
     * Populate suggestions section with similar businesses
     * @param {Element} suggestionsContainer - Suggestions container element
     * @param {Object} currentProperties - Current business properties
     */
    populateSuggestions(suggestionsContainer, currentProperties) {
        // Clear existing suggestions
        suggestionsContainer.innerHTML = '';
        
        // Get all businesses from the same category
        const app = window.HeerlenApp;
        if (!app || !app.dataLoader || !app.dataLoader.allData) return;
        
        const allBusinesses = app.dataLoader.allData.features;
        const sameCategoryBusinesses = allBusinesses.filter(feature => 
            feature.properties.category === currentProperties.category &&
            feature.properties.id !== currentProperties.id
        );
        
        // Shuffle and take up to 3 suggestions
        const shuffled = sameCategoryBusinesses.sort(() => 0.5 - Math.random());
        const suggestions = shuffled.slice(0, 3);
        
        // Create suggestion cards
        suggestions.forEach(feature => {
            const props = feature.properties;
            // Add coordinates from geometry
            props.lng = feature.geometry.coordinates[0];
            props.lat = feature.geometry.coordinates[1];
            
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `
                <div class="suggestion-icon">${props.icon}</div>
                <div class="suggestion-info">
                    <div class="suggestion-name">${props.name}</div>
                    <div class="suggestion-address">${props.address || 'Geen adres'}</div>
                </div>
            `;
            
            // Add click handler
            card.addEventListener('click', () => {
                this.handleSuggestionClick(props);
            });
            
            suggestionsContainer.appendChild(card);
        });
        
        // Show message if no suggestions
        if (suggestions.length === 0) {
            suggestionsContainer.innerHTML = '<p style="opacity: 0.8; font-size: 0.9em;">Geen andere locaties in deze categorie gevonden.</p>';
        }
    }

    /**
     * Handle click on suggestion card
     * @param {Object} properties - Business properties
     */
    handleSuggestionClick(properties) {
        // Close info panel
        this.closeInfoPanel();
        
        // Fly to the suggested location
        this.map.flyTo({
            center: [properties.lng, properties.lat],
            zoom: 17,
            duration: 1000
        });
        
        // Wait for fly animation to complete, then open popup
        setTimeout(() => {
            // Create click event at the marker location
            const point = this.map.project([properties.lng, properties.lat]);
            const features = this.map.queryRenderedFeatures(point, {
                layers: ['business-markers']
            });
            
            // Find the matching feature and trigger click
            const matchingFeature = features.find(f => f.properties.id === properties.id);
            if (matchingFeature) {
                this.handleMarkerClick({
                    features: [matchingFeature],
                    lngLat: { lng: properties.lng, lat: properties.lat }
                });
            }
        }, 1100);
    }

    /**
     * Darken a color by a percentage
     * @param {string} color - Hex color
     * @param {number} percent - Percentage to darken
     * @returns {string} Darkened color
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                     (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                     (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Cleanup popup manager
     */
    destroy() {
        this.closeActivePopup();
        this.closeInfoPanel();
        this.isInitialized = false;
        console.log('🗑️ Popup manager vernietigd');
    }
}

// Export voor gebruik in andere modules
window.PopupManager = PopupManager;