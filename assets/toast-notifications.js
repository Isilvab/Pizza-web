/**
 * Sistema de Notificaciones Toast
 * Sistema elegante de notificaciones sin dependencias externas
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Crear contenedor de toasts si no existe
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en milisegundos (default: 3000)
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Iconos según el tipo
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" aria-label="Cerrar">×</button>
        `;

        // Agregar al contenedor
        this.container.appendChild(toast);

        // Animación de entrada
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // Cerrar al hacer clic en el botón
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.close(toast));

        // Auto-cerrar después de la duración
        if (duration > 0) {
            setTimeout(() => this.close(toast), duration);
        }

        return toast;
    }

    close(toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Muestra un toast de carga (sin auto-cerrar)
     * @param {string} message - Mensaje a mostrar
     * @returns {Object} Toast element con método close()
     */
    loading(message) {
        const toast = this.show(message, 'info', 0);
        toast.classList.add('toast-loading');
        
        // Agregar spinner
        const icon = toast.querySelector('.toast-icon');
        icon.innerHTML = '<div class="toast-spinner"></div>';
        
        return {
            element: toast,
            close: () => this.close(toast),
            updateMessage: (newMessage) => {
                const msgEl = toast.querySelector('.toast-message');
                if (msgEl) msgEl.textContent = newMessage;
            }
        };
    }
}

// Instancia global
const toast = new ToastNotification();

// Exponer globalmente
window.toast = toast;
