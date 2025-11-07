# 📱 Guía de Implementación - Características Móviles Avanzadas

Esta guía te ayudará a implementar las características móviles avanzadas restantes para Pizza Master.

---

## 1. 📷 Escaneo de Códigos de Barras

### Bibliotecas Recomendadas:
- **QuaggaJS** (más fácil): https://serratus.github.io/quaggaJS/
- **ZXing** (más completo): https://github.com/zxing-js/library

### Implementación con QuaggaJS:

#### 1.1. Agregar la biblioteca al HTML:

```html
<!-- En index.html, antes de app.js -->
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js"></script>
<script src="assets/barcode-scanner.js"></script>
```

#### 1.2. Crear `assets/barcode-scanner.js`:

```javascript
class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.onDetected = null;
    }

    start(onDetected) {
        this.onDetected = onDetected;
        
        // Crear modal para la cámara
        const modal = document.createElement('div');
        modal.id = 'barcode-scanner-modal';
        modal.className = 'modal-container visible';
        modal.innerHTML = `
            <div class="modal-content" style="display: block; max-width: 600px;">
                <button class="modal-close-btn">&times;</button>
                <h3>Escanear Código de Barras</h3>
                <div id="barcode-scanner-container" style="position: relative; width: 100%; height: 400px;">
                    <video id="barcode-video" style="width: 100%; height: 100%;"></video>
                    <canvas id="barcode-canvas" style="position: absolute; top: 0; left: 0;"></canvas>
                </div>
                <p style="text-align: center; margin-top: 1rem; color: var(--color-text-alt);">
                    Apunta la cámara al código de barras del producto
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Iniciar Quagga
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#barcode-scanner-container'),
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"]
            }
        }, (err) => {
            if (err) {
                console.error('Error iniciando escáner:', err);
                toast.error('Error al acceder a la cámara');
                modal.remove();
                return;
            }
            Quagga.start();
            this.isScanning = true;
        });
        
        // Detectar código
        Quagga.onDetected((result) => {
            if (result && result.codeResult && result.codeResult.code) {
                const code = result.codeResult.code;
                this.stop();
                modal.remove();
                if (this.onDetected) {
                    this.onDetected(code);
                }
            }
        });
        
        // Cerrar modal
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            this.stop();
            modal.remove();
        });
    }

    stop() {
        if (this.isScanning) {
            Quagga.stop();
            this.isScanning = false;
        }
    }
}

window.barcodeScanner = new BarcodeScanner();
```

#### 1.3. Integrar en el inventario:

```javascript
// En setupEventListeners() de app.js
const scanBarcodeBtn = document.getElementById('scan-barcode-btn');
if (scanBarcodeBtn) {
    scanBarcodeBtn.addEventListener('click', () => {
        barcodeScanner.start((code) => {
            toast.success(`Código detectado: ${code}`);
            // Buscar producto en API externa (opcional)
            // O simplemente pre-rellenar el campo de nombre
            document.getElementById('inv-name').value = `Producto ${code}`;
            openInventoryModal();
        });
    });
}
```

#### 1.4. Agregar botón en el HTML:

```html
<!-- En la sección de inventario -->
<button id="scan-barcode-btn" class="btn btn-secondary">
    <span class="btn-icon">📷</span> Escanear Código
</button>
```

---

## 2. 🎤 Reconocimiento de Voz

### Implementación con Web Speech API:

#### 2.1. Crear `assets/voice-recognition.js`:

```javascript
class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        
        // Verificar compatibilidad
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'es-ES';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
        }
    }

    start(onResult, onError) {
        if (!this.recognition) {
            toast.error('Tu navegador no soporta reconocimiento de voz');
            return;
        }

        this.isListening = true;
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Reconocido:', transcript);
            
            // Parsear el texto
            const parsed = this.parseIngredient(transcript);
            if (parsed && onResult) {
                onResult(parsed);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Error de reconocimiento:', event.error);
            this.isListening = false;
            if (onError) {
                onError(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };

        this.recognition.start();
        toast.info('🎤 Escuchando... Di algo como "200 gramos de harina"');
    }

    parseIngredient(text) {
        // Expresión regular para extraer cantidad, unidad y nombre
        // Ejemplos: "200 gramos de harina", "1 kilo de tomate", "medio litro de aceite"
        
        text = text.toLowerCase().trim();
        
        // Patrones comunes
        const patterns = [
            /(\d+\.?\d*)\s*(gramos?|g|kilos?|kg|litros?|l|ml|unidades?|u)\s*de\s*(.+)/i,
            /(\d+\.?\d*)\s*(.+)/i
        ];
        
        for (let pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    quantity: parseFloat(match[1]),
                    unit: match[2] || 'g',
                    name: match[3] || match[2]
                };
            }
        }
        
        return null;
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
}

