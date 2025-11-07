/**
 * Swipe Gestures - Gestos Táctiles para Eliminar
 * Sistema de gestos swipe para eliminar elementos (sin dependencias externas)
 */

class SwipeGestures {
    constructor() {
        this.activeElement = null;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.threshold = 100; // Píxeles necesarios para considerar swipe
        this.hasMovedEnough = false; // Detectar si se movió lo suficiente para ser swipe
    }

    /**
     * Inicializa los gestos en los elementos de la app
     */
    init() {
        console.log('Inicializando gestos swipe...');
        
        // Configurar gestos en recetas
        this.setupRecipeSwipes();
        
        // Configurar gestos en inventario
        this.setupInventorySwipes();
        
        // Configurar gestos en diario
        this.setupDiarySwipes();
        
        // Configurar gestos en herramientas
        this.setupToolsSwipes();
        
        // Mostrar notificación solo si toast está disponible
        if (window.toast) {
            toast.info('👆 Desliza elementos hacia la izquierda para eliminar', 3000);
        }
    }

    /**
     * Configura swipe en tarjetas de recetas
     */
    setupRecipeSwipes() {
        const recipeList = document.getElementById('recipe-list');
        if (!recipeList) return;

        // Usar delegación de eventos para elementos dinámicos
        this.setupSwipeListener(recipeList, '.recipe-card', async (element) => {
            const deleteBtn = element.querySelector('[data-action="delete-recipe"]');
            if (deleteBtn) {
                const recipeId = deleteBtn.dataset.id;
                const recipe = appData.recipes.find(r => r.id === recipeId);
                
                const confirmed = await sweetConfirm.confirm({
                    title: '¿Eliminar receta?',
                    message: recipe ? `Se eliminará "${recipe.title}"` : 'Esta acción no se puede deshacer',
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    confirmButtonClass: 'btn-danger'
                });
                
                if (confirmed) {
                    // Animar salida
                    element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    element.style.transform = 'translateX(-120%)';
                    element.style.opacity = '0';
                    
                    setTimeout(() => {
                        deleteBtn.click();
                    }, 300);
                } else {
                    this.resetElement(element);
                }
            }
        });
    }

    /**
     * Configura swipe en tarjetas de inventario
     */
    setupInventorySwipes() {
        const inventoryList = document.getElementById('inventory-list');
        if (!inventoryList) return;

        this.setupSwipeListener(inventoryList, '.ingredient-card', async (element) => {
            const deleteBtn = element.querySelector('[data-action="delete-inventory"]');
            if (deleteBtn) {
                const itemId = deleteBtn.dataset.id;
                const item = appData.inventory.find(i => i.id === itemId);
                
                const confirmed = await sweetConfirm.confirm({
                    title: '¿Eliminar ingrediente?',
                    message: item ? `Se eliminará "${item.name}"` : 'Esta acción no se puede deshacer',
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    confirmButtonClass: 'btn-danger'
                });
                
                if (confirmed) {
                    element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    element.style.transform = 'translateX(-120%)';
                    element.style.opacity = '0';
                    
                    setTimeout(() => {
                        deleteBtn.click();
                    }, 300);
                } else {
                    this.resetElement(element);
                }
            }
        });
    }

    /**
     * Configura swipe en entradas del diario
     */
    setupDiarySwipes() {
        const diaryList = document.getElementById('diary-list');
        if (!diaryList) return;

        this.setupSwipeListener(diaryList, '.timeline-item', async (element) => {
            const deleteBtn = element.querySelector('[data-action="delete-diary"]');
            if (deleteBtn) {
                const entryId = deleteBtn.dataset.id;
                const entry = appData.diary.find(d => d.id === entryId);
                
                const confirmed = await sweetConfirm.confirm({
                    title: '¿Eliminar entrada?',
                    message: entry ? `Se eliminará "${entry.title}"` : 'Esta acción no se puede deshacer',
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    confirmButtonClass: 'btn-danger'
                });
                
                if (confirmed) {
                    element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    element.style.transform = 'translateX(-120%)';
                    element.style.opacity = '0';
                    
                    setTimeout(() => {
                        deleteBtn.click();
                    }, 300);
                } else {
                    this.resetElement(element);
                }
            }
        });
    }

