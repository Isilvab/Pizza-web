# 🍕 Pizza Master - Gestor Profesional de Pizzas

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Isilvab/Pizza-web)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Una aplicación web completa y profesional para gestionar recetas de pizza, inventario de ingredientes, calculadora de masas, lista de compras y diario de horneado. Con sincronización en la nube y una interfaz moderna y atractiva.

![Pizza Master Screenshot](assets/icons/logo-pizza.svg)

---

## ✨ Características Principales

### 🎨 Interfaz Moderna
- **Logo personalizado** y branding profesional
- **Splash screen** animado al cargar
- **Tour guiado** interactivo para nuevos usuarios
- **Tooltips informativos** en toda la app
- **Notificaciones elegantes** sin ventanas emergentes molestas
- **Animaciones suaves** y feedback visual
- **6 paletas de colores** + personalización completa
- **Modo oscuro/claro** con transiciones suaves

### 📋 Gestión de Recetas
* **Guarda tus recetas** con fotos, ingredientes y pasos detallados
* **Sube imágenes** desde tu dispositivo
* **Ingredientes del inventario** con precios y cantidades
* **Cálculo automático de costos** por receta

### 📦 Inventario Inteligente
* **Gestiona ingredientes base** con precios actualizados
* **Imágenes** para cada ingrediente
* **Múltiples unidades** (kg, g, l, ml, u)
* **Búsqueda rápida** al crear recetas

### 🧮 Calculadora de Masas Profesional
* **Cálculo exacto** de harina, agua, sal y levadura
* **Porcentaje de hidratación** configurable
* **Guarda recetas de masa** con tiempos de fermentación
* **Fórmulas profesionales** de panadería

### 🛒 Lista de Compras Automática
* **Selecciona recetas y cantidades**
* **Genera lista consolidada** de ingredientes
* **Cálculo de costos totales** automático
* **Exporta a PDF** para imprimir o compartir
* **Incluye masa y toppings**

### � Generador de Libro de Recetas PDF
* **Crea libros PDF profesionales** estilo restaurante italiano
* **Diseño elegante** con portada personalizable
* **Selecciona las recetas** que quieres incluir
* **Paleta de colores auténtica** italiana (rojo, verde, dorado, terracota)
* **Páginas decorativas** con ornamentos y marcos
* **Imágenes de recetas** en alta calidad
* **Índice organizado** con numeración
* **Perfecto para regalar** o imprimir

### �📔 Diario de Horneado
* **Registro de horneados** con fechas y notas
* **Videos útiles** de YouTube integrados
* **Timeline visual** de tu progreso

### 🛠️ Herramientas
* **Checklist de herramientas** para preparar pizzas
* **Marca las que tienes** disponibles

### ☁️ Sincronización en la Nube
* **Firebase Integration** para guardar tus datos
* **Autenticación con Google**
* **Sincronización automática** entre dispositivos
* **Modo offline** funcional

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+N` | Nueva receta |
| `Ctrl+S` | Guardar (en modales) |
| `Ctrl+K` | Abrir calculadora |
| `Ctrl+I` | Abrir inventario |
| `Ctrl+H` | Mostrar tour/ayuda |
| `F1` | Mostrar ayuda |
| `Esc` | Cerrar modales |

---

## 🚀 Cómo Usar

### Instalación Local

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/Isilvab/Pizza-web.git
   cd Pizza-web
   ```

2. **Abre el archivo:**
   - Simplemente abre `index.html` en tu navegador
   - O usa un servidor local:
     ```bash
     python -m http.server 8000
     # Visita http://localhost:8000
     ```

3. **Inicia sesión:**
   - Haz clic en "Iniciar Sesión con Google"
   - Tus datos se sincronizarán automáticamente

### Primera Vez

Al abrir la aplicación por primera vez:
1. Verás un **splash screen** de bienvenida
2. Se iniciará automáticamente el **tour guiado**
3. Sigue los **7 pasos** para conocer todas las características
4. ¡Empieza a crear tus recetas!

---

## 📚 Documentación

