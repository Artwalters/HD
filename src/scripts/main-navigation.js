// ==========================================
// MAIN NAVIGATION COMPONENT JAVASCRIPT
// ==========================================

// Don't initialize on DOMContentLoaded - let component loader handle it

function initializeMainNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        // Mobile menu toggle
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
                
                // Handle different link types
                const href = this.getAttribute('href');
                
                // Only handle smooth scrolling for anchor links on same page
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
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
    
    // Highlight current page
    highlightCurrentPage();
}

function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('current-page');
        }
    });
}

// Add CSS for current page highlighting
const style = document.createElement('style');
style.textContent = `
    .nav-link.current-page {
        color: #D49C0C;
    }
    
    .nav-link.current-page::after {
        width: 100%;
    }
`;
document.head.appendChild(style);