/**
 * EJEMPLOS PRÁCTICOS DE USO
 * Copia y pega estos ejemplos en tu código para usar las nuevas características
 */

// ============================================
// 1. NOTIFICACIONES TOAST
// ============================================

// Éxito simple
toast.success('Receta guardada correctamente');

// Error con duración personalizada (5 segundos)
toast.error('Error al conectar con el servidor', 5000);

// Advertencia
toast.warning('Esta acción no se puede deshacer');

// Información
toast.info('Recuerda guardar tus cambios');

// Toast de carga (para operaciones largas)
async function guardarReceta(receta) {
    const loadingToast = toast.loading('Guardando receta...');
    
    try {
        await firebase.guardar(receta);
        loadingToast.close();
        toast.success('✓ Receta guardada correctamente');
        showSuccessAnimation('¡Receta guardada!');
    } catch (error) {
        loadingToast.close();
        toast.error('Error al guardar: ' + error.message);
    }
}

// Toast con actualización de mensaje
async function procesarLote(items) {
    const loading = toast.loading('Procesando 0/' + items.length);
    
    for (let i = 0; i < items.length; i++) {
        await procesar(items[i]);
        loading.updateMessage(`Procesando ${i + 1}/${items.length}`);
    }
    
    loading.close();
    toast.success(`✓ ${items.length} elementos procesados`);
}

// ============================================
// 2. CONFIRMACIONES ELEGANTES
// ============================================

// Confirmación simple
async function eliminarReceta(id) {
    const confirmed = await sweetConfirm.confirm({
        title: '¿Borrar esta receta?',
        message: 'Esta acción no se puede deshacer',
        confirmText: 'Sí, borrar',
        cancelText: 'Cancelar',
        type: 'danger',
        confirmButtonClass: 'btn-danger'
    });
    
    if (confirmed) {
        // Borrar receta
        toast.success('Receta eliminada');
    }
}

// Confirmación de advertencia
async function limpiarInventario() {
    const confirmed = await sweetConfirm.confirm({
        title: '⚠️ ¿Limpiar todo el inventario?',
        message: 'Se eliminarán todos los ingredientes. Asegúrate de tener un respaldo.',
        confirmText: 'Sí, limpiar todo',
        cancelText: 'Mejor no',
        type: 'warning'
    });
    
    if (confirmed) {
        appData.inventory = [];
        saveData();
        toast.success('Inventario limpiado');
    }
}

// Alerta simple (reemplazo de alert())
async function mostrarInfo() {
    await sweetConfirm.alert({
        title: 'Información importante',
        message: 'Recuerda sincronizar tus datos regularmente',
        buttonText: 'Entendido',
        type: 'info'
    });
}

// Alerta de éxito
async function operacionCompletada() {
    await sweetConfirm.alert({
        title: '¡Completado!',
        message: 'Tus datos han sido exportados exitosamente',
        buttonText: 'Genial',
        type: 'success'
    });
}

// ============================================
// 3. ANIMACIONES DE ÉXITO
// ============================================

// Animación simple
function guardarConAnimacion() {
    saveData();
    showSuccessAnimation('¡Guardado exitosamente!');
}

// Con mensaje personalizado
function completarPedido() {
    procesarPedido();
    showSuccessAnimation('🎉 ¡Pedido completado!');
}

// Combinar con toast
async function guardarYNotificar() {
    await saveData();
    showSuccessAnimation('¡Guardado!');
    setTimeout(() => {
        toast.success('Datos sincronizados con la nube');
    }, 1500);
}

// ============================================
// 4. TOUR GUIADO
// ============================================

// Iniciar tour manualmente
document.getElementById('help-fab').addEventListener('click', () => {
    appTour.start();
});

// Reiniciar tour para nuevos usuarios
function resetearTour() {
    localStorage.removeItem('pizzaAppTourCompleted');
    appTour.start();
}

