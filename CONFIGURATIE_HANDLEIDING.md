# 🗺️ Heerlen Doen - Configuratie Handleiding

## 📋 Overzicht

Deze handleiding legt uit hoe je de Heerlen Doen applicatie kunt aanpassen en uitbreiden. De applicatie is volledig modulair opgezet voor eenvoudige schaalbaarheid.

## 📁 Project Structuur

```
HeerlenDoen2/
├── 📄 index.html                 # Hoofdpagina
├── ⚙️ config.js                  # Centrale configuratie
├── 📊 businesses.json            # Originele data (legacy)
├── 🎨 styles.css                 # Basis styling
├── 🎨 popup-styles.css           # Popup styling
│
├── 📁 data/                      # Data bestanden per categorie
│   ├── cultuur.json
│   ├── etendrinken.json
│   └── mode.json
│
├── 📁 modules/                   # JavaScript modules
│   ├── appManager.js             # Hoofdmodule
│   ├── dataLoader.js             # Data management
│   ├── markerManager.js          # Marker beheer
│   └── popupManager.js           # Popup functionaliteit
│
├── 📁 styles/                    # CSS structuur
│   └── variables.css             # CSS variabelen
│
├── 📁 templates/                 # Templates voor nieuwe content
│   └── category-template.json
│
└── 📁 utils/                     # Hulpscripts
    └── splitData.js              # Data splitsen utility
```

## ⚙️ Configuratie

### Basis Instellingen (config.js)

De centrale configuratie zit in `config.js`:

```javascript
window.HeerlenConfig = {
    // Map instellingen
    map: {
        accessToken: "jouw-mapbox-token",
        style: "mapbox://styles/...",
        center: [5.979642, 50.887634],
        zoom: 15.5
    },
    
    // Categorieën met kleuren en icons
    categories: {
        "Cultuur": {
            color: "#4B83F2",
            iconMap: { "🏛️": "M", "🎭": "T" },
            defaultIcon: "C"
        }
    },
    
    // Thema kleuren
    theme: {
        primary: "#4B83F2",
        secondary: "#27AE60"
    }
};
```

### CSS Variabelen (styles/variables.css)

Alle kleuren en styling zijn configureerbaar via CSS variabelen:

```css
:root {
  --color-primary: #4B83F2;
  --color-secondary: #27AE60;
  --font-heading: "astronef-std-super-cond", sans-serif;
}
```

## 🎨 Kleuren Aanpassen

### Methode 1: CSS Variabelen

```css
:root {
  --color-cultuur: #FF6B6B;    /* Nieuwe kleur voor cultuur */
  --color-horeca: #4ECDC4;     /* Nieuwe kleur voor horeca */
  --color-mode: #45B7D1;       /* Nieuwe kleur voor mode */
}
```

### Methode 2: JavaScript

```javascript
// Via de app manager
HeerlenApp.updateTheme({
    primary: "#FF6B6B",
    secondary: "#4ECDC4"
});
```

### Methode 3: Direct in config.js

```javascript
categories: {
    "Cultuur": {
        color: "#FF6B6B",  // Nieuwe kleur hier
        // ... rest van config
    }
}
```

## ➕ Nieuwe Categorie Toevoegen

### Stap 1: Data Bestand Maken

Maak een nieuw bestand in `/data/` map:

```json
// data/sport.json
{
  "type": "FeatureCollection", 
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [5.979642, 50.887634]
      },
      "properties": {
        "id": 1,
        "name": "Sportcentrum Heerlen",
        "category": "Sport",
        "address": "Sportlaan 1, 6411 XX Heerlen",
        "description": "Moderne sportfaciliteit met zwembad, fitness en sportzalen.",
        "phone": "045-123-4567",
        "website": "www.sportcentrum.nl",
        "icon": "🏊",
        "color": "#FF6B6B",
        "opening_hours": "Ma-Zo: 06:00-23:00"
      }
    }
  ]
}
```

### Stap 2: Configuratie Uitbreiden

Voeg toe aan `config.js`:

```javascript
categories: {
    // ... bestaande categorieën
    "Sport": {
        color: "#FF6B6B",
        iconMap: {
            "🏊": "Z",    // Zwemmen
            "🏃": "L",    // Lopen  
            "⚽": "V",    // Voetbal
            "🏀": "B",    // Basketbal
            "🎾": "T"     // Tennis
        },
        defaultIcon: "S"
    }
},

dataSources: {
    // ... bestaande sources
    sport: "./data/sport.json"
}
```

### Stap 3: CSS Variabelen Toevoegen

