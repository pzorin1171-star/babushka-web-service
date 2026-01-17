// Скрипт для проверки и создания фото на сервере
const fs = require('fs').promises;
const path = require('path');

async function setupPhotos() {
    const imagesDir = path.join(__dirname, 'public', 'images');
    
    try {
        // Создаём папку если её нет
        await fs.mkdir(imagesDir, { recursive: true });
        console.log('📁 Папка для фотографий создана:', imagesDir);
        
        // Создаём простые SVG-заглушки для фотографий
        const photos = [
            { name: 'photo1.jpg', title: 'Семейное фото 1' },
            { name: 'photo2.jpg', title: 'Семейное фото 2' },
            { name: 'photo3.jpg', title: 'Семейное фото 3' },
            { name: 'photo4.jpg', title: 'Семейное фото 4' },
            { name: 'babushka-main.jpg', title: 'Наша любимая бабушка' }
        ];
        
        for (const photo of photos) {
            const filePath = path.join(imagesDir, photo.name);
            
            try {
                await fs.access(filePath);
                console.log(`✅ ${photo.name} уже существует`);
            } catch {
                // Создаём SVG-заглушку
                const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f5f5f5"/>
  <rect x="20" y="20" width="360" height="260" fill="#fff" stroke="#e0e0e0" stroke-width="1" rx="10"/>
  <rect x="50" y="60" width="300" height="180" fill="#e3f2fd" stroke="#90caf9" stroke-width="2" rx="5"/>
  <circle cx="200" cy="150" r="40" fill="#ffcdd2" stroke="#f06292" stroke-width="3"/>
  <path d="M 200 110 L 200 190 M 160 150 L 240 150" stroke="#f06292" stroke-width="3" fill="none"/>
  <text x="200" y="250" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
    ${photo.title}
  </text>
  <text x="200" y="270" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">
    Добавьте реальное фото
  </text>
</svg>`;
                
                await fs.writeFile(filePath, svgContent);
                console.log(`✅ Создана заглушка: ${photo.name}`);
            }
        }
        
        console.log('\n🎉 Фотографии готовы!');
        console.log('📁 Файлы созданы в папке: public/images/');
        console.log('\n💡 Чтобы заменить на реальные фото:');
        console.log('1. Загрузите ваши фотографии в папку public/images/');
        console.log('2. Сохраняйте те же имена файлов');
        console.log('3. Сервер автоматически покажет ваши фото');
        
    } catch (error) {
        console.error('❌ Ошибка создания фотографий:', error);
    }
}

// Запускаем при необходимости
if (require.main === module) {
    setupPhotos();
}

module.exports = setupPhotos;