window.voiceRecognition = new VoiceRecognition();
```

#### 2.2. Integrar en modales:

```javascript
// Agregar botón de micrófono
const voiceBtn = document.createElement('button');
voiceBtn.type = 'button';
voiceBtn.className = 'btn btn-secondary btn-small';
voiceBtn.innerHTML = '🎤';
voiceBtn.title = 'Agregar por voz';

voiceBtn.addEventListener('click', () => {
    voiceRecognition.start(
        (result) => {
            // Rellenar campos automáticamente
            document.getElementById('inv-name').value = result.name;
            document.getElementById('inv-quantity').value = result.quantity;
            document.getElementById('inv-unit').value = result.unit;
            toast.success('Ingrediente agregado por voz');
        },
        (error) => {
            toast.error('Error al reconocer voz: ' + error);
        }
    );
});

// Agregar el botón junto al input de nombre
```

---

## 3. 📸 Modo Cámara Integrado

### Implementación:

#### 3.1. Crear `assets/camera-capture.js`:

```javascript
class CameraCapture {
    constructor() {
        this.stream = null;
        this.videoElement = null;
    }

    async start() {
        try {
            // Crear modal
            const modal = document.createElement('div');
            modal.id = 'camera-modal';
            modal.className = 'modal-container visible';
            modal.innerHTML = `
                <div class="modal-content" style="display: block; max-width: 600px;">
                    <button class="modal-close-btn">&times;</button>
                    <h3>Tomar Foto</h3>
                    <div style="position: relative;">
                        <video id="camera-video" autoplay playsinline style="width: 100%; border-radius: 8px;"></video>
                        <canvas id="camera-canvas" style="display: none;"></canvas>
                    </div>
                    <div class="controls" style="margin-top: 1rem; justify-content: center;">
                        <button id="capture-btn" class="btn btn-primary">
                            📷 Capturar
                        </button>
                        <button id="switch-camera-btn" class="btn btn-secondary">
                            🔄 Cambiar Cámara
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            this.videoElement = modal.querySelector('#camera-video');
            const canvas = modal.querySelector('#camera-canvas');
            const captureBtn = modal.querySelector('#capture-btn');
            const switchBtn = modal.querySelector('#switch-camera-btn');
            const closeBtn = modal.querySelector('.modal-close-btn');
            
            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            
            this.videoElement.srcObject = this.stream;
            
            // Retornar promesa que se resuelve con la imagen capturada
            return new Promise((resolve, reject) => {
                captureBtn.addEventListener('click', () => {
                    // Capturar foto
                    canvas.width = this.videoElement.videoWidth;
                    canvas.height = this.videoElement.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(this.videoElement, 0, 0);
                    
                    // Convertir a blob
                    canvas.toBlob((blob) => {
                        this.stop();
                        modal.remove();
                        resolve(blob);
                    }, 'image/jpeg', 0.9);
                });
                
                closeBtn.addEventListener('click', () => {
                    this.stop();
                    modal.remove();
                    reject(new Error('Cancelado por el usuario'));
                });
                
                switchBtn.addEventListener('click', async () => {
                    // Cambiar entre cámara frontal y trasera
                    const facingMode = this.stream.getVideoTracks()[0].getSettings().facingMode;
                    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
                    
                    this.stop();
                    this.stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: newFacingMode }
                    });
                    this.videoElement.srcObject = this.stream;
                });
            });
            
        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            toast.error('No se pudo acceder a la cámara');
            throw error;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

window.cameraCapture = new CameraCapture();
```

#### 3.2. Integrar en el formulario de recetas:

```javascript
// Reemplazar el botón de seleccionar imagen por dos opciones
const imageControls = document.createElement('div');
imageControls.className = 'form-group-file';
imageControls.innerHTML = `
    <label for="recipe-image-input" class="btn btn-light">Seleccionar Archivo</label>
    <input type="file" id="recipe-image-input" accept="image/*" style="display: none;">
    <button type="button" id="camera-btn" class="btn btn-secondary">📷 Tomar Foto</button>
    <button type="button" id="recipe-remove-image-btn" class="btn btn-danger btn-small" style="display: none;">
        Quitar Imagen
    </button>
`;

// Event listener para el botón de cámara
const cameraBtn = imageControls.querySelector('#camera-btn');
cameraBtn.addEventListener('click', async () => {
    try {
        const imageBlob = await cameraCapture.start();
        currentRecipeImageFile = imageBlob;
        recipeImagePreview.src = URL.createObjectURL(imageBlob);
        recipeRemoveImageBtn.style.display = 'inline-flex';
        toast.success('Foto capturada correctamente');
    } catch (error) {
        if (error.message !== 'Cancelado por el usuario') {
            toast.error('Error al tomar la foto');
        }
    }
});
```

---

## 4. 👆 Gestos Táctiles (Swipe)

### Implementación con Hammer.js:

#### 4.1. Agregar biblioteca:

```html
<!-- En index.html -->
<script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js"></script>
<script src="assets/swipe-gestures.js"></script>
```

#### 4.2. Crear `assets/swipe-gestures.js`:

```javascript
class SwipeGestures {
    init() {
        // Aplicar gestos a las tarjetas de recetas
        this.setupRecipeSwipes();
        this.setupInventorySwipes();
    }

    setupRecipeSwipes() {
        const recipeList = document.getElementById('recipe-list');
        if (!recipeList) return;

        // Usar delegación de eventos
        recipeList.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.recipe-card');
            if (!card) return;

            const hammer = new Hammer(card);
            hammer.on('swipeleft', () => {
                this.showDeleteConfirmation(card, 'recipe');
            });
        });
    }

    setupInventorySwipes() {
        const inventoryList = document.getElementById('inventory-list');
        if (!inventoryList) return;

        inventoryList.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.ingredient-card');
            if (!card) return;

            const hammer = new Hammer(card);
            hammer.on('swipeleft', () => {
                this.showDeleteConfirmation(card, 'ingredient');
            });
        });
    }

    async showDeleteConfirmation(card, type) {
        // Animar la tarjeta
        card.style.transform = 'translateX(-100px)';
        card.style.opacity = '0.5';

        const confirmed = await sweetConfirm.confirm({
            title: `¿Eliminar ${type === 'recipe' ? 'receta' : 'ingrediente'}?`,
            message: 'Desliza hacia la izquierda para confirmar',
            confirmText: 'Eliminar',
            type: 'danger'
        });

        if (confirmed) {
            const id = card.querySelector('[data-id]')?.dataset.id;
            if (id) {
                // Animar eliminación
                card.style.transform = 'translateX(-150%)';
                setTimeout(() => {
                    // Llamar a la función de eliminación correspondiente
                    if (type === 'recipe') {
                        document.querySelector(`[data-action="delete-recipe"][data-id="${id}"]`)?.click();
                    } else {
                        document.querySelector(`[data-action="delete-inventory"][data-id="${id}"]`)?.click();
                    }
                }, 300);
            }
        } else {
            // Restaurar posición
            card.style.transform = 'translateX(0)';
            card.style.opacity = '1';
        }
    }
}

window.swipeGestures = new SwipeGestures();
```

#### 4.3. Inicializar en app.js:

```javascript
// En la función init() de app.js
if (window.swipeGestures) {
    swipeGestures.init();
}
```

---

## 📝 Notas de Implementación

### Compatibilidad:
- **Códigos de Barras**: Funciona en navegadores modernos con acceso a cámara
- **Voz**: Chrome, Edge, Safari (con limitaciones en Firefox)
- **Cámara**: Todos los navegadores modernos con HTTPS
- **Gestos**: Funciona en todos los dispositivos táctiles

### Permisos Necesarios:
- Acceso a la cámara (para códigos de barras y fotos)
- Acceso al micrófono (para reconocimiento de voz)

### HTTPS Requerido:
Todas estas características requieren que la app esté servida por HTTPS (excepto en localhost).

### Testing:
1. Probar en dispositivos móviles reales
2. Verificar permisos de cámara/micrófono
3. Manejar errores cuando los permisos son denegados
4. Agregar fallbacks para navegadores no compatibles

---

**¡Buena suerte con la implementación!** 🚀
