/**
 * Mejoras de UI - Integración de componentes avanzados
 * Este archivo contiene las integraciones de los nuevos componentes en app.js
 */

// ============================================
// INICIALIZACIÓN MEJORADA
// ============================================

/**
 * Agrega esta función al final de la función init() en app.js
 */
function initEnhancedUI() {
    // Ocultar splash screen después de que todo cargue
    setTimeout(() => {
        if (window.splashScreen) {
            splashScreen.hide(() => {
                console.log('App cargada completamente');
                // Mostrar tour si es la primera vez
                if (AppTour.shouldShowTour()) {
                    setTimeout(() => {
                        if (window.appTour) {
                            appTour.start();
                        }
                    }, 500);
                }
            });
        }
    }, 1000);

    // Configurar atajos de teclado
    setupKeyboardShortcuts();
    
    // Configurar tooltips en elementos importantes
    setupTooltips();
    
    // Configurar botón flotante de ayuda
    setupHelpButton();
    
    // Configurar integración de cámara
    if (window.setupCameraIntegration) {
        setupCameraIntegration();
    }
}

// ============================================
// BOTÓN FLOTANTE DE AYUDA
// ============================================

function setupHelpButton() {
    const helpBtn = document.getElementById('help-fab');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            if (window.appTour) {
                appTour.start();
            }
        });
    }
}

// ============================================
// REEMPLAZAR ALERT/CONFIRM
// ============================================

/**
 * Reemplazar todos los alert() y confirm() en app.js con las versiones personalizadas
 * Buscar y reemplazar:
 * 
 * - confirm('texto') -> await sweetConfirm.confirm({ message: 'texto' })
 * - alert('texto') -> toast.info('texto') o sweetConfirm.alert({ message: 'texto' })
 */

// Ejemplo de cómo modificar la función de borrado de recetas:
async function deleteRecipeEnhanced(recipeId) {
    const confirmed = await sweetConfirm.confirm({
        title: '¿Borrar esta receta?',
        message: 'Esta acción no se puede deshacer.',
        confirmText: 'Sí, borrar',
        cancelText: 'Cancelar',
        type: 'danger',
        confirmButtonClass: 'btn-danger'
    });
    
    if (confirmed) {
        // Mostrar loading
        const loadingToast = toast.loading('Eliminando receta...');
        
        try {
            appData.recipes = appData.recipes.filter(r => r.id !== recipeId);
            await saveData();
            renderRecipes();
            renderShoppingListBuilder();
            
            loadingToast.close();
            toast.success('✓ Receta eliminada correctamente');
        } catch (error) {
            loadingToast.close();
            toast.error('Error al eliminar la receta');
            console.error(error);
        }
    }
}

// ============================================
// ATAJOS DE TECLADO
// ============================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N - Nueva receta
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const addRecipeBtn = document.getElementById('add-recipe-btn');
            if (addRecipeBtn && document.getElementById('recetas').classList.contains('active')) {
                addRecipeBtn.click();
                if (window.toast) toast.info('📝 Nueva receta', 1500);
            }
        }
        
        // Ctrl/Cmd + S - Guardar (cuando hay un modal abierto)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer && modalContainer.classList.contains('visible')) {
                const submitBtn = document.querySelector('.modal-content[style*="display: block"] form button[type="submit"]');
                if (submitBtn) {
                    submitBtn.click();
                    if (window.toast) toast.info('💾 Guardando...', 1500);
                }
            }
        }
        
        // Ctrl/Cmd + K - Abrir calculadora
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const calcTab = document.querySelector('.nav-tab[data-tab="calculadora"]');
            if (calcTab) {
                calcTab.click();
                if (window.toast) toast.info('🧮 Calculadora', 1500);
            }
        }
        
        // Ctrl/Cmd + I - Abrir inventario
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            const invTab = document.querySelector('.nav-tab[data-tab="inventario"]');
            if (invTab) {
                invTab.click();
                if (window.toast) toast.info('📦 Inventario', 1500);
            }
        }
        
        // Ctrl/Cmd + H - Mostrar ayuda/tour
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            if (window.appTour) {
                appTour.start();
            }
        }
        
        // F1 - Mostrar ayuda
        if (e.key === 'F1') {
            e.preventDefault();
            if (window.appTour) {
                appTour.start();
            }
        }
    });
    
    // Mostrar mensaje inicial sobre atajos
    setTimeout(() => {
        const hasSeenShortcuts = localStorage.getItem('hasSeenKeyboardShortcuts');
        if (!hasSeenShortcuts && window.toast) {
            toast.info('💡 Tip: Usa Ctrl+H para ver el tour guiado y conocer los atajos de teclado', 5000);
            localStorage.setItem('hasSeenKeyboardShortcuts', 'true');
        }
    }, 3000);
}

