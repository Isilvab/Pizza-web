/**
 * Integración de la Cámara con el Formulario de Recetas
 * Agrega funcionalidad para capturar fotos desde la cámara
 */

// Helper para mostrar toast solo si está disponible
function showCameraToast(type, message, duration) {
    if (window.toast && toast[type]) {
        return toast[type](message, duration);
    }
    console.log(`[Camera Toast ${type}]: ${message}`);
    return { close: () => {} }; // Retornar objeto mock con método close
}

function setupCameraIntegration() {
    const recipeImageInput = document.getElementById('recipe-image-input');
    const recipeImagePreview = document.getElementById('recipe-image-preview');
    const recipeRemoveImageBtn = document.getElementById('recipe-remove-image-btn');
    
    if (!recipeImageInput) return;
    
    // Verificar soporte de cámara
    if (!CameraCapture.isSupported()) {
        console.warn('Cámara no soportada en este dispositivo');
        return;
    }
    
    // Crear botón de cámara si no existe
    let cameraBtn = document.getElementById('recipe-camera-btn');
    if (!cameraBtn) {
        cameraBtn = document.createElement('button');
        cameraBtn.type = 'button';
        cameraBtn.id = 'recipe-camera-btn';
        cameraBtn.className = 'btn btn-secondary';
        cameraBtn.innerHTML = '📷 Tomar Foto';
        cameraBtn.style.marginLeft = '0.5rem';
        
        // Insertar botón después del input de archivo
        const fileGroup = recipeImageInput.closest('.form-group-file');
        if (fileGroup) {
            const selectBtn = fileGroup.querySelector('label[for="recipe-image-input"]');
            if (selectBtn) {
                selectBtn.insertAdjacentElement('afterend', cameraBtn);
            }
        }
    }
    
    // Variable para almacenar el blob de la imagen capturada
    let capturedImageBlob = null;
    
    // Event listener para el botón de cámara
    cameraBtn.addEventListener('click', async () => {
        try {
            // Abrir cámara y capturar foto
            const blob = await cameraCapture.start();
            
            if (blob) {
                // Convertir blob a base64 para guardar localmente
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    
                    // Mostrar preview
                    recipeImagePreview.src = base64data;
                    recipeImagePreview.style.display = 'block';
                    
                    // Guardar base64 en el dataset para que app.js lo tome
                    recipeImagePreview.dataset.currentUrl = base64data;
                    
                    // Mostrar botón de quitar imagen
                    if (recipeRemoveImageBtn) {
                        recipeRemoveImageBtn.style.display = 'inline-block';
                    }
                    
                    // Limpiar el input de archivo
                    recipeImageInput.value = '';
                    
                    // Limpiar la variable de archivo para que no suba archivo duplicado
                    if (window.currentRecipeImageFile !== undefined) {
                        window.currentRecipeImageFile = null;
                    }
                    
                    showCameraToast('success', '📷 Foto capturada correctamente');
                };
                reader.readAsDataURL(blob);
                
                capturedImageBlob = blob;
            }
        } catch (error) {
            if (error.message !== 'Cancelado por el usuario') {
                console.error('Error capturando foto:', error);
                showCameraToast('error', 'Error al capturar la foto');
            }
        }
    });
    
    // Limpiar blob cuando se cierra el modal
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (!modalContainer.classList.contains('visible')) {
                        // Modal cerrado, limpiar blob
                        if (capturedImageBlob) {
                            URL.revokeObjectURL(recipeImagePreview.src);
                            capturedImageBlob = null;
                        }
                    }
                }
            });
        });
        
        observer.observe(modalContainer, { attributes: true });
    }
    
    // Limpiar blob cuando se selecciona un archivo desde el input
    recipeImageInput.addEventListener('change', () => {
        if (recipeImageInput.files.length > 0) {
            // Se seleccionó un archivo, limpiar blob de cámara
            if (capturedImageBlob) {
                capturedImageBlob = null;
            }
        }
    });
    
    // Limpiar blob cuando se quita la imagen
    if (recipeRemoveImageBtn) {
        recipeRemoveImageBtn.addEventListener('click', () => {
            if (capturedImageBlob) {
                URL.revokeObjectURL(recipeImagePreview.src);
                capturedImageBlob = null;
            }
        });
    }
    
    console.log('✓ Integración de cámara configurada');
}

// Exportar para uso global
window.setupCameraIntegration = setupCameraIntegration;
