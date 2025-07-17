// ==========================================
// ORIENTATION DEBUG PANEL
// Voor het testen en debuggen van device orientation
// ==========================================

class OrientationDebug {
    constructor() {
        this.isVisible = false;
        this.debugPanel = null;
        this.updateInterval = null;
        this.data = {
            deviceHeading: 0,
            geolocationHeading: null,
            source: 'none',
            permissionStatus: 'unknown',
            platform: this.detectPlatform(),
            hasDeviceOrientation: typeof DeviceOrientationEvent !== 'undefined',
            hasPermissionAPI: 'permissions' in navigator,
            alpha: 0,
            beta: 0,
            gamma: 0,
            webkitCompassHeading: null
        };
    }

    /**
     * Detect platform for debugging
     */
    detectPlatform() {
        const userAgent = navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
        if (/Android/.test(userAgent)) return 'Android';
        if (/Macintosh/.test(userAgent)) return 'macOS';
        if (/Windows/.test(userAgent)) return 'Windows';
        return 'Unknown';
    }

    /**
     * Initialize debug panel
     */
    initialize() {
        this.createDebugPanel();
        this.attachToOrientationUtils();
        this.startUpdating();
        console.log('🔧 Orientation debug panel initialized');
    }

    /**
     * Create the debug panel UI
     */
    createDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'orientation-debug-panel';
        this.debugPanel.innerHTML = `
            <div class="debug-header">
                <strong>🧭 Orientation Debug</strong>
                <button id="debug-close" class="debug-close">×</button>
            </div>
            <div class="debug-content">
                <div class="debug-row">
                    <span class="debug-label">Platform:</span>
                    <span class="debug-value" id="debug-platform">${this.data.platform}</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">Permission Status:</span>
                    <span class="debug-value" id="debug-permission">${this.data.permissionStatus}</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">Current Heading:</span>
                    <span class="debug-value" id="debug-heading">0°</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">Source:</span>
                    <span class="debug-value" id="debug-source">${this.data.source}</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">Device Alpha:</span>
                    <span class="debug-value" id="debug-alpha">0°</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">Device Beta:</span>
                    <span class="debug-value" id="debug-beta">0°</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">Device Gamma:</span>
                    <span class="debug-value" id="debug-gamma">0°</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">WebKit Compass:</span>
                    <span class="debug-value" id="debug-webkit">N/A</span>
                </div>
                <div class="debug-row">
                    <span class="debug-label">Geolocation Heading:</span>
                    <span class="debug-value" id="debug-geo">N/A</span>
                </div>
                <div class="debug-actions">
                    <button id="debug-request-permission" class="debug-btn">Request Permission</button>
                    <button id="debug-test-orientation" class="debug-btn">Test Orientation</button>
                </div>
            </div>
        `;

        // Add CSS
        this.addDebugStyles();

        // Append to body
        document.body.appendChild(this.debugPanel);

