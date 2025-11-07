# 👆 Gestos Swipe - Guía de Uso

## Descripción

Los **Gestos Swipe** permiten eliminar elementos de tus listas deslizándolos hacia la izquierda, especialmente útil en dispositivos móviles para una experiencia más intuitiva.

---

## ✨ Características

- ✅ **Desliza para eliminar** - Gesto natural en móviles
- ✅ **Confirmación elegante** - Evita eliminaciones accidentales
- ✅ **Animaciones suaves** - Feedback visual agradable
- ✅ **Soporte táctil y mouse** - Funciona en móviles y desktop
- ✅ **Sin dependencias** - Implementación nativa en JavaScript
- ✅ **Threshold inteligente** - Solo elimina con swipe suficiente

---

## 🚀 Cómo Usar

### En Dispositivos Móviles (Touch)

1. **Toca y mantén** presionado sobre el elemento
2. **Desliza hacia la izquierda** (←)
3. **Verás el fondo cambiar a rojo** cuando alcances el umbral
4. **Suelta** para confirmar la eliminación
5. Aparecerá un modal de confirmación
6. Confirma para eliminar o cancela para restaurar

### En Desktop (Mouse)

1. **Haz clic y mantén** sobre el elemento
2. **Arrastra hacia la izquierda** (←)
3. El elemento se moverá siguiendo el cursor
4. **Suelta el mouse** cuando veas el fondo rojo
5. Confirma la eliminación en el modal

---

## 📱 Dónde Funciona

### ✅ Secciones Habilitadas

| Sección | Elementos Swipeables |
|---------|---------------------|
| **Recetas** | Tarjetas de recetas de pizza |
| **Inventario** | Tarjetas de ingredientes |
| **Diario** | Entradas del timeline |
| **Herramientas** | Tarjetas de herramientas |

### ❌ Secciones No Habilitadas

- Calculadora (no tiene listas)
- Lista de Compras (tiene botones específicos)
- Ajustes (no requiere eliminación)

---

## 🎯 Consejos de Uso

### Para Móviles
- 📱 **Desliza con decisión** - Un movimiento rápido y firme
- 👆 **No confundir con scroll** - Desliza horizontalmente, no verticalmente
- ⚡ **Umbral de 100px** - Necesitas deslizar al menos 100 píxeles
- 🔄 **Si cambias de opinión** - Desliza de vuelta a la derecha antes de soltar

### Para Desktop
- 🖱️ **Usa el mouse** - Click y arrastra
- ⌨️ **Alternativa** - Usa los botones de eliminar directamente
- 🎨 **Feedback visual** - El elemento se vuelve semi-transparente

---

## ⚙️ Configuración

### Cambiar el Umbral de Swipe

Edita `assets/swipe-gestures.js`, línea ~7:

```javascript
class SwipeGestures {
    constructor() {
        // ...
        this.threshold = 100; // Cambiar este valor
        // Valores recomendados: 80-150 píxeles
    }
}
```

- **Menor umbral (50-80px)** - Más fácil eliminar, pero más accidentes
- **Mayor umbral (120-200px)** - Más seguro, pero requiere más esfuerzo

### Deshabilitar en Desktop

Si solo quieres gestos en móviles, edita `assets/swipe-gestures.js`:

```javascript
setupSwipeListener(container, selector, onSwipe) {
    if (!container) return;
    
    // Solo habilitar en dispositivos táctiles
    if (!('ontouchstart' in window)) {
        console.log('Swipe deshabilitado en desktop');
        return;
    }
    
    // ... resto del código
}
```

---

## 🔧 Personalización

### Cambiar el Color del Indicador de Eliminación

Edita `assets/styles.css`:

```css
.swipe-active {
    background-color: rgba(244, 67, 54, 0.2); /* Rojo por defecto */
}

/* Cambiar a otro color: */
.swipe-active {
    background-color: rgba(255, 165, 0, 0.2); /* Naranja */
}
```

### Agregar Icono de Eliminación

Puedes agregar un icono "🗑️" que aparezca al deslizar:

```javascript
// En swipe-gestures.js, método handleTouchMove:
if (Math.abs(deltaX) > this.threshold) {
    this.activeElement.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
    
    // Agregar icono si no existe
    if (!this.activeElement.querySelector('.delete-icon')) {
        const icon = document.createElement('span');
        icon.className = 'delete-icon';
        icon.textContent = '🗑️';
        icon.style.cssText = 'position: absolute; right: 20px; font-size: 2rem;';
        this.activeElement.appendChild(icon);
    }
}
```

---

## 🛠️ API - Uso Programático

### Inicializar Gestos

```javascript
// Los gestos se inicializan automáticamente con initEnhancedUI()
// Pero puedes reinicializarlos manualmente:
swipeGestures.init();
```

### Refrescar Después de Renderizar

```javascript
// Después de agregar nuevos elementos a una lista:
renderRecipes();
swipeGestures.refresh();
```

