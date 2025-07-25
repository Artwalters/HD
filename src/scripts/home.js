// ==========================================
// HEERLEN DOEN - HOME PAGE JAVASCRIPT
// ==========================================

// ==========================================
// MOBILE NAVIGATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a nav link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Close menu for all link clicks
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                
                // Let the link work normally - no preventDefault needed for .html links
                console.log('Navigation clicked:', link.getAttribute('href'));
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
});

// ==========================================
// GRID ANIMATION
// ==========================================

// Grid Animation Configuration
const PHASE_DURATION = 4.2;
const FIRST_PHASE_PERCENT = 0.20;
const FIRST_PHASE_DURATION = 0.4;
const PAUSE_BETWEEN_PHASES = 1.8;
const SECOND_PHASE_DURATION = 0.4;
const FULL_GRID_DURATION = 0.3;
const DISAPPEAR_DURATION = 0.5;

// Global Variables
let masterTimeline;
let footerTimeline;
let currentPhase = 0;
let overlayCells = [];
let footerOverlayCells = [];
let imageGridContainers = [];
let footerImageGridContainers = [];
let isAnimating = false;

// Animation Colors
const colors = ['#6E90DB', '#D49C0C', '#EB625E', '#A2C617'];

// Hero Text Data - mapped to colors array
const heroTexts = [
    ['VERRAST', 'WORDEN?'],    // Index 0: blauw (#6E90DB)
    ['BOEIENDE', 'CULTUUR?'],  // Index 1: oranje (#D49C0C)
    ['TERRASJE', 'PIKKEN?'],   // Index 2: rood (#EB625E)
    ['GEZELLIG', 'WINKELEN?']  // Index 3: groen (#A2C617)
];

// Footer Text Data - same as hero texts
const footerTexts = [
    ['VERRAST', 'WORDEN?'],    // Index 0: blauw (#6E90DB)
    ['BOEIENDE', 'CULTUUR?'],  // Index 1: oranje (#D49C0C)
    ['TERRASJE', 'PIKKEN?'],   // Index 2: rood (#EB625E)
    ['GEZELLIG', 'WINKELEN?']  // Index 3: groen (#A2C617)
];

// ==========================================
// HERO TEXT ANIMATION
// ==========================================

let heroSplit0, heroSplit1;
let footerSplit0, footerSplit1;

