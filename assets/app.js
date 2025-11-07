document.addEventListener('DOMContentLoaded', () => {

    // --- Estado Global y Clave de Almacenamiento ---
    const APP_STORAGE_KEY = 'pizzaAppData';
    const DEFAULT_PLACEHOLDER = 'assets/img/placeholder.svg';
    const defaultData = {
        lastModified: 0, 
        recipes: [],
        inventory: [],
        diary: [],
        doughRecipes: [],
        tools: [],
        videos: []
    };
    let appData = { ...defaultData };
    
    // EXPONER GLOBALMENTE PARA DEBUGGING
    window.exportLocalData = () => JSON.parse(JSON.stringify(appData));
    window.getLocalDataSnapshot = () => appData;

    // --- NUEVO: Variable temporal para el *archivo* de imagen (no Base64) ---
    let currentRecipeImageFile = null;

    // --- Selectores del DOM (Generales) ---
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const themeToggle = document.getElementById('theme-toggle');
    const modalContainer = document.getElementById('modal-container');
    const allModals = document.querySelectorAll('.modal-content');
    const ingredientTooltip = document.getElementById('ingredient-tooltip');

    // --- Selectores (Recetas de Pizza) ---
    const recipeList = document.getElementById('recipe-list');
    const addRecipeBtn = document.getElementById('add-recipe-btn');
    const recipeModal = document.getElementById('recipe-modal');
    const recipeForm = document.getElementById('recipe-form');
    const ingredientSearch = document.getElementById('ingredient-search');
    const ingredientSearchResults = document.getElementById('ingredient-search-results');
    const currentRecipeIngredients = document.getElementById('current-recipe-ingredients');
    const recipeImageInput = document.getElementById('recipe-image-input');
    const recipeImagePreview = document.getElementById('recipe-image-preview');
    const recipeRemoveImageBtn = document.getElementById('recipe-remove-image-btn');

    // --- (Resto de Selectores sin cambios) ---
    const inventoryList = document.getElementById('inventory-list');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const inventoryModal = document.getElementById('inventory-modal');
    const inventoryForm = document.getElementById('inventory-form');
    const calculateBtn = document.getElementById('calculate-btn');
    const calcResultsContainer = document.getElementById('calc-results');
    const saveDoughRecipeBtn = document.getElementById('save-dough-recipe-btn');
    const doughRecipeSelect = document.getElementById('dough-recipe-select');
    const loadDoughRecipeBtn = document.getElementById('load-dough-recipe-btn');
    const viewDoughRecipeBtn = document.getElementById('view-dough-recipe-btn');
    const deleteDoughRecipeBtn = document.getElementById('delete-dough-recipe-btn');
    const doughRecipeModal = document.getElementById('dough-recipe-modal');
    const doughRecipeForm = document.getElementById('dough-recipe-form');
    const doughDetailsModal = document.getElementById('dough-details-modal');
    const doughDetailsContent = document.getElementById('dough-details-content');
    const shoppingListBuilder = document.getElementById('shopping-list-builder');
    const generateShoppingListBtn = document.getElementById('generate-shopping-list-btn');
    const printShoppingPdfBtn = document.getElementById('print-shopping-pdf-btn');
    const shoppingListResults = document.getElementById('shopping-list-results');
    const diaryList = document.getElementById('diary-list');
    const addDiaryEntryBtn = document.getElementById('add-diary-entry-btn');
    const diaryModal = document.getElementById('diary-modal');
    const diaryForm = document.getElementById('diary-form');
    const exportBtn = document.getElementById('export-json-btn');
    const importInput = document.getElementById('import-json-input');
    const importStatus = document.getElementById('import-status');
    const loginBtn = document.getElementById('login-btn'); 
    const logoutBtn = document.getElementById('logout-btn');
    const syncNowBtn = document.getElementById('sync-now-btn');
    const userProfileDiv = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const userEmail = document.getElementById('user-email');
    
    // --- Selectores (Herramientas) ---
    const toolsChecklist = document.getElementById('tools-checklist');
    const addToolBtn = document.getElementById('add-tool-btn');
    const resetChecklistButton = document.getElementById('reset-checklist-button');
    const toolModal = document.getElementById('tool-modal');
    const toolForm = document.getElementById('tool-form');

    // --- Selectores (Videos) ---
    const videosGrid = document.getElementById('videos-grid');
    const addVideoBtn = document.getElementById('add-video-btn');
    const videoModal = document.getElementById('video-modal');
    const videoForm = document.getElementById('video-form');

    // --- Utilidades ---
    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const escapeHTML = (str) => str ? String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

    // EXPONER UTILIDADES GLOBALMENTE
    window.generateId = generateId;
    window.getTodayDate = getTodayDate;

    // =================================================================
    // --- 1. INICIALIZACIÓN ---
    // =================================================================
    function init() {
        try {
            const savedTheme = localStorage.getItem('theme') || 'light';
            applyTheme(savedTheme);
            setupTabNavigation();
            setupThemeToggle();
            setupDataManagement();
            setupCalculator();
            setupModalControls();
            setupFormHandlers(); // <--- MODIFICADO
            setupEventListeners();
            setupIngredientSearch();
            setupTooltipEvents();
            setupImageUpload(); // <--- MODIFICADO
            setupToolsListeners(); // <--- NUEVO
            setupVideosListeners(); // <--- NUEVO
            setupAuthButtons();
            setupColorCustomization(); // <--- NUEVO
            
            if (typeof initFirebaseSync === 'function') {
                initFirebaseSync(handleUserLogin, handleUserLogout);
            } else {
                console.error("Error: firebase-sync.js no se cargó correctamente.");
                showLoginScreen("Error crítico de la aplicación. Contacte al administrador.");
            }
            
            // NUEVO: Inicializar mejoras de UI
            if (typeof initEnhancedUI === 'function') {
                initEnhancedUI();
            }
        } catch (error) {
            console.error("Error fatal durante la inicialización:", error);
            const loginError = document.getElementById('login-error-message');
            if(loginError) {
                loginError.textContent = "Error fatal al cargar la app. Ver la consola.";
                loginError.style.display = 'block';
            }
        }
    }

    // =================================================================
    // --- 2. NAVEGACIÓN Y TEMA --- (Sin cambios)
    // =================================================================
    function setupTabNavigation() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }
    function setupThemeToggle() {
        themeToggle.addEventListener('click', () => {
            let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // =================================================================
    // --- 3. GESTIÓN DE MODALES --- (MODIFICADO)
    // =================================================================
    function setupModalControls() {
        // ... (el resto de los listeners sin cambios)
        addRecipeBtn.addEventListener('click', () => openRecipeModal());
        addIngredientBtn.addEventListener('click', () => openInventoryModal());
        addDiaryEntryBtn.addEventListener('click', () => openDiaryModal());
        addToolBtn.addEventListener('click', () => openToolModal());
        addVideoBtn.addEventListener('click', () => openVideoModal());
        saveDoughRecipeBtn.addEventListener('click', () => openDoughRecipeModal());
        loadDoughRecipeBtn.addEventListener('click', loadDoughRecipeToCalculator);
        viewDoughRecipeBtn.addEventListener('click', () => {
            const id = doughRecipeSelect.value;
            if(id) openDoughDetailsModal(id);
        });
        deleteDoughRecipeBtn.addEventListener('click', deleteDoughRecipe);
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer || e.target.classList.contains('modal-close-btn')) {
                closeModal();
            }
        });
        
        // Cerrar modal con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalContainer.classList.contains('visible')) {
                closeModal();
            }
        });
    }
    function openModal(modalElement) {
        modalElement.style.display = 'block';
        modalContainer.classList.add('visible');
    }

    // --- MODIFICADO: Limpieza de imagen ---
    function closeModal() {
        modalContainer.classList.remove('visible');
        hideIngredientTooltip(); 
        setTimeout(() => {
            allModals.forEach(modal => modal.style.display = 'none');
            [recipeForm, inventoryForm, diaryForm, doughRecipeForm, toolForm, videoForm].forEach(form => {
                if (form) form.reset();
            });
            ['recipe-id', 'inv-id', 'diary-id', 'dough-id', 'tool-id', 'video-id', 'ingredient-search', 'recipe-image-input'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
            [currentRecipeIngredients, ingredientSearchResults, doughDetailsContent].forEach(container => {
                if (container) container.innerHTML = '';
            });
            if(ingredientSearchResults) ingredientSearchResults.style.display = 'none';
            
            // --- LÓGICA DE IMAGEN MODIFICADA ---
            recipeImagePreview.src = DEFAULT_PLACEHOLDER;
            recipeRemoveImageBtn.style.display = 'none';
            currentRecipeImageFile = null; // Limpiar el archivo en lugar de Base64
            // --- FIN MODIFICACIÓN ---

        }, 300);
    }
    
    // --- MODIFICADO: Carga de imagen ---
    function openRecipeModal(recipeId = null) {
        currentRecipeImageFile = null; // Resetear siempre
        
        if (recipeId) {
            // Modo Edición
            const recipe = appData.recipes.find(r => r.id === recipeId);
            if (!recipe) return;
            document.getElementById('recipe-modal-title').textContent = 'Editar Receta de Pizza';
            document.getElementById('recipe-id').value = recipe.id;
            document.getElementById('recipe-title').value = recipe.title;
            document.getElementById('recipe-steps').value = recipe.steps;
            
            // Cargar imagen guardada (URL de Storage)
            const imageUrl = recipe.image || DEFAULT_PLACEHOLDER;
            recipeImagePreview.src = imageUrl;
            // Guardar la URL actual por si no la cambian
            recipeImagePreview.dataset.currentUrl = recipe.image || ""; 
            
            recipeRemoveImageBtn.style.display = recipe.image ? 'inline-flex' : 'none';
            renderCurrentRecipeIngredients(Array.isArray(recipe.ingredients) ? recipe.ingredients : []);
        } else {
            // Modo Creación
            document.getElementById('recipe-modal-title').textContent = 'Nueva Receta de Pizza';
            recipeImagePreview.src = DEFAULT_PLACEHOLDER; 
            recipeImagePreview.dataset.currentUrl = "";
            recipeRemoveImageBtn.style.display = 'none';
            renderCurrentRecipeIngredients([]);
        }
        openModal(recipeModal);
    }
    // ... (El resto de modales open...() no cambian)
    function openInventoryModal(itemId = null) {
        if (itemId) {
            const item = appData.inventory.find(i => i.id === itemId);
            if (!item) return;
            document.getElementById('inventory-modal-title').textContent = 'Editar Ingrediente';
            document.getElementById('inv-id').value = item.id;
            document.getElementById('inv-name').value = item.name;
            document.getElementById('inv-image').value = item.image;
            document.getElementById('inv-price').value = item.price;
            document.getElementById('inv-unit').value = item.priceUnit;
        } else {
            document.getElementById('inventory-modal-title').textContent = 'Nuevo Ingrediente';
        }
        openModal(inventoryModal);
    }
    function openDoughRecipeModal(recipeId = null) {
        if (recipeId) {
            const recipe = appData.doughRecipes.find(r => r.id === recipeId);
            if (!recipe) return;
            document.getElementById('dough-recipe-modal-title').textContent = 'Editar Receta de Masa';
            document.getElementById('dough-id').value = recipe.id;
            document.getElementById('dough-title').value = recipe.title;
            document.getElementById('dough-date').value = recipe.date;
            document.getElementById('dough-block-ferment').value = recipe.fermentBlock;
            document.getElementById('dough-cold-ferment').value = recipe.fermentCold;
            document.getElementById('dough-ambient-ferment').value = recipe.fermentAmbient;
            document.getElementById('dough-comments').value = recipe.comments;
            document.getElementById('dough-modal-hidratacion').textContent = `Hidratación: ${recipe.hydration}%`;
            document.getElementById('dough-modal-sal').textContent = `Sal: ${recipe.salt}%`;
            document.getElementById('dough-modal-levadura').textContent = `Levadura: ${recipe.yeast}%`;
        } else {
            document.getElementById('dough-recipe-modal-title').textContent = 'Guardar Receta de Masa';
            document.getElementById('dough-date').value = getTodayDate();
            document.getElementById('dough-modal-hidratacion').textContent = `Hidratación: ${document.getElementById('calc-hidratacion').value}%`;
            document.getElementById('dough-modal-sal').textContent = `Sal: ${document.getElementById('calc-sal').value}%`;
            document.getElementById('dough-modal-levadura').textContent = `Levadura: ${document.getElementById('calc-levadura').value}%`;
        }
        openModal(doughRecipeModal);
    }
    function openDoughDetailsModal(recipeId) {
        const recipe = appData.doughRecipes.find(r => r.id === recipeId);
        if (!recipe) return;
        document.getElementById('dough-details-title').textContent = escapeHTML(recipe.title);
        doughDetailsContent.innerHTML = `
            <div class="details-header"><p>Receta guardada el: ${escapeHTML(recipe.date)}</p></div>
            <div class="details-grid">
                <div class="details-grid-item"><strong>${escapeHTML(String(recipe.hydration))}%</strong><span>Hidratación</span></div>
                <div class="details-grid-item"><strong>${escapeHTML(String(recipe.salt))}%</strong><span>Sal</span></div>
                <div class="details-grid-item"><strong>${escapeHTML(String(recipe.yeast))}%</strong><span>Levadura</span></div>
            </div>
            <div class="details-section">
                <h4>Tiempos de Fermentación</h4>
                <ul class="simple-list">
                    <li><b>Bloque (Apresto):</b> ${escapeHTML(recipe.fermentBlock) || 'N/A'}</li>
                    <li><b>Frío (Frigo):</b> ${escapeHTML(recipe.fermentCold) || 'N/A'}</li>
                    <li><b>Ambiente (Appretto):</b> ${escapeHTML(recipe.fermentAmbient) || 'N/A'}</li>
                </ul>
            </div>
            <div class="details-section">
                <h4>Comentarios</h4>
                <p>${escapeHTML(recipe.comments) || 'Sin comentarios.'}</p>
            </div>
            <div class="controls" style="justify-content: flex-end;">
                 <button class="btn btn-secondary" data-id="${recipe.id}" data-action="edit-dough-recipe">Editar esta Receta</button>
            </div>
        `;
        openModal(doughDetailsModal);
    }
    function openDiaryModal(entryId = null) {
        if (entryId) {
            const entry = appData.diary.find(d => d.id === entryId);
            if (!entry) return;
            document.getElementById('diary-modal-title').textContent = 'Editar Entrada';
            document.getElementById('diary-id').value = entry.id;
            document.getElementById('diary-title').value = entry.title;
            document.getElementById('diary-date').value = entry.date;
            document.getElementById('diary-notes').value = entry.notes;
        } else {
            document.getElementById('diary-modal-title').textContent = 'Nueva Entrada';
            document.getElementById('diary-date').value = getTodayDate();
        }
        openModal(diaryModal);
    }
    
    function openToolModal(toolId = null) {
        if (toolId) {
            const tool = appData.tools.find(t => t.id === toolId);
            if (!tool) return;
            document.getElementById('tool-modal-title').textContent = 'Editar Herramienta';
            document.getElementById('tool-id').value = tool.id;
            document.getElementById('tool-name').value = tool.name;
            document.getElementById('tool-image-url').value = tool.imageUrl || '';
        } else {
            document.getElementById('tool-modal-title').textContent = 'Nueva Herramienta';
        }
        openModal(toolModal);
    }

    function openVideoModal(videoId = null) {
        if (videoId) {
            const video = appData.videos.find(v => v.id === videoId);
            if (!video) return;
            document.getElementById('video-modal-title').textContent = 'Editar Video';
            document.getElementById('video-id').value = video.id;
            document.getElementById('video-title').value = video.title;
            document.getElementById('video-url').value = video.url;
        } else {
            document.getElementById('video-modal-title').textContent = 'Agregar Video Útil';
            document.getElementById('video-id').value = '';
            document.getElementById('video-title').value = '';
            document.getElementById('video-url').value = '';
        }
        openModal(videoModal);
    }

    // =================================================================
    // --- 4. GESTIÓN DE DATOS (CRUD) --- (MODIFICADO)
    // =================================================================

    function loadData() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            appData = { ...defaultData, ...parsed };
            // Asegurar que tools existe
            if (!appData.tools) appData.tools = [];
        }
    }

    function saveData() {
        appData.lastModified = Date.now();
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appData));
            console.log("Datos guardados localmente.");
        } catch (error) {
            console.error("Error guardando en localStorage (posiblemente lleno):", error);
            alert("Error: No se pudieron guardar los datos localmente. El almacenamiento podría estar lleno.");
        }
        
        if (typeof pushToCloud === 'function' && currentUser) {
            updateSyncStatus('syncing');
            pushToCloud(appData); 
        }
    }

    function handleCloudUpdate(cloudData) {
        console.log("=== ACTUALIZANDO DATOS DESDE LA NUBE ===");
        console.log("Datos recibidos de Firestore:");
        console.log("- Recetas:", cloudData.recipes?.length || 0);
        console.log("- Inventario:", cloudData.inventory?.length || 0);
        console.log("- Diario:", cloudData.diary?.length || 0);
        console.log("- Masas:", cloudData.doughRecipes?.length || 0);
        console.log("- Herramientas:", cloudData.tools?.length || 0);
        console.log("- Videos:", cloudData.videos?.length || 0);
        
        // CRÍTICO: Parsear datos si vienen como strings
        const parseIfNeeded = (data) => {
            if (!data) return [];
            
            // Si ya es un array de objetos, devolverlo tal cual
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                return data;
            }
            
            // Si es un array de strings, parsear cada uno
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
                console.log("Parseando array de strings. Primer elemento:", data[0].substring(0, 100));
                return data.map(item => {
                    try {
                        // Limpiar el string de espacios y saltos de línea innecesarios
                        const cleaned = item.trim();
                        return JSON.parse(cleaned);
                    } catch (e) {
                        console.error("Error parseando item:", e);
                        console.error("Item problemático:", item.substring(0, 200));
                        return null;
                    }
                }).filter(item => item !== null);
            }
            
            // Si es un string único, intentar parsearlo
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    console.error("Error parseando string:", e);
                    console.error("String problemático:", data.substring(0, 200));
                    return [];
                }
            }
            
            // Si es un array vacío o null/undefined
            return Array.isArray(data) ? data : [];
        };

        // CRÍTICO: Actualizar appData con los datos de la nube PARSEADOS
        appData = {
            lastModified: cloudData.lastModified || Date.now(),
            recipes: parseIfNeeded(cloudData.recipes),
            inventory: parseIfNeeded(cloudData.inventory),
            diary: parseIfNeeded(cloudData.diary),
            doughRecipes: parseIfNeeded(cloudData.doughRecipes),
            tools: parseIfNeeded(cloudData.tools),
            videos: parseIfNeeded(cloudData.videos)
        };
        
        console.log("✅ Datos parseados correctamente:");
        console.log("- Recetas:", appData.recipes.length);
        console.log("- Inventario:", appData.inventory.length);
        console.log("- Diario:", appData.diary.length);
        console.log("- Masas:", appData.doughRecipes.length);
        console.log("- Herramientas:", appData.tools.length);
        
        if (appData.recipes.length > 0) {
            console.log("Primera receta parseada:", appData.recipes[0]);
        }
        
        // Guardar en localStorage
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appData));
            console.log("Datos guardados en localStorage.");
        } catch (error) {
            console.error("Error guardando en localStorage:", error);
        }
        
        // Re-renderizar toda la interfaz
        renderAll();
        
        console.log("Interfaz actualizada con datos de la nube.");
        if (typeof updateSyncStatus === 'function') updateSyncStatus(true);
    }
    
    function getLocalData() {
        return appData;
    }


    // --- MODIFICADO: setupFormHandlers ahora sube a Storage ---
    function setupFormHandlers() {
        // --- Guardar/Actualizar Receta de Pizza (CON STORAGE) ---
        recipeForm.addEventListener('submit', async (e) => { // <-- Convertido a async
            e.preventDefault();
            
            // Mostrar un spinner o deshabilitar el botón
            const submitButton = recipeForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = "Guardando...";

            try {
                const id = document.getElementById('recipe-id').value;
                
                // 1. Manejar la imagen
                let imageUrl = recipeImagePreview.dataset.currentUrl || null;
                
                if (currentRecipeImageFile) {
                    // 1a. Si hay un *nuevo* archivo, subirlo
                    console.log("Subiendo nuevo archivo a Storage...");
                    const fileName = `recipe_${Date.now()}_${currentRecipeImageFile.name}`;
                    // Llama a la función de firebase-sync.js
                    imageUrl = await uploadFileToStorage(currentRecipeImageFile, fileName);
                
                } else if (recipeImagePreview.src.includes(DEFAULT_PLACEHOLDER)) {
                    // 1b. Si la preview es el placeholder, el usuario borró la imagen
                    imageUrl = null; 
                }
                // 1c. Si no hay archivo nuevo y la preview no es placeholder, 
                //     simplemente se conserva la 'imageUrl' que ya teníamos.

                // 2. Recolectar ingredientes
                const ingredients = [];
                currentRecipeIngredients.querySelectorAll('li.list-item').forEach(item => {
                    ingredients.push({
                        inventoryId: item.dataset.inventoryId,
                        quantity: parseFloat(item.querySelector('.ingredient-quantity-input input[type="number"]').value) || 0,
                        unit: item.querySelector('.ingredient-quantity-input input[type="text"]').value || 'g'
                    });
                });

                // 3. Crear objeto final
                const formData = {
                    title: document.getElementById('recipe-title').value,
                    steps: document.getElementById('recipe-steps').value,
                    date: getTodayDate(),
                    ingredients: ingredients,
                    image: imageUrl // <-- Guardar la URL de Storage (o null)
                };

                // 4. Guardar en appData
                if (id) {
                    appData.recipes = appData.recipes.map(r => r.id === id ? { ...r, ...formData } : r);
                } else {
                    formData.id = generateId();
                    appData.recipes.push(formData);
                }
                
                // 5. Sincronizar y limpiar
                saveData(); 
                renderRecipes();
                renderShoppingListBuilder();
                closeModal();

            } catch (error) {
                console.error("Error al guardar la receta (subida de imagen falló):", error);
                alert(`Error al guardar: ${error.message}`);
            } finally {
                // Reactivar el botón
                submitButton.disabled = false;
                submitButton.textContent = "Guardar Receta";
            }
        });

        // --- (Resto de formularios sin cambios) ---
        inventoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('inv-id').value;
            const formData = {
                name: document.getElementById('inv-name').value,
                image: document.getElementById('inv-image').value || DEFAULT_PLACEHOLDER,
                price: parseFloat(document.getElementById('inv-price').value) || 0,
                priceUnit: document.getElementById('inv-unit').value || 'g'
            };
            if (id) {
                appData.inventory = appData.inventory.map(i => i.id === id ? { ...i, ...formData } : i);
            } else {
                formData.id = generateId();
                appData.inventory.push(formData);
            }
            appData.inventory.sort((a, b) => a.name.localeCompare(b.name));
            saveData(); 
            renderInventory(); 
            renderRecipes(); 
            closeModal();
        });
        doughRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('dough-id').value;
            const formData = {
                title: document.getElementById('dough-title').value,
                date: document.getElementById('dough-date').value || getTodayDate(),
                hydration: parseFloat(document.getElementById('calc-hidratacion').value),
                salt: parseFloat(document.getElementById('calc-sal').value),
                yeast: parseFloat(document.getElementById('calc-levadura').value),
                fermentBlock: document.getElementById('dough-block-ferment').value,
                fermentCold: document.getElementById('dough-cold-ferment').value,
                fermentAmbient: document.getElementById('dough-ambient-ferment').value,
                comments: document.getElementById('dough-comments').value
            };
            if (id) {
                appData.doughRecipes = appData.doughRecipes.map(d => d.id === id ? { ...d, ...formData } : d);
            } else {
                formData.id = generateId();
                appData.doughRecipes.push(formData);
            }
            appData.doughRecipes.sort((a, b) => a.title.localeCompare(b.title));
            saveData(); 
            renderDoughRecipesSelect();
            closeModal();
        });
        diaryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('diary-id').value;
            const formData = {
                title: document.getElementById('diary-title').value,
                date: document.getElementById('diary-date').value,
                notes: document.getElementById('diary-notes').value
            };
            if (id) {
                appData.diary = appData.diary.map(d => d.id === id ? { ...d, ...formData } : d);
            } else {
                formData.id = generateId();
                appData.diary.push(formData);
            }
            appData.diary.sort((a, b) => new Date(b.date) - new Date(a.date));
            saveData(); 
            renderDiary();
            closeModal();
        });
        
        // --- Guardar/Actualizar Herramienta ---
        toolForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('tool-id').value;
            const formData = {
                name: document.getElementById('tool-name').value,
                imageUrl: document.getElementById('tool-image-url').value || '',
                checked: false
            };
            if (id) {
                appData.tools = appData.tools.map(t => t.id === id ? { ...t, ...formData } : t);
            } else {
                formData.id = generateId();
                appData.tools.push(formData);
            }
            appData.tools.sort((a, b) => a.name.localeCompare(b.name));
            saveData(); 
            renderTools();
            closeModal();
        });
        
        // --- Guardar/Actualizar Video ---
        videoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('video-id').value;
            const title = document.getElementById('video-title').value.trim();
            const url = document.getElementById('video-url').value.trim();
            
            if (!title || !url) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            // Validar que sea URL de YouTube
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                alert('Por favor ingresa una URL válida de YouTube');
                return;
            }
            
            const formData = {
                title: title,
                url: url
            };
            
            if (id) {
                // Editar video existente
                appData.videos = appData.videos.map(v => v.id === id ? { ...v, ...formData } : v);
            } else {
                // Crear nuevo video
                formData.id = generateId();
                appData.videos.push(formData);
            }
            
            saveData();
            renderVideos();
            closeModal();
        });
    }

    // =================================================================
    // --- 5. RENDERIZADO (LEER DATOS) --- (MODIFICADO)
    // =================================================================

    function renderAll() {
        if (!appData.recipes) appData.recipes = [];
        if (!appData.inventory) appData.inventory = [];
        if (!appData.diary) appData.diary = [];
        if (!appData.doughRecipes) appData.doughRecipes = [];
        if (!appData.tools) appData.tools = [];
        if (!appData.videos) appData.videos = [];
        renderRecipes();
        renderInventory();
        renderDiary();
        renderDoughRecipesSelect();
        renderShoppingListBuilder();
        renderTools();
        renderVideos();
    }
    function showPlaceholder(container, message) {
        container.innerHTML = `<div class="placeholder-text">${message}</div>`;
    }
    
    // --- MODIFICADO: RenderRecipes ahora usa la URL de Storage ---
    function renderRecipes() {
        recipeList.innerHTML = '';
        if (!appData.recipes || appData.recipes.length === 0) {
            showPlaceholder(recipeList, 'Aún no tienes recetas de pizza. ¡Añade una!');
            return;
        }
        appData.recipes.forEach(recipe => {
            if (!recipe) return; 
            const card = document.createElement('div');
            card.className = 'card recipe-card';
            
            // ... (lógica de ingredientes no cambia)
            let ingredientsHTML = 'N/A';
            if (Array.isArray(recipe.ingredients)) {
                ingredientsHTML = recipe.ingredients.map(item => {
                    if (!item || !item.inventoryId) return '';
                    const base = appData.inventory.find(i => i.id === item.inventoryId);
                    return `<li data-inventory-id="${item.inventoryId}">
                                <span class="ingredient-name" data-inventory-id="${item.inventoryId}">${escapeHTML(base ? base.name : 'Ingrediente borrado')}</span>: 
                                ${escapeHTML(String(item.quantity))} ${escapeHTML(item.unit)}
                            </li>`;
                }).join('');
            } else if (typeof recipe.ingredients === 'string' && recipe.ingredients) {
                ingredientsHTML = `<p class="text-block" style="opacity: 0.7;">(Antiguo formato) ${escapeHTML(recipe.ingredients.replace(/\n/g, '<br>'))}</p>`;
            }
            
            // --- LÓGICA DE IMAGEN MODIFICADA ---
            // 'recipe.image' ahora es una URL https://... o null/undefined
            const imageSrc = recipe.image ? escapeHTML(recipe.image) : DEFAULT_PLACEHOLDER;
            // --- FIN MODIFICACIÓN ---

            card.innerHTML = `
                <img src="${imageSrc}" alt="${escapeHTML(recipe.title)}" class="card-img">
                <div class="card-content">
                    <h3>${escapeHTML(recipe.title)}</h3>
                    <p>Última modificación: ${escapeHTML(recipe.date)}</p>
                    <strong>Ingredientes:</strong>
                    ${Array.isArray(recipe.ingredients) ? `<ul class="simple-list">${ingredientsHTML || 'N/A'}</ul>` : ingredientsHTML}
                    <br>
                    <strong>Pasos:</strong>
                    <p class="text-block">${escapeHTML(recipe.steps) || 'N/A'}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-light btn-small" data-id="${recipe.id}" data-action="edit-recipe">Editar</button>
                    <button class="btn btn-danger btn-small" data-id="${recipe.id}" data-action="delete-recipe">Borrar</button>
                </div>
            `;
            recipeList.appendChild(card);
        });
    }
    // ... (renderInventory, renderDoughRecipesSelect sin cambios)
    function renderInventory() {
        inventoryList.innerHTML = '';
        if (!appData.inventory || appData.inventory.length === 0) {
            showPlaceholder(inventoryList, 'Tu inventario está vacío. Añade ingredientes base.');
            return;
        }
        appData.inventory.forEach(item => {
            if (!item) return;
            const card = document.createElement('div');
            card.className = 'card ingredient-card';
            card.dataset.inventoryId = item.id;
            card.innerHTML = `
                <img src="${escapeHTML(item.image) || DEFAULT_PLACEHOLDER}" alt="${escapeHTML(item.name)}" class="card-img" data-inventory-id="${item.id}">
                <h4 data-inventory-id="${item.id}">${escapeHTML(item.name)}</h4>
                <div class="card-actions">
                    <button class="btn btn-light btn-small" data-id="${item.id}" data-action="edit-inventory">Editar</button>
                    <button class="btn btn-danger btn-small" data-id="${item.id}" data-action="delete-inventory">Borrar</button>
                </div>
            `;
            inventoryList.appendChild(card);
        });
    }
    function renderDoughRecipesSelect() {
        doughRecipeSelect.innerHTML = '<option value="">-- Seleccionar Receta --</option>'; 
        if (!appData.doughRecipes) return;
        appData.doughRecipes.forEach(recipe => {
            if (!recipe) return;
            const option = document.createElement('option');
            option.value = recipe.id;
            option.textContent = escapeHTML(recipe.title);
            doughRecipeSelect.appendChild(option);
        });
    }
    // --- MODIFICADO: renderShoppingListBuilder ahora usa la URL de Storage ---
    function renderShoppingListBuilder() {
        shoppingListBuilder.innerHTML = '';
        if (!appData.recipes || appData.recipes.length === 0) {
            shoppingListBuilder.innerHTML = '<p class="placeholder-text-small" style="font-size: 0.9em; color: var(--color-text-alt);">Primero crea algunas recetas de pizza.</p>';
            return;
        }
        appData.recipes.forEach(recipe => {
            if (!recipe) return;
            const row = document.createElement('div');
            row.className = 'shopping-recipe-row';
            row.dataset.recipeId = recipe.id;
            row.innerHTML = `
                <img src="${escapeHTML(recipe.image) || DEFAULT_PLACEHOLDER}" alt="" class="shopping-recipe-image" data-recipe-id="${recipe.id}">
                <label for="recipe-qty-${recipe.id}" data-recipe-id="${recipe.id}">${escapeHTML(recipe.title)}</label>
                <input type="number" id="recipe-qty-${recipe.id}" min="0" value="0">
            `;
            shoppingListBuilder.appendChild(row);
        });
        
        // Popular selector de recetas de masa
        const shoppingDoughSelect = document.getElementById('shopping-dough-recipe');
        if (shoppingDoughSelect) {
            shoppingDoughSelect.innerHTML = '<option value="">-- Sin calcular harina (solo toppings) --</option>';
            if (appData.doughRecipes && appData.doughRecipes.length > 0) {
                appData.doughRecipes.forEach(dough => {
                    const option = document.createElement('option');
                    option.value = dough.id;
                    option.textContent = escapeHTML(dough.title);
                    shoppingDoughSelect.appendChild(option);
                });
            }
        }
        
        // Popular selector de harinas del inventario
        const flourIngredientSelect = document.getElementById('shopping-flour-ingredient');
        if (flourIngredientSelect) {
            flourIngredientSelect.innerHTML = '<option value="">-- Sin calcular precio de harina --</option>';
            if (appData.inventory && appData.inventory.length > 0) {
                // Filtrar ingredientes que contengan "harina" en el nombre
                const flourItems = appData.inventory.filter(item => 
                    item.name && item.name.toLowerCase().includes('harina')
                );
                flourItems.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${escapeHTML(item.name)} ($${item.price}/${item.priceUnit})`;
                    flourIngredientSelect.appendChild(option);
                });
            }
        }
    }
    // ... (renderDiary, renderCurrentRecipeIngredients sin cambios)
    function renderDiary() {
        diaryList.innerHTML = '';
        if (!appData.diary || appData.diary.length === 0) {
            showPlaceholder(diaryList, 'No hay entradas en tu diario.');
            return;
        }
        appData.diary.forEach(entry => {
            if (!entry) return;
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-date">${escapeHTML(entry.date)}</div>
                <div class="timeline-content">
                    <div class="timeline-actions">
                        <button class="btn btn-light btn-small" data-id="${entry.id}" data-action="edit-diary">Editar</button>
                        <button class="btn btn-danger btn-small" data-id="${entry.id}" data-action="delete-diary">Borrar</button>
                    </div>
                    <h4>${escapeHTML(entry.title)}</h4>
                    <p>${escapeHTML(entry.notes)}</p>
                </div>
            `;
            diaryList.appendChild(item);
        });
    }
    function renderCurrentRecipeIngredients(ingredients) {
        currentRecipeIngredients.innerHTML = '';
        if (!ingredients || ingredients.length === 0) {
            currentRecipeIngredients.innerHTML = '<li class="placeholder-text-small" style="list-style-type: none; font-size: 0.9em; color: var(--color-text-alt);">Añade ingredientes desde el buscador.</li>';
            return;
        }
        ingredients.forEach(item => {
            const base = appData.inventory.find(i => i.id === item.inventoryId);
            if (!base) return;
            const li = document.createElement('li');
            li.className = 'list-item';
            li.dataset.inventoryId = item.inventoryId;
            li.innerHTML = `
                <span class="list-item-name" data-inventory-id="${item.inventoryId}">${escapeHTML(base.name)}</span>
                <div class="ingredient-quantity-input">
                    <input type="number" value="${escapeHTML(String(item.quantity))}" min="0" step="0.1">
                    <input type="text" value="${escapeHTML(item.unit)}">
                </div>
                <button type="button" class="btn btn-danger btn-small" data-action="delete-recipe-ingredient">&times;</button>
            `;
            currentRecipeIngredients.appendChild(li);
        });
    }
    
    function renderTools() {
        toolsChecklist.innerHTML = '';
        if (!appData.tools || appData.tools.length === 0) {
            showPlaceholder(toolsChecklist, 'No hay herramientas registradas. Añade tu primera herramienta.');
            return;
        }
        appData.tools.forEach(tool => {
            if (!tool) return;
            const card = document.createElement('div');
            card.className = `card tool-card ${tool.checked ? 'tool-checked' : ''}`;
            card.innerHTML = `
                <div class="tool-card-image">
                    <img src="${escapeHTML(tool.imageUrl) || DEFAULT_PLACEHOLDER}" alt="${escapeHTML(tool.name)}">
                </div>
                <div class="tool-card-content">
                    <h4>${escapeHTML(tool.name)}</h4>
                    <div class="tool-checkbox-wrapper">
                        <input type="checkbox" ${tool.checked ? 'checked' : ''} data-id="${tool.id}" data-action="toggle-tool">
                        <label>Disponible</label>
                    </div>
                    <div class="tool-actions">
                        <button class="btn btn-light btn-small" data-id="${tool.id}" data-action="edit-tool">Editar</button>
                        <button class="btn btn-danger btn-small" data-id="${tool.id}" data-action="delete-tool">Borrar</button>
                    </div>
                </div>
            `;
            toolsChecklist.appendChild(card);
        });
    }

    // =================================================================
    // --- 6. GESTIÓN DE EVENTOS (Delegados y UI) --- (Sin cambios)
    // =================================================================
    function setupEventListeners() {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('button[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const id = target.closest('[data-id]')?.dataset.id;

            switch (action) {
                case 'edit-recipe': openRecipeModal(id); break;
                case 'edit-inventory': openInventoryModal(id); break;
                case 'edit-diary': openDiaryModal(id); break;
                case 'edit-dough-recipe':
                    closeModal(); 
                    setTimeout(() => openDoughRecipeModal(id), 350);
                    break;
                case 'delete-recipe':
                    if (confirm('¿Borrar esta receta?')) {
                        // TODO: Borrar imagen de Storage si es necesario
                        appData.recipes = appData.recipes.filter(r => r.id !== id);
                        saveData(); 
                        renderRecipes();
                        renderShoppingListBuilder();
                    }
                    break;
                case 'delete-inventory':
                    if (confirm('¿Borrar este ingrediente base?')) {
                        appData.inventory = appData.inventory.filter(i => i.id !== id);
                        saveData(); 
                        renderInventory();
                        renderRecipes();
                    }
                    break;
                case 'delete-diary':
                    if (confirm('¿Borrar esta entrada?')) {
                        appData.diary = appData.diary.filter(d => d.id !== id);
                        saveData(); 
                        renderDiary();
                    }
                    break;
                case 'delete-tool':
                    if (confirm('¿Borrar esta herramienta?')) {
                        appData.tools = appData.tools.filter(t => t.id !== id);
                        saveData(); 
                        renderTools();
                    }
                    break;
                case 'edit-tool':
                    openToolModal(id);
                    break;
                case 'toggle-tool':
                    const checkbox = e.target;
                    const tool = appData.tools.find(t => t.id === id);
                    if (tool) {
                        tool.checked = checkbox.checked;
                        saveData();
                        renderTools();
                    }
                    break;
                case 'delete-recipe-ingredient':
                    target.closest('li.list-item').remove();
                    if (currentRecipeIngredients.children.length === 0) {
                        currentRecipeIngredients.innerHTML = '<li class="placeholder-text-small" ...>Añade ingredientes...</li>';
                    }
                    break;
            }
        });
        generateShoppingListBtn.addEventListener('click', generateShoppingList);
        printShoppingPdfBtn.addEventListener('click', generateShoppingPDF);
    }
    function loadDoughRecipeToCalculator() {
        const id = doughRecipeSelect.value;
        if (!id) return;
        const recipe = appData.doughRecipes.find(r => r.id === id);
        if (!recipe) return;
        document.getElementById('calc-hidratacion').value = recipe.hydration;
        document.getElementById('calc-sal').value = recipe.salt;
        document.getElementById('calc-levadura').value = recipe.yeast;
    }
    function deleteDoughRecipe() {
        const id = doughRecipeSelect.value;
        if (!id) return;
        if (confirm(`¿Seguro que quieres borrar la receta "${doughRecipeSelect.options[doughRecipeSelect.selectedIndex].text}"?`)) {
            appData.doughRecipes = appData.doughRecipes.filter(r => r.id !== id);
            saveData(); 
            renderDoughRecipesSelect();
        }
    }
    function setupIngredientSearch() {
        ingredientSearch.addEventListener('keyup', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 1) {
                ingredientSearchResults.style.display = 'none';
                return;
            }
            const results = appData.inventory.filter(item => item.name.toLowerCase().includes(query));
            ingredientSearchResults.innerHTML = '';
            
            if (results.length > 0) {
                results.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.dataset.id = item.id;
                    div.innerHTML = `<img src="${escapeHTML(item.image) || DEFAULT_PLACEHOLDER}" alt=""><span>${escapeHTML(item.name)}</span>`;
                    ingredientSearchResults.appendChild(div);
                });
                ingredientSearchResults.style.display = 'block';
            } else {
                ingredientSearchResults.style.display = 'none';
            }
        });
        ingredientSearchResults.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.search-result-item');
            if (!itemEl) return;
            const id = itemEl.dataset.id;
            if (currentRecipeIngredients.querySelector(`li[data-inventory-id="${id}"]`)) {
                ingredientSearch.value = '';
                ingredientSearchResults.style.display = 'none';
                return;
            }
            if (currentRecipeIngredients.querySelector('.placeholder-text-small')) {
                currentRecipeIngredients.innerHTML = '';
            }
            const base = appData.inventory.find(i => i.id === id);
            if (base) {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.dataset.inventoryId = id;
                li.innerHTML = `
                    <span class="list-item-name" data-inventory-id="${id}">${escapeHTML(base.name)}</span>
                    <div class="ingredient-quantity-input">
                        <input type="number" value="100" min="0" step="0.1">
                        <input type="text" value="g">
                    </div>
                    <button type="button" class="btn btn-danger btn-small" data-action="delete-recipe-ingredient">&times;</button>
                `;
                currentRecipeIngredients.appendChild(li);
            }
            ingredientSearch.value = '';
            ingredientSearchResults.style.display = 'none';
        });
    }
    function setupTooltipEvents() {
        let currentTarget = null;
        const shoppingTab = document.getElementById('compras');
        document.body.addEventListener('mouseover', (e) => {
            let target, id, item;
            if (recipeModal.contains(e.target)) {
                target = e.target.closest('[data-inventory-id]');
                if (!target || target === currentTarget) return;
                id = target.dataset.inventoryId;
                item = appData.inventory.find(i => i.id === id);
            } else if (shoppingTab.contains(e.target)) {
                target = e.target.closest('[data-recipe-id]');
                if (!target || target === currentTarget) return;
                id = target.dataset.recipeId;
                item = appData.recipes.find(r => r.id === id);
            } else {
                if (ingredientTooltip.classList.contains('visible')) {
                    hideIngredientTooltip();
                }
                return;
            }
            if (!item) return;
            currentTarget = target;
            ingredientTooltip.innerHTML = `
                <img src="${escapeHTML(item.image) || DEFAULT_PLACEHOLDER}" alt="">
                <span>${escapeHTML(item.name || item.title)}</span>
            `;
            positionTooltip(e);
            ingredientTooltip.classList.add('visible');
        });
        document.body.addEventListener('mouseout', (e) => {
            if (e.target.closest('[data-inventory-id]') || e.target.closest('[data-recipe-id]')) {
                 hideIngredientTooltip();
                 currentTarget = null;
            }
        });
        recipeModal.addEventListener('scroll', () => positionTooltip(null, recipeModal), { passive: true });
        shoppingTab.addEventListener('scroll', () => positionTooltip(null, shoppingTab), { passive: true });
    }
    function positionTooltip(e, container = null) {
        if (!modalContainer.classList.contains('visible') && !container) {
            hideIngredientTooltip();
            return;
        }
        let referenceRect;
        if (container) {
            referenceRect = container.getBoundingClientRect();
        } else {
            referenceRect = recipeModal.style.display === 'block' 
                ? recipeModal.getBoundingClientRect() 
                : document.getElementById('compras').querySelector('.form-container').getBoundingClientRect();
        }
        if (!referenceRect) return;
        const containerRect = modalContainer.classList.contains('visible') 
            ? modalContainer.getBoundingClientRect()
            : document.body.getBoundingClientRect();
        ingredientTooltip.style.left = `${referenceRect.right + 10}px`;
        ingredientTooltip.style.top = `${referenceRect.top + (referenceRect.height / 2)}px`;
        if (referenceRect.right + 10 + 250 > containerRect.width) {
             hideIngredientTooltip();
        } else {
            if (ingredientTooltip.classList.contains('visible')) {
                ingredientTooltip.style.display = 'flex';
            }
        }
    }
    function hideIngredientTooltip() {
        ingredientTooltip.classList.remove('visible');
    }

    // --- NUEVO: Listeners para Herramientas ---
    function setupToolsListeners() {
        if (resetChecklistButton) {
            resetChecklistButton.addEventListener('click', () => {
                if (confirm('¿Restablecer el checklist? Todas las herramientas se marcarán como no disponibles.')) {
                    appData.tools.forEach(tool => tool.checked = false);
                    saveData();
                    renderTools();
                }
            });
        }
    }

    // --- MODIFICADO: setupImageUpload ahora comprime y guarda un Archivo (Blob) ---
    function setupImageUpload() {
        recipeImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { // Límite de 10MB para el original
                alert('La imagen es muy grande (Máx 10MB). Se comprimirá.');
            }

            // Comprimir la imagen antes de guardarla
            compressImage(file, 800, 0.7, (compressedBlob) => {
                currentRecipeImageFile = compressedBlob; // Guardar el Blob (archivo)
                recipeImagePreview.src = URL.createObjectURL(compressedBlob); // Mostrar preview
                recipeRemoveImageBtn.style.display = 'inline-flex';
            });
        });

        recipeRemoveImageBtn.addEventListener('click', () => {
            currentRecipeImageFile = null;
            recipeImageInput.value = '';
            recipeImagePreview.src = DEFAULT_PLACEHOLDER;
            recipeRemoveImageBtn.style.display = 'none';
        });
    }

    /**
     * Comprime un Archivo de imagen.
     * @param {File} file - El archivo original.
     * @param {number} maxWidth - Ancho máximo.
     * @param {number} quality - Calidad (0 a 1).
     * @param {function(Blob)} callback - Función llamada con el Blob comprimido.
     */
    function compressImage(file, maxWidth, quality, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir canvas a Blob
                canvas.toBlob((blob) => {
                    callback(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = () => {
                console.error("No se pudo cargar la imagen para comprimir.");
                alert("Error: El archivo seleccionado no parece ser una imagen válida.");
            };
        };
        reader.onerror = (error) => console.error("Error leyendo archivo:", error);
        reader.readAsDataURL(file); // Leer el archivo para obtener el Base64 temporal
    }

    // =================================================================
    // --- GESTIÓN DE VIDEOS ÚTILES ---
    // =================================================================
    function renderVideos() {
        videosGrid.innerHTML = '';
        if (!appData.videos || appData.videos.length === 0) {
            videosGrid.innerHTML = '<p class="placeholder-text-small" style="grid-column: 1/-1;">No hay videos guardados. Agrega videos útiles de YouTube para tener referencias rápidas.</p>';
            return;
        }
        
        appData.videos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';
            
            // Extraer ID del video de YouTube
            const videoId = extractYouTubeId(video.url);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
            
            card.innerHTML = `
                <div class="video-thumbnail" data-url="${escapeHTML(video.url)}">
                    ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${escapeHTML(video.title)}">` : ''}
                    <div class="video-play-icon">▶</div>
                </div>
                <div class="video-info">
                    <div class="video-title">${escapeHTML(video.title)}</div>
                    <div class="video-actions">
                        <button class="btn btn-danger btn-small" data-video-id="${video.id}">Eliminar</button>
                    </div>
                </div>
            `;
            
            videosGrid.appendChild(card);
        });
    }
    
    function extractYouTubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    function setupVideosListeners() {
        // Event delegation para acciones de videos
        videosGrid.addEventListener('click', (e) => {
            // Abrir video en nueva pestaña
            const thumbnail = e.target.closest('.video-thumbnail');
            if (thumbnail) {
                const url = thumbnail.dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
                return;
            }
            
            // Eliminar video
            const deleteBtn = e.target.closest('[data-video-id]');
            if (deleteBtn) {
                const videoId = deleteBtn.dataset.videoId;
                const video = appData.videos.find(v => v.id === videoId);
                if (video && confirm(`¿Eliminar el video "${video.title}"?`)) {
                    appData.videos = appData.videos.filter(v => v.id !== videoId);
                    saveData();
                    renderVideos();
                }
            }
        });
    }

    // =================================================================
    // --- 7. LÓGICA DE CALCULADORA Y COMPRAS --- (Sin cambios)
    // =================================================================
    function setupCalculator() {
        calculateBtn.addEventListener('click', () => {
            const numPizzas = parseFloat(document.getElementById('calc-pizzas').value) || 0;
            const pesoMasa = parseFloat(document.getElementById('calc-peso').value) || 0;
            const hidratacion = parseFloat(document.getElementById('calc-hidratacion').value) || 0;
            const sal = parseFloat(document.getElementById('calc-sal').value) || 0;
            const levadura = parseFloat(document.getElementById('calc-levadura').value) || 0;
            if (numPizzas === 0 || pesoMasa === 0 || hidratacion === 0) {
                calcResultsContainer.innerHTML = '<h4>Resultados</h4><p style="padding: 1.5rem; color: red;">Por favor, introduce valores válidos.</p>';
                return;
            }
            const pesoTotal = numPizzas * pesoMasa;
            const totalPartes = 100 + hidratacion + sal + levadura;
            const harina = (pesoTotal * 100) / totalPartes;
            const agua = (harina * hidratacion) / 100;
            const salG = (harina * sal) / 100;
            const levaduraG = (harina * levadura) / 100;
            calcResultsContainer.innerHTML = `
                <h4>Resultados para ${numPizzas} pizzas de ${pesoMasa}g:</h4>
                <ul class="item-list">
                    <li class="list-item"><span class="list-item-name">Harina (100%):</span><span class="item-quantity">${harina.toFixed(2)} g</span></li>
                    <li class="list-item"><span class="list-item-name">Agua (${hidratacion}%):</span><span class="item-quantity">${agua.toFixed(2)} g</span></li>
                    <li class="list-item"><span class="list-item-name">Sal (${sal}%):</span><span class="item-quantity">${salG.toFixed(2)} g</span></li>
                    <li class="list-item"><span class="list-item-name">Levadura Fresca (${levadura}%):</span><span class="item-quantity">${levaduraG.toFixed(2)} g</span></li>
                    <li class="list-item" style="background: var(--color-border); color: var(--color-text);">
                        <strong class="list-item-name">Peso Total:</strong>
                        <strong class="item-quantity">${(harina + agua + salG + levaduraG).toFixed(2)} g</strong>
                    </li>
                </ul>
            `;
        });
    }
    function generateShoppingList() {
        const totalIngredients = {};
        let totalPizzas = 0;
        
        // Obtener la receta de masa seleccionada
        const selectedDoughId = document.getElementById('shopping-dough-recipe').value;
        const selectedDough = selectedDoughId ? appData.doughRecipes.find(d => d.id === selectedDoughId) : null;
        
        // Obtener el ingrediente de harina seleccionado
        const selectedFlourId = document.getElementById('shopping-flour-ingredient').value;
        const selectedFlour = selectedFlourId ? appData.inventory.find(i => i.id === selectedFlourId) : null;
        
        shoppingListBuilder.querySelectorAll('.shopping-recipe-row').forEach(row => {
            const recipeId = row.dataset.recipeId;
            const quantity = parseFloat(row.querySelector('input').value) || 0;
            if (quantity === 0) return;
            
            totalPizzas += quantity; // Acumular total de pizzas
            
            const recipe = appData.recipes.find(r => r.id === recipeId);
            if (!recipe || !Array.isArray(recipe.ingredients)) return;
            
            // Procesar ingredientes normales (toppings)
            recipe.ingredients.forEach(item => {
                const baseItem = appData.inventory.find(i => i.id === item.inventoryId);
                if (!baseItem) return;
                if (!totalIngredients[item.inventoryId]) {
                    totalIngredients[item.inventoryId] = { baseItem: baseItem, units: {} };
                }
                const unit = item.unit.toLowerCase();
                if (!totalIngredients[item.inventoryId].units[unit]) {
                    totalIngredients[item.inventoryId].units[unit] = 0;
                }
                totalIngredients[item.inventoryId].units[unit] += item.quantity * quantity;
            });
        });
        
        shoppingListResults.innerHTML = '';
        
        // Variable para acumular costo de harina
        let flourCost = 0;
        
        // NUEVO: Mostrar harina calculada si hay una receta de masa seleccionada
        if (selectedDough && totalPizzas > 0) {
            const pesoMasa = 250; // Peso estándar por pizza
            const hidratacion = selectedDough.hydration || 65;
            const sal = selectedDough.salt || 2.5;
            const levadura = selectedDough.yeast || 0.3;
            
            const pesoTotal = totalPizzas * pesoMasa;
            const totalPartes = 100 + hidratacion + sal + levadura;
            const harina = (pesoTotal * 100) / totalPartes;
            const agua = (harina * hidratacion) / 100;
            const salG = (harina * sal) / 100;
            const levaduraG = (harina * levadura) / 100;
            
            // Encabezado de masa
            const headerLi = document.createElement('li');
            headerLi.className = 'list-item';
            headerLi.style.background = 'rgba(230, 57, 70, 0.15)';
            headerLi.style.borderLeft = '4px solid var(--color-primary)';
            headerLi.innerHTML = `
                <div class="item-details" style="flex-grow: 1;">
                    <strong style="color: var(--color-primary); font-size: 1.1rem;">� MASA: ${escapeHTML(selectedDough.title)}</strong>
                    <span class="item-total-quantity">Para ${totalPizzas} pizza${totalPizzas > 1 ? 's' : ''} de ${pesoMasa}g cada una</span>
                </div>
            `;
            shoppingListResults.appendChild(headerLi);
            
            // Ingredientes de masa
            const ingredientesMasa = [
                { nombre: 'Harina', porcentaje: '100%', cantidad: harina, calcularPrecio: true },
                { nombre: 'Agua', porcentaje: `${hidratacion}%`, cantidad: agua, calcularPrecio: false },
                { nombre: 'Sal', porcentaje: `${sal}%`, cantidad: salG, calcularPrecio: false },
                { nombre: 'Levadura Fresca', porcentaje: `${levadura}%`, cantidad: levaduraG, calcularPrecio: false }
            ];
            
            ingredientesMasa.forEach(ing => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.style.paddingLeft = '2rem';
                
                let precioHTML = `${ing.cantidad.toFixed(0)} g`;
                
                // Calcular precio solo para harina si hay ingrediente seleccionado
                if (ing.calcularPrecio && selectedFlour) {
                    const priceUnit = selectedFlour.priceUnit ? selectedFlour.priceUnit.toLowerCase() : 'g';
                    const flourInBaseUnit = convertUnit(ing.cantidad, 'g', priceUnit);
                    if (flourInBaseUnit !== null) {
                        flourCost = flourInBaseUnit * (selectedFlour.price || 0);
                        precioHTML = `${ing.cantidad.toFixed(0)} g → <strong style="color: var(--color-primary);">$${Math.round(flourCost)}</strong>`;
                    }
                }
                
                li.innerHTML = `
                    <div class="item-details" style="flex-grow: 1;">
                        <span>🌾 ${ing.nombre} (${ing.porcentaje})</span>
                    </div>
                    <span class="item-total-price">${precioHTML}</span>
                `;
                shoppingListResults.appendChild(li);
            });
            
            // Separador
            const separator = document.createElement('li');
            separator.className = 'list-item';
            separator.style.background = 'transparent';
            separator.style.borderTop = '2px solid var(--color-border)';
            separator.style.padding = '0.5rem 0';
            separator.innerHTML = '<strong style="color: var(--color-text-alt); font-size: 0.9rem;">TOPPINGS E INGREDIENTES</strong>';
            shoppingListResults.appendChild(separator);
        }
        
        if (Object.keys(totalIngredients).length === 0 && !selectedDough) {
            shoppingListResults.innerHTML = '<li class="placeholder-text-small" ...>Selecciona la cantidad de pizzas...</li>';
            return;
        }
        
        if (Object.keys(totalIngredients).length === 0 && selectedDough) {
            // Solo hay masa, no toppings - mostrar total con harina
            if (selectedFlour) {
                const totalLi = document.createElement('li');
                totalLi.className = 'list-item';
                totalLi.style.background = 'var(--color-border)';
                totalLi.innerHTML = `
                    <div class="item-details" style="flex-grow: 1;"><strong style="font-size: 1.1rem;">COSTO TOTAL ESTIMADO</strong></div>
                    <strong class="item-total-price" style="font-size: 1.1rem;">$${Math.round(flourCost)}</strong>
                `;
                shoppingListResults.appendChild(totalLi);
            }
            return;
        }
        let grandTotalCost = flourCost; // Iniciar con el costo de la harina
        for (const invId in totalIngredients) {
            const item = totalIngredients[invId];
            const { baseItem, units } = item;
            let totalCost = 0;
            let totalQtyInBaseUnit = 0;
            const priceUnit = baseItem.priceUnit ? baseItem.priceUnit.toLowerCase() : 'g';
            const quantityStrings = [];
            for (const unit in units) {
                const quantity = units[unit];
                quantityStrings.push(`${quantity.toFixed(1)} ${unit}`);
                const convertedQty = convertUnit(quantity, unit, priceUnit);
                if (convertedQty !== null) {
                    totalQtyInBaseUnit += convertedQty;
                }
            }
            totalCost = totalQtyInBaseUnit * (baseItem.price || 0);
            grandTotalCost += totalCost;
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <img src="${escapeHTML(baseItem.image) || DEFAULT_PLACEHOLDER}" alt="" class="item-image">
                <div class="item-details">
                    <span>${escapeHTML(baseItem.name)}</span>
                    <span class="item-total-quantity">${quantityStrings.join(', ')}</span>
                </div>
                <span class="item-total-price">$${Math.round(totalCost)}</span>
            `;
            shoppingListResults.appendChild(li);
        }
        const totalLi = document.createElement('li');
        totalLi.className = 'list-item';
        totalLi.style.background = 'var(--color-border)';
        totalLi.innerHTML = `
            <div class="item-details" style="flex-grow: 1;"><strong style="font-size: 1.1rem;">COSTO TOTAL ESTIMADO</strong></div>
            <strong class="item-total-price" style="font-size: 1.1rem;">$${Math.round(grandTotalCost)}</strong>
        `;
        shoppingListResults.appendChild(totalLi);
    }
    function convertUnit(quantity, fromUnit, toUnit) {
        if (!quantity || !fromUnit || !toUnit) return null;
        const from = fromUnit.toLowerCase();
        const to = toUnit.toLowerCase();
        if (from === to) return quantity;
        const conversions = {
            'g': { 'kg': q => q / 1000 },
            'kg': { 'g': q => q * 1000 },
            'ml': { 'l': q => q / 1000 },
            'l': { 'ml': q => q * 1000 }
        };
        if (conversions[from] && conversions[from][to]) {
            return conversions[from][to](quantity);
        }
        return null;
    }

    // =================================================================
    // --- GENERAR PDF DE LISTA DE COMPRAS ---
    // =================================================================
    function generateShoppingPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración de colores
        const primaryColor = [230, 57, 70];
        const darkBg = [44, 44, 44];
        const lightGray = [240, 240, 240];
        const textColor = [50, 50, 50];
        
        // Encabezado con fondo
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 35, 'F');
        
        // Título
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('LISTA DE COMPRAS', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        const today = new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(today, 105, 25, { align: 'center' });
        
        let yPos = 45;
        
        // Obtener datos de la lista de compras actual
        const selectedDoughId = document.getElementById('shopping-dough-recipe')?.value;
        const selectedFlourId = document.getElementById('shopping-flour-ingredient')?.value;
        
        const selectedDough = selectedDoughId ? appData.doughRecipes.find(d => d.id === selectedDoughId) : null;
        const selectedFlour = selectedFlourId ? appData.inventory.find(i => i.id === selectedFlourId) : null;
        
        // Calcular total de pizzas desde las filas de recetas
        let totalPizzas = 0;
        shoppingListBuilder.querySelectorAll('.shopping-recipe-row').forEach(row => {
            const input = row.querySelector('input[type="number"]');
            totalPizzas += parseInt(input?.value || 0);
        });
        
        doc.setTextColor(...textColor);
        
        // Sección de Masa
        if (selectedDough && totalPizzas > 0) {
            const pesoMasa = 250;
            const hidratacion = selectedDough.hydration || 65;
            const sal = selectedDough.salt || 2.5;
            const levadura = selectedDough.yeast || 0.3;
            
            const pesoTotal = totalPizzas * pesoMasa;
            const totalPartes = 100 + hidratacion + sal + levadura;
            const harina = (pesoTotal * 100) / totalPartes;
            const agua = (harina * hidratacion) / 100;
            const salG = (harina * sal) / 100;
            const levaduraG = (harina * levadura) / 100;
            
            // Título de masa
            doc.setFillColor(...lightGray);
            doc.rect(10, yPos - 5, 190, 10, 'F');
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text(`MASA: ${selectedDough.title}`, 15, yPos);
            
            yPos += 8;
            doc.setFontSize(10);
            doc.setTextColor(...textColor);
            doc.setFont(undefined, 'italic');
            doc.text(`Para ${totalPizzas} pizza${totalPizzas > 1 ? 's' : ''} de ${pesoMasa}g cada una`, 15, yPos);
            
            yPos += 10;
            
            // Ingredientes de masa
            doc.setFont(undefined, 'normal');
            const ingredientesMasa = [
                { nombre: 'Harina', cantidad: `${harina.toFixed(0)} g`, porcentaje: '100%' },
                { nombre: 'Agua', cantidad: `${agua.toFixed(0)} g`, porcentaje: `${hidratacion}%` },
                { nombre: 'Sal', cantidad: `${salG.toFixed(1)} g`, porcentaje: `${sal}%` },
                { nombre: 'Levadura Fresca', cantidad: `${levaduraG.toFixed(1)} g`, porcentaje: `${levadura}%` }
            ];
            
            ingredientesMasa.forEach(ing => {
                doc.text(`  - ${ing.nombre} (${ing.porcentaje})`, 20, yPos);
                doc.text(ing.cantidad, 190, yPos, { align: 'right' });
                yPos += 6;
            });
            
            // Costo de harina si existe
            if (selectedFlour) {
                const priceUnit = selectedFlour.priceUnit ? selectedFlour.priceUnit.toLowerCase() : 'g';
                const flourInBaseUnit = convertUnit(harina, 'g', priceUnit);
                if (flourInBaseUnit !== null) {
                    const flourCost = flourInBaseUnit * (selectedFlour.price || 0);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...primaryColor);
                    doc.text(`Costo harina: $${Math.round(flourCost)}`, 190, yPos, { align: 'right' });
                    yPos += 8;
                }
            }
            
            yPos += 5;
            // Línea separadora
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.5);
            doc.line(10, yPos, 200, yPos);
            yPos += 10;
        }
        
        // Título de toppings
        doc.setFillColor(...lightGray);
        doc.rect(10, yPos - 5, 190, 10, 'F');
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('TOPPINGS E INGREDIENTES', 15, yPos);
        yPos += 10;
        
        // Obtener ingredientes de toppings
        const totalIngredients = {};
        let totalPizzasForDough = 0;
        
        // Recorrer todas las filas de recetas en el shopping builder
        shoppingListBuilder.querySelectorAll('.shopping-recipe-row').forEach(row => {
            const recipeId = row.dataset.recipeId;
            const input = row.querySelector('input[type="number"]');
            const quantity = parseInt(input?.value || 0);
            if (quantity <= 0) return;
            
            totalPizzasForDough += quantity;
            
            const recipe = appData.recipes.find(r => r.id === recipeId);
            if (!recipe || !recipe.ingredients) return;
            
            recipe.ingredients.forEach(ing => {
                if (!totalIngredients[ing.inventoryId]) {
                    const invItem = appData.inventory.find(i => i.id === ing.inventoryId);
                    if (!invItem) return;
                    totalIngredients[ing.inventoryId] = {
                        baseItem: invItem,
                        units: {}
                    };
                }
                const unit = ing.unit || 'g';
                if (!totalIngredients[ing.inventoryId].units[unit]) {
                    totalIngredients[ing.inventoryId].units[unit] = 0;
                }
                totalIngredients[ing.inventoryId].units[unit] += ing.quantity * quantity;
            });
        });
        
        let grandTotalCost = 0;
        
        // Calcular costo de harina si existe
        if (selectedDough && totalPizzasForDough > 0 && selectedFlour) {
            const pesoMasa = 250;
            const hidratacion = selectedDough.hydration || 65;
            const sal = selectedDough.salt || 2.5;
            const levadura = selectedDough.yeast || 0.3;
            const pesoTotal = totalPizzasForDough * pesoMasa;
            const totalPartes = 100 + hidratacion + sal + levadura;
            const harina = (pesoTotal * 100) / totalPartes;
            const priceUnit = selectedFlour.priceUnit ? selectedFlour.priceUnit.toLowerCase() : 'g';
            const flourInBaseUnit = convertUnit(harina, 'g', priceUnit);
            if (flourInBaseUnit !== null) {
                grandTotalCost = flourInBaseUnit * (selectedFlour.price || 0);
            }
        }
        
        // Listar toppings
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        
        for (const invId in totalIngredients) {
            const item = totalIngredients[invId];
            const { baseItem, units } = item;
            let totalCost = 0;
            let totalQtyInBaseUnit = 0;
            const priceUnit = baseItem.priceUnit ? baseItem.priceUnit.toLowerCase() : 'g';
            const quantityStrings = [];
            
            for (const unit in units) {
                const quantity = units[unit];
                quantityStrings.push(`${quantity.toFixed(1)} ${unit}`);
                const convertedQty = convertUnit(quantity, unit, priceUnit);
                if (convertedQty !== null) {
                    totalQtyInBaseUnit += convertedQty;
                }
            }
            
            totalCost = totalQtyInBaseUnit * (baseItem.price || 0);
            grandTotalCost += totalCost;
            
            // Verificar si necesitamos nueva página
            if (yPos > 265) {
                doc.addPage();
                yPos = 20;
            }
            
            // Agregar imagen del ingrediente si existe
            if (baseItem.image && baseItem.image.startsWith('http')) {
                try {
                    doc.addImage(baseItem.image, 'JPEG', 15, yPos - 3, 8, 8, undefined, 'FAST');
                } catch (e) {
                    // Si falla la carga de imagen, continuar sin ella
                    console.warn('No se pudo cargar imagen:', e);
                }
                doc.text(baseItem.name, 26, yPos + 2);
            } else {
                doc.text(`  ${baseItem.name}`, 20, yPos + 2);
            }
            
            doc.text(quantityStrings.join(', '), 120, yPos + 2);
            if (totalCost > 0) {
                doc.text(`$${Math.round(totalCost)}`, 190, yPos + 2, { align: 'right' });
            }
            yPos += 12;
        }
        
        // Total final
        yPos += 5;
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(10, yPos, 200, yPos);
        yPos += 8;
        
        doc.setFillColor(...primaryColor);
        doc.rect(10, yPos - 5, 190, 12, 'F');
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('COSTO TOTAL ESTIMADO', 15, yPos + 3);
        doc.text(`$${Math.round(grandTotalCost)}`, 195, yPos + 3, { align: 'right' });
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont(undefined, 'normal');
            doc.text(
                `Generado con Gestor de Pizzas - Página ${i} de ${pageCount}`,
                105,
                290,
                { align: 'center' }
            );
        }
        
        // Descargar PDF
        doc.save(`Lista_Compras_${getTodayDate()}.pdf`);
    }

    // =================================================================
    // --- 8. IMPORTAR / EXPORTAR JSON --- (MODIFICADO)
    // =================================================================
    function setupDataManagement() {
        exportBtn.addEventListener('click', () => {
            try {
                // Exportar sin Base64 es mucho más seguro y liviano
                const exportData = { ...appData };
                delete exportData.lastModified; 
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pizza_app_backup_${getTodayDate()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                a.remove();
            } catch (error) {
                console.error("Error al exportar JSON:", error);
                alert(`Ocurrió un error al exportar: ${error.message}`);
            }
        });

        importInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (confirm('¿Importar datos? Esto sobrescribirá todos los datos locales actuales.')) {
                        // Limpiar imágenes Base64 de importaciones antiguas
                        if (importedData.recipes && importedData.recipes.length > 0) {
                            importedData.recipes.forEach(r => {
                                if (r.image && r.image.startsWith('data:image/')) {
                                    r.image = null; // Borrar Base64 antiguo
                                }
                            });
                        }

                        appData = { ...defaultData, ...importedData };
                        saveData(); 
                        renderAll(); 
                        importStatus.textContent = 'Datos importados y sincronizados con éxito.';
                        importStatus.style.color = 'green';
                    } else {
                        importStatus.textContent = 'Importación cancelada.';
                        importStatus.style.color = 'orange';
                    }
                } catch (error) {
                    console.error('Error al importar JSON:', error);
                    importStatus.textContent = `Error: ${error.message}`;
                    importStatus.style.color = 'red';
                } finally {
                    importInput.value = '';
                }
            };
            reader.readAsText(file);
        });
    }

    // =================================================================
    // --- 9. Lógica de Autenticación y Sincronización (UI) ---
    // =================================================================

    function setupAuthButtons() {
        const profileToggle = document.getElementById('user-profile-toggle');
        const profileDropdown = document.getElementById('user-profile-dropdown');
        
        // Toggle del dropdown al hacer click en el avatar
        if (profileToggle) {
            profileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            });
        }
        
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            if (profileDropdown && !profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
        
        loginBtn.addEventListener('click', () => {
            if (typeof signInWithGoogle === 'function') {
                signInWithGoogle();
            }
        });
        logoutBtn.addEventListener('click', () => {
            if (typeof signOut === 'function') {
                signOut();
            }
            // Cerrar dropdown al salir
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }
        });
        
        // Botón de cerrar sesión en ajustes
        const logoutSettingsBtn = document.getElementById('logout-settings-btn');
        if (logoutSettingsBtn) {
            logoutSettingsBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                    if (typeof signOut === 'function') {
                        signOut();
                    }
                }
            });
        }
        
        syncNowBtn.addEventListener('click', async () => {
            if (typeof pullFromCloud === 'function') {
                updateSyncStatus('syncing');
                const cloudData = await pullFromCloud();
                if (cloudData) {
                    handleCloudUpdate(cloudData);
                } else {
                    updateSyncStatus(true);
                }
            }
        });
    }

    // =================================================================
    // --- PANEL DE ADMINISTRACIÓN ---
    // =================================================================
    function setupAdminPanel() {
        loadAccessRequests();
        loadAuthorizedUsers();
    }
    
    async function loadAccessRequests() {
        const requestsList = document.getElementById('access-requests-list');
        if (!requestsList) return;
        
        requestsList.innerHTML = '<p style="padding: 1rem;">Cargando solicitudes...</p>';
        
        try {
            // Verificar que Firebase esté disponible
            if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
                throw new Error('Firebase no está disponible');
            }
            
            const db = firebase.firestore();
            
            const snapshot = await db.collection('access_requests')
                .where('status', '==', 'pending')
                .get();
            
            if (snapshot.empty) {
                requestsList.innerHTML = '<p class="placeholder-text-small">No hay solicitudes de acceso pendientes en este momento.</p>';
                return;
            }
            
            requestsList.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '1rem';
                
                // Crear elementos del DOM de forma segura
                const containerDiv = document.createElement('div');
                containerDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem;';
                
                const img = document.createElement('img');
                img.src = data.photoURL || DEFAULT_PLACEHOLDER;
                img.alt = 'Avatar';
                img.style.cssText = 'width: 50px; height: 50px; border-radius: 50%; object-fit: cover;';
                
                const infoDiv = document.createElement('div');
                infoDiv.style.flex = '1';
                infoDiv.innerHTML = `
                    <strong>${escapeHTML(data.displayName)}</strong>
                    <div style="color: var(--color-text-alt); font-size: 0.9rem;">${escapeHTML(data.email)}</div>
                    <div style="color: var(--color-text-alt); font-size: 0.85rem;">Solicitado: ${data.requestedAt ? new Date(data.requestedAt.toDate()).toLocaleDateString() : 'Fecha desconocida'}</div>
                `;
                
                const actionsDiv = document.createElement('div');
                actionsDiv.style.cssText = 'display: flex; gap: 0.5rem;';
                
                const approveBtn = document.createElement('button');
                approveBtn.className = 'btn btn-primary btn-small';
                approveBtn.textContent = 'Aprobar';
                approveBtn.onclick = () => approveUser(doc.id, data.email);
                
                const rejectBtn = document.createElement('button');
                rejectBtn.className = 'btn btn-danger btn-small';
                rejectBtn.textContent = 'Rechazar';
                rejectBtn.onclick = () => rejectUser(doc.id);
                
                actionsDiv.appendChild(approveBtn);
                actionsDiv.appendChild(rejectBtn);
                
                containerDiv.appendChild(img);
                containerDiv.appendChild(infoDiv);
                containerDiv.appendChild(actionsDiv);
                
                card.appendChild(containerDiv);
                requestsList.appendChild(card);
            });
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            console.error('Código de error:', error.code);
            console.error('Mensaje:', error.message);
            
            let errorMsg = 'Error al cargar solicitudes.';
            if (error.code === 'permission-denied') {
                errorMsg = 'Error de permisos: Las reglas de Firestore no permiten leer access_requests. Verifica las reglas en Firebase Console.';
            } else if (error.message) {
                errorMsg = `Error: ${error.message}`;
            }
            
            requestsList.innerHTML = `<p style="color: red; padding: 1rem;">${errorMsg}</p>`;
        }
    }
    
    async function loadAuthorizedUsers() {
        const usersList = document.getElementById('authorized-users-list');
        if (!usersList) return;
        
        usersList.innerHTML = '<p style="padding: 1rem;">Cargando usuarios...</p>';
        
        try {
            // Verificar que Firebase esté disponible
            if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
                throw new Error('Firebase no está disponible');
            }
            
            const db = firebase.firestore();
            
            const snapshot = await db.collection('authorized_users')
                .where('status', '==', 'approved')
                .get();
            
            if (snapshot.empty) {
                usersList.innerHTML = '<p class="placeholder-text-small">Aún no hay usuarios autorizados. Cuando apruebes solicitudes, aparecerán aquí.</p>';
                return;
            }
            
            usersList.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '1rem';
                
                // Crear elementos del DOM de forma segura
                const containerDiv = document.createElement('div');
                containerDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem;';
                
                const img = document.createElement('img');
                img.src = data.photoURL || DEFAULT_PLACEHOLDER;
                img.alt = 'Avatar';
                img.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; object-fit: cover;';
                
                const infoDiv = document.createElement('div');
                infoDiv.style.flex = '1';
                infoDiv.innerHTML = `
                    <strong>${escapeHTML(data.displayName)}</strong>
                    <div style="color: var(--color-text-alt); font-size: 0.9rem;">${escapeHTML(data.email)}</div>
                    <div style="color: var(--color-text-alt); font-size: 0.85rem;">Aprobado: ${data.approvedAt ? new Date(data.approvedAt.toDate()).toLocaleDateString() : 'Fecha desconocida'}</div>
                `;
                
                const revokeBtn = document.createElement('button');
                revokeBtn.className = 'btn btn-danger btn-small';
                revokeBtn.textContent = 'Revocar';
                revokeBtn.onclick = () => revokeAccess(doc.id, data.email);
                
                containerDiv.appendChild(img);
                containerDiv.appendChild(infoDiv);
                containerDiv.appendChild(revokeBtn);
                
                card.appendChild(containerDiv);
                usersList.appendChild(card);
            });
        } catch (error) {
            console.error('Error cargando usuarios autorizados:', error);
            console.error('Código de error:', error.code);
            console.error('Mensaje:', error.message);
            
            let errorMsg = 'Error al cargar usuarios.';
            if (error.code === 'permission-denied') {
                errorMsg = 'Error de permisos: Las reglas de Firestore no permiten leer authorized_users. Verifica las reglas en Firebase Console.';
            } else if (error.message) {
                errorMsg = `Error: ${error.message}`;
            }
            
            usersList.innerHTML = `<p style="color: red; padding: 1rem;">${errorMsg}</p>`;
        }
    }
    
    async function approveUser(uid, email) {
        if (!confirm(`¿Aprobar acceso para ${email}?`)) return;
        
        try {
            const db = window.firestore || firebase.firestore();
            const requestDoc = await db.collection('access_requests').doc(uid).get();
            const requestData = requestDoc.data();
            
            // Crear usuario autorizado
            await db.collection('authorized_users').doc(uid).set({
                email: requestData.email,
                displayName: requestData.displayName,
                photoURL: requestData.photoURL,
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Eliminar solicitud
            await db.collection('access_requests').doc(uid).delete();
            
            alert(`Acceso aprobado para ${email}`);
            loadAccessRequests();
            loadAuthorizedUsers();
        } catch (error) {
            console.error('Error aprobando usuario:', error);
            alert('Error al aprobar usuario: ' + error.message);
        }
    }
    
    async function rejectUser(uid) {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        
        try {
            const db = window.firestore || firebase.firestore();
            await db.collection('access_requests').doc(uid).delete();
            alert('Solicitud rechazada');
            loadAccessRequests();
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            alert('Error al rechazar solicitud: ' + error.message);
        }
    }
    
    async function revokeAccess(uid, email) {
        if (!confirm(`¿Revocar acceso para ${email}? El usuario ya no podrá acceder a la aplicación.`)) return;
        
        try {
            const db = window.firestore || firebase.firestore();
            await db.collection('authorized_users').doc(uid).delete();
            alert(`Acceso revocado para ${email}`);
            loadAuthorizedUsers();
        } catch (error) {
            console.error('Error revocando acceso:', error);
            alert('Error al revocar acceso: ' + error.message);
        }
    }

    // Exponer funciones globalmente para los botones inline
    window.approveUser = approveUser;
    window.rejectUser = rejectUser;
    window.revokeAccess = revokeAccess;

    // =================================================================
    // --- AUTENTICACIÓN ---
    // =================================================================
    async function handleUserLogin(user) {
        // Cargar datos locales ANTES de la sincronización
        loadData();
        // Renderizar la app con los datos locales
        renderAll();
        // Mostrar el perfil de usuario
        userProfileDiv.style.display = 'block';
        userAvatar.src = user.photoURL || DEFAULT_PLACEHOLDER;
        document.getElementById('user-avatar-large').src = user.photoURL || DEFAULT_PLACEHOLDER;
        userEmail.textContent = user.email;
        updateSyncStatus(null); // Limpiar estado
        
        // Mostrar panel de admin si es el administrador
        const isAdmin = await checkIfAdminInApp(user);
        
        console.log("=== VERIFICACIÓN DE PANEL ADMIN (app.js) ===");
        console.log("UID:", user.uid);
        console.log("Email:", user.email);
        console.log("¿Es admin?:", isAdmin);
        
        if (isAdmin) {
            const adminPanel = document.getElementById('admin-panel');
            console.log("Panel de admin encontrado:", !!adminPanel);
            if (adminPanel) {
                adminPanel.style.display = 'block';
                setupAdminPanel();
                console.log("✅ Panel de administración activado");
            }
        } else {
            console.log("❌ Usuario NO es administrador - panel oculto");
        }
    }
    
    /**
     * Verifica si el usuario actual es admin (copia de la función en firebase-sync.js)
     */
    async function checkIfAdminInApp(user) {
        if (!user || !user.uid) return false;
        
        try {
            const db = firebase.firestore();
            const adminDoc = await db.collection('admins').doc(user.uid).get();
            if (adminDoc.exists && adminDoc.data().isAdmin === true) {
                return true;
            }
            
            // Fallback por email
            const ADMIN_EMAIL = "isilber31@gmail.com";
            const userEmail = (user.email || '').toLowerCase().trim();
            const adminEmail = ADMIN_EMAIL.toLowerCase().trim();
            return userEmail === adminEmail;
            
        } catch (error) {
            console.error("Error verificando admin en app.js:", error);
            // Fallback en caso de error
            const ADMIN_EMAIL = "isilber31@gmail.com";
            const userEmail = (user.email || '').toLowerCase().trim();
            const adminEmail = ADMIN_EMAIL.toLowerCase().trim();
            return userEmail === adminEmail;
        }
    }

    function handleUserLogout() {
        // Ocultar perfil
        userProfileDiv.style.display = 'none';
        userAvatar.src = '';
        userEmail.textContent = '';
        // Limpiar datos locales
        localStorage.removeItem(APP_STORAGE_KEY);
        appData = { ...defaultData };
        renderAll(); // Renderizará placeholders vacíos (porque la app está oculta)
    }

    function updateSyncStatus(status) {
        syncNowBtn.classList.remove('syncing', 'synced', 'error');
        if (status === 'syncing') {
            syncNowBtn.classList.add('syncing');
        } else if (status === true) {
            syncNowBtn.classList.add('synced');
        } else if (status === false) {
            syncNowBtn.classList.add('error');
        }
    }

    // =================================================================
    // --- PERSONALIZACIÓN DE COLORES ---
    // =================================================================
    
    const colorPresets = {
        default: { primary: '#e63946', secondary: '#f1faee', accent: '#457b9d' },
        blue: { primary: '#2196F3', secondary: '#E3F2FD', accent: '#1976D2' },
        green: { primary: '#4CAF50', secondary: '#E8F5E9', accent: '#388E3C' },
        purple: { primary: '#9C27B0', secondary: '#F3E5F5', accent: '#7B1FA2' },
        orange: { primary: '#FF9800', secondary: '#FFF3E0', accent: '#F57C00' },
        teal: { primary: '#009688', secondary: '#E0F2F1', accent: '#00796B' }
    };
    
    function setupColorCustomization() {
        const presetButtons = document.querySelectorAll('.preset-btn');
        const primaryPicker = document.getElementById('primary-color-picker');
        const secondaryPicker = document.getElementById('secondary-color-picker');
        const accentPicker = document.getElementById('accent-color-picker');
        const primaryValue = document.getElementById('primary-color-value');
        const secondaryValue = document.getElementById('secondary-color-value');
        const accentValue = document.getElementById('accent-color-value');
        const applyBtn = document.getElementById('apply-custom-colors-btn');
        const resetBtn = document.getElementById('reset-colors-btn');
        
        // Cargar colores guardados
        loadSavedColors();
        
        // Paletas predefinidas
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                const colors = colorPresets[preset];
                applyColorScheme(colors.primary, colors.secondary, colors.accent);
                saveColors({ ...colors, preset });
                updateActivePreset(preset);
            });
        });
        
        // Actualizar valores mostrados cuando cambian los pickers
        primaryPicker.addEventListener('input', (e) => {
            primaryValue.textContent = e.target.value;
        });
        secondaryPicker.addEventListener('input', (e) => {
            secondaryValue.textContent = e.target.value;
        });
        accentPicker.addEventListener('input', (e) => {
            accentValue.textContent = e.target.value;
        });
        
        // Aplicar colores personalizados
        applyBtn.addEventListener('click', () => {
            const primary = primaryPicker.value;
            const secondary = secondaryPicker.value;
            const accent = accentPicker.value;
            applyColorScheme(primary, secondary, accent);
            saveColors({ primary, secondary, accent, preset: 'custom' });
            updateActivePreset('custom');
        });
        
        // Resetear a default
        resetBtn.addEventListener('click', () => {
            const colors = colorPresets.default;
            applyColorScheme(colors.primary, colors.secondary, colors.accent);
            primaryPicker.value = colors.primary;
            secondaryPicker.value = colors.secondary;
            accentPicker.value = colors.accent;
            primaryValue.textContent = colors.primary;
            secondaryValue.textContent = colors.secondary;
            accentValue.textContent = colors.accent;
            saveColors({ ...colors, preset: 'default' });
            updateActivePreset('default');
        });
    }
    
    function applyColorScheme(primary, secondary, accent) {
        const root = document.documentElement;
        
        // Aplicar color principal
        root.style.setProperty('--color-primary', primary);
        root.style.setProperty('--color-primary-dark', shadeColor(primary, -20));
        root.style.setProperty('--color-primary-light', shadeColor(primary, 20));
        
        // Aplicar color secundario
        root.style.setProperty('--color-secondary', secondary);
        
        // Aplicar color de acento
        root.style.setProperty('--color-accent', accent);
        
        console.log('Colores aplicados:', { primary, secondary, accent });
    }
    
    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);
        
        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);
        
        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;
        
        const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));
        
        return "#" + RR + GG + BB;
    }
    
    function saveColors(colors) {
        localStorage.setItem('appColors', JSON.stringify(colors));
    }
    
    function loadSavedColors() {
        const saved = localStorage.getItem('appColors');
        if (saved) {
            const colors = JSON.parse(saved);
            applyColorScheme(colors.primary, colors.secondary, colors.accent);
            
            // Actualizar los pickers
            const primaryPicker = document.getElementById('primary-color-picker');
            const secondaryPicker = document.getElementById('secondary-color-picker');
            const accentPicker = document.getElementById('accent-color-picker');
            const primaryValue = document.getElementById('primary-color-value');
            const secondaryValue = document.getElementById('secondary-color-value');
            const accentValue = document.getElementById('accent-color-value');
            
            if (primaryPicker) {
                primaryPicker.value = colors.primary;
                primaryValue.textContent = colors.primary;
            }
            if (secondaryPicker) {
                secondaryPicker.value = colors.secondary;
                secondaryValue.textContent = colors.secondary;
            }
            if (accentPicker) {
                accentPicker.value = colors.accent;
                accentValue.textContent = colors.accent;
            }
            
            updateActivePreset(colors.preset || 'default');
        }
    }
    
    function updateActivePreset(presetName) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.preset === presetName) {
                btn.classList.add('active');
            }
        });
    }

    // --- Ejecutar Inicialización ---
    init();

    // --- Exponer funciones globales para que firebase-sync.js las vea ---
    window.getLocalData = getLocalData;
    window.handleCloudUpdate = handleCloudUpdate;
    window.updateSyncStatus = updateSyncStatus;
    window.loadData = loadData;
    window.renderAll = renderAll;
    window.appData = appData; // Exponer appData globalmente para debugging
    
    // Exponer la función de subida de archivos
    if (typeof uploadFileToStorage === 'function') {
        window.uploadFileToStorage = uploadFileToStorage;
    }

}); // <- Cierre del DOMContentLoaded