// ==============================
// AUDIO MANAGER MODULE - v1.0
// ==============================

class AudioManager {
    constructor(config) {
        this.config = config;
        this.isEnabled = true;
        this.volume = 0.8;
        this.rate = 0.9;
        this.pitch = 1.0;
        this.voice = null;
        this.isSpeaking = false;
        this.speechQueue = [];
        this.lastSpokenInstruction = null;
        this.lastSpokenTime = 0;
        this.minSpeechInterval = 3000; // Minimum 3 seconds between instructions
        
        this.initialize();
    }

    /**
     * Initialiseert de audio manager
     */
    initialize() {
        this.checkSpeechSupport();
        this.loadVoices();
        this.setupEventListeners();
        
        console.log('🔊 Audio Manager geïnitialiseerd');
    }

    /**
     * Controleert of speech synthesis ondersteund wordt
     */
    checkSpeechSupport() {
        if (!window.speechSynthesis) {
            console.warn('⚠️ Speech Synthesis wordt niet ondersteund door deze browser');
            this.isEnabled = false;
            return false;
        }
        return true;
    }

    /**
     * Laadt beschikbare stemmen
     */
    loadVoices() {
        if (!this.checkSpeechSupport()) return;

        const loadVoicesAsync = () => {
            const voices = speechSynthesis.getVoices();
            
            // Zoek Nederlandse stem
            this.voice = voices.find(voice => 
                voice.lang.includes('nl') || 
                voice.lang.includes('NL')
            ) || voices[0]; // Fallback naar eerste beschikbare stem

            if (this.voice) {
                console.log(`🎙️ Stem geladen: ${this.voice.name} (${this.voice.lang})`);
            }
        };

        // Stemmen worden asynchroon geladen
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener('voiceschanged', loadVoicesAsync, { once: true });
        } else {
            loadVoicesAsync();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for speech events
        document.addEventListener('speechstart', () => {
            this.isSpeaking = true;
        });

        document.addEventListener('speechend', () => {
            this.isSpeaking = false;
            this.processQueue();
        });
    }