function setupHeroSplitText() {
    const heroText0 = document.getElementById('hero-text-0');
    const heroText1 = document.getElementById('hero-text-1');
    
    if (heroText0 && heroText1 && typeof gsap !== 'undefined') {
        // Split text into characters and wrap in spans
        const text0 = heroText0.textContent;
        const text1 = heroText1.textContent;
        
        heroText0.innerHTML = text0.split('').map(char => 
            `<span style="display: inline-block; white-space: nowrap;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        heroText1.innerHTML = text1.split('').map(char => 
            `<span style="display: inline-block; white-space: nowrap;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        // Get the actual span elements
        heroSplit0 = { chars: heroText0.querySelectorAll('span') };
        heroSplit1 = { chars: heroText1.querySelectorAll('span') };
    } else {
        console.error('setupHeroSplitText failed:', { heroText0, heroText1, gsap: typeof gsap });
    }
}

function animateHeroTextIn(phaseIndex, color, timeline, position) {
    const heroText0 = document.getElementById('hero-text-0');
    const heroText1 = document.getElementById('hero-text-1');
    
    if (heroText0 && heroText1) {
        const [text0, text1] = heroTexts[phaseIndex];
        
        // Change text content and rebuild split at start of phase
        timeline.call(() => {
            heroText0.textContent = text0;
            heroText1.textContent = text1;
            heroText0.style.color = color;
            heroText1.style.color = color;
            
            // Rebuild split text
            setupHeroSplitText();
            
            // Set initial position for new characters (coming from bottom)
            if (heroSplit0 && heroSplit0.chars && heroSplit1 && heroSplit1.chars) {
                gsap.set([...heroSplit0.chars, ...heroSplit1.chars], {
                    y: 100,
                    opacity: 0
                });
                
                // Animate in immediately after setting position
                gsap.to([...heroSplit0.chars, ...heroSplit1.chars], {
                    duration: 0.4,
                    y: 0,
                    opacity: 1,
                    ease: "power3.out",
                    stagger: 0.02
                });
            } else {
                console.error('Hero split characters not found!', { heroSplit0, heroSplit1 });
            }
        }, null, position);
    }
}

function animateHeroTextOut(timeline, position) {
    // Animate out current characters to top
    timeline.call(() => {
        if (heroSplit0 && heroSplit0.chars && heroSplit1 && heroSplit1.chars) {
            gsap.to([...heroSplit0.chars, ...heroSplit1.chars], {
                duration: 0.3,
                y: -50,
                opacity: 0,
                ease: "power2.in",
                stagger: 0.01
            });
        } else {
            console.error('Hero split characters not found for OUT animation!', { heroSplit0, heroSplit1 });
        }
    }, null, position);
}

// ==========================================
// FOOTER TEXT ANIMATION
// ==========================================

function setupFooterSplitText() {
    const footerText0 = document.getElementById('footer-text-0');
    const footerText1 = document.getElementById('footer-text-1');
    
    if (footerText0 && footerText1 && typeof gsap !== 'undefined') {
        // Split text into characters and wrap in spans
        const text0 = footerText0.textContent;
        const text1 = footerText1.textContent;
        
        footerText0.innerHTML = text0.split('').map(char => 
            `<span style="display: inline-block; white-space: nowrap;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        footerText1.innerHTML = text1.split('').map(char => 
            `<span style="display: inline-block; white-space: nowrap;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        // Get the actual span elements
        footerSplit0 = { chars: footerText0.querySelectorAll('span') };
        footerSplit1 = { chars: footerText1.querySelectorAll('span') };
    } else {
        console.error('setupFooterSplitText failed:', { footerText0, footerText1, gsap: typeof gsap });
    }
}

function animateFooterTextIn(phaseIndex, color, timeline, position) {
    const footerText0 = document.getElementById('footer-text-0');
    const footerText1 = document.getElementById('footer-text-1');
    
    if (footerText0 && footerText1) {
        const [text0, text1] = footerTexts[phaseIndex];
        
        // Change text content and rebuild split at start of phase
        timeline.call(() => {
            footerText0.textContent = text0;
            footerText1.textContent = text1;
            footerText0.style.color = color;
            footerText1.style.color = color;
            
            // Rebuild split text
            setupFooterSplitText();
            
            // Set initial position for new characters (coming from bottom)
            if (footerSplit0 && footerSplit0.chars && footerSplit1 && footerSplit1.chars) {
                gsap.set([...footerSplit0.chars, ...footerSplit1.chars], {
                    y: 100,
                    opacity: 0
                });
                
                // Animate in immediately after setting position
                gsap.to([...footerSplit0.chars, ...footerSplit1.chars], {
                    duration: 0.4,
                    y: 0,
                    opacity: 1,
                    ease: "power3.out",
                    stagger: 0.02
                });
            } else {
                console.error('Footer split characters not found!', { footerSplit0, footerSplit1 });
            }
        }, null, position);
    }
}

function animateFooterTextOut(timeline, position) {
    // Animate out current characters to top
    timeline.call(() => {
        if (footerSplit0 && footerSplit0.chars && footerSplit1 && footerSplit1.chars) {
            gsap.to([...footerSplit0.chars, ...footerSplit1.chars], {
                duration: 0.3,
                y: -50,
                opacity: 0,
                ease: "power2.in",
                stagger: 0.01
            });
        } else {
            console.error('Footer split characters not found for OUT animation!', { footerSplit0, footerSplit1 });
        }
    }, null, position);
}

function createFooterTextTimeline() {
    const footerTextTimeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 0,
        delay: 1
    });

    let position = 0;
    const phaseDuration = 4.2; // Same as hero animation

    for (let i = 0; i < 4; i++) {
        const color = colors[i];
        const textPhaseStartTime = position + 0.2;
        
        // Add text IN animation at beginning of phase
        animateFooterTextIn(i, color, footerTextTimeline, textPhaseStartTime);
        
        // Add text OUT animation at end of phase
        animateFooterTextOut(footerTextTimeline, textPhaseStartTime + phaseDuration - 0.4);
        
        position += phaseDuration;
    }

    return footerTextTimeline;
}

