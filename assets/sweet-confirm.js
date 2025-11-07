/**
 * Sistema de Confirmaciones Elegantes
 * Reemplazo personalizado para alert() y confirm()
 */

class SweetConfirm {
    constructor() {
        this.modalOverlay = null;
        this.init();
    }

    init() {
        // Crear overlay si no existe
        if (!document.getElementById('sweet-confirm-overlay')) {
            this.modalOverlay = document.createElement('div');
            this.modalOverlay.id = 'sweet-confirm-overlay';
            this.modalOverlay.className = 'sweet-confirm-overlay';
            document.body.appendChild(this.modalOverlay);
        } else {
            this.modalOverlay = document.getElementById('sweet-confirm-overlay');
        }
    }

    /**
     * Muestra un modal de confirmación
     * @param {Object} options - Opciones de configuración
     * @returns {Promise<boolean>} - Promesa que resuelve true si confirma, false si cancela
     */
    confirm(options = {}) {
        const {
            title = '¿Estás seguro?',
            message = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'warning', // 'warning', 'danger', 'info', 'success'
            confirmButtonClass = 'btn-primary',
            cancelButtonClass = 'btn-light'
        } = options;

        return new Promise((resolve) => {
            // Crear modal
            const modal = document.createElement('div');
            modal.className = 'sweet-confirm-modal sweet-confirm-bounce-in';
            
            // Icono según el tipo
            const icons = {
                warning: '⚠️',
                danger: '🗑️',
                info: 'ℹ️',
                success: '✓',
                question: '❓'
            };

            modal.innerHTML = `
                <div class="sweet-confirm-header">
                    <div class="sweet-confirm-icon sweet-confirm-icon-${type}">
                        ${icons[type] || icons.question}
                    </div>
                    <h3 class="sweet-confirm-title">${title}</h3>
                </div>
                ${message ? `<div class="sweet-confirm-body"><p>${message}</p></div>` : ''}
                <div class="sweet-confirm-footer">
                    <button class="btn ${cancelButtonClass} sweet-confirm-cancel">${cancelText}</button>
                    <button class="btn ${confirmButtonClass} sweet-confirm-confirm">${confirmText}</button>
                </div>
            `;

            // Agregar al overlay
            this.modalOverlay.appendChild(modal);
            this.modalOverlay.classList.add('sweet-confirm-show');

            // Focus en botón de confirmar
            setTimeout(() => {
                const confirmBtn = modal.querySelector('.sweet-confirm-confirm');
                if (confirmBtn) confirmBtn.focus();
            }, 100);

            // Manejadores de eventos
            const closeModal = (confirmed) => {
                modal.classList.remove('sweet-confirm-bounce-in');
                modal.classList.add('sweet-confirm-bounce-out');
                
                setTimeout(() => {
                    this.modalOverlay.classList.remove('sweet-confirm-show');
                    if (modal.parentElement) {
                        modal.parentElement.removeChild(modal);
                    }
                    resolve(confirmed);
                }, 300);
            };

            // Botón confirmar
            modal.querySelector('.sweet-confirm-confirm').addEventListener('click', () => {
                closeModal(true);
            });

            // Botón cancelar
            modal.querySelector('.sweet-confirm-cancel').addEventListener('click', () => {
                closeModal(false);
            });

            // Cerrar con ESC
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Cerrar al hacer clic en el overlay
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    closeModal(false);
                }
            });
        });
    }

    /**
     * Muestra una alerta simple
     * @param {Object} options - Opciones de configuración
     * @returns {Promise<void>}
     */
    alert(options = {}) {
        const {
            title = 'Información',
            message = '',
            buttonText = 'Aceptar',
            type = 'info'
        } = options;

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'sweet-confirm-modal sweet-confirm-bounce-in';
            
            const icons = {
                info: 'ℹ️',
                success: '✅',
                error: '❌',
                warning: '⚠️'
            };

            modal.innerHTML = `
                <div class="sweet-confirm-header">
                    <div class="sweet-confirm-icon sweet-confirm-icon-${type}">
                        ${icons[type] || icons.info}
                    </div>
                    <h3 class="sweet-confirm-title">${title}</h3>
                </div>
                ${message ? `<div class="sweet-confirm-body"><p>${message}</p></div>` : ''}
                <div class="sweet-confirm-footer">
                    <button class="btn btn-primary sweet-confirm-ok">${buttonText}</button>
                </div>
            `;

            this.modalOverlay.appendChild(modal);
            this.modalOverlay.classList.add('sweet-confirm-show');

            const closeModal = () => {
                modal.classList.remove('sweet-confirm-bounce-in');
                modal.classList.add('sweet-confirm-bounce-out');
                
                setTimeout(() => {
                    this.modalOverlay.classList.remove('sweet-confirm-show');
                    if (modal.parentElement) {
                        modal.parentElement.removeChild(modal);
                    }
                    resolve();
                }, 300);
            };

            modal.querySelector('.sweet-confirm-ok').addEventListener('click', closeModal);
            
            // Cerrar con ESC o Enter
            const keyHandler = (e) => {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    closeModal();
                    document.removeEventListener('keydown', keyHandler);
                }
            };
            document.addEventListener('keydown', keyHandler);
        });
    }
}

// Instancia global
const sweetConfirm = new SweetConfirm();

// Exponer globalmente
window.sweetConfirm = sweetConfirm;