        // Add event listeners
        document.getElementById('debug-close').addEventListener('click', () => this.hide());
        document.getElementById('debug-request-permission').addEventListener('click', () => this.requestPermission());
        document.getElementById('debug-test-orientation').addEventListener('click', () => this.testOrientation());
    }

    /**
     * Add CSS styles for debug panel
     */
    addDebugStyles() {
        if (document.getElementById('orientation-debug-styles')) return;

        const style = document.createElement('style');
        style.id = 'orientation-debug-styles';
        style.textContent = `
            #orientation-debug-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                display: none;
            }

            #orientation-debug-panel.visible {
                display: block;
            }

            .debug-header {
                padding: 10px 15px;
                background: rgba(255, 255, 255, 0.1);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .debug-close {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .debug-content {
                padding: 15px;
            }

            .debug-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 2px 0;
            }

            .debug-label {
                color: #aaa;
            }

            .debug-value {
                color: #4fc3f7;
                font-weight: bold;
            }

            .debug-actions {
                margin-top: 15px;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .debug-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                flex: 1;
                min-width: 120px;
            }

            .debug-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Attach to OrientationUtils for real-time data
     */
    attachToOrientationUtils() {
        if (window.OrientationUtils) {
            window.OrientationUtils.onOrientationChange((heading) => {
                this.data.deviceHeading = heading;
                this.data.source = 'device-orientation';
            });
        }
    }

    /**
     * Update debug panel data
     */
    updateData() {
        if (!this.isVisible) return;

        // Update permission status
        if (window.OrientationUtils) {
            this.data.permissionStatus = window.OrientationUtils.hasOrientationPermission() ? 'granted' : 'prompt';
        }

        // Update DOM elements
        const updates = {
            'debug-platform': this.data.platform,
            'debug-permission': this.data.permissionStatus,
            'debug-heading': `${this.data.deviceHeading.toFixed(1)}°`,
            'debug-source': this.data.source,
            'debug-alpha': `${this.data.alpha.toFixed(1)}°`,
            'debug-beta': `${this.data.beta.toFixed(1)}°`,
            'debug-gamma': `${this.data.gamma.toFixed(1)}°`,
            'debug-webkit': this.data.webkitCompassHeading ? `${this.data.webkitCompassHeading.toFixed(1)}°` : 'N/A',
            'debug-geo': this.data.geolocationHeading ? `${this.data.geolocationHeading.toFixed(1)}°` : 'N/A'
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    /**
     * Start updating the debug panel
     */
    startUpdating() {
        if (this.updateInterval) return;

        this.updateInterval = setInterval(() => {
            this.updateData();
        }, 100);
    }

    /**
     * Stop updating
     */
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Show debug panel
     */
    show() {
        this.isVisible = true;
        if (this.debugPanel) {
            this.debugPanel.classList.add('visible');
        }
        this.startUpdating();
    }

    /**
     * Hide debug panel
     */
    hide() {
        this.isVisible = false;
        if (this.debugPanel) {
            this.debugPanel.classList.remove('visible');
        }
        this.stopUpdating();
    }

    /**
     * Toggle debug panel
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update orientation data from device events
     */
    updateOrientationData(event) {
        this.data.alpha = event.alpha || 0;
        this.data.beta = event.beta || 0;
        this.data.gamma = event.gamma || 0;
        this.data.webkitCompassHeading = event.webkitCompassHeading;
    }

    /**
     * Update geolocation heading
     */
    updateGeolocationHeading(heading) {
        this.data.geolocationHeading = heading;
        if (!this.data.deviceHeading && heading) {
            this.data.source = 'geolocation';
        }
    }

    /**
     * Request permission via debug panel
     */
    async requestPermission() {
        if (window.OrientationUtils) {
            const success = await window.OrientationUtils.initialize();
            console.log('🔧 Debug: Permission request result:', success);
        }
    }

    /**
     * Test orientation functionality
     */
    testOrientation() {
        console.log('🔧 Debug: Testing orientation...');
        let testHeading = 0;
        const testInterval = setInterval(() => {
            this.data.deviceHeading = testHeading;
            this.data.source = 'test-mode';
            testHeading = (testHeading + 15) % 360;
        }, 200);

        setTimeout(() => {
            clearInterval(testInterval);
            this.data.source = 'device-orientation';
            console.log('🔧 Debug: Test completed');
        }, 5000);
    }
}

// Create global instance
window.OrientationDebug = new OrientationDebug();

// Add keyboard shortcut to toggle debug panel (Ctrl+Shift+D)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        window.OrientationDebug.toggle();
        console.log('🔧 Debug panel toggled');
    }
});

// Auto-initialize if orientation utils is available
if (window.OrientationUtils) {
    window.OrientationDebug.initialize();
} else {
    // Wait for OrientationUtils to load
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.OrientationUtils) {
                window.OrientationDebug.initialize();
            }
        }, 1000);
    });
}