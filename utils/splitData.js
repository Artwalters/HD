// ==============================
// DATA SPLITTER UTILITY
// ==============================
// Dit script splitst businesses.json op in categorie-specifieke bestanden

const fs = require('fs');
const path = require('path');

// Lees de hoofddata file
const businessesData = JSON.parse(fs.readFileSync('../businesses.json', 'utf8'));

// Groepeer features per categorie
const categorizedData = {};

businessesData.features.forEach(feature => {
    const category = feature.properties.category;
    
    if (!categorizedData[category]) {
        categorizedData[category] = {
            type: "FeatureCollection",
            features: []
        };
    }
    
    categorizedData[category].features.push(feature);
});

// Maak data directory als deze niet bestaat
const dataDir = '../data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Schrijf elk categorie naar eigen bestand
Object.keys(categorizedData).forEach(category => {
    const filename = category.toLowerCase().replace(/[^a-z0-9]/g, '') + '.json';
    const filepath = path.join(dataDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(categorizedData[category], null, 2));
    console.log(`✅ ${category}: ${categorizedData[category].features.length} items → ${filename}`);
});

console.log('\n🎉 Data successvol opgesplitst!');
console.log('📁 Bestanden aangemaakt in /data/ directory');