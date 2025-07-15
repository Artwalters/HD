// ==============================
// SUBCATEGORIES DEFINITIONS
// ==============================

window.SubcategoryDefinitions = {
    "Mode": {
        steps: [
            {
                id: "target_audience",
                title: "Voor wie zoek je?",
                icon: "👥",
                required: false,
                options: [
                    { id: "heren", label: "Heren", icon: "👨" },
                    { id: "dames", label: "Dames", icon: "👩" },
                    { id: "kinderen", label: "Kinderen", icon: "👶" },
                    { id: "unisex", label: "Unisex", icon: "🚻" }
                ]
            },
            {
                id: "price_range",
                title: "Wat is je budget?",
                icon: "💰",
                required: false,
                options: [
                    { id: "budget", label: "Budget vriendelijk", icon: "💵" },
                    { id: "mid-range", label: "Gemiddeld", icon: "💳" },
                    { id: "luxury", label: "Luxury", icon: "💎" }
                ]
            },
            {
                id: "style",
                title: "Welke stijl zoek je?",
                icon: "✨",
                required: false,
                options: [
                    { id: "casual", label: "Casual", icon: "👕" },
                    { id: "formal", label: "Formeel", icon: "👔" },
                    { id: "sportief", label: "Sportief", icon: "👟" },
                    { id: "vintage", label: "Vintage", icon: "👗" }
                ]
            }
        ]
    },

    "Eten & Drinken": {
        steps: [
            {
                id: "cuisine_type",
                title: "Welke keuken?",
                icon: "🍽️",
                required: false,
                options: [
                    { id: "italiaans", label: "Italiaans", icon: "🍝" },
                    { id: "grieks", label: "Grieks", icon: "🥙" },
                    { id: "nederlands", label: "Nederlands", icon: "🧀" },
                    { id: "internationaal", label: "Internationaal", icon: "🌍" },
                    { id: "aziatisch", label: "Aziatisch", icon: "🍜" }
                ]
            },
            {
                id: "dining_style",
                title: "Wat voor gelegenheid?",
                icon: "🏪",
                required: false,
                options: [
                    { id: "restaurant", label: "Restaurant", icon: "🍽️" },
                    { id: "cafe", label: "Café", icon: "☕" },
                    { id: "bar", label: "Bar", icon: "🍺" },
                    { id: "fastfood", label: "Snel eten", icon: "🍔" },
                    { id: "takeaway", label: "Takeaway", icon: "🥡" }
                ]
            },
            {
                id: "atmosphere",
                title: "Welke sfeer?",
                icon: "🎭",
                required: false,
                options: [
                    { id: "gezellig", label: "Gezellig", icon: "🏠" },
                    { id: "romantisch", label: "Romantisch", icon: "💕" },
                    { id: "familie", label: "Familie", icon: "👨‍👩‍👧‍👦" },
                    { id: "business", label: "Business", icon: "💼" }
                ]
            }
        ]
    },

    "Cultuur": {
        steps: [
            {
                id: "period",
                title: "Welke periode interesseert je?",
                icon: "🏛️",
                required: false,
                options: [
                    { id: "romeins", label: "Romeins", icon: "🏛️" },
                    { id: "middeleeuws", label: "Middeleeuws", icon: "🏰" },
                    { id: "industrieel", label: "Industrieel", icon: "⚒️" },
                    { id: "modern", label: "Modern", icon: "🎨" }
                ]
            },
            {
                id: "type",
                title: "Wat voor cultuur zoek je?",
                icon: "🎭",
                required: false,
                options: [
                    { id: "museum", label: "Museum", icon: "🏛️" },
                    { id: "theater", label: "Theater", icon: "🎭" },
                    { id: "galerie", label: "Galerie", icon: "🖼️" },
                    { id: "monument", label: "Monument", icon: "🗿" },
                    { id: "evenement", label: "Evenement", icon: "🎪" }
                ]
            }
        ]
    },

    "Murals": {
        steps: [
            {
                id: "style",
                title: "Welke stijl murals?",
                icon: "🎨",
                required: false,
                options: [
                    { id: "realistisch", label: "Realistisch", icon: "🖼️" },
                    { id: "abstract", label: "Abstract", icon: "🎨" },
                    { id: "graffiti", label: "Graffiti", icon: "🏷️" },
                    { id: "historisch", label: "Historisch", icon: "🏛️" }
                ]
            }
        ]
    }
};