# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**No build system** - This project uses vanilla JavaScript with CDN dependencies:
- **Local development**: Use a local server (e.g., `python -m http.server` or Live Server extension)
- **Deployment**: Direct file upload to GitHub Pages (branch: `gh-pages`)
- **Testing**: Manual browser testing across `index.html`, `map.html`, and `likes.html`

## Architecture Overview

**Heerlen Doen** is a modular web application for exploring Heerlen, Netherlands. The architecture follows a manager-based pattern with clear separation of concerns:

### Core Structure
- **Entry points**: `index.html` (landing), `map.html` (main app), `likes.html` (favorites)
- **Manager system**: `AppManager` orchestrates specialized managers in `/src/managers/`
- **Component-based**: HTML templates in `/src/templates/` loaded dynamically
- **Data-driven**: JSON location data in `/src/data/` with GeoJSON format

### Key Technologies Integration
- **Mapbox GL JS**: 3D city mapping with custom styling and clustering
- **Three.js**: 3D carousel and model overlays
- **GSAP**: Text animations and scroll triggers
- **Template system**: Custom HTML template loading with conditional logic

### Manager Architecture Pattern
```
AppManager (Central orchestrator)
├── DataLoader (JSON data management) 
├── PopupManager (Info panels with suggestions system)
├── MarkerManager (Mapbox markers & clustering)
├── NavigationManager (Route planning with turn-by-turn)
├── LikesManager (localStorage favorites with cross-page sync)
└── ThreeJSManager (3D model overlay)
```

## Data Structure

### Location Data Format (`/src/data/*.json`)
```json
{
  "type": "FeatureCollection", 
  "features": [{
    "geometry": {"type": "Point", "coordinates": [lng, lat]},
    "properties": {
      "id": "category_number",
      "name": "Location Name",
      "category": "Cultuur|Eten & Drinken|Mode|Murals", 
      "address": "Street Address",
      "description": "Description text"
    }
  }]
}
```

### Categories
- **Cultuur** (Culture): Blue (#4B83F2) - Museums, theaters
- **Eten & Drinken** (Food & Drink): Green (#27AE60) - Restaurants, cafes  
- **Mode** (Fashion): Purple (#9932CC) - Clothing stores
- **Murals**: Red (#E74C3C) - Street art

## CSS Architecture

### Design System (`/src/styles/variables.css`)
- **Golden ratio scaling**: Typography and spacing based on 1.618 ratio
- **Color-coded categories**: Semantic color system for consistent branding
- **Responsive breakpoints**: 480px, 767px, 991px, 1024px, 1199px, 1400px
- **Glassmorphism**: `backdrop-filter` effects throughout UI

### Component Styling
- `home.css`: Landing page with grid animations and 3D carousel
- `info-panel-styles.css`: Popup panels with suggestion cards
- `navigation-styles.css`: Navigation panel with astronef font integration

## Key Features & Implementation

### Suggestions System
- **Algorithm**: Random selection from same category, fallback to other categories
- **Event handling**: Click handlers for fly-to animations
- **Template rendering**: Dynamic HTML generation with suggestion cards

### 3D Carousel
- **Three.js scene**: Circular card layout with depth effects
- **Interaction**: Swipe, drag, and scroll controls with velocity damping
- **Visual effects**: Scaling, opacity, and floating animations based on position

### Navigation & Routing
- **Route planning**: Integration with routing services
- **Real-time updates**: Live position tracking and ETA calculations
- **Mobile optimization**: Touch gestures and responsive panels

## Performance Considerations

- **Lazy loading**: Components initialized only when needed
- **Memory management**: Proper cleanup in manager destructors
- **Animation optimization**: `will-change` CSS property and requestAnimationFrame
- **Asset versioning**: Query parameters for cache busting (`?v=1.1`)

## Common Development Patterns

### Adding New Locations
1. Add GeoJSON feature to appropriate `/src/data/*.json` file
2. Follow ID pattern: `category_number` (e.g., `cultuur_25`)
3. Include required properties: name, category, address, description

### Template System Usage
- Templates use `{{property}}` for escaped content and `{{{property}}}` for raw HTML  
- Conditional blocks: `{{if condition}}...{{endif}}`
- Templates are cached for performance

### Event System
- Cross-component communication via custom events
- Likes synchronization across pages using `storage` events
- Manager lifecycle events for cleanup and initialization

## Deployment Notes

- **GitHub Pages**: Automatic deployment from `gh-pages` branch
- **Live URL**: https://artwalters.github.io/HD/
- **No server-side code**: Pure client-side application
- **External dependencies**: All loaded via CDN (no npm/bundling)