```css
:root {
    --color-sport: #FF6B6B;
}
```

### Stap 4: Automatisch Laden

De app laadt automatisch alle geconfigureerde categorieën!

## 📊 Data Management

### Data Structuur

Elke locatie heeft deze structuur:

```json
{
  "id": 1,                          // Uniek ID
  "name": "Naam van de locatie",    // Zichtbare naam
  "category": "Categorie",          // Must match config
  "address": "Volledig adres",      // Voor popup
  "description": "Beschrijving",    // Voor popup
  "phone": "045-123-4567",          // Optioneel
  "website": "www.site.nl",         // Optioneel  
  "icon": "🏢",                     // Emoji icon
  "color": "#FF6B6B",              // Hex kleur
  "opening_hours": "Ma-Vr: 9-17"   // Optioneel
}
```

### Data Toevoegen

1. **Nieuwe locatie in bestaande categorie:**
   - Voeg toe aan juiste `/data/categorie.json` bestand

2. **Bulk import:**
   - Gebruik de `utils/splitData.js` voor het splitsen van grote bestanden

## 🔧 Geavanceerde Aanpassingen

### Icon Mapping

Icons worden gemapt van emoji naar letters voor Mapbox:

```javascript
iconMap: {
    "🏛️": "M",    // Museum
    "🎭": "T",     // Theater
    "🍕": "P",     // Pizza
    "👕": "F"      // Fashion
}
```

### Popup Styling

Popups kunnen per categorie gestyledworden door de `color` property aan te passen.

### Map Instellingen

```javascript
map: {
    center: [lng, lat],    // Startpositie
    zoom: 15.5,           // Startzoom
    pitch: 45,            // 3D hoek
    bearing: -17.6        // Rotatie
}
```

## 🛠️ Development Tools

### App Manager API

```javascript
// Filteren op categorie
HeerlenApp.filterByCategory("Cultuur");

// Zoeken  
HeerlenApp.search("museum");

// Statistieken
console.log(HeerlenApp.getStats());

// Nieuwe categorie toevoegen
HeerlenApp.addCategory("Sport", {
    color: "#FF6B6B",
    iconMap: {"🏊": "Z"},
    defaultIcon: "S"
});

// Configuratie exporteren
const config = HeerlenApp.exportConfig();
```

### Data Loader API

```javascript
// Specifieke categorie laden
const cultuurData = await HeerlenApp.dataLoader.loadCategoryData("Cultuur");

// Zoeken in data
const results = HeerlenApp.dataLoader.search("museum");

// Cache leegmaken
HeerlenApp.dataLoader.clearCache();
```

## 🎯 Quick Start Templates

### Nieuwe Kleurenschema

```javascript
// In config.js - verander theme object:
theme: {
    primary: "#E91E63",      // Pink
    secondary: "#00BCD4",    // Cyan  
    accent: "#FF5722"        // Deep Orange
}
```

### Nieuwe Stad Setup

1. Verander `map.center` in config.js
2. Update `map.boundary` voor nieuwe gebied  
3. Vervang data bestanden in `/data/` map
4. Pas categorieën aan indien nodig

### Nieuwe Styling

```css
/* In styles/variables.css */
:root {
    --color-primary: #jouw-kleur;
    --font-heading: "jouw-font", sans-serif;
    --radius-lg: 20px;  /* Meer ronde hoeken */
}
```

## 🐛 Troubleshooting

### App laadt niet
- Check browser console voor errors
- Verify Mapbox token is geldig
- Controleer of alle modules geladen zijn

### Markers tonen niet
- Verify data format (GeoJSON)
- Check coordinates [lng, lat] order
- Verify category names match config

### Popup werkt niet  
- Check for JavaScript errors
- Verify popup-styles.css is geladen
- Check if popupManager is geïnitialiseerd

## 📈 Performance Tips

1. **Data optimalisatie:**
   - Houd data bestanden onder 1MB
   - Splits grote datasets op

2. **Icon optimalisatie:**
   - Gebruik letters i.p.v. emoji's voor betere performance

3. **Caching:**
   - Data wordt automatisch gecached
   - Use `clearCache()` alleen bij development

## 🎉 Conclusie

De applicatie is nu volledig modulair en schaalbaar! Je kunt:

- ✅ Eenvoudig kleuren aanpassen
- ✅ Nieuwe categorieën toevoegen  
- ✅ Data beheren per categorie
- ✅ Styling centraal configureren
- ✅ Programmatisch uitbreiden

Voor vragen of hulp, check de inline documentatie in de modules! 🚀