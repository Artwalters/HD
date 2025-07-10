// ==============================
// DEMO SCRIPT - HEERLEN DOEN API
// ==============================

// Wacht tot de app geladen is
document.addEventListener('DOMContentLoaded', () => {
    // Geef de app even tijd om te initialiseren
    setTimeout(() => {
        console.log('🎬 Demo Script gestart!');
        console.log('Beschikbare commands:');
        console.log('- filterCultuur()');
        console.log('- filterHoreca()');
        console.log('- filterMode()');
        console.log('- showAll()');
        console.log('- zoekMuseum()');
        console.log('- wijzigThema()');
        console.log('- voegSportToe()');
        console.log('- toonStats()');
        
        // Maak functies globaal beschikbaar
        window.demoFunctions = {
            filterCultuur,
            filterHoreca, 
            filterMode,
            showAll,
            zoekMuseum,
            wijzigThema,
            voegSportToe,
            toonStats
        };
        
    }, 2000);
});

// ==============================
// DEMO FUNCTIES
// ==============================

/**
 * Filter op cultuur categorie
 */
function filterCultuur() {
    console.log('🎭 Filtering op Cultuur...');
    HeerlenApp.filterByCategory('Cultuur');
    console.log('✅ Alleen cultuur locaties zichtbaar');
}

/**
 * Filter op horeca categorie
 */
function filterHoreca() {
    console.log('🍽️ Filtering op Eten & Drinken...');
    HeerlenApp.filterByCategory('Eten & Drinken');
    console.log('✅ Alleen horeca locaties zichtbaar');
}

/**
 * Filter op mode categorie
 */
function filterMode() {
    console.log('👗 Filtering op Mode...');
    HeerlenApp.filterByCategory('Mode');
    console.log('✅ Alleen mode locaties zichtbaar');
}

/**
 * Toon alle categorieën
 */
function showAll() {
    console.log('🌍 Toon alle categorieën...');
    HeerlenApp.filterByCategory(null);
    console.log('✅ Alle locaties zichtbaar');
}

/**
 * Zoek naar museum
 */
function zoekMuseum() {
    console.log('🔍 Zoeken naar "museum"...');
    const results = HeerlenApp.search('museum');
    console.log(`✅ ${results.features.length} resultaten gevonden`);
    results.features.forEach(feature => {
        console.log(`- ${feature.properties.name}`);
    });
}

/**
 * Wijzig thema naar roze/blauw
 */
function wijzigThema() {
    console.log('🎨 Wijzig thema naar roze/blauw...');
    HeerlenApp.updateTheme({
        primary: '#E91E63',    // Pink
        secondary: '#2196F3',  // Blue
        accent: '#FF5722'      // Deep Orange
    });
    console.log('✅ Thema gewijzigd! Refresh voor volledige effect');
}

/**
 * Voeg nieuwe Sport categorie toe
 */
function voegSportToe() {
    console.log('🏃 Voeg Sport categorie toe...');
    
    // Voeg categorie toe
    HeerlenApp.addCategory('Sport', {
        color: '#FF6B6B',
        iconMap: {
            '🏊': 'Z',  // Zwemmen
            '🏃': 'L',  // Lopen
            '⚽': 'V',  // Voetbal
            '🏀': 'B',  // Basketbal
            '🎾': 'T'   // Tennis
        },
        defaultIcon: 'S'
    });
    
    console.log('✅ Sport categorie toegevoegd');
    console.log('💡 Tip: Maak data/sport.json bestand voor data');
}

/**
 * Toon app statistieken
 */
function toonStats() {
    console.log('📊 App Statistieken:');
    const stats = HeerlenApp.getStats();
    console.table(stats);
}

// ==============================
// KEYBOARD SHORTCUTS
// ==============================

document.addEventListener('keydown', (e) => {
    // Alleen als geen input element focus heeft
    if (document.activeElement.tagName !== 'INPUT') {
        switch(e.key) {
            case '1':
                filterCultuur();
                break;
            case '2':
                filterHoreca();
                break;
            case '3':
                filterMode();
                break;
            case '0':
                showAll();
                break;
            case 's':
                zoekMuseum();
                break;
            case 't':
                wijzigThema();
                break;
            case 'i':
                toonStats();
                break;
        }
    }
});

// ==============================
// CONSOLE TIPS
// ==============================

console.log('%c🗺️ Heerlen Doen - Demo Mode', 'color: #4B83F2; font-size: 16px; font-weight: bold;');
console.log('%cKeyboard shortcuts:', 'color: #27AE60; font-weight: bold;');
console.log('1️⃣ = Filter Cultuur');
console.log('2️⃣ = Filter Horeca');
console.log('3️⃣ = Filter Mode');
console.log('0️⃣ = Toon alles');
console.log('🔤 S = Zoek museum');
console.log('🔤 T = Wijzig thema');
console.log('🔤 I = Toon statistieken');
console.log('');
console.log('%cOf gebruik functies direct:', 'color: #9932CC; font-weight: bold;');
console.log('filterCultuur(), filterHoreca(), filterMode()');
console.log('showAll(), zoekMuseum(), wijzigThema()');
console.log('voegSportToe(), toonStats()');
console.log('');
console.log('%cGeavanceerd:', 'color: #FF6B6B; font-weight: bold;');
console.log('HeerlenApp.exportConfig() - Export configuratie');
console.log('HeerlenApp.getStats() - Krijg statistieken');
console.log('HeerlenApp.search("term") - Zoek in data');
console.log('HeerlenApp.filterByCategory("Cat") - Filter categorie');