// Verificar si debe mostrar el tour
if (AppTour.shouldShowTour()) {
    setTimeout(() => {
        appTour.start();
    }, 2000);
}

// ============================================
// 5. TOOLTIPS PERSONALIZADOS
// ============================================

// Agregar tooltip a un botón
const button = document.createElement('button');
button.className = 'btn btn-primary';
button.setAttribute('data-tooltip', 'Haz clic para guardar (Ctrl+S)');
button.textContent = 'Guardar';

// Agregar tooltip a múltiples elementos
document.querySelectorAll('.card').forEach((card, index) => {
    card.setAttribute('data-tooltip', `Receta #${index + 1}`);
});

// Tooltip dinámico basado en estado
const syncBtn = document.getElementById('sync-btn');
if (isOnline()) {
    syncBtn.setAttribute('data-tooltip', 'Sincronizar con la nube');
} else {
    syncBtn.setAttribute('data-tooltip', 'Sin conexión - modo offline');
}

// ============================================
// 6. SPLASH SCREEN
// ============================================

// Actualizar texto del splash
if (window.splashScreen) {
    splashScreen.updateText('Cargando recetas...');
}

// Ocultar splash manualmente
if (window.splashScreen) {
    splashScreen.hide(() => {
        console.log('Splash cerrado, app lista');
        // Inicializar app
    });
}

// ============================================
// 7. ATAJOS DE TECLADO
// ============================================

// Los atajos se configuran automáticamente, pero puedes agregar más:

document.addEventListener('keydown', (e) => {
    // Ctrl+E para exportar
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
        toast.info('💾 Exportando datos...');
    }
    
    // Ctrl+P para imprimir lista de compras
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        generateShoppingPDF();
        toast.info('🖨️ Generando PDF...');
    }
    
    // Ctrl+D para ir al diario
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        document.querySelector('.nav-tab[data-tab="diario"]').click();
        toast.info('📔 Diario');
    }
});

// ============================================
// 8. PALETAS DE COLORES
// ============================================

// Aplicar paleta predefinida
function cambiarPaleta(nombre) {
    const paletas = {
        roja: { primary: '#e63946', secondary: '#f1faee', accent: '#457b9d' },
        azul: { primary: '#2196F3', secondary: '#E3F2FD', accent: '#1976D2' },
        verde: { primary: '#4CAF50', secondary: '#E8F5E9', accent: '#388E3C' }
    };
    
    const colores = paletas[nombre];
    applyColorScheme(colores.primary, colores.secondary, colores.accent);
    saveColors({ ...colores, preset: nombre });
    toast.success(`Paleta "${nombre}" aplicada`);
}

// Aplicar colores personalizados
function aplicarColoresPersonalizados(primary, secondary, accent) {
    applyColorScheme(primary, secondary, accent);
    saveColors({ primary, secondary, accent, preset: 'custom' });
    toast.success('Colores personalizados aplicados');
}

// ============================================
// 9. EJEMPLOS COMBINADOS
// ============================================

// Flujo completo: Guardar receta con feedback visual
async function guardarRecetaCompleta(receta) {
    // 1. Validar
    if (!receta.title) {
        toast.error('El título es obligatorio');
        return;
    }
    
    // 2. Confirmar
    const confirmed = await sweetConfirm.confirm({
        title: '¿Guardar receta?',
        message: `Se guardará la receta "${receta.title}"`,
        confirmText: 'Guardar',
        type: 'info'
    });
    
    if (!confirmed) return;
    
    // 3. Mostrar loading
    const loading = toast.loading('Guardando receta...');
    
    try {
        // 4. Guardar
        await guardarEnFirebase(receta);
        
        // 5. Cerrar loading
        loading.close();
        
        // 6. Mostrar éxito
        showSuccessAnimation('¡Receta guardada!');
        
        // 7. Notificación final
        setTimeout(() => {
            toast.success('✓ Receta sincronizada con la nube');
        }, 1500);
        
        // 8. Cerrar modal
        closeModal();
        
        // 9. Actualizar vista
        renderRecipes();
        
    } catch (error) {
        loading.close();
        toast.error('Error al guardar: ' + error.message);
    }
}

