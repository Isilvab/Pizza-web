# 📸 Modo Cámara - Guía de Uso

## Descripción

El **Modo Cámara** permite capturar fotos directamente desde la cámara de tu dispositivo para agregar imágenes a tus recetas de pizza, sin necesidad de seleccionar archivos desde la galería.

---

## ✨ Características

- ✅ **Captura directa desde la cámara** - Toma fotos sin salir de la app
- ✅ **Vista previa en tiempo real** - Ve lo que capturarás antes de tomar la foto
- ✅ **Cambio de cámara** - Alterna entre cámara frontal y trasera (si disponible)
- ✅ **Cuadrícula de composición** - Guía visual para mejorar tus fotos
- ✅ **Subida automática a Firebase Storage** - Tus fotos se guardan en la nube
- ✅ **Responsive** - Funciona en desktop y móviles

---

## 🚀 Cómo Usar

### 1. Agregar Foto a una Receta

1. Haz clic en **"Añadir Receta"** o edita una existente
2. En el formulario verás dos opciones:
   - **Seleccionar Imagen** - Para elegir desde archivos
   - **📷 Tomar Foto** - Para capturar con la cámara
3. Haz clic en **"📷 Tomar Foto"**

### 2. Capturar la Foto

1. El navegador pedirá permiso para acceder a la cámara (acepta)
2. Verás la vista previa de la cámara con una cuadrícula guía
3. Posiciona tu pizza o ingrediente en el encuadre
4. Ajusta la iluminación si es necesario
5. Haz clic en **"📷 Capturar"** para tomar la foto

### 3. Cambiar de Cámara (Opcional)

- Haz clic en el botón **🔄** para alternar entre:
  - **Cámara trasera** (por defecto) - Mejor para fotos de productos
  - **Cámara frontal** - Útil para selfies o videos

### 4. Guardar

- La foto se mostrará en la vista previa
- Completa los demás campos del formulario
- Haz clic en **"Guardar Receta"**
- La imagen se subirá automáticamente a Firebase Storage

---

## 🎯 Consejos para Mejores Fotos

### Iluminación
- 💡 Usa luz natural cuando sea posible
- 🔦 Evita sombras fuertes directamente sobre la pizza
- 🌞 La hora dorada (amanecer/atardecer) da mejores resultados

### Composición
- 📐 Usa la cuadrícula para aplicar la regla de los tercios
- 📏 Mantén la cámara paralela a la pizza para evitar distorsión
- 🎨 Incluye elementos de contexto (ingredientes, utensilios)

### Enfoque
- 🎯 Asegúrate de que la pizza esté en foco
- 📱 Toca la pantalla antes de capturar (si tu dispositivo lo permite)
- 🔍 Acércate lo suficiente pero sin cortar los bordes

---

## 🔧 Requisitos Técnicos

### Navegadores Compatibles
- ✅ Chrome/Edge 53+
- ✅ Firefox 36+
- ✅ Safari 11+
- ✅ Opera 40+
- ❌ Internet Explorer (no soportado)

### Permisos Necesarios
- 📷 **Acceso a la cámara** - El navegador solicitará permiso
- 🌐 **Conexión HTTPS** - Requerida para acceder a la cámara
- 💾 **Firebase Storage** - Para guardar las imágenes

### Dispositivos
- 📱 **Móviles** - Android 5+ / iOS 11+
- 💻 **Desktop** - Con webcam integrada o externa
- 📷 **Tablets** - iPad, Android tablets

---

## ❓ Solución de Problemas

### "No se pudo acceder a la cámara"
**Causas posibles:**
- Permiso denegado en el navegador
- Cámara bloqueada por otra aplicación
- Dispositivo sin cámara

**Soluciones:**
1. Verifica los permisos del navegador:
   - Chrome: `Configuración > Privacidad > Configuración de sitios > Cámara`
   - Firefox: `Preferencias > Privacidad > Permisos > Cámara`
2. Cierra otras aplicaciones que usen la cámara
3. Recarga la página y vuelve a otorgar permiso

### "Permiso de cámara denegado"
1. Haz clic en el **ícono de candado** en la barra de direcciones
2. Busca "Cámara" y cambia a **"Permitir"**
3. Recarga la página

