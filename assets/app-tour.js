/**
 * Tour Guiado para Nuevos Usuarios
 * Sistema de onboarding interactivo
 */

class AppTour {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.spotlight = null;
        this.tooltipBox = null;
        this.isActive = false;
    }

    /**
     * Define los pasos del tour
     */
    defineSteps() {
        this.steps = [
            {
                element: '.nav-tab[data-tab="recetas"]',
                title: '¡Bienvenido a Pizza Master! 🍕',
                content: 'Esta es tu sección de <strong>Recetas</strong>. Aquí puedes crear y gestionar todas tus recetas de pizza favoritas.',
                position: 'top'
            },
            {
                element: '#add-recipe-btn',
                title: 'Crear Nueva Receta',
                content: 'Haz clic en este botón para añadir una nueva receta. Puedes <strong>tomar fotos con la cámara</strong> 📷, agregar ingredientes y escribir los pasos de preparación.',
                position: 'bottom'
            },
            {
                element: '.nav-tab[data-tab="inventario"]',
                title: 'Tu Inventario',
                content: 'Aquí defines todos tus <strong>ingredientes base</strong> con sus precios. Luego podrás usarlos en tus recetas.',
                position: 'top'
            },
            {
                element: '.nav-tab[data-tab="calculadora"]',
                title: 'Calculadora de Masas',
                content: 'Calcula las cantidades exactas de harina, agua, sal y levadura para hacer la masa perfecta. ¡Con fórmulas profesionales!',
                position: 'top'
            },
            {
                element: '.nav-tab[data-tab="compras"]',
                title: 'Lista de Compras',
                content: 'Selecciona cuántas pizzas vas a hacer y genera automáticamente una lista de compras con los ingredientes y costos totales.',
                position: 'top'
            },
            {
                element: '.nav-tab[data-tab="diario"]',
                title: 'Diario de Horneado 📖',
                content: 'Registra tus horneos, apuntes, tiempos de fermentación y resultados. ¡Mejora con cada pizza!',
                position: 'top'
            },
            {
                element: '.nav-tab[data-tab="herramientas"]',
                title: 'Checklist de Herramientas 🔧',
                content: 'Gestiona tu equipamiento: palas, piedras para pizza, hornos y más. Marca lo que ya tienes disponible.',
                position: 'top'
            },
            {
                element: '#theme-toggle',
                title: 'Modo Oscuro/Claro',
                content: 'Cambia entre modo claro y oscuro según tus preferencias. ¡Tus ojos te lo agradecerán! 🌙',
                position: 'left'
            },
            {
                element: '#user-profile',
                title: 'Tu Perfil',
                content: 'Desde aquí puedes sincronizar tus datos con la nube y cerrar sesión. ¡Tus recetas estarán seguras!',
                position: 'right'
            }
        ];
    }

    /**
     * Inicia el tour
     */
    start() {
        if (this.isActive) return;
        
        this.defineSteps();
        this.currentStep = 0;
        this.isActive = true;
        
        // Crear overlay y elementos
        this.createOverlay();
        this.showStep(0);
        
        // Guardar que el usuario ya vio el tour
        localStorage.setItem('pizzaAppTourCompleted', 'true');
    }

    /**
     * Crea el overlay y elementos del tour
     */
    createOverlay() {
        // Overlay oscuro
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        
        // Spotlight (área iluminada)
        this.spotlight = document.createElement('div');
        this.spotlight.className = 'tour-spotlight';
        
        // Tooltip
        this.tooltipBox = document.createElement('div');
        this.tooltipBox.className = 'tour-tooltip';
        
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.spotlight);
        document.body.appendChild(this.tooltipBox);
        
        // Animación de entrada
        setTimeout(() => {
            this.overlay.classList.add('tour-overlay-show');
        }, 10);
    }

    /**
     * Muestra un paso específico
     * @param {number} stepIndex - Índice del paso
     */
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            this.end();
            return;
        }

        const step = this.steps[stepIndex];
        const targetElement = document.querySelector(step.element);
        
        if (!targetElement) {
            console.warn(`Elemento no encontrado: ${step.element}`);
            this.next();
            return;
        }

        // Scroll al elemento si es necesario
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            // Posicionar spotlight
            const rect = targetElement.getBoundingClientRect();
            this.spotlight.style.top = `${rect.top - 8}px`;
            this.spotlight.style.left = `${rect.left - 8}px`;
            this.spotlight.style.width = `${rect.width + 16}px`;
            this.spotlight.style.height = `${rect.height + 16}px`;
            this.spotlight.classList.add('tour-spotlight-show');

            // Crear contenido del tooltip
            this.tooltipBox.innerHTML = `
                <div class="tour-tooltip-header">
                    <h3>${step.title}</h3>
                    <button class="tour-close" aria-label="Cerrar tour">×</button>
                </div>
                <div class="tour-tooltip-body">
                    <p>${step.content}</p>
                </div>
                <div class="tour-tooltip-footer">
                    <div class="tour-progress">
                        <span>${stepIndex + 1} de ${this.steps.length}</span>
                        <div class="tour-progress-bar">
                            ${this.steps.map((_, i) => 
                                `<div class="tour-progress-dot ${i <= stepIndex ? 'active' : ''}"></div>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="tour-buttons">
                        ${stepIndex > 0 ? '<button class="btn btn-light btn-small tour-prev">Anterior</button>' : ''}
                        ${stepIndex < this.steps.length - 1 
                            ? '<button class="btn btn-primary btn-small tour-next">Siguiente</button>' 
                            : '<button class="btn btn-primary btn-small tour-finish">¡Entendido!</button>'}
                    </div>
                </div>
            `;

            // Posicionar tooltip
            this.positionTooltip(targetElement, step.position);

            // Event listeners
            const closeBtn = this.tooltipBox.querySelector('.tour-close');
            const nextBtn = this.tooltipBox.querySelector('.tour-next, .tour-finish');
            const prevBtn = this.tooltipBox.querySelector('.tour-prev');

            if (closeBtn) closeBtn.addEventListener('click', () => this.end());
            if (nextBtn) nextBtn.addEventListener('click', () => this.next());
            if (prevBtn) prevBtn.addEventListener('click', () => this.previous());

        }, 300);
    }

    /**
     * Posiciona el tooltip según el elemento y posición deseada
     */
    positionTooltip(element, position) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltipBox.getBoundingClientRect();
        
        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 20;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                this.tooltipBox.classList.add('tour-tooltip-top');
                break;
            case 'bottom':
                top = rect.bottom + 20;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                this.tooltipBox.classList.add('tour-tooltip-bottom');
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - 20;
                this.tooltipBox.classList.add('tour-tooltip-left');
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + 20;
                this.tooltipBox.classList.add('tour-tooltip-right');
                break;
            default:
                top = rect.bottom + 20;
                left = rect.left;
        }

        // Ajustar si se sale de la pantalla
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) top = 10;

        this.tooltipBox.style.top = `${top}px`;
        this.tooltipBox.style.left = `${left}px`;
        this.tooltipBox.classList.add('tour-tooltip-show');
    }

    /**
     * Siguiente paso
     */
    next() {
        this.currentStep++;
        this.tooltipBox.classList.remove('tour-tooltip-show', 'tour-tooltip-top', 'tour-tooltip-bottom', 'tour-tooltip-left', 'tour-tooltip-right');
        this.spotlight.classList.remove('tour-spotlight-show');
        
        setTimeout(() => {
            this.showStep(this.currentStep);
        }, 300);
    }

    /**
     * Paso anterior
     */
    previous() {
        this.currentStep--;
        this.tooltipBox.classList.remove('tour-tooltip-show', 'tour-tooltip-top', 'tour-tooltip-bottom', 'tour-tooltip-left', 'tour-tooltip-right');
        this.spotlight.classList.remove('tour-spotlight-show');
        
        setTimeout(() => {
            this.showStep(this.currentStep);
        }, 300);
    }

    /**
     * Termina el tour
     */
    end() {
        this.isActive = false;
        
        this.overlay.classList.remove('tour-overlay-show');
        this.spotlight.classList.remove('tour-spotlight-show');
        this.tooltipBox.classList.remove('tour-tooltip-show');

        setTimeout(() => {
            if (this.overlay) this.overlay.remove();
            if (this.spotlight) this.spotlight.remove();
            if (this.tooltipBox) this.tooltipBox.remove();
            
            this.overlay = null;
            this.spotlight = null;
            this.tooltipBox = null;
        }, 300);
    }

    /**
     * Verifica si se debe mostrar el tour a un nuevo usuario
     */
    static shouldShowTour() {
        return !localStorage.getItem('pizzaAppTourCompleted');
    }
}

// Instancia global
const appTour = new AppTour();

// Exponer globalmente
window.appTour = appTour;
