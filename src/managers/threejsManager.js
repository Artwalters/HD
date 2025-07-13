// ==============================
// THREE.JS MANAGER MODULE
// ==============================

class ThreeJSManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.isInitialized = false;
        this.customLayer = null;
        
        // 3D model configurations
        this.modelConfigs = [
            {
                id: 'schunck',
                origin: [50.88778235149691, 5.979389928151281], // [lat, lng]
                altitude: 0,
                rotate: [Math.PI / 2, 0.45, 0],
                url: 'https://cdn.jsdelivr.net/gh/Artwalters/3dmodels_heerlen@main/schunckv5.glb',
                scale: 1.3
            },
            {
                id: 'theater',
                origin: [50.886541206107225, 5.972454838314243],
                altitude: 0,
                rotate: [Math.PI / 2, 2.05, 0],
                url: 'https://cdn.jsdelivr.net/gh/Artwalters/3dmodels_heerlen@main/theaterheerlenv4.glb',
                scale: 0.6
            }
        ];
        
        // Image plane configuration
        this.imagePlaneConfig = {
            id: 'image1',
            origin: [50.88801513786042, 5.980644311376565],
            altitude: 6.5,
            rotate: [Math.PI / 2, 0.35, 0],
            imageUrl: 'https://daks2k3a4ib2z.cloudfront.net/671769e099775386585f574d/67adf2bff5be8a200ec2fa55_osgameos_mural-p-130x130q80.png',
            width: 13,
            height: 13
        };
    }

    /**
     * Initialiseert Three.js layer
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Three.js manager al geïnitialiseerd');
            return;
        }

        // Check if THREE.js is available
        if (typeof THREE === 'undefined') {
            console.error('❌ THREE.js niet geladen');
            return;
        }

        console.log('🔄 Initialisatie Three.js manager...');

        // Create custom layer
        this.createCustomLayer();
        
        // Wait for GLTFLoader and then add layer
        this.waitForGLTFLoader().then(() => {
            // Add layer when map style is loaded
            if (this.map.isStyleLoaded()) {
                console.log('📋 Map style al geladen, voeg Three.js layer toe');
                this.addLayer();
            } else {
                console.log('⏳ Wacht op map style load...');
                this.map.on('style.load', () => {
                    console.log('📋 Map style geladen, voeg Three.js layer toe');
                    this.addLayer();
                });
                
                // Fallback: Als style.load event niet fired binnen 5 seconden, probeer alsnog
                setTimeout(() => {
                    if (this.map.isStyleLoaded() && !this.map.getLayer('3d-models')) {
                        console.log('⏰ Fallback: Map style geladen, voeg Three.js layer toe');
                        this.addLayer();
                    }
                }, 5000);
            }
        }).catch(error => {
            console.error('❌ GLTFLoader not available:', error);
        });

        this.isInitialized = true;
        console.log('✅ Three.js manager geïnitialiseerd');
    }

    /**
     * Wacht tot GLTFLoader beschikbaar is
     * @returns {Promise} Promise die resolved als GLTFLoader beschikbaar is
     */
    waitForGLTFLoader() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 150; // 15 seconden max
            
            const checkGLTFLoader = () => {
                attempts++;
                
                if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
                    console.log('✅ GLTFLoader found and ready');
                    // Extra check to make sure it's not the fallback
                    try {
                        const testLoader = new THREE.GLTFLoader();
                        if (testLoader && typeof testLoader.load === 'function') {
                            console.log('✅ GLTFLoader verified as functional');
                            resolve();
                        } else {
                            throw new Error('GLTFLoader not functional');
                        }
                    } catch (error) {
                        console.warn('⚠️ GLTFLoader exists but not functional, continuing anyway...');
                        resolve();
                    }
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ GLTFLoader timeout after 15 seconds - proceeding with fallback');
                    resolve();
                } else {
                    if (attempts % 20 === 0) { // Log every 2 seconds
                        console.log(`⏳ Waiting for GLTFLoader... (attempt ${attempts}/${maxAttempts})`);
                    }
                    setTimeout(checkGLTFLoader, 100);
                }
            };
            
            checkGLTFLoader();
        });
    }

    /**
     * Creëert custom Three.js layer
     */
    createCustomLayer() {
        const self = this;
        
        this.customLayer = {
            id: '3d-models',
            type: 'custom',
            renderingMode: '3d',

            onAdd: function(map, gl) {
                console.log('🎬 Three.js layer onAdd called');
                try {
                    this.map = map;
                    this.scene = new THREE.Scene();
                    this.camera = new THREE.Camera();

                    // Setup lighting
                    this.setupLighting();

                    // Setup renderer
                    this.setupRenderer(map, gl);

                    // Load 3D models
                    this.loadModels();

                    // Load image planes
                    this.loadImagePlanes();
                    
                    console.log('✅ Three.js layer setup complete');
                } catch (error) {
                    console.error('❌ Error in Three.js layer onAdd:', error);
                }
            },

            setupLighting: function() {
                // Ambient light
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.57);
                this.scene.add(ambientLight);

                // Directional light
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.55);
                directionalLight.color.setHex(0xfcfcfc);
                
                // Position light
                const azimuth = 210 * (Math.PI / 180);
                const polar = 50 * (Math.PI / 180);
                directionalLight.position.set(
                    Math.sin(azimuth) * Math.sin(polar),
                    Math.cos(azimuth) * Math.sin(polar),
                    Math.cos(polar)
                ).normalize();
                this.scene.add(directionalLight);
            },

            setupRenderer: function(map, gl) {
                this.renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialias: true
                });
                this.renderer.autoClear = false;
            },

            loadModels: function() {
                console.log('📦 Loading 3D models...');
                console.log('🔍 GLTFLoader check in loadModels:', typeof THREE.GLTFLoader !== 'undefined');
                
                // Check if GLTFLoader is available
                if (typeof THREE.GLTFLoader === 'undefined') {
                    console.error('❌ GLTFLoader niet beschikbaar - modellen worden niet geladen');
                    return;
                }
                
                try {
                    const loader = new THREE.GLTFLoader();
                    console.log('✅ GLTFLoader instance created successfully');
                    
                    self.modelConfigs.forEach(config => {
                    // Convert coordinates
                    const mercCoord = mapboxgl.MercatorCoordinate.fromLngLat(
                        [config.origin[1], config.origin[0]],
                        config.altitude
                    );

                    // Load model
                    loader.load(
                        config.url,
                        (gltf) => {
                            const scene3D = gltf.scene;
                            
                            // Store transform data
                            scene3D.userData.transform = {
                                translateX: mercCoord.x,
                                translateY: mercCoord.y,
                                translateZ: mercCoord.z,
                                rotate: config.rotate,
                                scale: mercCoord.meterInMercatorCoordinateUnits() * config.scale
                            };
                            
                            this.scene.add(scene3D);
                            console.log(`✅ 3D model geladen: ${config.id}`);
                        },
                        (progress) => {
                            console.log(`📊 Loading ${config.id}: ${(progress.loaded / progress.total * 100)}%`);
                        },
                        (error) => {
                            console.error(`❌ Fout bij laden ${config.id}:`, error);
                        }
                    );
                });
                } catch (error) {
                    console.error('❌ Error creating GLTFLoader or loading models:', error);
                }
            },

            loadImagePlanes: function() {
                self.createImagePlane(self.imagePlaneConfig)
                    .then(plane => {
                        this.scene.add(plane);
                        console.log(`✅ Image plane geladen: ${self.imagePlaneConfig.id}`);
                    })
                    .catch(error => {
                        console.error('❌ Fout bij laden image plane:', error);
                    });
            },

            render: function(gl, matrix) {
                try {
                    if (!this.renderer || !this.scene || !this.camera) {
                        return;
                    }

                    // Get Mapbox matrix
                    const mapMatrix = new THREE.Matrix4().fromArray(matrix);

                    // Apply transforms to each object
                    this.scene.traverse(child => {
                        if (child.userData.transform) {
                            const t = child.userData.transform;
                            
                            // Create transform matrices
                            const translation = new THREE.Matrix4().makeTranslation(
                                t.translateX, t.translateY, t.translateZ
                            );
                            const scaling = new THREE.Matrix4().makeScale(t.scale, -t.scale, t.scale);
                            const rotX = new THREE.Matrix4().makeRotationX(t.rotate[0]);
                            const rotY = new THREE.Matrix4().makeRotationY(t.rotate[1]);
                            const rotZ = new THREE.Matrix4().makeRotationZ(t.rotate[2]);

                            // Combine transforms
                            const modelMatrix = new THREE.Matrix4()
                                .multiply(translation)
                                .multiply(scaling)
                                .multiply(rotX)
                                .multiply(rotY)
                                .multiply(rotZ);

                            // Apply transformation
                            child.matrix = new THREE.Matrix4().copy(mapMatrix).multiply(modelMatrix);
                            child.matrixAutoUpdate = false;
                        }
                    });

                    // Render scene
                    this.renderer.resetState();
                    this.renderer.render(this.scene, this.camera);
                } catch (error) {
                    console.error('❌ Error in Three.js render:', error);
                }
            }
        };
    }

    /**
     * Create image plane for THREE.js
     */
    createImagePlane(config) {
        // Convert coordinates
        const mercatorCoord = mapboxgl.MercatorCoordinate.fromLngLat(
            [config.origin[1], config.origin[0]],
            config.altitude
        );

        // Calculate scale
        const meterScale = mercatorCoord.meterInMercatorCoordinateUnits();
        const geoWidth = config.width * meterScale;
        const geoHeight = config.height * meterScale;

        return new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
                config.imageUrl,
                (texture) => {
                    // Create material
                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        side: THREE.DoubleSide
                    });
                    
                    // Create geometry
                    const geometry = new THREE.PlaneGeometry(geoWidth, geoHeight);
                    const plane = new THREE.Mesh(geometry, material);

                    // Store transform data
                    plane.userData.transform = {
                        translateX: mercatorCoord.x,
                        translateY: mercatorCoord.y,
                        translateZ: mercatorCoord.z,
                        rotate: config.rotate,
                        scale: 1
                    };

                    resolve(plane);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }

    /**
     * Voegt Three.js layer toe aan map
     */
    addLayer() {
        if (!this.customLayer) {
            console.error('❌ Custom layer niet beschikbaar');
            return;
        }

        try {
            // Check if layer already exists
            if (this.map.getLayer('3d-models')) {
                console.warn('⚠️ Three.js layer bestaat al');
                return;
            }

            console.log('🎬 Adding Three.js layer to map...');
            this.map.addLayer(this.customLayer);
            console.log('✅ Three.js layer toegevoegd aan map');
            
            // Verify layer was added
            setTimeout(() => {
                if (this.map.getLayer('3d-models')) {
                    console.log('✅ Three.js layer verified in map');
                } else {
                    console.error('❌ Three.js layer not found in map after adding');
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Fout bij toevoegen Three.js layer:', error);
        }
    }

    /**
     * Verwijdert Three.js layer
     */
    removeLayer() {
        if (this.map.getLayer('3d-models')) {
            this.map.removeLayer('3d-models');
            console.log('🗑️ Three.js layer verwijderd');
        }
    }

    /**
     * Toont/verbergt Three.js layer
     * @param {boolean} visible - Zichtbaarheid
     */
    setVisibility(visible) {
        if (this.map.getLayer('3d-models')) {
            const visibility = visible ? 'visible' : 'none';
            this.map.setLayoutProperty('3d-models', 'visibility', visibility);
            console.log(`👁️ Three.js layer zichtbaarheid: ${visible ? 'zichtbaar' : 'verborgen'}`);
        }
    }

    /**
     * Voegt nieuw 3D model toe
     * @param {Object} config - Model configuratie
     */
    addModel(config) {
        this.modelConfigs.push(config);
        
        if (this.isInitialized && this.customLayer) {
            // Reload models if layer is already active
            console.log(`➕ Nieuw 3D model toegevoegd: ${config.id}`);
        }
    }

    /**
     * Verwijdert 3D model
     * @param {string} modelId - ID van het model
     */
    removeModel(modelId) {
        this.modelConfigs = this.modelConfigs.filter(config => config.id !== modelId);
        console.log(`🗑️ 3D model verwijderd: ${modelId}`);
    }

    /**
     * Krijg statistieken over Three.js layer
     * @returns {Object} Three.js statistieken
     */
    getStats() {
        return {
            initialized: this.isInitialized,
            modelsConfigured: this.modelConfigs.length,
            layerActive: this.map.getLayer('3d-models') ? true : false
        };
    }

    /**
     * Cleanup Three.js manager
     */
    destroy() {
        this.removeLayer();
        this.customLayer = null;
        this.isInitialized = false;
        console.log('💥 Three.js manager vernietigd');
    }
}

// Export voor gebruik in andere modules
window.ThreeJSManager = ThreeJSManager;