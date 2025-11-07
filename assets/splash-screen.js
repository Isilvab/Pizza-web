/**
 * Splash Screen - Pantalla de Carga
 * Se muestra mientras la aplicación inicializa
 */

class SplashScreen {
    constructor() {
        this.splashElement = null;
        this.minDisplayTime = 1500; // Tiempo mínimo de visualización (ms)
        this.startTime = Date.now();
        this.init();
    }

    init() {
        // Crear elemento de splash
        this.splashElement = document.createElement('div');
        this.splashElement.id = 'splash-screen';
        this.splashElement.className = 'splash-screen';
        
        this.splashElement.innerHTML = `
            <div class="splash-content">
                <div class="splash-logo-container">
                    <img src="assets/icons/logo-pizza.svg" alt="Pizza Master Logo" class="splash-logo">
                    <div class="splash-pizza-slice"></div>
                </div>
                <h1 class="splash-title">Pizza Master</h1>
                <p class="splash-subtitle">Tu gestor profesional de pizzas</p>
                <div class="splash-loader">
                    <div class="splash-spinner"></div>
                </div>
                <p class="splash-loading-text">Cargando...</p>
            </div>
        `;

        // Insertar al inicio del body
        document.body.insertBefore(this.splashElement, document.body.firstChild);
    }

    /**
     * Oculta el splash screen
     * @param {Function} callback - Función a ejecutar después de ocultar
     */
    hide(callback) {
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayTime - elapsedTime);

        setTimeout(() => {
            this.splashElement.classList.add('splash-fade-out');
            
            setTimeout(() => {
                if (this.splashElement && this.splashElement.parentElement) {
                    this.splashElement.parentElement.removeChild(this.splashElement);
                }
                if (callback) callback();
            }, 500); // Duración de la animación de salida
        }, remainingTime);
    }

    /**
     * Actualiza el texto de carga
     * @param {string} text - Nuevo texto a mostrar
     */
    updateText(text) {
        const loadingText = this.splashElement.querySelector('.splash-loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
}

// Instancia global
const splashScreen = new SplashScreen();

// Exponer globalmente
window.splashScreen = splashScreen;
