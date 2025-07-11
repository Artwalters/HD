// ==============================
// PERFORMANCE UTILITIES - v1.0
// ==============================

class PerformanceManager {
    constructor() {
        this.isLowPowerMode = this.detectLowPowerDevice();
        this.isProduction = !window.location.hostname.includes('localhost');
    }

    /**
     * Detecteer of apparaat low-power is
     */
    detectLowPowerDevice() {
        // Check for mobile device
        const isMobile = window.innerWidth < 768;
        
        // Check for older browsers
        const isOldBrowser = !window.IntersectionObserver || !window.ResizeObserver;
        
        // Check for hardware concurrency (CPU cores)
        const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        // Check for device memory (if available)
        const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        
        return isMobile || isOldBrowser || lowCPU || lowMemory;
    }

    /**
     * Krijg performance optimized map config
     */
    getOptimizedMapConfig(baseConfig) {
        if (this.isLowPowerMode) {
            return {
                ...baseConfig,
                pitch: 0, // Disable 3D
                bearing: 0,
                antialias: false,
                fadeDuration: 0,
                maxParallelImageRequests: 8, // Reduce concurrent requests
                preserveDrawingBuffer: false,
                renderWorldCopies: false
            };
        }
        return baseConfig;
    }

    /**
     * Disable console logs in production
     */
    optimizeConsole() {
        if (this.isProduction) {
            // Disable all console methods except error
            const noop = () => {};
            console.log = noop;
            console.info = noop;
            console.warn = noop;
            console.debug = noop;
        }
    }

    /**
     * Lazy load data based on map bounds
     */
    shouldLoadData(bounds, feature) {
        if (!this.isLowPowerMode) return true;
        
        // Only load data within current map bounds on low power devices
        const [lng, lat] = feature.geometry.coordinates;
        return bounds.contains([lng, lat]);
    }

    /**
     * Get animation duration based on performance
     */
    getAnimationDuration(defaultDuration) {
        return this.isLowPowerMode ? Math.min(defaultDuration, 200) : defaultDuration;
    }

    /**
     * Should use reduced animations
     */
    useReducedMotion() {
        return this.isLowPowerMode || 
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Get popup offset based on device
     */
    getPopupOffset() {
        return this.isLowPowerMode ? [0, -10] : [0, -15];
    }

    /**
     * Performance monitoring
     */
    startPerformanceMonitoring() {
        if (this.isProduction) return;

        // Monitor memory usage
        if (performance.memory) {
            const checkMemory = () => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > 200 * 1024 * 1024) { // 200MB
                    console.warn('⚠️ High memory usage detected:', {
                        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                    });
                }
            };
            
            setInterval(checkMemory, 30000); // Check every 30 seconds
        }

        // Monitor render performance
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn('⚠️ Low FPS detected:', fps);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkFPS);
        };
        
        checkFPS();
    }
}

// Create global instance
window.PerformanceManager = new PerformanceManager();

// Initialize optimizations
window.PerformanceManager.optimizeConsole();
window.PerformanceManager.startPerformanceMonitoring();

console.log('🚀 Performance Manager initialized:', {
    lowPowerMode: window.PerformanceManager.isLowPowerMode,
    production: window.PerformanceManager.isProduction
});