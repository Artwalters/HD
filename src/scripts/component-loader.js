// ==========================================
// COMPONENT LOADER
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    loadNavigationComponent();
});

async function loadNavigationComponent() {
    try {
        const response = await fetch('src/components/main-navigation.html');
        const html = await response.text();
        
        // Insert navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', html);
        
        // Initialize navigation after loading
        if (typeof initializeMainNavigation === 'function') {
            initializeMainNavigation();
        }
    } catch (error) {
        console.error('Error loading navigation component:', error);
    }
}

// For pages that need to wait for navigation to load
window.navigationLoaded = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => {
        loadNavigationComponent().then(() => {
            resolve();
        });
    });
});