# 📖 Generador de Libro de Recetas PDF

## Descripción

El Generador de Libro de Recetas permite crear un hermoso libro personalizado con tus recetas de pizza y masas favoritas, con un diseño profesional estilo restaurante italiano. **¡Ahora con soporte para LaTeX!**

## 🆕 Novedades - Versión Mejorada

### ✅ Problemas Solucionados

1. **Caracteres especiales corregidos**: Ya no aparecen signos raros con acentos (é, á, ñ, etc.)
2. **Carga de imágenes mejorada**: 
   - Mejor manejo de errores CORS
   - Timeout de 5 segundos para evitar esperas infinitas
   - Redimensionamiento automático de imágenes grandes
   - Placeholder elegante cuando la imagen no está disponible
3. **Opción de exportar a LaTeX**: Para calidad profesional y sin problemas de encoding

### 🎯 Tres Formatos Disponibles

Ahora puedes elegir entre tres formatos al generar tu libro:

#### 📖 PDF Directo (⭐ Recomendado para uso inmediato)
- **Generación inmediata** en el navegador (1-3 segundos)
- Encoding UTF-8 mejorado para caracteres especiales
- Sin dependencias externas
- Buena calidad para visualización en pantalla
- **Ideal para**: Pruebas rápidas, compartir digitalmente

#### ⚡ LaTeX Automático (Experimental)
- **Intenta** compilar LaTeX en la nube automáticamente
- Si falla por problemas CORS, genera PDF directo automáticamente
- Puede tardar 10-30 segundos
- **Limitación**: Los navegadores bloquean peticiones entre dominios (ver [NOTA_LATEX_AUTOMATICO.md](NOTA_LATEX_AUTOMATICO.md))
- **Ideal para**: Experimentar, probar compilación en línea

