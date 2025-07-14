## FEATURE: HeerlenDoen - Persoonlijke Dagplanner voor Heerlen

HeerlenDoen is een interactieve webapp die bezoekers en inwoners van Heerlen helpt om hun perfecte dag te plannen. Het platform biedt een gepersonaliseerde ervaring waarbij gebruikers hun voorkeuren kunnen aangeven en vervolgens een op maat gemaakte route door de stad kunnen samenstellen.

### Kernfunctionaliteit:

1. **Activiteiten Selectie (Homepage)**
   - Overzichtelijke cards voor verschillende categorieën (Cultuur, Horeca, Mode, etc.)
   - Gebruikers kiezen hun interessegebieden voor de dag
   - Visueel aantrekkelijke presentatie met categorie-specifieke afbeeldingen

2. **Persoonlijke Voorkeuren Interface**
   - Na categorie selectie: swipe/like interface
   - Gebruikers geven aan wat ze wel/niet leuk vinden
   - Tinder-achtige UI voor snelle beslissingen
   - Opbouw van persoonlijk profiel voor de dag

3. **Gepersonaliseerde Kaart**
   - Alle gelikete ondernemingen worden gehighlight
   - Extra visuele nadruk op favoriete locaties
   - Minder interessante locaties worden subtiel weergegeven
   - Real-time navigatie naar gekozen bestemmingen

4. **Dagplanning & Opslag**
   - Gebruikers kunnen hun route opslaan
   - Mogelijkheid om later terug te keren naar plan
   - Flexibel aanpassen tijdens de dag
   - Nieuwe activiteiten toevoegen vanaf de kaart

## EXAMPLES:

### User Journey Voorbeeld:
1. **Start**: Gebruiker opent HeerlenDoen
2. **Keuze**: Selecteert "Cultuur" en "Horeca" cards
3. **Personalisatie**: 
   - Liked: Schunck Museum, Theater Heerlen, Restaurant Mes Amis
   - Disliked: Kleine galerijen, fastfood ketens
4. **Kaart**: Ziet gepersonaliseerde kaart met highlights op gelikete locaties
5. **Planning**: Stelt route samen: Museum → Lunch → Theater
6. **Opslag**: Slaat "Culturele Zaterdag" plan op

### Interface Voorbeelden:
- **Homepage**: Grid van categorie cards met hover effecten
- **Like Interface**: Full-screen cards met afbeelding, naam, korte beschrijving
- **Kaart**: 3D markers voor favorieten, standaard markers voor rest

## DOCUMENTATION:

### Technische Documentatie:
- Mapbox GL JS documentatie voor kaart functionaliteit
- LocalStorage API voor opslag van gebruikersvoorkeuren
- GeoJSON specificaties voor data structuur
- Web Animations API voor smooth transitions

### Data Bronnen:
- `cultuur.json` - Musea, theaters, galerijen
- `horeca.json` - Restaurants, cafés, bars
- `mode.json` - Winkels, boutiques
- Toekomstig: sport.json, evenementen.json, wellness.json

### UI/UX Referenties:
- Material Design cards patterns
- Tinder swipe mechanisme
- Google Maps highlight patterns
- Progressive disclosure principes

## OTHER CONSIDERATIONS:

### Gebruikerservaring:
- **Onboarding**: Minimaal, gebruikers moeten direct kunnen starten
- **Sessie Management**: Voorkeuren blijven behouden tijdens sessie
- **Gastgebruik**: Geen account nodig voor basis functionaliteit
- **Performance**: Snelle laadtijden, vooral op mobiel

### Technische Vereisten:
- **Responsive**: Mobile-first design
- **Offline Capable**: Basis functionaliteit zonder internet
- **Accessibility**: WCAG 2.1 AA compliant
- **Browser Support**: Moderne browsers (laatste 2 versies)

### Privacy & Data:
- Gebruikersvoorkeuren alleen lokaal opgeslagen
- Geen tracking zonder toestemming
- Optioneel: Account voor cross-device sync
- GDPR compliant

### Uitbreidingsmogelijkheden:
- Social sharing van dagplannen
- Groepsplanning functionaliteit
- Evenementen integratie
- Reviews en ratings
- AR navigatie mode
- Seizoensgebonden suggesties

### Development Prioriteiten:
1. Basis card selectie interface
2. Like/dislike functionaliteit
3. Kaart met highlighting
4. Navigatie integratie
5. Opslag functionaliteit
6. Polish & optimalisatie