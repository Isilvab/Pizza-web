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
        events: [], // <--- COLECCIÓN DE EVENTOS
        equipment: []
    };
    const DEFAULT_EQUIPMENT_PRESETS = [
        { name: 'Pala para pizza', image: DEFAULT_PLACEHOLDER },
        { name: 'Piedra o acero para horno', image: DEFAULT_PLACEHOLDER },
        { name: 'Cortador de pizza', image: DEFAULT_PLACEHOLDER },
        { name: 'Cajones para fermentar', image: DEFAULT_PLACEHOLDER },
        { name: 'Termómetro infrarrojo', image: DEFAULT_PLACEHOLDER }
    ];
    let appData = { ...defaultData };
    let appInitialized = false;

    // --- Variable temporal para el archivo de imagen ---
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

    // --- Selectores (Inventario) ---
    const inventoryList = document.getElementById('inventory-list');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const inventoryModal = document.getElementById('inventory-modal');
    const inventoryForm = document.getElementById('inventory-form');

    // --- Selectores (Calculadora y Recetas de Masa) ---
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

    // --- Selectores (Compras) ---
    const shoppingListBuilder = document.getElementById('shopping-list-builder');
    const generateShoppingListBtn = document.getElementById('generate-shopping-list-btn');
    const shoppingListResults = document.getElementById('shopping-list-results');
    const shoppingPizzaTotal = document.getElementById('shopping-pizza-total'); // <--- NUEVO
    const shoppingDoughSelect = document.getElementById('shopping-dough-select'); // <--- NUEVO
    const shoppingDoughDetails = document.getElementById('shopping-dough-details'); // <--- NUEVO
    const exportShoppingListBtn = document.getElementById('export-shopping-list-btn'); // <--- NUEVO

    // --- Selectores (Diario) ---
    const diaryList = document.getElementById('diary-list');
    const addDiaryEntryBtn = document.getElementById('add-diary-entry-btn');
    const diaryModal = document.getElementById('diary-modal');
    const diaryForm = document.getElementById('diary-form');

    // --- Selectores (Eventos) ---
    const eventList = document.getElementById('event-list');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const eventChecklist = document.getElementById('event-checklist');
    const newChecklistItemInput = document.getElementById('new-checklist-item');
    const addChecklistItemBtn = document.getElementById('add-checklist-item-btn');
    const equipmentSearchInput = document.getElementById('equipment-search');
    const equipmentSearchResults = document.getElementById('equipment-search-results');
    const loadEquipmentPresetsBtn = document.getElementById('load-equipment-presets-btn');

    // --- Selectores (Equipo Predefinido) ---
    const equipmentList = document.getElementById('equipment-list');
    const addEquipmentBtn = document.getElementById('add-equipment-btn');
    const equipmentModal = document.getElementById('equipment-modal');
    const equipmentForm = document.getElementById('equipment-form');
    
    // --- Selectores (Ajustes) ---
    const exportBtn = document.getElementById('export-json-btn');
    const importInput = document.getElementById('import-json-input');
    const importStatus = document.getElementById('import-status');

    // --- Selectores de Autenticación y Sincronización ---
    const loginBtn = document.getElementById('login-btn'); 
    const logoutBtn = document.getElementById('logout-btn');
    const syncNowBtn = document.getElementById('sync-now-btn');
    const userProfileDiv = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const userEmail = document.getElementById('user-email-menu'); // <-- CAMBIADO
    const appContainerMain = document.getElementById('app-container-main');
    const sessionMenu = document.getElementById('session-menu'); // <-- NUEVO
    const syncToggle = document.getElementById('sync-toggle'); // <-- NUEVO
    let syncEnabled = true; // <-- NUEVO


    // --- Utilidades ---
    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const escapeHTML = (str) => str ? String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

    // =================================================================
    // --- 1. INICIALIZACIÓN ---
    // =================================================================
    function init() {
        try {
            const savedTheme = localStorage.getItem('theme') || 'light';
            applyTheme(savedTheme);

            if (typeof initFirebaseSync === 'function') {
                initFirebaseSync(handleUserLogin, handleUserLogout);
            } else {
                console.error("Error: firebase-sync.js no se cargó correctamente.");
                alert("Error crítico de la aplicación. Contacte al administrador.");
            }

        } catch (error) {
            console.error("Error fatal durante la inicialización:", error);
            alert("Error fatal al cargar la app. Ver la consola.");
        }
    }

    function startApp() {
        if (appInitialized) return;
        appInitialized = true;

        // Se mantienen aquí las configuraciones que dependen de que la app esté lista
        setupTabNavigation();
        setupThemeToggle();
        setupDataManagement();
        setupCalculator();
        setupIngredientSearch();
        setupEquipmentSearch();
        setupTooltipEvents();
        setupImageUpload();
        setupShoppingListControls();
        setupEquipmentPresetsControl();
    }

    // =================================================================
    // --- 2. NAVEGACIÓN Y TEMA --- (Sin cambios)
    // =================================================================
    function setupTabNavigation() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
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
        // Ensure the static 'Add Recipe' button has a direct listener.
        if (addRecipeBtn) {
            addRecipeBtn.addEventListener('click', () => {
                // Call openRecipeModal without an ID to open it in 'new' mode.
                openRecipeModal();
            });
        }

        if (addIngredientBtn) addIngredientBtn.addEventListener('click', () => openInventoryModal());
        if (addDiaryEntryBtn) addDiaryEntryBtn.addEventListener('click', () => openDiaryModal());
        if (addEventBtn) addEventBtn.addEventListener('click', () => openEventModal());
        if (addEquipmentBtn) addEquipmentBtn.addEventListener('click', () => openEquipmentModal());
        if (saveDoughRecipeBtn) saveDoughRecipeBtn.addEventListener('click', () => openDoughRecipeModal());
        if (loadDoughRecipeBtn) loadDoughRecipeBtn.addEventListener('click', loadDoughRecipeToCalculator);
        if (viewDoughRecipeBtn) viewDoughRecipeBtn.addEventListener('click', () => {
            const id = doughRecipeSelect.value;
            if (id) openDoughDetailsModal(id);
        });
        if (deleteDoughRecipeBtn) deleteDoughRecipeBtn.addEventListener('click', deleteDoughRecipe);
        
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.type = 'button';
            btn.addEventListener('click', closeModal);
        });
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }
    function openModal(modalElement) {
        if (!modalElement) return;
        allModals.forEach(modal => {
            if (modal !== modalElement) modal.style.display = 'none';
        });
        modalElement.style.display = 'block';
        modalContainer.classList.add('visible');
    }

    function closeModal() {
        modalContainer.classList.remove('visible');
        hideIngredientTooltip(); 
        setTimeout(() => {
            allModals.forEach(modal => modal.style.display = 'none');
            // Añadir eventForm y equipmentForm a la limpieza
            [recipeForm, inventoryForm, diaryForm, doughRecipeForm, eventForm, equipmentForm].forEach(form => form.reset());
            
            // Limpiar IDs y inputs
            ['recipe-id', 'inv-id', 'diary-id', 'dough-id', 'event-id', 'equip-id', 'ingredient-search', 'equipment-search', 'recipe-image-input'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
            
            // Limpiar contenedores dinámicos
            [currentRecipeIngredients, ingredientSearchResults, equipmentSearchResults, doughDetailsContent, eventChecklist].forEach(container => {
                if (container) container.innerHTML = '';
            });

            // LÓGICA DE IMAGEN
            if(recipeImagePreview) recipeImagePreview.src = DEFAULT_PLACEHOLDER;
            if(recipeRemoveImageBtn) recipeRemoveImageBtn.style.display = 'none';
            currentRecipeImageFile = null; 
            
        }, 300);
    }
    
    // --- Apertura de Modales (Recetas, Inventario, Masa, Diario) ---
    function openRecipeModal(recipeId = null) {
        currentRecipeImageFile = null;
        const titleEl = document.getElementById('recipe-title');
        const stepsEl = document.getElementById('recipe-steps');
        const idEl = document.getElementById('recipe-id');

        if (recipeId) {
            const recipe = appData.recipes.find(r => r.id === recipeId);
            if (!recipe) {
                console.warn(`Receta con id ${recipeId} no encontrada.`);
                return;
            }

            document.getElementById('recipe-modal-title').textContent = 'Editar Receta de Pizza';
            if (idEl) idEl.value = recipe.id;
            if (titleEl) titleEl.value = recipe.title ?? '';
            if (stepsEl) stepsEl.value = recipe.steps ?? '';

            const imageUrl = (recipe.image && recipe.image.length) ? recipe.image : DEFAULT_PLACEHOLDER;
            if (recipeImagePreview) {
                recipeImagePreview.src = imageUrl;
                recipeImagePreview.dataset.currentUrl = recipe.image || "";
            }
            if (recipeRemoveImageBtn) recipeRemoveImageBtn.style.display = recipe.image ? 'inline-flex' : 'none';

            renderCurrentRecipeIngredients(Array.isArray(recipe.ingredients) ? recipe.ingredients : []);
        } else {
            // Nuevo
            document.getElementById('recipe-modal-title').textContent = 'Nueva Receta de Pizza';
            if (idEl) idEl.value = '';
            if (titleEl) titleEl.value = '';
            if (stepsEl) stepsEl.value = '';
            if (recipeImagePreview) {
                recipeImagePreview.src = DEFAULT_PLACEHOLDER;
                recipeImagePreview.dataset.currentUrl = "";
            }
            if (recipeRemoveImageBtn) recipeRemoveImageBtn.style.display = 'none';
            renderCurrentRecipeIngredients([]);
        }

        openModal(recipeModal);
    }
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
            <div class="details-header"><p>Receta guardada el: ${escapeHTML(new Date(recipe.date).toLocaleDateString())}</p></div>
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
    
    function openEventModal(eventId = null) {
        renderEventChecklist([]); 
        if (eventId) {
            const event = appData.events.find(e => e.id === eventId);
            if (!event) return;
            document.getElementById('event-modal-title').textContent = 'Editar Evento';
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-date').value = event.date;
            document.getElementById('event-location').value = event.location || '';
            document.getElementById('event-notes').value = event.notes || '';
            renderEventChecklist(Array.isArray(event.checklist) ? event.checklist : []);
        } else {
            document.getElementById('event-modal-title').textContent = 'Nuevo Evento de Pizza';
            const now = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().substring(0, 16);
            document.getElementById('event-date').value = now;
            applyDefaultEquipmentToChecklist();
        }
        openModal(eventModal);
    }

    // --- Apertura de Modales (Equipo Predefinido) ---
    function openEquipmentModal(equipId = null) {
        if (equipId) {
            const item = appData.equipment.find(i => i.id === equipId);
            if (!item) return;
            document.getElementById('equipment-modal-title').textContent = 'Editar Item de Equipo';
            document.getElementById('equip-id').value = item.id;
            document.getElementById('equip-name').value = item.name;
            document.getElementById('equip-image').value = item.image;
        } else {
            document.getElementById('equipment-modal-title').textContent = 'Nuevo Item de Equipo';
        }
        openModal(equipmentModal);
    }


    // =================================================================
    // --- 4. GESTIÓN DE DATOS (CRUD) --- (MODIFICADO)
    // =================================================================

    function loadData() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        if (savedData) {
            try {
                appData = { ...defaultData, ...JSON.parse(savedData) };
                if (!appData.events) appData.events = [];
                if (!appData.equipment) appData.equipment = [];
            } catch (e) {
                console.error("Error al parsear datos antiguos. Iniciando con data por defecto.");
                appData = { ...defaultData };
            }
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
        
        if (typeof pushToCloud === 'function' && currentUser && syncEnabled) {
            updateSyncStatus('syncing');
            pushToCloud(appData); 
        }
    }

    function handleCloudUpdate(cloudData) {
        console.log("Manejando actualización desde la nube.");
        appData = { ...defaultData, ...cloudData };
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appData));
        renderAll();
        updateSyncStatus(true);
    }
    
    function getLocalData() {
        return appData;
    }


    function setupFormHandlers() {
        // --- Guardar/Actualizar Receta de Pizza (CON STORAGE) ---
        recipeForm.addEventListener('submit', async (e) => { 
            e.preventDefault();
            const submitButton = recipeForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = "Guardando...";

            try {
                const id = document.getElementById('recipe-id').value;
                let imageUrl = recipeImagePreview.dataset.currentUrl || null;
                
                if (currentRecipeImageFile && typeof uploadFileToStorage === 'function') {
                    console.log("Subiendo nuevo archivo a Storage...");
                    const fileName = `recipe_${Date.now()}_${generateId()}`;
                    imageUrl = await uploadFileToStorage(currentRecipeImageFile, fileName);
                
                } else if (recipeImagePreview.src.includes(DEFAULT_PLACEHOLDER)) {
                    imageUrl = null; 
                }

                const ingredients = [];
                currentRecipeIngredients.querySelectorAll('li.list-item').forEach(item => {
                    ingredients.push({
                        inventoryId: item.dataset.inventoryId,
                        quantity: parseFloat(item.querySelector('.ingredient-quantity-input input[type="number"]').value) || 0,
                        unit: item.querySelector('.ingredient-quantity-input input[type="text"]').value || 'g'
                    });
                });

                const formData = {
                    title: document.getElementById('recipe-title').value,
                    steps: document.getElementById('recipe-steps').value,
                    date: getTodayDate(),
                    ingredients: ingredients,
                    image: imageUrl // <-- URL de Storage (o null)
                };

                if (id) {
                    appData.recipes = appData.recipes.map(r => r.id === id ? { ...r, ...formData } : r);
                } else {
                    formData.id = generateId();
                    appData.recipes.push(formData);
                }
                
                saveData(); 
                renderAll(); 
                closeModal();

            } catch (error) {
                console.error("Error al guardar la receta (subida de imagen falló):", error);
                alert(`Error al guardar: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Guardar Receta";
            }
        });

        // --- Guardar/Actualizar Inventario --- (sin cambios)
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

        // --- Guardar/Actualizar Receta de Masa --- (sin cambios)
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
        
        // --- Guardar/Actualizar Diario --- (sin cambios)
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

        // --- Guardar/Actualizar Evento ---
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('event-id').value;
            
            // 1. Recolectar la checklist
            const checklist = [];
            eventChecklist.querySelectorAll('li.list-item').forEach(item => {
                if (item.classList.contains('placeholder-text-small')) return; 
                checklist.push({
                    item: item.querySelector('.list-item-name').textContent,
                    checked: item.querySelector('input[type="checkbox"]').checked
                });
            });

            // 2. Crear objeto de datos
            const formData = {
                title: document.getElementById('event-title').value,
                date: document.getElementById('event-date').value,
                location: document.getElementById('event-location').value,
                notes: document.getElementById('event-notes').value,
                checklist: checklist 
            };

            // 3. Guardar en appData
            if (id) {
                appData.events = appData.events.map(ev => ev.id === id ? { ...ev, ...formData } : ev);
            } else {
                formData.id = generateId();
                appData.events.push(formData);
            }
            
            // Ordenar por fecha (el más cercano/futuro primero)
            appData.events.sort((a, b) => new Date(a.date) - new Date(b.date)); 
            
            saveData(); 
            renderEvents(); 
            closeModal();
        });
        
        // --- Guardar/Actualizar Item de Equipo ---
        equipmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('equip-id').value;
            const formData = {
                name: document.getElementById('equip-name').value,
                image: document.getElementById('equip-image').value || DEFAULT_PLACEHOLDER,
            };

            if (id) {
                appData.equipment = appData.equipment.map(item => item.id === id ? { ...item, ...formData } : item);
            } else {
                formData.id = generateId();
                formData.isAutoAdd = false;
                appData.equipment.push(formData);
            }
            
            appData.equipment.sort((a, b) => a.name.localeCompare(b.name));
            saveData();
            renderEquipment(); 
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
        if (!appData.events) appData.events = []; 
        if (!appData.equipment) appData.equipment = []; 
        
        renderRecipes();
        renderInventory();
        renderDiary();
        renderDoughRecipesSelect();
        renderShoppingListBuilder();
        renderEvents(); 
        renderEquipment(); // <--- RENDERIZAR EQUIPO
        updatePizzaTotal(); // <--- ACTUALIZAR TOTAL AL INICIO
    }
    function showPlaceholder(container, message) {
        container.innerHTML = `<div class="placeholder-text">${message}</div>`;
    }
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
            const imageSrc = recipe.image ? escapeHTML(recipe.image) : DEFAULT_PLACEHOLDER;
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
        // Asegurarse de que el selector de COMPRAS también se actualice
        shoppingDoughSelect.innerHTML = '<option value="">-- No Incluir Masa --</option>';
        
        if (!appData.doughRecipes) return;
        appData.doughRecipes.forEach(recipe => {
            if (!recipe) return;
            const option = document.createElement('option');
            option.value = recipe.id;
            option.textContent = escapeHTML(recipe.title);
            doughRecipeSelect.appendChild(option);
            shoppingDoughSelect.appendChild(option.cloneNode(true)); // Clonar para el selector de compras
        });
    }
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

    // --- Renderizado de Eventos ---
    function renderEvents() {
        eventList.innerHTML = '';
        
        if (!appData.events || appData.events.length === 0) {
            showPlaceholder(eventList, 'Aún no tienes eventos planificados. ¡Crea uno para tu próxima pizza party!');
            return;
        }
        
        const now = new Date();
        const futureEvents = appData.events.filter(e => new Date(e.date) >= now);
        const pastEvents = appData.events.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date)); 

        
        const createEventCard = (event, isPast) => {
            const card = document.createElement('div');
            card.className = `card event-card ${isPast ? 'past-event' : ''}`;
            card.dataset.id = event.id;
            
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            const formattedTime = eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

            const totalItems = Array.isArray(event.checklist) ? event.checklist.length : 0;
            const checkedItems = Array.isArray(event.checklist) ? event.checklist.filter(item => item.checked).length : 0;
            const progressText = totalItems > 0 ? `${checkedItems}/${totalItems} elementos listos` : 'Sin checklist';
            const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
            
            const cardHtml = `
                <div class="card-content">
                    <div class="event-details">
                        <div class="event-date-box">
                            <span class="day">${eventDate.getDate()}</span>
                            <span class="month">${eventDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')}</span>
                        </div>
                        <div>
                            <h3>${escapeHTML(event.title)} ${isPast ? ' (Pasado)' : ''}</h3>
                            <p class="event-time-location">📍 ${escapeHTML(event.location) || 'Lugar no especificado'}</p>
                            <p class="event-time-location">⏰ ${formattedTime} del ${formattedDate}</p>
                        </div>
                    </div>
                    ${event.notes ? `<div class="event-notes-preview">
                        <strong>Notas:</strong>
                        <p>${escapeHTML(event.notes).substring(0, 150)}${event.notes.length > 150 ? '...' : ''}</p>
                    </div>` : ''}
                    <div class="event-checklist-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercent}%;"></div>
                        </div>
                        <span class="progress-text">${progressText}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-light btn-small" data-id="${event.id}" data-action="edit-event">Editar</button>
                    <button class="btn btn-danger btn-small" data-id="${event.id}" data-action="delete-event">Borrar</button>
                </div>
            `;
            card.innerHTML = cardHtml;
            return card;
        };
        
        // 1. Renderizar Eventos Futuros
        if (futureEvents.length > 0) {
            const header = document.createElement('h3');
            header.textContent = 'Próximos Eventos';
            header.style.cssText = 'width: 100%; grid-column: 1 / -1; margin-top: 1rem;';
            eventList.appendChild(header);
            futureEvents.forEach(event => eventList.appendChild(createEventCard(event, false)));
        }
        
        // 2. Renderizar Eventos Pasados
        if (pastEvents.length > 0) {
            const header = document.createElement('h3');
            header.textContent = 'Eventos Anteriores';
            header.style.cssText = 'width: 100%; grid-column: 1 / -1; margin-top: 2rem; border-top: 1px solid var(--color-border); padding-top: 1rem;';
            eventList.appendChild(header);
            pastEvents.forEach(event => eventList.appendChild(createEventCard(event, true)));
        }
    }

    // --- Renderizado de Equipo Predefinido ---
    function renderEquipment() {
        equipmentList.innerHTML = '';
        if (!appData.equipment || appData.equipment.length === 0) {
            showPlaceholder(equipmentList, 'Aún no tienes items de equipo predefinidos. Añade uno para tus checklists.');
            return;
        }

        appData.equipment.forEach(item => {
            if (!item) return;
            const card = document.createElement('div');
            card.className = 'card equipment-card';
            card.dataset.id = item.id;
            const defaultFlag = item.isAutoAdd ? '<span class="equipment-default-flag">Se añade automáticamente</span>' : '';

            card.innerHTML = `
                <img src="${escapeHTML(item.image) || DEFAULT_PLACEHOLDER}" alt="${escapeHTML(item.name)}" class="equipment-card-image">
                <span class="equipment-card-name">${escapeHTML(item.name)}</span>
                ${defaultFlag}
                <div class="card-actions">
                    <button class="btn btn-secondary btn-small" data-id="${item.id}" data-action="toggle-equipment-default">
                        ${item.isAutoAdd ? 'Quitar de nuevos eventos' : 'Usar en nuevos eventos'}
                    </button>
                    <button class="btn btn-light btn-small" data-id="${item.id}" data-action="edit-equipment">Editar</button>
                    <button class="btn btn-danger btn-small" data-id="${item.id}" data-action="delete-equipment">Borrar</button>
                </div>
            `;
            equipmentList.appendChild(card);
        });
    }

    function renderCurrentRecipeIngredients(ingredients = []) {
        if (!currentRecipeIngredients) return;
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            currentRecipeIngredients.innerHTML = '<li class="placeholder-text-small" style="list-style-type: none;">Añade ingredientes usando el buscador de arriba.</li>';
            return;
        }

        currentRecipeIngredients.innerHTML = '';
        ingredients.forEach(item => {
            const base = item?.inventoryId ? appData.inventory.find(i => i.id === item.inventoryId) : null;
            const li = document.createElement('li');
            li.className = 'list-item';
            if (item?.inventoryId) li.dataset.inventoryId = item.inventoryId;
            li.innerHTML = `
                <span class="list-item-name"${item?.inventoryId ? ` data-inventory-id="${item.inventoryId}"` : ''}>${escapeHTML(base?.name || item?.name || 'Ingrediente pendiente')}</span>
                <div class="ingredient-quantity-input">
                    <input type="number" value="${item?.quantity ?? 0}" min="0" step="0.1">
                    <input type="text" value="${escapeHTML(item?.unit || 'g')}">
                </div>
                <button type="button" class="btn btn-danger btn-small" data-action="delete-recipe-ingredient">&times;</button>
            `;
            currentRecipeIngredients.appendChild(li);
        });
    }

    // --- Renderizado de Checklist (dentro del modal) ---
    function renderEventChecklist(checklist) {
        eventChecklist.innerHTML = '';
        
        if (!checklist || checklist.length === 0) {
            eventChecklist.innerHTML = '<li class="placeholder-text-small" style="list-style-type: none; font-size: 0.9em; color: var(--color-text-alt);">Añade equipos, ingredientes o elementos a llevar.</li>';
            return;
        }
        
        checklist.sort((a, b) => (a.checked === b.checked) ? 0 : a.checked ? 1 : -1); 

        checklist.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-item';
            if (item.checked) li.classList.add('checked'); 

            li.innerHTML = `
                <label class="checklist-label">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} data-action="toggle-checklist-item">
                    <span class="list-item-name">${escapeHTML(item.item)}</span>
                </label>
                <button type="button" class="btn btn-danger btn-icon-only btn-small" data-action="delete-checklist-item" title="Borrar Item">&times;</button>
            `;
            eventChecklist.appendChild(li);
        });
    }

    function applyDefaultEquipmentToChecklist() {
        if (!Array.isArray(appData.equipment)) return;
        const defaults = appData.equipment.filter(item => item.isAutoAdd);
        defaults.forEach(item => addEquipmentItemToChecklist(item));
    }

    // =================================================================
    // --- 6. GESTIÓN DE EVENTOS (Delegados y UI) --- (MODIFICADO)
    // =================================================================

    function setupEventListeners() {
        // Delegate listener principal para editar/borrar (más robusto: cualquier elemento con data-action)
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const id = target.closest('[data-id]')?.dataset.id;

            switch (action) {
                // Editar Modales
                case 'edit-recipe':
                    // Ensure an ID is found before attempting to open the modal for editing.
                    if (id) {
                        openRecipeModal(id);
                    } else {
                        console.warn('Action "edit-recipe" was triggered, but no "data-id" was found on the element or its parents.');
                    }
                    break;
                case 'edit-inventory': if (id) openInventoryModal(id); break;
                case 'edit-diary': if (id) openDiaryModal(id); break;
                case 'edit-dough-recipe':
                    closeModal();
                    setTimeout(() => { if (id) openDoughRecipeModal(id); }, 350);
                    break;
                case 'edit-event': if (id) openEventModal(id); break;
                case 'edit-equipment': if (id) openEquipmentModal(id); break;

                // Borrar
                case 'delete-recipe':
                    if (!id) return;
                    if (confirm('¿Borrar esta receta?')) {
                        appData.recipes = appData.recipes.filter(r => r.id !== id);
                        saveData();
                        renderAll();
                    }
                    break;
                case 'delete-inventory':
                    if (!id) return;
                    if (confirm('¿Borrar este ingrediente base?')) {
                        appData.inventory = appData.inventory.filter(i => i.id !== id);
                        saveData();
                        renderAll();
                    }
                    break;
                case 'delete-diary':
                    if (!id) return;
                    if (confirm('¿Borrar esta entrada?')) {
                        appData.diary = appData.diary.filter(d => d.id !== id);
                        saveData();
                        renderAll();
                    }
                    break;
                case 'delete-event':
                    if (!id) return;
                    if (confirm('¿Borrar este evento?')) {
                        appData.events = appData.events.filter(e => e.id !== id);
                        saveData();
                        renderAll();
                    }
                    break;
                case 'delete-equipment':
                    if (!id) return;
                    if (confirm('¿Borrar este item de equipo predefinido?')) {
                        appData.equipment = appData.equipment.filter(e => e.id !== id);
                        saveData();
                        renderAll();
                    }
                    break;
                case 'toggle-equipment-default':
                    if (!id) break;
                    {
                        const equipment = appData.equipment.find(item => item.id === id);
                        if (!equipment) break;
                        equipment.isAutoAdd = !equipment.isAutoAdd;
                        saveData();
                        renderEquipment();
                    }
                    break;
                case 'delete-recipe-ingredient':
                    {
                        const li = target.closest('li.list-item');
                        if (li) li.remove();
                        if (currentRecipeIngredients.children.length === 0) {
                            currentRecipeIngredients.innerHTML = '<li class="placeholder-text-small" ...>Añade ingredientes...</li>';
                        }
                    }
                    break;
            }
        });
        
        // --- LÓGICA CHECKLIST DENTRO DEL MODAL DE EVENTO ---
        addChecklistItemBtn.addEventListener('click', () => {
            const itemText = newChecklistItemInput.value.trim();
            if (!itemText) return;

            if (eventChecklist.querySelector('.placeholder-text-small')) {
                eventChecklist.innerHTML = '';
            }

            const existingEquipment = Array.isArray(appData.equipment)
                ? appData.equipment.find(eq => eq.name.toLowerCase() === itemText.toLowerCase())
                : null;
            if (!existingEquipment) {
                if (!Array.isArray(appData.equipment)) appData.equipment = [];
                appData.equipment.push({
                    id: generateId(),
                    name: itemText,
                    image: DEFAULT_PLACEHOLDER,
                    isAutoAdd: false
                });
                appData.equipment.sort((a, b) => a.name.localeCompare(b.name));
                renderEquipment();
                saveData();
            }

            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <label class="checklist-label">
                    <input type="checkbox" data-action="toggle-checklist-item">
                    <span class="list-item-name">${escapeHTML(itemText)}</span>
                </label>
                <button type="button" class="btn btn-danger btn-icon-only btn-small" data-action="delete-checklist-item" title="Borrar Item">&times;</button>
            `;
            eventChecklist.appendChild(li);
            newChecklistItemInput.value = '';
            newChecklistItemInput.focus();
        });
        
        // Delegate listeners para la checklist (Borrar y Marcar)
        eventModal.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const listItem = e.target.closest('li.list-item');
            
            if (action === 'delete-checklist-item' && listItem) {
                listItem.remove();
                if (eventChecklist.children.length === 0) {
                    renderEventChecklist([]);
                }
            }
        });

        eventModal.addEventListener('change', (e) => {
            if (e.target.dataset.action === 'toggle-checklist-item') {
                const listItem = e.target.closest('li.list-item');
                if (listItem) {
                    listItem.classList.toggle('checked', e.target.checked); 
                }
            }
        });
        // --- FIN LÓGICA CHECKLIST ---


        generateShoppingListBtn.addEventListener('click', generateShoppingList);
        exportShoppingListBtn.addEventListener('click', exportShoppingList); // <--- NUEVO
    }
    
    // --- Búsqueda de Equipo Predefinido (para Eventos) ---
    function setupEquipmentSearch() {
        equipmentSearchInput.addEventListener('keyup', () => {
            const query = equipmentSearchInput.value.toLowerCase();
            if (query.length < 1) {
                equipmentSearchResults.style.display = 'none';
                return;
            }

            const results = appData.equipment.filter(item => item.name.toLowerCase().includes(query));
            equipmentSearchResults.innerHTML = '';
            
            if (results.length > 0) {
                results.forEach(item => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'btn btn-light btn-small';
                    button.dataset.id = item.id;
                    button.textContent = escapeHTML(item.name);
                    button.addEventListener('click', () => {
                        addEquipmentItemToChecklist(item);
                        equipmentSearchInput.value = '';
                        equipmentSearchResults.style.display = 'none';
                    });
                    equipmentSearchResults.appendChild(button);
                });
                equipmentSearchResults.style.display = 'flex'; // Usar flex para los botones
                equipmentSearchResults.style.flexWrap = 'wrap';
                equipmentSearchResults.style.gap = '5px';
            } else {
                equipmentSearchResults.style.display = 'none';
            }
        });
    }

    function setupEquipmentPresetsControl() {
        if (!loadEquipmentPresetsBtn) return;
        loadEquipmentPresetsBtn.addEventListener('click', () => {
            if (!Array.isArray(appData.equipment)) appData.equipment = [];
            let added = 0;
            DEFAULT_EQUIPMENT_PRESETS.forEach(preset => {
                const existing = appData.equipment.find(item => item.name.toLowerCase() === preset.name.toLowerCase());
                if (existing) {
                    if (!existing.isAutoAdd) {
                        existing.isAutoAdd = true;
                        added++;
                    }
                    return;
                }
                appData.equipment.push({
                    id: generateId(),
                    name: preset.name,
                    image: preset.image,
                    isAutoAdd: true
                });
                added++;
            });
            if (added === 0) {
                alert('Todos los elementos sugeridos ya están disponibles.');
                return;
            }
            appData.equipment.sort((a, b) => a.name.localeCompare(b.name));
            saveData();
            renderEquipment();
            alert('Se importaron los elementos sugeridos. Puedes editarlos o desactivarlos.');
        });
    }

    // =================================================================
    // --- 7. LÓGICA DE CALCULADORA Y COMPRAS --- (MODIFICADO)
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

    // NUEVO: Función para Exportar la Lista a TXT
    function exportShoppingList() {
        const listItems = shoppingListResults.querySelectorAll('li.list-item:not([style*="background"])');
        const totalCostEl = shoppingListResults.querySelector('li.list-item[style*="background"]');
        const totalPizzas = updatePizzaTotal();
        const doughRecipeName = shoppingDoughSelect.options[shoppingDoughSelect.selectedIndex]?.text || 'No Incluida';
        
        let textContent = `--- LISTA DE COMPRAS PIZZAPP PRO ---\n`;
        textContent += `Fecha de Creación: ${getTodayDate()}\n`;
        textContent += `Total de Pizzas a Preparar: ${totalPizzas}\n`;
        textContent += `Receta de Masa Usada: ${doughRecipeName}\n\n`;
        textContent += `[ INGREDIENTES NECESARIOS ]\n`;
        
        listItems.forEach(li => {
            const name = li.querySelector('.item-details span:first-child').textContent.trim();
            const quantity = li.querySelector('.item-total-quantity').textContent.trim();
            const price = li.querySelector('.item-total-price').textContent.trim();
            textContent += `- ${name}: ${quantity} (Costo: ${price})\n`;
        });
        
        if (totalCostEl) {
            const totalText = totalCostEl.textContent.trim().replace(/\s+/g, ' ').replace('COSTO TOTAL ESTIMADO', 'Costo Total Estimado');
            textContent += `\n${totalText}\n`;
        }
        
        textContent += `\n---------------------------------------\n`;
        
        // Descargar el archivo
        const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista_compras_${getTodayDate()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }
    
    function generateShoppingList() {
        const totalPizzas = updatePizzaTotal();
        const totalIngredients = {}; 
        
        if (totalPizzas === 0) {
            shoppingListResults.innerHTML = '<li class="placeholder-text-small" style="list-style-type: none;">Selecciona la cantidad de pizzas...</li>';
            exportShoppingListBtn.style.display = 'none';
            return;
        }

        // 1. CALCULAR INGREDIENTES DE TOPPINGS Y SALSA
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

        // 2. CALCULAR INGREDIENTES DE MASA
        const doughRecipeId = shoppingDoughSelect.value;
        if (doughRecipeId && totalPizzas > 0) {
            const doughRecipe = appData.doughRecipes.find(r => r.id === doughRecipeId);
            const pesoMasaPorBola = 280; // Asumir 280g por bola estándar
            const pesoTotalMasa = totalPizzas * pesoMasaPorBola;

            if (doughRecipe) {
                const { hydration, salt, yeast } = doughRecipe;
                const totalPartes = 100 + hydration + salt + yeast;
                
                // Cálculo de ingredientes en gramos
                const harina = (pesoTotalMasa * 100) / totalPartes;
                const salG = (harina * salt) / 100;
                const levaduraG = (harina * yeast) / 100;

                // Identificar los ingredientes de la masa por nombre (asumiendo nombres comunes)
                const flourItem = appData.inventory.find(item => item.name.toLowerCase().includes('harina'));
                const saltItem = appData.inventory.find(item => item.name.toLowerCase().includes('sal'));
                const yeastItem = appData.inventory.find(item => item.name.toLowerCase().includes('levadura'));
                
                // Añadir Harina (CRÍTICO)
                if (flourItem) {
                    if (!totalIngredients[flourItem.id]) {
                        totalIngredients[flourItem.id] = { baseItem: flourItem, units: {} };
                    }
                    if (!totalIngredients[flourItem.id].units['g']) totalIngredients[flourItem.id].units['g'] = 0;
                    totalIngredients[flourItem.id].units['g'] += harina;
                }
                
                // Añadir Sal (Si existe y se usa)
                if (saltItem && salG > 0) {
                    if (!totalIngredients[saltItem.id]) {
                        totalIngredients[saltItem.id] = { baseItem: saltItem, units: {} };
                    }
                    if (!totalIngredients[saltItem.id].units['g']) totalIngredients[saltItem.id].units['g'] = 0;
                    totalIngredients[saltItem.id].units['g'] += salG;
                }
                
                // Añadir Levadura (Si existe y se usa)
                if (yeastItem && levaduraG > 0) {
                    if (!totalIngredients[yeastItem.id]) {
                        totalIngredients[yeastItem.id] = { baseItem: yeastItem, units: {} };
                    }
                    if (!totalIngredients[yeastItem.id].units['g']) totalIngredients[yeastItem.id].units['g'] = 0;
                    totalIngredients[yeastItem.id].units['g'] += levaduraG;
                }
                // El agua se omite.
            }
        }


        // 3. RENDERIZAR RESULTADOS
        shoppingListResults.innerHTML = '';
        if (Object.keys(totalIngredients).length === 0) {
            shoppingListResults.innerHTML = '<li class="placeholder-text-small" ...>Selecciona la cantidad de pizzas...</li>';
            exportShoppingListBtn.style.display = 'none';
            return;
        }

        let grandTotalCost = 0;
        for (const invId in totalIngredients) {
            const item = totalIngredients[invId];
            const { baseItem, units } = item;
            let totalCost = 0;
            let totalQtyInBaseUnit = 0;
            const priceUnit = baseItem.priceUnit ? baseItem.priceUnit.toLowerCase() : 'g';
            
            
            // Consolidar y convertir unidades para mostrar
            const consolidated = {};
            for (const unit in units) {
                const quantity = units[unit];
                const convertedQty = convertUnit(quantity, unit, priceUnit);
                if (convertedQty !== null) {
                    totalQtyInBaseUnit += convertedQty;
                }
                // Para mostrar, consolidamos en unidades más grandes si la cantidad lo justifica
                let displayUnit = unit;
                let displayQty = quantity;
                if ((unit === 'g' || unit === 'ml') && quantity >= 1000) {
                     displayUnit = unit === 'g' ? 'kg' : 'l';
                     displayQty = quantity / 1000;
                }
                if (!consolidated[displayUnit]) {
                    consolidated[displayUnit] = 0;
                }
                consolidated[displayUnit] += displayQty;
            }

            // Generar string de cantidades (ej: 1.50 kg + 50 g)
            const quantityStrings = Object.keys(consolidated).map(unit => `${consolidated[unit].toFixed(2)} ${unit}`);
            
            // Calcular costo
            totalCost = totalQtyInBaseUnit * (baseItem.price || 0);
            grandTotalCost += totalCost;

           
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <img src="${escapeHTML(baseItem.image) || DEFAULT_PLACEHOLDER}" alt="" class="item-image">
                <div class="item-details">
                    <span>${escapeHTML(baseItem.name)}</span>
                    <span class="item-total-quantity">${quantityStrings.join(' + ')}</span>
                </div>
                <span class="item-total-price">$${Math.round(totalCost)}</span>
            `;
            shoppingListResults.appendChild(li);
        }

        // Total de Costo
        const totalLi = document.createElement('li');
        totalLi.className = 'list-item';
        totalLi.style.background = 'var(--color-border)';
        totalLi.innerHTML = `
            <div class="item-details" style="flex-grow: 1;"><strong style="font-size: 1.1rem;">COSTO TOTAL ESTIMADO</strong></div>
            <strong class="item-total-price" style="font-size: 1.1rem;">$${Math.round(grandTotalCost)}</strong>
        `;
        shoppingListResults.appendChild(totalLi);
        
        // Mostrar botón de exportar
        exportShoppingListBtn.style.display = 'inline-block';
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
            'l': { 'ml': q => q * 1000 },
            'unidad': {}, // Conversión de unidad a unidad no es posible sin factor
        };
        // Conversión entre masa/volumen a gramos/litros (asumiendo densidad 1 para volumen a masa)
        if (from === 'ml' && to === 'g') return quantity;
        if (from === 'l' && to === 'kg') return quantity;
        
        if (conversions[from] && conversions[from][to]) {
            return conversions[from][to](quantity);
        }
        
        // Si no hay conversión directa, asumimos que son la misma base para el costo (g->kg, u->u, etc.)
        if (to === 'g' && from === 'kg') return quantity * 1000;
        if (to === 'kg' && from === 'g') return quantity / 1000;
        if (to === 'l' && from === 'ml') return quantity / 1000;
        if (to === 'ml' && from === 'l') return quantity * 1000;
        if (to === 'unidad' && from === 'unidad') return quantity;
        
        return null;
    }

    // ... El resto de la app.js (Módulos 8 y 9) continúan sin cambios ...
    // =================================================================
    // --- 8. IMPORTAR / EXPORTAR JSON --- (Sin cambios)
    // =================================================================
    function setupDataManagement() {
        exportBtn.addEventListener('click', () => {
            try {
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

    function setupAllEventListeners() {
        setupModalControls();
        setupFormHandlers();
        setupEventListeners();
        setupAuthButtons();
        setupLoginButton();
    }

    function setupAuthButtons() {
        if (userAvatar) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                sessionMenu.classList.toggle('visible');
            });
        }

        document.addEventListener('click', (e) => {
            if (!sessionMenu.contains(e.target) && !userAvatar.contains(e.target)) {
                sessionMenu.classList.remove('visible');
            }
        });

        if (syncToggle) {
            syncToggle.addEventListener('change', () => {
                syncEnabled = syncToggle.checked;
                console.log(`Sincronización ${syncEnabled ? 'activada' : 'desactivada'}`);
                if (syncEnabled && currentUser) {
                    syncNowBtn.click();
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (typeof signOut === 'function') {
                    signOut();
                }
            });
        }
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', async () => {
                if (typeof pullFromCloud === 'function') {
                    updateSyncStatus('syncing');
                    const cloudData = await pullFromCloud();
                    if (cloudData) {
                        handleCloudUpdate(cloudData);
                    } else {
                        // Si no hay datos en la nube, intentar subir los locales si existen
                        const localData = getLocalData();
                        if (localData && localData.lastModified > 0) {
                            await pushToCloud(localData);
                        }
                        updateSyncStatus(true);
                    }
                }
            });
        }
    }

    function setupLoginButton() {
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (typeof signInWithGoogle === 'function') {
                    signInWithGoogle();
                }
            });
        }
    }

    function handleUserLogin(user) {
        // Esta función ahora es más simple. Solo actualiza la UI del usuario.
        // La carga de datos se gestiona en firebase-sync.js
        startApp();
        if (userProfileDiv) userProfileDiv.style.display = 'block';
        if (userAvatar) userAvatar.src = user.photoURL || DEFAULT_PLACEHOLDER;
        if (userEmail) userEmail.textContent = user.email;
    }

    function handleUserLogout() {
        if (userProfileDiv) userProfileDiv.style.display = 'none';
        if (sessionMenu) sessionMenu.classList.remove('visible');
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (userAvatar) userAvatar.src = '';
        if (userEmail) userEmail.textContent = '';
        if (typeof updateSyncStatus === 'function') updateSyncStatus(null);
    }

    // Inicialización
    setupAllEventListeners(); // <-- MOVIDO: Se configuran todos los listeners al inicio.
    init();
});