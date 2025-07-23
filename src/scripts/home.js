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
            for (let x = 0; x < 8; x++) {
                const cell = document.createElement('div');
                cell.classList.add('image-cell');
                
                const xPos = (x / 7) * 100;
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
        for (let x = 0; x < 8; x++) {
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
            for (let x = 0; x < 8; x++) {
                const cell = document.createElement('div');
                cell.classList.add('image-cell');
                
                const xPos = (x / 7) * 100;
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
        for (let x = 0; x < 8; x++) {
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

    const sortedCells = sortCellsFromOutsideToInside([...overlayCells], 8, 6);

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
        repeatDelay: 0.2,
        onRepeat: () => {
            currentPhase = 0;
        }
    });

    let position = 0;

    for (let i = 0; i < 4; i++) {
        const gridPhaseStartTime = position + 0.3;
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

    const sortedCells = sortCellsFromOutsideToInside([...footerOverlayCells], 8, 4);

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

function initializeScrollAnimations() {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Simple fade-in for section titles only
    gsap.from('.section-title', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
            trigger: '.section-title',
            start: 'top 90%',
            toggleActions: 'play none none reverse'
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
    console.log('Using default scroll for events carousel');
}

// ==========================================
// DOM READY
// ==========================================

// ==========================================
// HERO TEXT STAGGER ANIMATION
// ==========================================

function initializeHeroTextAnimation() {
    const boeiendeElement = document.querySelector('.title-boeiende');
    const cultuurElement = document.querySelector('.title-cultuur');
    
    if (boeiendeElement && cultuurElement) {
        // Split text into individual characters
        const boeiendeText = boeiendeElement.textContent;
        const cultuurText = cultuurElement.textContent;
        
        // Create spans for each character
        boeiendeElement.innerHTML = boeiendeText.split('').map(char => 
            `<span style="display: inline-block; white-space: nowrap;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        cultuurElement.innerHTML = cultuurText.split('').map(char => 
            `<span style="display: inline-block; white-space: nowrap;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        // Get all character spans
        const boeiendeChars = boeiendeElement.querySelectorAll('span');
        const cultuurChars = cultuurElement.querySelectorAll('span');
        const allChars = [...boeiendeChars, ...cultuurChars];
        
        // Create timeline for looping animation
        const heroTimeline = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        
        // Animate from bottom to normal position
        heroTimeline.fromTo(allChars, {
            y: 200
        }, {
            y: 0,
            duration: 0.6,
            ease: "back.out(1.2)",
            stagger: 0.05
        });
        
        // Hold for a moment
        heroTimeline.to({}, { duration: 1.5 });
        
        // Animate from normal to top
        heroTimeline.to(allChars, {
            y: -200,
            duration: 0.4,
            ease: "power2.in",
            stagger: 0.03
        });
        
        // Reset position for next loop
        heroTimeline.set(allChars, {
            y: 200
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeImageGrids();
    initializeOverlayGrid();
    initializeFooterGrids();
    initializeFooterOverlayGrid();
    resetAnimation();
    
    // Initialize hero text animation
    initializeHeroTextAnimation();
    
    // Initialize interactive elements
    initializeNavigation();
    initializeInteractiveElements();
    initializeMobileMenu();
    initializeDragScroll();
    
    // Start animations after a short delay
    setTimeout(() => {
        startAnimations();
        initializeScrollAnimations();
    }, 1000);
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