#### 📝 LaTeX Manual (⭐⭐⭐ Recomendado para calidad profesional)
- Genera código LaTeX (.tex) para compilación manual
- **Calidad editorial**: Tipografía perfecta, 100% sin problemas de encoding
- 100% personalizable editando el .tex
- **Proceso fácil**: Sube el .tex a [Overleaf.com](https://www.overleaf.com) (gratis, se compila automáticamente)
- **Ideal para**: Impresión, calidad profesional, personalización avanzada

## Características

### ✨ Diseño Profesional
- **Portada elegante** con bandera italiana y ornamentos dorados
- **Página de dedicatoria** con frase inspiradora
- **Índice organizado** con numeración y detalles
- **Páginas divisoras** para separar secciones
- **Pie de página decorativo** en cada página

### 🍕 Recetas de Pizza
- Imágenes de las pizzas en alta calidad
- Lista completa de ingredientes con cantidades
- Instrucciones paso a paso de preparación
- Diseño de dos columnas para mejor lectura
- Marcos decorativos y ornamentos italianos

### 🍞 Recetas de Masa
- Parámetros destacados (hidratación, sal, levadura)
- Tiempos de fermentación organizados
- Notas del pizzaiolo con estilo
- Diseño con tarjetas y colores temáticos

## Cómo Usar

1. **Acceder al Generador**
   - Ve a la sección "Mis Recetas de Pizza"
   - Haz clic en el botón "📖 Libro PDF"

2. **Personalizar el Libro**
   - Escribe el título del libro (por defecto: "Il Mio Libro di Pizza")
   - Opcionalmente, agrega tu nombre como autor
   - Selecciona las pizzas que quieres incluir
   - Selecciona las recetas de masa que quieres incluir

3. **Elegir Formato**
   - **⚡ LaTeX Automático** (Recomendado): Descarga PDF compilado automáticamente
   - **📖 PDF Directo**: Descarga inmediata, bueno para pruebas
   - **📝 LaTeX Manual**: Descarga código .tex para compilación avanzada

4. **Generar el Documento**
   - Haz clic en el formato deseado
   - Espera el proceso según el formato:
     - LaTeX Automático: 10-30 segundos compilando en la nube
     - PDF Directo: 1-3 segundos
     - LaTeX Manual: Descarga instantánea del .tex
   - El archivo se descargará automáticamente

## Paleta de Colores Italiana

El libro utiliza una paleta de colores inspirada en Italia:

- **Rojo Italiano**: `#CE1126` - Color principal, encabezados
- **Verde Bandera**: `#009246` - Detalles decorativos
- **Crema Suave**: `#FFFDF5` - Fondos elegantes
- **Marrón Oscuro**: `#4A2F1F` - Texto principal
- **Dorado**: `#DAA520` - Ornamentos y marcos
- **Terracota**: `#CC7755` - Acentos cálidos

## Estructura del Libro

1. **Portada**
   - Título personalizable
   - Bandera italiana decorativa
   - Marco ornamental
   - Nombre del autor (opcional)
   - Fecha de creación

2. **Dedicatoria**
   - Frase inspiradora sobre la pizza
   - Ornamentos florales

3. **Índice**
   - Lista de pizzas con números
   - Lista de recetas de masa
   - Líneas punteadas decorativas

4. **Páginas Divisoras**
   - "Le Nostre Pizze" (Nuestras Pizzas)
   - "L'Impasto" (La Masa)

5. **Recetas**
   - Una página por receta
   - Diseño consistente y elegante
   - Pie de página con numeración

## Consejos

- **Imágenes**: Para mejores resultados, usa imágenes de alta calidad de tus pizzas
- **Selección**: No es necesario incluir todas las recetas, selecciona tus favoritas
- **Personalización**: Usa un nombre creativo para el título del libro
- **Compartir**: El PDF generado es perfecto para compartir o imprimir

## Requisitos Técnicos

- Navegador moderno con soporte para jsPDF
- JavaScript habilitado
- Recetas guardadas en la aplicación

## Formato del PDF

- **Orientación**: Vertical (Portrait)
- **Tamaño**: A4 (210 x 297 mm)
- **Compresión**: Activada para archivos más pequeños
- **Fuentes**: Times (estilo clásico italiano)

## Ejemplos de Uso

### Para Regalo
Crea un libro personalizado para regalar a amigos o familiares amantes de la pizza.

### Para Negocio
Genera un catálogo profesional de tus pizzas para tu pizzería.

### Para Archivo Personal
Documenta tus recetas favoritas en un formato elegante y duradero.

## Solución de Problemas

### Error de Compilación Automática LaTeX

**Problema**: La compilación en la nube falló

**Posibles causas**:
- Sin conexión a internet
- Servicio LaTeX.Online temporalmente no disponible
- Error en el código LaTeX generado

**Solución**:
1. La aplicación te preguntará si quieres descargar el .tex para compilarlo manualmente
2. Acepta y sigue las instrucciones en [INSTRUCCIONES_LATEX.md](INSTRUCCIONES_LATEX.md)
3. O intenta nuevamente con "PDF Directo"

### Signos Raros en el PDF

**Problema anterior**: Aparecían caracteres extraños en lugar de acentos (é → Ã©)

**Solución aplicada**:
1. Configuración mejorada de encoding UTF-8 en jsPDF
2. Opción de LaTeX que maneja perfectamente caracteres especiales

**Qué hacer**:
- Si usas PDF directo y ves signos raros, cambia a LaTeX
- LaTeX garantiza 100% de compatibilidad con caracteres especiales

### Las Imágenes no se Cargan

**Problema anterior**: CORS bloqueaba la carga de imágenes

**Solución aplicada**:
1. Detección automática de imágenes locales vs externas
2. Timeout de 5 segundos para evitar bloqueos
3. Placeholder elegante cuando no se puede cargar

**Qué hacer**:
- Las imágenes locales ahora se cargan correctamente
- Si una imagen falla, aparece un emoji decorativo 🍕
- En LaTeX puedes agregar manualmente rutas a imágenes de alta calidad

### El PDF Está Vacío

**Causa**: No se seleccionó ninguna receta

**Solución**: Selecciona al menos una pizza o receta de masa antes de generar

### Error al Compilar LaTeX

**Causa**: Paquetes faltantes o errores de sintaxis

**Solución**:
- Consulta [INSTRUCCIONES_LATEX.md](INSTRUCCIONES_LATEX.md) para guía detallada
- Usa Overleaf.com para compilación online sin instalaciones
- Revisa que MiKTeX esté configurado para instalar paquetes automáticamente

## Próximas Mejoras

- [x] Solucionar problemas de encoding con caracteres especiales
- [x] Mejorar carga de imágenes con mejor manejo de errores
- [x] Agregar opción de exportar a LaTeX
- [x] **Compilación automática de LaTeX en la nube** ⚡ NUEVO
- [ ] Más plantillas de diseño
- [ ] Opción de idioma (español/italiano)
- [ ] Tabla nutricional por receta
- [ ] QR codes con enlaces a videos
- [ ] Sección de consejos y técnicas

## Mejoras Técnicas Implementadas

### Versión 3.0 (Actual) - Compilación Automática

**Nueva funcionalidad estrella:**

1. **Compilación LaTeX en la nube**
   ```javascript
   async generateLaTeXCompiled() {
       // Genera código LaTeX
       const latexCode = this.generateLaTeXCode();
       
       // Envía a LaTeX.Online API
       const response = await fetch('https://latexonline.cc/compile', {
           method: 'POST',
           body: formData
       });
       
       // Descarga PDF compilado
       const pdfBlob = await response.blob();
       // ... descarga automática
   }
   ```

2. **Manejo de errores robusto**
   - Timeout y reintentos
   - Fallback a descarga manual si falla
   - Mensajes claros para el usuario

3. **Tres opciones en lugar de dos**
   - LaTeX Automático (nuevo, recomendado)
   - PDF Directo (mejorado)
   - LaTeX Manual (para expertos)

### Versión 2.0

1. **Encoding UTF-8 mejorado**
   ```javascript
   putOnlyUsedFonts: true,
   floatPrecision: 16,
   setLanguage('es')
   ```

2. **Carga de imágenes robusta**
   - Timeout de 5 segundos
   - Redimensionamiento automático (max 800px)
   - Fondo blanco para transparencias
   - Placeholder elegante en caso de error

3. **Exportación LaTeX**
   - Escape automático de caracteres especiales
   - Estructura profesional con capítulos y secciones
   - Colores italianos predefinidos
   - Configuración optimizada para español

4. **Interfaz mejorada**
   - Modal de selección de formato
   - Instrucciones claras para cada opción
   - Mensajes de error más descriptivos

---

**¡Buon Appetito! 🍕**
