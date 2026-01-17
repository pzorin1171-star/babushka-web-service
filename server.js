const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Для разрешения запросов с браузера

const app = express();
const PORT = process.env.PORT || 3000;

// Константы для keep-alive
const KEEP_ALIVE_INTERVAL = 60000; // 1 минута
const TEMP_DATA_FILE = path.join(__dirname, 'data', '_keep_alive_temp.json');

// ==================== МИДЛВАРЫ ====================
app.use(cors()); // Разрешаем запросы с вашего сайта
app.use(express.static(path.join(__dirname, 'public'))); // Отдаем статику (ваш HTML, CSS, images)
app.use(express.json()); // Читаем JSON из запросов

// ==================== МАРШРУТЫ API ====================

// 1. Keep-alive эндпоинт (для пинга)
app.get('/api/ping', (req, res) => {
    console.log(`[${new Date().toISOString()}] Получен пинг от клиента`);
    res.json({ 
        success: true, 
        message: 'Сервер активен', 
        timestamp: new Date().toISOString() 
    });
});

// 2. Получить все рецепты
app.get('/api/recipes', async (req, res) => {
    try {
        const data = await readDataFile('recipes.json');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка чтения рецептов' });
    }
});

// 3. Сохранить новый рецепт
app.post('/api/recipes', async (req, res) => {
    try {
        const newRecipe = {
            id: Date.now(),
            date: new Date().toLocaleDateString('ru-RU'),
            ...req.body
        };
        
        const recipes = await readDataFile('recipes.json');
        recipes.push(newRecipe);
        await writeDataFile('recipes.json', recipes);
        
        res.json({ success: true, message: 'Рецепт сохранён!', data: newRecipe });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сохранения рецепта' });
    }
});

// 4. Получить все пожелания
app.get('/api/wishes', async (req, res) => {
    try {
        const data = await readDataFile('wishes.json');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка чтения пожеланий' });
    }
});

// 5. Сохранить новое пожелание
app.post('/api/wishes', async (req, res) => {
    try {
        const newWish = {
            id: Date.now(),
            date: new Date().toLocaleDateString('ru-RU'),
            ...req.body
        };
        
        const wishes = await readDataFile('wishes.json');
        wishes.push(newWish);
        await writeDataFile('wishes.json', wishes);
        
        res.json({ success: true, message: 'Пожелание сохранено!', data: newWish });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сохранения пожелания' });
    }
});

// ==================== ВНУТРЕННИЙ KEEP-ALIVE МЕХАНИЗМ ====================

// Функция для внутреннего самопина сервера
async function serverKeepAlive() {
    try {
        // 1. Создаем временную запись
        const tempData = { 
            timestamp: new Date().toISOString(), 
            note: 'Keep-alive heartbeat' 
        };
        await fs.writeFile(TEMP_DATA_FILE, JSON.stringify(tempData, null, 2));
        console.log(`[${new Date().toLocaleTimeString()}] Keep-alive: запись создана`);

        // 2. Ждем 50 секунд
        await new Promise(resolve => setTimeout(resolve, 50000));

        // 3. Удаляем временную запись
        await fs.unlink(TEMP_DATA_FILE);
        console.log(`[${new Date().toLocaleTimeString()}] Keep-alive: запись удалена`);

        // 4. Также делаем HTTP-запрос к себе (дополнительная активность)
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`http://localhost:${PORT}/api/ping`);
        console.log(`[${new Date().toLocaleTimeString()}] Keep-alive: самопинг, статус ${response.status}`);
        
    } catch (error) {
        console.log('Keep-alive ошибка:', error.message);
    }
}

// Запускаем keep-alive каждую минуту
let keepAliveInterval;
function startKeepAlive() {
    console.log('🔄 Внутренний keep-alive механизм запущен');
    serverKeepAlive(); // Запустить сразу
    keepAliveInterval = setInterval(serverKeepAlive, KEEP_ALIVE_INTERVAL);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        console.log('⏹️ Keep-alive механизм остановлен');
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

async function readDataFile(filename) {
    try {
        const filePath = path.join(__dirname, 'data', filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Если файла нет, возвращаем пустой массив
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeDataFile(filename, data) {
    const dirPath = path.join(__dirname, 'data');
    
    // Создаем папку data, если её нет
    try { await fs.mkdir(dirPath, { recursive: true }); } 
    catch (error) { /* Папка уже существует */ }
    
    const filePath = path.join(dirPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ==================== ЗАПУСК СЕРВЕРА ====================

async function initializeServer() {
    // Создаем начальные файлы данных, если их нет
    try {
        const initialData = { recipes: [], wishes: [] };
        for (const [key, value] of Object.entries(initialData)) {
            const filePath = path.join(__dirname, 'data', `${key}.json`);
            try {
                await fs.access(filePath);
            } catch {
                await writeDataFile(`${key}.json`, value);
                console.log(`Файл ${key}.json создан`);
            }
        }
    } catch (error) {
        console.log('Ошибка инициализации данных:', error);
    }
    
    // Запускаем сервер
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`📁 Статика раздается из папки /public`);
        console.log(`💾 Данные хранятся в папке /data`);
        console.log(`🔗 API доступно по адресу: http://localhost:${PORT}/api/`);
        
        // Запускаем keep-alive механизм
        startKeepAlive();
    });
}

// Обработка корректного завершения
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервера...');
    stopKeepAlive();
    process.exit(0);
});

// Запуск
initializeServer();
