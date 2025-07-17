// ==========================================
// ORIENTATION UTILITIES - CROSS-PLATFORM COMPASS
// Based on 2024 best practices for iOS and Android
// ==========================================

class OrientationUtils {
    constructor() {
        this.isSupported = false;
        this.hasPermission = false;
        this.isListening = false;
        this.currentHeading = 0;
        this.callbacks = [];
        this.lastUpdateTime = 0;
        this.smoothingFactor = 0.3;
        this.lastSmoothedHeading = 0;
        
        // Platform detection
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        console.log('🧭 OrientationUtils initialized:', {
            isIOS: this.isIOS,
            isAndroid: this.isAndroid,
            isSafari: this.isSafari
        });
    }

    /**
     * Initialize orientation tracking with comprehensive platform support
     */
    async initialize() {
        console.log('🚀 Initializing orientation tracking...');
        
        // Check if device orientation is supported
        if (!this.checkSupport()) {
            console.error('❌ Device orientation not supported');
            return false;
        }

        // Request permissions if needed
        if (!await this.requestPermissions()) {
            console.error('❌ Orientation permissions denied');
            return false;
        }

        // Start listening for orientation changes
        this.startListening();
        
        return true;
    }

    /**
     * Check if device orientation is supported
     */
    checkSupport() {
        // Check for basic DeviceOrientationEvent support
        if (typeof DeviceOrientationEvent === 'undefined') {
            console.warn('⚠️ DeviceOrientationEvent not supported');
            return false;
        }

        // Check for HTTPS requirement
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('⚠️ HTTPS required for device orientation');
            return false;
        }

