// ==============================
// POPUP MANAGER MODULE - v1.1
// ==============================

class PopupManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.activePopup = null;
        this.isInitialized = false;
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
            if (infoPanel.classList.contains('open') && 
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
        this.createPopup(coordinates, properties);
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
    createPopup(coordinates, properties) {
        const popup = new mapboxgl.Popup({
            offset: this.config.popup.offset,
            className: "custom-popup",
            closeButton: false,
            maxWidth: this.config.popup.maxWidth,
            closeOnClick: false,
            anchor: "bottom"
        });

        // Generate popup content
        const { styles, html } = this.createPopupContent(properties);
        
        popup.setLngLat(coordinates)
             .setHTML(`${styles}${html}`)
             .addTo(this.map);
        
        this.activePopup = popup;
        
        // Setup popup interactions
        this.setupPopupInteractions(popup, properties);
    }

    /**
     * Creëert popup content HTML en CSS
     * @param {Object} properties - Feature properties
     * @returns {Object} {styles, html}
     */
    createPopupContent(properties) {
        const styles = this.generatePopupStyles(properties);
        const html = this.generatePopupHTML(properties);
        
        return { styles, html };
    }

    /**
     * Genereert popup CSS styles
     * @param {Object} properties - Feature properties
     * @returns {string} CSS styles
     */
    generatePopupStyles(properties) {
        const color = properties.color || this.config.theme.primary;
        
        return `
            <style>
                .popup-side {
                    background-color: ${color};
                    clip-path: polygon(calc(100% - 0px) 26.5px, calc(100% - 0px) calc(100% - 26.5px), calc(100% - 0px) calc(100% - 26.5px), calc(100% - 0.34671999999995px) calc(100% - 22.20048px), calc(100% - 1.3505599999999px) calc(100% - 18.12224px), calc(100% - 2.95704px) calc(100% - 14.31976px), calc(100% - 5.11168px) calc(100% - 10.84752px), calc(100% - 7.76px) calc(100% - 7.76px), calc(100% - 10.84752px) calc(100% - 5.11168px), calc(100% - 14.31976px) calc(100% - 2.9570399999999px), calc(100% - 18.12224px) calc(100% - 1.35056px), calc(100% - 22.20048px) calc(100% - 0.34672px), calc(100% - 26.5px) calc(100% - 0px), calc(50% - -32.6px) calc(100% - 0px), calc(50% - -32.6px) calc(100% - 0px), calc(50% - -31.57121px) calc(100% - 0.057139999999947px), calc(50% - -30.56648px) calc(100% - 0.2255199999999px), calc(50% - -29.59427px) calc(100% - 0.50057999999996px), calc(50% - -28.66304px) calc(100% - 0.87775999999991px), calc(50% - -27.78125px) calc(100% - 1.3525px), calc(50% - -26.95736px) calc(100% - 1.92024px), calc(50% - -26.19983px) calc(100% - 2.57642px), calc(50% - -25.51712px) calc(100% - 3.31648px), calc(50% - -24.91769px) calc(100% - 4.13586px), calc(50% - -24.41px) calc(100% - 5.03px), calc(50% - -24.41px) calc(100% - 5.03px), calc(50% - -22.95654px) calc(100% - 7.6045699999999px), calc(50% - -21.23752px) calc(100% - 9.9929599999998px), calc(50% - -19.27298px) calc(100% - 12.17519px), calc(50% - -17.08296px) calc(100% - 14.13128px), calc(50% - -14.6875px) calc(100% - 15.84125px), calc(50% - -12.10664px) calc(100% - 17.28512px), calc(50% - -9.36042px) calc(100% - 18.44291px), calc(50% - -6.46888px) calc(100% - 19.29464px), calc(50% - -3.45206px) calc(100% - 19.82033px), calc(50% - -0.32999999999998px) calc(100% - 20px), calc(50% - -0.32999999999998px) calc(100% - 20px), calc(50% - 2.79179px) calc(100% - 19.82033px), calc(50% - 5.8079199999999px) calc(100% - 19.29464px), calc(50% - 8.69853px) calc(100% - 18.44291px), calc(50% - 11.44376px) calc(100% - 17.28512px), calc(50% - 14.02375px) calc(100% - 15.84125px), calc(50% - 16.41864px) calc(100% - 14.13128px), calc(50% - 18.60857px) calc(100% - 12.17519px), calc(50% - 20.57368px) calc(100% - 9.9929599999999px), calc(50% - 22.29411px) calc(100% - 7.60457px), calc(50% - 23.75px) calc(100% - 5.03px), calc(50% - 23.75px) calc(100% - 5.03px), calc(50% - 24.25769px) calc(100% - 4.1358599999999px), calc(50% - 24.85712px) calc(100% - 3.3164799999998px), calc(50% - 25.53983px) calc(100% - 2.57642px), calc(50% - 26.29736px) calc(100% - 1.92024px), calc(50% - 27.12125px) calc(100% - 1.3525px), calc(50% - 28.00304px) calc(100% - 0.87775999999997px), calc(50% - 28.93427px) calc(100% - 0.50057999999996px), calc(50% - 29.90648px) calc(100% - 0.22552000000002px), calc(50% - 30.91121px) calc(100% - 0.057140000000004px), calc(50% - 31.94px) calc(100% - 0px), 26.5px calc(100% - 0px), 26.5px calc(100% - 0px), 22.20048px calc(100% - 0.34671999999989px), 18.12224px calc(100% - 1.3505599999999px), 14.31976px calc(100% - 2.95704px), 10.84752px calc(100% - 5.1116799999999px), 7.76px calc(100% - 7.76px), 5.11168px calc(100% - 10.84752px), 2.95704px calc(100% - 14.31976px), 1.35056px calc(100% - 18.12224px), 0.34672px calc(100% - 22.20048px), 4.3855735949631E-31px calc(100% - 26.5px), 0px 26.5px, 0px 26.5px, 0.34672px 22.20048px, 1.35056px 18.12224px, 2.95704px 14.31976px, 5.11168px 10.84752px, 7.76px 7.76px, 10.84752px 5.11168px, 14.31976px 2.95704px, 18.12224px 1.35056px, 22.20048px 0.34672px, 26.5px 4.3855735949631E-31px, calc(50% - 26.74px) 0px, calc(50% - 26.74px) 0px, calc(50% - 25.31263px) 0.07137px, calc(50% - 23.91544px) 0.28176px, calc(50% - 22.55581px) 0.62559px, calc(50% - 21.24112px) 1.09728px, calc(50% - 19.97875px) 1.69125px, calc(50% - 18.77608px) 2.40192px, calc(50% - 17.64049px) 3.22371px, calc(50% - 16.57936px) 4.15104px, calc(50% - 15.60007px) 5.17833px, calc(50% - 14.71px) 6.3px, calc(50% - 14.71px) 6.3px, calc(50% - 13.6371px) 7.64798px, calc(50% - 12.446px) 8.89024px, calc(50% - 11.1451px) 10.01826px, calc(50% - 9.7428px) 11.02352px, calc(50% - 8.2475px) 11.8975px, calc(50% - 6.6676px) 12.63168px, calc(50% - 5.0115px) 13.21754px, calc(50% - 3.2876px) 13.64656px, calc(50% - 1.5043px) 13.91022px, calc(50% - -0.32999999999996px) 14px, calc(50% - -0.32999999999998px) 14px, calc(50% - -2.16431px) 13.9105px, calc(50% - -3.94768px) 13.6476px, calc(50% - -5.67177px) 13.2197px, calc(50% - -7.32824px) 12.6352px, calc(50% - -8.90875px) 11.9025px, calc(50% - -10.40496px) 11.03px, calc(50% - -11.80853px) 10.0261px, calc(50% - -13.11112px) 8.8992px, calc(50% - -14.30439px) 7.6577px, calc(50% - -15.38px) 6.31px, calc(50% - -15.38px) 6.31px, calc(50% - -16.27279px) 5.18562px, calc(50% - -17.25432px) 4.15616px, calc(50% - -18.31733px) 3.22714px, calc(50% - -19.45456px) 2.40408px, calc(50% - -20.65875px) 1.6925px, calc(50% - -21.92264px) 1.09792px, calc(50% - -23.23897px) 0.62586px, calc(50% - -24.60048px) 0.28184px, calc(50% - -25.99991px) 0.07138px, calc(50% - -27.43px) 8.9116630386686E-32px, calc(100% - 26.5px) 0px, calc(100% - 26.5px) 0px, calc(100% - 22.20048px) 0.34672px, calc(100% - 18.12224px) 1.35056px, calc(100% - 14.31976px) 2.95704px, calc(100% - 10.84752px) 5.11168px, calc(100% - 7.76px) 7.76px, calc(100% - 5.11168px) 10.84752px, calc(100% - 2.9570399999999px) 14.31976px, calc(100% - 1.35056px) 18.12224px, calc(100% - 0.34671999999995px) 22.20048px, calc(100% - 5.6843418860808E-14px) 26.5px);
                }
                
                .fade-bottom {
                    background: linear-gradient(to top, ${color} 0%, ${color}00 100%);
                }
                
                .fade-top {
                    background: linear-gradient(to bottom, ${color} 0%, ${color}00 100%);
                }
                
                .close-button {
                    background: ${color};
                }
            </style>
        `;
    }

    /**
     * Genereert popup HTML
     * @param {Object} properties - Feature properties
     * @returns {string} HTML content
     */
    generatePopupHTML(properties) {
        return `
            <div class="popup-wrapper">
                <button class="close-button" aria-label="Close popup"></button>
                <div class="popup-side popup-front">
                    <div class="popup-background-photo" style="background-image: url('./pictures/catcute.png')"></div>
                    ${this.generateGradientSVG(properties)}
                    <div class="content-wrapper">
                        <div class="popup-title">${properties.name}</div>
                        <div class="fade-top"></div> 
                        <div class="popup-description">${properties.description}</div>
                        <div class="fade-bottom"></div>
                        <div class="popup-actions">
                            <button class="navigate-button button-base">Navigeer</button>
                            <button class="more-info-button button-base">Meer info</button>
                        </div>
                    </div>
                </div>
                
                <div class="popup-side popup-back">
                    <div class="popup-background-photo" style="background-image: url('./pictures/catcute.png')"></div>
                    <div class="content-wrapper">
                        <div class="popup-title details">${properties.name}</div>
                        <button class="more-info-button button-base">Terug</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genereert gradient SVG
     * @param {Object} properties - Feature properties
     * @returns {string} SVG HTML
     */
    generateGradientSVG(properties) {
        const color = properties.color || this.config.theme.primary;
        
        return `
            <svg class="popup-border-overlay" viewBox="0 0 365 252" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <rect width="100%" height="100%" fill="url(#paint0_linear_3248_5)"/>
                <defs>
                    <linearGradient id="paint0_linear_3248_5" x1="50%" y1="0" x2="50%" y2="100%" gradientUnits="objectBoundingBox">
                        <stop offset="0" stop-color="${color}" stop-opacity="0" />
                        <stop offset="0.3" stop-color="${color}" stop-opacity="1" />
                    </linearGradient>
                </defs>
            </svg>
        `;
    }

    /**
     * Genereert social media icons
     * @param {Object} properties - Feature properties
     * @returns {string} Social icons HTML
     */
    generateSocialIcons(properties) {
        let icons = '';
        
        if (properties.website) {
            icons += `
                <a href="${properties.website}" target="_blank" aria-label="Website" title="Website">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                </a>
            `;
        }
        
        if (properties.phone) {
            icons += `
                <a href="tel:${properties.phone}" aria-label="Bellen" title="Bellen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                </a>
            `;
        }
        
        return icons ? `<div class="social-icons">${icons}</div>` : '';
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
        const infoPanel = document.getElementById('info-panel');
        const title = infoPanel.querySelector('.info-panel-title');
        const description = infoPanel.querySelector('.info-panel-description');
        const contact = infoPanel.querySelector('.info-panel-contact');
        const hours = infoPanel.querySelector('.info-panel-hours');
        
        // Set content
        title.textContent = properties.name;
        description.textContent = properties.description || 'Geen beschrijving beschikbaar';
        hours.textContent = properties.opening_hours || 'Openingstijden onbekend';
        
        // Set contact info
        contact.innerHTML = '';
        if (properties.phone) {
            contact.innerHTML += `<a href="tel:${properties.phone}">📞 ${properties.phone}</a>`;
        }
        if (properties.website) {
            contact.innerHTML += `<a href="${properties.website}" target="_blank">🌐 Website</a>`;
        }
        if (properties.address) {
            contact.innerHTML += `<a href="https://maps.google.com/?q=${encodeURIComponent(properties.address)}" target="_blank">📍 ${properties.address}</a>`;
        }
        
        // Set theme color
        const color = properties.color || this.config.theme.primary;
        infoPanel.style.background = `linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%)`;
        
        // Setup close button
        const closeButton = infoPanel.querySelector('.info-panel-close');
        const closeHandler = () => {
            this.closeInfoPanel();
            closeButton.removeEventListener('click', closeHandler);
        };
        closeButton.addEventListener('click', closeHandler);
        
        // Show panel
        infoPanel.classList.add('open');
        
        // Setup scroll expansion on mobile
        this.setupScrollExpansion(infoPanel);
        
        console.log(`📋 Info panel geopend voor ${properties.name}`);
    }

    /**
     * Setup scroll expansion for mobile info panel
     * @param {Element} infoPanel - Info panel element
     */
    setupScrollExpansion(infoPanel) {
        // Only on mobile devices
        if (window.innerWidth >= 768) return;
        
        const content = infoPanel.querySelector('.info-panel-content');
        let scrollThreshold = 50; // Scroll threshold in pixels
        
        const handleScroll = () => {
            if (content.scrollTop > scrollThreshold) {
                infoPanel.classList.add('expanded');
            } else {
                infoPanel.classList.remove('expanded');
            }
        };
        
        // Add scroll event listener
        content.addEventListener('scroll', handleScroll);
        
        // Store reference to remove listener later
        infoPanel._scrollHandler = handleScroll;
        infoPanel._scrollElement = content;
    }

    /**
     * Close info panel
     */
    closeInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        
        // Remove scroll event listener if it exists
        if (infoPanel._scrollHandler && infoPanel._scrollElement) {
            infoPanel._scrollElement.removeEventListener('scroll', infoPanel._scrollHandler);
            delete infoPanel._scrollHandler;
            delete infoPanel._scrollElement;
        }
        
        infoPanel.classList.remove('open', 'expanded');
        console.log('📋 Info panel gesloten');
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