### "La cámara está siendo usada por otra aplicación"
1. Cierra todas las aplicaciones de videollamadas (Zoom, Meet, Teams)
2. Cierra otras pestañas del navegador que usen la cámara
3. Reinicia el navegador si es necesario

### La foto se ve borrosa
- Asegúrate de tener buena iluminación
- Limpia el lente de la cámara
- Mantén el dispositivo estable al capturar
- Espera a que la cámara enfoque antes de capturar

### No aparece el botón "📷 Tomar Foto"
- Tu navegador podría no soportar la API de MediaDevices
- Actualiza tu navegador a la última versión
- Usa la opción "Seleccionar Imagen" como alternativa

---

## 🔐 Privacidad y Seguridad

- 🔒 Las fotos solo se acceden mientras usas la aplicación
- 🚫 No se graban videos ni se accede al audio
- ☁️ Las imágenes se almacenan de forma segura en Firebase Storage
- 👤 Solo tú (usuario autenticado) puedes ver tus fotos

---

## 🎨 Personalización

### Cambiar la Calidad de las Fotos

Edita `assets/camera-capture.js`, línea ~83:

```javascript
canvas.toBlob((blob) => {
    // Cambiar el último parámetro (0.9 = 90% calidad)
    // Valores: 0.1 (baja) a 1.0 (máxima)
}, 'image/jpeg', 0.95); // 95% de calidad
```

### Cambiar la Resolución

Edita `assets/camera-capture.js`, línea ~151:

```javascript
const constraints = {
    video: {
        facingMode: this.currentFacingMode,
        width: { ideal: 1920 },  // Cambiar resolución
        height: { ideal: 1080 }  // Cambiar resolución
    },
    audio: false
};
```

Resoluciones recomendadas:
- **HD**: 1280x720
- **Full HD**: 1920x1080
- **4K**: 3840x2160

---

## 🛠️ API - Uso Programático

### Capturar Foto Manualmente

```javascript
// Iniciar cámara y capturar
const blob = await cameraCapture.start();

// El blob contiene la imagen capturada
console.log(blob); // Blob { size: 123456, type: "image/jpeg" }

// Crear URL para mostrar
const imageUrl = URL.createObjectURL(blob);
document.querySelector('img').src = imageUrl;
```

### Verificar Soporte

```javascript
if (CameraCapture.isSupported()) {
    console.log('✓ Cámara soportada');
} else {
    console.log('✗ Cámara no disponible');
}
```

### Cambiar Cámara Programáticamente

```javascript
// Cambiar a cámara frontal
cameraCapture.currentFacingMode = 'user';
await cameraCapture.startCamera();

// Cambiar a cámara trasera
cameraCapture.currentFacingMode = 'environment';
await cameraCapture.startCamera();
```

### Detener la Cámara

```javascript
cameraCapture.stop();
```

---

## 📊 Estadísticas

- **Tamaño promedio de foto**: 100-500 KB (JPEG 90% calidad)
- **Tiempo de carga**: ~1-3 segundos (depende de conexión)
- **Formatos soportados**: JPEG, PNG, WebP
- **Límite de tamaño**: Configurado en Firebase Storage (máx. 5MB por defecto)

---

## 🔄 Integración con Firebase

Las fotos capturadas se suben automáticamente a:

```
firebase-storage://
  └── recipes/
      └── {userId}/
          └── recipe_{timestamp}.jpg
```

### Configuración de Seguridad

Asegúrate de tener las reglas de Firebase Storage configuradas:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recipes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Próximas Mejoras

- [ ] Filtros de imagen (sepia, blanco y negro, etc.)
- [ ] Recortar imagen antes de guardar
- [ ] Flash/linterna para fotos con poca luz
- [ ] Modo ráfaga (múltiples fotos)
- [ ] Detección de QR en ingredientes
- [ ] Reconocimiento de texto OCR

---

## 📚 Recursos Adicionales

- [MDN - MediaDevices API](https://developer.mozilla.org/es/docs/Web/API/MediaDevices)
- [Can I Use - getUserMedia](https://caniuse.com/stream)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)

---

¡Disfruta capturando tus mejores pizzas! 🍕📷