        this.isSupported = true;
        return true;
    }

    /**
     * Check current permission status using Permissions API (when available)
     */
    async checkPermissionStatus() {
        // Check if Permissions API is available (Safari 16+, Chrome, Firefox)
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'gyroscope' });
                console.log('🔍 Gyroscope permission status:', result.state);
                return result.state; // 'granted', 'denied', or 'prompt'
            } catch (error) {
                console.log('⚠️ Permissions API not available for gyroscope, assuming prompt');
                return 'prompt';
            }
        }
        
        // Fallback for browsers without Permissions API
        return 'prompt';
    }

    /**
     * Request necessary permissions for device orientation
     */
    async requestPermissions() {
        console.log('🔐 Requesting orientation permissions...');
        
        // Check current permission status first
        const permissionStatus = await this.checkPermissionStatus();
        console.log('📋 Current permission status:', permissionStatus);
        
        if (permissionStatus === 'granted') {
            this.hasPermission = true;
            return true;
        }
        
        if (permissionStatus === 'denied') {
            console.log('❌ Orientation permission previously denied');
            this.showPermissionDeniedMessage();
            return false;
        }

        // iOS 13+ requires explicit permission request
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                console.log('📱 Requesting iOS DeviceOrientation permission...');
                const permission = await DeviceOrientationEvent.requestPermission();
                console.log('📱 iOS permission result:', permission);
                
                if (permission === 'granted') {
                    this.hasPermission = true;
                    return true;
                } else {
                    console.error('❌ iOS orientation permission denied');
                    this.showPermissionDeniedMessage();
                    return false;
                }
            } catch (error) {
                console.error('❌ Error requesting iOS permission:', error);
                // Some older iOS versions might not support requestPermission
                // Fall through to assume permission granted
                console.log('🔄 Falling back to legacy iOS orientation support');
                this.hasPermission = true;
                return true;
            }
        }

        // Android and other browsers - no explicit permission needed for DeviceOrientation
        this.hasPermission = true;
        return true;
    }

    /**
     * Show user-friendly message when permission is denied
     */
    showPermissionDeniedMessage() {
        console.log('💡 Showing permission denied guidance...');
        
        // Could be replaced with a better UI notification
        if (this.isIOS) {
            alert(
                'Kompas functionaliteit is uitgeschakeld.\n\n' +
                'Om de kompas richting te zien:\n' +
                '1. Ga naar Safari Instellingen\n' +
                '2. Kies "Motion & Orientation Access"\n' +
                '3. Schakel toegang in voor deze website\n' +
                '4. Herlaad de pagina'
            );
        } else {
            alert(
                'Kompas functionaliteit is uitgeschakeld.\n\n' +
                'Om de kompas richting te zien, vernieuw de pagina en ' +
                'sta toegang toe wanneer daarom gevraagd wordt.'
            );
        }
    }

    /**
     * Start listening for orientation changes with comprehensive event handling
     */
    startListening() {
        if (this.isListening) {
            console.log('⚠️ Already listening for orientation changes');
            return;
        }

        console.log('👂 Starting orientation listeners...');
        
        // iOS Safari approach
        if (this.isIOS || this.isSafari) {
            // Use regular deviceorientation event for iOS
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), true);
            console.log('📱 Added iOS deviceorientation listener');
        }
        
        // Android/Chrome approach - use absolute orientation if available
        if (this.isAndroid || !this.isIOS) {
            // Try deviceorientationabsolute first (more accurate for compass)
            window.addEventListener('deviceorientationabsolute', this.handleDeviceOrientationAbsolute.bind(this), true);
            console.log('🤖 Added Android deviceorientationabsolute listener');
        }
        
        // Fallback: regular deviceorientation for all browsers
        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), true);
        console.log('🌐 Added fallback deviceorientation listener');
        
        this.isListening = true;
        
        // Test with simulated data if no real orientation detected after 3 seconds
        setTimeout(() => {
            if (this.currentHeading === 0) {
                console.log('🔄 No real orientation detected, starting calibration test...');
                this.startCalibrationTest();
            }
        }, 3000);
    }

    /**
     * Handle deviceorientationabsolute event (Android/Chrome)
     */
    handleDeviceOrientationAbsolute(event) {
        if (!event.alpha && event.alpha !== 0) return;
        
        // For absolute orientation, alpha directly represents compass heading
        let heading = event.alpha;
        
        // Normalize to 0-360 range
        heading = (heading + 360) % 360;
        
        console.log(`🧭 Absolute orientation - Raw alpha: ${event.alpha}°, Heading: ${heading}°`);
        
        this.processHeading(heading, 'absolute');
    }

    /**
     * Handle deviceorientation event (iOS Safari and fallback)
     */
    handleDeviceOrientation(event) {
        if (!event.alpha && event.alpha !== 0) return;
        
        // Send raw data to debug panel
        if (window.OrientationDebug) {
            window.OrientationDebug.updateOrientationData(event);
        }
        
        let heading = 0;
        
        // iOS Safari: Use webkitCompassHeading if available (most accurate)
        if (event.webkitCompassHeading !== undefined) {
            heading = event.webkitCompassHeading;
            console.log(`🧭 iOS webkitCompassHeading: ${heading}°`);
        } else {
            // Fallback: Convert alpha to compass heading
            // For most browsers, north is 360 - alpha
            heading = (360 - event.alpha) % 360;
            console.log(`🧭 Calculated heading from alpha: ${event.alpha}° → ${heading}°`);
        }
        
        this.processHeading(heading, 'standard');
    }

    /**
     * Process and smooth heading data
     */
    processHeading(rawHeading, source) {
        // Throttle updates - only process every 100ms
        const now = Date.now();
        if (now - this.lastUpdateTime < 100) {
            return;
        }
        this.lastUpdateTime = now;

        // Smooth the heading to reduce jitter
        const smoothedHeading = this.smoothHeading(rawHeading);
        
        // Update current heading
        this.currentHeading = smoothedHeading;
        
        // Log significant changes
        const diff = Math.abs(smoothedHeading - this.lastSmoothedHeading);
        if (diff > 5) {
            console.log(`🧭 Heading update (${source}): ${smoothedHeading.toFixed(1)}° (raw: ${rawHeading.toFixed(1)}°)`);
            this.lastSmoothedHeading = smoothedHeading;
        }

        // Notify callbacks
        this.notifyCallbacks(smoothedHeading);
    }

    /**
     * Smooth heading values to reduce jitter
     */
    smoothHeading(newHeading) {
        if (this.currentHeading === 0) {
            return newHeading;
        }

        // Handle the circular nature of compass headings (0° = 360°)
        let difference = newHeading - this.currentHeading;
        
        // Normalize difference to [-180, 180]
        if (difference > 180) {
            difference -= 360;
        } else if (difference < -180) {
            difference += 360;
        }

        // Apply smoothing
        const smoothedDifference = difference * this.smoothingFactor;
        let smoothedHeading = this.currentHeading + smoothedDifference;
        
        // Normalize to [0, 360)
        smoothedHeading = (smoothedHeading + 360) % 360;
        
        return smoothedHeading;
    }

    /**
     * Start calibration test with rotating indicator
     */
    startCalibrationTest() {
        console.log('🔄 Starting orientation calibration test...');
        
        let testHeading = 0;
        const testInterval = setInterval(() => {
            this.currentHeading = testHeading;
            this.notifyCallbacks(testHeading);
            
            console.log(`🧭 Calibration test heading: ${testHeading}°`);
            
            testHeading = (testHeading + 15) % 360;
        }, 500);

        // Stop test after 10 seconds
        setTimeout(() => {
            clearInterval(testInterval);
            console.log('🛑 Calibration test completed');
        }, 10000);
    }

    /**
     * Add callback for orientation changes
     */
    onOrientationChange(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Remove callback
     */
    offOrientationChange(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

    /**
     * Notify all callbacks of heading change
     */
    notifyCallbacks(heading) {
        this.callbacks.forEach(callback => {
            try {
                callback(heading);
            } catch (error) {
                console.error('❌ Error in orientation callback:', error);
            }
        });
    }

    /**
     * Get current heading
     */
    getCurrentHeading() {
        return this.currentHeading;
    }

    /**
     * Check if orientation is supported
     */
    isOrientationSupported() {
        return this.isSupported;
    }

    /**
     * Check if permissions are granted
     */
    hasOrientationPermission() {
        return this.hasPermission;
    }

    /**
     * Stop listening for orientation changes
     */
    stopListening() {
        if (!this.isListening) return;

        console.log('🛑 Stopping orientation listeners...');
        
        window.removeEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        window.removeEventListener('deviceorientationabsolute', this.handleDeviceOrientationAbsolute.bind(this));
        
        this.isListening = false;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopListening();
        this.callbacks = [];
        console.log('🗑️ OrientationUtils destroyed');
    }
}

// Export as singleton
window.OrientationUtils = new OrientationUtils();
export default window.OrientationUtils;