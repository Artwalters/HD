// ==========================================
// SIMPLE ORIENTATION - DIRECT iOS PERMISSION FIX
// Minimale implementatie voor iPhone permission dialog
// ==========================================

class SimpleOrientation {
    constructor() {
        this.hasPermission = false;
        this.isTracking = false;
        this.currentHeading = 0;
        this.callbacks = [];
        
        // Platform detection
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        
        console.log('🧭 SimpleOrientation initialized - iOS:', this.isIOS);
    }

    /**
     * Request permission DIRECTLY in user gesture - no async/await between click and request
     */
    requestPermissionDirect() {
        console.log('🔒 Direct permission request starting...');
        
        // iOS requires direct call to requestPermission in user gesture
        if (this.isIOS && typeof DeviceOrientationEvent.requestPermission === 'function') {
            console.log('📱 Calling DeviceOrientationEvent.requestPermission() directly...');
            
            // DIRECT call - no await, no async wrapper
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    console.log('📱 iOS permission response:', response);
                    
                    if (response === 'granted') {
                        console.log('✅ Permission granted! Starting orientation tracking...');
                        this.hasPermission = true;
                        this.startListening();
                        alert('✅ Kompas ingeschakeld! Je ziet nu je kijkrichting op de kaart.');
                    } else {
                        console.log('❌ Permission denied');
                        alert('❌ Kompas toegang geweigerd. Ga naar Safari Instellingen > Motion & Orientation Access om dit in te schakelen.');
                        this.hasPermission = false;
                    }
                })
                .catch(error => {
                    console.error('❌ Permission request error:', error);
                    alert('❌ Fout bij kompas permission: ' + error.message);
                    this.hasPermission = false;
                });
        } else {
            // Android/desktop - no permission needed
            console.log('🤖 No permission needed for this platform');
            this.hasPermission = true;
            this.startListening();
            alert('✅ Kompas ingeschakeld!');
        }
    }

    /**
     * Start listening for orientation events
     */
    startListening() {
        if (this.isTracking) {
            console.log('⚠️ Already tracking orientation');
            return;
        }

        console.log('👂 Starting orientation listeners...');
        
        // iOS Safari - use regular deviceorientation
        if (this.isIOS) {
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), true);
            console.log('📱 iOS deviceorientation listener added');
        }
        
        // Android - try absolute first, then regular
        if (this.isAndroid) {
            window.addEventListener('deviceorientationabsolute', this.handleDeviceOrientationAbsolute.bind(this), true);
            console.log('🤖 Android deviceorientationabsolute listener added');
        }
        
        // Fallback for all platforms
        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), true);
        console.log('🌐 Fallback deviceorientation listener added');
        
        this.isTracking = true;
        
        // Test with fake data if no real data comes in
        setTimeout(() => {
            if (this.currentHeading === 0) {
                console.log('🔄 No real orientation data, starting test...');
                this.startTestMode();
            }
        }, 3000);
    }

    /**
     * Handle iOS deviceorientation event
     */
    handleDeviceOrientation(event) {
        if (!event.alpha && event.alpha !== 0) return;
        
        let heading = 0;
        
        // iOS: Use webkitCompassHeading if available
        if (event.webkitCompassHeading !== undefined) {
            heading = event.webkitCompassHeading;
            console.log(`🧭 iOS webkitCompassHeading: ${heading.toFixed(1)}°`);
        } else {
            // Fallback: calculate from alpha
            heading = (360 - event.alpha) % 360;
            console.log(`🧭 Calculated from alpha: ${event.alpha.toFixed(1)}° → ${heading.toFixed(1)}°`);
        }
        
        this.updateHeading(heading);
        
        // Debug info
        if (window.OrientationDebug) {
            window.OrientationDebug.updateOrientationData(event);
        }
    }

    /**
     * Handle Android deviceorientationabsolute event
     */
    handleDeviceOrientationAbsolute(event) {
        if (!event.alpha && event.alpha !== 0) return;
        
        const heading = (event.alpha + 360) % 360;
        console.log(`🧭 Android absolute: ${event.alpha.toFixed(1)}° → ${heading.toFixed(1)}°`);
        
        this.updateHeading(heading);
    }

    /**
     * Update current heading and notify callbacks
     */
    updateHeading(newHeading) {
        // Only update if significant change (reduce noise)
        const diff = Math.abs(newHeading - this.currentHeading);
        if (diff < 2 && this.currentHeading !== 0) return;
        
        this.currentHeading = newHeading;
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(newHeading);
            } catch (error) {
                console.error('❌ Callback error:', error);
            }
        });
        
        console.log(`🧭 Heading updated: ${newHeading.toFixed(1)}°`);
    }

    /**
     * Start test mode with rotating compass
     */
    startTestMode() {
        console.log('🧪 Starting orientation test mode...');
        
        let testHeading = 0;
        const testInterval = setInterval(() => {
            this.updateHeading(testHeading);
            testHeading = (testHeading + 15) % 360;
        }, 500);

        // Stop test after 10 seconds
        setTimeout(() => {
            clearInterval(testInterval);
            console.log('🛑 Test mode completed');
        }, 10000);
    }

    /**
     * Add callback for heading changes
     */
    onHeadingChange(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Remove callback
     */
    offHeadingChange(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

    /**
     * Get current heading
     */
    getCurrentHeading() {
        return this.currentHeading;
    }

    /**
     * Check if tracking
     */
    isOrientationTracking() {
        return this.isTracking;
    }

    /**
     * Stop tracking
     */
    stopTracking() {
        if (!this.isTracking) return;

        window.removeEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        window.removeEventListener('deviceorientationabsolute', this.handleDeviceOrientationAbsolute.bind(this));
        
        this.isTracking = false;
        console.log('🛑 Orientation tracking stopped');
    }
}

// Create global instance
window.SimpleOrientation = new SimpleOrientation();
console.log('🧭 SimpleOrientation ready for direct permission request');