    /**
     * Configura swipe en herramientas
     */
    setupToolsSwipes() {
        const toolsList = document.getElementById('tools-checklist');
        if (!toolsList) return;

        this.setupSwipeListener(toolsList, '.tool-card', async (element) => {
            const deleteBtn = element.querySelector('[data-action="delete-tool"]');
            if (deleteBtn) {
                const toolId = deleteBtn.dataset.id;
                const tool = appData.tools.find(t => t.id === toolId);
                
                const confirmed = await sweetConfirm.confirm({
                    title: '¿Eliminar herramienta?',
                    message: tool ? `Se eliminará "${tool.name}"` : 'Esta acción no se puede deshacer',
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    confirmButtonClass: 'btn-danger'
                });
                
                if (confirmed) {
                    element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    element.style.transform = 'translateX(-120%)';
                    element.style.opacity = '0';
                    
                    setTimeout(() => {
                        deleteBtn.click();
                    }, 300);
                } else {
                    this.resetElement(element);
                }
            }
        });
    }

    /**
     * Configura listeners de swipe en un contenedor
     * @param {HTMLElement} container - Contenedor padre
     * @param {string} selector - Selector de elementos swipeables
     * @param {Function} onSwipe - Callback cuando se completa el swipe
     */
    setupSwipeListener(container, selector, onSwipe) {
        if (!container) return;

        // Touch events
        container.addEventListener('touchstart', (e) => {
            // Ignorar si el toque fue en un botón o enlace
            if (e.target.closest('button, a, input, select, textarea')) {
                return;
            }
            
            const element = e.target.closest(selector);
            if (!element) return;
            
            this.handleTouchStart(e, element);
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!this.activeElement) return;
            this.handleTouchMove(e);
        }, { passive: false });

        container.addEventListener('touchend', async (e) => {
            if (!this.activeElement) return;
            await this.handleTouchEnd(onSwipe);
        });

