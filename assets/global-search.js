/**
 * Global Search - Búsqueda global en la aplicación
 * Permite buscar recetas, ingredientes, masas, entradas del diario, herramientas, etc.
 */

class GlobalSearch {
    constructor() {
        this.searchInput = document.getElementById('global-search-input');
        this.clearBtn = document.getElementById('clear-search-btn');
        this.resultsDropdown = document.getElementById('search-results-dropdown');
        this.resultsContent = document.getElementById('search-results-content');
        this.searchTimeout = null;
        this.minChars = 2;
        
        this.init();
    }
    
    init() {
        if (!this.searchInput) return;
        
        // Event listeners
        this.searchInput.addEventListener('input', (e) => this.handleInput(e));
        this.searchInput.addEventListener('focus', () => this.handleFocus());
        this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearSearch());
        }
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.global-search-bar')) {
                this.hideResults();
            }
        });
        
        // Atajo de teclado: Ctrl+K o Cmd+K para enfocar búsqueda
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
                this.searchInput.select();
            }
        });
    }
    
    handleInput(e) {
        const query = e.target.value.trim();
        
        // Mostrar/ocultar botón de limpiar
        if (this.clearBtn) {
            this.clearBtn.style.display = query ? 'flex' : 'none';
        }
        
        // Debounce para no buscar en cada tecla
        clearTimeout(this.searchTimeout);
        
        if (query.length < this.minChars) {
            this.hideResults();
            return;
        }
        
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }
    
    handleFocus() {
        const query = this.searchInput.value.trim();
        if (query.length >= this.minChars) {
            this.showResults();
        }
    }
    
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.clearSearch();
            this.searchInput.blur();
        }
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.hideResults();
        if (this.clearBtn) {
            this.clearBtn.style.display = 'none';
        }
    }
    
    performSearch(query) {
        const results = this.searchAll(query);
        this.displayResults(results, query);
    }
    
    searchAll(query) {
        const normalizedQuery = this.normalizeText(query);
        const results = {
            recipes: [],
            ingredients: [],
            doughs: [],
            diary: [],
            tools: []
        };
        
        // Obtener datos de la aplicación
        const appData = this.getAppData();
        
        // Buscar en recetas
        if (appData.recipes && appData.recipes.length > 0) {
            results.recipes = appData.recipes.filter(recipe => {
                const title = this.normalizeText(recipe.title || '');
                const steps = this.normalizeText(recipe.steps || '');
                return title.includes(normalizedQuery) || steps.includes(normalizedQuery);
            }).slice(0, 5); // Máximo 5 resultados por categoría
        }
        
        // Buscar en inventario
        if (appData.inventory && appData.inventory.length > 0) {
            results.ingredients = appData.inventory.filter(item => {
                const name = this.normalizeText(item.name || '');
                return name.includes(normalizedQuery);
            }).slice(0, 5);
        }
        
        // Buscar en masas
        if (appData.doughRecipes && appData.doughRecipes.length > 0) {
            results.doughs = appData.doughRecipes.filter(dough => {
                const title = this.normalizeText(dough.title || '');
                const comments = this.normalizeText(dough.comments || '');
                return title.includes(normalizedQuery) || comments.includes(normalizedQuery);
            }).slice(0, 5);
        }
        
        // Buscar en diario
        if (appData.diaryEntries && appData.diaryEntries.length > 0) {
            results.diary = appData.diaryEntries.filter(entry => {
                const title = this.normalizeText(entry.pizzaName || '');
                const notes = this.normalizeText(entry.notes || '');
                return title.includes(normalizedQuery) || notes.includes(normalizedQuery);
            }).slice(0, 5);
        }
        
        // Buscar en herramientas
        if (appData.tools && appData.tools.length > 0) {
            results.tools = appData.tools.filter(tool => {
                const name = this.normalizeText(tool.name || '');
                return name.includes(normalizedQuery);
            }).slice(0, 5);
        }
        
        return results;
    }
    
    displayResults(results, query) {
        const totalResults = 
            results.recipes.length + 
            results.ingredients.length + 
            results.doughs.length + 
            results.diary.length +
            results.tools.length;
        
        if (totalResults === 0) {
            this.resultsContent.innerHTML = `
                <div class="search-no-results">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <p>No se encontraron resultados para "<strong>${this.escapeHtml(query)}</strong>"</p>
                </div>
            `;
            this.showResults();
            return;
        }
        
        let html = '';
        
        // Recetas
        if (results.recipes.length > 0) {
            html += this.renderResultSection('🍕 Recetas', results.recipes, 'recipe', query);
        }
        
        // Ingredientes
        if (results.ingredients.length > 0) {
            html += this.renderResultSection('🥫 Ingredientes', results.ingredients, 'ingredient', query);
        }
        
        // Masas
        if (results.doughs.length > 0) {
            html += this.renderResultSection('🍞 Recetas de Masa', results.doughs, 'dough', query);
        }
        
        // Diario
        if (results.diary.length > 0) {
            html += this.renderResultSection('📔 Entradas del Diario', results.diary, 'diary', query);
        }
        
        // Herramientas
        if (results.tools.length > 0) {
            html += this.renderResultSection('🔧 Herramientas', results.tools, 'tool', query);
        }
        
        this.resultsContent.innerHTML = html;
        this.showResults();
        this.attachResultListeners();
    }
    
    renderResultSection(title, items, type, query) {
        let html = `
            <div class="search-result-section">
                <div class="search-result-section-title">${title}</div>
                <div class="search-result-items">
        `;
        
        items.forEach(item => {
            html += this.renderResultItem(item, type, query);
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    renderResultItem(item, type, query) {
        let title = '';
        let subtitle = '';
        let imageUrl = '';
        let icon = '';
        
        switch(type) {
            case 'recipe':
                title = item.title || 'Sin título';
                subtitle = item.ingredients ? `${item.ingredients.length} ingredientes` : '';
                imageUrl = item.image || '';
                break;
                
            case 'ingredient':
                title = item.name || 'Sin nombre';
                subtitle = item.price ? `$${item.price} / ${item.unit || 'unidad'}` : '';
                imageUrl = item.image || '';
                break;
                
            case 'dough':
                title = item.title || 'Sin título';
                subtitle = `Hidratación: ${item.hydration}%`;
                icon = '🍞';
                break;
                
            case 'diary':
                title = item.pizzaName || 'Sin título';
                const date = item.date ? new Date(item.date).toLocaleDateString('es-ES') : '';
                subtitle = `${date}${item.ovenType ? ' • ' + item.ovenType : ''}`;
                icon = '📔';
                break;
                
            case 'tool':
                title = item.name || 'Sin nombre';
                subtitle = item.condition || '';
                icon = '🔧';
                break;
        }
        
        const highlightedTitle = this.highlightText(title, query);
        
        return `
            <div class="search-result-item" data-type="${type}" data-id="${item.id}">
                ${imageUrl ? 
                    `<img src="${imageUrl}" alt="${title}" class="search-result-image" onerror="this.style.display='none'">` :
                    (icon ? `<div class="search-result-icon">${icon}</div>` : '')
                }
                <div class="search-result-content">
                    <div class="search-result-title">${highlightedTitle}</div>
                    ${subtitle ? `<div class="search-result-subtitle">${subtitle}</div>` : ''}
                </div>
                <svg class="search-result-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
        `;
    }
    
    attachResultListeners() {
        const items = this.resultsContent.querySelectorAll('.search-result-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.navigateToResult(type, id);
            });
        });
    }
    
    navigateToResult(type, id) {
        this.hideResults();
        this.clearSearch();
        
        // Cambiar a la pestaña correspondiente
        let tabName = '';
        
        switch(type) {
            case 'recipe':
                tabName = 'recetas';
                break;
            case 'ingredient':
                tabName = 'inventario';
                break;
            case 'dough':
                tabName = 'calculadora';
                break;
            case 'diary':
                tabName = 'diario';
                break;
            case 'tool':
                tabName = 'herramientas';
                break;
        }
        
        if (tabName) {
            // Activar la pestaña
            const tab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
            if (tab) {
                tab.click();
            }
            
            // Esperar un momento y resaltar el elemento
            setTimeout(() => {
                this.highlightElement(type, id);
            }, 300);
        }
    }
    
    highlightElement(type, id) {
        let selector = '';
        
        switch(type) {
            case 'recipe':
                selector = `.recipe-card[data-id="${id}"]`;
                break;
            case 'ingredient':
                selector = `.ingredient-card[data-id="${id}"]`;
                break;
            case 'dough':
                // Seleccionar en el dropdown de masas
                const doughSelect = document.getElementById('dough-recipe-select');
                if (doughSelect) {
                    doughSelect.value = id;
                    // Trigger change event
                    doughSelect.dispatchEvent(new Event('change'));
                }
                return;
            case 'diary':
                selector = `.diary-card[data-id="${id}"]`;
                break;
            case 'tool':
                selector = `.tool-card[data-id="${id}"]`;
                break;
        }
        
        if (selector) {
            const element = document.querySelector(selector);
            if (element) {
                // Scroll suave al elemento
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Añadir efecto de resaltado
                element.classList.add('search-highlight');
                setTimeout(() => {
                    element.classList.remove('search-highlight');
                }, 2000);
            }
        }
    }
    
    showResults() {
        if (this.resultsDropdown) {
            this.resultsDropdown.style.display = 'block';
        }
    }
    
    hideResults() {
        if (this.resultsDropdown) {
            this.resultsDropdown.style.display = 'none';
        }
    }
    
    getAppData() {
        // Intentar obtener datos de múltiples formas
        if (window.getLocalData && typeof window.getLocalData === 'function') {
            return window.getLocalData();
        }
        
        if (window.getLocalDataSnapshot && typeof window.getLocalDataSnapshot === 'function') {
            return window.getLocalDataSnapshot();
        }
        
        if (window.appData) {
            return window.appData;
        }
        
        return {
            recipes: [],
            inventory: [],
            doughRecipes: [],
            diaryEntries: [],
            tools: []
        };
    }
    
    normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos
    }
    
    highlightText(text, query) {
        const normalizedText = this.normalizeText(text);
        const normalizedQuery = this.normalizeText(query);
        
        if (!normalizedText.includes(normalizedQuery)) {
            return this.escapeHtml(text);
        }
        
        // Buscar la posición en el texto normalizado
        const startIndex = normalizedText.indexOf(normalizedQuery);
        
        // Aplicar el highlight en el texto original
        const before = text.substring(0, startIndex);
        const match = text.substring(startIndex, startIndex + query.length);
        const after = text.substring(startIndex + query.length);
        
        return `${this.escapeHtml(before)}<mark>${this.escapeHtml(match)}</mark>${this.escapeHtml(after)}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar búsqueda global cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.globalSearch = new GlobalSearch();
    });
} else {
    window.globalSearch = new GlobalSearch();
}
