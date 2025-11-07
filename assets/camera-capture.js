/**
 * Camera Capture - Captura de Fotos Integrada
 * Permite tomar fotos directamente desde la cámara del dispositivo
 */

// Helper para mostrar toast solo si está disponible
function showToast(type, message, duration) {
    if (window.toast && toast[type]) {
        return toast[type](message, duration);
    }
    console.log(`[Toast ${type}]: ${message}`);
    return null;
}

class CameraCapture {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.currentFacingMode = 'environment'; // 'environment' (trasera) o 'user' (frontal)
    }

    /**
     * Inicia la cámara y retorna una promesa con el blob de la imagen capturada
     * @returns {Promise<Blob>}
     */
    async start() {
        try {
            // Crear modal
            const modal = document.createElement('div');
            modal.id = 'camera-modal';
            modal.className = 'modal-container visible camera-modal';
            modal.innerHTML = `
                <div class="modal-content camera-modal-content" style="display: block; max-width: 600px;">
                    <button class="modal-close-btn" aria-label="Cerrar">&times;</button>
                    <h3>📷 Tomar Foto</h3>
                    <div class="camera-container">
                        <video id="camera-video" autoplay playsinline muted></video>
                        <canvas id="camera-canvas" style="display: none;"></canvas>
                        <div class="camera-overlay">
                            <div class="camera-grid">
                                <div></div><div></div><div></div>
                                <div></div><div></div><div></div>
                                <div></div><div></div><div></div>
                            </div>
                        </div>
                    </div>
                    <div class="controls camera-controls">
                        <button id="switch-camera-btn" class="btn btn-secondary" title="Cambiar cámara">
                            🔄
                        </button>
                        <button id="capture-btn" class="btn btn-primary btn-large">
                            <span class="btn-icon">📷</span> Capturar
                        </button>
                        <button id="cancel-camera-btn" class="btn btn-light">
                            Cancelar
                        </button>
                    </div>
                    <p class="camera-hint">Asegúrate de tener buena iluminación para mejores resultados</p>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            this.videoElement = modal.querySelector('#camera-video');
            const canvas = modal.querySelector('#camera-canvas');
            const captureBtn = modal.querySelector('#capture-btn');
            const switchBtn = modal.querySelector('#switch-camera-btn');
            const closeBtn = modal.querySelector('.modal-close-btn');
            const cancelBtn = modal.querySelector('#cancel-camera-btn');
            
            // Detectar si el dispositivo tiene múltiples cámaras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            // Ocultar botón de cambio si solo hay una cámara
            if (videoDevices.length <= 1) {
                switchBtn.style.display = 'none';
            }
            
            // Solicitar acceso a la cámara
            await this.startCamera();
            
            // Retornar promesa que se resuelve con la imagen capturada
            return new Promise((resolve, reject) => {
                // Capturar foto
                captureBtn.addEventListener('click', async () => {
                    try {
                        // Capturar frame del video
                        canvas.width = this.videoElement.videoWidth;
                        canvas.height = this.videoElement.videoHeight;
                        const ctx = canvas.getContext('2d');
                        
                        // Dibujar imagen (espejo si es cámara frontal)
                        if (this.currentFacingMode === 'user') {
                            ctx.translate(canvas.width, 0);
                            ctx.scale(-1, 1);
                        }
                        
                        ctx.drawImage(this.videoElement, 0, 0);
                        
                        // Convertir a blob
                        canvas.toBlob((blob) => {
                            if (blob) {
                                this.stop();
                                modal.remove();
                                resolve(blob);
                                showToast('success', '📷 Foto capturada');
                            } else {
                                reject(new Error('Error al crear la imagen'));
                            }
                        }, 'image/jpeg', 0.9);
                    } catch (error) {
                        console.error('Error capturando foto:', error);
                        showToast('error', 'Error al capturar la foto');
                        reject(error);
                    }
                });
                
                // Cambiar entre cámara frontal y trasera
                switchBtn.addEventListener('click', async () => {
                    try {
                        this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
                        await this.startCamera();
                        showToast('info', `Cámara ${this.currentFacingMode === 'user' ? 'frontal' : 'trasera'}`);
                    } catch (error) {
                        console.error('Error cambiando cámara:', error);
                        showToast('error', 'No se pudo cambiar de cámara');
                    }
                });
                
                // Cerrar modal (cancelar)
                const handleCancel = () => {
                    this.stop();
                    modal.remove();
                    reject(new Error('Cancelado por el usuario'));
                };
                
                closeBtn.addEventListener('click', handleCancel);
                cancelBtn.addEventListener('click', handleCancel);
                
                // Cerrar con ESC
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        handleCancel();
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            });
            
        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            
            let errorMessage = 'No se pudo acceder a la cámara';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en la configuración.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No se encontró ninguna cámara en el dispositivo';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'La cámara está siendo usada por otra aplicación';
            }
            
            showToast('error', errorMessage, 5000);
            throw error;
        }
    }

    /**
     * Inicia el stream de la cámara
     */
    async startCamera() {
        // Detener stream anterior si existe
        this.stop();
        
        try {
            // Configuración de constraints
            const constraints = {
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                
                // Esperar a que el video esté listo
                await new Promise((resolve) => {
                    this.videoElement.onloadedmetadata = () => {
                        this.videoElement.play();
                        resolve();
                    };
                });
            }
        } catch (error) {
            console.error('Error iniciando cámara:', error);
            throw error;
        }
    }

    /**
     * Detiene el stream de la cámara
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    /**
     * Verifica si el dispositivo soporta cámara
     * @returns {boolean}
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
}

// Instancia global
window.cameraCapture = new CameraCapture();

// Exponer la clase para uso externo
window.CameraCapture = CameraCapture;