        // Mouse events (para testing en desktop)
        container.addEventListener('mousedown', (e) => {
            // Ignorar si el clic fue en un botón o enlace
            if (e.target.closest('button, a, input, select, textarea')) {
                return;
            }
            
            const element = e.target.closest(selector);
            if (!element) return;
            
            this.handleMouseDown(e, element);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.activeElement || !this.isDragging) return;
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', async (e) => {
            if (!this.activeElement || !this.isDragging) return;
            await this.handleMouseUp(onSwipe);
        });
    }

    /**
     * Maneja el inicio del touch
     */
    handleTouchStart(e, element) {
        this.activeElement = element;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.currentX = this.startX;
        this.isDragging = false; // No activar dragging hasta que se mueva
        this.hasMovedEnough = false;
        
        // No agregar clase aún, esperar a que se mueva
    }

    /**
     * Maneja el movimiento del touch
     */
    handleTouchMove(e) {
        if (!this.activeElement) return;
        
        this.currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const deltaX = this.currentX - this.startX;
        const deltaY = currentY - this.startY;
        
        // Si se movió más de 10px, considerar que es un swipe (no un tap)
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            this.hasMovedEnough = true;
            
            // Solo activar si es movimiento horizontal
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.activeElement.classList.add('swipe-active');
                }
                
                e.preventDefault(); // Prevenir scroll
                
                // Solo permitir swipe hacia la izquierda
                if (deltaX < 0) {
                    const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
                    this.activeElement.style.transform = `translateX(${deltaX}px)`;
                    this.activeElement.style.opacity = opacity;
                    
                    // Cambiar color de fondo para indicar eliminación
                    if (Math.abs(deltaX) > this.threshold) {
                        this.activeElement.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
                    } else {
                        this.activeElement.style.backgroundColor = '';
                    }
                }
            }
        }
    }

    /**
     * Maneja el fin del touch
     */
    async handleTouchEnd(onSwipe) {
        if (!this.activeElement) return;
        
        const deltaX = this.currentX - this.startX;
        
        // Solo ejecutar si se movió lo suficiente (no fue un simple tap)
        if (!this.hasMovedEnough) {
            this.cleanup();
            return;
        }
        
        // Si el swipe fue suficiente, ejecutar acción
        if (this.isDragging && deltaX < -this.threshold) {
            this.activeElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            this.activeElement.style.transform = 'translateX(-120%)';
            this.activeElement.style.opacity = '0';
            
            // Ejecutar callback
            if (onSwipe) {
                await onSwipe(this.activeElement);
            }
        } else {
            // Resetear posición
            this.resetElement(this.activeElement);
        }
        
        this.cleanup();
    }

    /**
     * Maneja el inicio del mouse (para testing en desktop)
     */
    handleMouseDown(e, element) {
        this.activeElement = element;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = this.startX;
        this.isDragging = false; // No activar hasta que se mueva
        this.hasMovedEnough = false;
        
        e.preventDefault();
    }

    /**
     * Maneja el movimiento del mouse
     */
    handleMouseMove(e) {
        if (!this.activeElement) return;
        
        this.currentX = e.clientX;
        const deltaX = this.currentX - this.startX;
        const deltaY = e.clientY - this.startY;
        
        // Si se movió más de 10px, considerar que es un swipe
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            this.hasMovedEnough = true;
            
            // Solo activar si es movimiento horizontal
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.activeElement.classList.add('swipe-active');
                }
                
                // Solo permitir swipe hacia la izquierda
                if (deltaX < 0) {
                    const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
                    this.activeElement.style.transform = `translateX(${deltaX}px)`;
                    this.activeElement.style.opacity = opacity;
                    
                    if (Math.abs(deltaX) > this.threshold) {
                        this.activeElement.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
                    } else {
                        this.activeElement.style.backgroundColor = '';
                    }
                }
            }
        }
    }

    /**
     * Maneja el fin del mouse
     */
    async handleMouseUp(onSwipe) {
        if (!this.activeElement) return;
        
        const deltaX = this.currentX - this.startX;
        
        // Solo ejecutar si se movió lo suficiente (no fue un simple click)
        if (!this.hasMovedEnough) {
            this.cleanup();
            return;
        }
        
        if (this.isDragging && deltaX < -this.threshold) {
            this.activeElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            this.activeElement.style.transform = 'translateX(-120%)';
            this.activeElement.style.opacity = '0';
            
            if (onSwipe) {
                await onSwipe(this.activeElement);
            }
        } else {
            this.resetElement(this.activeElement);
        }
        
        this.cleanup();
    }

    /**
     * Resetea un elemento a su posición original
     */
    resetElement(element) {
        if (!element) return;
        
        element.style.transition = 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease';
        element.style.transform = 'translateX(0)';
        element.style.opacity = '1';
        element.style.backgroundColor = '';
        
        setTimeout(() => {
            element.style.transition = '';
            element.classList.remove('swipe-active');
        }, 300);
    }

    /**
     * Limpia el estado
     */
    cleanup() {
        if (this.activeElement) {
            this.activeElement.classList.remove('swipe-active');
        }
        
        this.activeElement = null;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.hasMovedEnough = false;
    }

    /**
     * Reinicia los gestos (útil después de renderizar nuevo contenido)
     */
    refresh() {
        this.cleanup();
        // Los listeners ya están configurados por delegación de eventos
        console.log('Gestos swipe actualizados');
    }
}

// Instancia global
window.swipeGestures = new SwipeGestures();