// Flujo de eliminación con confirmación doble
async function eliminarConConfirmacionDoble(id) {
    // Primera confirmación
    const confirmed1 = await sweetConfirm.confirm({
        title: '¿Borrar elemento?',
        message: 'Esta acción es permanente',
        confirmText: 'Sí, borrar',
        type: 'warning'
    });
    
    if (!confirmed1) return;
    
    // Segunda confirmación
    const confirmed2 = await sweetConfirm.confirm({
        title: '¿Estás completamente seguro?',
        message: 'No podrás recuperar este elemento después',
        confirmText: 'Sí, estoy seguro',
        type: 'danger'
    });
    
    if (!confirmed2) return;
    
    // Eliminar
    const loading = toast.loading('Eliminando...');
    await eliminar(id);
    loading.close();
    toast.success('Elemento eliminado');
}

// Operación batch con progreso
async function importarRecetas(recetas) {
    const total = recetas.length;
    const loading = toast.loading(`Importando 0/${total} recetas...`);
    
    let importadas = 0;
    let errores = 0;
    
    for (let i = 0; i < recetas.length; i++) {
        try {
            await guardarReceta(recetas[i]);
            importadas++;
        } catch (error) {
            errores++;
        }
        
        loading.updateMessage(`Importando ${i + 1}/${total} recetas...`);
    }
    
    loading.close();
    
    if (errores === 0) {
        showSuccessAnimation(`¡${importadas} recetas importadas!`);
        toast.success(`✓ ${importadas} recetas importadas correctamente`);
    } else {
        toast.warning(`${importadas} importadas, ${errores} con errores`);
    }
}

// ============================================
// 10. MEJORES PRÁCTICAS
// ============================================

// ✅ HACER: Usar toast para feedback rápido
function copiarTexto(texto) {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado al portapapeles', 2000);
}

// ✅ HACER: Confirmar acciones destructivas
async function borrarTodo() {
    const confirmed = await sweetConfirm.confirm({
        title: 'Borrar todos los datos',
        message: 'Se eliminarán todas las recetas, ingredientes y datos',
        type: 'danger'
    });
    if (confirmed) { /* borrar */ }
}

// ✅ HACER: Mostrar progreso en operaciones largas
async function sincronizar() {
    const loading = toast.loading('Sincronizando...');
    try {
        await pushToCloud();
        loading.close();
        showSuccessAnimation('¡Sincronizado!');
    } catch (error) {
        loading.close();
        toast.error('Error de sincronización');
    }
}

// ❌ EVITAR: Usar alert/confirm nativos
// alert('Guardado'); // ❌ NO
toast.success('Guardado'); // ✅ SÍ

// ❌ EVITAR: Múltiples toasts simultáneos
// toast.info('Uno');
// toast.info('Dos');
// toast.info('Tres'); // Se amontonan

// ✅ HACER: Espaciar notificaciones o usar una con actualización
const loading = toast.loading('Paso 1...');
await paso1();
loading.updateMessage('Paso 2...');
await paso2();
loading.close();
toast.success('Completado');

// ============================================
// 11. DEBUGGING
// ============================================

// Ver estado del tour
console.log('Tour completado:', localStorage.getItem('pizzaAppTourCompleted'));

// Ver colores guardados
console.log('Colores:', JSON.parse(localStorage.getItem('appColors')));

// Ver tema actual
console.log('Tema:', document.documentElement.getAttribute('data-theme'));

// Forzar tour (útil en desarrollo)
localStorage.removeItem('pizzaAppTourCompleted');
window.location.reload();

// Ver todos los localStorage keys
Object.keys(localStorage).forEach(key => {
    console.log(key, localStorage.getItem(key));
});
