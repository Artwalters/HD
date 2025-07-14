# HeerlenDoen 📍

Een interactieve 3D webapplicatie voor het ontdekken van cultuur, horeca, bezienswaarigheden en mode in Heerlen, compleet met favorieten systeem en geavanceerde navigatie.

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
│   │   ├── navigationManager.js # Route navigatie
│   │   ├── likesManager.js  # Favorieten/likes systeem
│   │   └── threejsManager.js # 3D modellen rendering
│   ├── data/                # Data bestanden
│   │   ├── cultuur.json     # Culturele locaties
│   │   ├── horeca.json      # Restaurants en cafés
│   │   ├── mode.json        # Mode en shopping
│   │   └── category-template.json # Template structuur
│   ├── templates/           # HTML templates
│   │   ├── popup.html       # Popup template
│   │   ├── navigation.html  # Navigatie panel template
│   │   └── info-panel.html  # Uitgebreide info weergave
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
│   ├── images/              # Afbeeldingen
│   │   ├── catcute.png      # Placeholder afbeelding
│   │   └── image.png        # Extra afbeelding
│   └── icons_map/           # Categorie iconen
│       ├── Bezienwaardigheden.png
│       ├── Cultuur.png
│       ├── Winkelen.png
│       └── horeca.png
├── docs/                    # Documentatie
│   ├── README.md            # Dit bestand
│   ├── CLAUDE.md            # AI development instructies
│   └── CONFIGURATIE_HANDLEIDING.md # Setup handleiding
├── index.html               # Hoofd HTML bestand
└── likes.html               # Favorieten overzichtspagina
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

### 🗺️ Kaart & Navigatie
- **Interactieve 3D kaart** met Mapbox GL JS
- **3D modellen** van iconische gebouwen (Schunck, Theater Heerlen) met Three.js
- **GPS navigatie** met route berekening voor lopen, fietsen en autorijden
- **Geanimeerde markers** met categorie-specifieke iconen
- **Locatie tracking** met real-time positie updates

### ❤️ Favorieten Systeem
- **Like functionaliteit** voor elke locatie
- **Dedicated favorieten pagina** met statistieken per categorie
- **Geanimeerde hartjes markers** op de kaart voor gelikete locaties
- **Persistent opslag** met localStorage
- **Synchronisatie** tussen kaart en favorieten overzicht

### 🎨 User Interface
- **Categoriefiltering** (Cultuur, Horeca, Mode, Bezienswaarigheden)
- **Uitgebreide info panels** met openingstijden, contact info en suggesties
- **"Vind je dit ook leuk"** suggesties voor gerelateerde locaties
- **Responsive design** geoptimaliseerd voor mobile en desktop
- **Smooth animaties** voor alle interacties
- **Template systeem** voor modulaire UI componenten

### ⚡ Performance & Techniek
- **Real-time FPS monitoring** voor prestatie analyse
- **Cache busting** met versie parameters
- **Lazy loading** van templates en data
- **Geoptimaliseerde render pipeline** voor 3D content
- **Debug logging** voor troubleshooting

## 🔧 Technische Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Kaarten:** Mapbox GL JS v2.15.0
- **3D Graphics:** Three.js v0.126.0 met GLTFLoader
- **Styling:** CSS3 met CSS Custom Properties
- **Typography:** Inter & Astronef fonts
- **Data:** GeoJSON formaat
- **Templates:** Eigen HTML template systeem
- **Opslag:** LocalStorage voor favorieten
- **Routing:** Mapbox Directions API
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

Alle data bestanden gebruiken GeoJSON formaat met uitgebreide properties:
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
        "color": "#4B83F2",
        "phone": "+31 45 123 4567",
        "website": "https://example.com",
        "openingHours": {
          "monday": "09:00 - 17:00",
          "tuesday": "09:00 - 17:00"
        },
        "tags": ["museum", "geschiedenis"],
        "image": "url-naar-afbeelding"
      }
    }
  ]
}
```

## 🏗️ Nieuwe Features in Development

- **Enhanced 3D visualisaties** voor meer gebouwen
- **Social sharing** van favoriete locaties
- **Reviews en ratings** systeem
- **Event kalender** integratie
- **Augmented Reality** mode voor mobiel

---

**Ontwikkeld met ❤️ voor de stad Heerlen**