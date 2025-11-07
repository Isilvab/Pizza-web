document.addEventListener('DOMContentLoaded', () => {

    // --- Estado Global y Clave de Almacenamiento ---
    const APP_STORAGE_KEY = 'pizzaAppData';
    const DEFAULT_PLACEHOLDER = 'assets/img/placeholder.svg';
    const defaultData = {
        lastModified: 0, 
        recipes: [],
        inventory: [],
        diary: [],
        doughRecipes: []
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
            setupAuthButtons();
            
            if (typeof initFirebaseSync === 'function') {
                initFirebaseSync(handleUserLogin, handleUserLogout);
            } else {
                console.error("Error: firebase-sync.js no se cargó correctamente.");
                showLoginScreen("Error crítico de la aplicación. Contacte al administrador.");
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
            [recipeForm, inventoryForm, diaryForm, doughRecipeForm].forEach(form => form.reset());
            ['recipe-id', 'inv-id', 'diary-id', 'dough-id', 'ingredient-search', 'recipe-image-input'].forEach(id => {
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

    // =================================================================
    // --- 4. GESTIÓN DE DATOS (CRUD) --- (MODIFICADO)
    // =================================================================

    function loadData() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        if (savedData) {
            appData = { ...defaultData, ...JSON.parse(savedData) };
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
            doughRecipes: parseIfNeeded(cloudData.doughRecipes)
        };
        
        console.log("✅ Datos parseados correctamente:");
        console.log("- Recetas:", appData.recipes.length);
        console.log("- Inventario:", appData.inventory.length);
        console.log("- Diario:", appData.diary.length);
        console.log("- Masas:", appData.doughRecipes.length);
        
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
    }

    // =================================================================
    // --- 5. RENDERIZADO (LEER DATOS) --- (MODIFICADO)
    // =================================================================

    function renderAll() {
        if (!appData.recipes) appData.recipes = [];
        if (!appData.inventory) appData.inventory = [];
        if (!appData.diary) appData.diary = [];
        if (!appData.doughRecipes) appData.doughRecipes = [];
        renderRecipes();
        renderInventory();
        renderDiary();
        renderDoughRecipesSelect();
        renderShoppingListBuilder();
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
                case 'delete-recipe-ingredient':
                    target.closest('li.list-item').remove();
                    if (currentRecipeIngredients.children.length === 0) {
                        currentRecipeIngredients.innerHTML = '<li class="placeholder-text-small" ...>Añade ingredientes...</li>';
                    }
                    break;
            }
        });
        generateShoppingListBtn.addEventListener('click', generateShoppingList);
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
        shoppingListBuilder.querySelectorAll('.shopping-recipe-row').forEach(row => {
            const recipeId = row.dataset.recipeId;
            const quantity = parseFloat(row.querySelector('input').value) || 0;
            if (quantity === 0) return;
            const recipe = appData.recipes.find(r => r.id === recipeId);
            if (!recipe || !Array.isArray(recipe.ingredients)) return;
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
        if (Object.keys(totalIngredients).length === 0) {
            shoppingListResults.innerHTML = '<li class="placeholder-text-small" ...>Selecciona la cantidad de pizzas...</li>';
            return;
        }
        let grandTotalCost = 0;
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
        loginBtn.addEventListener('click', () => {
            if (typeof signInWithGoogle === 'function') {
                signInWithGoogle();
            }
        });
        logoutBtn.addEventListener('click', () => {
            if (typeof signOut === 'function') {
                signOut();
            }
        });
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

    function handleUserLogin(user) {
        // Cargar datos locales ANTES de la sincronización
        loadData();
        // Renderizar la app con los datos locales
        renderAll();
        // Mostrar el perfil de usuario
        userProfileDiv.style.display = 'flex';
        userAvatar.src = user.photoURL || DEFAULT_PLACEHOLDER;
        userEmail.textContent = user.email;
        updateSyncStatus(null); // Limpiar estado
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