    /**
     * Spreek een bericht uit
     */
    speak(message, priority = 'normal', skipDuplicateCheck = false) {
        if (!this.isEnabled || !this.checkSpeechSupport()) {
            return Promise.resolve();
        }

        // Check voor duplicaat instructies
        if (!skipDuplicateCheck && this.isDuplicateInstruction(message)) {
            console.log('🔇 Duplicate instruction skipped:', message);
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const instruction = {
                message,
                priority,
                resolve,
                reject,
                timestamp: Date.now()
            };

            if (priority === 'urgent') {
                // Stop huidige speech en spreek urgent bericht direct
                this.clearQueue();
                speechSynthesis.cancel();
                this.speakInstruction(instruction);
            } else {
                // Voeg toe aan queue
                this.speechQueue.push(instruction);
                this.processQueue();
            }
        });
    }

    /**
     * Check of instructie een duplicaat is
     */
    isDuplicateInstruction(message) {
        const now = Date.now();
        
        if (this.lastSpokenInstruction === message && 
            (now - this.lastSpokenTime) < this.minSpeechInterval) {
            return true;
        }
        
        return false;
    }

    /**
     * Verwerk speech queue
     */
    processQueue() {
        if (this.isSpeaking || this.speechQueue.length === 0) {
            return;
        }

        const instruction = this.speechQueue.shift();
        this.speakInstruction(instruction);
    }

    /**
     * Spreek een specifieke instructie uit
     */
    speakInstruction(instruction) {
        if (!this.checkSpeechSupport()) {
            instruction.reject(new Error('Speech not supported'));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(instruction.message);
        
        // Configureer utterance
        utterance.voice = this.voice;
        utterance.volume = this.volume;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        utterance.lang = 'nl-NL';

        // Event listeners
        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('🗣️ Speaking:', instruction.message);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.lastSpokenInstruction = instruction.message;
            this.lastSpokenTime = Date.now();
            instruction.resolve();
            this.processQueue();
        };

        utterance.onerror = (event) => {
            this.isSpeaking = false;
            console.error('❌ Speech error:', event.error);
            instruction.reject(new Error(event.error));
            this.processQueue();
        };

        // Start speech
        speechSynthesis.speak(utterance);
    }

    /**
     * Navigatie instructies
     */
    announceNavigation(instruction, distance = null) {
        let message = '';

        switch (instruction.type) {
            case 'localized':
                // Use the pre-translated instruction text directly
                message = instruction.text || 'Volg de route';
                break;
            case 'start':
                message = `Navigatie gestart naar ${instruction.destination}`;
                break;
            case 'turn-right':
                message = distance ? `Over ${this.formatDistance(distance)} rechtsaf` : 'Nu rechtsaf';
                break;
            case 'turn-left':
                message = distance ? `Over ${this.formatDistance(distance)} linksaf` : 'Nu linksaf';
                break;
            case 'continue':
                message = distance ? `Blijf rechtdoor voor ${this.formatDistance(distance)}` : 'Blijf rechtdoor';
                break;
            case 'arrive':
                message = `Je bent aangekomen bij ${instruction.destination}`;
                break;
            case 'recalculating':
                message = 'Route wordt herberekend';
                break;
            case 'off-route':
                message = 'Je wijkt af van de route. Route wordt herberekend';
                break;
            case 'gps-lost':
                message = 'GPS signaal verloren';
                break;
            case 'gps-found':
                message = 'GPS signaal hersteld';
                break;
            default:
                message = instruction.text || instruction.message || 'Volg de route';
        }

        const priority = ['start', 'arrive', 'off-route', 'recalculating'].includes(instruction.type) ? 'urgent' : 'normal';
        return this.speak(message, priority);
    }

    /**
     * Afstand updates
     */
    announceDistance(distance, eta = null) {
        let message = `Nog ${this.formatDistance(distance)} tot je bestemming`;
        
        if (eta) {
            message += `. Geschatte aankomsttijd: ${this.formatETA(eta)}`;
        }

        return this.speak(message, 'normal');
    }

    /**
     * Waarschuwingen
     */
    announceWarning(warning) {
        const warningMessages = {
            'speed-camera': 'Flitspaal gedetecteerd',
            'traffic-jam': 'File vooruit',
            'accident': 'Ongeval gemeld op je route',
            'road-closure': 'Wegafsluiting gedetecteerd',
            'alternative-route': 'Snellere route beschikbaar'
        };

        const message = warningMessages[warning.type] || warning.message || 'Waarschuwing';
        return this.speak(message, 'urgent');
    }

    /**
     * Format afstand voor spraak
     */
    formatDistance(meters) {
        if (meters < 100) {
            return `${Math.round(meters / 10) * 10} meter`;
        } else if (meters < 1000) {
            return `${Math.round(meters / 50) * 50} meter`;
        } else {
            const km = (meters / 1000).toFixed(1);
            return `${km} kilometer`;
        }
    }

    /**
     * Format ETA voor spraak
     */
    formatETA(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)} minuten`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = Math.round(minutes % 60);
            if (remainingMinutes === 0) {
                return `${hours} uur`;
            }
            return `${hours} uur en ${remainingMinutes} minuten`;
        }
    }

    /**
     * Stop alle speech
     */
    stopSpeaking() {
        speechSynthesis.cancel();
        this.clearQueue();
        this.isSpeaking = false;
    }

    /**
     * Leeg speech queue
     */
    clearQueue() {
        this.speechQueue.forEach(instruction => {
            instruction.reject(new Error('Speech cancelled'));
        });
        this.speechQueue = [];
    }

    /**
     * Zet audio aan/uit
     */
    toggleAudio() {
        this.isEnabled = !this.isEnabled;
        
        if (!this.isEnabled) {
            this.stopSpeaking();
        }
        
        console.log(`🔊 Audio ${this.isEnabled ? 'ingeschakeld' : 'uitgeschakeld'}`);
        return this.isEnabled;
    }

    /**
     * Zet volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 Volume ingesteld op ${Math.round(this.volume * 100)}%`);
    }

    /**
     * Zet spraaksnelheid
     */
    setRate(rate) {
        this.rate = Math.max(0.5, Math.min(2, rate));
        console.log(`🗣️ Spraaksnelheid ingesteld op ${this.rate}`);
    }

    /**
     * Test spraak functionaliteit
     */
    testSpeech() {
        return this.speak('Audio test succesvol', 'urgent', true);
    }

    /**
     * Krijg audio status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            supported: this.checkSpeechSupport(),
            speaking: this.isSpeaking,
            volume: this.volume,
            rate: this.rate,
            voice: this.voice ? this.voice.name : null,
            queueLength: this.speechQueue.length
        };
    }

    /**
     * Cleanup audio manager
     */
    destroy() {
        this.stopSpeaking();
        this.isEnabled = false;
        console.log('🗑️ Audio manager vernietigd');
    }
}

// Export voor gebruik in andere modules
window.AudioManager = AudioManager;