// ============================================
// TOOLTIPS SIMPLES (Sin biblioteca externa)
// ============================================

function setupTooltips() {
    // Crear elementos de tooltip si no existen
    let tooltipElement = document.getElementById('custom-tooltip');
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.id = 'custom-tooltip';
        tooltipElement.className = 'custom-tooltip';
        document.body.appendChild(tooltipElement);
    }
    
    // Agregar atributos data-tooltip a elementos importantes
    const tooltipConfig = [
        { selector: '#add-recipe-btn', text: 'Añadir nueva receta (Ctrl+N)' },
        { selector: '#add-ingredient-btn', text: 'Añadir nuevo ingrediente al inventario' },
        { selector: '#theme-toggle', text: 'Cambiar entre modo claro y oscuro' },
        { selector: '#sync-now-btn', text: 'Sincronizar datos con la nube' },
        { selector: '#calculate-btn', text: 'Calcular cantidades de masa' },
        { selector: '#generate-shopping-list-btn', text: 'Generar lista de compras' },
        { selector: '#export-json-btn', text: 'Exportar todos tus datos a un archivo' },
        { selector: '.nav-tab[data-tab="recetas"]', text: 'Ver tus recetas de pizza' },
        { selector: '.nav-tab[data-tab="inventario"]', text: 'Gestionar ingredientes (Ctrl+I)' },
        { selector: '.nav-tab[data-tab="calculadora"]', text: 'Calculadora de masas (Ctrl+K)' },
        { selector: '.nav-tab[data-tab="compras"]', text: 'Generar lista de compras' },
        { selector: '.nav-tab[data-tab="diario"]', text: 'Tu diario de horneado' },
        { selector: '.nav-tab[data-tab="herramientas"]', text: 'Checklist de herramientas' },
        { selector: '.nav-tab[data-tab="ajustes"]', text: 'Configuración y ajustes' }
    ];
    
    tooltipConfig.forEach(({ selector, text }) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.setAttribute('data-tooltip', text);
        });
    });
    
    // Event listeners para mostrar/ocultar tooltips
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            const text = target.getAttribute('data-tooltip');
            showTooltip(target, text);
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            hideTooltip();
        }
    });
}

function showTooltip(element, text) {
    const tooltip = document.getElementById('custom-tooltip');
    if (!tooltip) return;
    
    tooltip.textContent = text;
    tooltip.classList.add('custom-tooltip-show');
    
    // Posicionar tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10;
    
    // Ajustar si se sale de la pantalla
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
        top = rect.bottom + 10;
        tooltip.classList.add('custom-tooltip-bottom');
    } else {
        tooltip.classList.remove('custom-tooltip-bottom');
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
        tooltip.classList.remove('custom-tooltip-show', 'custom-tooltip-bottom');
    }
}

// ============================================
// ANIMACIÓN DE ÉXITO
// ============================================

function showSuccessAnimation(message = '¡Guardado exitosamente!') {
    // Crear elemento de confetti/éxito
    const successOverlay = document.createElement('div');
    successOverlay.className = 'success-overlay';
    successOverlay.innerHTML = `
        <div class="success-animation">
            <div class="success-checkmark">✓</div>
            <div class="success-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(successOverlay);
    
    setTimeout(() => {
        successOverlay.classList.add('success-overlay-show');
    }, 10);
    
    setTimeout(() => {
        successOverlay.classList.remove('success-overlay-show');
        setTimeout(() => {
            successOverlay.remove();
        }, 300);
    }, 1500);
}

// ============================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ============================================

window.initEnhancedUI = initEnhancedUI;
window.deleteRecipeEnhanced = deleteRecipeEnhanced;
window.showSuccessAnimation = showSuccessAnimation;
window.setupKeyboardShortcuts = setupKeyboardShortcuts;
window.setupTooltips = setupTooltips;
