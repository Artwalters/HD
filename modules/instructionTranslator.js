// ==============================
// INSTRUCTION TRANSLATOR MODULE - v1.0
// ==============================

class InstructionTranslator {
    constructor() {
        // Mapbox maneuver types to Dutch translations
        this.maneuverTranslations = {
            // Turn maneuvers
            'turn-right': 'rechtsaf',
            'turn-left': 'linksaf',
            'turn-slight-right': 'iets rechtsaf',
            'turn-slight-left': 'iets linksaf',
            'turn-sharp-right': 'scherp rechtsaf',
            'turn-sharp-left': 'scherp linksaf',
            
            // Continue/straight
            'continue': 'rechtdoor',
            'straight': 'rechtdoor',
            
            // Roundabout
            'roundabout-right': 'rotonde rechtsaf',
            'roundabout-left': 'rotonde linksaf',
            'roundabout-straight': 'rotonde rechtdoor',
            'roundabout': 'de rotonde',
            
            // Merge/fork
            'merge-right': 'voeg rechts in',
            'merge-left': 'voeg links in',
            'fork-right': 'rechts aanhouden',
            'fork-left': 'links aanhouden',
            
            // Ramp/exit
            'on-ramp': 'de oprit op',
            'off-ramp': 'de afrit nemen',
            'exit-right': 'afslag rechts',
            'exit-left': 'afslag links',
            
            // Arrival
            'arrive': 'aangekomen',
            'destination': 'bestemming',
            
            // Default
            'default': 'volg de route'
        };
        
        // Distance formatting
        this.distanceThresholds = {
            roundToNearest: {
                10: [0, 100],      // 0-100m: round to nearest 10m
                50: [100, 1000],   // 100m-1km: round to nearest 50m
                100: [1000, 5000], // 1-5km: round to nearest 100m
                500: [5000, Infinity] // 5km+: round to nearest 500m
            }
        };
    }

    /**
     * Generate localized instruction from Mapbox step
     */
    generateLocalizedInstruction(step, distance = null) {
        if (!step) return 'Volg de route';
        
        const maneuver = step.maneuver;
        const streetName = this.extractStreetName(step);
        const baseInstruction = this.translateManeuver(maneuver);
        
        // Create complete instruction
        let instruction = '';
        
        if (distance !== null) {
            const formattedDistance = this.formatDistance(distance);
            
            if (distance > 20) {
                // Future instruction with distance
                instruction = `Over ${formattedDistance} ${baseInstruction}`;
            } else {
                // Immediate instruction
                instruction = `Nu ${baseInstruction}`;
            }
        } else {
            // No distance context
            instruction = baseInstruction;
        }
        
        // Add street name if available and relevant
        if (streetName && this.shouldIncludeStreetName(maneuver)) {
            if (maneuver.type === 'arrive') {
                instruction += ` bij ${streetName}`;
            } else {
                instruction += ` naar ${streetName}`;
            }
        }
        
        return instruction;
    }
    
    /**
     * Translate Mapbox maneuver to Dutch
     */
    translateManeuver(maneuver) {
        if (!maneuver || !maneuver.type) {
            return this.maneuverTranslations.default;
        }
        
        let maneuverType = maneuver.type;
        
        // Handle compound maneuver types
        if (maneuver.modifier) {
            const compound = `${maneuverType}-${maneuver.modifier}`;
            if (this.maneuverTranslations[compound]) {
                return this.maneuverTranslations[compound];
            }
        }
        
        // Handle roundabout with exit number
        if (maneuverType === 'roundabout' || maneuverType.includes('roundabout')) {
            const exitNumber = maneuver.exit;
            if (exitNumber) {
                return `neem de ${this.formatOrdinal(exitNumber)} afslag bij de rotonde`;
            }
        }
        
        // Use base maneuver type
        return this.maneuverTranslations[maneuverType] || this.maneuverTranslations.default;
    }
    
    /**
     * Extract street name from step instruction
     */
    extractStreetName(step) {
        // Try to get street name from step properties
        if (step.name && step.name !== '') {
            return step.name;
        }
        
        // Try to extract from Mapbox instruction
        if (step.maneuver && step.maneuver.instruction) {
            const instruction = step.maneuver.instruction;
            
            // Look for "onto StreetName" pattern
            const ontoMatch = instruction.match(/onto (.+)/i);
            if (ontoMatch) {
                return ontoMatch[1];
            }
            
            // Look for "on StreetName" pattern
            const onMatch = instruction.match(/on (.+)/i);
            if (onMatch) {
                return onMatch[1];
            }
        }
        
        return null;
    }
    