### Limpiar Estado

```javascript
// Si algo sale mal, limpia el estado:
swipeGestures.cleanup();
```

### Configurar en Nuevas Listas

```javascript
const miLista = document.getElementById('mi-lista');

swipeGestures.setupSwipeListener(
    miLista,                    // Contenedor
    '.mi-item',                 // Selector de elementos
    async (element) => {        // Callback al completar swipe
        const confirmed = await sweetConfirm.confirm({
            title: '¿Eliminar?',
            message: 'Esta acción no se puede deshacer',
            type: 'danger'
        });
        
        if (confirmed) {
            // Eliminar elemento
            element.remove();
        } else {
            // Restaurar posición
            swipeGestures.resetElement(element);
        }
    }
);
```

---

## 🎨 Estados y Clases CSS

### Clases Dinámicas

- `.swipe-active` - Se agrega al elemento mientras se arrastra
- Permite deshabilitar interacciones con elementos hijos

### Estilos Inline

Durante el swipe, se aplican estilos inline:
- `transform: translateX(${deltaX}px)` - Mueve el elemento
- `opacity: ${opacity}` - Reduce opacidad gradualmente
- `background-color: rgba(...)` - Indica umbral alcanzado

---

## 📊 Métricas de Rendimiento

- **Tiempo de respuesta**: < 16ms (60 FPS)
- **Umbral por defecto**: 100px
- **Duración animación**: 300ms
- **Eventos escuchados**: touchstart, touchmove, touchend, mousedown, mousemove, mouseup

---

## ❓ Solución de Problemas

### El swipe no funciona

**Causas posibles:**
1. JavaScript deshabilitado
2. Error en la consola
3. Elemento no tiene la clase correcta

**Soluciones:**
1. Abre la consola (F12) y busca errores
2. Verifica que `swipeGestures.init()` se haya llamado
3. Comprueba que los elementos tengan las clases `.recipe-card`, `.ingredient-card`, etc.

### El swipe es demasiado sensible

Aumenta el umbral:
```javascript
this.threshold = 150; // En lugar de 100
```

### El swipe interfiere con el scroll

Asegúrate de que el movimiento sea **horizontal** (izquierda/derecha), no vertical.
El código ya detecta esto y solo permite swipe horizontal.

### La confirmación no aparece

Verifica que `sweetConfirm` esté cargado:
```javascript
console.log(window.sweetConfirm); // Debe existir
```

### El elemento no vuelve a su posición

Llama manualmente:
```javascript
swipeGestures.resetElement(elemento);
```

---

## 🔐 Seguridad

- ✅ **Confirmación obligatoria** - No se elimina sin confirmación
- ✅ **Animación visual** - El usuario ve claramente qué se eliminará
- ✅ **Cancelable** - Puedes arrastrar de vuelta o presionar "Cancelar"
- ✅ **Sin delegación insegura** - Los eventos se manejan de forma controlada

---

## 🚀 Próximas Mejoras

- [ ] Swipe hacia la derecha para editar
- [ ] Múltiples acciones (editar, duplicar, eliminar)
- [ ] Swipe en ambas direcciones
- [ ] Gesture long-press para más opciones
- [ ] Vibración háptica al alcanzar umbral
- [ ] Sonido de feedback opcional

---

## 📱 Compatibilidad

### Navegadores Móviles
- ✅ Chrome Mobile 90+
- ✅ Safari iOS 11+
- ✅ Firefox Mobile 88+
- ✅ Edge Mobile 90+
- ✅ Samsung Internet 14+

### Navegadores Desktop (con mouse)
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Sistemas Operativos
- ✅ Android 5.0+
- ✅ iOS 11+
- ✅ Windows 10+
- ✅ macOS 10.14+
- ✅ Linux (todos)

---

## 🎓 Conceptos Técnicos

### Touch Events vs Mouse Events

El código maneja ambos:

```javascript
// Touch (móviles)
touchstart → touchmove → touchend

// Mouse (desktop)
mousedown → mousemove → mouseup
```

### Delegación de Eventos

Los eventos se agregan al **contenedor padre**, no a cada elemento individual:
- ✅ **Ventaja**: Funciona con elementos dinámicos
- ✅ **Ventaja**: Mejor rendimiento (menos listeners)
- ✅ **Ventaja**: Automáticamente funciona con nuevos elementos

### Prevención de Scroll

```javascript
e.preventDefault(); // Solo en swipe horizontal
```

Esto evita que el scroll vertical se bloquee accidentalmente.

---

## 📚 Recursos Adicionales

- [MDN - Touch Events](https://developer.mozilla.org/es/docs/Web/API/Touch_events)
- [MDN - Pointer Events](https://developer.mozilla.org/es/docs/Web/API/Pointer_events)
- [Mobile Touch Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/input/touch)

---

¡Disfruta de una experiencia táctil más natural! 👆✨