function animateFooterText() {
    // Initialize footer text to first phase (index 0 - blauw)  
    const footerText0 = document.getElementById('footer-text-0');
    const footerText1 = document.getElementById('footer-text-1');
    if (footerText0 && footerText1) {
        footerText0.textContent = footerTexts[0][0]; // "VERRAST"
        footerText1.textContent = footerTexts[0][1]; // "WORDEN?"
        footerText0.style.color = colors[0]; // Blue
        footerText1.style.color = colors[0]; // Blue
        
        // Setup split text for initial state
        setupFooterSplitText();
    }
    
    // Start the cycling animation
    createFooterTextTimeline();
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function sortCellsFromOutsideToInside(cells, gridWidth, gridHeight) {
    const cellsWithRing = cells.map((cell, index) => {
        const x = index % gridWidth;
        const y = Math.floor(index / gridWidth);
        
        const distanceFromLeft = x;
        const distanceFromRight = gridWidth - 1 - x;
        const distanceFromTop = y;
        const distanceFromBottom = gridHeight - 1 - y;
        
        const ring = Math.min(distanceFromLeft, distanceFromRight, distanceFromTop, distanceFromBottom);
        
        return { cell, ring, index };
    });
    
    const rings = {};
    cellsWithRing.forEach(item => {
        if (!rings[item.ring]) {
            rings[item.ring] = [];
        }
        rings[item.ring].push(item.cell);
    });
    
    const sortedRings = Object.keys(rings).map(Number).sort((a, b) => a - b);
    const result = [];
    
    sortedRings.forEach(ring => {
        const shuffledRing = shuffle([...rings[ring]]);
        result.push(...shuffledRing);
    });
    
    return result;
}

// ==========================================
// GRID INITIALIZATION
// ==========================================

function initializeImageGrids() {
    imageGridContainers = [
        document.getElementById('image-grid-1'),
        document.getElementById('image-grid-2'),
        document.getElementById('image-grid-3'),
        document.getElementById('image-grid-4')
    ];

    imageGridContainers.forEach((container, containerIndex) => {
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let y = 0; y < 6; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = document.createElement('div');
                cell.classList.add('image-cell');
                
                const xPos = (x / 8) * 100;
                const yPos = (y / 5) * 100;
                cell.style.backgroundPosition = `${xPos}% ${yPos}%`;
                
                container.appendChild(cell);
            }
        }
    });
}

function initializeOverlayGrid() {
    const overlayContainer = document.getElementById('overlay-grid');
    if (!overlayContainer) return;
    
    overlayContainer.innerHTML = '';
    overlayCells = [];

    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = document.createElement('div');
            cell.classList.add('overlay-cell');
            overlayContainer.appendChild(cell);
            overlayCells.push(cell);
        }
    }
}

function initializeFooterGrids() {
    footerImageGridContainers = [
        document.getElementById('footer-image-grid-1'),
        document.getElementById('footer-image-grid-2')
    ];

    footerImageGridContainers.forEach((container, containerIndex) => {
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = document.createElement('div');
                cell.classList.add('image-cell');
                
                const xPos = (x / 8) * 100;
                const yPos = (y / 3) * 100;
                cell.style.backgroundPosition = `${xPos}% ${yPos}%`;
                
                container.appendChild(cell);
            }
        }
    });
}

function initializeFooterOverlayGrid() {
    const footerOverlayContainer = document.getElementById('footer-overlay-grid');
    if (!footerOverlayContainer) return;
    
    footerOverlayContainer.innerHTML = '';
    footerOverlayCells = [];

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = document.createElement('div');
            cell.classList.add('overlay-cell');
            footerOverlayContainer.appendChild(cell);
            footerOverlayCells.push(cell);
        }
    }
}

// ==========================================
// MAIN GRID ANIMATION
// ==========================================

