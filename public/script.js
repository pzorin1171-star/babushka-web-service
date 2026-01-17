// Базовый URL API (автоматически определяется)
const API_BASE = window.location.origin;

// Элементы DOM
const recipesContainer = document.getElementById('recipesContainer');
const wishesContainer = document.getElementById('wishesContainer');
const recipeForm = document.getElementById('recipeForm');
const wishForm = document.getElementById('wishForm');
const serverStatus = document.getElementById('serverStatus');

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 Подключение к серверу:', API_BASE);
    
    // Проверяем соединение с сервером
    checkServerConnection();
    
    // Загружаем данные
    loadRecipes();
    loadWishes();
    
    // Настраиваем обработчики форм
    setupEventListeners();
    
    // Периодически обновляем данные
    setInterval(loadRecipes, 30000); // Каждые 30 секунд
    setInterval(checkServerConnection, 60000); // Каждую минуту
});

// ==================== РАБОТА С API ====================

// Проверка соединения с сервером
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE}/api/ping`);
        if (response.ok) {
            serverStatus.textContent = '🟢 Сервер онлайн';
            serverStatus.style.color = '#4caf50';
        } else {
            throw new Error('Сервер не отвечает');
        }
    } catch (error) {
        console.warn('Нет связи с сервером:', error.message);
        serverStatus.textContent = '🔴 Сервер офлайн';
        serverStatus.style.color = '#f44336';
        
        // Показываем локальные данные из localStorage
        showLocalDataWarning();
    }
}

// Загрузка рецептов с сервера
async function loadRecipes() {
    try {
        const response = await fetch(`${API_BASE}/api/recipes`);
        const data = await response.json();
        
        if (data.success) {
            renderRecipes(data.data);
        } else {
            throw new Error(data.error || 'Ошибка загрузки рецептов');
        }
    } catch (error) {
        console.error('Ошибка загрузки рецептов:', error);
        showMessage('recipeMessage', '⚠️ Не удалось загрузить рецепты', 'error');
    }
}

// Загрузка пожеланий с сервера
async function loadWishes() {
    try {
        const response = await fetch(`${API_BASE}/api/wishes`);
        const data = await response.json();
        
        if (data.success) {
            renderWishes(data.data);
        } else {
            throw new Error(data.error || 'Ошибка загрузки пожеланий');
        }
    } catch (error) {
        console.error('Ошибка загрузки пожеланий:', error);
        showMessage('wishMessage', '⚠️ Не удалось загрузить пожелания', 'error');
    }
}

// Отправка нового рецепта
async function saveRecipe(recipeData) {
    try {
        const response = await fetch(`${API_BASE}/api/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipeData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('recipeMessage', '✅ ' + data.message, 'success');
            loadRecipes(); // Перезагружаем список
            return true;
        } else {
            throw new Error(data.error || 'Ошибка сохранения');
        }
    } catch (error) {
        console.error('Ошибка сохранения рецепта:', error);
        showMessage('recipeMessage', '❌ ' + error.message, 'error');
        return false;
    }
}

// Отправка нового пожелания
async function saveWish(wishData) {
    try {
        const response = await fetch(`${API_BASE}/api/wishes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wishData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('wishMessage', '✅ ' + data.message, 'success');
            loadWishes(); // Перезагружаем список
            return true;
        } else {
            throw new Error(data.error || 'Ошибка сохранения');
        }
    } catch (error) {
        console.error('Ошибка сохранения пожелания:', error);
        showMessage('wishMessage', '❌ ' + error.message, 'error');
        return false;
    }
}

// ==================== ОТОБРАЖЕНИЕ ДАННЫХ ====================

// Отображение рецептов
function renderRecipes(recipes) {
    if (!recipesContainer) return;
    
    if (recipes.length === 0) {
        recipesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <h3>Пока нет рецептов</h3>
                <p>Будьте первым, кто добавит семейный рецепт!</p>
            </div>
        `;
        return;
    }
    
    recipesContainer.innerHTML = recipes.map(recipe => `
        <div class="recipe-card">
            <h3>${escapeHtml(recipe.name)}</h3>
            <div class="meta">
                <span><i class="fas fa-user"></i> ${escapeHtml(recipe.author)}</span>
                <span><i class="far fa-calendar"></i> ${recipe.date}</span>
            </div>
            <div class="recipe-content">
                <h4><i class="fas fa-shopping-basket"></i> Ингредиенты</h4>
                <p>${formatText(recipe.ingredients)}</p>
                
                <h4><i class="fas fa-list-ol"></i> Приготовление</h4>
                <p>${formatText(recipe.instructions)}</p>
            </div>
        </div>
    `).join('');
}

// Отображение пожеланий
function renderWishes(wishes) {
    if (!wishesContainer) return;
    
    if (wishes.length === 0) {
        wishesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>Пока нет пожеланий</h3>
                <p>Оставьте первое пожелание для бабушки!</p>
            </div>
        `;
        return;
    }
    
    wishesContainer.innerHTML = wishes.map(wish => `
        <div class="wish-card">
            <p class="wish-text">${formatText(wish.text)}</p>
            <div class="meta">
                <span><i class="fas fa-user"></i> ${escapeHtml(wish.author)}</span>
                <span><i class="far fa-calendar"></i> ${wish.date}</span>
            </div>
        </div>
    `).join('');
}

// ==================== ОБРАБОТЧИКИ ФОРМ ====================

function setupEventListeners() {
    // Форма рецепта
    if (recipeForm) {
        recipeForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const recipeData = {
                name: document.getElementById('recipeName').value.trim(),
                author: document.getElementById('recipeAuthor').value.trim(),
                ingredients: document.getElementById('recipeIngredients').value.trim(),
                instructions: document.getElementById('recipeInstructions').value.trim()
            };
            
            // Валидация
            if (!recipeData.name || !recipeData.author || 
                !recipeData.ingredients || !recipeData.instructions) {
                showMessage('recipeMessage', '❌ Заполните все поля', 'error');
                return;
            }
            
            const saved = await saveRecipe(recipeData);
            if (saved) {
                recipeForm.reset();
            }
        });
    }
    
    // Форма пожеланий
    if (wishForm) {
        wishForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const wishData = {
                author: document.getElementById('wishAuthor').value.trim(),
                text: document.getElementById('wishText').value.trim()
            };
            
            if (!wishData.author || !wishData.text) {
                showMessage('wishMessage', '❌ Заполните все поля', 'error');
                return;
            }
            
            const saved = await saveWish(wishData);
            if (saved) {
                wishForm.reset();
            }
        });
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function showMessage(elementId, text, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = text;
    element.className = `message ${type}`;
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatText(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

// Показываем предупреждение при отключённом сервере
function showLocalDataWarning() {
    const warning = document.createElement('div');
    warning.className = 'message error';
    warning.innerHTML = `
        <strong>⚠️ Сервер недоступен</strong>
        <p>Вы видите старые данные. Новые данные не сохранятся на сервере.</p>
    `;
    
    document.querySelector('main').prepend(warning);
    
    // Автоматически скрываем через 10 секунд
    setTimeout(() => {
        warning.remove();
    }, 10000);
}

// Периодический пинг сервера для поддержания активности
function startKeepAlivePing() {
    // Если страница открыта, периодически пингуем сервер
    setInterval(() => {
        fetch(`${API_BASE}/api/ping`).catch(() => {});
    }, 5 * 60 * 1000); // Каждые 5 минут
}

// Запускаем пинг при загрузке
startKeepAlivePing();