    /**
     * Check if street name should be included for this maneuver type
     */
    shouldIncludeStreetName(maneuver) {
        if (!maneuver || !maneuver.type) return false;
        
        const includeStreetTypes = [
            'turn-right', 'turn-left', 
            'turn-slight-right', 'turn-slight-left',
            'turn-sharp-right', 'turn-sharp-left',
            'continue', 'straight',
            'arrive'
        ];
        
        return includeStreetTypes.includes(maneuver.type);
    }
    
    /**
     * Format distance for speech and display
     */
    formatDistance(meters) {
        if (meters < 100) {
            // Round to nearest 10m for short distances
            const rounded = Math.round(meters / 10) * 10;
            return `${rounded} meter`;
        } else if (meters < 1000) {
            // Round to nearest 50m for medium distances
            const rounded = Math.round(meters / 50) * 50;
            return `${rounded} meter`;
        } else {
            // Convert to kilometers for long distances
            const km = (meters / 1000).toFixed(1);
            return `${km} kilometer`;
        }
    }
    
    /**
     * Format ordinal numbers in Dutch
     */
    formatOrdinal(number) {
        const ordinals = {
            1: 'eerste',
            2: 'tweede', 
            3: 'derde',
            4: 'vierde',
            5: 'vijfde',
            6: 'zesde',
            7: 'zevende',
            8: 'achtste',
            9: 'negende',
            10: 'tiende'
        };
        
        return ordinals[number] || `${number}e`;
    }
    
    /**
     * Generate instruction for specific navigation events
     */
    generateEventInstruction(eventType, data = {}) {
        switch (eventType) {
            case 'navigation-start':
                return `Navigatie gestart naar ${data.destination || 'de bestemming'}`;
                
            case 'route-recalculating':
                return 'Route wordt herberekend';
                
            case 'off-route':
                return 'Je wijkt af van de route. Route wordt herberekend';
                
            case 'arrival':
                return `Je bent aangekomen bij ${data.destination || 'de bestemming'}`;
                
            case 'gps-lost':
                return 'GPS signaal verloren';
                
            case 'gps-found':
                return 'GPS signaal hersteld';
                
            case 'continue-route':
                const distance = data.distance ? this.formatDistance(data.distance) : '';
                return distance ? `Blijf rechtdoor voor ${distance}` : 'Blijf rechtdoor';
                
            default:
                return 'Volg de route';
        }
    }
    
    /**
     * Convert Mapbox instruction to localized instruction
     */
    convertMapboxInstruction(mapboxInstruction, distance = null) {
        if (!mapboxInstruction) return 'Volg de route';
        
        // Extract action and street name from Mapbox instruction
        const instruction = mapboxInstruction.toLowerCase();
        
        // Simple pattern matching for common Mapbox instructions
        if (instruction.includes('turn right')) {
            const streetMatch = mapboxInstruction.match(/onto (.+)/i);
            const streetName = streetMatch ? streetMatch[1] : null;
            const action = distance ? `Over ${this.formatDistance(distance)} rechtsaf` : 'Nu rechtsaf';
            return streetName ? `${action} naar ${streetName}` : action;
        }
        
        if (instruction.includes('turn left')) {
            const streetMatch = mapboxInstruction.match(/onto (.+)/i);
            const streetName = streetMatch ? streetMatch[1] : null;
            const action = distance ? `Over ${this.formatDistance(distance)} linksaf` : 'Nu linksaf';
            return streetName ? `${action} naar ${streetName}` : action;
        }
        
        if (instruction.includes('continue') || instruction.includes('straight')) {
            const streetMatch = mapboxInstruction.match(/on (.+)/i);
            const streetName = streetMatch ? streetMatch[1] : null;
            const action = distance ? `Blijf rechtdoor voor ${this.formatDistance(distance)}` : 'Blijf rechtdoor';
            return streetName ? `${action} op ${streetName}` : action;
        }
        
        if (instruction.includes('arrive')) {
            return 'Je bent aangekomen bij de bestemming';
        }
        
        // Fallback: return original instruction
        return mapboxInstruction;
    }
    
    /**
     * Get localized instruction for current navigation step
     */
    getCurrentStepInstruction(step, distanceToStep = null) {
        if (!step) return null;
        
        return {
            text: this.generateLocalizedInstruction(step, distanceToStep),
            maneuver: step.maneuver?.type || 'continue',
            distance: distanceToStep,
            streetName: this.extractStreetName(step)
        };
    }
}

// Export for use in other modules
window.InstructionTranslator = InstructionTranslator;