- **[Guía de Nuevas Características](NUEVAS_CARACTERISTICAS.md)** - Todas las mejoras de UI
- **[Características Móviles](CARACTERISTICAS_MOVILES.md)** - Guía de implementación móvil
- **[Generador de Libro PDF](LIBRO_RECETAS_PDF.md)** - Cómo crear libros de recetas profesionales
- **[Resumen de Mejoras](RESUMEN_MEJORAS.md)** - Changelog completo
- **[Ejemplos de Uso](EJEMPLOS_USO.js)** - Código de ejemplo para desarrolladores

---

## 🎨 Personalización

### Cambiar Colores

1. Ve a **Ajustes** → **Personalización de Colores**
2. Elige una paleta predefinida:
   - Pizza Roja (Default)
   - Azul Mediterráneo
   - Verde Italiano
   - Púrpura
   - Naranja Mandarina
   - Verde Azulado
3. O crea tu propia paleta con el selector de colores

### Modo Oscuro

- Haz clic en el botón de sol/luna en la esquina superior derecha
- El tema se guarda automáticamente

---

## 💾 Exportar e Importar Datos

### Exportar
1. Ve a **Ajustes**
2. Haz clic en **Exportar Datos (JSON)**
3. Se descargará un archivo con todas tus recetas e ingredientes

### Importar
1. Ve a **Ajustes**
2. Haz clic en **Importar Datos (JSON)**
3. Selecciona tu archivo de respaldo
4. ⚠️ **Advertencia:** Esto sobrescribirá tus datos actuales

---

## 🛠️ Tecnologías Utilizadas

- **HTML5** - Estructura
- **CSS3** - Estilos modernos con variables CSS
- **JavaScript** (ES6+) - Lógica de la aplicación
- **Firebase** - Autenticación y base de datos
  - Firebase Auth
  - Cloud Firestore
  - Firebase Storage
- **jsPDF** - Generación de PDFs
- **localStorage** - Almacenamiento local

---

## 📱 Compatibilidad

### Navegadores de Escritorio
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Navegadores Móviles
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Samsung Internet
- ✅ Firefox Mobile

### Características Especiales
- Atajos de teclado: Solo escritorio
- Tooltips: Mejor experiencia en escritorio
- Touch gestures: Próximamente en móviles

---

## 🔮 Próximas Características

- [ ] Escaneo de códigos de barras
- [ ] Reconocimiento de voz para ingredientes
- [ ] Modo cámara integrado
- [ ] Gestos táctiles (swipe para eliminar)
- [ ] PWA (Progressive Web App)
- [ ] Modo offline completo
- [ ] Compartir recetas con otros usuarios

---

## 🐛 Reportar Problemas

¿Encontraste un bug? [Abre un issue](https://github.com/Isilvab/Pizza-web/issues)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Isilvab**
- GitHub: [@Isilvab](https://github.com/Isilvab)
- Proyecto: [Pizza-web](https://github.com/Isilvab/Pizza-web)

---

## 🙏 Agradecimientos

- Iconos de [SVG Repo](https://www.svgrepo.com/)
- Fuentes de [Google Fonts](https://fonts.google.com/)
- Inspiración de la comunidad de panadería artesanal

---

## 📸 Capturas de Pantalla

### Pantalla Principal
![Recetas](docs/screenshots/recetas.png)

### Calculadora de Masas
![Calculadora](docs/screenshots/calculadora.png)

### Lista de Compras
![Compras](docs/screenshots/compras.png)

---

**Hecho con ❤️ y 🍕 por la comunidad de amantes de la pizza**

---

## 🎯 Roadmap

### v2.0.0 (Actual)
- ✅ Logo y branding profesional
- ✅ Splash screen
- ✅ Tour guiado
- ✅ Sistema de notificaciones
- ✅ Confirmaciones elegantes
- ✅ Atajos de teclado
- ✅ Personalización de colores
- ✅ Generador de libro de recetas PDF

### v2.1.0 (Próximamente)
- [ ] Escaneo de códigos de barras
- [ ] Reconocimiento de voz
- [ ] Modo cámara integrado
- [ ] Gestos táctiles

### v3.0.0 (Futuro)
- [ ] PWA completa
- [ ] Modo offline avanzado
- [ ] Compartir recetas
- [ ] Comunidad de usuarios

---

**Versión:** 2.0.0  
**Última actualización:** Noviembre 2025