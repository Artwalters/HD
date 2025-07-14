# Claude Context Instructions - HeerlenDoen Project

## 🎯 Project Overview
**Always read these files at the start of every conversation:**
- `INITIAL.md` - Core feature specifications and user journey
- `README.md` - Technical implementation and current features
- This file (`CLAUDE.md`) - Development guidelines

## 🏗️ Project Architecture

### Core Concept
HeerlenDoen is een persoonlijke dagplanner webapp voor Heerlen bezoekers. De flow is:
1. **Homepage**: Categorie cards selectie (Cultuur, Horeca, Mode, etc.)
2. **Preferences**: Like/dislike interface voor personalisatie
3. **Map**: Gepersonaliseerde kaart met highlighted favorieten
4. **Planning**: Route samenstellen en opslaan

### Current Implementation
- **3D Interactieve kaart** met Mapbox GL JS en Three.js
- **Like systeem** met persistent storage
- **Navigatie** met meerdere vervoersmodi
- **Info panels** met suggesties functionaliteit

## 📁 Project Structure Awareness

### Key Directories
```
src/
├── managers/        # Business logic (ALWAYS check existing managers first)
├── data/           # GeoJSON data files
├── templates/      # HTML templates for UI components
├── styles/         # Component-specific CSS files
└── utils/          # Helper functions and utilities
```

### Important Files
- `index.html` - Main entry point with all script includes
- `likes.html` - Favorites overview page
- `src/config/config.js` - Central configuration

## 🔧 Development Guidelines

### Before Starting Any Task
1. **Check existing code** - Always search for existing implementations
2. **Read relevant managers** - Understand current architecture
3. **Follow patterns** - Match existing code style and structure

### Code Conventions
- **JavaScript**: ES6+ modules, camelCase
- **CSS**: BEM methodology, kebab-case classes
- **No external frameworks**: Vanilla JS only (except Mapbox/Three.js)
- **Mobile-first**: Always consider mobile UX

### Feature Implementation Order
When implementing the dagplanner features:
1. Create homepage with category cards
2. Build like/dislike swipe interface
3. Enhance map highlighting for liked locations
4. Add route planning functionality
5. Implement save/load dagplan feature

## 🚫 Important Constraints

### Never Do
- Add unnecessary dependencies
- Create files > 500 lines
- Break existing functionality
- Use jQuery or other UI frameworks
- Implement features not in INITIAL.md without discussion

### Always Do
- Test on mobile viewport
- Maintain Dutch language for UI
- Keep localStorage for persistence
- Follow existing manager patterns
- Update this file when adding major features

## 🧪 Testing Approach
- Manual testing via local server
- Check console for errors
- Test all viewports (mobile/tablet/desktop)
- Verify offline functionality

## 📝 Task Tracking
When working on features:
1. Use TodoWrite tool for task management
2. Break down complex features into subtasks
3. Mark tasks complete immediately after finishing
4. Document any discovered issues

## 🎨 UI/UX Principles
- **Snelle interacties**: Instant feedback
- **Duidelijke hierarchie**: Important actions prominent
- **Minimaal design**: Focus on content
- **Touch-friendly**: Large tap targets for mobile

## 🔄 Data Format
Always maintain GeoJSON structure:
```json
{
  "properties": {
    "id": number,
    "name": string,
    "category": string,
    "description": string,
    "tags": array,
    "image": string,
    "phone": string,
    "website": string,
    "openingHours": object
  }
}
```

## 💡 Current Development Focus
Transform the existing map application into a personalized day planner:
- Homepage with activity selection
- Preference learning interface
- Enhanced map visualization for personal routes
- Save and share functionality

---
**Remember**: This is a tool for Heerlen visitors to plan their perfect day. Every feature should support this core mission.