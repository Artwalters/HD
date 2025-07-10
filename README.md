# 🗺️ Heerlen Doen - Interactieve Stadskaart

Een moderne, schaalbare web applicatie voor het ontdekken van Heerlen met 3D Mapbox kaarten, dynamische popups en modulaire architectuur.

## ✨ Features

- 🗺️ **3D Mapbox Kaarten** met moderne styling
- 🎯 **Interactieve Markers** met categorieën (Cultuur, Horeca, Mode)
- 🎨 **Dynamische Popups** met flip animaties en scrollable content
- 📱 **Responsive Design** voor alle apparaten
- 🔧 **Modulaire Architectuur** voor eenvoudige uitbreiding
- ⚙️ **Configureerbare Styling** via CSS variabelen
- 📊 **Data Management** per categorie

## 🚀 Quick Start

```bash
# 1. Clone het project
git clone [repository-url]
cd HeerlenDoen2

# 2. Start een lokale server
python -m http.server 8000
# of
npx serve .

# 3. Open in browser
open http://localhost:8000
```

## 📁 Project Structuur

```
HeerlenDoen2/
├── 📄 index.html              # Hoofdpagina
├── ⚙️ config.js               # Centrale configuratie
├── 📊 data/                   # Data per categorie
├── 🧩 modules/                # JavaScript modules
├── 🎨 styles/                 # CSS bestanden
├── 📝 templates/              # Templates voor nieuwe content
└── 📚 CONFIGURATIE_HANDLEIDING.md
```

## 🎯 Snel Aanpassen

### Kleuren Wijzigen

```javascript
// In config.js
theme: {
    primary: "#jouw-kleur",
    secondary: "#jouw-kleur"
}
```

### Nieuwe Categorie Toevoegen

```javascript
// 1. Maak data/nieuwe-categorie.json
// 2. Voeg toe aan config.js:
categories: {
    "Nieuwe Categorie": {
        color: "#FF6B6B",
        iconMap: {"🏢": "N"},
        defaultIcon: "N"
    }
}
```

### Data Toevoegen

```json
// In data/categorie.json
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
        "name": "Nieuwe Locatie",
        "category": "Categorie",
        "address": "Adres",
        "description": "Beschrijving",
        "color": "#FF6B6B"
      }
    }
  ]
}
```

## 🛠️ Development API

```javascript
// Filteren
HeerlenApp.filterByCategory("Cultuur");

// Zoeken
HeerlenApp.search("museum");

// Thema wijzigen
HeerlenApp.updateTheme({primary: "#FF6B6B"});

// Statistieken
console.log(HeerlenApp.getStats());
```

## 🎨 Styling

Het project gebruikt CSS variabelen voor consistente styling:

```css
:root {
    --color-primary: #4B83F2;
    --color-secondary: #27AE60;
    --font-heading: "astronef-std-super-cond", sans-serif;
}
```

## 📊 Data Categorieën

- **Cultuur** (25 locaties) - Musea, theaters, bibliotheken
- **Eten & Drinken** (40 locaties) - Restaurants, cafés, bars
- **Mode** (35 locaties) - Winkels, boetieksen, fashion

## 🔧 Modules

- **AppManager** - Hoofdmodule voor app management
- **DataLoader** - Data loading en caching
- **MarkerManager** - Marker beheer en filtering
- **PopupManager** - Popup functionaliteit

## 📱 Responsive Design

- **Desktop**: Grote popups, volledige functionaliteit
- **Tablet**: Aangepaste sizing en layout
- **Mobile**: Touch-optimized controls en compacte popups

## 🎯 Features

### Popups
- Flip animaties tussen voor- en achterkant
- Scrollable content voor lange beschrijvingen
- Sociale media links (website, telefoon)
- Responsive sizing per apparaat

### Markers
- Categorie-specifieke kleuren
- Zoom-responsive sizing
- Icon mapping (emoji → letters)
- Hover effects

### Map
- 3D buildings styling
- Custom Mapbox style
- Auto-close popups bij navigatie
- Touch/mouse scroll support

## 🌟 Uitbreidingen

Het project is ontworpen voor eenvoudige uitbreiding:

- ✅ Nieuwe categorieën toevoegen
- ✅ Styling aanpassen
- ✅ Data management per categorie
- ✅ Modulaire code structuur
- ✅ API voor programmatische controle

## 📚 Documentatie

Zie `CONFIGURATIE_HANDLEIDING.md` voor gedetailleerde instructies over:
- Configuratie opties
- Nieuwe categorieën toevoegen
- Data management
- Styling aanpassingen
- Development API
- Troubleshooting

## 🤝 Bijdragen

1. Fork het project
2. Maak een feature branch
3. Commit je wijzigingen
4. Push naar je branch
5. Open een Pull Request

## 📄 License

Dit project is beschikbaar onder de MIT License.

---

**Gemaakt voor de stad Heerlen** 🏛️✨