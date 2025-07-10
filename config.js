// ==============================
// HEERLEN DOEN - CONFIGURATIE
// ==============================

window.HeerlenConfig = {
    // MAP INSTELLINGEN
    map: {
        accessToken: "pk.eyJ1IjoicHJvamVjdGhlZXJsZW4iLCJhIjoiY2x4eWVmcXBvMWozZTJpc2FqbWgzcnAyeCJ9.SVOVbBG6o1lHs6TwCudR9g",
        style: "mapbox://styles/projectheerlen/clz9zf0qx005601pr599j5qri",
        center: [5.979642, 50.887634],
        zoom: 15.5,
        pitch: window.innerWidth < 768 ? 0 : 45, // Disable 3D on mobile
        bearing: window.innerWidth < 768 ? 0 : -17.6,
        boundary: {
            center: [5.977105864037915, 50.88774161029858],
            radius: 0.6
        }
    },

    // MARKER ZOOM LEVELS
    markerZoom: {
        min: 10,
        small: 14,
        medium: 16,
        large: 18
    },

    // CATEGORIEËN CONFIGURATIE
    categories: {
        "Cultuur": {
            color: "#4B83F2",
            iconMap: {
                "🏛️": "M",
                "⛏️": "M",
                "🏢": "G",
                "⛪": "K",
                "🗿": "A",
                "🎭": "T",
                "🎵": "M",
                "🎨": "A",
                "🎬": "F",
                "🎞️": "F",
                "🎸": "P",
                "📚": "B",
                "🖼️": "G",
                "🎪": "E",
                "🎹": "P",
                "🎤": "S",
                "🕊️": "M",
                "💃": "D"
            },
            defaultIcon: "C"
        },
        "Eten & Drinken": {
            color: "#27AE60",
            iconMap: {
                "🤠": "W",
                "🥩": "S",
                "🍽️": "R",
                "🥙": "S",
                "🍖": "T",
                "🇬🇷": "G",
                "🍴": "R",
                "👯": "R",
                "😊": "G",
                "🍝": "I",
                "🍕": "P",
                "🐟": "G",
                "📖": "S",
                "🥘": "T",
                "🍛": "A",
                "☕": "C",
                "🍺": "B",
                "🍸": "C",
                "🎵": "M",
                "🍻": "B",
                "🥪": "S",
                "🎺": "C",
                "🏦": "B",
                "🍹": "C",
                "🥐": "B",
                "🥖": "B",
                "🍰": "C",
                "🥯": "B",
                "👹": "R",
                "🚪": "C",
                "🌯": "D",
                "🍕": "P"
            },
            defaultIcon: "R"
        },
        "Mode": {
            color: "#9932CC",
            iconMap: {
                "💎": "L",
                "👕": "H",
                "🏠": "B",
                "👔": "W",
                "🤵": "H",
                "👠": "S",
                "👗": "D",
                "👚": "D",
                "💃": "O",
                "💄": "D",
                "🎩": "K",
                "🗽": "N",
                "✨": "P",
                "👖": "J",
                "👩": "M",
                "👨": "M",
                "🌟": "F",
                "🏷️": "O",
                "💫": "N",
                "🛍️": "T",
                "👟": "S",
                "👶": "K",
                "👨‍💼": "M",
                "🦹": "O",
                "🇮🇹": "I",
                "🦋": "F",
                "🕰️": "V",
                "🎭": "W",
                "💝": "S",
                "🖤": "A",
                "👨‍👩‍👧‍👦": "F"
            },
            defaultIcon: "M"
        }
    },

    // THEMA KLEUREN
    theme: {
        primary: "#4B83F2",
        secondary: "#27AE60",
        accent: "#9932CC",
        background: "#ffffff",
        text: "#333333",
        textLight: "#666666"
    },

    // POPUP INSTELLINGEN
    popup: {
        maxWidth: "380px",
        offset: {
            bottom: [0, -5],
            top: [0, 0],
            left: [0, 0],
            right: [0, 0]
        },
        animation: {
            duration: 800,
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
        }
    },

    // DATA BRONNEN
    dataSources: {
        "Cultuur": "./data/cultuur.json",
        "Eten & Drinken": "./data/etendrinken.json", 
        "Mode": "./data/mode.json"
    },

    // UI INSTELLINGEN
    ui: {
        fonts: {
            heading: '"Inter", sans-serif',
            body: '"Inter", Arial, sans-serif'
        },
        responsive: {
            tablet: 1024,
            mobile: 767,
            small: 480
        }
    }
};