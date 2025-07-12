# HeerlenDoen 📍

Een interactieve webapplicatie voor het ontdekken van cultuur, horeca en mode in Heerlen.

## 📁 Project Structuur

```
HeerlenDoen2/
├── src/                      # Hoofdbroncode directory
│   ├── components/           # Herbruikbare UI componenten (toekomstig)
│   ├── managers/            # Business logic managers
│   │   ├── appManager.js    # Hoofd applicatie manager
│   │   ├── markerManager.js # Kaart markers beheer
│   │   ├── popupManager.js  # Popup functionaliteit
│   │   ├── filterManager.js # Filter en zoek functionaliteit  
│   │   ├── controlsManager.js # UI controls
│   │   ├── locationManager.js # GPS en locatie services
│   │   └── navigationManager.js # Route navigatie
│   ├── data/                # Data bestanden
│   │   ├── cultuur.json     # Culturele locaties
│   │   ├── horeca.json      # Restaurants en cafés
│   │   └── mode.json        # Mode en shopping
│   ├── templates/           # HTML templates
│   │   ├── popup.html       # Popup template
│   │   └── navigation.html  # Navigatie panel template
│   ├── styles/              # CSS styling
│   │   ├── main.css         # Hoofd styling
│   │   ├── variables.css    # CSS variabelen
│   │   ├── popup-styles.css # Popup styling
│   │   ├── navigation-styles.css # Navigatie styling
│   │   ├── filter-styles.css # Filter styling
│   │   ├── controls-styles.css # Controls styling
│   │   └── info-panel-styles.css # Info panel styling
│   ├── utils/               # Utility functies
│   │   ├── dataLoader.js    # Data loading en caching
│   │   ├── templateLoader.js # Template loading systeem
│   │   ├── performance.js   # Performance monitoring
│   │   ├── demo.js          # Demo functionaliteit
│   │   └── splitData.js     # Data processing tools
│   └── config/              # Configuratie bestanden
│       └── config.js        # Hoofd configuratie
├── assets/                  # Statische bestanden
│   └── images/              # Afbeeldingen
│       ├── catcute.png      # Placeholder afbeelding
│       └── image.png        # Extra afbeelding
├── docs/                    # Documentatie
│   ├── README.md            # Dit bestand
│   ├── CLAUDE.md            # AI development instructies
│   └── CONFIGURATIE_HANDLEIDING.md # Setup handleiding
└── index.html               # Hoofd HTML bestand
```

## 🚀 Snelle Start

1. **Lokaal openen:**
   ```bash
   # Open de map in een lokale server
   python -m http.server 8000
   # Of gebruik Live Server in VS Code
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

## 🎯 Kernfunctionaliteiten

- **Interactieve kaart** met Mapbox GL JS
- **Categoriefiltering** (Cultuur, Horeca, Mode)
- **GPS navigatie** met route berekening
- **Responsive design** voor mobile en desktop
- **Template systeem** voor modulaire UI
- **Performance monitoring** en optimalisatie

## 🔧 Technische Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Kaarten:** Mapbox GL JS
- **Styling:** CSS3 met CSS Custom Properties
- **Data:** GeoJSON formaat
- **Templates:** Eigen template systeem
- **Performance:** Real-time FPS monitoring

## 📱 Browser Ondersteuning

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🛠️ Development

Voor development instructies, zie [CONFIGURATIE_HANDLEIDING.md](docs/CONFIGURATIE_HANDLEIDING.md)

## 📝 Naamgevingsconventies

- **Bestanden:** camelCase (bijv. `appManager.js`)
- **CSS classes:** kebab-case (bijv. `.popup-container`)
- **Variabelen:** camelCase (bijv. `isNavigating`)
- **Constanten:** UPPER_SNAKE_CASE (bijv. `DEFAULT_ZOOM`)

## 🔄 Data Formaat

Alle data bestanden gebruiken GeoJSON formaat:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "id": 1,
        "name": "Locatie Naam",
        "category": "Cultuur",
        "description": "Beschrijving...",
        "color": "#4B83F2"
      }
    }
  ]
}
```

---

**Ontwikkeld met ❤️ voor de stad Heerlen**