function animateGridPhase(phaseIndex, timeline, position) {
    const color = colors[phaseIndex];
    const totalCells = overlayCells.length;
    const firstPhaseCount = Math.floor(totalCells * FIRST_PHASE_PERCENT);
    const secondPhaseCount = totalCells - firstPhaseCount;

    const gridPhaseStartTime = position;
    const firstPhaseEndTime = gridPhaseStartTime + FIRST_PHASE_DURATION;
    const secondPhaseStartTime = firstPhaseEndTime + PAUSE_BETWEEN_PHASES;
    const secondPhaseEndTime = secondPhaseStartTime + SECOND_PHASE_DURATION;
    const backgroundChangeTime = secondPhaseEndTime + FULL_GRID_DURATION;
    const disappearStartTime = backgroundChangeTime + 0.1;

    timeline.set(overlayCells, { 
        scale: 0, 
        backgroundColor: color,
        force3D: true
    }, gridPhaseStartTime);

    const sortedCells = sortCellsFromOutsideToInside([...overlayCells], 9, 6);

    // Phase 1: First 20% of cells
    const firstPhaseCells = sortedCells.slice(0, firstPhaseCount);
    timeline.to(firstPhaseCells, {
        scale: 1,
        duration: 0,
        stagger: firstPhaseCount > 0 ? FIRST_PHASE_DURATION / firstPhaseCount : 0,
        force3D: true,
        ease: "none"
    }, gridPhaseStartTime);

    // Phase 2: Remaining 80% of cells
    const secondPhaseCells = sortedCells.slice(firstPhaseCount);
    timeline.to(secondPhaseCells, {
        scale: 1,
        duration: 0,
        stagger: secondPhaseCount > 0 ? SECOND_PHASE_DURATION / secondPhaseCount : 0,
        force3D: true,
        ease: "none"
    }, secondPhaseStartTime);

    // Background switch with will-change optimization
    timeline.call(() => {
        imageGridContainers.forEach((container, index) => {
            if (container) {
                if (index === phaseIndex) {
                    container.style.willChange = 'opacity';
                    container.classList.add('active');
                } else {
                    container.classList.remove('active');
                    // Remove will-change after transition
                    setTimeout(() => {
                        container.style.willChange = 'auto';
                    }, 300);
                }
            }
        });
    }, null, backgroundChangeTime);
    
    // Add hero text IN animation at beginning of grid phase
    animateHeroTextIn(phaseIndex, color, timeline, gridPhaseStartTime + 0.2);
    
    // Add hero text OUT animation at end of phase (before cells disappear)
    animateHeroTextOut(timeline, disappearStartTime - 0.4);

    // Phase 3: Cells disappear
    const disappearCells = [...sortedCells].reverse();
    timeline.to(disappearCells, {
        scale: 0,
        duration: 0,
        stagger: totalCells > 0 ? DISAPPEAR_DURATION / totalCells : 0,
        force3D: true,
        ease: "none"
    }, disappearStartTime);
}

function createMasterTimeline() {
    if (masterTimeline) masterTimeline.kill();
    
    masterTimeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 0,
        onRepeat: () => {
            currentPhase = 0;
        }
    });

    let position = 0;

    for (let i = 0; i < 4; i++) {
        const gridPhaseStartTime = position;
        animateGridPhase(i, masterTimeline, gridPhaseStartTime);
        position += PHASE_DURATION;
    }

    return masterTimeline;
}

// ==========================================
// FOOTER GRID ANIMATION
// ==========================================

function animateFooterGrid() {
    if (footerTimeline) footerTimeline.kill();
    
    // Check if footer cells exist
    if (!footerOverlayCells || footerOverlayCells.length === 0) {
        console.warn('Footer overlay cells not found, skipping footer animation');
        return;
    }
    
    footerTimeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 1.0
    });

    const color = colors[0]; // Use first color
    const totalCells = footerOverlayCells.length;
    const firstPhaseCount = Math.floor(totalCells * 0.3);

    footerTimeline.set(footerOverlayCells, { 
        scale: 0, 
        backgroundColor: color
    });

    const sortedCells = sortCellsFromOutsideToInside([...footerOverlayCells], 9, 4);

    // Animate cells appearing
    footerTimeline.to(sortedCells, {
        scale: 1,
        duration: 0,
        stagger: 0.02,
    }, 0.5);

    // Switch footer background
    footerTimeline.call(() => {
        footerImageGridContainers.forEach((container, index) => {
            if (container) {
                if (index === 0) {
                    container.classList.add('active');
                } else {
                    container.classList.remove('active');
                }
            }
        });
    }, null, 1.5);

    // Animate cells disappearing
    footerTimeline.to(sortedCells.reverse(), {
        scale: 0,
        duration: 0,
        stagger: 0.02,
    }, 2.5);
}

// ==========================================
// SCROLL ANIMATIONS
// ==========================================

