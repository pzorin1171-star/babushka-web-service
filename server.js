const express = require('express');
const fs = require('fs').promises;
const fsExtra = require('fs-extra');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use(express.static('public')); // Отдаём статические файлы

// Пути к файлам данных
const DATA_DIR = path.join(__dirname, 'data');
const RECIPES_FILE = path.join(DATA_DIR, 'recipes.json');
const WISHES_FILE = path.join(DATA_DIR, 'wishes.json');

// Инициализация при запуске
async function initializeApp() {
    try {
        // Создаём папку data, если её нет
        await fsExtra.ensureDir(DATA_DIR);
        
        // Создаём файлы с начальными данными, если их нет
        const initialData = {
            recipes: [],
            wishes: []
        };
        
        if (!await fsExtra.pathExists(RECIPES_FILE)) {
            await fs.writeFile(RECIPES_FILE, JSON.stringify(initialData.recipes, null, 2));
            console.log('📁 Создан файл рецептов');
        }
        
        if (!await fsExtra.pathExists(WISHES_FILE)) {
            await fs.writeFile(WISHES_FILE, JSON.stringify(initialData.wishes, null, 2));
            console.log('📁 Создан файл пожеланий');
        }
        
        console.log('✅ Сервер инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
}

// ==================== API ДЛЯ РЕЦЕПТОВ ====================

// Получить все рецепты
app.get('/api/recipes', async (req, res) => {
    try {
        const data = await fs.readFile(RECIPES_FILE, 'utf8');
        const recipes = JSON.parse(data);
        res.json({ 
            success: true, 
            count: recipes.length,
            data: recipes 
        });
    } catch (error) {
        console.error('Ошибка чтения рецептов:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при чтении рецептов' 
        });
    }
});

// Добавить новый рецепт
app.post('/api/recipes', async (req, res) => {
    try {
        const { name, author, ingredients, instructions } = req.body;
        
        // Проверка данных
        if (!name || !author || !ingredients || !instructions) {
            return res.status(400).json({ 
                success: false, 
                error: 'Все поля обязательны' 
            });
        }
        
        // Читаем текущие рецепты
        const data = await fs.readFile(RECIPES_FILE, 'utf8');
        const recipes = JSON.parse(data);
        
        // Создаём новый рецепт
        const newRecipe = {
            id: Date.now(),
            name: name.trim(),
            author: author.trim(),
            ingredients: ingredients.trim(),
            instructions: instructions.trim(),
            date: new Date().toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            createdAt: new Date().toISOString()
        };
        
        // Добавляем в начало массива
        recipes.unshift(newRecipe);
        
        // Сохраняем в файл
        await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Рецепт успешно сохранён на сервере!',
            data: newRecipe,
            totalRecipes: recipes.length
        });
        
    } catch (error) {
        console.error('Ошибка сохранения рецепта:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка при сохранении рецепта' 
        });
    }
});

// Удалить рецепт
app.delete('/api/recipes/:id', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id);
        const data = await fs.readFile(RECIPES_FILE, 'utf8');
        let recipes = JSON.parse(data);
        
        const initialLength = recipes.length;
        recipes = recipes.filter(recipe => recipe.id !== recipeId);
        
        if (recipes.length === initialLength) {
            return res.status(404).json({ 
                success: false, 
                error: 'Рецепт не найден' 
            });
        }
        
        await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Рецепт удалён',
            totalRecipes: recipes.length
        });
        
    } catch (error) {
        console.error('Ошибка удаления рецепта:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка при удалении рецепта' 
        });
    }
});

// ==================== API ДЛЯ ПОЖЕЛАНИЙ ====================

// Получить все пожелания
app.get('/api/wishes', async (req, res) => {
    try {
        const data = await fs.readFile(WISHES_FILE, 'utf8');
        const wishes = JSON.parse(data);
        res.json({ 
            success: true, 
            count: wishes.length,
            data: wishes 
        });
    } catch (error) {
        console.error('Ошибка чтения пожеланий:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при чтении пожеланий' 
        });
    }
});

// Добавить новое пожелание
app.post('/api/wishes', async (req, res) => {
    try {
        const { author, text } = req.body;
        
        if (!author || !text) {
            return res.status(400).json({ 
                success: false, 
                error: 'Все поля обязательны' 
            });
        }
        
        const data = await fs.readFile(WISHES_FILE, 'utf8');
        const wishes = JSON.parse(data);
        
        const newWish = {
            id: Date.now(),
            author: author.trim(),
            text: text.trim(),
            date: new Date().toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            createdAt: new Date().toISOString()
        };
        
        wishes.unshift(newWish);
        await fs.writeFile(WISHES_FILE, JSON.stringify(wishes, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Пожелание успешно отправлено бабушке!',
            data: newWish,
            totalWishes: wishes.length
        });
        
    } catch (error) {
        console.error('Ошибка сохранения пожелания:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка при сохранении пожелания' 
        });
    }
});

// ==================== СИСТЕМА "ПРОБУЖДЕНИЯ" ====================

// Эндпоинт для пинга (чтобы Render не "усыплял" сервис)
app.get('/api/ping', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Сервер активен',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Запуск периодического самопинга
function startSelfPing() {
    const PING_INTERVAL = 5 * 60 * 1000; // 5 минут
    
    setInterval(async () => {
        try {
            const response = await fetch(`http://localhost:${PORT}/api/ping`);
            console.log(`✅ Самопинг: ${new Date().toLocaleTimeString('ru-RU')}`);
        } catch (error) {
            console.log('⚠️  Самопинг не удался (нормально при запуске)');
        }
    }, PING_INTERVAL);
    
    console.log('🔄 Система самопинга запущена');
}

// ==================== СТАТИЧЕСКИЕ ФАЙЛЫ ====================

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запасной маршрут для SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================

async function startServer() {
    await initializeApp();
    
    app.listen(PORT, () => {
        console.log(`
    🚀 Сервер запущен!
    📍 Порт: ${PORT}
    🌐 Локально: http://localhost:${PORT}
    📊 API:
        GET  /api/recipes     - все рецепты
        POST /api/recipes     - добавить рецепт
        GET  /api/wishes      - все пожелания
        POST /api/wishes      - добавить пожелание
        GET  /api/ping        - проверить сервер
        `);
        
        // Запускаем самопинг в продакшене
        if (process.env.NODE_ENV === 'production') {
            startSelfPing();
        }
    });
}

// Обработка ошибок
process.on('unhandledRejection', (error) => {
    console.error('❌ Необработанная ошибка:', error);
});

startServer().catch(console.error);
// ДОБАВЬТЕ ЭТОТ КОД в server.js
const BACKUP_DIR = path.join(__dirname, 'backups');

// Функция создания резервной копии
async function createBackup() {
    try {
        await fsExtra.ensureDir(BACKUP_DIR);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
        
        const recipes = await fs.readFile(RECIPES_FILE, 'utf8');
        const wishes = await fs.readFile(WISHES_FILE, 'utf8');
        
        const backupData = {
            timestamp: new Date().toISOString(),
            recipes: JSON.parse(recipes),
            wishes: JSON.parse(wishes)
        };
        
        await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
        console.log(`✅ Резервная копия создана: ${backupFile}`);
    } catch (error) {
        console.error('Ошибка создания резервной копии:', error);
    }
}

// Создаём резервную копию раз в день
setInterval(createBackup, 24 * 60 * 60 * 1000);

// И при запуске сервера
createBackup();
