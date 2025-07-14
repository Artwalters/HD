// ==============================
// LIKES MANAGER MODULE
// ==============================

class LikesManager {
    constructor() {
        this.storageKey = 'heerlen-doen-likes';
        this.likes = new Set();
        this.callbacks = [];
        this.loadLikes();
    }

    /**
     * Initialiseert likes systeem
     */
    initialize() {
        this.loadLikes();
        this.setupEventListeners();
        console.log(`✅ Likes Manager geïnitialiseerd: ${this.likes.size} likes geladen`);
    }
    
    /**
     * Setup event listeners for likes synchronization
     */
    setupEventListeners() {
        // Listen for likes changes from preferences
        window.addEventListener('likesChanged', (event) => {
            console.log('🔄 Received likes changed event:', event.detail);
            this.syncWithPreferences(event.detail);
        });
    }
    
    /**
     * Synchronize likes with preferences data
     */
    syncWithPreferences(preferencesData) {
        if (preferencesData && preferencesData.likes) {
            // Convert to Set with normalized IDs
            const newLikes = new Set(preferencesData.likes.map(id => String(id)));
            
            // Check if there are changes
            const currentLikes = new Set(Array.from(this.likes));
            const hasChanges = newLikes.size !== currentLikes.size || 
                             ![...newLikes].every(id => currentLikes.has(id));
            
            if (hasChanges) {
                this.likes = newLikes;
                this.saveLikes();
                console.log(`🔄 Synced likes from preferences: ${this.likes.size} likes`);
                
                // Notify all callbacks about the change
                this.likes.forEach(id => {
                    this.notifyCallbacks(id, true);
                });
            }
        }
    }

    /**
     * Laadt likes uit localStorage
     */
    loadLikes() {
        try {
            // Load from primary storage
            const savedLikes = localStorage.getItem(this.storageKey);
            
            // Also check legacy storage for backward compatibility
            const legacyLikes = localStorage.getItem('likedLocations');
            
            const allLikes = new Set();
            
            if (savedLikes) {
                const likesArray = JSON.parse(savedLikes);
                likesArray.forEach(id => allLikes.add(String(id)));
            }
            
            if (legacyLikes) {
                const legacyArray = JSON.parse(legacyLikes);
                legacyArray.forEach(id => allLikes.add(String(id)));
            }
            
            this.likes = allLikes;
            
            // Save unified likes back to storage
            if (allLikes.size > 0) {
                this.saveLikes();
            }
            
        } catch (error) {
            console.warn('⚠️ Kon likes niet laden uit localStorage:', error);
            this.likes = new Set();
        }
    }

    /**
     * Slaat likes op in localStorage
     */
    saveLikes() {
        try {
            const likesArray = Array.from(this.likes);
            localStorage.setItem(this.storageKey, JSON.stringify(likesArray));
            
            // Also save to legacy storage for backward compatibility
            localStorage.setItem('likedLocations', JSON.stringify(likesArray));
        } catch (error) {
            console.error('❌ Kon likes niet opslaan:', error);
        }
    }

    /**
     * Voegt like toe of verwijdert deze
     * @param {string|number} locationId - ID van de locatie (composite ID zoals "cultuur_1" of legacy nummer)
     * @returns {boolean} - True als liked, false als unliked
     */
    toggleLike(locationId) {
        // Ensure we work with string IDs for consistency
        const normalizedId = String(locationId);
        console.log('🔍 toggleLike called with ID:', locationId, '→ normalized:', normalizedId, 'type:', typeof normalizedId);
        
        const wasLiked = this.likes.has(normalizedId);
        console.log('🔍 Was liked?', wasLiked);
        console.log('🔍 Current likes Set:', Array.from(this.likes));
        
        if (wasLiked) {
            this.likes.delete(normalizedId);
            console.log(`💔 Locatie ${normalizedId} unliked`);
        } else {
            this.likes.add(normalizedId);
            console.log(`❤️ Locatie ${normalizedId} liked`);
        }

        console.log('🔍 New likes Set:', Array.from(this.likes));
        
        this.saveLikes();
        this.notifyCallbacks(normalizedId, !wasLiked);
        
        return !wasLiked;
    }

    /**
     * Checkt of locatie liked is
     * @param {string|number} locationId - ID van de locatie (composite ID zoals "cultuur_1" of legacy nummer)
     * @returns {boolean} - True als liked
     */
    isLiked(locationId) {
        const normalizedId = String(locationId);
        return this.likes.has(normalizedId);
    }

    /**
     * Krijgt alle liked locatie IDs
     * @returns {Array} - Array van liked IDs
     */
    getLikedIds() {
        return Array.from(this.likes);
    }

    /**
     * Krijgt aantal likes
     * @returns {number} - Aantal likes
     */
    getLikesCount() {
        return this.likes.size;
    }

    /**
     * Krijgt liked locaties met volledige data
     * @param {Object} allData - Alle locatie data
     * @returns {Array} - Array van liked locaties
     */
    getLikedLocations(allData) {
        if (!allData || !allData.features) return [];

        return allData.features.filter(feature => {
            const locationId = feature.properties.id;
            const isLiked = this.isLiked(locationId);
            console.log(`🔍 Checking feature ${feature.properties.name} (ID: ${locationId}): liked = ${isLiked}`);
            return isLiked;
        });
    }

    /**
     * Voegt callback toe voor like changes
     * @param {Function} callback - Callback functie
     */
    addCallback(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Verwijdert callback
     * @param {Function} callback - Callback functie
     */
    removeCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

    /**
     * Notificeert alle callbacks over like changes
     * @param {string|number} locationId - ID van de locatie
     * @param {boolean} isLiked - Nieuwe like status
     */
    notifyCallbacks(locationId, isLiked) {
        this.callbacks.forEach(callback => {
            try {
                callback(locationId, isLiked);
            } catch (error) {
                console.error('❌ Fout in like callback:', error);
            }
        });
    }

    /**
     * Exporteert likes data
     * @returns {Object} - Likes data voor export
     */
    exportLikes() {
        return {
            likes: Array.from(this.likes),
            count: this.likes.size,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Importeert likes data
     * @param {Object} likesData - Likes data om te importeren
     */
    importLikes(likesData) {
        try {
            if (likesData && Array.isArray(likesData.likes)) {
                this.likes = new Set(likesData.likes);
                this.saveLikes();
                console.log(`✅ ${this.likes.size} likes geïmporteerd`);
                
                // Notificeer over alle changes
                this.likes.forEach(locationId => {
                    this.notifyCallbacks(locationId, true);
                });
            }
        } catch (error) {
            console.error('❌ Kon likes niet importeren:', error);
        }
    }

    /**
     * Wist alle likes
     */
    clearAllLikes() {
        const oldLikes = Array.from(this.likes);
        this.likes.clear();
        this.saveLikes();
        
        // Notificeer over alle removals
        oldLikes.forEach(locationId => {
            this.notifyCallbacks(locationId, false);
        });
        
        console.log('🗑️ Alle likes gewist');
    }

    /**
     * Krijgt statistieken over likes
     * @param {Object} allData - Alle locatie data
     * @returns {Object} - Like statistieken
     */
    getStats(allData) {
        if (!allData || !allData.features) {
            return {
                total: this.likes.size,
                byCategory: {}
            };
        }

        const stats = {
            total: this.likes.size,
            byCategory: {}
        };

        // Tel likes per categorie
        allData.features.forEach(feature => {
            if (this.isLiked(feature.properties.id)) {
                const category = feature.properties.category;
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            }
        });

        return stats;
    }
}

// Export voor gebruik in andere modules
window.LikesManager = LikesManager;