function setupSectionTitleSplitText(titleElement) {
    if (titleElement && typeof gsap !== 'undefined') {
        const text = titleElement.textContent;
        
        // Split text into individual characters
        titleElement.innerHTML = text.split('').map(char => 
            `<span style="display: inline-block; white-space: nowrap;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        return titleElement.querySelectorAll('span');
    }
    return null;
}

function animateSectionTitle(titleElement) {
    const chars = setupSectionTitleSplitText(titleElement);
    
    if (chars && chars.length > 0) {
        // Set initial state
        gsap.set(chars, {
            y: 100,
            opacity: 0
        });
        
        // Create timeline for this title
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: titleElement,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
        
        // Animate characters in with stagger
        tl.to(chars, {
            duration: 0.6,
            y: 0,
            opacity: 1,
            ease: "power3.out",
            stagger: 0.02
        });
    }
}

function animateCardsColorOverlay() {
    // Animation colors from the grid animation
    const animationColors = ['#6E90DB', '#D49C0C', '#EB625E', '#A2C617'];
    
    // Get ALL cards from all sections
    const allCards = document.querySelectorAll('.plek-card, .empty-card');
    
    if (allCards.length === 0) {
        console.log('No cards found for color overlay animation');
        return;
    }
    
    console.log(`Found ${allCards.length} cards for color overlay`);
    
    // Assign random colors to each card and set initial opacity
    allCards.forEach(card => {
        const randomColor = animationColors[Math.floor(Math.random() * animationColors.length)];
        
        // Set color and initial opacity (visible)
        card.style.setProperty('--overlay-color', randomColor);
        card.style.setProperty('--overlay-opacity', '0.85');
        
        // Debug log
        console.log(`Card styled with color ${randomColor}`, card);
    });
    
    // Group cards by their parent section - check all possible sections
    const dagjeUitCards = document.querySelectorAll('.dagje-uit-section .plek-card, .dagje-uit-section .empty-card');
    const leukOmTeDoenCards = document.querySelectorAll('.leuk-om-te-doen-section .plek-card, .leuk-om-te-doen-section .empty-card');
    
    // Function to create scroll trigger for a group of cards
    function createCardScrollTrigger(cards, triggerElement) {
        if (cards.length === 0) return;
        
        // Convert NodeList to array and shuffle for random order
        const cardsArray = [...cards];
        const shuffledCards = cardsArray.sort(() => Math.random() - 0.5);
        
        // Create timeline with scroll trigger
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            }
        });
        
        // Stagger the disappearance of overlays
        shuffledCards.forEach((card, index) => {
            const delay = index * 0.15; // 150ms between each card
            tl.set(card, {
                '--overlay-opacity': '0'
            }, delay);
        });
    }
    
    // Create scroll triggers for each card group
    if (dagjeUitCards.length > 0) {
        createCardScrollTrigger(dagjeUitCards, '.dagje-uit-section');
    }
    
    if (leukOmTeDoenCards.length > 0) {
        createCardScrollTrigger(leukOmTeDoenCards, '.leuk-om-te-doen-section');
    }
}

function initializeScrollAnimations() {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Animate all section titles with stagger effect
    const sectionTitles = document.querySelectorAll('.section-title, .locals-title');
    sectionTitles.forEach(title => {
        animateSectionTitle(title);
    });

    // Animate cards with color overlay effect
    animateCardsColorOverlay();

    // GSAP Scroll animatie voor footer
    const footerPadding = window.innerWidth <= 768 ? 84 : 100; // var(--space-xl) * 2 op mobile (~42px per kant), 50px op desktop
    gsap.to(".footer-white-content", {
        width: `calc(100% - ${footerPadding}px)`,
        height: `calc(100% - ${footerPadding}px)`,
        borderRadius: "24px",
        ease: "none",
        scrollTrigger: {
            trigger: ".footer-section",
            start: "top bottom",
            end: "top center",
            scrub: true
        }
    });
}

// ==========================================
// NAVIGATION FUNCTIONS
// ==========================================

function initializeNavigation() {
    // Smooth scrolling only for anchor links (starting with #)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle smooth scrolling for anchor links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80; // Account for fixed nav
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
            // For .html links, let them work normally (no preventDefault)
        });
    });

    // Active navigation state
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + 100;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            
            // Only handle active state for anchor links
            if (href && href.startsWith('#')) {
                const targetElement = document.querySelector(href);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop;
                    const offsetBottom = offsetTop + targetElement.offsetHeight;
                    
                    if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                }
            }
        });
    });
}

// ==========================================
// INTERACTIVE ELEMENTS
// ==========================================

function initializeInteractiveElements() {
    // Category card hover effects
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Event card hover effects
    document.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            gsap.to(this, {
                y: -5,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', function() {
            gsap.to(this, {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Todo card hover effects
    document.querySelectorAll('.todo-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
}

// ==========================================
// MOBILE MENU
// ==========================================

function initializeMobileMenu() {
    // Create mobile menu toggle button
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) {
        console.warn('Nav container not found, skipping mobile menu initialization');
        return;
    }
    
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add('mobile-menu-btn');
    mobileMenuBtn.innerHTML = '☰';
    mobileMenuBtn.style.display = 'none';
    
    navContainer.appendChild(mobileMenuBtn);
    
    const navMenu = document.querySelector('.nav-menu');
    
    mobileMenuBtn.addEventListener('click', function() {
        navMenu.classList.toggle('mobile-active');
        this.innerHTML = navMenu.classList.contains('mobile-active') ? '✕' : '☰';
    });
    
    // Show mobile menu button on small screens
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
        } else {
            mobileMenuBtn.style.display = 'none';
            navMenu.classList.remove('mobile-active');
            mobileMenuBtn.innerHTML = '☰';
        }
    }
    
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();
}

// ==========================================
// INITIALIZATION
// ==========================================

function resetAnimation() {
    if (overlayCells && overlayCells.length > 0) {
        gsap.set(overlayCells, { scale: 0, backgroundColor: 'transparent' });
    }
    if (footerOverlayCells && footerOverlayCells.length > 0) {
        gsap.set(footerOverlayCells, { scale: 0, backgroundColor: 'transparent' });
    }

    imageGridContainers.forEach((container, index) => {
        if (container) {
            if (index === 0) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        }
    });

    footerImageGridContainers.forEach((container, index) => {
        if (container) {
            if (index === 0) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        }
    });
    
    // Initialize hero text to first phase (index 0 - blauw)  
    const heroText0 = document.getElementById('hero-text-0');
    const heroText1 = document.getElementById('hero-text-1');
    if (heroText0 && heroText1) {
        heroText0.textContent = heroTexts[0][0];
        heroText1.textContent = heroTexts[0][1];
        heroText0.style.color = colors[0];
        heroText1.style.color = colors[0];
        
        // Setup split text for initial state
        setupHeroSplitText();
    }
    
    currentPhase = 0;
}

function startAnimations() {
    if (!isAnimating) {
        createMasterTimeline();
        animateFooterGrid();
        isAnimating = true;
    }
}

function stopAnimations() {
    if (masterTimeline) masterTimeline.kill();
    if (footerTimeline) footerTimeline.kill();
    isAnimating = false;
}

// ==========================================
// DRAG FUNCTIONALITY
// ==========================================

function initializeDragScroll() {
    // Remove drag functionality - use default scroll
}

// ==========================================
// DOM READY
// ==========================================


document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeImageGrids();
    initializeOverlayGrid();
    initializeFooterGrids();
    initializeFooterOverlayGrid();
    resetAnimation();
    
    // Initialize interactive elements
    initializeNavigation();
    initializeInteractiveElements();
    initializeMobileMenu();
    initializeDragScroll();
    
    // Start animations immediately
    setTimeout(() => {
        startAnimations();
        initializeScrollAnimations();
        animateFooterText();
    }, 100);
});

// ==========================================
// WINDOW RESIZE HANDLER
// ==========================================

window.addEventListener('resize', function() {
    // Restart animations on resize to ensure proper positioning
    if (isAnimating) {
        stopAnimations();
        setTimeout(() => {
            startAnimations();
        }, 100);
    }
});

// ==========================================
// PERFORMANCE OPTIMIZATION
// ==========================================

// Pause animations when page is not visible
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAnimations();
    } else {
        startAnimations();
    }
});

// Export functions for external use
window.HeerlenHome = {
    startAnimations,
    stopAnimations,
    resetAnimation
};